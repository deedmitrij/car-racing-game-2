
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, GameState, Entity, EntityType } from './types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  ROAD_WIDTH, 
  PLAYER_SIZE, 
  NPC_CAR_SIZE, 
  OBSTACLE_SIZE, 
  BONUS_SIZE,
  INITIAL_LIVES,
  LEVEL_DURATION,
  MAX_LEVELS,
  LEVEL_CONFIGS,
  LEVEL_THEMES,
  RECOVERY_PAUSE_DURATION,
  INVINCIBILITY_DURATION,
  RECOVERY_INVINCIBILITY_DURATION,
  LANES,
  COLORS
} from './constants';
import { soundManager } from './SoundManager';
import HUD from './components/HUD';
import Menu from './components/Menu';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.START,
    playerName: 'DRIVER 01',
    level: 1,
    lives: INITIAL_LIVES,
    timeLeft: LEVEL_DURATION,
    score: 0,
    isInvincible: false,
    invincibilityTime: 0,
    recoveryInvincibilityTime: 0,
    recoveryTime: 0,
  });

  const [entities, setEntities] = useState<Entity[]>([]);
  const [playerPosition, setPlayerPosition] = useState({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 160 });
  const [roadOffset, setRoadOffset] = useState(0);
  const [shake, setShake] = useState(0);
  const [scale, setScale] = useState(1);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastSpawnTime = useRef<number>(0);

  const clearInputs = useCallback(() => {
    keysPressed.current = {};
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Calculate fit while maintaining aspect ratio
      const scaleW = w / CANVAS_WIDTH;
      const scaleH = h / CANVAS_HEIGHT;
      // Use the smaller scale factor but allow it to fill as much as possible
      setScale(Math.min(scaleW, scaleH));
    };

    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    handleResize();
    checkTouch();
    window.addEventListener('resize', handleResize);
    window.addEventListener('blur', clearInputs);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('blur', clearInputs);
    };
  }, [clearInputs]);

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      particlesRef.current.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1.0, color
      });
    }
  };

  const startLevel = async (level: number) => {
    clearInputs();
    await soundManager.init();
    soundManager.startBGM(level);
    setGameState(prev => ({
      ...prev,
      status: GameStatus.PLAYING,
      level,
      timeLeft: LEVEL_DURATION,
      isInvincible: false,
      invincibilityTime: 0,
      recoveryInvincibilityTime: 0,
    }));
    setEntities([]);
    setPlayerPosition({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 160 });
  };

  const restartGame = () => {
    clearInputs();
    soundManager.stopBGM();
    setGameState(prev => ({
      ...prev,
      status: GameStatus.START,
      level: 1,
      lives: INITIAL_LIVES,
      timeLeft: LEVEL_DURATION,
      score: 0,
      isInvincible: false,
      invincibilityTime: 0,
      recoveryInvincibilityTime: 0,
      recoveryTime: 0,
    }));
    setEntities([]);
    particlesRef.current = [];
  };

  const update = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) {
      const deltaTime = (time - lastTimeRef.current) / 1000;

      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= deltaTime * 2;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      if (shake > 0) setShake(prev => Math.max(0, prev - deltaTime * 40));

      if (gameState.status === GameStatus.PLAYING) {
        const config = LEVEL_CONFIGS[gameState.level - 1];
        const theme = LEVEL_THEMES[gameState.level - 1];

        soundManager.setEngineSpeed(config.speed, true);

        setGameState(prev => {
          const nextTime = prev.timeLeft - deltaTime;
          if (nextTime <= 0) {
            soundManager.stopBGM();
            if (prev.level === MAX_LEVELS) {
              soundManager.playWin();
              return { ...prev, status: GameStatus.WIN, timeLeft: 0 };
            } else {
              soundManager.playLevelClear();
              return { ...prev, status: GameStatus.LEVEL_CLEAR, timeLeft: 0 };
            }
          }
          
          let nextInvTime = prev.invincibilityTime - deltaTime;
          let nextRecInvTime = prev.recoveryInvincibilityTime - deltaTime;
          
          return { 
            ...prev, 
            timeLeft: nextTime, 
            invincibilityTime: Math.max(0, nextInvTime),
            isInvincible: nextInvTime > 0,
            recoveryInvincibilityTime: Math.max(0, nextRecInvTime),
            score: prev.score + Math.floor(config.speed * 0.5) 
          };
        });

        const moveSpeed = 8;
        setPlayerPosition(prev => {
          let nx = prev.x;
          let ny = prev.y;
          if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) nx -= moveSpeed;
          if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) nx += moveSpeed;
          if (keysPressed.current['ArrowUp'] || keysPressed.current['w']) ny -= moveSpeed * 0.8;
          if (keysPressed.current['ArrowDown'] || keysPressed.current['s']) ny += moveSpeed * 0.8;

          const roadX = (CANVAS_WIDTH - ROAD_WIDTH) / 2;
          const leftBound = roadX + PLAYER_SIZE.width / 2 + 10;
          const rightBound = roadX + ROAD_WIDTH - PLAYER_SIZE.width / 2 - 10;
          const topBound = PLAYER_SIZE.height / 2 + 20;
          const bottomBound = CANVAS_HEIGHT - PLAYER_SIZE.height / 2 - 20;

          nx = Math.max(leftBound, Math.min(rightBound, nx));
          ny = Math.max(topBound, Math.min(bottomBound, ny));
          return { x: nx, y: ny };
        });

        setRoadOffset(prev => (prev + config.speed) % 80);

        setEntities(prev => {
          let pointsGained = 0;
          const next = prev.map(e => ({ ...e, position: { ...e.position, y: e.position.y + config.speed } }));
          
          const filtered = [];
          for (const e of next) {
            if (e.position.y - e.height / 2 > CANVAS_HEIGHT) {
              if (e.type === EntityType.NPC_CAR || e.type === EntityType.OBSTACLE) {
                pointsGained += 250; 
              }
            } else {
              filtered.push(e);
            }
          }

          if (pointsGained > 0) {
            setGameState(s => ({ ...s, score: s.score + pointsGained }));
          }

          if (time - lastSpawnTime.current > 600) {
            const lane = LANES[Math.floor(Math.random() * LANES.length)];
            const isLaneOccupied = filtered.some(e => Math.abs(e.position.x - lane) < 20 && e.position.y < 200);
            
            if (!isLaneOccupied) {
              const rand = Math.random();
              if (rand < config.trafficDensity) {
                filtered.push({
                  id: Math.random().toString(), type: EntityType.NPC_CAR,
                  position: { x: lane, y: -100 }, width: NPC_CAR_SIZE.width, height: NPC_CAR_SIZE.height,
                  speed: config.speed, color: theme.npc[Math.floor(Math.random() * theme.npc.length)]
                });
                lastSpawnTime.current = time;
              } else if (rand < config.trafficDensity + config.obstacleDensity) {
                filtered.push({
                  id: Math.random().toString(), type: EntityType.OBSTACLE,
                  position: { x: lane, y: -100 }, width: OBSTACLE_SIZE.width, height: OBSTACLE_SIZE.height,
                  speed: config.speed, color: COLORS.OBSTACLE
                });
                lastSpawnTime.current = time;
              } else if (rand < config.trafficDensity + config.obstacleDensity + config.bonusDensity) {
                filtered.push({
                  id: Math.random().toString(), type: EntityType.BONUS,
                  position: { x: lane, y: -100 }, width: BONUS_SIZE.width, height: BONUS_SIZE.height,
                  speed: config.speed, color: COLORS.INVINCIBLE
                });
                lastSpawnTime.current = time;
              }
            }
          }
          return filtered;
        });

        const isHarmable = !gameState.isInvincible && gameState.recoveryInvincibilityTime <= 0;
        
        entities.forEach(entity => {
          const dx = Math.abs(playerPosition.x - entity.position.x);
          const dy = Math.abs(playerPosition.y - entity.position.y);
          if (dx < (PLAYER_SIZE.width + entity.width) / 2 - 12 && dy < (PLAYER_SIZE.height + entity.height) / 2 - 12) {
            if (entity.type === EntityType.BONUS) {
              soundManager.playStar();
              createParticles(entity.position.x, entity.position.y, COLORS.INVINCIBLE, 20);
              setGameState(prev => ({ 
                ...prev, 
                isInvincible: true, 
                invincibilityTime: INVINCIBILITY_DURATION,
                score: prev.score + 1000 
              }));
              setEntities(prev => prev.filter(e => e.id !== entity.id));
            } else if (isHarmable) {
              soundManager.playCrash();
              setShake(20);
              createParticles(playerPosition.x, playerPosition.y, '#ff4444', 30);
              setGameState(prev => {
                const newLives = prev.lives - 1;
                const isGameOver = newLives <= 0;
                if (isGameOver) {
                  soundManager.stopBGM();
                  soundManager.playGameOver();
                }
                return { 
                  ...prev, 
                  status: isGameOver ? GameStatus.GAME_OVER : GameStatus.COLLISION_PAUSE, 
                  lives: Math.max(0, newLives),
                  score: Math.max(0, prev.score - 500),
                  recoveryTime: RECOVERY_PAUSE_DURATION,
                  recoveryInvincibilityTime: RECOVERY_INVINCIBILITY_DURATION
                };
              });
            }
          }
        });
      } else if (gameState.status === GameStatus.COLLISION_PAUSE) {
        soundManager.setEngineSpeed(0, false);
        setGameState(prev => {
          const nextRec = prev.recoveryTime - deltaTime;
          let nextRecInvTime = prev.recoveryInvincibilityTime - deltaTime;
          return { 
            ...prev, 
            recoveryTime: Math.max(0, nextRec),
            recoveryInvincibilityTime: Math.max(0, nextRecInvTime),
            status: nextRec <= 0 ? GameStatus.PLAYING : prev.status 
          };
        });
      } else {
        soundManager.setEngineSpeed(0, false);
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(update);
  }, [gameState, entities, playerPosition, shake, clearInputs]);

  useEffect(() => {
    const onKD = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const onKU = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);
    
    requestRef.current = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
      cancelAnimationFrame(requestRef.current!);
    };
  }, [update]);

  const handleInputStart = (key: string) => { keysPressed.current[key] = true; };
  const handleInputEnd = (key: string) => { keysPressed.current[key] = false; };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden font-['Orbitron'] touch-none select-none">
      <div 
        className="relative bg-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden origin-center transition-transform"
        style={{ 
          width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
          transform: `scale(${scale}) translate(${Math.random() * shake - shake/2}px, ${Math.random() * shake - shake/2}px)`
        }}
      >
        <GameCanvas 
          playerPosition={playerPosition} entities={entities} roadOffset={roadOffset}
          isInvincible={gameState.isInvincible} 
          isRecovering={gameState.recoveryInvincibilityTime > 0}
          isPaused={gameState.status === GameStatus.COLLISION_PAUSE}
          particles={particlesRef.current}
          level={gameState.level}
        />
        
        <HUD gameState={gameState} />

        {gameState.status === GameStatus.START && (
          <Menu 
            title="NEON TURBO" 
            onAction={() => startLevel(1)} 
            buttonLabel="START ENGINE"
            showNameInput
            playerName={gameState.playerName}
            setPlayerName={(n) => setGameState(p => ({ ...p, playerName: n }))}
          />
        )}
        {gameState.status === GameStatus.LEVEL_CLEAR && (
          <Menu title="LEVEL CLEAR" subtitle={`READY FOR LEVEL ${gameState.level + 1}?`} onAction={() => startLevel(gameState.level + 1)} buttonLabel="CONTINUE" />
        )}
        {gameState.status === GameStatus.GAME_OVER && (
          <Menu 
            title="WRECKED" 
            subtitle="RACE OVER" 
            onAction={restartGame} 
            buttonLabel="TRY AGAIN" 
            score={gameState.score}
            playerName={gameState.playerName}
          />
        )}
        {gameState.status === GameStatus.WIN && (
          <Menu 
            title="LEGEND" 
            subtitle="CHAMPION ACHIEVED" 
            onAction={restartGame} 
            buttonLabel="NEW SEASON" 
            score={gameState.score}
            playerName={gameState.playerName}
            win 
          />
        )}

        {gameState.status === GameStatus.COLLISION_PAUSE && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/20 backdrop-blur-[2px] pointer-events-none">
            <h2 className="text-6xl font-black text-white italic drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-pulse uppercase tracking-tighter">Crash</h2>
          </div>
        )}

        {/* --- ERGONOMIC MOBILE CONTROLS (SPLIT LAYOUT) --- */}
        {gameState.status === GameStatus.PLAYING && isTouchDevice && (
          <div className="absolute bottom-0 left-0 right-0 h-48 flex justify-between items-end px-6 pb-8 pointer-events-none">
            {/* Left Side: Steering (Left/Right) */}
            <div className="flex gap-4 pointer-events-auto">
              <ControlBtn icon="L" onStart={() => handleInputStart('ArrowLeft')} onEnd={() => handleInputEnd('ArrowLeft')} />
              <ControlBtn icon="R" onStart={() => handleInputStart('ArrowRight')} onEnd={() => handleInputEnd('ArrowRight')} />
            </div>

            {/* Right Side: Speed (Up/Down) */}
            <div className="flex gap-4 pointer-events-auto">
              <ControlBtn icon="U" onStart={() => handleInputStart('ArrowUp')} onEnd={() => handleInputEnd('ArrowUp')} />
              <ControlBtn icon="D" onStart={() => handleInputStart('ArrowDown')} onEnd={() => handleInputEnd('ArrowDown')} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ControlBtn: React.FC<{ icon: string, onStart: () => void, onEnd: () => void }> = ({ icon, onStart, onEnd }) => {
  const getPath = () => {
    switch(icon) {
      case 'L': return "M15 19l-7-7 7-7";
      case 'R': return "M9 5l7 7-7 7";
      case 'U': return "M5 15l7-7 7 7";
      case 'D': return "M19 9l-7 7-7-7";
      default: return "";
    }
  };
  
  return (
    <div 
      className="w-20 h-20 bg-slate-900/70 border-2 border-blue-500/40 rounded-2xl flex items-center justify-center active:bg-blue-500/60 active:scale-95 transition-all shadow-xl touch-none"
      style={{ touchAction: 'none' }}
      onPointerDown={(e) => { 
        e.preventDefault(); 
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        onStart(); 
      }}
      onPointerUp={(e) => { 
        e.preventDefault(); 
        onEnd(); 
      }}
      onPointerCancel={(e) => { 
        e.preventDefault(); 
        onEnd(); 
      }}
    >
      <svg className="w-12 h-12 text-blue-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d={getPath()} />
      </svg>
    </div>
  );
};

const GameCanvas: React.FC<{
  playerPosition: {x: number, y: number}, entities: Entity[], roadOffset: number,
  isInvincible: boolean, isRecovering: boolean, isPaused: boolean, particles: Particle[], level: number
}> = ({ playerPosition, entities, roadOffset, isInvincible, isRecovering, isPaused, particles, level }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const theme = LEVEL_THEMES[level - 1];

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    frameRef.current++;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Background Grid
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = (roadOffset % 50); y <= CANVAS_HEIGHT; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }

    // Road (Mathematically Centered)
    const roadX = (CANVAS_WIDTH - ROAD_WIDTH) / 2;
    ctx.fillStyle = theme.road;
    ctx.fillRect(roadX, 0, ROAD_WIDTH, CANVAS_HEIGHT);
    
    // Road Lines
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 4;
    ctx.setLineDash([40, 40]);
    ctx.lineDashOffset = -roadOffset * 2;
    
    // Draw lane lines relative to roadX
    for (let i = 1; i < 4; i++) {
       const lx = roadX + (i * (ROAD_WIDTH / 4));
       ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, CANVAS_HEIGHT); ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 6;
    ctx.strokeRect(roadX, -10, ROAD_WIDTH, CANVAS_HEIGHT + 20);

    // Particles
    particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Entities
    entities.forEach(ent => {
      ctx.shadowBlur = 15; ctx.shadowColor = ent.color; ctx.fillStyle = ent.color;
      if (ent.type === EntityType.NPC_CAR) {
        ctx.beginPath(); ctx.roundRect(ent.position.x - ent.width/2, ent.position.y - ent.height/2, ent.width, ent.height, 8); ctx.fill();
        ctx.fillStyle = '#00000055';
        ctx.fillRect(ent.position.x - 18, ent.position.y - 25, 36, 12);
        ctx.fillRect(ent.position.x - 18, ent.position.y + 10, 36, 8);
      } else if (ent.type === EntityType.OBSTACLE) {
        ctx.beginPath(); ctx.rect(ent.position.x - ent.width/2, ent.position.y - ent.height/2, ent.width, ent.height); ctx.fill();
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(ent.position.x - 20, ent.position.y - 20); ctx.lineTo(ent.position.x + 20, ent.position.y + 20); ctx.stroke();
      } else {
        const s = 1 + Math.sin(frameRef.current * 0.15) * 0.2;
        ctx.save(); ctx.translate(ent.position.x, ent.position.y); ctx.scale(s, s); ctx.rotate(frameRef.current * 0.05);
        drawStar(ctx, 0, 0, 5, 18, 8); ctx.restore();
      }
      ctx.shadowBlur = 0;
    });

    // Player Rendering
    ctx.save();
    
    if (isRecovering) {
      const alphaPulse = 0.3 + (Math.sin(frameRef.current * 0.4) + 1) * 0.3;
      ctx.globalAlpha = alphaPulse;
    }

    if (isInvincible) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = COLORS.INVINCIBLE;
      ctx.shadowBlur = 20;
      ctx.shadowColor = COLORS.INVINCIBLE;
      ctx.beginPath();
      ctx.arc(playerPosition.x, playerPosition.y, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    ctx.shadowBlur = 25; 
    ctx.shadowColor = isInvincible ? COLORS.INVINCIBLE : COLORS.PLAYER;
    ctx.fillStyle = isInvincible ? COLORS.INVINCIBLE : COLORS.PLAYER;
    ctx.beginPath(); 
    ctx.roundRect(playerPosition.x - 22, playerPosition.y - 42, 44, 84, 10); 
    ctx.fill();
    
    ctx.fillStyle = '#ffffff33'; 
    ctx.fillRect(playerPosition.x - 18, playerPosition.y - 28, 36, 20);
    
    ctx.fillStyle = '#ff4444'; 
    ctx.fillRect(playerPosition.x - 18, playerPosition.y + 30, 8, 4); 
    ctx.fillRect(playerPosition.x + 10, playerPosition.y + 30, 8, 4);
    
    ctx.restore();
    ctx.shadowBlur = 0;
  }, [playerPosition, entities, roadOffset, isInvincible, isRecovering, isPaused, particles, level]);

  function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3; let x = cx; let y = cy; let step = Math.PI / spikes;
    ctx.beginPath(); ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius; y = cy + Math.sin(rot) * outerRadius; ctx.lineTo(x, y); rot += step;
      x = cx + Math.cos(rot) * innerRadius; y = cy + Math.sin(rot) * innerRadius; ctx.lineTo(x, y); rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius); ctx.closePath(); ctx.fill();
  }

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block shadow-2xl" />;
};

export default App;

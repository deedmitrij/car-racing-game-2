
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
  
  // Buffers for frame-rate independent calculation
  const scoreBuffer = useRef(0);
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
      const scaleW = w / CANVAS_WIDTH;
      const scaleH = h / CANVAS_HEIGHT;
      setScale(Math.min(scaleW, scaleH) * 0.96);
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
    scoreBuffer.current = gameState.score;
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
    scoreBuffer.current = 0;
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

      // 1. Particle and Screen Shake Updates
      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= deltaTime * 2;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      if (shake > 0) setShake(prev => Math.max(0, prev - deltaTime * 40));

      // 2. Main Game Logic
      if (gameState.status === GameStatus.PLAYING) {
        const config = LEVEL_CONFIGS[gameState.level - 1];
        soundManager.setEngineSpeed(config.speed, true);

        // Movement Logic
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

        // Entity Management & Passing Score
        let pointsFromPassing = 0;
        let pickedUpBonus = false;
        let crashed = false;

        setEntities(prev => {
          const next = prev.map(e => ({ ...e, position: { ...e.position, y: e.position.y + config.speed } }));
          const filtered = [];
          
          for (const e of next) {
            if (e.position.y - e.height / 2 > CANVAS_HEIGHT) {
              if (e.type === EntityType.NPC_CAR || e.type === EntityType.OBSTACLE) {
                pointsFromPassing += 250; 
              }
            } else {
              filtered.push(e);
            }
          }

          // Spawn New Entities
          if (time - lastSpawnTime.current > 600) {
            const lane = LANES[Math.floor(Math.random() * LANES.length)];
            const isLaneOccupied = filtered.some(e => Math.abs(e.position.x - lane) < 20 && e.position.y < 200);
            
            if (!isLaneOccupied) {
              const theme = LEVEL_THEMES[gameState.level - 1];
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

        // Collision Check (Calculated with current set of entities)
        const isHarmable = !gameState.isInvincible && gameState.recoveryInvincibilityTime <= 0;
        
        for (const entity of entities) {
          const dx = Math.abs(playerPosition.x - entity.position.x);
          const dy = Math.abs(playerPosition.y - entity.position.y);
          if (dx < (PLAYER_SIZE.width + entity.width) / 2 - 12 && dy < (PLAYER_SIZE.height + entity.height) / 2 - 12) {
            if (entity.type === EntityType.BONUS) {
              pickedUpBonus = true;
              soundManager.playStar();
              createParticles(entity.position.x, entity.position.y, COLORS.INVINCIBLE, 20);
              setEntities(prev => prev.filter(e => e.id !== entity.id));
            } else if (isHarmable) {
              crashed = true;
              soundManager.playCrash();
              setShake(25);
              createParticles(playerPosition.x, playerPosition.y, '#ff3333', 35);
              break; 
            }
          }
        }

        // Apply All Changes to Game State in one Batch
        setGameState(prev => {
          let nextTimeLeft = prev.timeLeft - deltaTime;
          if (nextTimeLeft <= 0) {
            soundManager.stopBGM();
            const status = prev.level === MAX_LEVELS ? GameStatus.WIN : GameStatus.LEVEL_CLEAR;
            if (status === GameStatus.WIN) soundManager.playWin();
            else soundManager.playLevelClear();
            return { ...prev, status, timeLeft: 0 };
          }

          if (crashed) {
            const nextLives = prev.lives - 1;
            const isGameOver = nextLives <= 0;
            if (isGameOver) {
              soundManager.stopBGM();
              soundManager.playGameOver();
            }
            return {
              ...prev,
              status: isGameOver ? GameStatus.GAME_OVER : GameStatus.COLLISION_PAUSE,
              lives: Math.max(0, nextLives),
              score: Math.max(0, prev.score - 500),
              recoveryTime: RECOVERY_PAUSE_DURATION,
              recoveryInvincibilityTime: RECOVERY_INVINCIBILITY_DURATION
            };
          }

          // Accumulate scores accurately
          const timeScore = config.speed * 50 * deltaTime;
          const bonusScore = pickedUpBonus ? 1000 : 0;
          scoreBuffer.current = prev.score + timeScore + pointsFromPassing + bonusScore;

          return {
            ...prev,
            timeLeft: nextTimeLeft,
            score: scoreBuffer.current,
            isInvincible: pickedUpBonus ? true : (prev.invincibilityTime - deltaTime > 0),
            invincibilityTime: pickedUpBonus ? INVINCIBILITY_DURATION : Math.max(0, prev.invincibilityTime - deltaTime),
            recoveryInvincibilityTime: Math.max(0, prev.recoveryInvincibilityTime - deltaTime)
          };
        });

      } else if (gameState.status === GameStatus.COLLISION_PAUSE) {
        soundManager.setEngineSpeed(0, false);
        setGameState(prev => {
          const nextRec = prev.recoveryTime - deltaTime;
          const nextRecInvTime = prev.recoveryInvincibilityTime - deltaTime;
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

  const isMenuVisible = [GameStatus.START, GameStatus.LEVEL_CLEAR, GameStatus.GAME_OVER, GameStatus.WIN].includes(gameState.status);
  const showMobileControls = !isMenuVisible && isTouchDevice;

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center overflow-hidden font-['Orbitron'] touch-none select-none">
      <div 
        className="absolute left-1/2 top-1/2 bg-slate-900 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] rounded-sm"
        style={{ 
          width: CANVAS_WIDTH, 
          height: CANVAS_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale}) translate(${Math.random() * shake - shake/2}px, ${Math.random() * shake - shake/2}px)`,
          touchAction: 'none'
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
            score={Math.floor(gameState.score)}
            playerName={gameState.playerName}
          />
        )}
        {gameState.status === GameStatus.WIN && (
          <Menu 
            title="LEGEND" 
            subtitle="CHAMPION ACHIEVED" 
            onAction={restartGame} 
            buttonLabel="NEW SEASON" 
            score={Math.floor(gameState.score)}
            playerName={gameState.playerName}
            win 
          />
        )}

        {gameState.status === GameStatus.COLLISION_PAUSE && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/30 backdrop-blur-[4px] pointer-events-none z-[60]">
            <h2 className="text-7xl font-black text-white italic drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] animate-pulse uppercase tracking-tighter">Crash</h2>
          </div>
        )}

        {/* --- MOBILE CONTROLS --- */}
        {showMobileControls && (
          <div className={`absolute bottom-0 left-0 right-0 h-52 flex justify-between items-end px-6 pb-10 transition-opacity duration-300 pointer-events-auto z-[70] ${gameState.status === GameStatus.COLLISION_PAUSE ? 'opacity-40' : 'opacity-100'}`}>
            <div className="flex gap-4">
              <ControlBtn icon="L" onStart={() => handleInputStart('ArrowLeft')} onEnd={() => handleInputEnd('ArrowLeft')} />
              <ControlBtn icon="R" onStart={() => handleInputStart('ArrowRight')} onEnd={() => handleInputEnd('ArrowRight')} />
            </div>
            <div className="flex gap-4">
              <ControlBtn icon="D" onStart={() => handleInputStart('ArrowDown')} onEnd={() => handleInputEnd('ArrowDown')} />
              <ControlBtn icon="U" onStart={() => handleInputStart('ArrowUp')} onEnd={() => handleInputEnd('ArrowUp')} />
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
      className="w-24 h-24 bg-slate-900/90 border-2 border-blue-500/50 rounded-2xl flex items-center justify-center active:bg-blue-600/70 active:scale-90 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] touch-none pointer-events-auto"
      onPointerDown={(e) => { 
        e.preventDefault(); 
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        onStart(); 
      }}
      onPointerUp={(e) => { e.preventDefault(); onEnd(); }}
      onPointerCancel={(e) => { e.preventDefault(); onEnd(); }}
    >
      <svg className="w-14 h-14 text-blue-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
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

    // Base Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Grid
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = (roadOffset % 50); y <= CANVAS_HEIGHT; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }

    // Road System
    const roadX = (CANVAS_WIDTH - ROAD_WIDTH) / 2;
    ctx.fillStyle = theme.road;
    ctx.fillRect(roadX, 0, ROAD_WIDTH, CANVAS_HEIGHT);
    
    // Road Markings
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 4;
    ctx.setLineDash([40, 40]);
    ctx.lineDashOffset = -roadOffset * 2;
    
    for (let i = 1; i < 4; i++) {
       const lx = roadX + (i * (ROAD_WIDTH / 4));
       ctx.globalAlpha = 0.3;
       ctx.lineWidth = 8;
       ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, CANVAS_HEIGHT); ctx.stroke();
       ctx.globalAlpha = 1;
       ctx.lineWidth = 4;
       ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, CANVAS_HEIGHT); ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 12; ctx.globalAlpha = 0.2;
    ctx.strokeRect(roadX, -10, ROAD_WIDTH, CANVAS_HEIGHT + 20);
    ctx.lineWidth = 6; ctx.globalAlpha = 1;
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
      if (ent.type === EntityType.NPC_CAR) {
        ctx.fillStyle = ent.color;
        ctx.globalAlpha = 0.2;
        ctx.beginPath(); ctx.roundRect(ent.position.x - ent.width/2 - 6, ent.position.y - ent.height/2 - 6, ent.width+12, ent.height+12, 12); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.roundRect(ent.position.x - ent.width/2, ent.position.y - ent.height/2, ent.width, ent.height, 8); ctx.fill();
        ctx.fillStyle = '#00000066';
        ctx.fillRect(ent.position.x - 18, ent.position.y - 25, 36, 12);
        ctx.fillRect(ent.position.x - 18, ent.position.y + 10, 36, 8);
      } else if (ent.type === EntityType.OBSTACLE) {
        ctx.fillStyle = ent.color;
        ctx.beginPath(); ctx.roundRect(ent.position.x - ent.width/2, ent.position.y - ent.height/2, ent.width, ent.height, 4); ctx.fill();
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3;
        ctx.strokeRect(ent.position.x - ent.width/2 + 6, ent.position.y - ent.height/2 + 6, ent.width - 12, ent.height - 12);
      } else {
        const s = 1 + Math.sin(frameRef.current * 0.15) * 0.2;
        ctx.save(); ctx.translate(ent.position.x, ent.position.y); ctx.scale(s, s); ctx.rotate(frameRef.current * 0.05);
        ctx.fillStyle = COLORS.INVINCIBLE;
        ctx.globalAlpha = 0.3;
        drawStar(ctx, 0, 0, 5, 24, 10);
        ctx.globalAlpha = 1;
        drawStar(ctx, 0, 0, 5, 18, 8);
        ctx.restore();
      }
    });

    // Player Rendering
    ctx.save();
    
    // Blinking Logic
    let blinkVisible = true;
    if (isRecovering) {
      // Clear, readable blink pattern
      blinkVisible = Math.floor(frameRef.current / 5) % 2 === 0;
    }

    if (blinkVisible) {
      if (isInvincible) {
        const shieldPulse = 1 + Math.sin(frameRef.current * 0.2) * 0.05;
        ctx.save();
        ctx.strokeStyle = COLORS.INVINCIBLE;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.2;
        ctx.beginPath(); ctx.arc(playerPosition.x, playerPosition.y, 65 * shieldPulse, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = COLORS.INVINCIBLE;
        ctx.beginPath(); ctx.arc(playerPosition.x, playerPosition.y, 60 * shieldPulse, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      
      ctx.fillStyle = isInvincible ? COLORS.INVINCIBLE : COLORS.PLAYER;
      ctx.globalAlpha = 0.25;
      ctx.beginPath(); ctx.roundRect(playerPosition.x - 28, playerPosition.y - 48, 56, 96, 14); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.roundRect(playerPosition.x - 22, playerPosition.y - 42, 44, 84, 10); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.5;
      ctx.fillRect(playerPosition.x - 18, playerPosition.y - 28, 36, 15);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(playerPosition.x - 18, playerPosition.y + 30, 8, 4); 
      ctx.fillRect(playerPosition.x + 10, playerPosition.y + 30, 8, 4);
    }
    
    ctx.restore();
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

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block" />;
};

export default App;

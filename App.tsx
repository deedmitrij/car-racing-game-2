
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, GameState, Entity, EntityType, HighScore } from './types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  ROAD_WIDTH, 
  PLAYER_SIZE, 
  NPC_CAR_SIZE, 
  OBSTACLE_SIZE, 
  BONUS_SIZE,
  OIL_SIZE,
  INITIAL_LIVES,
  LEVEL_DURATION,
  MAX_LEVELS,
  LEVEL_CONFIGS,
  LEVEL_THEMES,
  RECOVERY_PAUSE_DURATION,
  INVINCIBILITY_DURATION,
  RECOVERY_INVINCIBILITY_DURATION,
  LANES,
  COLORS,
  NEAR_MISS_THRESHOLD,
  NEAR_MISS_POINTS,
  HIGH_SCORES_KEY
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

const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(HIGH_SCORES_KEY);
    return {
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
      highScores: saved ? JSON.parse(saved) : [],
      lastNearMissTime: 0,
      isSkidding: false,
      skidTime: 0,
      skidDirection: 0
    };
  });

  const [scale, setScale] = useState(1);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showPoliceWarning, setShowPoliceWarning] = useState(false);
  
  const playerPosRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 160 });
  const entitiesRef = useRef<Entity[]>([]);
  const roadOffsetRef = useRef(0);
  const collisionLockRef = useRef(false);
  const scoreBuffer = useRef(0);
  const shakeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastSpawnTime = useRef<number>(0);
  const nextPoliceSpawnTime = useRef<number>(0);
  const policeSpawnedCount = useRef(0);
  
  const stateRef = useRef(gameState);
  useEffect(() => { 
    stateRef.current = gameState;
    if (gameState.status === GameStatus.COLLISION_PAUSE || gameState.recoveryInvincibilityTime > 0 || gameState.isInvincible) {
      collisionLockRef.current = false;
    }
  }, [gameState]);

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

  const updateHighScoresLocally = (name: string, score: number, currentHighScores: HighScore[]) => {
    const newScores = [...currentHighScores, { name, score: Math.floor(score) }]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(newScores));
    return newScores;
  };

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
    collisionLockRef.current = false;
    shakeRef.current = 0;
    policeSpawnedCount.current = 0;
    nextPoliceSpawnTime.current = performance.now() + 5000; // First police after 5s
    setShowPoliceWarning(false);
    
    const isFirstLevel = level === 1;
    if (isFirstLevel) {
      scoreBuffer.current = 0;
    } else {
      scoreBuffer.current = stateRef.current.score;
    }

    await soundManager.init();
    soundManager.startBGM(level);

    setGameState(prev => ({
      ...prev,
      status: GameStatus.PLAYING,
      level,
      lives: isFirstLevel ? INITIAL_LIVES : prev.lives,
      score: scoreBuffer.current,
      timeLeft: LEVEL_DURATION,
      isInvincible: false,
      invincibilityTime: 0,
      recoveryInvincibilityTime: 0,
      recoveryTime: 0,
      isSkidding: false,
      skidTime: 0
    }));

    entitiesRef.current = [];
    playerPosRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 160 };
  };

  const restartGame = () => {
    clearInputs();
    scoreBuffer.current = 0;
    collisionLockRef.current = false;
    shakeRef.current = 0;
    policeSpawnedCount.current = 0;
    nextPoliceSpawnTime.current = 0;
    setShowPoliceWarning(false);
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
      isSkidding: false,
      skidTime: 0
    }));
    entitiesRef.current = [];
    particlesRef.current = [];
  };

  const update = useCallback((time: number) => {
    const gameState = stateRef.current;
    
    if (lastTimeRef.current !== undefined) {
      const deltaTime = (time - lastTimeRef.current) / 1000;

      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= deltaTime * 2;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      if (shakeRef.current > 0) shakeRef.current = Math.max(0, shakeRef.current - deltaTime * 40);

      if (gameState.status === GameStatus.PLAYING) {
        const config = LEVEL_CONFIGS[gameState.level - 1];
        soundManager.setEngineSpeed(config.speed, true);

        const moveSpeed = 8;
        let nx = playerPosRef.current.x;
        let ny = playerPosRef.current.y;

        if (gameState.isSkidding) {
          nx += gameState.skidDirection * 5.5;
        } else {
          if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) nx -= moveSpeed;
          if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) nx += moveSpeed;
          if (keysPressed.current['ArrowUp'] || keysPressed.current['w']) ny -= moveSpeed * 0.8;
          if (keysPressed.current['ArrowDown'] || keysPressed.current['s']) ny += moveSpeed * 0.8;
        }

        const roadX = (CANVAS_WIDTH - ROAD_WIDTH) / 2;
        const leftBound = roadX + PLAYER_SIZE.width / 2 + 10;
        const rightBound = roadX + ROAD_WIDTH - PLAYER_SIZE.width / 2 - 10;
        const topBound = PLAYER_SIZE.height / 2 + 20;
        const bottomBound = CANVAS_HEIGHT - PLAYER_SIZE.height / 2 - 20;

        playerPosRef.current = {
          x: Math.max(leftBound, Math.min(rightBound, nx)),
          y: Math.max(topBound, Math.min(bottomBound, ny))
        };

        roadOffsetRef.current = (roadOffsetRef.current + config.speed) % 80;

        let pointsFromPassing = 0;
        let nearMissDetected = false;
        let pickedUpBonus = false;
        let hitOil = false;
        let crashed = false;

        const isCurrentlyHarmable = !collisionLockRef.current && !gameState.isInvincible && gameState.recoveryInvincibilityTime <= 0;

        // Police AI: Weaving
        const nextEntities = entitiesRef.current.map(e => {
          let nextX = e.position.x;
          let nextTarget = e.targetLaneX || e.position.x;

          if (e.type === EntityType.POLICE_CAR) {
            if (Math.abs(nextX - nextTarget) > 2) {
              nextX += (nextTarget - nextX) * 0.05; 
            } else {
              const currentLaneIdx = LANES.indexOf(nextTarget);
              const possibleLanes = LANES.filter((_, i) => i !== currentLaneIdx);
              e.targetLaneX = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
            }
          }
          return { ...e, position: { x: nextX, y: e.position.y + config.speed } };
        });

        const filteredEntities: Entity[] = [];
        for (const e of nextEntities) {
          const passedY = e.position.y - e.height / 2 > playerPosRef.current.y + PLAYER_SIZE.height / 2;
          const previouslyUnpassed = entitiesRef.current.find(old => old.id === e.id && old.position.y - old.height / 2 <= playerPosRef.current.y + PLAYER_SIZE.height / 2);

          if (e.position.y - e.height / 2 > CANVAS_HEIGHT) {
            if (e.type !== EntityType.BONUS && e.type !== EntityType.OIL_SPILL) pointsFromPassing += 250; 
          } else {
            if (isCurrentlyHarmable && passedY && previouslyUnpassed && (e.type === EntityType.NPC_CAR || e.type === EntityType.POLICE_CAR || e.type === EntityType.OBSTACLE)) {
              const dx = Math.abs(playerPosRef.current.x - e.position.x);
              const collisionDist = (PLAYER_SIZE.width + e.width) / 2;
              if (dx < collisionDist + NEAR_MISS_THRESHOLD && dx >= collisionDist - 8) {
                nearMissDetected = true;
              }
            }
            filteredEntities.push(e);
          }
        }

        // --- IMPROVED SEQUENTIAL POLICE SPAWNING ---
        if (time - lastSpawnTime.current > 500) { 
          const lane = LANES[Math.floor(Math.random() * LANES.length)];
          const isLaneOccupied = filteredEntities.some(e => Math.abs(e.position.x - lane) < 20 && e.position.y < 150);
          
          if (!isLaneOccupied) {
            const theme = LEVEL_THEMES[gameState.level - 1];
            const rand = Math.random();
            
            // Show warning 1 second before police arrives
            if (config.policeCount > 0 && 
                policeSpawnedCount.current < config.policeCount && 
                time > nextPoliceSpawnTime.current - 1500 && 
                time < nextPoliceSpawnTime.current) {
              setShowPoliceWarning(true);
            } else {
              setShowPoliceWarning(false);
            }

            // Spawn Police Car if time is up
            if (config.policeCount > 0 && 
                policeSpawnedCount.current < config.policeCount && 
                time >= nextPoliceSpawnTime.current) {
              
              filteredEntities.push({
                id: Math.random().toString(), type: EntityType.POLICE_CAR,
                position: { x: lane, y: -100 }, width: NPC_CAR_SIZE.width, height: NPC_CAR_SIZE.height,
                speed: config.speed, color: '#64748b',
                targetLaneX: LANES[Math.floor(Math.random() * LANES.length)]
              });
              
              policeSpawnedCount.current++;
              // Minimum 8 second gap before the next one starts appearing
              nextPoliceSpawnTime.current = time + 8000 + (Math.random() * 3000); 
              lastSpawnTime.current = time;
            } 
            // Only spawn regular traffic if we are NOT currently spawning a police car
            else if (rand < config.trafficDensity) {
              filteredEntities.push({
                id: Math.random().toString(), type: EntityType.NPC_CAR,
                position: { x: lane, y: -100 }, width: NPC_CAR_SIZE.width, height: NPC_CAR_SIZE.height,
                speed: config.speed, color: theme.npc[Math.floor(Math.random() * theme.npc.length)]
              });
              lastSpawnTime.current = time;
            } else if (rand < config.trafficDensity + config.obstacleDensity) {
              filteredEntities.push({
                id: Math.random().toString(), type: EntityType.OBSTACLE,
                position: { x: lane, y: -100 }, width: OBSTACLE_SIZE.width, height: OBSTACLE_SIZE.height,
                speed: config.speed, color: COLORS.OBSTACLE
              });
              lastSpawnTime.current = time;
            } else if (rand < config.trafficDensity + config.obstacleDensity + config.bonusDensity) {
              filteredEntities.push({
                id: Math.random().toString(), type: EntityType.BONUS,
                position: { x: lane, y: -100 }, width: BONUS_SIZE.width, height: BONUS_SIZE.height,
                speed: config.speed, color: COLORS.INVINCIBLE
              });
              lastSpawnTime.current = time;
            } else if (rand < config.trafficDensity + config.obstacleDensity + config.bonusDensity + (config.oilDensity || 0)) {
              filteredEntities.push({
                id: Math.random().toString(), type: EntityType.OIL_SPILL,
                position: { x: lane, y: -100 }, width: OIL_SIZE.width, height: OIL_SIZE.height,
                speed: config.speed, color: COLORS.OIL
              });
              lastSpawnTime.current = time;
            }
          }
        }
        entitiesRef.current = filteredEntities;

        for (const entity of entitiesRef.current) {
          const dx = Math.abs(playerPosRef.current.x - entity.position.x);
          const dy = Math.abs(playerPosRef.current.y - entity.position.y);
          
          const horizontalBox = (PLAYER_SIZE.width + entity.width) / 2 - 6;
          const verticalBox = (PLAYER_SIZE.height + entity.height) / 2 - 10;
          
          if (dx < horizontalBox && dy < verticalBox) {
            if (entity.type === EntityType.BONUS) {
              pickedUpBonus = true;
              soundManager.playStar();
              createParticles(entity.position.x, entity.position.y, COLORS.INVINCIBLE, 20);
              entitiesRef.current = entitiesRef.current.filter(e => e.id !== entity.id);
            } else if (entity.type === EntityType.OIL_SPILL) {
              hitOil = true;
            } else if (isCurrentlyHarmable) {
              collisionLockRef.current = true;
              crashed = true;
              soundManager.playCrash();
              shakeRef.current = 25;
              createParticles(playerPosRef.current.x, playerPosRef.current.y, '#ff3333', 35);
              break; 
            }
          }
        }

        setGameState(prev => {
          if (prev.status !== GameStatus.PLAYING) return prev;

          let nextTimeLeft = prev.timeLeft - deltaTime;
          if (nextTimeLeft <= 0) {
            soundManager.stopBGM();
            const isFinalWin = prev.level === MAX_LEVELS;
            const status = isFinalWin ? GameStatus.WIN : GameStatus.LEVEL_CLEAR;
            let finalScores = prev.highScores;
            if (isFinalWin) {
              soundManager.playWin();
              finalScores = updateHighScoresLocally(prev.playerName, prev.score, prev.highScores);
            } else {
              soundManager.playLevelClear();
            }
            return { ...prev, status, timeLeft: 0, highScores: finalScores };
          }

          if (crashed) {
            const nextLives = prev.lives - 1;
            const isGameOver = nextLives <= 0;
            const penalizedScore = Math.max(0, prev.score - 500);
            scoreBuffer.current = penalizedScore;

            let finalScores = prev.highScores;
            if (isGameOver) {
              soundManager.stopBGM();
              soundManager.playGameOver();
              finalScores = updateHighScoresLocally(prev.playerName, penalizedScore, prev.highScores);
            }
            return {
              ...prev,
              status: isGameOver ? GameStatus.GAME_OVER : GameStatus.COLLISION_PAUSE,
              lives: Math.max(0, nextLives),
              score: penalizedScore,
              recoveryTime: RECOVERY_PAUSE_DURATION,
              recoveryInvincibilityTime: RECOVERY_INVINCIBILITY_DURATION,
              highScores: finalScores,
              isSkidding: false,
              skidTime: 0
            };
          }

          const timeScore = config.speed * 50 * deltaTime;
          const bonusScore = pickedUpBonus ? 1000 : 0;
          const nearMissScore = nearMissDetected ? NEAR_MISS_POINTS : 0;
          scoreBuffer.current = prev.score + timeScore + pointsFromPassing + bonusScore + nearMissScore;

          let nextSkidTime = Math.max(0, prev.skidTime - deltaTime);
          let currentlySkidding = hitOil ? true : nextSkidTime > 0;
          let skidDir = prev.skidDirection;
          if (hitOil && !prev.isSkidding) {
            nextSkidTime = 1.2;
            skidDir = Math.random() < 0.5 ? -1 : 1;
          }

          return {
            ...prev,
            timeLeft: nextTimeLeft,
            score: scoreBuffer.current,
            isInvincible: pickedUpBonus ? true : (prev.invincibilityTime - deltaTime > 0),
            invincibilityTime: pickedUpBonus ? INVINCIBILITY_DURATION : Math.max(0, prev.invincibilityTime - deltaTime),
            recoveryInvincibilityTime: Math.max(0, prev.recoveryInvincibilityTime - deltaTime),
            lastNearMissTime: nearMissDetected ? time : prev.lastNearMissTime,
            isSkidding: currentlySkidding,
            skidTime: nextSkidTime,
            skidDirection: skidDir
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
  }, []);

  useEffect(() => {
    const onKD = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const onKU = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);
    requestRef.current = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
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
          transform: `translate(-50%, -50%) scale(${scale}) translate(${Math.random() * shakeRef.current - shakeRef.current/2}px, ${Math.random() * shakeRef.current - shakeRef.current/2}px)`,
          touchAction: 'none'
        }}
      >
        <GameCanvas 
          playerPosRef={playerPosRef} entitiesRef={entitiesRef} roadOffsetRef={roadOffsetRef}
          isInvincible={gameState.isInvincible} 
          isRecovering={gameState.recoveryInvincibilityTime > 0}
          isPaused={gameState.status === GameStatus.COLLISION_PAUSE}
          particlesRef={particlesRef}
          level={gameState.level}
          isSkidding={gameState.isSkidding}
        />
        
        <HUD gameState={gameState} />

        {/* POLICE WARNING OVERLAY */}
        {showPoliceWarning && gameState.status === GameStatus.PLAYING && (
          <div className="absolute top-1/3 left-0 right-0 flex flex-col items-center justify-center z-[55] animate-pulse">
            <div className="bg-red-600/90 text-white px-8 py-2 font-black italic text-xl skew-x-[-15deg] shadow-[0_0_30px_rgba(220,38,38,0.8)] border-y-2 border-white">
              POLICE INCOMING
            </div>
            <div className="flex gap-4 mt-2">
              <div className="w-12 h-2 bg-blue-500 animate-bounce"></div>
              <div className="w-12 h-2 bg-red-500 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-12 h-2 bg-blue-500 animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}

        {gameState.status === GameStatus.START && (
          <Menu 
            title="NEON TURBO" 
            onAction={() => startLevel(1)} 
            buttonLabel="START ENGINE"
            showNameInput
            playerName={gameState.playerName}
            setPlayerName={(n) => setGameState(p => ({ ...p, playerName: n }))}
            highScores={gameState.highScores} 
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
            highScores={gameState.highScores}
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
            highScores={gameState.highScores}
            win 
          />
        )}

        {gameState.status === GameStatus.COLLISION_PAUSE && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/30 backdrop-blur-[4px] pointer-events-none z-[60]">
            <h2 className="text-7xl font-black text-white italic drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] animate-pulse uppercase tracking-tighter">Crash</h2>
          </div>
        )}

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
      className="w-24 h-24 bg-slate-900/90 border-2 border-blue-500/50 rounded-2xl flex items-center justify-center active:bg-blue-600/70 active:scale-90 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] touch-none pointer-events-auto"
      onPointerDown={(e) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); onStart(); }}
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
  playerPosRef: React.RefObject<{x: number, y: number}>, entitiesRef: React.RefObject<Entity[]>, 
  roadOffsetRef: React.RefObject<number>, isInvincible: boolean, isRecovering: boolean, 
  isPaused: boolean, particlesRef: React.RefObject<Particle[]>, level: number, isSkidding: boolean
}> = ({ playerPosRef, entitiesRef, roadOffsetRef, isInvincible, isRecovering, isPaused, particlesRef, level, isSkidding }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const theme = LEVEL_THEMES[Math.max(0, level - 1)];

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    animFrameRef.current++;
    const frame = animFrameRef.current;
    const playerPosition = playerPosRef.current!;
    const entities = entitiesRef.current!;
    const roadOffset = roadOffsetRef.current!;
    const particles = particlesRef.current!;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = theme.grid; ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); }
    for (let y = (roadOffset % 50); y <= CANVAS_HEIGHT; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); }

    const roadX = (CANVAS_WIDTH - ROAD_WIDTH) / 2;
    ctx.fillStyle = theme.road;
    ctx.fillRect(roadX, 0, ROAD_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = theme.border; ctx.lineWidth = 4; ctx.setLineDash([40, 40]); ctx.lineDashOffset = -roadOffset * 2;
    for (let i = 1; i < 4; i++) {
       const lx = roadX + (i * (ROAD_WIDTH / 4));
       ctx.globalAlpha = 0.3; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, CANVAS_HEIGHT); ctx.stroke();
       ctx.globalAlpha = 1; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, CANVAS_HEIGHT); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.strokeStyle = theme.border; ctx.lineWidth = 12; ctx.globalAlpha = 0.2; ctx.strokeRect(roadX, -10, ROAD_WIDTH, CANVAS_HEIGHT + 20);
    ctx.lineWidth = 6; ctx.globalAlpha = 1; ctx.strokeRect(roadX, -10, ROAD_WIDTH, CANVAS_HEIGHT + 20);

    particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.1, 3 * p.life), 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;

    entities.forEach(ent => {
      if (ent.type === EntityType.NPC_CAR || ent.type === EntityType.POLICE_CAR) {
        ctx.fillStyle = ent.color;
        ctx.globalAlpha = 0.2;
        drawRoundRect(ctx, ent.position.x - ent.width/2 - 6, ent.position.y - ent.height/2 - 6, ent.width+12, ent.height+12, 12); ctx.fill();
        ctx.globalAlpha = 1;
        drawRoundRect(ctx, ent.position.x - ent.width/2, ent.position.y - ent.height/2, ent.width, ent.height, 8); ctx.fill();
        
        if (ent.type === EntityType.POLICE_CAR) {
          ctx.fillStyle = '#94a3b8'; 
          ctx.fillRect(ent.position.x - ent.width/2 + 5, ent.position.y - ent.height/2 + 10, ent.width - 10, ent.height - 20);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ent.position.x - 12, ent.position.y - 12, 24, 24);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 9px Orbitron';
          ctx.textAlign = 'center';
          ctx.fillText('POLICE', ent.position.x, ent.position.y + 3);

          const strobing = Math.floor(frame / 5) % 2 === 0;
          ctx.fillStyle = '#334155';
          ctx.fillRect(ent.position.x - 22, ent.position.y - 28, 44, 8);
          ctx.fillStyle = strobing ? COLORS.POLICE_RED : '#400000';
          if (strobing) { ctx.shadowBlur = 25; ctx.shadowColor = COLORS.POLICE_RED; }
          ctx.fillRect(ent.position.x - 20, ent.position.y - 27, 18, 6);
          ctx.shadowBlur = 0;
          ctx.fillStyle = !strobing ? COLORS.POLICE_BLUE : '#000040';
          if (!strobing) { ctx.shadowBlur = 25; ctx.shadowColor = COLORS.POLICE_BLUE; }
          ctx.fillRect(ent.position.x + 2, ent.position.y - 27, 18, 6);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = '#00000066';
          ctx.fillRect(ent.position.x - 18, ent.position.y - 25, 36, 12);
          ctx.fillRect(ent.position.x - 18, ent.position.y + 10, 36, 8);
        }
      } else if (ent.type === EntityType.OBSTACLE) {
        ctx.fillStyle = ent.color; drawRoundRect(ctx, ent.position.x - ent.width/2, ent.position.y - ent.height/2, ent.width, ent.height, 4); ctx.fill();
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.strokeRect(ent.position.x - ent.width/2 + 6, ent.position.y - ent.height/2 + 6, ent.width - 12, ent.height - 12);
      } else if (ent.type === EntityType.OIL_SPILL) {
        ctx.fillStyle = COLORS.OIL;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(ent.position.x, ent.position.y, ent.width/2, ent.height/2, Math.PI/6, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        const s = 1 + Math.sin(frame * 0.05) * 0.12;
        ctx.save(); 
        ctx.translate(ent.position.x, ent.position.y); 
        ctx.scale(s, s); 
        ctx.rotate(frame * 0.02);
        ctx.fillStyle = COLORS.INVINCIBLE; ctx.globalAlpha = 0.3; drawStar(ctx, 0, 0, 5, 24, 10); ctx.globalAlpha = 1; drawStar(ctx, 0, 0, 5, 18, 8); 
        ctx.restore();
      }
    });

    ctx.save();
    let blinkVisible = true;
    if (isRecovering) blinkVisible = Math.floor(frame / 5) % 2 === 0;
    if (blinkVisible) {
      if (isInvincible) {
        const shieldPulse = 1 + Math.sin(frame * 0.15) * 0.05;
        ctx.save(); ctx.strokeStyle = COLORS.INVINCIBLE; ctx.lineWidth = 4; ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.arc(playerPosition.x, playerPosition.y, 65 * shieldPulse, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.1; ctx.fillStyle = COLORS.INVINCIBLE; ctx.beginPath(); ctx.arc(playerPosition.x, playerPosition.y, 60 * shieldPulse, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      
      // Car Body
      ctx.save();
      if (isSkidding) {
        ctx.translate(playerPosition.x, playerPosition.y);
        ctx.rotate(Math.sin(frame * 0.2) * 0.15); 
        ctx.translate(-playerPosition.x, -playerPosition.y);
      }
      ctx.fillStyle = isInvincible ? COLORS.INVINCIBLE : COLORS.PLAYER; ctx.globalAlpha = 0.25; drawRoundRect(ctx, playerPosition.x - 28, playerPosition.y - 48, 56, 96, 14); ctx.fill();
      ctx.globalAlpha = 1; drawRoundRect(ctx, playerPosition.x - 22, playerPosition.y - 42, 44, 84, 10); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.5; ctx.fillRect(playerPosition.x - 18, playerPosition.y - 28, 36, 15); ctx.globalAlpha = 1;
      ctx.fillStyle = '#ff0000'; ctx.fillRect(playerPosition.x - 18, playerPosition.y + 30, 8, 4); ctx.fillRect(playerPosition.x + 10, playerPosition.y + 30, 8, 4);
      ctx.restore();
    }
    ctx.restore();
  }, [isInvincible, isRecovering, isPaused, level, theme, isSkidding]);

  useEffect(() => {
    let reqId: number;
    const loop = () => { draw(); reqId = requestAnimationFrame(loop); };
    reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqId);
  }, [draw]);

  function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3; let x = cx; let y = cy; let step = Math.PI / spikes;
    ctx.beginPath(); ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) { x = cx + Math.cos(rot) * outerRadius; y = cy + Math.sin(rot) * outerRadius; ctx.lineTo(x, y); rot += step; x = cx + Math.cos(rot) * innerRadius; y = cy + Math.sin(rot) * innerRadius; ctx.lineTo(x, y); rot += step; }
    ctx.lineTo(cx, cy - outerRadius); ctx.closePath(); ctx.fill();
  }
  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block" />;
};

export default App;

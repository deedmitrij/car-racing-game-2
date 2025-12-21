
import React, { useEffect, useState } from 'react';
import { GameState, GameStatus } from '../types';
import { MAX_LEVELS, INVINCIBILITY_DURATION } from '../constants';

interface HUDProps {
  gameState: GameState;
}

const HUD: React.FC<HUDProps> = ({ gameState }) => {
  const { playerName, timeLeft, lives, level, score, isInvincible, invincibilityTime, status, lastNearMissTime } = gameState;
  const [showNearMiss, setShowNearMiss] = useState(false);

  useEffect(() => {
    if (lastNearMissTime > 0) {
      setShowNearMiss(true);
      const timer = setTimeout(() => setShowNearMiss(false), 800);
      return () => clearTimeout(timer);
    }
  }, [lastNearMissTime]);

  if (status === GameStatus.START) return null;

  const shieldPercent = Math.max(0, Math.min(100, (invincibilityTime / INVINCIBILITY_DURATION) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* --- NEAR MISS TOAST --- */}
      {showNearMiss && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-bounce pointer-events-none">
          <div className="bg-yellow-400 text-black font-black italic px-4 py-1 skew-x-[-12deg] shadow-[0_0_20px_#facc15] text-xl border-2 border-white">
            NEAR MISS! +500
          </div>
        </div>
      )}

      {/* --- TOP HUD BAR --- */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-3 rounded-xl shadow-2xl min-w-[130px]">
          <div className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mb-0.5">{playerName}</div>
          <div className="text-lg font-black text-white italic leading-none">
            Level {level} <span className="text-slate-500 text-xs">/ {MAX_LEVELS}</span>
          </div>
        </div>

        <div className="bg-slate-900/95 backdrop-blur-xl border border-green-500/40 px-6 py-2 rounded-b-2xl shadow-2xl -mt-4 pt-6">
          <div className="text-[8px] text-green-400 font-black uppercase tracking-widest text-center mb-0.5">Score</div>
          <div className="text-2xl font-black text-white italic tabular-nums tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] text-center">
            {Math.floor(score).toLocaleString()}
          </div>
        </div>
        
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-3 rounded-xl shadow-2xl min-w-[95px] text-center">
          <div className="text-[9px] text-red-400 font-black uppercase tracking-[0.2em] mb-0.5">Time</div>
          <div className={`text-xl font-black italic leading-none ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {Math.ceil(timeLeft)}s
          </div>
        </div>
      </div>

      <div className="absolute top-24 right-2 w-[76px] flex flex-col items-center gap-2">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 py-3 px-2 rounded-xl shadow-2xl flex flex-col items-center gap-3 w-full">
          <div className="text-[8px] text-rose-400 font-black uppercase tracking-widest text-center">Lives</div>
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <svg 
                key={i} 
                className={`w-7 h-7 drop-shadow-[0_0_8px_currentColor] transition-all duration-300 ${i < lives ? 'text-rose-500 scale-100' : 'text-slate-800 scale-75 opacity-40'}`} 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ))}
          </div>
        </div>

        {invincibilityTime > 0 && (
          <div className="w-full bg-amber-900/90 backdrop-blur-md border border-amber-500/50 p-2 rounded-xl shadow-2xl animate-in slide-in-from-right-4 duration-300 flex flex-col items-center">
            <div className="text-[7px] text-amber-400 font-black uppercase tracking-[0.1em] text-center mb-1 leading-tight">Shield</div>
            <div className="text-lg font-black text-white italic tabular-nums leading-none">
              {invincibilityTime.toFixed(1)}
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full mt-2 overflow-hidden border border-white/10">
              <div 
                className="h-full bg-amber-400 shadow-[0_0_5px_#fbbf24]" 
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HUD;

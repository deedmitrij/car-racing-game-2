
import React from 'react';
import { HighScore } from '../types';

interface MenuProps {
  title: string;
  subtitle?: string;
  onAction: () => void;
  buttonLabel: string;
  win?: boolean;
  showNameInput?: boolean;
  playerName?: string;
  setPlayerName?: (name: string) => void;
  score?: number;
  highScores?: HighScore[];
}

const Menu: React.FC<MenuProps> = ({ title, subtitle, onAction, buttonLabel, win, showNameInput, playerName, setPlayerName, score, highScores }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-6 overflow-y-auto">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300 py-10">
        <div className="space-y-1">
          {subtitle && (
            <p className="text-blue-400 font-bold tracking-[0.4em] uppercase text-[10px]">{subtitle}</p>
          )}
          <h1 className={`text-5xl font-black italic tracking-tighter uppercase ${win ? 'text-amber-400 drop-shadow-[0_0_20px_#fbbf24]' : 'text-white'}`}>
            {title}
          </h1>
        </div>

        {score !== undefined && (
          <div className="bg-slate-900/50 p-5 rounded-2xl border-2 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Final Performance</div>
            <div className="text-4xl font-black text-white tabular-nums italic">{score.toLocaleString()}</div>
          </div>
        )}

        {showNameInput && setPlayerName && (
          <div className="space-y-3">
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Driver Registration</div>
            <input 
              type="text" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-xl text-center text-xl font-black text-blue-400 focus:border-blue-500 outline-none transition-all shadow-inner"
              maxLength={12}
            />
          </div>
        )}

        {/* HIGH SCORES LEADERBOARD */}
        {highScores && highScores.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] border-b border-slate-800 pb-2">Hall of Fame</div>
            <div className="space-y-2">
              {highScores.map((hs, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-black w-4">#{(i+1)}</span>
                    <span className={`font-bold ${i === 0 ? 'text-amber-400' : 'text-slate-300'}`}>{hs.name}</span>
                  </div>
                  <span className="font-black text-white tabular-nums">{hs.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {win && (
          <div className="flex justify-center space-x-2 animate-pulse">
             {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_#fbbf24]" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
             ))}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={onAction}
            className="group relative inline-flex items-center justify-center px-10 py-5 font-black text-white transition-all duration-200 bg-blue-600 rounded-2xl hover:bg-blue-500 active:scale-95 focus:outline-none w-full overflow-hidden shadow-[0_0_30px_rgba(37,99,235,0.4)]"
          >
            <span className="relative z-10 tracking-[0.2em] uppercase italic">{buttonLabel}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <div className="text-slate-600 text-[9px] uppercase font-black tracking-[0.3em]">
            {win ? "Championship Secured" : "Precision Driving Required"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;

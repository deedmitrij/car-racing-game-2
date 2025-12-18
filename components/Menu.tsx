
import React from 'react';

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
}

const Menu: React.FC<MenuProps> = ({ title, subtitle, onAction, buttonLabel, win, showNameInput, playerName, setPlayerName, score }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-10">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="space-y-2">
          {subtitle && (
            <p className="text-slate-400 font-bold tracking-[0.3em] uppercase text-xs">{subtitle}</p>
          )}
          <h1 className={`text-6xl font-black italic tracking-tighter ${win ? 'text-amber-400 drop-shadow-[0_0_20px_#fbbf24]' : 'text-white'}`}>
            {title}
          </h1>
        </div>

        {score !== undefined && (
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{playerName}'s Final Score</div>
            <div className="text-4xl font-black text-white tabular-nums">{score.toLocaleString()}</div>
          </div>
        )}

        {showNameInput && setPlayerName && (
          <div className="space-y-4">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">Enter Driver ID</div>
            <input 
              type="text" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border-2 border-slate-700 p-4 rounded-xl text-center text-xl font-black text-blue-400 focus:border-blue-500 outline-none transition-colors"
              maxLength={12}
            />
          </div>
        )}

        {win && (
          <div className="flex justify-center space-x-2">
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
            className="group relative inline-flex items-center justify-center px-10 py-5 font-black text-white transition-all duration-200 bg-blue-600 rounded-full hover:bg-blue-500 active:scale-95 focus:outline-none w-full overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            <span className="relative z-10 tracking-[0.2em] uppercase">{buttonLabel}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
            {win ? "All Tracks Completed" : "Arrows or WASD to Drive"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;

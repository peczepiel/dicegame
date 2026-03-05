import React from 'react';
import { Player } from '../types';
import { Beer, Dice5, Plus, Minus } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isOffense: boolean;
  isCurrentThrower: boolean;
  onBeerAdd: (playerId: string) => void;
  onDieLost: (playerId: string) => void;
  onSelectThrower?: (index: number) => void;
  index: number;
  teamColor: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isOffense,
  isCurrentThrower,
  onBeerAdd,
  onDieLost,
  onSelectThrower,
  index,
  teamColor,
}) => {
  return (
    <div 
      onClick={() => isOffense && onSelectThrower?.(index)}
      className={`relative flex-1 p-3 rounded-2xl border-2 transition-all duration-300 ${
        isCurrentThrower 
          ? `border-[${teamColor}] bg-white shadow-md scale-105 z-10` 
          : 'border-transparent bg-white/60'
      } ${isOffense ? 'cursor-pointer' : ''}`}
      style={{ borderColor: isCurrentThrower ? teamColor : 'transparent' }}
    >
      {isCurrentThrower && (
        <div 
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest"
          style={{ backgroundColor: teamColor }}
        >
          Throwing
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg truncate max-w-[80px]">{player.name}</h3>
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-1 text-amber-600 font-bold text-sm">
             <Beer size={14} />
             {player.stats.beerTotal}
           </div>
           <div className="flex items-center gap-1 text-red-500 font-bold text-sm">
             <Dice5 size={14} />
             {player.stats.lostDice}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={(e) => { e.stopPropagation(); onBeerAdd(player.id); }}
          className="flex items-center justify-center gap-1 bg-amber-50 text-amber-700 py-2 rounded-xl active:bg-amber-100 transition-colors border border-amber-200"
        >
          <Plus size={14} />
          <Beer size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDieLost(player.id); }}
          className="flex items-center justify-center gap-1 bg-red-50 text-red-700 py-2 rounded-xl active:bg-red-100 transition-colors border border-red-200"
        >
          <Plus size={14} />
          <Dice5 size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1 text-[9px] font-medium text-gray-500 uppercase text-center">
        <div>
          <div className="text-black font-bold text-xs">{player.stats.miss}</div>
          Miss
        </div>
        <div>
          <div className="text-black font-bold text-xs">{player.stats.validHit}</div>
          Hit
        </div>
        <div>
          <div className="text-black font-bold text-xs">{player.stats.catch}</div>
          Catch
        </div>
      </div>
    </div>
  );
};

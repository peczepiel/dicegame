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
  isSmall?: boolean;
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
  isSmall = false,
}) => {
  if (isSmall) {
    return (
      <div 
        onClick={() => isOffense && onSelectThrower?.(index)}
        className={`relative flex-1 p-2 rounded-lg border-2 transition-all duration-300 min-w-0 ${
          isCurrentThrower 
            ? `bg-white shadow-lg scale-110 z-10 border-2` 
            : 'border-gray-200 bg-white/70 hover:bg-white/90'
        } ${isOffense ? 'cursor-pointer' : ''}`}
        style={{ 
          borderColor: isCurrentThrower ? teamColor : '#e5e7eb',
          boxShadow: isCurrentThrower ? `0 0 0 3px ${teamColor}33` : undefined
        }}
      >
        {isCurrentThrower && (
          <div 
            className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-bold text-white uppercase tracking-widest whitespace-nowrap"
            style={{ backgroundColor: teamColor }}
          >
            Throwing
          </div>
        )}

        <div className="text-center">
          <h3 className="font-bold text-xs truncate">{player.name}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="flex items-center gap-0.5">
              <Beer size={12} className="text-amber-600" />
              <span className="text-amber-600 font-bold text-xs">{player.stats.beerTotal}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Dice5 size={12} className="text-red-600" />
              <span className="text-red-600 font-bold text-xs">{player.stats.lostDice}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-2">
          <button
            onClick={(e) => { e.stopPropagation(); onBeerAdd(player.id); }}
            className="flex-1 flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 p-1 rounded-md active:from-amber-200 transition-all border border-amber-200 hover:border-amber-300"
            title="Add Beer"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDieLost(player.id); }}
            className="flex-1 flex items-center justify-center bg-gradient-to-br from-red-100 to-red-50 text-red-700 p-1 rounded-md active:from-red-200 transition-all border border-red-200 hover:border-red-300"
            title="Lost Die"
          >
            <Minus size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => isOffense && onSelectThrower?.(index)}
      className={`relative flex-1 p-3 rounded-2xl border-2 transition-all duration-300 ${
        isCurrentThrower 
          ? `bg-white shadow-md scale-105 z-10` 
          : 'border-gray-200 bg-white/60'
      } ${isOffense ? 'cursor-pointer' : ''}`}
      style={{ borderColor: isCurrentThrower ? teamColor : '#e5e7eb' }}
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
        <div className="flex flex-col items-end gap-1">
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
          className="flex items-center justify-center gap-1 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 py-2 rounded-xl active:from-amber-200 transition-all border border-amber-200 hover:border-amber-300"
        >
          <Plus size={14} />
          <Beer size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDieLost(player.id); }}
          className="flex items-center justify-center gap-1 bg-gradient-to-br from-red-100 to-red-50 text-red-700 py-2 rounded-xl active:from-red-200 transition-all border border-red-200 hover:border-red-300"
        >
          <Minus size={14} />
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

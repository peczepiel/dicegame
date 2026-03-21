import React from 'react';
import { Beer, Dice5, Plus, Minus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  isOffense: boolean;
  isCurrentThrower: boolean;
  onBeerAdd: (playerId: string) => void;
  onDieLost: (playerId: string) => void;
  onSelectThrower?: (index: number) => void;
  index: number;
  teamId: 'A' | 'B';
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
  teamId,
  isSmall = false,
}) => {
  const teamRing = teamId === 'A' ? 'ring-team-a' : 'ring-team-b';
  const teamBadge = teamId === 'A' ? 'bg-team-a text-white' : 'bg-team-b text-white';

  if (isSmall) {
    return (
      <div
        onClick={() => isOffense && onSelectThrower?.(index)}
        className={cn(
          'relative flex-1 min-w-0 rounded-lg border bg-card p-2 transition-all',
          isOffense && 'cursor-pointer',
          isCurrentThrower ? `ring-2 ring-offset-2 ring-offset-background ${teamRing}` : 'border-border'
        )}
      >
        {isCurrentThrower && (
          <Badge className={cn('absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px]', teamBadge)}>
            Throwing
          </Badge>
        )}

        <div className="text-center">
          <h3 className="truncate text-xs font-semibold">{player.name}</h3>
          <div className="mt-1 flex items-center justify-center gap-2">
            <div className={cn('flex items-center gap-1 text-xs font-semibold', 'text-warning')}>
              <Beer size={12} />
              {player.stats.beerTotal}
            </div>
            <div className={cn('flex items-center gap-1 text-xs font-semibold', 'text-destructive')}>
              <Dice5 size={12} />
              {player.stats.lostDice}
            </div>
          </div>
        </div>

        <div className="mt-2 flex gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-full border-warning/30 bg-warning/10 text-warning hover:bg-warning/20"
            onClick={(e) => {
              e.stopPropagation();
              onBeerAdd(player.id);
            }}
            title="Add beer"
          >
            <Plus size={12} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-full border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
            onClick={(e) => {
              e.stopPropagation();
              onDieLost(player.id);
            }}
            title="Lost die"
          >
            <Minus size={12} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => isOffense && onSelectThrower?.(index)}
      className={cn(
        'relative flex-1 rounded-lg border bg-card p-3 shadow-sm transition-all',
        isOffense && 'cursor-pointer',
        isCurrentThrower ? `ring-2 ring-offset-2 ring-offset-background ${teamRing}` : 'border-border'
      )}
    >
      {isCurrentThrower && (
        <Badge className={cn('absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1', teamBadge)}>
          Throwing
        </Badge>
      )}

      <div className="mb-2 flex items-start justify-between">
        <h3 className="max-w-[90px] truncate text-base font-semibold">{player.name}</h3>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-sm font-semibold text-warning">
            <Beer size={14} />
            {player.stats.beerTotal}
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold text-destructive">
            <Dice5 size={14} />
            {player.stats.lostDice}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="border-warning/30 bg-warning/10 text-warning hover:bg-warning/20"
          onClick={(e) => {
            e.stopPropagation();
            onBeerAdd(player.id);
          }}
        >
          <Plus size={14} />
          <Beer size={16} />
        </Button>
        <Button
          variant="outline"
          className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
          onClick={(e) => {
            e.stopPropagation();
            onDieLost(player.id);
          }}
        >
          <Minus size={14} />
          <Dice5 size={16} />
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-medium uppercase text-muted-foreground">
        <div>
          <div className="text-sm font-semibold text-foreground">{player.stats.miss}</div>
          Miss
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{player.stats.validHit}</div>
          Hit
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{player.stats.catch}</div>
          Catch
        </div>
      </div>
    </div>
  );
};

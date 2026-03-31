import React, { useState, useEffect } from 'react';
import { GameState, ThrowResult, DefenseResult, Player } from '../types';
import { PlayerCard } from './PlayerCard';
import { Confetti } from './Confetti';
import { Undo2, RotateCcw, Trophy, ArrowUpDown, ArrowLeftRight, Beer, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { shouldTriggerRedemption, resolveRedemptionOutcome } from '../gameLogic';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GameScreenProps {
  gameState: GameState;
  onUpdate: (newState: GameState) => void;
  onReset: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState, onUpdate, onReset }) => {
  const [step, setStep] = useState<'OFFENSE' | 'DEFENSE' | 'FIFA' | 'PLUNK_DEFENSE'>('OFFENSE');
  const [currentThrowResult, setCurrentThrowResult] = useState<ThrowResult | null>(null);
  const [cupHit, setCupHit] = useState(false);
  const [fifaKickerId, setFifaKickerId] = useState<string | null>(null);
  const [fifaCatcherId, setFifaCatcherId] = useState<string | null>(null);
  const [defensePlayerId, setDefensePlayerId] = useState<string | null>(null);
  const [defenseResult, setDefenseResult] = useState<DefenseResult | null>(null);
  const [isStay, setIsStay] = useState(false);
  const [plunkDrinkerId, setPlunkDrinkerId] = useState<string | null>(null);
  const [isTeamAOnTop, setIsTeamAOnTop] = useState(true);
  const [beerNotification, setBeerNotification] = useState<{ teamName: string; teamId: 'A' | 'B' } | null>(null);
  const [gameStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - gameStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStartTime]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const offenseTeam = gameState.offenseTeamId === 'A' ? gameState.teamA : gameState.teamB;
  const defenseTeam = gameState.offenseTeamId === 'A' ? gameState.teamB : gameState.teamA;
  
  const topTeamId = isTeamAOnTop ? 'A' : 'B';
  const bottomTeamId = isTeamAOnTop ? 'B' : 'A';
  const topTeam = topTeamId === 'A' ? gameState.teamA : gameState.teamB;
  const bottomTeam = bottomTeamId === 'A' ? gameState.teamA : gameState.teamB;

  const createHistorySnapshot = (state: GameState) => {
    return JSON.stringify({ ...state, history: [] });
  };

  const saveHistory = () => {
    const history = [...gameState.history, createHistorySnapshot(gameState)];
    if (history.length > 20) history.shift();
    return history;
  };

  const undo = () => {
    if (gameState.history.length === 0) return;
    const lastState = JSON.parse(gameState.history[gameState.history.length - 1]) as GameState;
    lastState.history = gameState.history.slice(0, -1);
    onUpdate(lastState);
    setStep('OFFENSE');
    setCurrentThrowResult(null);
    setCupHit(false);
    setDefensePlayerId(null);
    setDefenseResult(null);
    setIsStay(false);
  };

  const handleBeerAdd = (playerId: string) => {
    const newState = { ...gameState, history: saveHistory() };
    const updatePlayer = (p: Player) => p.id === playerId ? { ...p, stats: { ...p.stats, beerTotal: p.stats.beerTotal + 0.5 } } : p;
    newState.teamA.players = newState.teamA.players.map(updatePlayer) as [Player, Player];
    newState.teamB.players = newState.teamB.players.map(updatePlayer) as [Player, Player];
    onUpdate(newState);
  };

  const handleDieLost = (playerId: string) => {
    const newState = { ...gameState, history: saveHistory() };
    const updatePlayer = (p: Player) => p.id === playerId ? { ...p, stats: { ...p.stats, lostDice: p.stats.lostDice + 1 } } : p;
    newState.teamA.players = newState.teamA.players.map(updatePlayer) as [Player, Player];
    newState.teamB.players = newState.teamB.players.map(updatePlayer) as [Player, Player];
    onUpdate(newState);
  };

  const swapTeamPlayers = (teamId: 'A' | 'B') => {
    const newState = { ...gameState, history: saveHistory() };
    const currentOffensePlayerId =
      gameState.offenseTeamId === teamId
        ? (teamId === 'A' ? gameState.teamA : gameState.teamB).players[gameState.currentThrowerIndex].id
        : null;

    if (teamId === 'A') {
      const [p1, p2] = newState.teamA.players;
      newState.teamA.players = [p2, p1];
    } else {
      const [p1, p2] = newState.teamB.players;
      newState.teamB.players = [p2, p1];
    }

    if (currentOffensePlayerId) {
      const updatedOffenseTeam = teamId === 'A' ? newState.teamA : newState.teamB;
      const newIndex = updatedOffenseTeam.players.findIndex(p => p.id === currentOffensePlayerId);
      if (newIndex !== -1) {
        newState.currentThrowerIndex = newIndex;
      }
    }

    onUpdate(newState);
  };

  const checkBeerPenalties = (state: GameState) => {
    const midpoint = state.isOvertime ? Infinity : Math.ceil(state.targetScore / 2);
    const final = state.isOvertime ? Infinity : state.targetScore;

    let newState = { ...state };
    let penaltyTriggered: { teamName: string; teamId: 'A' | 'B' } | null = null;

    if (!newState.teamAMidpointTriggered && newState.teamA.score >= midpoint) {
      newState.teamB.players = newState.teamB.players.map(p => ({
        ...p, stats: { ...p.stats, beerTotal: p.stats.beerTotal + 0.5 }
      })) as [Player, Player];
      newState.teamAMidpointTriggered = true;
      penaltyTriggered = { teamName: newState.teamB.name, teamId: 'B' };
    }
    if (!newState.teamAFinalTriggered && newState.teamA.score >= final) {
      newState.teamB.players = newState.teamB.players.map(p => ({
        ...p, stats: { ...p.stats, beerTotal: p.stats.beerTotal + 0.5 }
      })) as [Player, Player];
      newState.teamAFinalTriggered = true;
      // Don't show notification for final score, only for midpoint
    }

    if (!newState.teamBMidpointTriggered && newState.teamB.score >= midpoint) {
      newState.teamA.players = newState.teamA.players.map(p => ({
        ...p, stats: { ...p.stats, beerTotal: p.stats.beerTotal + 0.5 }
      })) as [Player, Player];
      newState.teamBMidpointTriggered = true;
      penaltyTriggered = { teamName: newState.teamA.name, teamId: 'A' };
    }
    if (!newState.teamBFinalTriggered && newState.teamB.score >= final) {
      newState.teamA.players = newState.teamA.players.map(p => ({
        ...p, stats: { ...p.stats, beerTotal: p.stats.beerTotal + 0.5 }
      })) as [Player, Player];
      newState.teamBFinalTriggered = true;
      // Don't show notification for final score, only for midpoint
    }

    if (penaltyTriggered) {
      setBeerNotification(penaltyTriggered);
    }

    return newState;
  };

  const resolveThrow = () => {
    let newState = { ...gameState, history: saveHistory() };
    const thrower = offenseTeam.players[gameState.currentThrowerIndex];
    const offTeam = newState.offenseTeamId === 'A' ? newState.teamA : newState.teamB;
    const defTeam = newState.offenseTeamId === 'A' ? newState.teamB : newState.teamA;

    const updatedThrower = { ...thrower };
    if (currentThrowResult === ThrowResult.MISS) updatedThrower.stats.miss++;
    if (currentThrowResult === ThrowResult.VALID_HIT) updatedThrower.stats.validHit++;
    if (currentThrowResult === ThrowResult.PLUNK) updatedThrower.stats.plunk++;
    if (currentThrowResult === ThrowResult.VALID_HIT && isStay) updatedThrower.stats.stay++;
    offTeam.players[gameState.currentThrowerIndex] = updatedThrower;

    if (currentThrowResult === ThrowResult.PLUNK) {
      offTeam.score += 3;
      if (plunkDrinkerId) {
        defTeam.players = defTeam.players.map(p => 
          p.id === plunkDrinkerId ? { ...p, stats: { ...p.stats, beerTotal: p.stats.beerTotal + 0.5 } } : p
        ) as [Player, Player];
      }
    } else if (currentThrowResult === ThrowResult.VALID_HIT) {
      let scored = false;

      if (!isStay && defensePlayerId && defenseResult) {
        if (defenseResult === DefenseResult.WHIFF || defenseResult === DefenseResult.FAIL) scored = true;

        defTeam.players = defTeam.players.map(p => {
          if (p.id !== defensePlayerId) return p;
          const updated = { ...p };
          if (defenseResult === DefenseResult.WHIFF) updated.stats.whiff++;
          if (defenseResult === DefenseResult.FAIL) updated.stats.fail++;
          if (defenseResult === DefenseResult.STAY) updated.stats.stay++;
          if (defenseResult === DefenseResult.CATCH) updated.stats.catch++;
          return updated;
        }) as [Player, Player];
      }

      if (scored) {
        offTeam.score += cupHit ? 2 : 1;
      }
    } else if (currentThrowResult === ThrowResult.MISS) {
      if (fifaKickerId && fifaCatcherId) {
        defTeam.score += 1;
      }
      if (fifaKickerId) {
        defTeam.players = defTeam.players.map(p => p.id === fifaKickerId ? { ...p, stats: { ...p.stats, fifaKick: p.stats.fifaKick + 1 } } : p) as [Player, Player];
      }
      if (fifaCatcherId) {
        defTeam.players = defTeam.players.map(p => p.id === fifaCatcherId ? { ...p, stats: { ...p.stats, fifaCatch: p.stats.fifaCatch + 1 } } : p) as [Player, Player];
      }
    }

    if (!newState.isOvertime && newState.teamA.score >= newState.targetScore && newState.teamB.score >= newState.targetScore) {
      newState.isOvertime = true;
    }

    if (!newState.isOvertime) {
      newState = checkBeerPenalties(newState);
    }

    const isRedemptionPlunkBonus = newState.phase === 'redemption' && currentThrowResult === ThrowResult.PLUNK;

    if (!isRedemptionPlunkBonus) {
      newState.throwsInPossession++;
      if (newState.throwsInPossession >= 2) {
        if (newState.phase === 'redemption') {
          const outcome = resolveRedemptionOutcome(
            newState.teamA.score,
            newState.teamB.score,
            newState.targetScore,
            newState.redemptionLeader!,
            newState.redemptionTrailer!
          );

          if (outcome.gameOver) {
            newState.phase = 'gameOver';
            newState.winner = outcome.winner;
          } else {
            newState.phase = 'normal';
            newState.redemptionLeader = null;
            newState.redemptionTrailer = null;
            newState.throwsInPossession = 0;
            newState.offenseTeamId = newState.offenseTeamId === 'A' ? 'B' : 'A';
            newState.currentThrowerIndex = 0;
          }
        } else {
          const redemptionCheck = shouldTriggerRedemption(
            newState.teamA.score,
            newState.teamB.score,
            newState.targetScore
          );

          if (redemptionCheck.trigger) {
            newState.phase = 'redemption';
            newState.redemptionLeader = redemptionCheck.leader;
            newState.redemptionTrailer = redemptionCheck.trailer;
            newState.offenseTeamId = redemptionCheck.trailer!;
            newState.throwsInPossession = 0;
            newState.currentThrowerIndex = 0;
          } else {
            newState.throwsInPossession = 0;
            newState.offenseTeamId = newState.offenseTeamId === 'A' ? 'B' : 'A';
            newState.currentThrowerIndex = 0;
          }
        }
      } else {
        newState.currentThrowerIndex = (newState.currentThrowerIndex + 1) % 2;
      }
    }

    onUpdate(newState);
    setStep('OFFENSE');
    setCurrentThrowResult(null);
    setCupHit(false);
    setFifaKickerId(null);
    setFifaCatcherId(null);
    setDefensePlayerId(null);
    setDefenseResult(null);
    setIsStay(false);
    setPlunkDrinkerId(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-app">
      
      {/* Header (Top Scoreboard) */}
      <header className="px-4 pt-6 pb-2 z-20">
        <Card className="mx-auto w-full max-w-md border-border/60 bg-card/95 shadow-md">
          <div className="flex items-center justify-between p-3">
            <Button variant="ghost" size="icon" onClick={undo} className="rounded-full">
              <Undo2 size={18} className="text-muted-foreground" />
            </Button>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${topTeamId === 'A' ? 'text-team-a' : 'text-team-b'}`}>
                  {topTeam.name}
                </div>
                <div className={`text-3xl font-semibold leading-none ${topTeamId === 'A' ? 'text-team-a' : 'text-team-b'}`}>
                  {topTeamId === 'A' ? gameState.teamA.score : gameState.teamB.score}
                </div>
              </div>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsTeamAOnTop(prev => !prev)}
                className="rounded-full"
                title="Swap team positions"
              >
                <ArrowUpDown size={16} className="text-muted-foreground" />
              </Button>
              <div className="text-center">
                <div className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${bottomTeamId === 'A' ? 'text-team-a' : 'text-team-b'}`}>
                  {bottomTeam.name}
                </div>
                <div className={`text-3xl font-semibold leading-none ${bottomTeamId === 'A' ? 'text-team-a' : 'text-team-b'}`}>
                  {bottomTeamId === 'A' ? gameState.teamA.score : gameState.teamB.score}
                </div>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={onReset} className="rounded-full">
              <RotateCcw size={18} className="text-muted-foreground" />
            </Button>
          </div>
        </Card>

        <div className="mx-auto mt-2 flex w-full max-w-md flex-col gap-2">
          {gameState.isOvertime && (
            <Badge variant="warning" className="justify-center rounded-md py-1">
              Overtime
            </Badge>
          )}
          {gameState.phase === 'redemption' && (
            <Badge className="justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive">
              Redemption: {gameState.redemptionTrailer === 'A' ? gameState.teamA.name : gameState.teamB.name} within 1 pt
            </Badge>
          )}
          <Badge className="justify-center rounded-md gap-2 bg-muted/50 py-1">
            <Clock size={14} className="text-muted-foreground" />
            <span className="font-mono text-sm text-foreground">{formatTime(elapsedSeconds)}</span>
          </Badge>
        </div>
      </header>

      {/* Main Game Layout */}
      <main className={`flex-1 flex flex-col p-4 max-w-md mx-auto w-full relative min-h-0 transition-opacity ${gameState.phase === 'gameOver' ? 'opacity-40 pointer-events-none' : ''}`}>
        
        {/* TOP ROW: Top Team Players */}
        <div className="flex items-center justify-between w-full z-10">
          <div className="flex-1 flex justify-center max-w-[45%]">
            <PlayerCard
              player={topTeam.players[0]}
              index={0}
              isOffense={gameState.offenseTeamId === topTeamId}
              isCurrentThrower={gameState.offenseTeamId === topTeamId && gameState.currentThrowerIndex === 0}
              teamId={topTeamId}
              onBeerAdd={handleBeerAdd}
              onDieLost={handleDieLost}
              onSelectThrower={gameState.offenseTeamId === topTeamId ? (i) => onUpdate({ ...gameState, currentThrowerIndex: i }) : undefined}
              isSmall={true}
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => swapTeamPlayers(topTeamId)}
            className="mx-2 rounded-full"
            title={`Swap Team ${topTeamId} player positions`}
          >
            <ArrowLeftRight size={14} className="text-muted-foreground" />
          </Button>
          <div className="flex-1 flex justify-center max-w-[45%]">
            <PlayerCard
              player={topTeam.players[1]}
              index={1}
              isOffense={gameState.offenseTeamId === topTeamId}
              isCurrentThrower={gameState.offenseTeamId === topTeamId && gameState.currentThrowerIndex === 1}
              teamId={topTeamId}
              onBeerAdd={handleBeerAdd}
              onDieLost={handleDieLost}
              onSelectThrower={gameState.offenseTeamId === topTeamId ? (i) => onUpdate({ ...gameState, currentThrowerIndex: i }) : undefined}
              isSmall={true}
            />
          </div>
        </div>

        {/* CENTER TABLE (Skinny Rectangle) */}
        <div className="relative mx-auto my-6 flex min-h-[300px] w-[60%] max-w-[240px] flex-1 flex-col items-center justify-center rounded-lg border-4 border-border bg-card shadow-md">
          {/* Horizontal Center Line */}
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-muted-foreground/10 -translate-y-1/2" />
          
          {/* Floating Control Boxes */}
          <AnimatePresence mode="wait">
            {gameState.phase !== 'gameOver' && step === 'OFFENSE' && (
              <motion.div
                key="offense"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-20 w-[85vw] max-w-[340px] rounded-lg border bg-card p-5 text-center shadow-lg"
              >
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Throw Result</div>

                <div className="flex w-full gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => { setCurrentThrowResult(ThrowResult.MISS); setStep("FIFA"); }}
                  >
                    Miss
                  </Button>
                  <Button
                    variant="success"
                    className="flex-1"
                    onClick={() => { setCurrentThrowResult(ThrowResult.VALID_HIT); setStep("DEFENSE"); }}
                  >
                    Hit
                  </Button>
                  <Button
                    variant="warning"
                    className="flex-1"
                    onClick={() => { setCurrentThrowResult(ThrowResult.PLUNK); setStep("PLUNK_DEFENSE"); }}
                  >
                    Plunk
                  </Button>
                </div>

                <div className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-full border bg-muted/50 px-4 py-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Cup</span>
                  <Switch checked={cupHit} onCheckedChange={setCupHit} />
                </div>
              </motion.div>
            )}

            {/* DEFENSE STEP */}
            {gameState.phase !== 'gameOver' && step === 'DEFENSE' && (
              <motion.div
                key="defense"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className="relative z-20 w-[85vw] max-w-[340px] rounded-lg border bg-card p-5 shadow-lg"
              >
                <div className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Defense</div>
                <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Choose One Defender Outcome
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  {defenseTeam.players.map(p => (
                    <div key={p.id} className="space-y-1 rounded-md border bg-muted/30 p-2">
                      <div className="text-center text-xs font-semibold text-foreground/80">{p.name}</div>
                      <div className="flex flex-col gap-1">
                        {[DefenseResult.WHIFF, DefenseResult.FAIL, DefenseResult.CATCH].map(res => (
                          <Button
                            key={res}
                            size="sm"
                            variant="outline"
                            disabled={isStay}
                            onClick={() => {
                              const isSame = defensePlayerId === p.id && defenseResult === res;
                              setDefensePlayerId(isSame ? null : p.id);
                              setDefenseResult(isSame ? null : res);
                            }}
                            className={`h-7 text-[10px] uppercase tracking-widest ${
                              defensePlayerId === p.id && defenseResult === res
                                ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'bg-card text-foreground hover:bg-muted'
                            } ${isStay ? 'opacity-40' : ''}`}
                          >
                            {res}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant={isStay ? 'warning' : 'outline'}
                  className="mb-3 w-full"
                  onClick={() => {
                    setIsStay(!isStay);
                    setDefensePlayerId(null);
                    setDefenseResult(null);
                  }}
                >
                  Stay
                </Button>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep('OFFENSE')}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={() => resolveThrow()}>
                    OK
                  </Button>
                </div>
              </motion.div>
            )}

            {/* PLUNK STEP */}
            {gameState.phase !== 'gameOver' && step === 'PLUNK_DEFENSE' && (
              <motion.div
                key="plunk"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-20 w-[85vw] max-w-[340px] space-y-4 rounded-lg border bg-card p-5 text-center shadow-lg"
              >
                <div>
                  <div className="text-lg font-semibold uppercase tracking-[0.3em] text-warning">Plunk</div>
                  <p className="text-sm text-muted-foreground">Who drinks?</p>
                </div>
                <div className="flex gap-2">
                  {defenseTeam.players.map(p => (
                    <Button
                      key={p.id}
                      variant="outline"
                      className={`flex-1 ${
                        plunkDrinkerId === p.id
                          ? 'border-warning bg-warning/20 text-warning'
                          : 'bg-card text-foreground'
                      }`}
                      onClick={() => setPlunkDrinkerId(p.id)}
                    >
                      {p.name}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep('OFFENSE')}>
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!plunkDrinkerId}
                    onClick={() => resolveThrow()}
                  >
                    OK
                  </Button>
                </div>
              </motion.div>
            )}

            {/* FIFA STEP */}
            {gameState.phase !== 'gameOver' && step === 'FIFA' && (
              <motion.div
                key="fifa"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className="relative z-20 w-[85vw] max-w-[340px] rounded-lg border bg-card p-5 shadow-lg"
              >
                <div className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Fifa</div>
                <div className="mb-4 space-y-3">
                  <div className="rounded-md border bg-muted/30 p-2">
                    <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Kick</div>
                    <div className="flex gap-2">
                      {defenseTeam.players.map(p => (
                        <Button
                          key={p.id}
                          variant="outline"
                          className={`flex-1 ${
                            fifaKickerId === p.id
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'bg-card text-foreground'
                          }`}
                          onClick={() => setFifaKickerId(fifaKickerId === p.id ? null : p.id)}
                        >
                          {p.name.split(' ')[0]}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-2">
                    <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Catch</div>
                    <div className="flex gap-2">
                      {defenseTeam.players.map(p => (
                        <Button
                          key={p.id}
                          variant="outline"
                          className={`flex-1 ${
                            fifaCatcherId === p.id
                              ? 'border-success bg-success text-white'
                              : 'bg-card text-foreground'
                          }`}
                          onClick={() => setFifaCatcherId(fifaCatcherId === p.id ? null : p.id)}
                        >
                          {p.name.split(' ')[0]}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep('OFFENSE')}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={() => resolveThrow()}>
                    OK
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* BOTTOM ROW: Bottom Team Players */}
        <div className="flex items-center justify-between w-full z-10">
          <div className="flex-1 flex justify-center max-w-[45%]">
            <PlayerCard
              player={bottomTeam.players[0]}
              index={0}
              isOffense={gameState.offenseTeamId === bottomTeamId}
              isCurrentThrower={gameState.offenseTeamId === bottomTeamId && gameState.currentThrowerIndex === 0}
              teamId={bottomTeamId}
              onBeerAdd={handleBeerAdd}
              onDieLost={handleDieLost}
              onSelectThrower={gameState.offenseTeamId === bottomTeamId ? (i) => onUpdate({ ...gameState, currentThrowerIndex: i }) : undefined}
              isSmall={true}
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => swapTeamPlayers(bottomTeamId)}
            className="mx-2 rounded-full"
            title={`Swap Team ${bottomTeamId} player positions`}
          >
            <ArrowLeftRight size={14} className="text-muted-foreground" />
          </Button>
          <div className="flex-1 flex justify-center max-w-[45%]">
            <PlayerCard
              player={bottomTeam.players[1]}
              index={1}
              isOffense={gameState.offenseTeamId === bottomTeamId}
              isCurrentThrower={gameState.offenseTeamId === bottomTeamId && gameState.currentThrowerIndex === 1}
              teamId={bottomTeamId}
              onBeerAdd={handleBeerAdd}
              onDieLost={handleDieLost}
              onSelectThrower={gameState.offenseTeamId === bottomTeamId ? (i) => onUpdate({ ...gameState, currentThrowerIndex: i }) : undefined}
              isSmall={true}
            />
          </div>
        </div>

      </main>

      {/* Beer Notification Dialog */}
      <Dialog open={beerNotification !== null} onOpenChange={(open) => !open && setBeerNotification(null)}>
        <DialogContent className="max-w-sm bg-destructive/95 border-destructive" showClose={true}>
          <DialogHeader className="items-center text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 10 }}
              className="mb-4"
            >
              <Beer size={64} className="text-yellow-300" />
            </motion.div>
            <DialogTitle className="text-2xl font-bold text-white">
              Cheers! 🍺
            </DialogTitle>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 rounded-lg border-2 border-yellow-300/50 bg-white/10 px-6 py-4 text-center backdrop-blur-sm"
          >
            <p className="text-xl font-bold text-white">
              {beerNotification?.teamName} needs to drink!
            </p>
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex justify-center gap-3 mt-6"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Beer size={32} className="text-yellow-300" />
            </motion.div>
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
            >
              <Beer size={32} className="text-yellow-300" />
            </motion.div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
            >
              <Beer size={32} className="text-yellow-300" />
            </motion.div>
          </motion.div>
          <DialogFooter className="mt-6">
            <Button 
              className="w-full bg-yellow-300 text-black hover:bg-yellow-400" 
              onClick={() => setBeerNotification(null)}
            >
              Cheers! 🍻
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameState.phase === 'gameOver' && <Confetti />}
      </AnimatePresence>
      <Dialog open={gameState.phase === 'gameOver'}>
        <DialogContent
          showClose={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className="max-w-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <DialogHeader className="items-center text-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <DialogTitle className="flex items-center justify-center gap-2 text-lg">
                  <Trophy size={18} className="text-success" />
                  Game Over
                </DialogTitle>
              </motion.div>
            </DialogHeader>
            <motion.div
              className="mt-4 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-center text-base font-semibold text-success"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {gameState.winner === 'A' ? gameState.teamA.name : gameState.teamB.name} Wins!
            </motion.div>
            <motion.div
              className="mt-4 flex justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -10, 0], scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 0.6,
                    delay: 0.5 + i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 1.5,
                  }}
                  className="text-2xl"
                >
                  🎉
                </motion.div>
              ))}
            </motion.div>
            <DialogFooter className="mt-6">
              <Button className="w-full" onClick={onReset}>
                New Game
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

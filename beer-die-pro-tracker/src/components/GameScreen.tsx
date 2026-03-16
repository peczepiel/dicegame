import React, { useState } from 'react';
import { GameState, ThrowResult, DefenseResult, Player } from '../types';
import { PlayerCard } from './PlayerCard';
import { Undo2, RotateCcw, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { shouldTriggerRedemption, resolveRedemptionOutcome } from '../gameLogic';

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
  const [defenseSelections, setDefenseSelections] = useState<Record<string, DefenseResult | null>>({});
  const [isStay, setIsStay] = useState(false);
  const [plunkDrinkerId, setPlunkDrinkerId] = useState<string | null>(null);

  const offenseTeam = gameState.offenseTeamId === 'A' ? gameState.teamA : gameState.teamB;
  const defenseTeam = gameState.offenseTeamId === 'A' ? gameState.teamB : gameState.teamA;
  
  // Static colors for fixed sides
  const teamAColor = '#0066FF';
  const teamBColor = '#FF3333';
  const isTeamAOffense = gameState.offenseTeamId === 'A';

  const saveHistory = () => {
    const history = [...gameState.history, JSON.stringify(gameState)];
    if (history.length > 20) history.shift();
    return history;
  };

  const undo = () => {
    if (gameState.history.length === 0) return;
    const lastState = JSON.parse(gameState.history[gameState.history.length - 1]);
    onUpdate(lastState);
    setStep('OFFENSE');
    setCurrentThrowResult(null);
    setCupHit(false);
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

  const checkBeerPenalties = (state: GameState) => {
    const midpoint = state.isOvertime ? Infinity : Math.ceil(state.targetScore / 2);
    const final = state.isOvertime ? Infinity : state.targetScore;

    let newState = { ...state };

    if (!newState.teamAMidpointTriggered && newState.teamA.score >= midpoint) {
      newState.teamB.players = newState.teamB.players.map(p => ({
        ...p, stats: { ...p.stats, beerTotal: p.stats.beerTotal + 0.5 }
      })) as [Player, Player];
      newState.teamAMidpointTriggered = true;
    }
    if (!newState.teamAFinalTriggered && newState.teamA.score >= final) {
      newState.teamB.players = newState.teamB.players.map(p => ({
        ...p, stats: { ...p.stats, beerTotal: p.stats.beerTotal + 0.5 }
      })) as [Player, Player];
      newState.teamAFinalTriggered = true;
    }

    if (!newState.teamBMidpointTriggered && newState.teamB.score >= midpoint) {
      newState.teamA.players = newState.teamA.players.map(p => ({
        ...p, stats: { ...p.stats, beerTotal: p.stats.beerTotal + 0.5 }
      })) as [Player, Player];
      newState.teamBMidpointTriggered = true;
    }
    if (!newState.teamBFinalTriggered && newState.teamB.score >= final) {
      newState.teamA.players = newState.teamA.players.map(p => ({
        ...p, stats: { ...p.stats, beerTotal: p.stats.beerTotal + 0.5 }
      })) as [Player, Player];
      newState.teamBFinalTriggered = true;
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

      if (isStay) {
        defTeam.players = defTeam.players.map(p => ({
          ...p, stats: { ...p.stats, stay: p.stats.stay + 1 }
        })) as [Player, Player];
      } else {
        Object.entries(defenseSelections).forEach(([pid, res]) => {
          if (!res) return;
          if (res === DefenseResult.WHIFF || res === DefenseResult.FAIL) scored = true;
          
          defTeam.players = defTeam.players.map(p => {
            if (p.id !== pid) return p;
            const updated = { ...p };
            if (res === DefenseResult.WHIFF) updated.stats.whiff++;
            if (res === DefenseResult.FAIL) updated.stats.fail++;
            if (res === DefenseResult.STAY) updated.stats.stay++;
            if (res === DefenseResult.CATCH) updated.stats.catch++;
            return updated;
          }) as [Player, Player];
        });
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
    setDefenseSelections({});
    setIsStay(false);
    setPlunkDrinkerId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 overflow-hidden">
      
      {/* Header (Top Scoreboard) */}
      <header className="px-4 pt-6 pb-2 z-20">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-3 flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] max-w-md mx-auto w-full">
          <button onClick={undo} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full active:scale-95 transition-all">
            <Undo2 size={18} className="text-gray-600" />
          </button>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Team A</div>
              <div className="text-3xl font-black text-sky-600 leading-none">{gameState.teamA.score}</div>
            </div>
            <div className="text-xl font-bold text-gray-300">–</div>
            <div className="text-center">
              <div className="text-[10px] font-black text-red-500 uppercase tracking-widest">Team B</div>
              <div className="text-3xl font-black text-red-500 leading-none">{gameState.teamB.score}</div>
            </div>
          </div>

          <button onClick={onReset} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full active:scale-95 transition-all">
            <RotateCcw size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Status Indicators */}
        <div className="max-w-md mx-auto">
          {gameState.isOvertime && (
            <div className="bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 text-[10px] font-bold py-1.5 px-3 rounded-lg text-center uppercase tracking-widest border border-amber-300 mt-2 shadow-sm">
              ⚡ Overtime
            </div>
          )}
          {gameState.phase === 'redemption' && (
            <div className="bg-gradient-to-r from-red-100 to-red-50 text-red-800 text-[9px] font-bold py-2 px-3 rounded-lg text-center uppercase tracking-widest border border-red-300 mt-2 shadow-sm">
              Redemption: Team {gameState.redemptionTrailer} within 1 pt
            </div>
          )}
        </div>
      </header>

      {/* Main Game Layout */}
      <main className={`flex-1 flex flex-col p-4 max-w-md mx-auto w-full relative min-h-0 transition-opacity ${gameState.phase === 'gameOver' ? 'opacity-40 pointer-events-none' : ''}`}>
        
        {/* TOP ROW: Team A Players */}
        <div className="flex justify-between w-full z-10">
          {gameState.teamA.players.map((p, idx) => (
            <div key={p.id} className="flex-1 flex justify-center max-w-[45%]">
              <PlayerCard
                player={p}
                index={idx}
                isOffense={isTeamAOffense}
                isCurrentThrower={isTeamAOffense && gameState.currentThrowerIndex === idx}
                teamColor={teamAColor}
                onBeerAdd={handleBeerAdd}
                onDieLost={handleDieLost}
                onSelectThrower={isTeamAOffense ? (i) => onUpdate({ ...gameState, currentThrowerIndex: i }) : undefined}
                isSmall={true}
              />
            </div>
          ))}
        </div>

        {/* CENTER TABLE (Skinny Rectangle) */}
        <div className="flex-1 w-[60%] max-w-[240px] my-6 bg-slate-50 rounded-lg border-[8px] border-slate-300 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative flex flex-col items-center justify-center min-h-[300px] z-10 mx-auto">
          {/* Horizontal Center Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-200 transform -translate-y-1/2" />
          
          {/* Floating Control Boxes */}
          <AnimatePresence mode="wait">
            {gameState.phase !== 'gameOver' && step === 'OFFENSE' && (
              <motion.div 
                key="offense"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-slate-100 p-5 w-[85vw] max-w-[340px] relative z-20 text-center"
              >
                <div className="text-lg font-black text-gray-800 uppercase tracking-widest mb-4">Throw Result</div>
                
                <div className="flex gap-2 justify-center w-full">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setCurrentThrowResult(ThrowResult.MISS); setStep('FIFA'); }}
                    className="flex-1 py-3 bg-gray-500 text-white rounded-xl font-bold text-sm shadow-md"
                  >
                    Miss
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setCurrentThrowResult(ThrowResult.VALID_HIT); setStep('DEFENSE'); }}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md"
                  >
                    Hit
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setCurrentThrowResult(ThrowResult.PLUNK); setStep('PLUNK_DEFENSE'); }}
                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm shadow-md"
                  >
                    Plunk
                  </motion.button>
                </div>

                <div className="flex items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-gray-200 w-fit mx-auto mt-4 shadow-inner">
                  <span className="text-sm font-semibold text-gray-700">Cup?</span>
                  <button 
                    onClick={() => setCupHit(!cupHit)}
                    className={`w-10 h-5 rounded-full transition-all relative shadow-inner ${cupHit ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  >
                    <motion.div 
                      initial={false}
                      animate={{ x: cupHit ? 20 : 2 }}
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md"
                    />
                  </button>
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
                className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-slate-100 p-5 w-[85vw] max-w-[340px] relative z-20"
              >
                <div className="text-sm font-black text-gray-800 uppercase tracking-widest text-center mb-3">Defense</div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {defenseTeam.players.map(p => (
                    <div key={p.id} className="space-y-1 bg-slate-50 p-2 rounded-xl border border-gray-200">
                      <div className="text-xs font-bold text-gray-700 text-center">{p.name}</div>
                      <div className="flex flex-col gap-1">
                        {[DefenseResult.WHIFF, DefenseResult.FAIL, DefenseResult.CATCH].map(res => (
                          <button
                            key={res}
                            disabled={isStay}
                            onClick={() => setDefenseSelections(prev => ({
                              ...prev, [p.id]: prev[p.id] === res ? null : res
                            }))}
                            className={`py-1.5 rounded-lg font-bold text-xs border transition-all ${
                              defenseSelections[p.id] === res 
                                ? 'bg-sky-500 border-sky-600 text-white shadow-inner' 
                                : 'bg-white border-gray-300 text-gray-600'
                            } ${isStay ? 'opacity-40' : ''}`}
                          >
                            {res}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setIsStay(!isStay); setDefenseSelections({}); }}
                  className={`w-full py-2 mb-3 rounded-xl font-bold text-sm border transition-all ${
                    isStay ? 'bg-amber-500 border-amber-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600'
                  }`}
                >
                  STAY
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setStep('OFFENSE')} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 rounded-xl font-bold text-sm transition-colors">
                    Back
                  </button>
                  <button onClick={() => resolveThrow()} className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors">
                    OK
                  </button>
                </div>
              </motion.div>
            )}

            {/* PLUNK STEP */}
            {gameState.phase !== 'gameOver' && step === 'PLUNK_DEFENSE' && (
              <motion.div 
                key="plunk"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-slate-100 p-5 w-[85vw] max-w-[340px] relative z-20 text-center space-y-4"
              >
                <div>
                  <div className="text-amber-500 font-black text-2xl uppercase tracking-widest">PLUNK!</div>
                  <p className="text-gray-600 text-sm font-semibold">Who drinks?</p>
                </div>
                <div className="flex gap-2 justify-center">
                  {defenseTeam.players.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPlunkDrinkerId(p.id)}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                        plunkDrinkerId === p.id ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-slate-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setStep('OFFENSE')} className="flex-1 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-xl font-bold text-sm">
                    Back
                  </button>
                  <button
                    disabled={!plunkDrinkerId}
                    onClick={() => resolveThrow()}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm shadow-md transition-all ${
                      plunkDrinkerId ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    OK
                  </button>
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
                className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-slate-100 p-5 w-[85vw] max-w-[340px] relative z-20"
              >
                <div className="text-sm font-black text-gray-800 uppercase text-center tracking-widest mb-3">FIFA</div>
                <div className="space-y-3 mb-4">
                  <div className="bg-slate-50 p-2 rounded-xl border border-gray-200">
                    <div className="text-xs font-bold text-gray-700 mb-1 text-center">Kick</div>
                    <div className="flex gap-2">
                      {defenseTeam.players.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setFifaKickerId(fifaKickerId === p.id ? null : p.id)}
                          className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-all ${
                            fifaKickerId === p.id ? 'bg-sky-500 border-sky-600 text-white shadow-inner' : 'bg-white border-gray-300 text-gray-600'
                          }`}
                        >
                          {p.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-gray-200">
                    <div className="text-xs font-bold text-gray-700 mb-1 text-center">Catch</div>
                    <div className="flex gap-2">
                      {defenseTeam.players.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setFifaCatcherId(fifaCatcherId === p.id ? null : p.id)}
                          className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-all ${
                            fifaCatcherId === p.id ? 'bg-emerald-500 border-emerald-600 text-white shadow-inner' : 'bg-white border-gray-300 text-gray-600'
                          }`}
                        >
                          {p.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep('OFFENSE')} className="flex-1 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-xl font-bold text-sm">
                    Back
                  </button>
                  <button onClick={() => resolveThrow()} className="flex-1 py-2 bg-sky-600 text-white rounded-xl font-bold text-sm shadow-md">
                    OK
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* BOTTOM ROW: Team B Players */}
        <div className="flex justify-between w-full z-10">
          {gameState.teamB.players.map((p, idx) => (
            <div key={p.id} className="flex-1 flex justify-center max-w-[45%]">
              <PlayerCard
                player={p}
                index={idx}
                isOffense={!isTeamAOffense}
                isCurrentThrower={!isTeamAOffense && gameState.currentThrowerIndex === idx}
                teamColor={teamBColor}
                onBeerAdd={handleBeerAdd}
                onDieLost={handleDieLost}
                onSelectThrower={!isTeamAOffense ? (i) => onUpdate({ ...gameState, currentThrowerIndex: i }) : undefined}
                isSmall={true}
              />
            </div>
          ))}
        </div>

      </main>

      {/* Game Over Overlay */}
      {gameState.phase === 'gameOver' && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto">
          <motion.div
            key="gameover"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-slate-100 p-5 w-[85vw] max-w-[340px] text-center"
          >
            <div className="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-200 mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy size={20} className="text-emerald-500" />
                <span className="text-sm font-black text-emerald-700 uppercase tracking-widest">Game Over</span>
              </div>
              <div className="text-2xl font-black text-emerald-800">Team {gameState.winner} Wins!</div>
            </div>
            <button onClick={onReset} className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm shadow-lg">
              New Game
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
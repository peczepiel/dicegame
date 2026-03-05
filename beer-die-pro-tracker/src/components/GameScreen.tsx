import React, { useState, useEffect } from 'react';
import { GameState, ThrowResult, DefenseResult, Player } from '../types';
import { PlayerCard } from './PlayerCard';
import { Undo2, RotateCcw, ChevronRight, Check, X, Trophy } from 'lucide-react';
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
  const teamColorA = '#007AFF';
  const teamColorB = '#FF3B30';
  const offenseColor = gameState.offenseTeamId === 'A' ? teamColorA : teamColorB;
  const defenseColor = gameState.offenseTeamId === 'A' ? teamColorB : teamColorA;

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

    // Check Team A triggers
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

    // Check Team B triggers
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

    // Update thrower stats
    const updatedThrower = { ...thrower };
    if (currentThrowResult === ThrowResult.MISS) updatedThrower.stats.miss++;
    if (currentThrowResult === ThrowResult.VALID_HIT) updatedThrower.stats.validHit++;
    if (currentThrowResult === ThrowResult.PLUNK) updatedThrower.stats.plunk++;
    offTeam.players[gameState.currentThrowerIndex] = updatedThrower;

    // Scoring & Defense Stats
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

    // Check Overtime
    if (!newState.isOvertime && newState.teamA.score >= newState.targetScore && newState.teamB.score >= newState.targetScore) {
      newState.isOvertime = true;
    }

    // Apply Beer Penalties (if not OT)
    if (!newState.isOvertime) {
      newState = checkBeerPenalties(newState);
    }

    // Advance Thrower/Possession Logic
    const isRedemptionPlunkBonus = newState.phase === 'redemption' && currentThrowResult === ThrowResult.PLUNK;

    if (isRedemptionPlunkBonus) {
      // Bonus throw: same player throws again, possession doesn't advance
      // No changes to throwsInPossession or currentThrowerIndex
    } else {
      newState.throwsInPossession++;
      if (newState.throwsInPossession >= 2) {
        // Possession finished - Check Win/Redemption
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
            // Redemption successful (gap closed to 0 or 1) - Continue normal play
            newState.phase = 'normal';
            newState.redemptionLeader = null;
            newState.redemptionTrailer = null;
            // Switch possession normally
            newState.throwsInPossession = 0;
            newState.offenseTeamId = newState.offenseTeamId === 'A' ? 'B' : 'A';
            newState.currentThrowerIndex = 0;
          }
        } else {
          // Normal phase - Check if redemption is triggered
          const redemptionCheck = shouldTriggerRedemption(
            newState.teamA.score,
            newState.teamB.score,
            newState.targetScore
          );

          if (redemptionCheck.trigger) {
            newState.phase = 'redemption';
            newState.redemptionLeader = redemptionCheck.leader;
            newState.redemptionTrailer = redemptionCheck.trailer;
            newState.offenseTeamId = redemptionCheck.trailer!; // Trailing team gets redemption possession
            newState.throwsInPossession = 0;
            newState.currentThrowerIndex = 0;
          } else {
            // No redemption - Switch possession normally
            newState.throwsInPossession = 0;
            newState.offenseTeamId = newState.offenseTeamId === 'A' ? 'B' : 'A';
            newState.currentThrowerIndex = 0;
          }
        }
      } else {
        // Possession not finished - Move to next thrower
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
    <div className="flex flex-col h-screen bg-[#F2F2F7] overflow-hidden">
      {/* Header / Scoreboard */}
      <header className="bg-white px-6 pt-12 pb-4 shadow-sm z-20">
        <div className="flex justify-between items-center mb-4">
          <button onClick={undo} className="p-2 bg-gray-100 rounded-full active:bg-gray-200">
            <Undo2 size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">Team A</div>
              <div className="text-4xl font-black">{gameState.teamA.score}</div>
            </div>
            <div className="text-2xl font-light text-gray-300">vs</div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-[#FF3B30] uppercase tracking-widest">Team B</div>
              <div className="text-4xl font-black">{gameState.teamB.score}</div>
            </div>
          </div>
          <button onClick={onReset} className="p-2 bg-gray-100 rounded-full active:bg-gray-200">
            <RotateCcw size={20} />
          </button>
        </div>
        {gameState.isOvertime && (
          <div className="bg-amber-100 text-amber-800 text-[10px] font-bold py-1 px-3 rounded-full text-center uppercase tracking-widest mt-2">
            Overtime - Win by 2
          </div>
        )}
        {gameState.phase === 'redemption' && (
          <div className="bg-red-100 text-red-800 text-[10px] font-bold py-2 px-3 rounded-xl text-center uppercase tracking-widest mt-2 border border-red-200">
            Redemption: Team {gameState.redemptionTrailer} must get within 1 point to continue
          </div>
        )}
        {gameState.phase === 'gameOver' && (
          <div className="bg-emerald-100 text-emerald-800 py-4 px-3 rounded-2xl text-center mt-2 border border-emerald-200 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy size={20} className="text-emerald-600" />
              <span className="text-sm font-black uppercase tracking-widest">Game Over</span>
            </div>
            <div className="text-2xl font-black">Team {gameState.winner} Wins!</div>
            <div className="text-xs font-medium opacity-70 mt-1">Final Score: {gameState.teamA.score} - {gameState.teamB.score}</div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto pb-32">
        {/* Offense Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: offenseColor }}>
              Offense <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: offenseColor }}></span>
            </h2>
            <span className="text-xs text-gray-400 font-medium">Throw {gameState.throwsInPossession + 1}/2</span>
          </div>
          <div className="flex gap-3">
            {offenseTeam.players.map((p, i) => (
              <PlayerCard
                key={p.id}
                player={p}
                index={i}
                isOffense={true}
                isCurrentThrower={gameState.currentThrowerIndex === i}
                teamColor={offenseColor}
                onBeerAdd={handleBeerAdd}
                onDieLost={handleDieLost}
                onSelectThrower={(idx) => onUpdate({ ...gameState, currentThrowerIndex: idx })}
              />
            ))}
          </div>
        </section>

        {/* Defense Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
              Defense
            </h2>
          </div>
          <div className="flex gap-3 opacity-80">
            {defenseTeam.players.map((p, i) => (
              <PlayerCard
                key={p.id}
                player={p}
                index={i}
                isOffense={false}
                isCurrentThrower={false}
                teamColor={defenseColor}
                onBeerAdd={handleBeerAdd}
                onDieLost={handleDieLost}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Controls Drawer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 shadow-2xl z-30 rounded-t-[32px]">
        <AnimatePresence mode="wait">
          {gameState.phase === 'gameOver' ? (
            <motion.div
              key="game-over-controls"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-4"
            >
              <button
                onClick={onReset}
                className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                Start New Game
              </button>
              <button
                onClick={() => alert('Summary feature coming soon!')}
                className="w-full py-5 bg-gray-100 text-gray-800 rounded-2xl font-bold text-lg active:scale-95 transition-transform"
              >
                View Summary
              </button>
            </motion.div>
          ) : step === 'OFFENSE' && (
            <motion.div 
              key="offense-controls"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Throw Result</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Cup Hit?</span>
                  <button 
                    onClick={() => setCupHit(!cupHit)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${cupHit ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${cupHit ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setCurrentThrowResult(ThrowResult.MISS); setStep('FIFA'); }}
                  className="flex-1 py-5 bg-gray-100 rounded-2xl font-bold text-lg active:scale-95 transition-transform"
                >
                  Miss
                </button>
                <button
                  onClick={() => { setCurrentThrowResult(ThrowResult.VALID_HIT); setStep('DEFENSE'); }}
                  className="flex-1 py-5 bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
                >
                  Hit
                </button>
                <button
                  onClick={() => { setCurrentThrowResult(ThrowResult.PLUNK); setStep('PLUNK_DEFENSE'); }}
                  className="flex-1 py-5 bg-amber-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-amber-200 active:scale-95 transition-transform"
                >
                  Plunk
                </button>
              </div>
            </motion.div>
          )}

          {step === 'DEFENSE' && (
            <motion.div 
              key="defense-controls"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setStep('OFFENSE')} className="text-blue-500 font-bold flex items-center gap-1">
                  <X size={16} /> Cancel
                </button>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Defense Response</div>
                <div className="w-16" /> {/* Spacer */}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {defenseTeam.players.map(p => (
                  <div key={p.id} className="space-y-3">
                    <div className="text-center text-xs font-black uppercase tracking-widest text-gray-500 truncate">{p.name}</div>
                    <div className="flex flex-col gap-2">
                      {[DefenseResult.WHIFF, DefenseResult.FAIL, DefenseResult.CATCH].map(res => (
                        <button
                          key={res}
                          disabled={isStay}
                          onClick={() => setDefenseSelections(prev => ({
                            ...prev,
                            [p.id]: prev[p.id] === res ? null : res
                          }))}
                          className={`py-3 rounded-xl font-bold text-xs border-2 transition-all ${
                            defenseSelections[p.id] === res 
                              ? 'bg-blue-50 border-blue-500 text-blue-700' 
                              : 'bg-white border-gray-100 text-gray-400'
                          } ${isStay ? 'opacity-30' : ''}`}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    setIsStay(!isStay);
                    setDefenseSelections({});
                  }}
                  className={`w-full py-4 rounded-xl font-bold text-sm border-2 transition-all ${
                    isStay ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-gray-100 text-gray-400'
                  }`}
                >
                  STAY (Team Wide)
                </button>

                <button
                  onClick={() => resolveThrow()}
                  className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
                >
                  Confirm Defense <Check size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'PLUNK_DEFENSE' && (
            <motion.div 
              key="plunk-defense"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setStep('OFFENSE')} className="text-blue-500 font-bold flex items-center gap-1">
                  <X size={16} /> Cancel
                </button>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Plunk Penalty</div>
                <div className="w-16" />
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-amber-600 font-black text-2xl uppercase italic tracking-tighter">PLUNK! +3 PTS</div>
                <p className="text-gray-500 text-sm">Who is drinking the 0.5 beer penalty?</p>
              </div>

              <div className="flex gap-3">
                {defenseTeam.players.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPlunkDrinkerId(p.id);
                      // We use a small timeout or just call resolve directly if we want it fast
                    }}
                    className={`flex-1 py-6 rounded-2xl font-bold text-lg border-2 transition-all ${
                      plunkDrinkerId === p.id ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-gray-100 text-gray-400'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <button
                disabled={!plunkDrinkerId}
                onClick={() => resolveThrow()}
                className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform ${
                  plunkDrinkerId ? 'bg-black text-white' : 'bg-gray-100 text-gray-300'
                }`}
              >
                Confirm Plunk <Check size={20} />
              </button>
            </motion.div>
          )}

          {step === 'FIFA' && (
            <motion.div 
              key="fifa-controls"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setStep('OFFENSE')} className="text-blue-500 font-bold flex items-center gap-1">
                  <X size={16} /> Cancel
                </button>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">FIFA Options</div>
                <button onClick={() => resolveThrow()} className="text-emerald-500 font-bold flex items-center gap-1">
                  Skip <ChevronRight size={16} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">FIFA Kick</div>
                  <div className="flex gap-2">
                    {defenseTeam.players.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setFifaKickerId(fifaKickerId === p.id ? null : p.id)}
                        className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all border-2 ${
                          fifaKickerId === p.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-100'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">FIFA Catch</div>
                  <div className="flex gap-2">
                    {defenseTeam.players.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setFifaCatcherId(fifaCatcherId === p.id ? null : p.id)}
                        className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all border-2 ${
                          fifaCatcherId === p.id ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-100'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => resolveThrow()}
                  className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
                >
                  Confirm Throw <Check size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';
import { GameState, Screen } from './types';
import { createInitialState } from './constants';

export default function App() {
  const [screen, setScreen] = useState<Screen>('SETUP');
  const [gameState, setGameState] = useState<GameState | null>(null);

  const handleStartGame = (pA1: string, pA2: string, pB1: string, pB2: string, target: number) => {
    const initialState = createInitialState(pA1, pA2, pB1, pB2, target);
    setGameState(initialState);
    setScreen('GAME');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the game? All stats will be lost.')) {
      setScreen('SETUP');
      setGameState(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] selection:bg-blue-200">
      {screen === 'SETUP' && (
        <SetupScreen onStart={handleStartGame} />
      )}
      
      {screen === 'GAME' && gameState && (
        <GameScreen 
          gameState={gameState} 
          onUpdate={setGameState} 
          onReset={handleReset}
        />
      )}

      {/* Summary Screen could be added here */}
    </div>
  );
}

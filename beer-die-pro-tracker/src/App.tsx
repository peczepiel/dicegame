import React, { useState } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';
import { GameState, Screen } from './types';
import { createInitialState } from './constants';
import { ThemeProvider } from './ThemeContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const createGameOnBackend = async (gameState: GameState): Promise<string> => {
  const response = await fetch(`${BACKEND_URL}/api/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameState }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const backendMessage =
      payload && typeof payload.message === 'string' ? payload.message : null;
    throw new Error(
      `Failed to create game: ${response.status}${backendMessage ? ` - ${backendMessage}` : ''}`
    );
  }

  const data = (await response.json()) as { gameId: string };
  return data.gameId;
};

const updateGameOnBackend = async (gameId: string, gameState: GameState): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/api/games/${gameId}/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameState }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const backendMessage =
      payload && typeof payload.message === 'string' ? payload.message : null;
    throw new Error(
      `Failed to update game: ${response.status}${backendMessage ? ` - ${backendMessage}` : ''}`
    );
  }
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('SETUP');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  const handleStartGame = async (pA1: string, pA2: string, pB1: string, pB2: string, target: number, teamAName?: string, teamBName?: string) => {
    const initialState = createInitialState(pA1, pA2, pB1, pB2, target, teamAName, teamBName);
    let createdGameId: string;
    try {
      createdGameId = await createGameOnBackend(initialState);
    } catch (error) {
      console.error('Could not create game in backend:', error);
      window.alert('Could not create game in backend. Make sure backend is running and reachable, then try again.');
      return;
    }
    setGameId(createdGameId);
    setGameState(initialState);
    setScreen('GAME');
  };

  const handleGameUpdate = (newState: GameState) => {
    setGameState(newState);
    if (!gameId) return;
    void updateGameOnBackend(gameId, newState).catch((error) => {
      console.error('Could not update game in backend:', error);
    });
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the game? All stats will be lost.')) {
      setScreen('SETUP');
      setGameState(null);
      setGameId(null);
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-app selection:bg-primary/20">
        {screen === 'SETUP' && (
          <SetupScreen onStart={handleStartGame} />
        )}
        
        {screen === 'GAME' && gameState && (
          <GameScreen 
            gameState={gameState} 
            onUpdate={handleGameUpdate} 
            onReset={handleReset}
          />
        )}

        {/* Summary Screen could be added here */}
      </div>
    </ThemeProvider>
  );
}

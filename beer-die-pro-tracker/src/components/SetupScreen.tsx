import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Target, Trophy, Users, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Player {
  id: string;
  name: string;
}

interface SetupScreenProps {
  onStart: (pA1: string, pA2: string, pB1: string, pB2: string, target: number) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [pA1, setPA1] = useState('');
  const [pA2, setPA2] = useState('');
  const [pB1, setPB1] = useState('');
  const [pB2, setPB2] = useState('');
  const [target, setTarget] = useState(11);
  const [isCustom, setIsCustom] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);

  const fetchPlayers = async () => {
    try {
      console.log('Fetching players...');
      const response = await fetch('/api/players');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!responseText) {
        console.warn('Empty response from /api/players');
        setPlayers([]);
        return;
      }

      const data = JSON.parse(responseText);
      console.log('Players data:', data);
      setPlayers(data.players || []);
    } catch (error) {
      console.error('Failed to fetch players:', error);
      alert('Failed to fetch players: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;

    setAddingPlayer(true);
    try {
      console.log('Adding player:', newPlayerName);
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName.trim() }),
      });

      console.log('Add response status:', response.status);
      const responseText = await response.text();
      console.log('Add response text:', responseText);

      if (!responseText) {
        alert('Server returned an empty response. Make sure backend is running on port 4000.');
        return;
      }

      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log('Player added:', data);
        setNewPlayerName('');
        setDialogOpen(false);
        await fetchPlayers();
      } else {
        try {
          const error = JSON.parse(responseText);
          console.error('Add player error:', error);
          alert(error.message || 'Failed to add player');
        } catch {
          alert(`Failed to add player (Status: ${response.status}): ${responseText}`);
        }
      }
    } catch (error) {
      console.error('Failed to add player:', error);
      alert('Failed to add player: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setAddingPlayer(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-app px-6 pb-12 pt-8"
    >
      <div className="mx-auto flex w-full max-w-md flex-col">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-sm">
              <Trophy size={14} className="text-primary" />
              Beer Die Pro
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">Set up your match</h1>
            <p className="mt-2 text-sm text-muted-foreground">Select players and target score to start.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="ml-4 h-10 w-10 p-0">
                <Plus size={18} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Player</DialogTitle>
                <DialogDescription>Enter the player's name to add them to the database.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !addingPlayer && handleAddPlayer()}
                />
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={addingPlayer}>
                  Cancel
                </Button>
                <Button onClick={handleAddPlayer} disabled={addingPlayer || !newPlayerName.trim()}>
                  {addingPlayer ? 'Adding...' : 'Add Player'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <div className="space-y-6">
          <Card className="bg-card/90">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-team-a/10 text-team-a">
                <Users size={20} />
              </div>
              <CardTitle className="text-base uppercase tracking-[0.2em] text-team-a">Team A</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={pA1}
                onChange={(e) => setPA1(e.target.value)}
                className="border-team-a/30 focus-visible:ring-team-a"
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Loading players...' : 'Select Player 1'}
                </option>
                {players.map((player) => (
                  <option key={player.id} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </Select>
              <Select
                value={pA2}
                onChange={(e) => setPA2(e.target.value)}
                className="border-team-a/30 focus-visible:ring-team-a"
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Loading players...' : 'Select Player 2'}
                </option>
                {players.map((player) => (
                  <option key={player.id} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-card/90">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-team-b/10 text-team-b">
                <Users size={20} />
              </div>
              <CardTitle className="text-base uppercase tracking-[0.2em] text-team-b">Team B</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={pB1}
                onChange={(e) => setPB1(e.target.value)}
                className="border-team-b/30 focus-visible:ring-team-b"
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Loading players...' : 'Select Player 1'}
                </option>
                {players.map((player) => (
                  <option key={player.id} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </Select>
              <Select
                value={pB2}
                onChange={(e) => setPB2(e.target.value)}
                className="border-team-b/30 focus-visible:ring-team-b"
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Loading players...' : 'Select Player 2'}
                </option>
                {players.map((player) => (
                  <option key={player.id} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-card/90">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
                <Target size={20} />
              </div>
              <CardTitle className="text-base uppercase tracking-[0.2em] text-warning">Target Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={!isCustom ? 'default' : 'secondary'}
                  className={!isCustom ? 'shadow-md' : ''}
                  onClick={() => {
                    setTarget(11);
                    setIsCustom(false);
                  }}
                >
                  11
                </Button>
                <Button
                  type="button"
                  variant={isCustom ? 'default' : 'secondary'}
                  className={isCustom ? 'shadow-md' : ''}
                  onClick={() => setIsCustom(true)}
                >
                  Custom
                </Button>
              </div>
              {isCustom && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2"
                >
                  <Input
                    type="number"
                    placeholder="Enter custom score"
                    value={target}
                    onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                  />
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        <Button
          size="lg"
          className="mt-8 w-full gap-2 text-base"
          onClick={() => onStart(pA1, pA2, pB1, pB2, target)}
        >
          <Play size={18} />
          Start Game
        </Button>
      </div>
    </motion.div>
  );
};

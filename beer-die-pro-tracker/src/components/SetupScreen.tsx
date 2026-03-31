import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Target, Trophy, Users, Plus, Sun, Moon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/ThemeContext';
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

interface Team {
  id: string;
  name: string;
}

interface SetupScreenProps {
  onStart: (pA1: string, pA2: string, pB1: string, pB2: string, target: number, teamAName?: string, teamBName?: string) => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const { isDark, toggleTheme } = useTheme();
  const [pA1, setPA1] = useState('');
  const [pA2, setPA2] = useState('');
  const [pB1, setPB1] = useState('');
  const [pB2, setPB2] = useState('');
  const [pA1Id, setPA1Id] = useState<string | null>(null);
  const [pA2Id, setPA2Id] = useState<string | null>(null);
  const [pB1Id, setPB1Id] = useState<string | null>(null);
  const [pB2Id, setPB2Id] = useState<string | null>(null);
  const [target, setTarget] = useState(11);
  const [isCustom, setIsCustom] = useState(false);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState<'A' | 'B' | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [addingTeam, setAddingTeam] = useState(false);

  const fetchPlayers = async () => {
    try {
      console.log('Fetching players...');
      const response = await fetch(`${BACKEND_URL}/api/players`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!responseText) {
        console.warn('Empty response from players endpoint');
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
      const response = await fetch(`${BACKEND_URL}/api/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName.trim() }),
      });

      console.log('Add response status:', response.status);
      const responseText = await response.text();
      console.log('Add response text:', responseText);

      if (!responseText) {
        alert(`Server returned an empty response from ${BACKEND_URL}.`);
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

  const fetchTeams = async () => {
    try {
      console.log('Fetching teams...');
      const response = await fetch(`${BACKEND_URL}/api/teams`);
      console.log('Teams response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('Teams response text:', responseText);

      if (!responseText) {
        console.warn('Empty response from teams endpoint');
        setTeams([]);
        return;
      }

      const data = JSON.parse(responseText);
      console.log('Teams data:', data);
      setTeams(data.teams || []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      // Don't alert on teams fetch failure - it's optional
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return;

    setAddingTeam(true);
    try {
      console.log('Adding team:', newTeamName);
      const response = await fetch(`${BACKEND_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName.trim() }),
      });

      console.log('Add team response status:', response.status);
      const responseText = await response.text();
      console.log('Add team response text:', responseText);

      if (!responseText) {
        alert(`Server returned an empty response from ${BACKEND_URL}.`);
        return;
      }

      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log('Team added:', data);
        setNewTeamName('');
        if (teamDialogOpen === 'A') {
          setTeamA(data.team.name);
        } else {
          setTeamB(data.team.name);
        }
        setTeamDialogOpen(null);
        await fetchTeams();
      } else {
        try {
          const error = JSON.parse(responseText);
          console.error('Add team error:', error);
          alert(error.message || 'Failed to add team');
        } catch {
          alert(`Failed to add team (Status: ${response.status}): ${responseText}`);
        }
      }
    } catch (error) {
      console.error('Failed to add team:', error);
      alert('Failed to add team: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setAddingTeam(false);
    }
  };

  const fetchSuggestedTeamName = async (playerId1: string | null, playerId2: string | null, team: 'A' | 'B') => {
    if (!playerId1 || !playerId2) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/player-teams/${playerId1}/${playerId2}`);
      if (response.ok) {
        const data = await response.json();
        if (team === 'A') {
          setTeamA(data.teamName);
        } else {
          setTeamB(data.teamName);
        }
      }
    } catch (error) {
      console.error('Failed to fetch suggested team name:', error);
    }
  };

  const savePlayerTeamAssociation = async (playerId1: string | null, playerId2: string | null, teamName: string) => {
    if (!playerId1 || !playerId2 || !teamName.trim()) return;

    try {
      await fetch(`${BACKEND_URL}/api/player-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerId1, 
          playerId2, 
          teamName: teamName.trim() 
        }),
      });
    } catch (error) {
      console.error('Failed to save player team association:', error);
    }
  };

  const getAvailablePlayersForSlot = (excludePlayerNames: string[]): Player[] => {
    return players.filter(player => !excludePlayerNames.includes(player.name));
  };

  useEffect(() => {
    fetchPlayers();
    fetchTeams();
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
          <div className="flex flex-col items-center gap-3 ml-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="h-10 w-10 p-0">
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
            <div className="flex items-center gap-2 bg-card rounded-full px-3 py-2 border">
              <Sun size={16} className="text-muted-foreground" />
              <Switch 
                checked={isDark} 
                onCheckedChange={toggleTheme}
              />
              <Moon size={16} className="text-muted-foreground" />
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <Card className="bg-card/90">
            <CardHeader className="space-y-3">
              <div className="flex flex-row items-center gap-3 justify-between">
                <div className="flex flex-row items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-team-a/10 text-team-a">
                    <Users size={20} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base uppercase tracking-[0.2em] text-team-a">
                      {teamA || 'Team A'}
                    </CardTitle>
                  </div>
                </div>
                <Dialog open={teamDialogOpen === 'A'} onOpenChange={(open) => setTeamDialogOpen(open ? 'A' : null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8">
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Team A Name</DialogTitle>
                      <DialogDescription>Select a team name from the list or create a new one.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Select
                        value={teamA}
                        onChange={(e) => setTeamA(e.target.value)}
                      >
                        <option value="">Select Team Name</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.name}>
                            {team.name}
                          </option>
                        ))}
                      </Select>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">or create new</span>
                        </div>
                      </div>
                      <Input
                        placeholder="New team name"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !addingTeam && handleAddTeam()}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setTeamDialogOpen(null)} disabled={addingTeam}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        if (newTeamName.trim()) {
                          handleAddTeam();
                        } else {
                          setTeamDialogOpen(null);
                        }
                      }} disabled={addingTeam || !newTeamName.trim()}>
                        {addingTeam ? 'Adding...' : 'Add Team'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={pA1}
                onChange={(e) => {
                  const playerName = e.target.value;
                  setPA1(playerName);
                  const player = players.find(p => p.name === playerName);
                  if (player) {
                    setPA1Id(player.id);
                    if (pA2Id) {
                      fetchSuggestedTeamName(player.id, pA2Id, 'A');
                    }
                  }
                }}
                className="border-team-a/30 focus-visible:ring-team-a"
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Loading players...' : 'Select Player 1'}
                </option>
                {getAvailablePlayersForSlot([pA2, pB1, pB2]).map((player) => (
                  <option key={player.id} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </Select>
              <Select
                value={pA2}
                onChange={(e) => {
                  const playerName = e.target.value;
                  setPA2(playerName);
                  const player = players.find(p => p.name === playerName);
                  if (player) {
                    setPA2Id(player.id);
                    if (pA1Id) {
                      fetchSuggestedTeamName(pA1Id, player.id, 'A');
                    }
                  }
                }}
                className="border-team-a/30 focus-visible:ring-team-a"
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Loading players...' : 'Select Player 2'}
                </option>
                {getAvailablePlayersForSlot([pA1, pB1, pB2]).map((player) => (
                  <option key={player.id} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-card/90">
            <CardHeader className="space-y-3">
              <div className="flex flex-row items-center gap-3 justify-between">
                <div className="flex flex-row items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-team-b/10 text-team-b">
                    <Users size={20} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base uppercase tracking-[0.2em] text-team-b">
                      {teamB || 'Team B'}
                    </CardTitle>
                  </div>
                </div>
                <Dialog open={teamDialogOpen === 'B'} onOpenChange={(open) => setTeamDialogOpen(open ? 'B' : null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8">
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Team B Name</DialogTitle>
                      <DialogDescription>Select a team name from the list or create a new one.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Select
                        value={teamB}
                        onChange={(e) => setTeamB(e.target.value)}
                      >
                        <option value="">Select Team Name</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.name}>
                            {team.name}
                          </option>
                        ))}
                      </Select>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">or create new</span>
                        </div>
                      </div>
                      <Input
                        placeholder="New team name"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !addingTeam && handleAddTeam()}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setTeamDialogOpen(null)} disabled={addingTeam}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        if (newTeamName.trim()) {
                          handleAddTeam();
                        } else {
                          setTeamDialogOpen(null);
                        }
                      }} disabled={addingTeam || !newTeamName.trim()}>
                        {addingTeam ? 'Adding...' : 'Add Team'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={pB1}
                onChange={(e) => {
                  const playerName = e.target.value;
                  setPB1(playerName);
                  const player = players.find(p => p.name === playerName);
                  if (player) {
                    setPB1Id(player.id);
                    if (pB2Id) {
                      fetchSuggestedTeamName(player.id, pB2Id, 'B');
                    }
                  }
                }}
                className="border-team-b/30 focus-visible:ring-team-b"
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Loading players...' : 'Select Player 1'}
                </option>
                {getAvailablePlayersForSlot([pB2, pA1, pA2]).map((player) => (
                  <option key={player.id} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </Select>
              <Select
                value={pB2}
                onChange={(e) => {
                  const playerName = e.target.value;
                  setPB2(playerName);
                  const player = players.find(p => p.name === playerName);
                  if (player) {
                    setPB2Id(player.id);
                    if (pB1Id) {
                      fetchSuggestedTeamName(pB1Id, player.id, 'B');
                    }
                  }
                }}
                className="border-team-b/30 focus-visible:ring-team-b"
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Loading players...' : 'Select Player 2'}
                </option>
                {getAvailablePlayersForSlot([pB1, pA1, pA2]).map((player) => (
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
          onClick={() => {
            // Save player team associations
            savePlayerTeamAssociation(pA1Id, pA2Id, teamA);
            savePlayerTeamAssociation(pB1Id, pB2Id, teamB);
            // Start the game
            onStart(pA1, pA2, pB1, pB2, target, teamA, teamB);
          }}
        >
          <Play size={18} />
          Start Game
        </Button>
      </div>
    </motion.div>
  );
};

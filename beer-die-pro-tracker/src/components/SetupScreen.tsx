import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Target, Trophy, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-app px-6 pb-12 pt-8"
    >
      <div className="mx-auto flex w-full max-w-md flex-col">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-sm">
            <Trophy size={14} className="text-primary" />
            Beer Die Pro
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">Set up your match</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter players and target score to start.</p>
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
              <Input
                placeholder="Player 1 name"
                value={pA1}
                onChange={(e) => setPA1(e.target.value)}
                className="border-team-a/30 focus-visible:ring-team-a"
              />
              <Input
                placeholder="Player 2 name"
                value={pA2}
                onChange={(e) => setPA2(e.target.value)}
                className="border-team-a/30 focus-visible:ring-team-a"
              />
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
              <Input
                placeholder="Player 1 name"
                value={pB1}
                onChange={(e) => setPB1(e.target.value)}
                className="border-team-b/30 focus-visible:ring-team-b"
              />
              <Input
                placeholder="Player 2 name"
                value={pB2}
                onChange={(e) => setPB2(e.target.value)}
                className="border-team-b/30 focus-visible:ring-team-b"
              />
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

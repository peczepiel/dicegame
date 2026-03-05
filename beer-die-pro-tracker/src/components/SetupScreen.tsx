import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Users, Target, Play } from 'lucide-react';

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
      className="flex flex-col min-h-screen bg-[#F2F2F7] p-6 pb-12 font-sans"
    >
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-black tracking-tight">New Game</h1>
        <p className="text-[#8E8E93] text-lg">Set up your 2v2 Beer Die match</p>
      </header>

      <div className="space-y-6">
        {/* Team A */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-black/5">
          <div className="flex items-center gap-2 mb-4 text-[#007AFF]">
            <Users size={20} />
            <h2 className="font-semibold text-lg uppercase tracking-wider">Team A</h2>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Player 1 Name"
              className="w-full bg-[#F2F2F7] rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              value={pA1}
              onChange={(e) => setPA1(e.target.value)}
            />
            <input
              type="text"
              placeholder="Player 2 Name"
              className="w-full bg-[#F2F2F7] rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              value={pA2}
              onChange={(e) => setPA2(e.target.value)}
            />
          </div>
        </section>

        {/* Team B */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-black/5">
          <div className="flex items-center gap-2 mb-4 text-[#FF3B30]">
            <Users size={20} />
            <h2 className="font-semibold text-lg uppercase tracking-wider">Team B</h2>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Player 1 Name"
              className="w-full bg-[#F2F2F7] rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B30]"
              value={pB1}
              onChange={(e) => setPB1(e.target.value)}
            />
            <input
              type="text"
              placeholder="Player 2 Name"
              className="w-full bg-[#F2F2F7] rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B30]"
              value={pB2}
              onChange={(e) => setPB2(e.target.value)}
            />
          </div>
        </section>

        {/* Target Score */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-black/5">
          <div className="flex items-center gap-2 mb-4 text-[#34C759]">
            <Target size={20} />
            <h2 className="font-semibold text-lg uppercase tracking-wider">Target Score</h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setTarget(11); setIsCustom(false); }}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${!isCustom ? 'bg-[#34C759] text-white shadow-lg' : 'bg-[#F2F2F7] text-[#8E8E93]'}`}
            >
              11
            </button>
            <button
              onClick={() => setIsCustom(true)}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${isCustom ? 'bg-[#34C759] text-white shadow-lg' : 'bg-[#F2F2F7] text-[#8E8E93]'}`}
            >
              Custom
            </button>
          </div>
          {isCustom && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
              <input
                type="number"
                placeholder="Enter custom score"
                className="w-full bg-[#F2F2F7] rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                value={target}
                onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
              />
            </motion.div>
          )}
        </section>

        <button
          onClick={() => onStart(pA1, pA2, pB1, pB2, target)}
          className="w-full bg-black text-white py-5 rounded-2xl font-bold text-xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <Play fill="white" size={24} />
          Start Game
        </button>
      </div>
    </motion.div>
  );
};

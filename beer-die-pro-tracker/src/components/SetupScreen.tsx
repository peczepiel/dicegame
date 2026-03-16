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
      className="flex flex-col min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100 p-6 pb-12 font-sans"
    >
      <header className="mb-10 mt-4">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-sky-500 tracking-tight">Beer Die Pro</h1>
        <p className="text-gray-600 text-lg font-medium mt-2">Set up your 2v2 match</p>
      </header>

      <div className="space-y-6 flex-1">
        {/* Team A */}
        <section className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-sky-100/50">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <h2 className="font-bold text-xl uppercase tracking-wide text-sky-700">Team A</h2>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Player 1 Name"
              className="w-full bg-gradient-to-br from-sky-50 to-sky-100/50 border-2 border-sky-200 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder-gray-400"
              value={pA1}
              onChange={(e) => setPA1(e.target.value)}
            />
            <input
              type="text"
              placeholder="Player 2 Name"
              className="w-full bg-gradient-to-br from-sky-50 to-sky-100/50 border-2 border-sky-200 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder-gray-400"
              value={pA2}
              onChange={(e) => setPA2(e.target.value)}
            />
          </div>
        </section>

        {/* Team B */}
        <section className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-red-100/50">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <h2 className="font-bold text-xl uppercase tracking-wide text-red-700">Team B</h2>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Player 1 Name"
              className="w-full bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-gray-400"
              value={pB1}
              onChange={(e) => setPB1(e.target.value)}
            />
            <input
              type="text"
              placeholder="Player 2 Name"
              className="w-full bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-gray-400"
              value={pB2}
              onChange={(e) => setPB2(e.target.value)}
            />
          </div>
        </section>

        {/* Target Score */}
        <section className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-emerald-100/50">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Target size={24} className="text-white" />
            </div>
            <h2 className="font-bold text-xl uppercase tracking-wide text-emerald-700">Target Score</h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setTarget(11); setIsCustom(false); }}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${!isCustom ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-300/50 scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              11
            </button>
            <button
              onClick={() => setIsCustom(true)}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${isCustom ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-300/50 scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Custom
            </button>
          </div>
          {isCustom && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
              <input
                type="number"
                placeholder="Enter custom score"
                className="w-full bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
                value={target}
                onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
              />
            </motion.div>
          )}
        </section>
      </div>

      <button
        onClick={() => onStart(pA1, pA2, pB1, pB2, target)}
        className="w-full bg-gradient-to-br from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white py-5 rounded-2xl font-bold text-xl shadow-xl shadow-sky-400/50 flex items-center justify-center gap-3 active:scale-95 transition-all mt-8"
      >
        <Play fill="white" size={24} />
        Start Game
      </button>
    </motion.div>
  );
};

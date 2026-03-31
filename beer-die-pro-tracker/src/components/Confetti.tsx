import React from 'react';
import { motion } from 'motion/react';

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotation: number;
  rotationMultiplier: number;
  color: string;
}

export const Confetti: React.FC = () => {
  const colors = ['#fbbf24', '#f87171', '#60a5fa', '#34d399', '#a78bfa', '#fb7185', '#fcd34d'];
  
  const confettiPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 2.5 + Math.random() * 0.5,
    rotation: Math.random() * 360,
    rotationMultiplier: (Math.random() - 0.5) * 800,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            backgroundColor: piece.color,
          }}
          initial={{ y: 0, opacity: 1, rotate: piece.rotation, x: 0 }}
          animate={{
            y: window.innerHeight + 10,
            opacity: 0,
            rotate: piece.rotation + piece.rotationMultiplier,
            x: (Math.random() - 0.5) * 200,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeIn',
          }}
        />
      ))}

      {/* Additional larger confetti pieces */}
      {Array.from({ length: 20 }, (_, i) => {
        const piece = {
          id: 50 + i,
          left: Math.random() * 100,
          delay: Math.random() * 0.4,
          duration: 3 + Math.random() * 0.5,
          rotation: Math.random() * 360,
          rotationMultiplier: (Math.random() - 0.5) * 1200,
          color: colors[Math.floor(Math.random() * colors.length)],
        };
        return (
          <motion.div
            key={piece.id}
            className="absolute w-3 h-3"
            style={{
              left: `${piece.left}%`,
              top: '-10px',
              backgroundColor: piece.color,
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}
            initial={{ y: 0, opacity: 1, rotate: piece.rotation, x: 0 }}
            animate={{
              y: window.innerHeight + 10,
              opacity: 0,
              rotate: piece.rotation + piece.rotationMultiplier,
              x: (Math.random() - 0.5) * 300,
            }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: 'easeIn',
            }}
          />
        );
      })}
    </div>
  );
};

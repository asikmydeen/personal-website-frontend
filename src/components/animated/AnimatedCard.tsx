import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cardHover } from '../../animations';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  style = {},
  delay = 0
}) => {
  return (
    <motion.div
      className={`animated-card ${className}`}
      style={{
        background: 'var(--card-bg, #fff)',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        ...style
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover="hover"
      variants={cardHover}
    >
      {children}
    </motion.div>
  );
};

AnimatedCard.displayName = "AnimatedCard";

export { AnimatedCard };

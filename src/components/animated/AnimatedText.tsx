import React, { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';
import { fadeIn, slideUp, slideInLeft, slideInRight } from '../../animations';

interface AnimatedTextProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'fade' | 'slideUp' | 'slideInLeft' | 'slideInRight';
  delay?: number;
  duration?: number;
  element?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div';
  staggerChildren?: boolean;
  childrenDelay?: number;
}

const getVariant = (variant: string): Variants => {
  switch (variant) {
    case 'fade':
      return fadeIn;
    case 'slideUp':
      return slideUp;
    case 'slideInLeft':
      return slideInLeft;
    case 'slideInRight':
      return slideInRight;
    default:
      return fadeIn;
  }
};

const AnimatedText: React.FC<AnimatedTextProps> = ({
  children,
  className = '',
  style = {},
  variant = 'fade',
  delay = 0,
  duration = 0.5,
  element = 'div',
  staggerChildren = false,
  childrenDelay = 0.1
}) => {
  const animations = getVariant(variant);

  // If we want to stagger children, we need to create a container for them
  if (staggerChildren && typeof children === 'string') {
    const words = children.split(' ');

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: childrenDelay,
          delayChildren: delay
        }
      }
    };

    const wordVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: duration,
          type: "spring",
          stiffness: 100,
          damping: 15
        }
      }
    };

    // Choose the proper element
    if (element === 'p') {
      return (
        <motion.p
          className={className}
          style={style}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              style={{ display: 'inline-block', marginRight: '0.25em' }}
              variants={wordVariants}
            >
              {word}
            </motion.span>
          ))}
        </motion.p>
      );
    } else if (element === 'h1') {
      return (
        <motion.h1
          className={className}
          style={style}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              style={{ display: 'inline-block', marginRight: '0.25em' }}
              variants={wordVariants}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>
      );
    } else if (element === 'h2') {
      return (
        <motion.h2
          className={className}
          style={style}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              style={{ display: 'inline-block', marginRight: '0.25em' }}
              variants={wordVariants}
            >
              {word}
            </motion.span>
          ))}
        </motion.h2>
      );
    } else if (element === 'span') {
      return (
        <motion.span
          className={className}
          style={style}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              style={{ display: 'inline-block', marginRight: '0.25em' }}
              variants={wordVariants}
            >
              {word}
            </motion.span>
          ))}
        </motion.span>
      );
    } else {
      // Default to div
      return (
        <motion.div
          className={className}
          style={style}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              style={{ display: 'inline-block', marginRight: '0.25em' }}
              variants={wordVariants}
            >
              {word}
            </motion.span>
          ))}
        </motion.div>
      );
    }
  }

  // Regular animated text without staggered children
  if (element === 'p') {
    return (
      <motion.p
        className={className}
        style={style}
        variants={animations}
        initial="hidden"
        animate="visible"
        transition={{
          duration: duration,
          delay: delay,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
      >
        {children}
      </motion.p>
    );
  } else if (element === 'h1') {
    return (
      <motion.h1
        className={className}
        style={style}
        variants={animations}
        initial="hidden"
        animate="visible"
        transition={{
          duration: duration,
          delay: delay,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
      >
        {children}
      </motion.h1>
    );
  } else if (element === 'h2') {
    return (
      <motion.h2
        className={className}
        style={style}
        variants={animations}
        initial="hidden"
        animate="visible"
        transition={{
          duration: duration,
          delay: delay,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
      >
        {children}
      </motion.h2>
    );
  } else if (element === 'h3') {
    return (
      <motion.h3
        className={className}
        style={style}
        variants={animations}
        initial="hidden"
        animate="visible"
        transition={{
          duration: duration,
          delay: delay,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
      >
        {children}
      </motion.h3>
    );
  } else if (element === 'span') {
    return (
      <motion.span
        className={className}
        style={style}
        variants={animations}
        initial="hidden"
        animate="visible"
        transition={{
          duration: duration,
          delay: delay,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
      >
        {children}
      </motion.span>
    );
  } else {
    // Default to div
    return (
      <motion.div
        className={className}
        style={style}
        variants={animations}
        initial="hidden"
        animate="visible"
        transition={{
          duration: duration,
          delay: delay,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
      >
        {children}
      </motion.div>
    );
  }
};

export default AnimatedText;

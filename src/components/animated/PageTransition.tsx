import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition } from '../../animations';

interface PageTransitionProps {
  children: ReactNode;
  location?: string; // Optional key for AnimatePresence
  className?: string;
  style?: React.CSSProperties;
  transitionType?: 'fade' | 'slide' | 'zoom' | 'flip';
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  location,
  className = '',
  style = {},
  transitionType = 'fade'
}) => {
  // Define transition variants based on type
  const getVariants = () => {
    switch (transitionType) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1, transition: { duration: 0.5 } },
          exit: { opacity: 0, transition: { duration: 0.3 } }
        };
      case 'slide':
        return {
          initial: { x: 300, opacity: 0 },
          animate: {
            x: 0,
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 30
            }
          },
          exit: {
            x: -300,
            opacity: 0,
            transition: {
              duration: 0.3
            }
          }
        };
      case 'zoom':
        return {
          initial: { scale: 0.9, opacity: 0 },
          animate: {
            scale: 1,
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 30
            }
          },
          exit: {
            scale: 0.95,
            opacity: 0,
            transition: {
              duration: 0.3
            }
          }
        };
      case 'flip':
        return {
          initial: { rotateY: 90, opacity: 0 },
          animate: {
            rotateY: 0,
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 100,
              damping: 20
            }
          },
          exit: {
            rotateY: -90,
            opacity: 0,
            transition: {
              duration: 0.3
            }
          }
        };
      default:
        return pageTransition;
    }
  };

  const variants = getVariants();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className={`page-transition ${className}`}
        style={{
          width: '100%',
          height: '100%',
          ...style
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;

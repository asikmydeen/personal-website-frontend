import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedTabContentProps {
  children: ReactNode;
  activeTab: string | number;
  tabId: string | number;
  className?: string;
  style?: React.CSSProperties;
  animationType?: 'fade' | 'slide' | 'zoom' | 'flip';
  direction?: 'left' | 'right' | 'up' | 'down';
}

const AnimatedTabContent: React.FC<AnimatedTabContentProps> = ({
  children,
  activeTab,
  tabId,
  className = '',
  style = {},
  animationType = 'fade',
  direction = 'right'
}) => {
  const isActive = activeTab === tabId;

  // Get the appropriate animation variants based on type and direction
  const getVariants = () => {
    switch (animationType) {
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.3 } },
          exit: { opacity: 0, transition: { duration: 0.2 } }
        };
      case 'slide':
        if (direction === 'left') {
          return {
            hidden: { x: -20, opacity: 0 },
            visible: {
              x: 0,
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
              }
            },
            exit: {
              x: 20,
              opacity: 0,
              transition: {
                duration: 0.2
              }
            }
          };
        } else if (direction === 'right') {
          return {
            hidden: { x: 20, opacity: 0 },
            visible: {
              x: 0,
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
              }
            },
            exit: {
              x: -20,
              opacity: 0,
              transition: {
                duration: 0.2
              }
            }
          };
        } else if (direction === 'up') {
          return {
            hidden: { y: 20, opacity: 0 },
            visible: {
              y: 0,
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
              }
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.2
              }
            }
          };
        } else {
          // down
          return {
            hidden: { y: -20, opacity: 0 },
            visible: {
              y: 0,
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
              }
            },
            exit: {
              y: 20,
              opacity: 0,
              transition: {
                duration: 0.2
              }
            }
          };
        }
      case 'zoom':
        return {
          hidden: { scale: 0.95, opacity: 0 },
          visible: {
            scale: 1,
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 25
            }
          },
          exit: {
            scale: 0.95,
            opacity: 0,
            transition: {
              duration: 0.2
            }
          }
        };
      case 'flip':
        if (direction === 'left' || direction === 'right') {
          return {
            hidden: { rotateY: 90, opacity: 0 },
            visible: {
              rotateY: 0,
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
              }
            },
            exit: {
              rotateY: -90,
              opacity: 0,
              transition: {
                duration: 0.2
              }
            }
          };
        } else {
          // up or down
          return {
            hidden: { rotateX: 90, opacity: 0 },
            visible: {
              rotateX: 0,
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
              }
            },
            exit: {
              rotateX: -90,
              opacity: 0,
              transition: {
                duration: 0.2
              }
            }
          };
        }
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.3 } },
          exit: { opacity: 0, transition: { duration: 0.2 } }
        };
    }
  };

  const variants = getVariants();

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          className={`w-full ${className}`}
          style={style}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          key={tabId}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedTabContent;

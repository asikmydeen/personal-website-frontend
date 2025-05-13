import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  style?: React.CSSProperties;
  itemClassName?: string;
  itemStyle?: React.CSSProperties;
  staggerDelay?: number;
  initialDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  as?: 'ul' | 'ol' | 'div';
}

const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className = '',
  style = {},
  itemClassName = '',
  itemStyle = {},
  staggerDelay = 0.1,
  initialDelay = 0,
  direction = 'up',
  as = 'ul'
}) => {
  // Define animation variants based on direction
  const getItemVariant = () => {
    switch (direction) {
      case 'up':
        return {
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              type: "spring",
              stiffness: 100,
              damping: 15
            }
          }
        };
      case 'down':
        return {
          hidden: { opacity: 0, y: -20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              type: "spring",
              stiffness: 100,
              damping: 15
            }
          }
        };
      case 'left':
        return {
          hidden: { opacity: 0, x: 20 },
          visible: {
            opacity: 1,
            x: 0,
            transition: {
              type: "spring",
              stiffness: 100,
              damping: 15
            }
          }
        };
      case 'right':
        return {
          hidden: { opacity: 0, x: -20 },
          visible: {
            opacity: 1,
            x: 0,
            transition: {
              type: "spring",
              stiffness: 100,
              damping: 15
            }
          }
        };
      default:
        return {
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              type: "spring",
              stiffness: 100,
              damping: 15
            }
          }
        };
    }
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay
      }
    }
  };

  // Item animation variants
  const itemVariants = getItemVariant();

  // Render the list with the appropriate element
  const renderList = () => {
    if (as === 'ul') {
      return (
        <motion.ul
          className={className}
          style={style}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {React.Children.map(children, (child, index) => (
            <motion.li
              key={index}
              className={itemClassName}
              style={itemStyle}
              variants={itemVariants}
            >
              {child}
            </motion.li>
          ))}
        </motion.ul>
      );
    } else if (as === 'ol') {
      return (
        <motion.ol
          className={className}
          style={style}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {React.Children.map(children, (child, index) => (
            <motion.li
              key={index}
              className={itemClassName}
              style={itemStyle}
              variants={itemVariants}
            >
              {child}
            </motion.li>
          ))}
        </motion.ol>
      );
    } else {
      // Default to div with div children
      return (
        <motion.div
          className={className}
          style={style}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {React.Children.map(children, (child, index) => (
            <motion.div
              key={index}
              className={itemClassName}
              style={itemStyle}
              variants={itemVariants}
            >
              {child}
            </motion.div>
          ))}
        </motion.div>
      );
    }
  };

  return renderList();
};

export default AnimatedList;

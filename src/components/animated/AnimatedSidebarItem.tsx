import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface AnimatedSidebarItemProps {
  to: string;
  icon: string;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

const AnimatedSidebarItem: React.FC<AnimatedSidebarItemProps> = ({
  to,
  icon,
  label,
  isActive,
  collapsed,
  onClick
}) => {
  // Different animation variants based on menu item context
  const getItemAnimation = () => {
    switch (label) {
      case 'Home':
        return {
          hover: {
            scale: 1.1,
            transition: { type: 'spring', stiffness: 400, damping: 10 }
          },
          tap: { scale: 0.95 },
          active: {
            backgroundColor: 'var(--menu-active-bg, rgba(0, 0, 0, 0.1))',
            color: 'var(--menu-active-color, #1890ff)',
            boxShadow: '0 0 10px rgba(24, 144, 255, 0.3)'
          }
        };
      case 'Photos':
        return {
          hover: {
            scale: 1.05,
            rotate: [0, -3, 3, 0],
            transition: {
              scale: { type: 'spring', stiffness: 400, damping: 10 },
              rotate: { duration: 0.5, ease: 'easeInOut' }
            }
          },
          tap: { scale: 0.95 },
          active: {
            backgroundColor: 'var(--menu-active-bg, rgba(0, 0, 0, 0.1))',
            color: 'var(--menu-active-color, #1890ff)',
            boxShadow: '0 0 15px rgba(255, 105, 180, 0.4)'
          }
        };
      case 'Files':
        return {
          hover: {
            y: -5,
            x: 3,
            transition: { type: 'spring', stiffness: 300, damping: 10 }
          },
          tap: { scale: 0.95 },
          active: {
            backgroundColor: 'var(--menu-active-bg, rgba(0, 0, 0, 0.1))',
            color: 'var(--menu-active-color, #1890ff)',
            boxShadow: '0 0 10px rgba(130, 80, 223, 0.4)'
          }
        };
      case 'Notes':
        return {
          hover: {
            x: [0, -3, 3, -3, 0],
            transition: { duration: 0.5 }
          },
          tap: { scale: 0.95 },
          active: {
            backgroundColor: 'var(--menu-active-bg, rgba(0, 0, 0, 0.1))',
            color: 'var(--menu-active-color, #1890ff)',
            boxShadow: '0 0 10px rgba(255, 193, 7, 0.4)'
          }
        };
      case 'Bookmarks':
        return {
          hover: {
            y: [-2, -8, -2],
            transition: {
              y: { duration: 0.6, repeat: 0 },
              scale: { type: 'spring', stiffness: 300 }
            }
          },
          tap: { scale: 0.95 },
          active: {
            backgroundColor: 'var(--menu-active-bg, rgba(0, 0, 0, 0.1))',
            color: 'var(--menu-active-color, #1890ff)',
            boxShadow: '0 0 10px rgba(255, 87, 34, 0.4)'
          }
        };
      case 'Passwords':
        return {
          hover: {
            rotate: [0, 0, 360],
            transition: {
              rotate: { duration: 0.7, ease: 'easeInOut' }
            }
          },
          tap: { scale: 0.95 },
          active: {
            backgroundColor: 'var(--menu-active-bg, rgba(0, 0, 0, 0.1))',
            color: 'var(--menu-active-color, #1890ff)',
            boxShadow: '0 0 10px rgba(76, 175, 80, 0.4)'
          }
        };
      case 'Wallet':
        return {
          hover: {
            x: [0, -5, 5, -5, 0],
            transition: { duration: 0.5 }
          },
          tap: { scale: 0.95 },
          active: {
            backgroundColor: 'var(--menu-active-bg, rgba(0, 0, 0, 0.1))',
            color: 'var(--menu-active-color, #1890ff)',
            boxShadow: '0 0 10px rgba(255, 152, 0, 0.4)'
          }
        };
      case 'Voice Memos':
        return {
          hover: {
            scale: [1, 1.2, 1, 1.2, 1],
            transition: { duration: 0.8 }
          },
          tap: { scale: 0.95 },
          active: {
            backgroundColor: 'var(--menu-active-bg, rgba(0, 0, 0, 0.1))',
            color: 'var(--menu-active-color, #1890ff)',
            boxShadow: '0 0 10px rgba(233, 30, 99, 0.4)'
          }
        };
      case 'Resume':
        return {
          hover: {
            y: [-2, 2, -2],
            x: [0, 2, -2, 0],
            transition: { duration: 0.6 }
          },
          tap: { scale: 0.95 },
          active: {
            backgroundColor: 'var(--menu-active-bg, rgba(0, 0, 0, 0.1))',
            color: 'var(--menu-active-color, #1890ff)',
            boxShadow: '0 0 10px rgba(0, 188, 212, 0.4)'
          }
        };
      default:
        return {
          hover: {
            scale: 1.05,
            transition: { type: 'spring', stiffness: 400, damping: 10 }
          },
          tap: { scale: 0.95 },
          active: {
            backgroundColor: 'var(--menu-active-bg, rgba(0, 0, 0, 0.1))',
            color: 'var(--menu-active-color, #1890ff)'
          }
        };
    }
  };

  // Get icon animation based on menu item
  const getIconAnimation = () => {
    switch (label) {
      case 'Photos':
        return {
          animate: isActive
            ? { rotate: [0, -5, 5, -5, 0], scale: [1, 1.2, 1], transition: { duration: 1, repeat: Infinity, repeatDelay: 4 } }
            : {},
          hover: { scale: 1.3, transition: { duration: 0.2 } }
        };
      case 'Files':
        return {
          animate: isActive
            ? { y: [0, -3, 0], transition: { duration: 1, repeat: Infinity, repeatDelay: 2 } }
            : {},
          hover: { scale: 1.3, transition: { duration: 0.2 } }
        };
      case 'Notes':
        return {
          animate: isActive
            ? { rotate: [0, 5, 0], transition: { duration: 0.7, repeat: Infinity, repeatDelay: 2 } }
            : {},
          hover: { scale: 1.3, transition: { duration: 0.2 } }
        };
      case 'Passwords':
        return {
          animate: isActive
            ? { rotate: [0, 0, 360], transition: { duration: 1.5, repeat: Infinity, repeatDelay: 3 } }
            : {},
          hover: { scale: 1.3, transition: { duration: 0.2 } }
        };
      case 'Voice Memos':
        return {
          animate: isActive
            ? { scale: [1, 1.2, 1], transition: { duration: 0.8, repeat: Infinity, repeatDelay: 1.5 } }
            : {},
          hover: { scale: 1.3, transition: { duration: 0.2 } }
        };
      default:
        return {
          animate: isActive
            ? { scale: [1, 1.1, 1], transition: { duration: 1, repeat: Infinity, repeatDelay: 3 } }
            : {},
          hover: { scale: 1.3, transition: { duration: 0.2 } }
        };
    }
  };

  const itemAnimation = getItemAnimation();
  const iconAnimation = getIconAnimation();

  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        color: 'inherit',
        width: '100%',
        padding: collapsed ? '10px' : '10px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: '6px',
        margin: '6px 0',
      }}
      onClick={onClick}
    >
      <motion.div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '8px',
          borderRadius: '6px',
          backgroundColor: isActive ? 'var(--menu-active-bg, rgba(0, 0, 0, 0.1))' : 'transparent',
          justifyContent: collapsed ? 'center' : 'flex-start',
          position: 'relative',
          overflow: 'hidden'
        }}
        whileHover="hover"
        whileTap="tap"
        animate={isActive ? "active" : undefined}
        variants={itemAnimation}
      >
        <motion.div
          style={{
            marginRight: collapsed ? 0 : 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: collapsed ? '20px' : '18px',
          }}
          variants={iconAnimation}
          animate={iconAnimation.animate}
          whileHover={iconAnimation.hover}
        >
          <span role="img" aria-label={label}>{icon}</span>
        </motion.div>

        {!collapsed && (
          <motion.span
            style={{
              fontSize: '16px',
              fontWeight: isActive ? 'bold' : 'normal',
            }}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.span>
        )}

        {isActive && (
          <motion.div
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              height: 3,
              width: '100%',
              backgroundColor: 'var(--menu-active-indicator, #1890ff)'
            }}
            layoutId="activeIndicator"
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>
    </Link>
  );
};

export default AnimatedSidebarItem;

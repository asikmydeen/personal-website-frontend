import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditModeTransitionProps {
  children: ReactNode;
  editMode: boolean;
  onClose?: () => void;
  onSave?: () => void;
  title?: string;
}

/**
 * A component that provides a smooth transition when switching between view and edit modes.
 * Perfect for forms, detail views, and any editable content.
 */
const EditModeTransition: React.FC<EditModeTransitionProps> = ({
  children,
  editMode,
  onClose,
  onSave,
  title
}) => {
  // Animation variants
  const containerVariants = {
    view: {
      scale: 1,
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        when: 'afterChildren',
        staggerChildren: 0.05
      }
    },
    edit: {
      scale: 1.02,
      boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.15)',
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 200,
        when: 'afterChildren',
        staggerChildren: 0.05
      }
    }
  };

  const headerVariants = {
    view: {
      backgroundColor: 'rgba(var(--header-bg-rgb, 255, 255, 255), 0.7)',
      height: '3rem',
      transition: { type: 'spring', damping: 25, stiffness: 300 }
    },
    edit: {
      backgroundColor: 'rgba(var(--header-edit-bg-rgb, 66, 153, 225), 0.8)',
      height: '4rem',
      transition: { type: 'spring', damping: 20, stiffness: 200 }
    }
  };

  const contentVariants = {
    view: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 300 }
    },
    edit: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 20, stiffness: 200 }
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: { duration: 0.2 }
    },
    enter: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  const buttonVariants = {
    initial: { opacity: 0, y: -10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        type: 'spring',
        damping: 10,
        stiffness: 300
      }
    },
    tap: { scale: 0.95 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial={editMode ? 'edit' : 'view'}
      animate={editMode ? 'edit' : 'view'}
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg"
      style={{
        width: '100%',
        position: 'relative'
      }}
    >
      {/* Header */}
      <motion.div
        variants={headerVariants}
        className="px-4 flex items-center justify-between"
        style={{
          width: '100%',
          color: editMode ? 'white' : 'inherit',
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <motion.h3
          style={{
            fontWeight: editMode ? 'bold' : 'normal',
            fontSize: editMode ? '1.25rem' : '1rem'
          }}
        >
          {title || (editMode ? 'Edit Mode' : 'View Mode')}
        </motion.h3>

        <div className="flex space-x-2">
          {editMode && (
            <>
              <AnimatePresence>
                <motion.button
                  key="saveButton"
                  onClick={onSave}
                  variants={buttonVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  whileTap="tap"
                  className="px-4 py-1 bg-green-500 hover:bg-green-600 text-white rounded"
                >
                  Save
                </motion.button>
                <motion.button
                  key="cancelButton"
                  onClick={onClose}
                  variants={buttonVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  whileTap="tap"
                  className="px-4 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded"
                >
                  Cancel
                </motion.button>
              </AnimatePresence>
            </>
          )}

          {!editMode && onClose && (
            <motion.button
              onClick={onClose}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
            >
              Close
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={editMode ? 'edit' : 'view'}
          variants={contentVariants}
          initial="enter"
          animate={editMode ? 'edit' : 'view'}
          exit="exit"
          className="p-4"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Edit mode indicator */}
      {editMode && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="absolute top-14 left-0 bg-blue-500 text-white text-xs py-1 px-2 rounded-r"
        >
          Editing
        </motion.div>
      )}
    </motion.div>
  );
};

export default EditModeTransition;

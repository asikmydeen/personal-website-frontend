import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
/**
 * A component that provides a smooth transition when switching between view and edit modes.
 * Perfect for forms, detail views, and any editable content.
 */
const EditModeTransition = ({ children, editMode, onClose, onSave, title }) => {
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
    return (_jsxs(motion.div, { variants: containerVariants, initial: editMode ? 'edit' : 'view', animate: editMode ? 'edit' : 'view', className: "bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg", style: {
            width: '100%',
            position: 'relative'
        }, children: [_jsxs(motion.div, { variants: headerVariants, className: "px-4 flex items-center justify-between", style: {
                    width: '100%',
                    color: editMode ? 'white' : 'inherit',
                    borderBottom: '1px solid rgba(0,0,0,0.1)'
                }, children: [_jsx(motion.h3, { style: {
                            fontWeight: editMode ? 'bold' : 'normal',
                            fontSize: editMode ? '1.25rem' : '1rem'
                        }, children: title || (editMode ? 'Edit Mode' : 'View Mode') }), _jsxs("div", { className: "flex space-x-2", children: [editMode && (_jsx(_Fragment, { children: _jsxs(AnimatePresence, { children: [_jsx(motion.button, { onClick: onSave, variants: buttonVariants, initial: "initial", animate: "animate", whileHover: "hover", whileTap: "tap", className: "px-4 py-1 bg-green-500 hover:bg-green-600 text-white rounded", children: "Save" }, "saveButton"), _jsx(motion.button, { onClick: onClose, variants: buttonVariants, initial: "initial", animate: "animate", whileHover: "hover", whileTap: "tap", className: "px-4 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded", children: "Cancel" }, "cancelButton")] }) })), !editMode && onClose && (_jsx(motion.button, { onClick: onClose, variants: buttonVariants, whileHover: "hover", whileTap: "tap", className: "px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white", children: "Close" }))] })] }), _jsx(AnimatePresence, { mode: "wait", children: _jsx(motion.div, { variants: contentVariants, initial: "enter", animate: editMode ? 'edit' : 'view', exit: "exit", className: "p-4", children: children }, editMode ? 'edit' : 'view') }), editMode && (_jsx(motion.div, { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 }, transition: { duration: 0.3 }, className: "absolute top-14 left-0 bg-blue-500 text-white text-xs py-1 px-2 rounded-r", children: "Editing" }))] }));
};
export default EditModeTransition;

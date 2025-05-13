import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const AnimatedDrawer = ({ children, isOpen, onClose, position = 'right', width = '400px', height = '100%', closeOnOutsideClick = true, showBackdrop = true, className = '', drawerClassName = '', closeButton = true, closeButtonPosition = 'inside' }) => {
    // For accessibility and UX, trap focus inside the drawer when it's open
    const [prevFocusElement, setPrevFocusElement] = useState(null);
    useEffect(() => {
        if (isOpen) {
            // Store current focus
            setPrevFocusElement(document.activeElement);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
        else {
            // Restore body scroll
            document.body.style.overflow = 'auto';
            // Return focus
            if (prevFocusElement) {
                prevFocusElement.focus();
            }
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, prevFocusElement]);
    // Define drawer position and animation variants
    const getDrawerStyles = () => {
        switch (position) {
            case 'left':
                return {
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: width,
                    height: '100%'
                };
            case 'top':
                return {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    width: '100%',
                    height: height
                };
            case 'bottom':
                return {
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    width: '100%',
                    height: height
                };
            case 'right':
            default:
                return {
                    position: 'fixed',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: width,
                    height: '100%'
                };
        }
    };
    // Define animation variants based on position
    const getVariants = () => {
        switch (position) {
            case 'left':
                return {
                    hidden: { x: '-100%', opacity: 0.5 },
                    visible: {
                        x: 0,
                        opacity: 1,
                        transition: {
                            type: 'spring',
                            stiffness: 300,
                            damping: 30
                        }
                    },
                    exit: {
                        x: '-100%',
                        opacity: 0,
                        transition: {
                            type: 'spring',
                            stiffness: 400,
                            damping: 40
                        }
                    }
                };
            case 'top':
                return {
                    hidden: { y: '-100%', opacity: 0.5 },
                    visible: {
                        y: 0,
                        opacity: 1,
                        transition: {
                            type: 'spring',
                            stiffness: 300,
                            damping: 30
                        }
                    },
                    exit: {
                        y: '-100%',
                        opacity: 0,
                        transition: {
                            type: 'spring',
                            stiffness: 400,
                            damping: 40
                        }
                    }
                };
            case 'bottom':
                return {
                    hidden: { y: '100%', opacity: 0.5 },
                    visible: {
                        y: 0,
                        opacity: 1,
                        transition: {
                            type: 'spring',
                            stiffness: 300,
                            damping: 30
                        }
                    },
                    exit: {
                        y: '100%',
                        opacity: 0,
                        transition: {
                            type: 'spring',
                            stiffness: 400,
                            damping: 40
                        }
                    }
                };
            case 'right':
            default:
                return {
                    hidden: { x: '100%', opacity: 0.5 },
                    visible: {
                        x: 0,
                        opacity: 1,
                        transition: {
                            type: 'spring',
                            stiffness: 300,
                            damping: 30
                        }
                    },
                    exit: {
                        x: '100%',
                        opacity: 0,
                        transition: {
                            type: 'spring',
                            stiffness: 400,
                            damping: 40
                        }
                    }
                };
        }
    };
    // Backdrop animation variants
    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.2
            }
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 0.2
            }
        }
    };
    // Close button animation variants
    const closeButtonVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                delay: 0.2,
                type: 'spring',
                stiffness: 500,
                damping: 20
            }
        },
        hover: {
            scale: 1.1,
            rotate: 90,
            transition: {
                type: 'spring',
                stiffness: 500,
                damping: 20
            }
        }
    };
    // Get close button position styles
    const getCloseButtonStyles = () => {
        if (closeButtonPosition === 'inside') {
            return {
                position: 'absolute',
                top: '15px',
                right: '15px'
            };
        }
        switch (position) {
            case 'left':
                return {
                    position: 'absolute',
                    top: '15px',
                    left: 'calc(100% + 10px)'
                };
            case 'top':
                return {
                    position: 'absolute',
                    bottom: '-40px',
                    right: '15px'
                };
            case 'bottom':
                return {
                    position: 'absolute',
                    top: '-40px',
                    right: '15px'
                };
            case 'right':
            default:
                return {
                    position: 'absolute',
                    top: '15px',
                    right: 'calc(100% + 10px)'
                };
        }
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsxs(_Fragment, { children: [showBackdrop && (_jsx(motion.div, { className: "fixed inset-0 bg-black/50 z-40 backdrop-blur-sm", variants: backdropVariants, initial: "hidden", animate: "visible", exit: "exit", onClick: closeOnOutsideClick ? onClose : undefined })), _jsx(motion.div, { className: `fixed z-50 bg-white dark:bg-gray-800 shadow-xl ${drawerClassName}`, style: getDrawerStyles(), variants: getVariants(), initial: "hidden", animate: "visible", exit: "exit", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: `h-full overflow-auto p-4 ${className}`, children: [closeButton && (_jsx(motion.button, { className: "p-2 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center text-gray-600 dark:text-gray-300 focus:outline-none", style: getCloseButtonStyles(), onClick: onClose, "aria-label": "Close drawer", variants: closeButtonVariants, initial: "hidden", animate: "visible", whileHover: "hover", children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), _jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })] }) })), children] }) })] })) }));
};
export default AnimatedDrawer;

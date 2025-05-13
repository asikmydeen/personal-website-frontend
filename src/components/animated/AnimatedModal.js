import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
const AnimatedModal = ({ children, isOpen, onClose, className = '', style = {}, animationType = 'zoom', backdrop = true, closeOnBackdropClick = true, }) => {
    // Define animation variants based on type
    const getModalVariants = () => {
        switch (animationType) {
            case 'zoom':
                return {
                    hidden: {
                        scale: 0.5,
                        opacity: 0,
                        y: -20 // Start slightly higher
                    },
                    visible: {
                        scale: 1,
                        opacity: 1,
                        y: 0,
                        transition: {
                            type: "spring",
                            damping: 25,
                            stiffness: 300
                        }
                    },
                    exit: {
                        scale: 0.8,
                        opacity: 0,
                        transition: {
                            duration: 0.2
                        }
                    }
                };
            case 'slide':
                return {
                    hidden: {
                        y: -50,
                        opacity: 0
                    },
                    visible: {
                        y: 0,
                        opacity: 1,
                        transition: {
                            type: "spring",
                            damping: 25,
                            stiffness: 300
                        }
                    },
                    exit: {
                        y: 50,
                        opacity: 0,
                        transition: {
                            duration: 0.2
                        }
                    }
                };
            case 'flip':
                return {
                    hidden: {
                        rotateX: 90,
                        opacity: 0
                    },
                    visible: {
                        rotateX: 0,
                        opacity: 1,
                        transition: {
                            type: "spring",
                            damping: 20,
                            stiffness: 100
                        }
                    },
                    exit: {
                        rotateX: 90,
                        opacity: 0,
                        transition: {
                            duration: 0.2
                        }
                    }
                };
            case 'fade':
            default:
                return {
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
                            duration: 0.15
                        }
                    }
                };
        }
    };
    // Backdrop animation
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
                delay: 0.1,
                duration: 0.2
            }
        }
    };
    // Get the appropriate variants
    const modalVariants = getModalVariants();
    // Fix for body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            // Save current overflow style
            const originalStyle = window.getComputedStyle(document.body).overflow;
            // Prevent background scrolling when modal is open
            document.body.style.overflow = 'hidden';
            // Restore scroll on unmount
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);
    return createPortal(_jsx(AnimatePresence, { children: isOpen && (_jsxs(_Fragment, { children: [backdrop && (_jsx(motion.div, { className: "fixed inset-0 bg-black/50 z-40 backdrop-blur-sm", variants: backdropVariants, initial: "hidden", animate: "visible", exit: "exit", onClick: closeOnBackdropClick ? onClose : undefined })), _jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center", style: { margin: 0 }, children: _jsx(motion.div, { className: `bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full m-4 ${className}`, style: { ...style, transformOrigin: 'center', maxHeight: '90vh', overflow: 'auto' }, variants: modalVariants, initial: "hidden", animate: "visible", exit: "exit", role: "dialog", "aria-modal": "true", children: children }) })] })) }), document.body);
};
export default AnimatedModal;

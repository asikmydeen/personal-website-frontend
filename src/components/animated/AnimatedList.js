import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { motion } from 'framer-motion';
const AnimatedList = ({ children, className = '', style = {}, itemClassName = '', itemStyle = {}, staggerDelay = 0.1, initialDelay = 0, direction = 'up', as = 'ul' }) => {
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
            return (_jsx(motion.ul, { className: className, style: style, variants: containerVariants, initial: "hidden", animate: "visible", children: React.Children.map(children, (child, index) => (_jsx(motion.li, { className: itemClassName, style: itemStyle, variants: itemVariants, children: child }, index))) }));
        }
        else if (as === 'ol') {
            return (_jsx(motion.ol, { className: className, style: style, variants: containerVariants, initial: "hidden", animate: "visible", children: React.Children.map(children, (child, index) => (_jsx(motion.li, { className: itemClassName, style: itemStyle, variants: itemVariants, children: child }, index))) }));
        }
        else {
            // Default to div with div children
            return (_jsx(motion.div, { className: className, style: style, variants: containerVariants, initial: "hidden", animate: "visible", children: React.Children.map(children, (child, index) => (_jsx(motion.div, { className: itemClassName, style: itemStyle, variants: itemVariants, children: child }, index))) }));
        }
    };
    return renderList();
};
export default AnimatedList;

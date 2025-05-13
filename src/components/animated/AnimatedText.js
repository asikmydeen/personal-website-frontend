import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { fadeIn, slideUp, slideInLeft, slideInRight } from '../../animations';
const getVariant = (variant) => {
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
const AnimatedText = ({ children, className = '', style = {}, variant = 'fade', delay = 0, duration = 0.5, element = 'div', staggerChildren = false, childrenDelay = 0.1 }) => {
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
            return (_jsx(motion.p, { className: className, style: style, variants: containerVariants, initial: "hidden", animate: "visible", children: words.map((word, i) => (_jsx(motion.span, { style: { display: 'inline-block', marginRight: '0.25em' }, variants: wordVariants, children: word }, i))) }));
        }
        else if (element === 'h1') {
            return (_jsx(motion.h1, { className: className, style: style, variants: containerVariants, initial: "hidden", animate: "visible", children: words.map((word, i) => (_jsx(motion.span, { style: { display: 'inline-block', marginRight: '0.25em' }, variants: wordVariants, children: word }, i))) }));
        }
        else if (element === 'h2') {
            return (_jsx(motion.h2, { className: className, style: style, variants: containerVariants, initial: "hidden", animate: "visible", children: words.map((word, i) => (_jsx(motion.span, { style: { display: 'inline-block', marginRight: '0.25em' }, variants: wordVariants, children: word }, i))) }));
        }
        else if (element === 'span') {
            return (_jsx(motion.span, { className: className, style: style, variants: containerVariants, initial: "hidden", animate: "visible", children: words.map((word, i) => (_jsx(motion.span, { style: { display: 'inline-block', marginRight: '0.25em' }, variants: wordVariants, children: word }, i))) }));
        }
        else {
            // Default to div
            return (_jsx(motion.div, { className: className, style: style, variants: containerVariants, initial: "hidden", animate: "visible", children: words.map((word, i) => (_jsx(motion.span, { style: { display: 'inline-block', marginRight: '0.25em' }, variants: wordVariants, children: word }, i))) }));
        }
    }
    // Regular animated text without staggered children
    if (element === 'p') {
        return (_jsx(motion.p, { className: className, style: style, variants: animations, initial: "hidden", animate: "visible", transition: {
                duration: duration,
                delay: delay,
                type: "spring",
                stiffness: 100,
                damping: 15
            }, children: children }));
    }
    else if (element === 'h1') {
        return (_jsx(motion.h1, { className: className, style: style, variants: animations, initial: "hidden", animate: "visible", transition: {
                duration: duration,
                delay: delay,
                type: "spring",
                stiffness: 100,
                damping: 15
            }, children: children }));
    }
    else if (element === 'h2') {
        return (_jsx(motion.h2, { className: className, style: style, variants: animations, initial: "hidden", animate: "visible", transition: {
                duration: duration,
                delay: delay,
                type: "spring",
                stiffness: 100,
                damping: 15
            }, children: children }));
    }
    else if (element === 'h3') {
        return (_jsx(motion.h3, { className: className, style: style, variants: animations, initial: "hidden", animate: "visible", transition: {
                duration: duration,
                delay: delay,
                type: "spring",
                stiffness: 100,
                damping: 15
            }, children: children }));
    }
    else if (element === 'span') {
        return (_jsx(motion.span, { className: className, style: style, variants: animations, initial: "hidden", animate: "visible", transition: {
                duration: duration,
                delay: delay,
                type: "spring",
                stiffness: 100,
                damping: 15
            }, children: children }));
    }
    else {
        // Default to div
        return (_jsx(motion.div, { className: className, style: style, variants: animations, initial: "hidden", animate: "visible", transition: {
                duration: duration,
                delay: delay,
                type: "spring",
                stiffness: 100,
                damping: 15
            }, children: children }));
    }
};
export default AnimatedText;

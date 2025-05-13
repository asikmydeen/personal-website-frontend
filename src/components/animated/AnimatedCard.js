import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { cardHover } from '../../animations';
const AnimatedCard = ({ children, className = '', style = {}, delay = 0 }) => {
    return (_jsx(motion.div, { className: `animated-card ${className}`, style: {
            background: 'var(--card-bg, #fff)',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            ...style
        }, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: {
            duration: 0.4,
            delay,
            type: "spring",
            stiffness: 100,
            damping: 15
        }, whileHover: "hover", variants: cardHover, children: children }));
};
AnimatedCard.displayName = "AnimatedCard";
export { AnimatedCard };

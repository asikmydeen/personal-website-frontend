import React, { ReactNode } from 'react';
interface AnimatedTextProps {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    variant?: 'fade' | 'slideUp' | 'slideInLeft' | 'slideInRight';
    delay?: number;
    duration?: number;
    element?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div';
    staggerChildren?: boolean;
    childrenDelay?: number;
}
declare const AnimatedText: React.FC<AnimatedTextProps>;
export default AnimatedText;

import React, { ReactNode } from 'react';
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
declare const AnimatedList: React.FC<AnimatedListProps>;
export default AnimatedList;

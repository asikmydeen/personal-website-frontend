import React, { ReactNode } from 'react';
interface AnimatedCardProps {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    delay?: number;
}
declare const AnimatedCard: React.FC<AnimatedCardProps>;
export { AnimatedCard };

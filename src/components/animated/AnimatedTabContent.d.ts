import React, { ReactNode } from 'react';
interface AnimatedTabContentProps {
    children: ReactNode;
    activeTab: string | number;
    tabId: string | number;
    className?: string;
    style?: React.CSSProperties;
    animationType?: 'fade' | 'slide' | 'zoom' | 'flip';
    direction?: 'left' | 'right' | 'up' | 'down';
}
declare const AnimatedTabContent: React.FC<AnimatedTabContentProps>;
export default AnimatedTabContent;

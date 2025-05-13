import React, { ReactNode } from 'react';
interface PageTransitionProps {
    children: ReactNode;
    location?: string;
    className?: string;
    style?: React.CSSProperties;
    transitionType?: 'fade' | 'slide' | 'zoom' | 'flip';
}
declare const PageTransition: React.FC<PageTransitionProps>;
export default PageTransition;

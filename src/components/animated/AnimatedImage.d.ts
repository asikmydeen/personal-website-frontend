import React from 'react';
interface AnimatedImageProps {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    width?: number | string;
    height?: number | string;
    animationType?: 'fade' | 'zoom' | 'slide' | 'reveal' | 'bounce';
    delay?: number;
    duration?: number;
    onClick?: () => void;
    hoverEffect?: boolean;
}
declare const AnimatedImage: React.FC<AnimatedImageProps>;
export default AnimatedImage;

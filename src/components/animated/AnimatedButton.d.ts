import React, { ReactNode } from 'react';
import { HTMLMotionProps } from 'framer-motion';
interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
    children: ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    animateOnHover?: boolean;
    animateOnTap?: boolean;
}
declare const AnimatedButton: React.FC<AnimatedButtonProps>;
export default AnimatedButton;

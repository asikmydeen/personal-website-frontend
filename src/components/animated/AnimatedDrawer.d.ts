import React, { ReactNode } from 'react';
interface AnimatedDrawerProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    position?: 'right' | 'left' | 'top' | 'bottom';
    width?: string | number;
    height?: string | number;
    closeOnOutsideClick?: boolean;
    showBackdrop?: boolean;
    className?: string;
    drawerClassName?: string;
    closeButton?: boolean;
    closeButtonPosition?: 'inside' | 'outside';
}
declare const AnimatedDrawer: React.FC<AnimatedDrawerProps>;
export default AnimatedDrawer;

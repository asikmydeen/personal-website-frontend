import React, { ReactNode } from 'react';
interface AnimatedModalProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    className?: string;
    style?: React.CSSProperties;
    animationType?: 'zoom' | 'slide' | 'fade' | 'flip';
    backdrop?: boolean;
    closeOnBackdropClick?: boolean;
}
declare const AnimatedModal: React.FC<AnimatedModalProps>;
export default AnimatedModal;

import React from 'react';
interface AnimatedSidebarItemProps {
    to: string;
    icon: string;
    label: string;
    isActive: boolean;
    collapsed: boolean;
    onClick?: () => void;
}
declare const AnimatedSidebarItem: React.FC<AnimatedSidebarItemProps>;
export default AnimatedSidebarItem;

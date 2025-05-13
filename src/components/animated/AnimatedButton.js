import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { buttonHover } from '../../animations';
const AnimatedButton = ({ children, className = '', variant = 'primary', size = 'md', fullWidth = false, animateOnHover = true, animateOnTap = true, ...props }) => {
    // Base styling classes
    const baseClasses = 'rounded font-medium transition-colors focus:outline-none';
    // Size classes
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
    };
    // Variant classes (simplified - you can customize these as needed)
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-500 text-white hover:bg-gray-600',
        outline: 'border border-blue-500 text-blue-500 hover:bg-blue-50',
        ghost: 'text-blue-500 hover:bg-blue-50'
    };
    // Width class
    const widthClass = fullWidth ? 'w-full' : '';
    // Combined classes
    const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`;
    // Animation props
    const animationProps = {
        ...(animateOnHover && { whileHover: 'hover' }),
        ...(animateOnTap && { whileTap: 'tap' }),
        variants: buttonHover
    };
    return (_jsx(motion.button, { className: combinedClasses, ...animationProps, initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: {
            type: 'spring',
            stiffness: 500,
            damping: 20
        }, ...props, children: children }));
};
export default AnimatedButton;

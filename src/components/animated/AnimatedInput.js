import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const AnimatedInput = ({ label, error, animateLabel = true, animateFocus = true, animateError = true, className = '', inputClassName = '', labelClassName = '', errorClassName = '', id, value, onChange, onFocus, onBlur, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(Boolean(value));
    const inputRef = useRef(null);
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    useEffect(() => {
        setHasValue(Boolean(value));
    }, [value]);
    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) {
            onFocus(e);
        }
    };
    const handleBlur = (e) => {
        setIsFocused(false);
        if (onBlur) {
            onBlur(e);
        }
    };
    const handleChange = (e) => {
        setHasValue(Boolean(e.target.value));
        if (onChange) {
            onChange(e);
        }
    };
    // Animation variants
    const labelVariants = {
        rest: {
            y: 0,
            scale: 1,
            color: 'var(--label-color, #6b7280)',
            transition: { duration: 0.2, ease: "easeInOut" }
        },
        focus: {
            y: -25,
            scale: 0.85,
            color: 'var(--focus-color, #3b82f6)',
            transition: { duration: 0.2, ease: "easeInOut" }
        },
        error: {
            y: -25,
            scale: 0.85,
            color: 'var(--error-color, #ef4444)',
            transition: { duration: 0.2, ease: "easeInOut" }
        },
        filled: {
            y: -25,
            scale: 0.85,
            color: 'var(--label-color, #6b7280)',
            transition: { duration: 0.2, ease: "easeInOut" }
        }
    };
    const inputVariants = {
        rest: {
            borderColor: 'var(--border-color, #e5e7eb)',
            transition: { duration: 0.2 }
        },
        focus: {
            borderColor: 'var(--focus-color, #3b82f6)',
            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
            transition: { duration: 0.2 }
        },
        error: {
            borderColor: 'var(--error-color, #ef4444)',
            boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)',
            transition: { duration: 0.2 }
        }
    };
    const errorVariants = {
        hidden: {
            opacity: 0,
            y: -5,
            height: 0,
            marginTop: 0
        },
        visible: {
            opacity: 1,
            y: 0,
            height: 'auto',
            marginTop: 4,
            transition: { duration: 0.2, ease: "easeInOut" }
        }
    };
    // Determine label state for animation
    const getLabelState = () => {
        if (error)
            return 'error';
        if (isFocused)
            return 'focus';
        if (hasValue)
            return 'filled';
        return 'rest';
    };
    // Determine input state for animation
    const getInputState = () => {
        if (error)
            return 'error';
        if (isFocused)
            return 'focus';
        return 'rest';
    };
    return (_jsxs("div", { className: `relative flex flex-col ${className}`, children: [label && (_jsx(motion.label, { htmlFor: inputId, className: `absolute left-3 pointer-events-none origin-left ${labelClassName}`, initial: "rest", animate: animateLabel ? getLabelState() : undefined, variants: animateLabel ? labelVariants : undefined, style: {
                    top: hasValue || isFocused ? '0px' : '12px'
                }, children: label })), _jsx(motion.input, { ref: inputRef, id: inputId, className: `px-3 py-2 border rounded-md bg-transparent ${inputClassName}`, initial: "rest", animate: animateFocus ? getInputState() : undefined, variants: animateFocus ? inputVariants : undefined, onFocus: handleFocus, onBlur: handleBlur, onChange: handleChange, value: value, ...props }), _jsx(AnimatePresence, { children: error && animateError && (_jsx(motion.div, { className: `text-red-500 text-sm ${errorClassName}`, initial: "hidden", animate: "visible", exit: "hidden", variants: errorVariants, children: error })) })] }));
};
export default AnimatedInput;

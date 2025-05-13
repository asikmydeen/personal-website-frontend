import React from 'react';
import { HTMLMotionProps } from 'framer-motion';
interface AnimatedInputProps extends HTMLMotionProps<"input"> {
    label?: string;
    error?: string;
    animateLabel?: boolean;
    animateFocus?: boolean;
    animateError?: boolean;
    className?: string;
    inputClassName?: string;
    labelClassName?: string;
    errorClassName?: string;
}
declare const AnimatedInput: React.FC<AnimatedInputProps>;
export default AnimatedInput;

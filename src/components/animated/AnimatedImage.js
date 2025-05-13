import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const AnimatedImage = ({ src, alt, className = '', style = {}, width, height, animationType = 'fade', delay = 0, duration = 0.5, onClick, hoverEffect = true }) => {
    // Get animation variants based on type
    const getVariants = () => {
        switch (animationType) {
            case 'fade':
                return {
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: {
                            duration: duration,
                            delay: delay,
                            ease: 'easeOut'
                        }
                    }
                };
            case 'zoom':
                return {
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: {
                        opacity: 1,
                        scale: 1,
                        transition: {
                            duration: duration,
                            delay: delay,
                            type: 'spring',
                            stiffness: 200,
                            damping: 20
                        }
                    }
                };
            case 'slide':
                return {
                    hidden: { opacity: 0, x: -100 },
                    visible: {
                        opacity: 1,
                        x: 0,
                        transition: {
                            duration: duration,
                            delay: delay,
                            type: 'spring',
                            stiffness: 300,
                            damping: 25
                        }
                    }
                };
            case 'reveal':
                return {
                    hidden: { clipPath: 'inset(0 100% 0 0)' },
                    visible: {
                        clipPath: 'inset(0 0% 0 0)',
                        transition: {
                            duration: duration,
                            delay: delay,
                            ease: 'easeOut'
                        }
                    }
                };
            case 'bounce':
                return {
                    hidden: { opacity: 0, y: -50 },
                    visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                            type: 'spring',
                            stiffness: 300,
                            damping: 10,
                            delay: delay
                        }
                    }
                };
            default:
                return {
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: {
                            duration: duration,
                            delay: delay
                        }
                    }
                };
        }
    };
    // Define hover and tap animations directly in the motion component
    return (_jsx(motion.div, { className: `overflow-hidden ${className}`, style: {
            width: width,
            height: height,
            ...style
        }, initial: "hidden", animate: "visible", variants: getVariants(), whileHover: hoverEffect ? 'hover' : undefined, whileTap: onClick && hoverEffect ? 'tap' : undefined, onClick: onClick, children: _jsx(motion.img, { src: src, alt: alt, className: "w-full h-full object-cover", variants: animationType === 'reveal'
                ? {} // For reveal animation, we animate the container, not the image
                : getVariants() }) }));
};
export default AnimatedImage;

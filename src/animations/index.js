// Fade in animation
export const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.5 }
    }
};
// Slide up animation
export const slideUp = {
    hidden: { y: 50, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};
// Slide in from left
export const slideInLeft = {
    hidden: { x: -100, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};
// Slide in from right
export const slideInRight = {
    hidden: { x: 100, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};
// Scale animation
export const scaleUp = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};
// Staggered children animation container
export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};
// Logo hover animation
export const logoHover = {
    hover: {
        rotate: [0, 5, -5, 5, 0],
        transition: {
            duration: 0.5
        }
    }
};
// Button hover animation
export const buttonHover = {
    hover: {
        scale: 1.05,
        boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.2)",
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 10
        }
    },
    tap: {
        scale: 0.95
    }
};
// Page transition variants
export const pageTransition = {
    initial: {
        opacity: 0,
        y: 20
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeInOut"
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
            ease: "easeInOut"
        }
    }
};
// Card hover animation
export const cardHover = {
    hover: {
        y: -5,
        boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)",
        transition: {
            type: "spring",
            stiffness: 200,
            damping: 15
        }
    }
};

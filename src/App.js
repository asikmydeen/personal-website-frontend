import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, slideUp, logoHover, buttonHover, staggerContainer } from './animations';
function App() {
    const [count, setCount] = useState(0);
    return (_jsx(AnimatePresence, { children: _jsxs(motion.div, { initial: "hidden", animate: "visible", variants: staggerContainer, className: "app-container", children: [_jsxs(motion.div, { variants: fadeIn, children: [_jsx(motion.a, { href: "https://vite.dev", target: "_blank", children: _jsx(motion.img, { src: viteLogo, className: "logo", alt: "Vite logo", whileHover: "hover", variants: logoHover }) }), _jsx(motion.a, { href: "https://react.dev", target: "_blank", children: _jsx(motion.img, { src: reactLogo, className: "logo react", alt: "React logo", whileHover: "hover", variants: logoHover }) })] }), _jsx(motion.h1, { variants: slideUp, children: "Vite + React" }), _jsxs(motion.div, { className: "card", variants: fadeIn, children: [_jsxs(motion.button, { onClick: () => setCount((count) => count + 1), whileHover: "hover", whileTap: "tap", variants: buttonHover, children: ["count is ", count] }), _jsxs(motion.p, { variants: slideUp, children: ["Edit ", _jsx("code", { children: "src/App.tsx" }), " and save to test HMR"] })] }), _jsx(motion.p, { className: "read-the-docs", variants: slideUp, initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.5 }, children: "Click on the Vite and React logos to learn more" })] }) }));
}
export default App;

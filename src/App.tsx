import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeIn, slideUp, logoHover, buttonHover, staggerContainer } from './animations'

function App() {
  const [count, setCount] = useState(0)

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="app-container"
      >
      <motion.div variants={fadeIn}>
        <motion.a href="https://vite.dev" target="_blank">
          <motion.img
            src={viteLogo}
            className="logo"
            alt="Vite logo"
            whileHover="hover"
            variants={logoHover}
          />
        </motion.a>
        <motion.a href="https://react.dev" target="_blank">
          <motion.img
            src={reactLogo}
            className="logo react"
            alt="React logo"
            whileHover="hover"
            variants={logoHover}
          />
        </motion.a>
      </motion.div>
      <motion.h1 variants={slideUp}>Vite + React</motion.h1>
      <motion.div className="card" variants={fadeIn}>
        <motion.button
          onClick={() => setCount((count) => count + 1)}
          whileHover="hover"
          whileTap="tap"
          variants={buttonHover}
        >
          count is {count}
        </motion.button>
        <motion.p variants={slideUp}>
          Edit <code>src/App.tsx</code> and save to test HMR
        </motion.p>
      </motion.div>
      <motion.p
        className="read-the-docs"
        variants={slideUp}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Click on the Vite and React logos to learn more
      </motion.p>
      </motion.div>
    </AnimatePresence>
  )
}

export default App

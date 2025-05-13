import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const AnimatedCard = React.forwardRef(
  ({ className, style, ...rest }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        "rounded-xl shadow bg-muted border border-muted-border text-muted-foreground",
        className
      )}
      {...rest}
    />
  )
)

AnimatedCard.displayName = "AnimatedCard"

export { AnimatedCard }

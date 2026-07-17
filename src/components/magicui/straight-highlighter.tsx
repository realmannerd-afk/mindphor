import type React from "react"
import { motion } from "framer-motion"

export function StraightHighlighter({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap z-0">
      <motion.span
        initial={{ width: 0 }}
        whileInView={{ width: "100%" }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute bottom-0 left-0 h-[110%] top-[-5%] bg-yellow-400 rounded-sm -z-10"
      />
      <span className="relative text-black font-semibold px-1 z-10">{children}</span>
    </span>
  )
}

import type React from "react"
import { motion } from "framer-motion"

export function StraightHighlighter({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap z-0">
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute bottom-0 left-0 w-full h-[110%] top-[-5%] bg-yellow-400 -z-10 origin-left"
        style={{
          borderRadius: "2px 255px 3px 255px / 255px 5px 225px 3px",
          transform: "rotate(-1deg)"
        }}
      />
      <span className="relative text-black font-semibold px-1 z-10">{children}</span>
    </span>
  )
}

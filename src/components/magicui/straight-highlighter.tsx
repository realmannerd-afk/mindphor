import type React from "react"
import { motion } from "framer-motion"

export function StraightHighlighter({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap z-0 px-2 py-0.5">
      <motion.svg
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        whileInView={{ clipPath: "inset(0 0 0 0)" }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute inset-0 w-full h-full -z-10"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <defs>
          <filter id="marker-rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <path d="M1,8 Q50,2 99,6 L97,94 Q50,98 3,92 Z" fill="#facc15" filter="url(#marker-rough)" />
      </motion.svg>
      <span className="relative text-black font-semibold z-10">{children}</span>
    </span>
  )
}

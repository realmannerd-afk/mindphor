import type React from "react"
import { motion } from "framer-motion"

export function StraightHighlighter({ children }: { children: React.ReactNode }) {
  // A hand-drawn SVG marker stroke encoded as a data URI
  const markerSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 40' preserveAspectRatio='none'%3E%3Cpath d='M3,20 C30,10 100,15 197,17 C190,32 120,38 5,33 Z' fill='%23facc15'/%3E%3Cpath d='M0,25 C50,22 150,18 199,22 C195,35 100,42 2,38 Z' fill='%23facc15' opacity='0.7'/%3E%3C/svg%3E")`

  return (
    <span className="relative inline-block whitespace-nowrap z-0 px-1">
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute bottom-0 left-0 w-full h-[120%] top-[-10%] -z-10 origin-left"
        style={{
          backgroundImage: markerSvg,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />
      <span className="relative text-black font-semibold z-10">{children}</span>
    </span>
  )
}

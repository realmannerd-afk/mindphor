import type React from "react"
import { motion } from "framer-motion"

export function StraightHighlighter({ children }: { children: React.ReactNode }) {
  // A hand-drawn SVG marker that fully covers the background with wavy, uneven edges
  const markerSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M2,4 Q25,0 75,2 T98,5 Q100,50 97,95 Q75,100 25,98 T3,96 Q0,50 2,4 Z' fill='%23facc15'/%3E%3C/svg%3E")`

  return (
    <span className="relative inline-block whitespace-nowrap z-0 px-1">
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute bottom-0 left-[-5%] w-[110%] h-[130%] top-[-15%] -z-10 origin-left"
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

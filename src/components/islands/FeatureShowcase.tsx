"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  {
    id: "feedback-traceability",
    title: "Feedback Traceability",
    description: "Aggregate and filter raw user feedback from the Play Store and Reddit in a single intuitive table. Slice data by sentiment, source, or specific competitor.",
    imageSrc: "/features/explorer-mockup.png",
  },
  {
    id: "competitor-intelligence",
    title: "Competitor Intelligence",
    description: "Monitor your closest rivals with side-by-side sentiment tracking and dedicated competitor profiles to see exactly where they are failing and how you can capitalize.",
    imageSrc: "/features/trends-mockup.png",
  },
  {
    id: "actionable-ai-insights",
    title: "Actionable AI Insights",
    description: "Every piece of negative feedback is automatically analyzed to generate a specific, tactical action plan. Stop just reading complaints and start fixing them.",
    imageSrc: "/features/tagging-mockup.png",
  },
  {
    id: "real-time-alerts",
    title: "Deep Alert Analysis",
    description: "Stay ahead of the curve with deep contextual alerts. Instantly view affected sources, raw evidence, and automated action plans for critical issues.",
    imageSrc: "/features/alerts-mockup.png",
  }
];

export default function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState(0);

  // Auto-play the tabs every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % features.length);
    }, 4000);
    
    // Clear interval on unmount or when activeTab changes (so manual clicks reset the timer)
    return () => clearInterval(timer);
  }, [activeTab]);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-16 items-stretch select-none">
        
        {/* Left Side: Clickable Accordion Tabs */}
        <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col justify-center gap-6 py-2">
          {features.map((feature, index) => {
            const isActive = activeTab === index;
            return (
              <button
                key={feature.id}
                onClick={() => setActiveTab(index)}
                className={`text-left py-4 transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? 'opacity-100'
                    : 'opacity-40 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className={`text-[20px] font-mono font-light leading-none mt-1 transition-colors ${
                    isActive ? 'text-accent' : 'text-text-muted/50'
                  }`}>
                    0{index + 1}
                  </span>
                  <div className="w-full">
                    <h3 className={`text-[15px] font-medium transition-colors ${
                      isActive ? 'text-text-primary' : 'text-text-secondary'
                    }`}>
                      {feature.title}
                    </h3>

                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: "auto", opacity: 1, marginTop: 8 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="text-[13px] leading-relaxed text-text-secondary">
                            {feature.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Image Display Box */}
        <div className="w-full flex-1 relative flex items-center justify-center aspect-[16/9]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0 z-10 w-full h-full flex items-center justify-center rounded-[12px] overflow-hidden"
            >
              {/* Background */}
              <img
                src="/background_image.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover z-0"
              />

              {/* Screenshot */}
              <img
                src={features[activeTab].imageSrc}
                alt={features[activeTab].title}
                className="relative z-10 max-w-[90%] max-h-[90%] w-auto h-auto object-contain rounded-[6px] shadow-[0_8px_40px_rgba(0,0,0,0.15)]"
              />
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

let interval: any;

type Card = {
  id: string;
  imageSrc: string;
  title?: string;
};

export const CardStack = ({
  items,
  offset,
  scaleFactor,
}: {
  items: Card[];
  offset?: number;
  scaleFactor?: number;
}) => {
  const CARD_OFFSET = offset || 30; // Shift cards down
  const SCALE_FACTOR = scaleFactor || 0.05; // Scale down cards in back
  const [cards, setCards] = useState<Card[]>(items);

  useEffect(() => {
    startFlipping();
    return () => clearInterval(interval);
  }, []);

  const startFlipping = () => {
    interval = setInterval(() => {
      setCards((prevCards: Card[]) => {
        const newArray = [...prevCards];
        newArray.unshift(newArray.pop()!);
        return newArray;
      });
    }, 4000); // Flips every 4 seconds
  };

  return (
    <div className="relative w-full max-w-[1000px] aspect-[16/9] mx-auto">
      {cards.map((card, index) => {
        return (
          <motion.div
            key={card.id}
            className="absolute top-0 left-0 w-full h-full rounded-[32px] md:rounded-[40px] shadow-2xl border border-border-default bg-bg-base overflow-hidden"
            style={{
              transformOrigin: "bottom center",
            }}
            animate={{
              top: index * -CARD_OFFSET, // Stack goes UP instead of down
              scale: 1 - index * SCALE_FACTOR,
              zIndex: cards.length - index,
            }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1], // Smooth custom spring-like ease
            }}
          >
            {/* Fallback Missing Image Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border-faint rounded-[32px] md:rounded-[40px] m-4 bg-bg-subtle/50 z-0">
              <span className="text-text-muted font-mono text-xs uppercase tracking-widest mb-2">Missing</span>
              <p className="text-text-primary text-sm font-medium">{card.imageSrc}</p>
            </div>
            
            <img 
              src={card.imageSrc} 
              alt={card.title || "Feature Image"}
              className="absolute inset-0 w-full h-full object-cover z-10"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = '0';
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

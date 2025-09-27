"use client"

import { motion } from "framer-motion"

export function TextReveal({ text, className = "" }) {
  const words = text.split(" ")

  return (
    <div className={`sticky top-0 mx-auto flex h-[50%] max-w-5xl items-center bg-transparent px-[1rem] ${className}`}>
      <div className="flex flex-wrap justify-center text-2xl font-normal md:text-3xl lg:text-4xl xl:text-3xl">
        {words.map((word, index) => (
          <span key={index} className="relative mx-1 lg:mx-1.5">
            {/* Ghost/faint word underneath */}
            <span className="absolute opacity-30 text-black/20 dark:text-white/20">
              {word}
            </span>
            {/* Animated word on top */}
            <motion.span
              className="text-black dark:text-white"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1,
                ease: "easeOut"
              }}
              viewport={{
                once: true,
                amount: 0.3
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </div>
    </div>
  )
}
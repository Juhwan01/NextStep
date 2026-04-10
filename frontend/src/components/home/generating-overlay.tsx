"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { message: "목적지를 확인하고 있어요", icon: "🧭", duration: 4000 },
  { message: "필요한 기술들을 모으는 중이에요", icon: "🎒", duration: 5000 },
  { message: "기술들 사이의 길을 찾고 있어요", icon: "🛤️", duration: 5000 },
  { message: "현재 위치에서 출발점을 잡고 있어요", icon: "📍", duration: 4000 },
  { message: "당신만의 학습 지도를 그리는 중이에요", icon: "🗺️", duration: 6000 },
  { message: "거의 다 됐어요! 곧 출발합니다", icon: "✨", duration: 10000 },
];

export function GeneratingOverlay() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const step = STEPS[stepIndex];
    if (stepIndex >= STEPS.length - 1) return;

    const timer = setTimeout(() => {
      setStepIndex((prev) => prev + 1);
    }, step.duration);

    return () => clearTimeout(timer);
  }, [stepIndex]);

  const current = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]/90 backdrop-blur-sm"
    >
      <div className="text-center max-w-md mx-auto px-6">
        {/* Animated orb */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-[#00d4ff]/40"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-[#00ffd5]/30"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            {current.icon}
          </div>
        </div>

        {/* Step message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-lg text-white font-medium mb-2"
          >
            {current.message}
          </motion.p>
        </AnimatePresence>

        <p className="text-sm text-white/30 mb-6">
          잠시만 기다려 주세요, 멋진 여정이 준비되고 있어요
        </p>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] to-[#00ffd5]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i <= stepIndex ? "bg-[#00d4ff]" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

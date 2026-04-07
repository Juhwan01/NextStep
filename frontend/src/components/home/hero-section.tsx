"use client";

import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <div className="relative text-center py-16 px-4">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute -top-20 right-0 w-96 h-96 bg-[#00d4ff]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-[#00ffd5]/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-4">
          <span className="bg-gradient-to-r from-[#00d4ff] to-[#00ffd5] bg-clip-text text-transparent">
            NextStep
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-white/60 mb-2">
          AI가 설계하는 나만의 학습 경로
        </p>
        <p className="text-base text-white/40 max-w-xl mx-auto">
          목표 직무를 입력하면, AI가 현재 수준에 맞는 최적의 학습 로드맵을 생성합니다
        </p>
      </motion.div>
    </div>
  );
}

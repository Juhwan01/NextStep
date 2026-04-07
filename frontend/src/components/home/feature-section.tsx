"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui";

const FEATURES = [
  {
    title: "AI 직무 분석",
    description: "어떤 직무든 자연어로 입력하면 AI가 필요한 기술을 자동으로 파악합니다.",
    icon: "🎯",
    color: "#00d4ff",
  },
  {
    title: "맞춤형 경로 설계",
    description: "현재 수준을 분석해 이미 아는 기술은 건너뛰고, 최적의 학습 순서를 제안합니다.",
    icon: "🗺️",
    color: "#00ffd5",
  },
  {
    title: "이중 경로 제공",
    description: "빠른 취업을 위한 Fast Track과 기본기를 다지는 Fundamentals 중 선택하세요.",
    icon: "⚡",
    color: "#FF6B6B",
  },
  {
    title: "학습 진도 추적",
    description: "완료한 기술을 체크하며 전체 진행률을 한눈에 확인할 수 있습니다.",
    icon: "📈",
    color: "#F7DC6F",
  },
];

export function FeatureSection() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-2xl font-bold text-center text-white mb-3"
      >
        어떻게 도와드릴까요?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-center text-white/40 mb-12"
      >
        NextStep이 학습 여정의 모든 단계를 함께합니다
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard
              variant="default"
              padding="md"
              className="h-full hover:bg-white/[0.07] hover:border-white/15 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

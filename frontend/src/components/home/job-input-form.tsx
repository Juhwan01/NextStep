"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input, Textarea } from "@/components/ui";
import { GlowButton } from "@/components/ui";
import { GlassCard } from "@/components/ui";

interface JobInputFormProps {
  onSubmit: (data: { jobInput: string; currentState: string }) => void;
  isLoading?: boolean;
}

export function JobInputForm({ onSubmit, isLoading = false }: JobInputFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [jobInput, setJobInput] = useState("");
  const [currentState, setCurrentState] = useState("");

  const handleNext = () => {
    if (jobInput.trim()) {
      setStep(2);
    }
  };

  const handleSubmit = () => {
    if (jobInput.trim() && currentState.trim()) {
      onSubmit({ jobInput: jobInput.trim(), currentState: currentState.trim() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (step === 1) handleNext();
      else handleSubmit();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard variant="elevated" padding="lg" className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] text-sm font-bold">1</span>
                  <h2 className="text-xl font-semibold text-white">목표 직무</h2>
                </div>
                <Input
                  placeholder="예: 백엔드 개발자, 데이터 사이언티스트, MLOps 엔지니어..."
                  value={jobInput}
                  onChange={(e) => setJobInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <p className="text-xs text-white/30">어떤 직무든 자유롭게 입력하세요. AI가 해석합니다.</p>
              </div>
              <div className="flex justify-end">
                <GlowButton onClick={handleNext} disabled={!jobInput.trim()}>
                  다음 단계
                </GlowButton>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard variant="elevated" padding="lg" className="space-y-6">
              {/* Show selected job */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[#00d4ff] text-sm">목표:</span>
                <span className="text-white font-medium">{jobInput}</span>
                <button
                  className="ml-auto text-white/40 hover:text-white text-sm"
                  onClick={() => setStep(1)}
                >
                  수정
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00ffd5]/20 text-[#00ffd5] text-sm font-bold">2</span>
                  <h2 className="text-xl font-semibold text-white">현재 상태</h2>
                </div>
                <Textarea
                  placeholder="예: Python 기초를 배웠고, SQL은 간단한 쿼리 정도 할 수 있습니다. 웹 개발 경험은 없습니다."
                  value={currentState}
                  onChange={(e) => setCurrentState(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={4}
                  autoFocus
                />
                <p className="text-xs text-white/30">현재 알고 있는 기술과 수준을 자유롭게 설명해주세요.</p>
              </div>
              <div className="flex justify-between">
                <GlowButton variant="ghost" onClick={() => setStep(1)}>
                  이전
                </GlowButton>
                <GlowButton
                  onClick={handleSubmit}
                  loading={isLoading}
                  disabled={!currentState.trim()}
                >
                  학습 경로 생성
                </GlowButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input, Textarea } from "@/components/ui";
import { GlowButton } from "@/components/ui";
import { GlassCard } from "@/components/ui";

const JOB_SUGGESTIONS = [
  "프론트엔드 개발자",
  "백엔드 개발자",
  "풀스택 개발자",
  "데이터 사이언티스트",
  "MLOps 엔지니어",
];

const STATE_SUGGESTIONS = [
  "완전 초보예요",
  "Python 좀 할 줄 알아요",
  "부트캠프 수료했어요",
  "CS 전공이에요",
];

interface JobInputFormProps {
  onSubmit: (data: { jobInput: string; currentState: string }) => void;
  isLoading?: boolean;
}

export function JobInputForm({ onSubmit, isLoading = false }: JobInputFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [jobInput, setJobInput] = useState("");
  const [currentState, setCurrentState] = useState("");

  const JOB_INPUT_MAX = 100;
  const STATE_INPUT_MAX = 1000;

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

  const appendState = (text: string) => {
    setCurrentState((prev) => (prev.trim() ? `${prev.trim()}. ${text}` : text));
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Map-style step progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {/* Start pin */}
        <div className="flex items-center gap-1.5">
          <div className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ${
            step >= 1 ? "bg-[#00d4ff]/15 shadow-[0_0_12px_rgba(0,212,255,0.3)]" : "bg-white/5"
          }`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              stroke={step >= 1 ? "#00d4ff" : "rgba(255,255,255,0.2)"}>
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
                fill={step >= 1 ? "rgba(0,212,255,0.2)" : "none"} />
            </svg>
            {step >= 1 && (
              <motion.div
                className="absolute inset-0 rounded-full border border-[#00d4ff]/30"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </div>
          <span className={`text-xs font-medium transition-colors duration-300 ${step >= 1 ? "text-[#00d4ff]" : "text-white/20"}`}>
            목표
          </span>
        </div>

        {/* Path line */}
        <div className="relative w-20 h-[2px] mx-1">
          <div className="absolute inset-0 bg-white/10 rounded-full" />
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "linear-gradient(90deg, #00d4ff, #00ffd5)" }}
            animate={{ width: step >= 2 ? "100%" : "0%" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          {/* Dashed overlay */}
          <div className="absolute inset-0 opacity-40"
            style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)" }}
          />
        </div>

        {/* Destination pin */}
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium transition-colors duration-300 ${step >= 2 ? "text-[#00ffd5]" : "text-white/20"}`}>
            현위치
          </span>
          <div className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ${
            step >= 2 ? "bg-[#00ffd5]/15 shadow-[0_0_12px_rgba(0,255,213,0.3)]" : "bg-white/5"
          }`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              stroke={step >= 2 ? "#00ffd5" : "rgba(255,255,255,0.2)"}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" fill={step >= 2 ? "rgba(0,255,213,0.2)" : "none"} />
            </svg>
            {step >= 2 && (
              <motion.div
                className="absolute inset-0 rounded-full border border-[#00ffd5]/30"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard variant="elevated" padding="lg" className="space-y-6 relative overflow-hidden">
              {/* Mini map illustration background */}
              <svg className="absolute top-0 right-0 w-40 h-40 pointer-events-none opacity-[0.04]" viewBox="0 0 100 100">
                <circle cx="75" cy="25" r="8" fill="#00d4ff" />
                <circle cx="30" cy="70" r="5" fill="#00ffd5" />
                <circle cx="55" cy="50" r="4" fill="#a78bfa" />
                <path d="M30,70 Q45,55 55,50 T75,25" fill="none" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>

              <div className="space-y-3 relative">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#00d4ff]/15 border border-[#00d4ff]/20">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-white">어디로 향하고 싶나요?</h2>
                    <p className="text-xs text-white/30 mt-0.5">도착지를 설정해주세요</p>
                  </div>
                </div>
                <Input
                  placeholder="예: 백엔드 개발자, 데이터 사이언티스트..."
                  value={jobInput}
                  onChange={(e) => setJobInput(e.target.value.slice(0, JOB_INPUT_MAX))}
                  onKeyDown={handleKeyDown}
                  maxLength={JOB_INPUT_MAX}
                  autoFocus
                />
                <div className="flex justify-between">
                  <p className="text-xs text-white/30">직무, 되고 싶은 모습, 뭐든 좋아요</p>
                  <p className={`text-xs ${jobInput.length >= JOB_INPUT_MAX ? "text-red-400" : "text-white/20"}`}>
                    {jobInput.length}/{JOB_INPUT_MAX}
                  </p>
                </div>

                {/* Suggestion chips */}
                <motion.div
                  className="flex flex-wrap gap-2 pt-1"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                >
                  {JOB_SUGGESTIONS.map((suggestion) => (
                    <motion.button
                      key={suggestion}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      onClick={() => setJobInput(suggestion)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer ${
                        jobInput === suggestion
                          ? "bg-[#00d4ff]/15 border-[#00d4ff]/40 text-[#00d4ff]"
                          : "bg-white/5 border-white/10 text-white/50 hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/5 hover:text-white/70"
                      }`}
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </motion.div>
              </div>
              <div className="flex justify-end">
                <GlowButton onClick={handleNext} disabled={!jobInput.trim()}>
                  다음으로 →
                </GlowButton>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard variant="elevated" padding="lg" className="space-y-6 relative overflow-hidden">
              {/* Mini map illustration background */}
              <svg className="absolute top-0 right-0 w-40 h-40 pointer-events-none opacity-[0.04]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="30" fill="none" stroke="#00ffd5" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="50" cy="50" r="15" fill="none" stroke="#00ffd5" strokeWidth="0.8" strokeDasharray="3 3" />
                <circle cx="50" cy="50" r="4" fill="#00ffd5" />
                <line x1="50" y1="20" x2="50" y2="35" stroke="#00ffd5" strokeWidth="0.5" />
                <line x1="50" y1="65" x2="50" y2="80" stroke="#00ffd5" strokeWidth="0.5" />
                <line x1="20" y1="50" x2="35" y2="50" stroke="#00ffd5" strokeWidth="0.5" />
                <line x1="65" y1="50" x2="80" y2="50" stroke="#00ffd5" strokeWidth="0.5" />
              </svg>

              {/* Show selected job */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#00d4ff]/5 border border-[#00d4ff]/15 relative">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="rgba(0,212,255,0.15)" />
                </svg>
                <span className="text-white/80 font-medium text-sm">{jobInput}</span>
                <button
                  className="ml-auto text-white/30 hover:text-white/60 text-xs transition-colors"
                  onClick={() => setStep(1)}
                >
                  수정
                </button>
              </div>

              <div className="space-y-3 relative">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#00ffd5]/15 border border-[#00ffd5]/20">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ffd5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" fill="rgba(0,255,213,0.15)" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-white">지금 어디쯤 서 계신가요?</h2>
                    <p className="text-xs text-white/30 mt-0.5">출발점을 알려주세요</p>
                  </div>
                </div>
                <Textarea
                  placeholder="예: Python 기초를 배웠고, SQL은 간단한 쿼리 정도 할 수 있습니다."
                  value={currentState}
                  onChange={(e) => setCurrentState(e.target.value.slice(0, STATE_INPUT_MAX))}
                  rows={4}
                  maxLength={STATE_INPUT_MAX}
                  autoFocus
                />
                <div className="flex justify-between">
                  <p className="text-xs text-white/30">괜찮아요, 어디서든 시작할 수 있어요. 편하게 적어주세요.</p>
                  <p className={`text-xs ${currentState.length >= STATE_INPUT_MAX ? "text-red-400" : "text-white/20"}`}>
                    {currentState.length}/{STATE_INPUT_MAX}
                  </p>
                </div>

                {/* State suggestion chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {STATE_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => appendState(suggestion)}
                      className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-white/50 hover:border-[#00ffd5]/30 hover:bg-[#00ffd5]/5 hover:text-white/70 transition-all cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <GlowButton variant="ghost" onClick={() => setStep(1)}>
                  ← 이전
                </GlowButton>
                <GlowButton
                  onClick={handleSubmit}
                  loading={isLoading}
                  disabled={!currentState.trim()}
                >
                  나만의 지도 만들기
                </GlowButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

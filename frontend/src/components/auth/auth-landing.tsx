"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui";
import { CompassIcon, LoginForm, RegisterForm } from "./auth-modal";

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "AI 맞춤 경로",
    desc: "현재 수준에서 목표까지 최적의 학습 순서를 설계해요",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00ffd5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "실시간 진행 추적",
    desc: "학습 진도를 스킬맵 위에서 한눈에 확인할 수 있어요",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: "인터랙티브 스킬맵",
    desc: "노드 기반 시각화로 학습 관계를 직관적으로 파악해요",
  },
];

export function AuthLanding() {
  const [tab, setTab] = useState<"login" | "register">("register");

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-[#00d4ff]/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#00ffd5]/8 rounded-full blur-[120px]" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Animated path line in background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" preserveAspectRatio="none">
        <motion.path
          d="M0,400 Q200,300 400,350 T800,250 T1200,300 T1600,200"
          fill="none"
          stroke="url(#landing-gradient)"
          strokeWidth="2"
          strokeDasharray="8 6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id="landing-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#00ffd5" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: Branding */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Logo */}
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="bg-gradient-to-r from-[#00d4ff] to-[#00ffd5] bg-clip-text text-transparent">
                NextStep
              </span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-white/60 mb-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              나만의 학습 여정을 시작하세요
            </motion.p>

            <motion.p
              className="text-base text-white/35 mb-10 max-w-md mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              목표를 알려주세요. 지금 있는 곳에서 원하는 곳까지,
              <br className="hidden sm:block" />
              최적의 길을 함께 찾아드릴게요
            </motion.p>

            {/* Feature highlights */}
            <motion.div
              className="space-y-4 hidden md:block"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } } }}
            >
              {FEATURES.map((f) => (
                <motion.div
                  key={f.title}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  className="flex items-start gap-3 text-left max-w-sm mx-auto lg:mx-0"
                >
                  <span className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    {f.icon}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white/80">{f.title}</p>
                    <p className="text-xs text-white/35">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-full max-w-md mx-auto"
          >
            <GlassCard variant="elevated" padding="lg">
              {/* Header */}
              <div className="text-center mb-6">
                <CompassIcon />
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={tab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="text-xl font-bold text-white mb-1"
                  >
                    {tab === "login" ? "다시 돌아오셨군요!" : "여행을 시작하세요"}
                  </motion.h2>
                </AnimatePresence>
                <p className="text-sm text-white/40">당신만의 학습 지도가 기다리고 있어요</p>
              </div>

              {/* Tab switcher */}
              <div className="flex items-center gap-1 p-1 mb-6 bg-white/5 rounded-lg border border-white/10">
                <button
                  onClick={() => setTab("login")}
                  className={`flex-1 px-4 py-2 text-sm rounded-md transition-all relative ${
                    tab === "login" ? "text-white" : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {tab === "login" && (
                    <motion.div
                      layoutId="landing-tab-indicator"
                      className="absolute inset-0 rounded-md bg-white/10 border border-white/10"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">로그인</span>
                </button>
                <button
                  onClick={() => setTab("register")}
                  className={`flex-1 px-4 py-2 text-sm rounded-md transition-all relative ${
                    tab === "register" ? "text-white" : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {tab === "register" && (
                    <motion.div
                      layoutId="landing-tab-indicator"
                      className="absolute inset-0 rounded-md bg-white/10 border border-white/10"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">새로 시작하기</span>
                </button>
              </div>

              {/* Forms */}
              <AnimatePresence mode="wait">
                {tab === "login" ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LoginForm />
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RegisterForm />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toggle hint */}
              <p className="text-center text-xs text-white/25 mt-5">
                {tab === "login" ? (
                  <>
                    처음이신가요?{" "}
                    <button onClick={() => setTab("register")} className="text-[#00d4ff]/60 hover:text-[#00d4ff] transition-colors">
                      새로 시작하기
                    </button>
                  </>
                ) : (
                  <>
                    이미 계정이 있나요?{" "}
                    <button onClick={() => setTab("login")} className="text-[#00d4ff]/60 hover:text-[#00d4ff] transition-colors">
                      로그인
                    </button>
                  </>
                )}
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

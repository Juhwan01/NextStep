"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, GlowButton, Input } from "@/components/ui";
import { useAuthStore } from "@/stores/auth-store";
import { loginSchema, registerSchema } from "@/lib/auth-validation";
import type { LoginFormData, RegisterFormData } from "@/lib/auth-validation";
import type { ZodError } from "zod";

export function getFieldErrors<T extends Record<string, unknown>>(error: ZodError<T>) {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof T;
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function parseApiError(error: unknown): string {
  const err = error as { response?: { status?: number; data?: { detail?: string } } };
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail;

  if (status === 409 || detail?.includes("already")) return "이미 가입된 이메일이에요";
  if (status === 401) return "이메일 또는 비밀번호가 맞지 않아요";
  if (detail) return detail;
  return "연결에 문제가 있어요. 잠시 후 다시 시도해주세요";
}

/* ── Compass icon ── */
export function CompassIcon() {
  return (
    <div className="relative w-16 h-16 mx-auto mb-4">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,212,255,0.25) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-1 rounded-full border-2 border-[#00d4ff]/30"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="rgba(0,212,255,0.2)" stroke="#00d4ff" />
        </svg>
      </div>
    </div>
  );
}

/* ── Login Form ── */
export function LoginForm() {
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof LoginFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setApiError(null);
  };

  const handleSubmit = async () => {
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      await login(result.data);
    } catch (err) {
      setApiError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="이메일"
        type="email"
        placeholder="your@email.com"
        value={form.email}
        onChange={(e) => updateField("email", e.target.value)}
        onKeyDown={handleKeyDown}
        error={errors.email}
        autoFocus
      />
      <Input
        label="비밀번호"
        type="password"
        placeholder="6자 이상"
        value={form.password}
        onChange={(e) => updateField("password", e.target.value)}
        onKeyDown={handleKeyDown}
        error={errors.password}
      />
      {apiError && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {apiError}
        </div>
      )}
      <GlowButton onClick={handleSubmit} loading={loading} size="lg" className="w-full">
        로그인
      </GlowButton>
    </div>
  );
}

/* ── Register Form ── */
export function RegisterForm() {
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({ display_name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof RegisterFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setApiError(null);
  };

  const handleSubmit = async () => {
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      await register(result.data);
    } catch (err) {
      setApiError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="여행자 이름"
        placeholder="탐험할 때 사용할 이름"
        value={form.display_name}
        onChange={(e) => updateField("display_name", e.target.value)}
        onKeyDown={handleKeyDown}
        error={errors.display_name}
        autoFocus
      />
      <Input
        label="이메일"
        type="email"
        placeholder="your@email.com"
        value={form.email}
        onChange={(e) => updateField("email", e.target.value)}
        onKeyDown={handleKeyDown}
        error={errors.email}
      />
      <Input
        label="비밀번호"
        type="password"
        placeholder="6자 이상"
        value={form.password}
        onChange={(e) => updateField("password", e.target.value)}
        onKeyDown={handleKeyDown}
        error={errors.password}
      />
      {apiError && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {apiError}
        </div>
      )}
      <GlowButton onClick={handleSubmit} loading={loading} size="lg" className="w-full">
        탐험 시작하기
      </GlowButton>
    </div>
  );
}

/* ── Auth Modal ── */
export function AuthModal() {
  const { authModalOpen, authModalTab, authModalMessage, closeAuthModal } = useAuthStore();
  const setTab = (tab: "login" | "register") =>
    useAuthStore.setState({ authModalTab: tab });

  if (!authModalOpen) return null;

  const title = authModalTab === "login" ? "다시 돌아오셨군요!" : "여행을 시작하세요";
  const subtitle = "당신만의 학습 지도가 기다리고 있어요";

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]/85 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAuthModal();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-md mx-4"
          >
            <GlassCard variant="elevated" padding="lg" className="relative">
              {/* Close button */}
              <button
                onClick={closeAuthModal}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>

              {/* Journey header */}
              <div className="text-center mb-6">
                <CompassIcon />
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={authModalTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="text-xl font-bold text-white mb-1"
                  >
                    {title}
                  </motion.h2>
                </AnimatePresence>
                <p className="text-sm text-white/40">{subtitle}</p>
              </div>

              {/* Context banner */}
              {authModalMessage && (
                <div className="mb-5 px-3 py-2.5 rounded-lg bg-[#00d4ff]/5 border border-[#00d4ff]/15 text-sm text-[#00d4ff]/80 text-center">
                  {authModalMessage}
                </div>
              )}

              {/* Tab switcher */}
              <div className="flex items-center gap-1 p-1 mb-6 bg-white/5 rounded-lg border border-white/10">
                <button
                  onClick={() => setTab("login")}
                  className={`flex-1 px-4 py-2 text-sm rounded-md transition-all relative ${
                    authModalTab === "login"
                      ? "text-white"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {authModalTab === "login" && (
                    <motion.div
                      layoutId="auth-tab-indicator"
                      className="absolute inset-0 rounded-md bg-white/10 border border-white/10"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">로그인</span>
                </button>
                <button
                  onClick={() => setTab("register")}
                  className={`flex-1 px-4 py-2 text-sm rounded-md transition-all relative ${
                    authModalTab === "register"
                      ? "text-white"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {authModalTab === "register" && (
                    <motion.div
                      layoutId="auth-tab-indicator"
                      className="absolute inset-0 rounded-md bg-white/10 border border-white/10"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">새로 시작하기</span>
                </button>
              </div>

              {/* Forms */}
              <AnimatePresence mode="wait">
                {authModalTab === "login" ? (
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
                {authModalTab === "login" ? (
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}

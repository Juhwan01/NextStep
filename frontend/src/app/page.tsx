"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { HeroSection } from "@/components/home/hero-section";
import { JobInputForm } from "@/components/home/job-input-form";
import { FeatureSection } from "@/components/home/feature-section";
import { GeneratingOverlay } from "@/components/home/generating-overlay";
import { AuthLanding } from "@/components/auth/auth-landing";
import { useAuthStore } from "@/stores/auth-store";
import { usePathGenerationStore } from "@/stores/path-generation-store";
import { pathApi } from "@/services/path-api";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const { isGenerating, generatedPathId, error, generate, reset } = usePathGenerationStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewMode = searchParams.get("new") === "true";
  const [checkingPaths, setCheckingPaths] = useState(false);

  // Redirect when path generation completes
  useEffect(() => {
    if (generatedPathId) {
      const pathId = generatedPathId;
      reset();
      router.push(`/path/${pathId}`);
    }
  }, [generatedPathId, router, reset]);

  // Redirect to existing path if user already has one (skip if ?new=true)
  useEffect(() => {
    if (!token || isGenerating || isNewMode) return;

    setCheckingPaths(true);
    pathApi
      .getMine()
      .then((res: any) => {
        const paths = res?.paths;
        if (paths && paths.length > 0) {
          router.replace(`/path/${paths[0].id}`);
        } else {
          setCheckingPaths(false);
        }
      })
      .catch(() => {
        setCheckingPaths(false);
      });
  }, [token, router, isGenerating, isNewMode]);

  if (!user) {
    return <AuthLanding />;
  }

  // Show loading while checking for existing paths
  if (checkingPaths && !isGenerating) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
          <p className="text-sm text-white/40">학습 경로를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (data: { jobInput: string; currentState: string }) => {
    generate({
      job_input: data.jobInput,
      current_state: data.currentState,
    });
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <Header />
      <HeroSection />
      <JobInputForm onSubmit={handleSubmit} isLoading={isGenerating} />
      {error && (
        <div className="max-w-2xl mx-auto px-4 -mt-4 mb-4">
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
            {error}
          </div>
        </div>
      )}
      <FeatureSection />
      {isGenerating && <GeneratingOverlay />}
    </main>
  );
}

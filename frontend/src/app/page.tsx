"use client";

import { HeroSection } from "@/components/home/hero-section";
import { JobInputForm } from "@/components/home/job-input-form";
import { FeatureSection } from "@/components/home/feature-section";
import { GeneratingOverlay } from "@/components/home/generating-overlay";
import { usePathGeneration } from "@/hooks/use-path-generation";

export default function HomePage() {
  const { mutate, isPending } = usePathGeneration();

  const handleSubmit = (data: { jobInput: string; currentState: string }) => {
    mutate({
      job_input: data.jobInput,
      current_state: data.currentState,
    });
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <HeroSection />
      <JobInputForm onSubmit={handleSubmit} isLoading={isPending} />
      <FeatureSection />
      {isPending && <GeneratingOverlay />}
    </main>
  );
}

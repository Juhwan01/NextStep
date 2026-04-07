"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { pathApi, PathGenerateRequest } from "@/services/path-api";

export function usePathGeneration() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: PathGenerateRequest) => pathApi.generate(data),
    onSuccess: (data: any) => {
      router.push(`/path/${data.id}`);
    },
  });
}

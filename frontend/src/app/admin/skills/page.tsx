"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard, GlowButton, Input } from "@/components/ui";
import { apiClient } from "@/services/api-client";

interface Skill {
  id: string;
  name: string;
  name_ko: string;
  category: string;
  difficulty: number;
  market_demand: number;
  estimated_hours: number;
  description: string;
}

export default function SkillsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", name_ko: "", category: "cat_programming",
    difficulty: 0.5, market_demand: 0.5, estimated_hours: 40, description: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-skills", searchQuery],
    queryFn: () => apiClient.get(`/skills/search?q=${searchQuery || "a"}&limit=100`),
    enabled: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/admin/skills", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      setShowForm(false);
      setFormData({ name: "", name_ko: "", category: "cat_programming", difficulty: 0.5, market_demand: 0.5, estimated_hours: 40, description: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/skills/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-skills"] }),
  });

  const skills: Skill[] = (data as any)?.skills || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">스킬 관리</h1>
        <GlowButton onClick={() => setShowForm(!showForm)}>
          {showForm ? "취소" : "+ 스킬 추가"}
        </GlowButton>
      </div>

      {showForm && (
        <GlassCard className="mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="이름 (영문)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="React" />
            <Input label="이름 (한글)" value={formData.name_ko} onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })} placeholder="리액트" />
            <Input label="설명" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Component-based UI library" />
            <select
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="cat_programming">Programming</option>
              <option value="cat_web">Web</option>
              <option value="cat_frontend">Frontend</option>
              <option value="cat_backend">Backend</option>
              <option value="cat_devops">DevOps</option>
              <option value="cat_data">Data</option>
              <option value="cat_ai">AI/ML</option>
              <option value="cat_system">System Design</option>
              <option value="cat_cs">CS</option>
            </select>
          </div>
          <GlowButton onClick={() => createMutation.mutate(formData)} loading={createMutation.isPending}>
            생성
          </GlowButton>
        </GlassCard>
      )}

      <Input placeholder="스킬 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="mb-4" />

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-white/40">로딩 중...</p>
        ) : (
          skills.map((skill) => (
            <div key={skill.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <span className="text-white font-medium">{skill.name}</span>
                <span className="text-white/40 ml-2 text-sm">{skill.name_ko}</span>
                <span className="text-white/20 ml-3 text-xs">{skill.category.replace("cat_", "")}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/30">난이도 {Math.round(skill.difficulty * 5)}/5</span>
                <span className="text-xs text-white/30">{skill.estimated_hours}h</span>
                <button
                  onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMutation.mutate(skill.id); }}
                  className="text-red-400/50 hover:text-red-400 text-sm"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard, GlowButton, Input } from "@/components/ui";
import { apiClient } from "@/services/api-client";

export default function ContentPage() {
  const queryClient = useQueryClient();
  const [skillId, setSkillId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    skill_node_id: "", title: "", url: "", content_type: "article",
    provider: "", language: "ko", estimated_minutes: 60, is_free: true, description: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-content", skillId],
    queryFn: () => apiClient.get(`/content/by-skill/${skillId}`),
    enabled: !!skillId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/content/admin", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/content/admin/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-content"] }),
  });

  const contents: any[] = (data as any)?.contents || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">콘텐츠 관리</h1>
        <GlowButton onClick={() => setShowForm(!showForm)}>
          {showForm ? "취소" : "+ 콘텐츠 추가"}
        </GlowButton>
      </div>

      {showForm && (
        <GlassCard className="mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="스킬 노드 ID" value={formData.skill_node_id} onChange={(e) => setFormData({ ...formData, skill_node_id: e.target.value })} placeholder="prog_python" />
            <Input label="제목" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Python 공식 문서" />
            <Input label="URL" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
            <Input label="제공자" value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} placeholder="Python.org" />
            <select
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
              value={formData.content_type}
              onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
            >
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="course">Course</option>
              <option value="documentation">Documentation</option>
              <option value="tutorial">Tutorial</option>
            </select>
            <Input label="예상 시간 (분)" type="number" value={String(formData.estimated_minutes)} onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value) || 0 })} />
          </div>
          <GlowButton onClick={() => createMutation.mutate(formData)} loading={createMutation.isPending}>
            생성
          </GlowButton>
        </GlassCard>
      )}

      <Input label="스킬 ID로 검색" placeholder="prog_python" value={skillId} onChange={(e) => setSkillId(e.target.value)} className="mb-4" />

      {skillId && (
        <div className="space-y-2">
          {isLoading ? (
            <p className="text-white/40">로딩 중...</p>
          ) : contents.length > 0 ? (
            contents.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                <div>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#00d4ff] font-medium">
                    {c.title}
                  </a>
                  <div className="text-xs text-white/30 mt-1">
                    {c.content_type} · {c.provider} · {c.estimated_minutes}분
                  </div>
                </div>
                <button
                  onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMutation.mutate(c.id); }}
                  className="text-red-400/50 hover:text-red-400 text-sm"
                >
                  삭제
                </button>
              </div>
            ))
          ) : (
            <p className="text-white/30 text-sm">등록된 콘텐츠가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}

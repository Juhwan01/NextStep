export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">관리자 대시보드</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-6 bg-white/5 backdrop-blur-[12px] border border-white/10 rounded-xl">
          <div className="text-3xl font-bold text-[#00d4ff]">60+</div>
          <div className="text-sm text-white/40 mt-1">등록된 스킬</div>
        </div>
        <div className="p-6 bg-white/5 backdrop-blur-[12px] border border-white/10 rounded-xl">
          <div className="text-3xl font-bold text-[#00ffd5]">150+</div>
          <div className="text-sm text-white/40 mt-1">관계 설정</div>
        </div>
        <div className="p-6 bg-white/5 backdrop-blur-[12px] border border-white/10 rounded-xl">
          <div className="text-3xl font-bold text-purple-400">30+</div>
          <div className="text-sm text-white/40 mt-1">학습 콘텐츠</div>
        </div>
      </div>
    </div>
  );
}

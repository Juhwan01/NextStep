"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/skills", label: "스킬 관리" },
  { href: "/admin/content", label: "콘텐츠 관리" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-white/10 p-4 space-y-1">
        <div className="text-lg font-bold text-white mb-6 px-3">
          <span className="bg-gradient-to-r from-[#00d4ff] to-[#00ffd5] bg-clip-text text-transparent">
            NextStep
          </span>
          <span className="text-white/40 text-sm ml-2">Admin</span>
        </div>
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2 rounded-lg text-sm transition-all ${
              pathname === link.href
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

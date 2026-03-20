"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Heart, Users, MessageSquare, Tag, Database, LogOut, Menu, X, ChevronRight } from "lucide-react";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Patients", icon: Users },
  { href: "/dashboard/templates", label: "Templates", icon: MessageSquare },
  { href: "/dashboard/tags", label: "Tags", icon: Tag },
  { href: "/dashboard/data", label: "Data", icon: Database },
];

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/login");
      else setUser(user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-brand-800 text-white transform transition-transform lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-400" fill="currentColor" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold tracking-tight">CardioConnect</h1>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Patient Manager</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-white/10">
            <div className="text-xs text-white/40 truncate mb-2">{user.email}</div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <Heart className="w-5 h-5 text-red-400" fill="currentColor" />
          <span className="font-display font-bold text-brand-500">CardioConnect</span>
        </div>

        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

const supabase = createClient();

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const checkUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: 0 })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      setUnreadMessages(count || 0);
    };

    checkUnread();
    const interval = setInterval(checkUnread, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 sm:top-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-t sm:border-b border-white/10 z-40">
      <div className="max-w-xl mx-auto px-4 h-14 sm:h-12 flex items-center justify-between">
        {/* Logo (visible on mobile top) */}
        <Link href="/feed" className="hidden sm:flex items-center gap-2 font-bold text-white text-sm">
          <span className="text-violet-400">Himlab</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center justify-around sm:justify-end gap-2 sm:gap-1 flex-1 sm:flex-none">
          <Link
            href="/feed"
            className={`flex flex-col sm:flex-row items-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors ${
              isActive("/feed")
                ? "text-violet-400 bg-violet-500/10"
                : "text-white/60 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <span>📱</span>
            <span className="hidden sm:inline">Feed</span>
          </Link>

          <Link
            href="/directory"
            className={`flex flex-col sm:flex-row items-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors ${
              isActive("/directory")
                ? "text-violet-400 bg-violet-500/10"
                : "text-white/60 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <span>👥</span>
            <span className="hidden sm:inline">Direktori</span>
          </Link>

          <Link
            href="/messages"
            className={`relative flex flex-col sm:flex-row items-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors ${
              isActive("/messages")
                ? "text-violet-400 bg-violet-500/10"
                : "text-white/60 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <span>💬</span>
            <span className="hidden sm:inline">Pesan</span>
            {unreadMessages > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </Link>

          {/* Placeholder untuk mobile */}
          <div className="flex-1" />

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/");
            }}
            className="flex flex-col sm:flex-row items-center gap-1 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
          >
            <span>🚪</span>
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
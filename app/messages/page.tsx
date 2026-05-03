"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();

type Conversation = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j`;
  return `${Math.floor(hrs / 24)}d`;
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }

    // Get all users we have messages with
    const { data: messages } = await supabase
      .from("direct_messages")
      .select("sender_id, receiver_id, content, created_at, is_read")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!messages) {
      setLoading(false);
      return;
    }

    // Build conversation map
    const conversationMap = new Map<string, any>();
    for (const msg of messages) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          id: otherId,
          last_message: msg.content,
          last_message_time: msg.created_at,
          unread_count: msg.receiver_id === user.id && !msg.is_read ? 1 : 0,
        });
      } else {
        // Count unread
        const conv = conversationMap.get(otherId);
        if (msg.receiver_id === user.id && !msg.is_read) {
          conv.unread_count += 1;
        }
      }
    }

    // Get profile info for each conversation
    const convIds = Array.from(conversationMap.keys());
    if (convIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", convIds);

    if (profiles) {
      const enriched = profiles.map((profile) => ({
        ...profile,
        ...conversationMap.get(profile.id),
      }));
      setConversations(enriched.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      ));
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">Pesan Langsung</h1>
        <p className="text-sm text-white/40 mb-6">Hubungi alumni & anggota tanpa perlu WhatsApp</p>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 animate-pulse h-16" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/40">Belum ada percakapan.</p>
            <p className="text-sm text-white/30 mt-1">Mulai dengan mencari orang di Direktori.</p>
            <Link href="/directory" className="inline-block mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm transition-colors">
              Ke Direktori
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/messages/${conv.username}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-violet-500/20 ring-1 ring-violet-500/30 flex items-center justify-center text-sm font-semibold text-violet-300 flex-shrink-0">
                  {conv.avatar_url ? (
                    <img src={conv.avatar_url} alt={conv.full_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    initials(conv.full_name)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90">{conv.full_name}</p>
                  <p className="text-xs text-white/40 truncate">@{conv.username}</p>
                  <p className="text-xs text-white/50 truncate mt-0.5">{conv.last_message}</p>
                </div>

                {/* Unread badge + time */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-white/30">{timeAgo(conv.last_message_time)}</span>
                  {conv.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

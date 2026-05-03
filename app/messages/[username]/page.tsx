"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const supabase = createClient();

type Message = {
  id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  role: string;
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function MessagesPage() {
  const params = useParams();
  const targetUsername = params?.username as string;

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [targetUser, setTargetUser]   = useState<Profile | null>(null);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [sending, setSending]         = useState(false);
  const [loading, setLoading]         = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: me } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const { data: them } = await supabase.from("profiles").select("*").eq("username", targetUsername).single();
      if (!me || !them) return;

      setCurrentUser(me);
      setTargetUser(them);

      // Fetch history
      const { data: msgs } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${them.id}),and(sender_id.eq.${them.id},receiver_id.eq.${me.id})`)
        .order("created_at", { ascending: true });

      if (msgs) setMessages(msgs);

      // Mark as read
      await supabase.from("direct_messages")
        .update({ is_read: true })
        .match({ sender_id: them.id, receiver_id: me.id, is_read: false });

      setLoading(false);
    }
    init();
  }, [targetUsername]);

  // Realtime subscription
  useEffect(() => {
    if (!currentUser || !targetUser) return;

    const channel = supabase
      .channel(`dm-${currentUser.id}-${targetUser.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
      }, (payload) => {
        const msg = payload.new as Message;
        const relevant =
          (msg.sender_id === currentUser.id && targetUser.id) ||
          (msg.sender_id === targetUser.id);
        if (relevant) {
          setMessages((prev) => [...prev, msg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, targetUser]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !currentUser || !targetUser || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    await supabase.from("direct_messages").insert({
      sender_id: currentUser.id,
      receiver_id: targetUser.id,
      content,
    });

    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Group messages by date
  function getDateLabel(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Hari ini";
    if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  }

  return (
    <div className="h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[#0a0a0f]/80 backdrop-blur-sm flex-shrink-0">
        <Link href="/feed" className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>

        {targetUser && (
          <>
            <div className="w-9 h-9 rounded-full bg-violet-500/20 ring-1 ring-violet-500/30 flex items-center justify-center text-xs font-semibold text-violet-300 flex-shrink-0">
              {targetUser.avatar_url ? (
                <img src={targetUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                initials(targetUser.full_name)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white/90 truncate">{targetUser.full_name}</p>
              <p className="text-xs text-white/35">@{targetUser.username}</p>
            </div>
            <Link href={`/profile/${targetUser.username}`} className="text-xs text-white/30 hover:text-violet-400 transition-colors">
              Profil
            </Link>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p className="text-sm">Mulai percakapan dengan {targetUser?.full_name}</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === currentUser?.id;
              const showDate = i === 0 || getDateLabel(msg.created_at) !== getDateLabel(messages[i - 1].created_at);
              const showAvatar = !isMe && (i === messages.length - 1 || messages[i + 1].sender_id !== msg.sender_id);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-white/8" />
                      <span className="text-[10px] text-white/25 font-medium">{getDateLabel(msg.created_at)}</span>
                      <div className="flex-1 h-px bg-white/8" />
                    </div>
                  )}
                  <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} mb-0.5`}>
                    {/* Avatar placeholder for alignment */}
                    {!isMe && (
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 ${showAvatar ? "bg-violet-500/20 ring-1 ring-violet-500/30 flex items-center justify-center text-[10px] font-semibold text-violet-300" : "opacity-0"}`}>
                        {showAvatar && (targetUser?.avatar_url ? (
                          <img src={targetUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          initials(targetUser?.full_name ?? "")
                        ))}
                      </div>
                    )}

                    <div className={`max-w-[70%] group`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-violet-600 text-white rounded-br-sm"
                          : "bg-white/8 text-white/85 border border-white/10 rounded-bl-sm"
                      }`}>
                        {msg.content}
                      </div>
                      <p className={`text-[10px] text-white/20 mt-0.5 ${isMe ? "text-right" : "text-left"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {formatTime(msg.created_at)}
                        {isMe && (
                          <span className="ml-1">{msg.is_read ? "✓✓" : "✓"}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/8 flex-shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-violet-500/40 focus-within:bg-white/8 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Pesan ke ${targetUser?.full_name ?? ""}...`}
              rows={1}
              className="w-full bg-transparent text-sm text-white/80 placeholder-white/25 resize-none focus:outline-none leading-relaxed max-h-32"
              style={{ height: "auto" }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 128) + "px";
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-white/20 mt-1.5 text-center">Enter untuk kirim · Shift+Enter untuk baris baru</p>
      </div>
    </div>
  );
}
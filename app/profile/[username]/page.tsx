"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const supabase = createClient();

type Profile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  role: "member" | "alumni" | "admin";
  angkatan: string | null;
  jurusan: string | null;
  created_at: string;
};

type Post = {
  id: string;
  content: string;
  image_url: string | null;
  type: string;
  created_at: string;
  likes: { count: number }[];
  comments: { count: number }[];
};

type ConnectionStatus = "none" | "pending" | "accepted" | "sent";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hari ini";
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.floor(months / 12)} tahun lalu`;
}

const roleMap = {
  alumni: { label: "Alumni", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  member: { label: "Anggota", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  admin:  { label: "Admin",   cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

const avatarRing: Record<string, string> = {
  alumni: "ring-amber-500/40",
  member: "ring-violet-500/40",
  admin:  "ring-emerald-500/40",
};

export default function ProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const [profile, setProfile]           = useState<Profile | null>(null);
  const [posts, setPosts]               = useState<Post[]>([]);
  const [currentUser, setCurrentUser]   = useState<string | null>(null);
  const [connStatus, setConnStatus]     = useState<ConnectionStatus>("none");
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id ?? null);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (!prof) { setLoading(false); return; }
      setProfile(prof);

      const { data: postData } = await supabase
        .from("posts")
        .select("id, content, image_url, type, created_at, likes(count), comments(count)")
        .eq("author_id", prof.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (postData) setPosts(postData);

      if (user && user.id !== prof.id) {
        const { data: conn } = await supabase
          .from("connections")
          .select("status, requester_id")
          .or(`and(requester_id.eq.${user.id},receiver_id.eq.${prof.id}),and(requester_id.eq.${prof.id},receiver_id.eq.${user.id})`)
          .maybeSingle();

        if (conn) {
          if (conn.status === "accepted") setConnStatus("accepted");
          else if (conn.requester_id === user.id) setConnStatus("sent");
          else setConnStatus("pending");
        }
      }

      setLoading(false);
    }
    load();
  }, [username]);

  async function handleConnect() {
    if (!currentUser || !profile) return;
    await supabase.from("connections").insert({ requester_id: currentUser, receiver_id: profile.id });
    setConnStatus("sent");
  }

  async function acceptConnect() {
    if (!currentUser || !profile) return;
    await supabase.from("connections")
      .update({ status: "accepted" })
      .match({ requester_id: profile.id, receiver_id: currentUser });
    setConnStatus("accepted");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white/30">
        <p>Profil tidak ditemukan.</p>
      </div>
    );
  }

  const isOwn = currentUser === profile.id;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-64 bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href="/directory" className="text-xs text-white/30 hover:text-white/60 transition-colors mb-6 inline-flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Direktori
        </Link>

        {/* Profile Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold ring-2 flex-shrink-0 bg-violet-500/20 text-violet-300 ${avatarRing[profile.role]}`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials(profile.full_name)
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-lg font-bold text-white/95">{profile.full_name}</h1>
                  <p className="text-sm text-white/40">@{profile.username}</p>
                </div>
                {/* Actions */}
                {!isOwn && currentUser && (
                  <div className="flex items-center gap-2">
                    {connStatus === "none" && (
                      <button onClick={handleConnect} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-colors">
                        + Hubungkan
                      </button>
                    )}
                    {connStatus === "sent" && (
                      <span className="px-3 py-1.5 bg-white/5 text-white/40 text-xs rounded-xl border border-white/10">
                        Permintaan terkirim
                      </span>
                    )}
                    {connStatus === "pending" && (
                      <button onClick={acceptConnect} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors">
                        Terima koneksi
                      </button>
                    )}
                    {connStatus === "accepted" && (
                      <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-xl border border-emerald-500/20">
                        ✓ Terhubung
                      </span>
                    )}
                    <Link
                      href={`/messages/${profile.username}`}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium rounded-xl border border-white/10 transition-colors"
                    >
                      Pesan
                    </Link>
                  </div>
                )}
                {isOwn && (
                  <Link href="/settings/profile" className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 text-xs rounded-xl border border-white/10 transition-colors">
                    Edit Profil
                  </Link>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-white/60 leading-relaxed mt-3">{profile.bio}</p>
              )}

              {/* Meta tags */}
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${roleMap[profile.role].cls}`}>
                  {roleMap[profile.role].label}
                </span>
                {profile.angkatan && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-white/5 text-white/40 border border-white/10">
                    Angkatan {profile.angkatan}
                  </span>
                )}
                {profile.jurusan && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-white/5 text-white/40 border border-white/10">
                    {profile.jurusan}
                  </span>
                )}
                <span className="inline-flex items-center text-[11px] text-white/25 ml-auto">
                  Bergabung {timeAgo(profile.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-white/8">
            <div className="text-center">
              <p className="text-xl font-bold text-white/90">{posts.length}</p>
              <p className="text-xs text-white/35 mt-0.5">Postingan</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white/90">
                {posts.reduce((sum, p) => sum + (p.likes?.[0]?.count ?? 0), 0)}
              </p>
              <p className="text-xs text-white/35 mt-0.5">Total likes</p>
            </div>
          </div>
        </div>

        {/* Posts */}
        <h2 className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-wider">Postingan</h2>
        {posts.length === 0 ? (
          <div className="text-center py-12 text-white/20">
            <p className="text-sm">Belum ada postingan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] transition-colors">
                <p className="text-sm text-white/75 leading-relaxed mb-3">{post.content}</p>
                {post.image_url && (
                  <div className="rounded-xl overflow-hidden mb-3">
                    <img src={post.image_url} alt="" className="w-full max-h-60 object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-white/30">
                  <span>{post.likes?.[0]?.count ?? 0} suka</span>
                  <span>·</span>
                  <span>{post.comments?.[0]?.count ?? 0} komentar</span>
                  <span>·</span>
                  <span>{timeAgo(post.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
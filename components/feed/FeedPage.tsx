"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const supabase = createBrowserSupabaseClient();

type Profile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  role: "member" | "alumni" | "admin";
  angkatan: string;
};

type Post = {
  id: string;
  content: string;
  image_url: string | null;
  type: "post" | "announcement" | "story";
  view_count: number;
  created_at: string;
  author: Profile;
  _count: { likes: number; comments: number };
  is_liked: boolean;
  like_count?: number;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j`;
  return `${Math.floor(hrs / 24)}h`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function Avatar({ profile, size = 40 }: { profile: Profile; size?: number }) {
  const roleColor: Record<string, string> = {
    alumni: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
    member: "bg-violet-500/20 text-violet-400 ring-violet-500/30",
    admin: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
  };
  return (
    <div
      className={`relative flex items-center justify-center rounded-full font-semibold ring-1 ${roleColor[profile.role]}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials(profile.full_name)
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: Profile["role"] }) {
  const map = {
    alumni: { label: "Alumni", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    member: { label: "Anggota", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    admin: { label: "Admin", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  };
  const { label, cls } = map[role];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${cls}`}>
      {label}
    </span>
  );
}

function PostCard({ post, currentUserId }: { post: Post; currentUserId: string }) {
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count ?? post._count.likes);

  async function handleLike() {
    if (!currentUserId) return;

    if (liked) {
      await supabase.from("likes").delete().match({ post_id: post.id, user_id: currentUserId });
      setLikeCount((p) => Math.max(0, p - 1));
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: currentUserId });
      setLikeCount((p) => p + 1);
    }
    setLiked((p) => !p);
  }

  const isAnnouncement = post.type === "announcement";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={`relative overflow-hidden rounded-2xl border transition-colors duration-200 ${
        isAnnouncement ? "bg-amber-500/5 border-amber-500/20" : "bg-white/5 border-white/10 hover:bg-white/[0.08]"
      }`}
    >
      {isAnnouncement && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/60 via-amber-400/40 to-transparent" />
      )}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar profile={post.author} size={38} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white/90 truncate">{post.author.full_name}</span>
              <RoleBadge role={post.author.role} />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-white/40">
              <span>@{post.author.username}</span>
              <span className="text-white/20">·</span>
              <span>{post.author.angkatan}</span>
              <span className="text-white/20">·</span>
              <span>{timeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-white/80 leading-relaxed mb-3">{post.content}</p>
        {post.image_url && (
          <div className="mb-3 rounded-xl overflow-hidden">
            <img src={post.image_url} alt="" className="w-full max-h-80 object-cover" />
          </div>
        )}
        <div className="flex items-center gap-1 pt-1 border-t border-white/5">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-colors ${
              liked ? "text-rose-400 bg-rose-500/10" : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{likeCount > 0 ? likeCount : ""}</span>
          </motion.button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{post._count.comments > 0 ? post._count.comments : ""}</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors ml-auto">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default function FeedPage({ currentUserId }: { currentUserId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const paperDate = new Date().getFullYear().toString();
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const username = profile?.username ?? "Himlab Member";
  const postButtonDisabled = !draft.trim() || saving;

  const loadProfile = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, role, angkatan")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load profile", profileError);
    }

    if (profileData) {
      const safeProfile: Profile = {
        id: profileData.id,
        full_name: profileData.full_name,
        username: profileData.username,
        avatar_url: profileData.avatar_url ?? null,
        role: (profileData as any).role ?? "member",
        angkatan: (profileData as any).angkatan ?? paperDate,
      };
      setProfile(safeProfile);
      return;
    }

    const fallbackName = user.email?.split("@")[0] ?? user.id.slice(0, 6);
    setProfile({
      id: user.id,
      full_name: fallbackName,
      username: fallbackName,
      avatar_url: null,
      role: "member",
      angkatan: new Date().getFullYear().toString(),
    });
  };

  const createPostObject = (record: any): Post => {
    const author: Profile = record.author ?? {
      id: record.author_id ?? "",
      full_name: record.author_full_name ?? profile?.full_name ?? "Himlab User",
      username: record.author_username ?? profile?.username ?? "himlab",
      avatar_url: record.author_avatar_url ?? null,
      role: record.author_role ?? "member",
      angkatan: record.author_angkatan ?? "2025",
    };

    return {
      id: record.id,
      content: record.content,
      image_url: record.image_url ?? null,
      type: record.type ?? "post",
      view_count: record.view_count ?? 0,
      created_at: record.created_at,
      author,
      _count: {
        likes: record._count?.likes ?? record.like_count ?? 0,
        comments: record._count?.comments ?? record.comment_count ?? 0,
      },
      is_liked: false,
      like_count: record.like_count ?? record._count?.likes ?? 0,
    };
  };

  const fetchFeed = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("posts")
      .select("*, author:profiles!author_id(id, full_name, username, avatar_url, role, angkatan), likes(count), comments(count)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      const fallback = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20);
      if (fallback.error) {
        setErrorMessage("Tidak bisa memuat feed. Pastikan tabel Supabase sudah dibuat.");
        setLoading(false);
        return;
      }
      setPosts(fallback.data.map(createPostObject));
      setLoading(false);
      return;
    }

    setPosts(data.map(createPostObject));
    setLoading(false);
  };

  const handleCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;

    setSaving(true);
    setErrorMessage("");

    const payload = {
      author_id: currentUserId,
      content: draft.trim(),
      image_url: imageUrl?.trim() || null,
      type: "post",
    };

    const { error } = await supabase.from("posts").insert(payload);
    if (error) {
      setErrorMessage("Gagal membuat postingan. Pastikan tabel posts ada di Supabase.");
      setSaving(false);
      return;
    }

    setDraft("");
    setImageUrl("");
    await fetchFeed();
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    loadProfile();
    fetchFeed();
  }, []);

  const ic = useMemo(() => initials(profile?.full_name ?? "Himlab"), [profile]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-amber-500/6 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-white/95 tracking-tight">Himlab</h1>
            <p className="text-xs text-white/40 mt-0.5">Himlab Raya · Komunitas Kampus</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10"
          >
            Keluar
          </button>
        </header>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mb-4 shadow-xl shadow-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-violet-500/20 ring-1 ring-violet-500/30 flex items-center justify-center text-sm font-semibold text-violet-300">
              {ic}
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90">{profile?.full_name ?? "Himlab Member"}</p>
              <p className="text-xs text-white/40">@{username}</p>
            </div>
          </div>
          <form className="space-y-3" onSubmit={handleCreatePost}>
            <textarea
              rows={4}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Bagikan cerita, pengumuman, atau kabar terbaru..."
              className="w-full rounded-3xl border border-white/10 bg-slate-950/95 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
            />
            <input
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="Link gambar (opsional)"
              className="w-full rounded-3xl border border-white/10 bg-slate-950/95 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
            />
            {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-white/40">Maksimal 300 karakter</span>
              <button
                type="submit"
                disabled={postButtonDisabled}
                className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Posting"}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 border border-white/8 rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                    <div className="h-2.5 bg-white/8 rounded w-1/4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-white/8 rounded w-full" />
                  <div className="h-3 bg-white/8 rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div className="space-y-3" animate="animate">
            <AnimatePresence>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={currentUserId} />
              ))}
            </AnimatePresence>
            {posts.length === 0 && (
              <div className="text-center py-16 text-white/30">
                <p className="text-sm">Belum ada postingan.</p>
                <p className="text-xs mt-1">Jadilah yang pertama berbagi.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

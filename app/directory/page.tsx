"use client";

import { useState, useEffect } from "react";
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
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const roleMap = {
  alumni: { label: "Alumni", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  member: { label: "Anggota", bg: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  admin:  { label: "Admin",   bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

const avatarColor: Record<string, string> = {
  alumni: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  member: "bg-violet-500/20 text-violet-300 ring-violet-500/30",
  admin:  "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
};

export default function DirectoryPage() {
  const [profiles, setProfiles]         = useState<Profile[]>([]);
  const [filtered, setFiltered]         = useState<Profile[]>([]);
  const [search, setSearch]             = useState("");
  const [roleFilter, setRoleFilter]     = useState<string>("all");
  const [angkatanFilter, setAngkatan]   = useState<string>("all");
  const [angkatanList, setAngkatanList] = useState<string[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, bio, role, angkatan, jurusan")
        .order("full_name");
      if (data) {
        setProfiles(data);
        setFiltered(data);
        const years = [...new Set(data.map((p) => p.angkatan).filter(Boolean))] as string[];
        setAngkatanList(years.sort().reverse());
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let result = profiles;
    if (roleFilter !== "all") result = result.filter((p) => p.role === roleFilter);
    if (angkatanFilter !== "all") result = result.filter((p) => p.angkatan === angkatanFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q) ||
          p.jurusan?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, roleFilter, angkatanFilter, profiles]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/feed" className="text-xs text-white/30 hover:text-white/60 transition-colors mb-4 inline-flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Kembali ke Feed
          </Link>
          <h1 className="text-2xl font-bold text-white/95 tracking-tight">Direktori</h1>
          <p className="text-sm text-white/40 mt-1">
            {profiles.length} anggota terdaftar
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Cari nama, username, jurusan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/80 placeholder-white/25 focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all"
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/70 focus:outline-none focus:border-violet-500/50 transition-all appearance-none pr-8"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff50' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
          >
            <option value="all" className="bg-[#1a1a2e]">Semua Role</option>
            <option value="alumni" className="bg-[#1a1a2e]">Alumni</option>
            <option value="member" className="bg-[#1a1a2e]">Anggota</option>
            <option value="admin" className="bg-[#1a1a2e]">Admin</option>
          </select>

          {/* Angkatan filter */}
          <select
            value={angkatanFilter}
            onChange={(e) => setAngkatan(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/70 focus:outline-none focus:border-violet-500/50 transition-all appearance-none pr-8"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff50' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
          >
            <option value="all" className="bg-[#1a1a2e]">Semua Angkatan</option>
            {angkatanList.map((y) => (
              <option key={y} value={y} className="bg-[#1a1a2e]">{y}</option>
            ))}
          </select>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-5 text-xs text-white/30">
          <span>{filtered.length} ditampilkan</span>
          <span>·</span>
          <span>{profiles.filter(p => p.role === "alumni").length} alumni</span>
          <span>·</span>
          <span>{profiles.filter(p => p.role === "member").length} anggota aktif</span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/8 rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/10 rounded w-3/4" />
                    <div className="h-2.5 bg-white/8 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-2.5 bg-white/8 rounded w-full mb-1.5" />
                <div className="h-2.5 bg-white/8 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/25">
            <p className="text-sm">Tidak ada anggota yang cocok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((profile) => (
              <Link
                key={profile.id}
                href={`/profile/${profile.username}`}
                className="group bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all duration-200 block"
              >
                <div className="flex items-start gap-3 mb-3">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold ring-1 flex-shrink-0 ${avatarColor[profile.role]}`}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      initials(profile.full_name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 truncate group-hover:text-white transition-colors">
                      {profile.full_name}
                    </p>
                    <p className="text-xs text-white/40 truncate">@{profile.username}</p>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-xs text-white/50 leading-relaxed mb-3 line-clamp-2">
                    {profile.bio}
                  </p>
                )}

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${roleMap[profile.role].bg}`}>
                    {roleMap[profile.role].label}
                  </span>
                  {profile.angkatan && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-white/40 border border-white/10">
                      {profile.angkatan}
                    </span>
                  )}
                  {profile.jurusan && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-white/30 border border-white/8 truncate max-w-[120px]">
                      {profile.jurusan}
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
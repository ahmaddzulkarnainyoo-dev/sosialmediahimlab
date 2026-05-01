"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const supabase = createBrowserSupabaseClient();

async function ensureProfile(user: User) {
  const baseName = user.email?.split("@")[0] ?? `himlab${user.id.slice(0, 6)}`;
  const username = `${baseName}-${user.id.slice(0, 4)}`;

  const { error: upsertError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: baseName,
      username,
      avatar_url: null,
      role: "member",
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (upsertError) {
    console.error("Supabase profile upsert failed", upsertError);
    return upsertError.message || "Gagal menyimpan profile";
  }

  return null;
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const whatsappNumber = "6281234567890"; // ganti dengan nomor admin kamu
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Halo admin Himlab, saya ingin request akses akun Himlab."
  )}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (mode === "sign-up") {
      setMessage(`Pendaftaran ditutup. Silakan hubungi admin via WhatsApp: +${whatsappNumber}`);
      return;
    }

    if (!email || !password) {
      setMessage("Email dan password harus diisi.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.session) {
      if (data.user) {
        const profileError = await ensureProfile(data.user);
        if (profileError) {
          setMessage(`Database error saving profile: ${profileError}`);
          return;
        }
      }
      router.push("/feed");
      return;
    }

    setMessage("Gagal masuk. Coba lagi atau cek email verifikasi.");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300/80">Himlab Raya</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Sosial media komunitas Himlab</h1>
          <p className="mt-3 text-sm text-slate-300/80">
            Masuk untuk lihat feed, berinteraksi, dan berbagi cerita bersama teman.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "sign-in" ? (
            <>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                  placeholder="email@contoh.com"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              {message && <p className="text-sm text-rose-300">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sedang memproses..." : "Masuk ke Himlab"}
              </button>
            </>
          ) : (
            <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/90 p-6 text-center">
              <p className="text-sm text-slate-300">
                Pendaftaran ditutup untuk publik. Jika kamu ingin akses akun Himlab, hubungi admin melalui WhatsApp.
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full justify-center rounded-2xl bg-green-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-400"
              >
                Hubungi admin via WhatsApp
              </a>
              <p className="text-xs text-slate-400">
                Nanti admin yang akan membuat akun kamu secara manual setelah disetujui.
              </p>
            </div>
          )}
        </form>

        <div className="mt-5 text-center text-sm text-slate-400">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setMessage("");
            }}
            className="font-medium text-violet-300 hover:text-violet-200"
          >
            {mode === "sign-in" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
          </button>
        </div>
      </div>
    </div>
  );
}

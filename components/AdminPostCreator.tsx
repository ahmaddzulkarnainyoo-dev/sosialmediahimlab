"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type AdminPostCreatorProps = {
  currentUserId: string;
  currentUserRole: string;
  onPostCreated?: () => void;
};

export default function AdminPostCreator({ currentUserId, currentUserRole, onPostCreated }: AdminPostCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  if (currentUserRole !== "admin") return null;

  async function handleSubmit() {
    if (!content.trim() || saving) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("posts").insert({
        author_id: currentUserId,
        content: content.trim(),
        image_url: imageUrl?.trim() || null,
        type: isAnnouncement ? "announcement" : "post",
        is_announcement: isAnnouncement,
        pinned: isAnnouncement && pinned,
      });

      if (!error) {
        setContent("");
        setImageUrl("");
        setIsAnnouncement(false);
        setPinned(false);
        setIsOpen(false);
        onPostCreated?.();
      }
    } catch (err) {
      console.error("Error posting:", err);
    }
    setSaving(false);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mb-4 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm transition-colors"
      >
        📢 Buat Pengumuman (Admin)
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Buat Pengumuman</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/60 hover:text-white/80 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {/* Content */}
          <div>
            <label className="text-sm text-white/70 block mb-1">Konten Pengumuman</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan pengumuman penting..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-400/50"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="text-sm text-white/70 block mb-1">Gambar (optional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-400/50"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnouncement}
                onChange={(e) => setIsAnnouncement(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500"
              />
              <span className="text-sm text-white/80">📢 Tandai sebagai Pengumuman</span>
            </label>
            {isAnnouncement && (
              <label className="flex items-center gap-2 cursor-pointer ml-6">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
                <span className="text-sm text-white/80">📌 Sematkan ke Atas</span>
              </label>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || saving}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {saving ? "Posting..." : "Posting"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

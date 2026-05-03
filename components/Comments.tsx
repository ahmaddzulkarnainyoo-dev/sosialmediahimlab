"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Comment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: { id: string; full_name: string; username: string; avatar_url: string | null; role: string };
  replies?: Comment[];
  like_count?: number;
  is_liked?: boolean;
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
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

type CommentItemProps = {
  comment: Comment;
  currentUserId: string;
  postId: string;
  onReply?: (parentId: string, content: string) => void;
  level?: number;
};

function CommentItem({ comment, currentUserId, postId, onReply, level = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [liked, setLiked] = useState(comment.is_liked || false);
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);
  const [submitting, setSubmitting] = useState(false);

  async function handleLikeComment() {
    if (liked) {
      await supabase.from("comment_likes").delete().match({ comment_id: comment.id, user_id: currentUserId });
      setLikeCount((p) => Math.max(0, p - 1));
    } else {
      await supabase.from("comment_likes").insert({ comment_id: comment.id, user_id: currentUserId });
      setLikeCount((p) => p + 1);
    }
    setLiked((p) => !p);
  }

  async function handleSubmitReply() {
    if (!replyContent.trim() || submitting) return;
    setSubmitting(true);

    await supabase.from("comments").insert({
      post_id: postId,
      user_id: currentUserId,
      parent_comment_id: comment.id,
      content: replyContent.trim(),
    });

    setReplyContent("");
    setShowReplyForm(false);
    setSubmitting(false);
    onReply?.(comment.id, replyContent);
  }

  const marginLeft = level > 0 ? "ml-6" : "";
  const user = comment.user;

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={`${marginLeft} border-l border-white/10 pl-3 py-2`}>
      <div className="flex items-start gap-2">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-violet-500/20 ring-1 ring-violet-500/30 flex items-center justify-center text-xs font-semibold text-violet-300 flex-shrink-0">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
          ) : (
            initials(user?.full_name ?? "User")
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-white/80">{user?.full_name ?? "Unknown"}</span>
            <span className="text-xs text-white/30">@{user?.username ?? "user"}</span>
            <span className="text-xs text-white/20">·</span>
            <span className="text-xs text-white/40">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-xs text-white/70 mt-1 leading-relaxed">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-1.5">
            <button
              onClick={handleLikeComment}
              className={`text-xs px-2 py-1 rounded-md transition-colors ${
                liked ? "text-rose-400 bg-rose-500/10" : "text-white/40 hover:text-white/60 hover:bg-white/5"
              }`}
            >
              ❤️ {likeCount > 0 ? likeCount : ""}
            </button>
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs px-2 py-1 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-md transition-colors"
            >
              💬 Balas
            </button>
          </div>

          {/* Reply form */}
          {showReplyForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Balas komentar..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-400/50"
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || submitting}
                  className="text-xs px-3 py-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-md transition-colors"
                >
                  {submitting ? "Sending..." : "Send"}
                </button>
                <button
                  onClick={() => setShowReplyForm(false)}
                  className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-white/70 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  postId={postId}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

type CommentsProps = {
  postId: string;
  currentUserId: string;
};

export default function Comments({ postId, currentUserId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        id, user_id, content, created_at, parent_comment_id,
        user:profiles!user_id(id, full_name, username, avatar_url, role),
        like_count:comment_likes(count)
      `
      )
      .eq("post_id", postId)
      .is("parent_comment_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load comments error:", error);
      setLoading(false);
      return;
    }

    if (data) {
      // Fetch nested replies for each comment
      const commentsWithReplies = await Promise.all(
        data.map(async (comment) => {
          const { data: replies } = await supabase
            .from("comments")
            .select(
              `
              id, user_id, content, created_at,
              user:profiles!user_id(id, full_name, username, avatar_url, role),
              like_count:comment_likes(count)
            `
            )
            .eq("parent_comment_id", comment.id)
            .order("created_at", { ascending: true });

          return {
            ...comment,
            replies: replies || [],
            like_count: comment.like_count?.[0]?.count || 0,
          };
        })
      );

      setComments(commentsWithReplies);
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSubmitComment() {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: currentUserId,
      content: newComment.trim(),
      parent_comment_id: null,
    });

    if (!error) {
      setNewComment("");
      await loadComments();
    }
    setSubmitting(false);
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Comment form */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Tambahkan komentar..."
          rows={2}
          className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none resize-none"
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
            className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {submitting ? "Posting..." : "Komentar"}
          </button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white/5 rounded-lg p-2 animate-pulse h-16" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-white/30 text-center py-4">Belum ada komentar. Jadilah yang pertama!</p>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                postId={postId}
                onReply={() => loadComments()}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

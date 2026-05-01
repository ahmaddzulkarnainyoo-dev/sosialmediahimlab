import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import FeedPage from "@/components/feed/FeedPage";

export default async function Feed() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user) redirect("/");

  return <FeedPage currentUserId={user.id} />;
}
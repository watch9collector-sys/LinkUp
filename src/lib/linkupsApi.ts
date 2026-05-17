import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";
import { clarifyPostgrestMessage } from "@/src/lib/postgrestErrors";
import { LINKUP_ATTENDEES_TABLE, LINKUPS_TABLE } from "@/src/lib/linkupsTables";
import type { LinkUpRow, LinkUpView } from "@/src/lib/linkupsTypes";

function activeAttendees(rows: LinkUpRow["linkup_attendees"]): NonNullable<
  LinkUpRow["linkup_attendees"]
> {
  return rows ?? [];
}

export function toLinkUpView(row: LinkUpRow, currentUserId: string | undefined): LinkUpView {
  const active = activeAttendees(row.linkup_attendees);
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    location: row.location,
    starts_at: row.starts_at,
    description: row.description,
    host_id: row.host_id,
    host_display_name: row.host_display_name,
    created_at: row.created_at,
    attendee_count: active.length,
    active_attendees: active,
    you_joined: Boolean(
      currentUserId && active.some((a) => a.user_id === currentUserId),
    ),
    you_host: Boolean(currentUserId && row.host_id === currentUserId),
  };
}

const linkupSelect = `
  id,
  title,
  category,
  location,
  starts_at,
  description,
  host_id,
  host_display_name,
  created_at,
  updated_at,
  linkup_attendees ( id, user_id, display_name, joined_at )
`;

function wrapPostgrest(msg: string | undefined | null): string {
  return clarifyPostgrestMessage(msg ?? "Unknown error");
}

export async function fetchLinkUps(): Promise<{ data: LinkUpRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from(LINKUPS_TABLE)
    .select(linkupSelect)
    .order("starts_at", { ascending: true })
    .limit(50);

  if (error) {
    return { data: [], error: new Error(wrapPostgrest(error.message)) };
  }
  return { data: (data ?? []) as LinkUpRow[], error: null };
}

export async function createLinkUp(input: {
  title: string;
  category: string;
  location: string;
  starts_at: string;
  description: string;
  host_id: string;
  host_display_name: string;
}): Promise<{ id: string | null; error: Error | null }> {
  const { data, error } = await supabase
    .from(LINKUPS_TABLE)
    .insert({
      title: input.title,
      category: input.category,
      location: input.location,
      starts_at: input.starts_at,
      description: input.description,
      host_id: input.host_id,
      host_display_name: input.host_display_name,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { id: null, error: new Error(wrapPostgrest(error?.message ?? "Insert failed")) };
  }

  const { error: joinErr } = await supabase.from(LINKUP_ATTENDEES_TABLE).insert({
    linkup_id: data.id,
    user_id: input.host_id,
    display_name: input.host_display_name,
  });

  if (joinErr) {
    return { id: null, error: new Error(wrapPostgrest(joinErr.message)) };
  }

  return { id: data.id, error: null };
}

export async function joinLinkUp(
  linkup_id: string,
  user_id: string,
  display_name: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from(LINKUP_ATTENDEES_TABLE).insert({
    linkup_id,
    user_id,
    display_name,
  });
  const code = (error as PostgrestError | null)?.code;
  if (code === "23505") {
    return { error: null };
  }
  return { error: error ? new Error(wrapPostgrest(error.message)) : null };
}

export async function leaveLinkUp(
  linkup_id: string,
  user_id: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from(LINKUP_ATTENDEES_TABLE)
    .delete()
    .eq("linkup_id", linkup_id)
    .eq("user_id", user_id);
  return { error: error ? new Error(wrapPostgrest(error.message)) : null };
}

export function formatLinkUpTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

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
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    starts_at: row.starts_at,
    description: row.description,
    host_id: row.host_id ?? "",
    host_display_name: row.host_display_name,
    created_at: row.created_at,
    attendee_count: row.attendee_count ?? active.length,
    location_is_approximate: row.location_is_approximate ?? false,
    active_attendees: active,
    you_joined: row.you_joined ?? Boolean(
      currentUserId && active.some((a) => a.user_id === currentUserId),
    ),
    you_host: row.you_host ?? Boolean(currentUserId && row.host_id === currentUserId),
  };
}



function wrapPostgrest(msg: string | undefined | null): string {
  return clarifyPostgrestMessage(msg ?? "Unknown error");
}

export type LinkUpsCursor = {
  offset: number;
  asOf: string;
};

const LINKUPS_PAGE_SIZE = 50;

export async function fetchLinkUps(
  cursor: LinkUpsCursor | null = null,
  pageSize = LINKUPS_PAGE_SIZE,
): Promise<{
  data: LinkUpRow[];
  error: Error | null;
  nextCursor: LinkUpsCursor | null;
}> {
  const safePageSize = Math.max(1, Math.min(pageSize, 100));
  const asOf = cursor?.asOf ?? new Date().toISOString();
  const offset = Math.max(0, cursor?.offset ?? 0);
  // Requires the reviewed fetch_safe_linkups migration in staging first.
  // The SECURITY DEFINER RPC returns redacted fields for nonparticipants;
  // NEVER fall back to directly selecting unredacted tables for guests.
  const { data, error } = await supabase.rpc("fetch_safe_linkups", {
    p_as_of: asOf,
    p_limit: safePageSize + 1,
    p_offset: offset,
  });

  if (error) {
    return {
      data: [],
      error: new Error(wrapPostgrest(error.message)),
      nextCursor: null,
    };
  }

  const rows = (data ?? []) as LinkUpRow[];
  const page = rows.slice(0, safePageSize);
  const hasMoreInPhase = rows.length > safePageSize;

  const nextCursor: LinkUpsCursor | null = hasMoreInPhase
    ? { offset: offset + safePageSize, asOf }
    : null;

  return { data: page, error: null, nextCursor };
}

/** Host-only history. Direct table reads are authorized by the host RLS policy.
 * Past LinkUps never re-enter public Explore or upcoming discovery.
 */
export async function fetchHostedLinkUpHistory(userId: string): Promise<{
  data: LinkUpView[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from(LINKUPS_TABLE)
    .select(`
      id, title, category, location, latitude, longitude, starts_at,
      description, host_id, host_display_name, created_at, updated_at,
      linkup_attendees (id, user_id, display_name, joined_at)
    `)
    .eq("host_id", userId)
    .lt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(50);

  if (error) {
    return { data: [], error: new Error(wrapPostgrest(error.message)) };
  }
  return {
    data: ((data ?? []) as LinkUpRow[]).map((row) => toLinkUpView(row, userId)),
    error: null,
  };
}

export async function createLinkUp(input: {
  title: string;
  category: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
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
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
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
    const { error: rollbackErr } = await supabase
      .from(LINKUPS_TABLE)
      .delete()
      .eq("id", data.id);
    if (rollbackErr && process.env.NODE_ENV !== "production") {
      console.warn("[LinkUp] createLinkUp rollback failed:", rollbackErr.message);
    }
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

/** Host-only delete; enforced by RLS (`linkups_delete_host`). */
export async function deleteLinkUpAsHost(
  linkup_id: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from(LINKUPS_TABLE).delete().eq("id", linkup_id);
  return { error: error ? new Error(wrapPostgrest(error.message)) : null };
}

/** Host-only update; enforced by RLS (`linkups_update_host`). */
export async function updateLinkUpAsHost(
  linkup_id: string,
  input: {
    title: string;
    category: string;
    location: string;
    latitude?: number | null;
    longitude?: number | null;
    starts_at: string;
    description: string;
  },
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from(LINKUPS_TABLE)
    .update({
      title: input.title,
      category: input.category,
      location: input.location,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      starts_at: input.starts_at,
      description: input.description,
    })
    .eq("id", linkup_id);

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

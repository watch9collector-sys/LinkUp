/**
 * Turn vague PostgREST “schema cache” errors into actionable text for developers.
 */
export function clarifyPostgrestMessage(message: string): string {
  const raw = message.trim();
  if (raw.includes("The API does not see your tables yet.")) {
    return raw;
  }
  const m = raw.toLowerCase();
  if (
    m.includes("schema cache") ||
    m.includes("could not find the table") ||
    m.includes("does not exist")
  ) {
    return [
      raw,
      "",
      "The API does not see your tables yet. Try, in order:",
      "1) In Supabase → SQL: run supabase/migrations/20260212160000_linkups_schema.sql on this same project.",
      "2) In SQL editor run: select pg_notify('pgrst', 'reload schema');",
      "3) Locally run: npm run verify:supabase",
    ].join("\n");
  }
  return raw;
}

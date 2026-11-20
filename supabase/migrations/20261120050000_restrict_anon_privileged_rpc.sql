-- Audited isolated production hardening; applied 2026-11-19 via Supabase MCP.
-- These REVOKE statements are idempotent. Keep authenticated and service_role permissions.
REVOKE EXECUTE ON FUNCTION public.founder_remove_linkup(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.founder_set_report_status(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_platform_founder() FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_interaction_block_ids() FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_user_report(text,text,uuid,uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.users_blocked_either_way(uuid,uuid) FROM anon;

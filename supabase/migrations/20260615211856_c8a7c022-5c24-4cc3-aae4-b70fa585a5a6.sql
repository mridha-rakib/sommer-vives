
-- Revoke public EXECUTE on internal/trigger functions
REVOKE EXECUTE ON FUNCTION public.auto_generate_sag_tasks() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_booking_case_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_guest_case_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_invoice_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_chat_message_thread_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_sag_tasks(uuid, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_stage_tasks(uuid, text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_case_number(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_chat_thread_id(text, text, uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;

-- Keep service_role able to invoke (for edge functions/admin)
GRANT EXECUTE ON FUNCTION public.generate_sag_tasks(uuid, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_stage_tasks(uuid, text, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_case_number(text) TO service_role;

-- Tighten has_role: only signed-in users need it (RLS policy use)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, user_role) FROM PUBLIC, anon;

-- count_unread_admin_threads: signed-in users only
REVOKE EXECUTE ON FUNCTION public.count_unread_admin_threads() FROM PUBLIC, anon;

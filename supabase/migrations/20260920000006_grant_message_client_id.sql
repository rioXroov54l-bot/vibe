-- Allow authenticated clients to send and read the message idempotency key.
grant select (client_message_id) on public.messages to authenticated;
grant insert (client_message_id) on public.messages to authenticated;

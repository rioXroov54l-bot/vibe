-- Idempotency key for client message sends.
alter table public.messages
  add column if not exists client_message_id text;

create unique index if not exists messages_client_message_id_key
  on public.messages (client_message_id)
  where client_message_id is not null;

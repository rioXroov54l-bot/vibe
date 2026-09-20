-- The reaction endpoint uses resolution=merge-duplicates, which requires UPDATE.
grant update (message_id, user_id, emoji) on public.message_reactions to authenticated;

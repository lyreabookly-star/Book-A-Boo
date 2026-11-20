-- Add covering indexes for foreign keys flagged by Supabase performance advisors.
-- These indexes do not alter data or access policies.
create index if not exists admin_action_logs_admin_id_fk_idx
  on public.admin_action_logs (admin_id);

create index if not exists notifications_actor_id_fk_idx
  on public.notifications (actor_id);
create index if not exists notifications_story_id_fk_idx
  on public.notifications (story_id);

create index if not exists platform_content_reports_reporter_id_fk_idx
  on public.platform_content_reports (reporter_id);
create index if not exists platform_content_reports_reviewed_by_fk_idx
  on public.platform_content_reports (reviewed_by);

create index if not exists story_comment_reports_reporter_id_fk_idx
  on public.story_comment_reports (reporter_id);
create index if not exists story_comment_reports_reviewed_by_fk_idx
  on public.story_comment_reports (reviewed_by);

create index if not exists story_comments_author_id_fk_idx
  on public.story_comments (author_id);
create index if not exists story_comments_parent_same_story_fk_idx
  on public.story_comments (parent_id, story_id);

create index if not exists story_ratings_user_id_fk_idx
  on public.story_ratings (user_id);
create index if not exists story_reactions_user_id_fk_idx
  on public.story_reactions (user_id);
create index if not exists story_reads_user_id_fk_idx
  on public.story_reads (user_id);
create index if not exists story_votes_user_id_fk_idx
  on public.story_votes (user_id);

create index if not exists user_moderation_actions_admin_id_fk_idx
  on public.user_moderation_actions (admin_id);
create index if not exists user_moderation_actions_user_id_fk_idx
  on public.user_moderation_actions (user_id);

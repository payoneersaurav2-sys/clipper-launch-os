# Database and RLS

Migrations define: `users`, `workspaces`, `workspace_members`, `folders`, `projects`, `clip_ideas`, `hooks`, `captions`, `campaigns`, `analytics`, `ai_memory`, `prompt_history`, `settings`, `notifications`, `clips`, and `knowledge_items`.

Most tenant tables are controlled through `user_belongs_to_workspace(workspace_id)`, which checks both active `users.membership_status` and workspace membership/ownership. The later migration replaces recursive workspace-member policies and adds self-profile insert support. Use only new migrations for schema/policy changes; examine the remote project separately to establish which migrations are actually applied.

Key relationships: workspaces own projects, ideas, campaigns, clips, knowledge and memory; hooks/captions belong to an idea; analytics belongs to a campaign (optionally an idea); clips can be linked to a campaign and idea. The analytics client hook currently queries all analytics rows rather than explicitly filtering by the active workspace; RLS is expected to provide the boundary but explicit query scoping should be evaluated before relying on it.

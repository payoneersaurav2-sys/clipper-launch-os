# Campaign OS

## Purpose

Campaign OS connects a creator's campaign strategy to the existing clip-production workflow. A campaign owns planning fields and is associated with content through `clips.campaign_id`.

## Implemented

- Create, open, edit, duplicate, archive, and soft-delete campaigns.
- Persist campaign name, brand/client, niche, platform, goal, start date, end date, and the established campaign status vocabulary.
- Campaign detail view with real linked clips, content progress, scheduled/published counts, and totals from manually stored clip views and likes.
- Edit a linked clip's pipeline status and publishing date from its campaign detail view; changes persist to `clips`.
- Hand off from campaign detail to Clip Pipeline with that campaign preselected.
- Existing Clip Pipeline supports persisted status moves by drag-and-drop on desktop and explicit stage controls on mobile.

## Data model and security

- `campaigns` belongs to a `workspace` through `workspace_id`.
- `clips` belongs to a workspace and may belong to a campaign through `campaign_id`.
- `analytics` belongs to a campaign, but no platform-ingestion integration is configured.
- RLS policies use `user_belongs_to_workspace(workspace_id)`. Live-policy verification remains required before claiming cross-user isolation is deployed.

## AI

Launch Center can generate a campaign plan through the shared AI hook, but it is not yet saved as a campaign/calendar. Campaign OS itself does not present a separate AI generator to avoid duplicating that architecture.

## Analytics

Campaign detail shows only real fields currently stored on clips: views, likes, publication state, publishing date, and derived completion. It does not claim to fetch TikTok, YouTube, or Instagram data.

## Known limitations

- No persisted calendar/task table exists in the current schema.
- Launch Center plans do not yet create campaigns or clips.
- Clip details (hook, caption, tags, notes, manual metrics) are not yet editable from Campaign OS.
- External publishing and analytics ingestion are not implemented.
- End-to-end behavior requires the checked-in migrations to be applied to the live Supabase project.

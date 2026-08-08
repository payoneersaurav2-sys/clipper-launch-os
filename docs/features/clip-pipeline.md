# Clip Pipeline

The historical vision is source content → clip selection → review/edit/preparation → ready → published → performance. Batch 4 translated the implemented data model into `clips` with title, hook, caption, platform, metrics, revenue, publishing date, tags, notes, campaign, and idea reference.

The current UI at `/dashboard/clip-pipeline` is a Supabase-backed board with manual clip creation, optional campaign filtering, and manual status moves. Its exact stages are `idea`, `writing`, `editing`, `ready`, `scheduled`, `published`, and `analyzed`. Desktop renders columns; mobile renders non-empty stages as a vertical list.

It is not source-media ingestion, automatic clip discovery, review tooling, video editing, publishing, or performance analysis. It also does not implement drag-and-drop despite the historical Batch 4 specification. Preserve the stage vocabulary and responsive behavior if the workflow is extended.

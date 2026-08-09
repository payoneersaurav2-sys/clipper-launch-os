CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  resource_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'text',
  source_name TEXT,
  source_url TEXT,
  page_number INTEGER,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_workspace ON public.knowledge_chunks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_resource ON public.knowledge_chunks(resource_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_page ON public.knowledge_chunks(page_number);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source_type ON public.knowledge_chunks(source_type);

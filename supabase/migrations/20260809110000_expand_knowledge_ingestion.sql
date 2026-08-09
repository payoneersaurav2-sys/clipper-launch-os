ALTER TABLE public.knowledge_items
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS ingestion_status TEXT DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS ingestion_error TEXT,
  ADD COLUMN IF NOT EXISTS content_excerpt TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_knowledge_ingestion_status ON public.knowledge_items(ingestion_status);
CREATE INDEX IF NOT EXISTS idx_knowledge_source_type ON public.knowledge_items(source_type);

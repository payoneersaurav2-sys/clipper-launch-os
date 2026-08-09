import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

function isSafeUrlCandidate(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'Invalid URL.' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return { ok: false, reason: 'Only http and https URLs are allowed.' };
  const hostname = parsed.hostname.toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.local') || hostname === '0.0.0.0' || hostname === '[::1]' || hostname === '::1') {
    return { ok: false, reason: 'Local addresses are not allowed.' };
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    const parts = hostname.split('.').map((part) => Number(part));
    if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
      return { ok: false, reason: 'Invalid IP address.' };
    }
    if (parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168) || parts[0] === 127 || parts[0] === 0) {
      return { ok: false, reason: 'Private or local IP addresses are not allowed.' };
    }
  }
  return { ok: true, parsed };
}

function stripHtml(html: string) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitleAndText(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ?? 'Website Source';
  const text = stripHtml(html);
  return { title, text };
}

function chunkText(input: string, pageNumber?: number, sourceName?: string) {
  const normalized = input.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const chunks: Array<{ content: string; pageNumber?: number; chunkIndex: number; metadata: Record<string, unknown> }> = [];
  const maxChars = 1400;
  const words = normalized.split(' ');
  let current = '';
  let chunkIndex = 0;

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      chunks.push({ content: current.trim(), pageNumber, chunkIndex, metadata: { pageNumber, sourceName, chunkIndex } });
      chunkIndex += 1;
      current = word;
    } else {
      current = next;
    }
  }

  if (current.trim()) {
    chunks.push({ content: current.trim(), pageNumber, chunkIndex, metadata: { pageNumber, sourceName, chunkIndex } });
  }

  return chunks;
}

async function fetchWebsiteContent(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'CreatorOS-Knowledge-Ingest/1.0',
      Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
    },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`The website returned HTTP ${response.status}.`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('text/html') && !contentType.toLowerCase().includes('text/plain')) {
    throw new Error('The URL did not return readable HTML content.');
  }
  const html = await response.text();
  return extractTitleAndText(html);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Sign in again to ingest knowledge.' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) return json({ error: 'Knowledge ingestion is not configured.' }, 503);

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, authorization: authHeader },
    });
    if (!userResponse.ok) return json({ error: 'Sign in again to ingest knowledge.' }, 401);
    const user = await userResponse.json();
    const userId = user.user?.id as string | undefined;
    if (!userId) return json({ error: 'Sign in again to ingest knowledge.' }, 401);

    const payload = await req.json();
    const workspaceId = String(payload.workspace_id ?? '').trim();
    const title = String(payload.title ?? '').trim();
    const url = String(payload.url ?? '').trim();
    const tags = Array.isArray(payload.tags) ? payload.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean) : [];
    const existingItemId = payload.existing_item_id ? String(payload.existing_item_id) : null;
    const sourceType = String(payload.source_type ?? 'website').trim();
    const content = String(payload.content ?? '').trim();
    const sourceName = String((payload.source_name ?? title) || 'knowledge-source').trim();
    const pageNumber = payload.page_number ? Number(payload.page_number) : null;
    const fileType = String(payload.file_type ?? '').trim();

    if (!workspaceId || (!title && !sourceName)) return json({ error: 'Please provide a workspace and title.' }, 400);

    if (sourceType === 'website') {
      if (!url) return json({ error: 'Please provide a website URL.' }, 400);
      const safeCheck = isSafeUrlCandidate(url);
      if (!safeCheck.ok || !safeCheck.parsed) return json({ error: safeCheck.reason ?? 'The URL could not be validated.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: membershipData, error: membershipError } = await adminClient
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    if (membershipError || !membershipData) return json({ error: 'You do not have access to that workspace.' }, 403);

    let extractedTitle = title || sourceName;
    let cleanedText = content;
    let normalizedUrl = url || null;

    if (sourceType === 'website') {
      const safeCheck = isSafeUrlCandidate(url);
      if (!safeCheck.ok || !safeCheck.parsed) throw new Error(safeCheck.reason ?? 'The URL could not be validated.');
      const { title: fetchedTitle, text } = await fetchWebsiteContent(safeCheck.parsed.toString());
      extractedTitle = fetchedTitle || title || sourceName;
      cleanedText = text;
      normalizedUrl = safeCheck.parsed.toString();
    }

    const contentExcerpt = cleanedText.slice(0, 500);

    const itemPayload = {
      workspace_id: workspaceId,
      title: extractedTitle,
      content: cleanedText.slice(0, 24000),
      file_type: sourceType === 'website' ? 'website' : fileType || 'text',
      source_type: sourceType,
      source_url: normalizedUrl,
      ingestion_status: 'ready',
      ingestion_error: null,
      content_excerpt: contentExcerpt,
      metadata: {
        source_url: normalizedUrl,
        fetched_at: new Date().toISOString(),
        source_name: sourceName,
        page_number: pageNumber,
      },
      tags,
      updated_at: new Date().toISOString(),
    };

    let record;
    if (existingItemId) {
      const { data, error } = await adminClient.from('knowledge_items').update(itemPayload).eq('id', existingItemId).select().single();
      if (error) throw error;
      record = data;
    } else {
      const { data, error } = await adminClient.from('knowledge_items').insert([{ ...itemPayload, created_at: new Date().toISOString() }]).select().single();
      if (error) throw error;
      record = data;
    }

    if (record?.id) {
      await adminClient.from('knowledge_chunks').delete().eq('resource_id', record.id);
      const chunks = chunkText(cleanedText, pageNumber ?? undefined, extractedTitle);
      const chunkRows = chunks.map((chunk, index) => ({
        workspace_id: workspaceId,
        resource_id: record.id,
        source_type: sourceType,
        source_name: extractedTitle,
        source_url: normalizedUrl,
        page_number: chunk.metadata.pageNumber as number | null,
        chunk_index: chunk.chunkIndex ?? index,
        content: chunk.content,
        metadata: {
          resourceId: record.id,
          sourceType: sourceType,
          fileName: extractedTitle,
          pageNumber: chunk.metadata.pageNumber ?? pageNumber ?? null,
          chunkIndex: chunk.chunkIndex ?? index,
          content: chunk.content,
        },
      }));
      if (chunkRows.length) {
        await adminClient.from('knowledge_chunks').insert(chunkRows);
      }
    }

    return json({ item: record, message: 'Knowledge source ingested successfully.' }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'The website could not be ingested.';
    return json({ error: message }, 500);
  }
});

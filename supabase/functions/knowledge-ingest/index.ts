import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

async function fetchSupabaseUser(supabaseUrl: string, supabaseAnonKey: string, authHeader: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: authHeader,
    },
  });

  if (!response.ok) return null;
  const body = await response.json().catch(() => null);
  return body?.user ?? null;
}

function isPrivateIpAddress(ip: string) {
  if (/^127\./.test(ip)) return true;
  if (/^0\./.test(ip)) return true;
  if (/^10\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;
  if (/^::1$/.test(ip)) return true;
  if (/^\[::1\]$/.test(ip)) return true;
  if (/^fe80:/i.test(ip)) return true;
  if (/^fc:/i.test(ip) || /^fd:/i.test(ip)) return true;
  return false;
}

function isUnsafeHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (!normalized) return true;
  if (normalized === 'localhost' || normalized.endsWith('.localhost') || normalized.endsWith('.local')) return true;
  if (/^(?:169\.254|127|10|192\.168|172\.(1[6-9]|2[0-9]|3[0-1]))\./.test(normalized)) return true;
  if (normalized === '[::1]' || normalized === '::1') return true;
  if (/^fe80:/i.test(normalized)) return true;
  if (/^fc:/i.test(normalized) || /^fd:/i.test(normalized)) return true;
  if (normalized.endsWith('.ec2.internal') || normalized.endsWith('.compute.internal') || normalized.includes('metadata.google.internal') || normalized.includes('169.254.169.254')) return true;
  return false;
}

function isSafeUrlCandidate(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'This URL is not valid.' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, reason: 'Only http:// and https:// URLs are allowed.' };
  }

  const hostname = parsed.hostname;
  if (isUnsafeHostname(hostname)) {
    return { ok: false, reason: 'Local or private network URLs are not allowed.' };
  }

  const ipMatch = hostname.match(/^\[?(?<ip>[^\]]+)\]?$/);
  if (ipMatch?.groups?.ip && isPrivateIpAddress(ipMatch.groups.ip)) {
    return { ok: false, reason: 'Private or local IP addresses are not allowed.' };
  }

  return { ok: true, parsed };
}

function normalizeHtmlText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<form[\s\S]*?<\/form>/gi, ' ')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<canvas[\s\S]*?<\/canvas>/gi, ' ')
    .replace(/<meta[^>]*>/gi, ' ')
    .replace(/<link[^>]*>/gi, ' ')
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n\nHeading: $1\n\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<td[^>]*>([\s\S]*?)<\/td>/gi, '$1 | ')
    .replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, '$1\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractWebContent(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const linkMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  const ogUrlMatch = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const title = titleMatch?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || 'Website Source';
  const canonicalUrl = linkMatch?.[1] || ogUrlMatch?.[1] || null;
  const text = normalizeHtmlText(html);
  return { title, text, canonicalUrl };
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

function buildError(code: string, message: string, status = 400) {
  return { success: false, error: { code, message, status } };
}

async function fetchWebsiteContent(url: string) {
  let currentUrl = url;
  let redirectCount = 0;
  let response: Response | null = null;

  while (redirectCount < 5) {
    const safeCheck = isSafeUrlCandidate(currentUrl);
    if (!safeCheck.ok || !safeCheck.parsed) {
      return { error: buildError('WEBSITE_URL_BLOCKED', safeCheck.reason || 'The URL is not allowed.', 400) };
    }

    response = await fetch(currentUrl, {
      headers: {
        'User-Agent': 'CreatorOS Knowledge Ingest/1.0',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
      },
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return { error: buildError('WEBSITE_REDIRECT_FAILED', 'The website redirected without a valid location.', 400) };
      }
      const nextUrl = new URL(location, currentUrl).toString();
      const nextSafeCheck = isSafeUrlCandidate(nextUrl);
      if (!nextSafeCheck.ok || !nextSafeCheck.parsed) {
        return { error: buildError('WEBSITE_REDIRECT_BLOCKED', 'The website redirected to an unsafe destination.', 400) };
      }
      currentUrl = nextUrl;
      redirectCount += 1;
      continue;
    }

    break;
  }

  if (!response) {
    return { error: buildError('WEBSITE_FETCH_FAILED', 'Unable to fetch the website.', 502) };
  }

  if (response.status >= 400) {
    const code = response.status === 403 ? 'WEBSITE_FORBIDDEN'
      : response.status === 404 ? 'WEBSITE_NOT_FOUND'
      : response.status === 429 ? 'WEBSITE_RATE_LIMITED'
      : response.status >= 500 ? 'WEBSITE_UNAVAILABLE'
      : 'WEBSITE_FETCH_FAILED';
    const message = response.status === 403
      ? 'The website denied access.'
      : response.status === 404
        ? 'The requested webpage was not found.'
        : response.status === 429
          ? 'The website is temporarily rate-limiting requests. Try again later.'
          : response.status >= 500
            ? 'The website is temporarily unavailable.'
            : `The website returned HTTP ${response.status}.`;
    return { error: buildError(code, message, response.status) };
  }

  const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    if (contentType.includes('application/pdf')) {
      return { error: buildError('WEBSITE_UNSUPPORTED_CONTENT', 'This URL points to a PDF. Use file upload for PDFs.', 422) };
    }
    return { error: buildError('WEBSITE_UNSUPPORTED_CONTENT', 'This URL does not contain a supported webpage.', 422) };
  }

  const html = await response.text();
  const { title, text, canonicalUrl } = extractWebContent(html);

  if (!text || text.trim().length < 50) {
    return { error: buildError('WEBSITE_EXTRACTION_FAILED', 'The webpage loaded, but no readable content could be extracted.', 422) };
  }

  return {
    title,
    text,
    canonicalUrl,
    finalUrl: response.url,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') return json({ ...buildError('METHOD_NOT_ALLOWED', 'Method not allowed.', 405) }, 405);

  try {
    const authHeader = req.headers.get('authorization');
    const authHeaderPreview = authHeader?.startsWith('Bearer ') ? `${authHeader.slice(0, 20)}...` : authHeader;
    console.log('knowledge-ingest received request', { method: req.method, authHeaderPresent: Boolean(authHeader), authHeaderPreview });
    if (!authHeader?.startsWith('Bearer ')) {
      return json({
        ...buildError('AUTH_REQUIRED', 'Sign in again to ingest knowledge.'),
        debug: { authHeaderPresent: Boolean(authHeader), authHeaderPrefix: authHeader?.split(' ')[0] ?? null },
      }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) return json({ ...buildError('CONFIG_MISSING', 'Knowledge ingestion is not configured.' ) }, 503);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const user = await fetchSupabaseUser(supabaseUrl, supabaseAnonKey, authHeader);
    if (!user?.id) {
      console.warn('knowledge-ingest auth validation failed', {
        authHeaderPresent: Boolean(authHeader),
        authStatus: user ? 'invalid-user' : 'unauthorized',
      });
      return json({
        ...buildError('AUTH_REQUIRED', 'Sign in again to ingest knowledge.'),
        debug: {
          authHeaderPresent: Boolean(authHeader),
          authStatus: user ? 'invalid-user' : 'unauthorized',
        },
      }, 401);
    }

    const userId = user.id;
    if (!userId) {
      return json({
        ...buildError('AUTH_REQUIRED', 'Sign in again to ingest knowledge.'),
        debug: { authHeaderPresent: Boolean(authHeader), user: null },
      }, 401);
    }

    const payload = await req.json();
    const workspaceId = String(payload.workspace_id ?? '').trim();
    const title = String(payload.title ?? '').trim();
    const url = String(payload.url ?? '').trim();
    const tags = Array.isArray(payload.tags) ? payload.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean) : [];
    const existingItemId = payload.existing_item_id ? String(payload.existing_item_id) : null;
    const sourceType = String(payload.source_type ?? 'website').trim();
    const sourceName = String((payload.source_name ?? title) || 'knowledge-source').trim();
    const pageNumber = payload.page_number ? Number(payload.page_number) : null;

    if (!workspaceId || (!title && !sourceName)) return json({ ...buildError('VALIDATION_FAILED', 'Please provide a workspace and title.' ) }, 400);

    if (sourceType === 'website') {
      if (!url) return json({ ...buildError('VALIDATION_FAILED', 'Please provide a website URL.' ) }, 400);
      const safeCheck = isSafeUrlCandidate(url);
      if (!safeCheck.ok || !safeCheck.parsed) return json({ ...buildError('VALIDATION_FAILED', safeCheck.reason || 'The URL could not be validated.' ) }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const [{ data: membershipData, error: membershipError }, { data: workspaceData, error: workspaceError }] = await Promise.all([
      adminClient
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .maybeSingle(),
      adminClient
        .from('workspaces')
        .select('id')
        .eq('id', workspaceId)
        .eq('owner_id', userId)
        .maybeSingle(),
    ]);

    if (membershipError || workspaceError) {
      console.error('knowledge-ingest workspace authorization lookup failed', { membershipError, workspaceError });
      return json({ ...buildError('AUTH_FAILED', 'You do not have access to that workspace.' ) }, 403);
    }

    if (!membershipData && !workspaceData) {
      return json({ ...buildError('AUTH_FAILED', 'You do not have access to that workspace.' ) }, 403);
    }

    const normalizedUrl = url || null;
    const initialMeta = {
      source_url: normalizedUrl,
      fetched_at: new Date().toISOString(),
      source_name: sourceName,
      page_number: pageNumber,
    };

    let record;
    if (sourceType === 'website') {
      const placeholderPayload = {
        workspace_id: workspaceId,
        title: sourceName,
        content: '',
        file_type: 'website',
        source_type: 'website',
        source_url: normalizedUrl,
        ingestion_status: 'processing',
        ingestion_error: null,
        content_excerpt: null,
        metadata: initialMeta,
        tags,
        updated_at: new Date().toISOString(),
      };

      if (existingItemId) {
        const { data, error } = await adminClient.from('knowledge_items').update({ ...placeholderPayload, title: sourceName }).eq('id', existingItemId).select().single();
        if (error) throw error;
        record = data;
      } else {
        const { data, error } = await adminClient.from('knowledge_items').insert([{ ...placeholderPayload, created_at: new Date().toISOString() }]).select().single();
        if (error) throw error;
        record = data;
      }
    }

    let extractedTitle = title || sourceName;
    let cleanedText = '';
    let canonicalUrl: string | null = null;
    let finalUrl = normalizedUrl;

    if (sourceType === 'website') {
      const result = await fetchWebsiteContent(url);
      if ('error' in result) {
        if (record?.id) {
          await adminClient.from('knowledge_items').update({ ingestion_status: 'failed', ingestion_error: result.error.message, updated_at: new Date().toISOString() }).eq('id', record.id);
          const { data: failedRecord } = await adminClient.from('knowledge_items').select().eq('id', record.id).single();
          return json({ success: false, item: failedRecord, error: result.error }, result.error.status ?? 500);
        }
        return json({ ...result, success: false }, result.error.status ?? 500);
      }

      extractedTitle = result.title || title || sourceName;
      cleanedText = result.text;
      canonicalUrl = result.canonicalUrl ?? null;
      finalUrl = result.finalUrl ?? normalizedUrl;
    }

    const contentExcerpt = cleanedText.slice(0, 500);
    const itemPayload = {
      workspace_id: workspaceId,
      title: extractedTitle,
      content: cleanedText.slice(0, 24000),
      file_type: sourceType === 'website' ? 'website' : 'text',
      source_type: sourceType,
      source_url: finalUrl,
      ingestion_status: 'ready',
      ingestion_error: null,
      content_excerpt: contentExcerpt || null,
      metadata: {
        ...initialMeta,
        source_url: finalUrl,
        canonical_url: canonicalUrl,
      },
      tags,
      updated_at: new Date().toISOString(),
    };

    if (record?.id) {
      const { data, error } = await adminClient.from('knowledge_items').update(itemPayload).eq('id', record.id).select().single();
      if (error) throw error;
      record = data;
    }

    if (record?.id) {
      await adminClient.from('knowledge_chunks').delete().eq('resource_id', record.id);
      const chunks = chunkText(cleanedText, pageNumber ?? undefined, extractedTitle);
      if (!chunks.length) {
        await adminClient.from('knowledge_items').update({ ingestion_status: 'failed', ingestion_error: 'No readable text was extracted from the webpage.', updated_at: new Date().toISOString() }).eq('id', record.id);
        const { data: failedRecord } = await adminClient.from('knowledge_items').select().eq('id', record.id).single();
        return json({ success: false, item: failedRecord, error: buildError('WEBSITE_EXTRACTION_FAILED', 'No readable text was extracted from the webpage.', 422) }, 422);
      }
      const chunkRows = chunks.map((chunk, index) => ({
        workspace_id: workspaceId,
        resource_id: record.id,
        source_type: sourceType,
        source_name: extractedTitle,
        source_url: finalUrl,
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
      await adminClient.from('knowledge_chunks').insert(chunkRows);
    }

    return json({ success: true, item: record, message: 'Knowledge source ingested successfully.' }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'The website could not be ingested.';
    return json({ success: false, error: { code: 'INGESTION_FAILED', message, status: 500 } }, 500);
  }
});

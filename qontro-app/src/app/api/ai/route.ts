import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ---------------------------------------------------------------------------
// In-memory rate limiter (V1 -- resets on server restart; Redis required for prod)
// ---------------------------------------------------------------------------
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

// ---------------------------------------------------------------------------
// POST /api/ai
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // 1. Authentication check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_MISCONFIGURED', message: 'Server is not properly configured.' } },
      { status: 500 }
    );
  }

  let userId: string;

  try {
    const response = NextResponse.next();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    userId = user.id;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_ERROR', message: 'Authentication check failed.' } },
      { status: 401 }
    );
  }

  // 1.5. Parse and validate request body FIRST so we can check workspace_id
  let prompt: string;
  let type: string;
  let contextData: Record<string, unknown>;
  let workspaceId: string;

  try {
    const body = await req.json();
    prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    type = typeof body.type === 'string' ? body.type.trim() : 'general_operations';
    contextData = body.contextData && typeof body.contextData === 'object' ? body.contextData : {};
    workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId.trim() : '';
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_REQUEST', message: 'Request body must be valid JSON.' } },
      { status: 400 }
    );
  }

  if (!prompt || !workspaceId) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_REQUEST', message: 'prompt and workspaceId fields are required.' } },
      { status: 400 }
    );
  }

  // 1.6 Workspace membership check
  try {
    const response = NextResponse.next();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not a member of this workspace.' } },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_ERROR', message: 'Workspace membership check failed.' } },
      { status: 403 }
    );
  }

  // 2. Rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rateLimitKey = userId + ':' + clientIp;
  const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey);

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait before trying again.' } },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
      }
    );
  }


  // 4. AI provider configuration
  const apiKey = process.env.OLLAMA_API_KEY;
  const model = process.env.OLLAMA_MODEL ?? 'deepseek-v4-flash:cloud';
  const ollamaHost = process.env.OLLAMA_HOST ?? 'https://api.ollama.com';

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: { code: 'AI_NOT_CONFIGURED', message: 'AI service is not configured on this server.' } },
      { status: 503 }
    );
  }

  // 5. Build prompts (server-side only -- no secrets exposed to client)
  const systemPrompt =
    'You are Qontro AI -- the operations brain for high-velocity agency and startup founders. ' +
    'Analyze tasks, team workloads, project risks, and documents to produce concise, hyper-actionable operational decisions. ' +
    'Respond in structured, professional Markdown format with clear bullet points, risk ratings (Low/Med/High/Critical), and direct action recommendations.';

  const userPrompt = 'Operational Context:\n' + JSON.stringify(contextData, null, 2) + '\n\nTask Type: ' + type + '\nPrompt: ' + prompt;

  // 6. Call AI provider
  try {
    const aiResponse = await fetch(ollamaHost + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!aiResponse.ok) {
      const statusCode = aiResponse.status;
      if (statusCode === 429) {
        return NextResponse.json(
          { success: false, error: { code: 'AI_RATE_LIMITED', message: 'AI provider rate limit reached. Please try again later.' } },
          { status: 503 }
        );
      }
      if (statusCode >= 500) {
        return NextResponse.json(
          { success: false, error: { code: 'AI_UNAVAILABLE', message: 'AI analysis is temporarily unavailable. Please try again in a moment.' } },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { success: false, error: { code: 'AI_ERROR', message: 'AI provider returned an error (' + statusCode + ').' } },
        { status: 502 }
      );
    }

    const data = await aiResponse.json();
    const content: string = data.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'AI_EMPTY_RESPONSE', message: 'AI returned an empty response. Please try again.' } },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, model, response: content });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return NextResponse.json(
        { success: false, error: { code: 'AI_TIMEOUT', message: 'AI request timed out. Please try again.' } },
        { status: 504 }
      );
    }

    // Do NOT return fake/fabricated AI responses.
    return NextResponse.json(
      { success: false, error: { code: 'AI_UNAVAILABLE', message: 'AI analysis is temporarily unavailable. Please try again in a moment.' } },
      { status: 503 }
    );
  }
}

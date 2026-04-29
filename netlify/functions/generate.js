// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/generate.js
//
// Netlify serverless function — runs on Netlify's servers, NOT in the browser.
// The Groq API key is stored as a Netlify environment variable (GROQ_API_KEY)
// and is never sent to or visible in the browser.
//
// Flow:
//   1. Browser POSTs { location, energy, time } to /.netlify/functions/generate
//   2. This function reads GROQ_API_KEY from the server environment
//   3. Calls the Groq API with those inputs
//   4. Returns only { action, why } to the browser — nothing secret leaks
// ─────────────────────────────────────────────────────────────────────────────

// The system prompt lives here on the server, not in the browser.
const SYSTEM_PROMPT = `
You are Intentional Leisure Advisor, a context-aware leisure design assistant.
This system is designed for SINGLE-SHOT use, not open-ended chat.
The user gives a few structured inputs, and you return one concise recommendation.

Mission:
Help users shift from passive scrolling to intentional leisure in real-life conditions.
Your job is not to optimize productivity. Your job is to support realistic,
low-friction leisure choices that match the user's actual state.

Core rules:
- Return exactly ONE action
- Be short and direct
- Be immediately actionable
- Match the user's current location, energy level, available time, AND stated need
- Avoid preparation, setup, travel, or special tools unless already available
- Do not give long wellness articles
- Do not give multiple options
- Do not use productivity or self-improvement framing
- Do not assume ideal conditions
- Every sentence must be complete and end with a period — never cut off mid-phrase

Leisure intent — honor the user's stated need:
- "calm down"     → quiet, grounding, sensory, or stillness-based. Nothing effortful or stimulating.
- "move a little" → light physical: stretching, a short walk, gentle movement. No equipment or intensity.
- "feel inspired" → noticing, creating, or encountering something interesting: observing, a short read, music, sketching.
- "reconnect"     → gentle presence: mindful noticing, looking outside, a quiet moment with yourself or your surroundings.
- "general reset" → whatever best fits location, energy, and time.

Emotional state — let the user's feeling quietly shape the tone:
- "anxious"   → choose something that slows the body or narrows attention. Avoid novelty or stimulation.
- "bored"     → a small dose of novelty or gentle curiosity is welcome. Nothing demanding.
- "restless"  → light movement or a change of sensory focus. Brief, not effortful.
- "numb"      → something with warmth or gentle texture. Simple, sensory, present-moment.
- "unspecified feeling" → no adjustment needed.

In the "Why this fits" line, briefly reference the user's emotional state and stated need alongside their energy and time.

Output format (use exactly this structure, no extra text):
Action: [one complete sentence ending with a period]
Why this fits: [one complete sentence that mentions the user's need, energy level, and time — ending with a period]
Tiny first step: [the smallest possible action to start right now — one short sentence ending with a period]
`.trim();


// ── MODEL ─────────────────────────────────────────────────────────────────────
// Change this one line if you need to swap models.
// Currently active Groq models (as of April 2026):
//   llama-3.3-70b-versatile   ← best quality, used here
//   llama-3.1-8b-instant      ← fastest, lower quality
const GROQ_MODEL = 'llama-3.3-70b-versatile';


// ── CALM FALLBACK ─────────────────────────────────────────────────────────────
// Returned when the Groq API is unavailable, so the UI never shows a crash.
const FALLBACK = {
  action:   'Step away from your screen for two minutes and look at something in the distance.',
  why:      'Even a brief visual break reduces eye strain and resets your focus.',
  tinyStep: 'Stand up right now.',
};


// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
exports.handler = async function (event) {

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  // ── 1. READ THE API KEY FROM THE SERVER ENVIRONMENT ───────────────────────
  const apiKey = process.env.GROQ_API_KEY;
  console.log('[Drift] GROQ_API_KEY present:', !!apiKey);  // logs true/false, never the key

  if (!apiKey) {
    console.error('[Drift] ERROR: GROQ_API_KEY is not set in environment.');
    return {
      statusCode: 200,  // return 200 with fallback so UI stays calm
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FALLBACK),
    };
  }

  // ── 2. PARSE THE REQUEST BODY ─────────────────────────────────────────────
  let location, energy, time, need, feeling, recentActions;
  try {
    const body = JSON.parse(event.body);
    location      = body.location;
    energy        = body.energy;
    time          = body.time;
    // need: the user's stated leisure intent — optional, defaults to "general reset"
    need          = (typeof body.need === 'string' && body.need.trim()) ? body.need.trim() : 'general reset';
    // feeling: the user's current emotional state — optional, defaults to "unspecified feeling"
    feeling       = (typeof body.feeling === 'string' && body.feeling.trim()) ? body.feeling.trim() : 'unspecified feeling';
    // recentActions: array of up to 3 recent action strings sent by the client
    recentActions = Array.isArray(body.recentActions) ? body.recentActions.slice(0, 3) : [];
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON in request body.' }),
    };
  }

  if (!location || !energy || !time) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: location, energy, time.' }),
    };
  }

  // ── 3. BUILD THE USER PROMPT ──────────────────────────────────────────────
  // If the client sent recent actions, append a hard avoid-list instruction.
  let recentNote = '';
  if (recentActions.length > 0) {
    const list = recentActions.map((a, i) => `  ${i + 1}. ${a}`).join('\n');
    recentNote = `\n\nIMPORTANT — variety required: The user has already seen these recent suggestions. Do NOT repeat or closely paraphrase any of them. Choose a clearly different type of low-friction leisure activity:\n${list}`;
  }

  const userPrompt = `I am currently ${location}. My energy level is ${energy}. I have ${time} available. How I am feeling: ${feeling}. What I need from this moment: ${need}. What should I do instead of scrolling?${recentNote}`;

  // ── 4. CALL THE GROQ API ──────────────────────────────────────────────────
  let rawText = '';
  try {
    console.log('[Drift] Calling Groq with model:', GROQ_MODEL);

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0.8,  // slightly higher for more variety across suggestions
        max_tokens:  400,  // enough to ensure all three fields are complete
      }),
    });

    console.log('[Drift] Groq response status:', groqResponse.status);

    if (!groqResponse.ok) {
      const errData = await groqResponse.json().catch(() => ({}));
      const errMsg  = errData?.error?.message || `Groq HTTP ${groqResponse.status}`;
      console.error('[Drift] Groq API error:', errMsg);
      // Return fallback instead of crashing with 502
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(FALLBACK),
      };
    }

    const data = await groqResponse.json();
    rawText = data?.choices?.[0]?.message?.content ?? '';
    console.log('[Drift] Raw response length:', rawText.length, 'chars');

  } catch (err) {
    console.error('[Drift] Fetch error:', err.message);
    // Network failure — return fallback instead of 502
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FALLBACK),
    };
  }

  // ── 5. PARSE THE AI RESPONSE ──────────────────────────────────────────────
  let action   = rawText.trim();
  let why      = '';
  let tinyStep = '';

  // Capture everything between "Action:" and "Why this fits:"
  const actionMatch = rawText.match(/Action:\s*([\s\S]+?)\s*(?:Why this fits:|$)/i);
  if (actionMatch) action = actionMatch[1].trim();

  // Capture everything between "Why this fits:" and "Tiny first step:"
  const whyMatch = rawText.match(/Why this fits:\s*([\s\S]+?)\s*(?:Tiny first step:|$)/i);
  if (whyMatch) why = whyMatch[1].trim();

  // Capture everything after "Tiny first step:"
  const tinyStepMatch = rawText.match(/Tiny first step:\s*([\s\S]+)/i);
  if (tinyStepMatch) tinyStep = tinyStepMatch[1].trim();

  // If parsing failed entirely, use fallback
  if (!action || action === rawText.trim()) {
    console.warn('[Drift] Response parsing failed — using fallback. Raw:', rawText.slice(0, 100));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FALLBACK),
    };
  }

  console.log('[Drift] Successfully parsed response.');

  // ── 6. RETURN ONLY THE SAFE RESULT ───────────────────────────────────────
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, why, tinyStep }),
  };
};

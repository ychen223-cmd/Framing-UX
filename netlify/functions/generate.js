// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/generate.js
//
// This is a Netlify serverless function.
// It runs on Netlify's servers — NOT in the user's browser.
// Because it runs server-side, it can safely use the API key
// stored as a Netlify environment variable (never exposed to users).
//
// HOW IT WORKS:
//   1. The browser sends a POST request to /.netlify/functions/generate
//   2. This function receives the 3 user selections (location, energy, time)
//   3. It builds a prompt and calls the Gemini API using the secret key
//   4. It sends back just { action, why } — nothing secret leaks to the browser
// ─────────────────────────────────────────────────────────────────────────────

// The system prompt lives here on the server (not in the browser).
// Edit this text to change how the AI behaves.
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
- Match the user's current energy and time
- Avoid preparation, setup, travel, or special tools unless already available
- Do not give long wellness articles
- Do not give multiple options
- Do not use productivity or self-improvement framing
- Do not assume ideal conditions

Output format (use exactly this, no extra text):
Action: [one concrete action]
Why this fits: [1 short sentence]
`.trim();


// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
// Netlify calls exports.handler for every request to this function.
// CommonJS syntax (not ES modules) — no package.json config needed.
exports.handler = async function (event) {

  // Only allow POST requests (the browser sends POST with user data)
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  // ── 1. READ THE API KEY FROM THE ENVIRONMENT ──────────────────────────────
  // process.env.GEMINI_API_KEY reads the secret you set in Netlify's dashboard.
  // It is NEVER sent to the browser — it only exists on the server side.
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // This means you forgot to set the environment variable in Netlify
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server is missing the GEMINI_API_KEY environment variable." }),
    };
  }

  // ── 2. PARSE THE REQUEST BODY ─────────────────────────────────────────────
  // The browser sends JSON: { location, energy, time }
  let location, energy, time;
  try {
    const body = JSON.parse(event.body);
    location = body.location;
    energy   = body.energy;
    time     = body.time;
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body." }),
    };
  }

  // Make sure all three fields are present
  if (!location || !energy || !time) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing one or more fields: location, energy, time." }),
    };
  }

  // ── 3. BUILD THE USER PROMPT ──────────────────────────────────────────────
  // Combines the 3 user inputs into a natural-language sentence for the AI.
  const userPrompt = `I am currently ${location}. My energy level is ${energy}. I have ${time} available. What should I do instead of scrolling?`;

  // ── 4. CALL THE GEMINI API ────────────────────────────────────────────────
  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  let rawText = "";
  try {
    const geminiResponse = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,      // slight creativity
          maxOutputTokens: 200,  // keep it short
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errData = await geminiResponse.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gemini HTTP ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    // Navigate the nested Gemini response to get the text string
    rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: `Gemini API error: ${err.message}` }),
    };
  }

  // ── 5. PARSE THE AI RESPONSE ──────────────────────────────────────────────
  // Extract "Action:" and "Why this fits:" from the AI's text.
  let action = rawText.trim();
  let why    = "";

  const actionMatch = rawText.match(/Action:\s*(.+)/i);
  if (actionMatch) action = actionMatch[1].trim();

  const whyMatch = rawText.match(/Why this fits:\s*(.+)/i);
  if (whyMatch) why = whyMatch[1].trim();

  // ── 6. RETURN THE RESULT TO THE BROWSER ──────────────────────────────────
  // Only { action, why } is sent back — no API key, no raw prompt, nothing secret.
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, why }),
  };
}

# Drift — Memory System Documentation

## Final Links

Live App: https://astounding-pegasus-ff18ce.netlify.app/

GitHub Repo: https://github.com/ychen223-cmd/Framing-UX

---

## 1. Project Overview

Drift is a lightweight tool designed to help users make intentional use of small pockets of free time.

Instead of passive scrolling, users select:
- Location
- Energy level
- How they are feeling
- What they need from the moment
- Time available

The system then generates one simple, actionable suggestion.

The goal is to reduce decision friction and support mindful behavior in everyday moments.

---

## 2. Memory Architecture

### What the system stores

- location
- energy level
- feeling (emotional state)
- leisure intent (need)
- time available
- last generated action, why it fits, and tiny first step
- recent suggestion history (last 3)
- feedback counts (helped / not right)

### Where it is stored

All data is stored in the browser using `localStorage`.

### Why this matters

This allows:
- the app to remember user preferences
- the interface to restore previous selections on page load
- the experience to feel continuous instead of reset on every refresh
- the suggestion engine to avoid repeating recent actions

---

## 3. Memory Schema (JSON)

The app captures five structured inputs: location, energy, feeling, leisure intent (need), and time. All five are stored in localStorage and restored on page load.

```json
{
  "drift_location":        "commuting",
  "drift_energy":          "low",
  "drift_feeling":         "anxious",
  "drift_need":            "calm down",
  "drift_time":            "5–15 minutes",
  "drift_last_action":     "Close your eyes and listen to a single song you love.",
  "drift_last_why":        "Low energy, anxious feeling, and limited time make passive listening ideal.",
  "drift_last_tiny_step":  "Put in your headphones right now.",
  "drift_recent_actions":  "[{\"action\":\"...\",\"why\":\"...\",\"tinyStep\":\"...\"}]",
  "drift_positive_count":  "3",
  "drift_negative_count":  "1"
}
```
4. Failure States & Recovery
API fails
The previous result remains visible
The UI does not break
Empty localStorage
The app loads normally
No selections are pre-filled
Corrupted data
Invalid values are ignored
No crash occurs
Invalid result
The result card is hidden
Prevents showing broken content
User resets memory
All stored data is cleared
UI returns to default state
5. Test Cases
Case 1: First-time user

No stored data
Expected: clean interface, no chips selected
Case 2: Returning user

Previous selections saved
Expected: all five chip groups restored
Case 3: Refresh page

Data persists
Expected: no reset, last result shown instantly (no typewriter)
Case 4: API failure

Expected: calm error card shown, last result remains visible below
Case 5: Clear memory

Expected: all selections removed, result card hidden, memory panel shows empty state
Case 6: Try another suggestion

Expected: new suggestion is different from the last 3 shown
6. Live Prototype
Netlify URL:
https://astounding-pegasus-ff18ce.netlify.app/

Features:

Fully working interaction
LocalStorage persistence
Server-side API via Netlify function (no API key exposed)
No setup required for users
7. Design Principles
Reduce friction
Support intentional behavior
Keep interaction minimal
Avoid cognitive overload
Maintain continuity through memory
8. Polish Updates (April–May 2026)
Visual Redesign
Hero section with large serif logo (3.2rem italic) and calm sub-heading
Input area uses open layout — no outer card or box shadow
Individual fields separated by thin divider lines for clarity without enclosure
Consistent spacing system using CSS custom properties (--gap, --radius, --max-w)
Fully mobile-responsive layout with adjusted padding and font sizes at 480px breakpoint
Copy Updates
Hero headline: "Check in with this moment."
Description: "Choose a few signals. Drift gives one small action."
Positioning line: "No prompt. No long list."
Microcopy added under each field to guide honest selection
Breathing Circle Animation
A slow pulsing circle (breathe keyframe, 5s) replaces static loading text
Scales and fades to communicate calm, not urgency
Displays during the intentional 5-second pause before results appear
Typewriter Animation
New AI results are revealed character-by-character at ~14ms per character
Action → Why this fits → Tiny first step animate in sequence with a 240ms pause between fields
Submit buttons are disabled during animation to prevent double-submission
Page-load restore from localStorage shows instantly (no typewriter) so returning users see content immediately
The loading circle hides before the typewriter starts, giving a clean visual handoff
Tiny First Step
New field returned by the AI: the smallest possible starting action
Added to system prompt in generate.js; parsed with /Tiny first step:\s*([\s\S]+)/i
Displayed in italics in the result card, between "Why this fits" and trust calibration
Trust Calibration
"This is a suggestion, not a requirement." shown below the result in faint italic
Positioned intentionally after the action, not before, so it does not undercut the suggestion
Feeling Input
Fifth input field: "How are you feeling?" with options Anxious / Bored / Restless / Numb
Positioned after Energy, before Need
Optional — defaults to "unspecified feeling" if skipped
Sent to the server and used to subtly shape the tone of the suggestion:
Anxious → calming, slow, narrow-attention activities
Bored → a gentle dose of novelty
Restless → light movement or sensory shift
Numb → warmth, texture, present-moment simplicity
Stored as drift_feeling in localStorage; shown in the memory panel
Never used as a diagnostic label — microcopy reads: "A quick check-in, not a diagnosis."
Variety System (Try Another)
Last 3 suggestions stored as a JSON array in drift_recent_actions
Sent to the server on every request as an avoid-list
Backend appends a hard instruction to the user prompt: do not repeat or closely paraphrase recent suggestions
Model temperature raised to 0.8 for more natural variety
Feedback with localStorage
"This helped" increments drift_positive_count in localStorage
"Not right now" increments drift_negative_count in localStorage
Confirmation message appears inline after each response
Expandable Memory Section
Toggle button reveals stored state: location, energy, feeling, need, time, recent suggestions, feedback counts
Uses .hidden CSS class toggle — no extra dependencies
Refreshes content each time it is opened
Includes device notice: "Stored only on this device. Never sent anywhere."
Calm Error Card
Replaces raw error text with a styled card: "Something didn't connect."
Notes that the previous result remains visible if one exists
No technical error strings shown to the user
9. Backend Architecture
Netlify Serverless Function
File: netlify/functions/generate.js
Accepts POST requests at /.netlify/functions/generate
Reads GROQ_API_KEY from Netlify environment variables (never exposed to browser)
Returns only { action, why, tinyStep } to the client
Model
Provider: Groq
Model: llama-3.3-70b-versatile
Temperature: 0.8
Max tokens: 400
Request Body
{
  "location":      "commuting",
  "energy":        "low",
  "feeling":       "anxious",
  "need":          "calm down",
  "time":          "5–15 minutes",
  "recentActions": ["last suggestion", "second last", "third last"]
}
Fallback
All error paths (missing API key, Groq failure, parse failure) return HTTP 200 with a static calm fallback object instead of a 502, so the UI never crashes.


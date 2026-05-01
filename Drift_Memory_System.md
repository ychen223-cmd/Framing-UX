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
## 4. Failure States & Recovery

### API fails
- The previous result remains visible
- The UI does not break
- A calm error card appears instead of raw technical error text

### Empty localStorage
- The app loads normally
- No selections are pre-filled

### Corrupted data
- Invalid values are ignored
- No crash occurs

### Invalid result
- The result card is hidden
- Broken content is not shown to the user

### User resets memory
- All stored data is cleared
- The UI returns to the default state

---

## 5. Test Cases

### Case 1: First-time user
- No stored data
- Expected: clean interface, no chips selected

### Case 2: Returning user
- Previous selections saved
- Expected: all five chip groups restored

### Case 3: Refresh page
- Data persists
- Expected: no reset, last result shown instantly with no typewriter animation

### Case 4: API failure
- Expected: calm error card shown, last result remains visible if one exists

### Case 5: Clear memory
- Expected: all selections removed, result hidden, memory panel shows empty state

### Case 6: Try another suggestion
- Expected: new suggestion is different from the last 3 shown

---

## 6. Live Prototype

Netlify URL:  
https://astounding-pegasus-ff18ce.netlify.app/

---

## 7. Features

- Fully working interaction
- Five structured inputs: location, energy, feeling, need, and time
- AI-generated action suggestion
- “Why this fits” explanation
- “Tiny first step” guidance
- LocalStorage persistence
- Recent suggestion memory
- Try another suggestion
- 5-second breathing state
- Typewriter result reveal
- Memory section
- Clear all memory
- Calm error state
- Server-side API through Netlify function
- Groq AI generation
- No API key exposed in the browser

---

## 8. Design Principles

- Reduce friction
- Support intentional behavior
- Keep interaction minimal
- Avoid cognitive overload
- Make memory visible and controllable
- Keep the experience calm
- Avoid long lists
- Avoid prompt-writing

---

## 9. Backend Architecture

The app uses a Netlify serverless function.

The browser sends the user’s selected signals to Netlify.  
Netlify keeps the Groq API key protected.  
Netlify talks to Groq and sends the result back to the page.

The API key is stored as a secret environment variable.  
It is not visible in the browser.

AI provider: Groq  
Model: llama-3.3-70b-versatile

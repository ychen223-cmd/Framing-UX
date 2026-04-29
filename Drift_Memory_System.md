# Drift — Memory System Documentation

## 1. Project Overview

Drift is a lightweight tool designed to help users make intentional use of small pockets of free time.

Instead of passive scrolling, users select:
- Location
- Energy level
- Time available

The system then generates one simple, actionable suggestion.

The goal is to reduce decision friction and support mindful behavior in everyday moments.

---

## 2. Memory Architecture

### What the system stores

The system stores:
- location
- energy level
- time available
- last generated action

### Where it is stored

All data is stored in the browser using `localStorage`.

### Why this matters

This allows:
- the app to remember user preferences
- the interface to restore previous selections
- the experience to feel continuous instead of reset on every refresh

---

## 3. Memory Schema (JSON)

The app now captures four structured inputs: location, energy, **leisure intent (need)**, and time. The `need` field represents what kind of rest the user wants from the moment and directly shapes the AI suggestion.

```json
{
  "location": "commuting",
  "energy": "low",
  "feeling": "anxious",
  "need": "calm down",
  "time": "5-15 min",
  "last_action": "Close your eyes and take a slow breath"
}
## 4. Failure States & Recovery

1. **API fails**
- The previous result remains visible  
- The UI does not break  

2. **Empty localStorage**
- The app loads normally  
- No selections are pre-filled  

3. **Corrupted data**
- Invalid values are ignored  
- No crash occurs  

4. **Invalid result**
- The result card is hidden  
- Prevents showing broken content  

5. **User resets memory**
- All stored data is cleared  
- UI returns to default state  

---

## 5. Test Cases

**Case 1: First-time user**
- No stored data  
- Expected: clean interface  

**Case 2: Returning user**
- Previous selections saved  
- Expected: selections restored  

**Case 3: Refresh page**
- Data persists  
- Expected: no reset  

**Case 4: API failure**
- Expected: last result remains visible  

**Case 5: Clear memory**
- Expected: all selections removed  

---

## 6. Live Prototype

**Netlify URL:**  
👉 https://framing-ux-yuxuan.netlify.app/

**Features:**
- Fully working interaction  
- LocalStorage persistence  
- Server-side API (no API key exposed)  
- No setup required for users  

---

## 7. Design Principles

- Reduce friction  
- Support intentional behavior  
- Keep interaction minimal  
- Avoid cognitive overload  
- Maintain continuity through memory  

---

## 8. Polish Updates (April 2026)

### Visual Redesign
- Hero section with larger serif logo (3.2rem italic) and descriptive sub-heading
- Input fields moved into a single card with drop shadow for grouping clarity
- Consistent spacing system using CSS custom properties (`--gap`, `--radius`, `--max-w`)
- Fully mobile-responsive layout with adjusted padding and font sizes at 480px breakpoint

### Copy Updates
- Hero headline: *"One small action for the moment you are in."*
- Description: *"Choose where you are, how much energy you have, and how much time you have. Drift gives you one low-friction action — not a list."*
- Input card label: *"Start with your current state."*
- Microcopy added under each field to guide honest selection

### Breathing Circle Animation
- A slow pulsing circle (4-second `breathe` keyframe) replaces static loading text
- Scales from 0.82× to 1.25× opacity while fading to communicate calm, not urgency
- Displays during the intentional 5-second pause before results appear

### Tiny First Step
- New field returned by the AI: the smallest possible starting action
- Added to system prompt in `generate.js`; parsed with `/Tiny first step:\s*([\s\S]+)/i`
- Displayed in italics in the result card, between "Why this fits" and trust calibration

### Trust Calibration
- *"This is a suggestion, not a requirement."* shown below the result in faint italic
- Positioned intentionally after the action, not before, so it doesn't undercut the suggestion

### Feedback with localStorage
- "This helped" increments `drift_positive_count` in localStorage
- "Not right now" increments `drift_negative_count` in localStorage
- Confirmation message appears inline: *"Saved. Drift will keep this kind of action in mind."*

### Expandable Memory Section
- Toggle button replaces always-visible memory hint
- Opens to show: location, energy, time, last action, and feedback counts
- Uses `.hidden` CSS class toggle — no extra dependencies
- Refreshes content each time it is opened

### Calm Error Card
- Replaces raw red error text with a styled card: *"Something didn't connect."*
- Notes that the previous result remains visible if one exists
- No technical error strings shown to the user

### Feeling Input
- New field: "How are you feeling?" with options Anxious / Bored / Restless / Numb
- Positioned after Energy, before Need
- Optional — defaults to "unspecified feeling" if skipped
- Sent to the server and used to subtly shape the tone of the suggestion (e.g. anxious → calming; bored → a touch of novelty)
- Stored as `drift_feeling` in localStorage; shown in the memory panel
- Never used as a diagnostic label — microcopy reads "A quick check-in, not a diagnosis."

### Typewriter Animation
- New AI results are revealed character-by-character at ~14ms per character
- Action, Why this fits, and Tiny first step each animate in sequence with a 240ms pause between fields
- Buttons (Get my action, Try another) are disabled during animation to prevent double-submission
- Page-load restore from localStorage shows instantly — no animation — so returning users see content immediately
- The loading circle hides before the typewriter starts, giving a clean visual handoff

### Memory Schema (updated)
```json
{
  "drift_location":       "commuting",
  "drift_energy":         "low",
  "drift_feeling":        "anxious",
  "drift_need":           "calm down",
  "drift_time":           "5–15 minutes",
  "drift_last_action":    "Close your eyes and listen to a single song you love.",
  "drift_last_why":       "Low energy, anxious feeling, and limited time make passive listening ideal.",
  "drift_last_tiny_step": "Put in your headphones right now.",
  "drift_positive_count": "3",
  "drift_negative_count": "1"
}
```
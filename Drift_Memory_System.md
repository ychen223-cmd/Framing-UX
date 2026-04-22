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

```json
{
  "location": "commuting",
  "energy": "low",
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
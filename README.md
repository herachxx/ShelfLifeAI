# 🌿 ShelfLife AI

**A smart virtual refrigerator powered by AI — built for Technovation Girls 2026**

> Team Suerte · Aktobe, Kazakhstan  
> SDG 12: Responsible Consumption and Production

---

## What Is ShelfLife AI?

ShelfLife AI is a web application that acts as a virtual guardian for your refrigerator. It tracks everything you have in your fridge, warns you before items expire, scans grocery receipts and product packaging using AI, analyzes ingredient lists for harmful additives, and lets your family share one live fridge together.

---

## Quick Start

1. Open `index.html` in any modern browser — no server required.
2. The dashboard pre-loads with demo data so you can explore immediately.
3. Navigate using the top navigation bar.

---

## Project Structure

```
shelflife-v2/
│
├── index.html          ← Main HTML file — all pages live here
│
├── css/
│   ├── design.css      ← Design tokens, typography, base components
│   └── components.css  ← Page-specific layouts and component styles
│
├── js/
│   └── app.js          ← All application logic, state, AI integration
│
├── docs/
│   ├── README.md       ← This file
│   └── documentation.docx  ← Full Word documentation
│
└── studio-main/        ← Reference: original Next.js + Genkit AI project
```

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `#home` | Landing page, hero, features, SDG info |
| About | `#about` | Team Suerte, ethics, problem statement |
| Dashboard | `#dashboard` | Virtual fridge with all items |
| Scan | `#scan` | Receipt/product scanner + ingredient analyzer |
| AI Chat | `#chat` | Natural language fridge assistant |
| Shopping | `#shopping` | Auto-populated shopping list |
| Family | `#family` | Shared fridge with invite system |

---

## AI Features

All AI features call the **Anthropic Claude API** (`claude-sonnet-4-20250514`). The AI logic is based on three Genkit flows from the `studio-main` reference project:

### 1. `scanReceiptAndProduct` Flow
- Upload a receipt or product photo
- AI extracts item names, production dates, and expiry dates
- Output: `[{itemName, expirationDate, productionDate, dateMissing}]`
- Falls back to demo data if no API connection

### 2. `analyzeIngredients` Flow
- Paste ingredient list text
- AI identifies harmful additives, allergens, unhealthy fats
- Output: `{analysis: [{ingredient, riskLevel, description, category}]}`
- Risk levels: High / Medium / Low / None

### 3. `updateInventoryChat` Flow
- Natural language messages like "-1 egg" or "finished the milk"
- AI parses intent and returns structured updates
- Output: `[{item, quantityChange?, status?}]`
- Full local fallback parser included for offline use

---

## API Key

The app calls `https://api.anthropic.com/v1/messages` directly from the browser.

To use real AI features, you need an Anthropic API key with access to `claude-sonnet-4-20250514`.

**Option A — Add key in browser console:**
```javascript
// Paste this in browser DevTools console before using AI features
window.ANTHROPIC_API_KEY = "sk-ant-...";
```

**Option B — Modify `js/app.js`:**
Find the `fetch("https://api.anthropic.com/v1/messages", ...` calls and add:
```javascript
headers: {
  "Content-Type": "application/json",
  "x-api-key": "YOUR_KEY_HERE",
  "anthropic-version": "2023-06-01"
}
```

> If no API key is present, all AI features fall back gracefully to demo mode with realistic sample data.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 semantic |
| Styling | CSS3 with custom properties (no frameworks) |
| Logic | Vanilla JavaScript (ES2022) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Fonts | Sora (display) + Inter (body) via Google Fonts |
| Icons | Unicode emoji (no icon library needed) |

---

## Browser Support

Works in all modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.

---

## Team

- **Aruzhan Maratova** — AIS, Aktobe
- **Inabat Bayakhmetova** — NIS, Aktobe
- **Zere Mukhanbet** — NIS, Aktobe
- **Aigerim Bostubayeva** — NIS, Aktobe
- **Sapar Yelzhan** — Mentor, AIS

---

## License

Built for Technovation Girls 2026. Educational use only.

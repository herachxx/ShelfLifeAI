# ShelfLife AI

**A smart virtual refrigerator powered by AI.**

> Team Suerte · Aktobe, Kazakhstan  
> SDG 12: Responsible Consumption and Production

---

## What Is ShelfLife AI?

ShelfLife AI is a web application that acts as a virtual guardian for your refrigerator. It tracks everything you have in your fridge, warns you before items expire, scans grocery receipts and product packaging using AI, analyzes ingredient lists for harmful additives, and lets your family share one live fridge together.

---

## Quick Start

1. Open `index.html` in any modern browser - no server required.
2. The dashboard pre-loads with demo data so you can explore immediately.
3. Navigate using the top navigation bar.

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

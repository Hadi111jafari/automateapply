# Amber — Job Search Autopilot

A static UI design for a fictional job-search autopilot product. Warm amber + dark espresso aesthetic, hand-built with vanilla HTML / CSS / JS — no build step.

**Live demo:** https://rem5fe3ios3z.space.minimax.io

## What's inside

```
amber/
├── index.html            # Landing page (hero, features, pricing, FAQ, CTA)
├── dashboard.html        # App: hero stat + live run + high-match jobs + activity log + pipeline + market intel
├── jobs.html             # App: filterable job search with tailored badges + score
├── applications.html     # App: Kanban + Table + Timeline views (switchable)
├── resume.html           # App: resume diff view + cover letter + paper preview + AI chat
├── interview.html        # App: live copilot + predicted questions + company brief + debriefs
├── settings.html         # App: profile, search prefs, auto-apply rules, integrations, billing, privacy
├── css/
│   ├── base.css          # Design tokens (colors, type, shape, shadows) + base resets
│   ├── components.css    # Shared components (sidebar, topbar, cards, chips, tabs, toggles, modals, toasts, kanban, table)
│   ├── landing.css       # Landing-page-specific styles
│   └── app.css           # App-page-specific styles (dash grid, live run, diff, chat, resume paper, etc.)
└── js/
    └── main.js           # Interactivity: toasts, FAQ accordion, tab groups, chip filters, toggles, modal, auto-apply
```

## How to run

No build step. Any static file server works:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .

# Or just open index.html in a browser
```

Then visit `http://localhost:8000/`.

## Design system

| Token | Value | Use |
|---|---|---|
| `--brand-500` | `#d97a1e` | Primary amber (CTAs, active state, brand) |
| `--bg-0` → `--bg-5` | `#0a0807` → `#3f3a34` | Warm-tinted dark surfaces |
| `--text-1` | `#faf3e8` | Primary cream text |
| `--font-display` | Fraunces (italic) | Headlines, big numbers, stat values |
| `--font-sans` | Plus Jakarta Sans | Body, UI text |
| `--font-mono` | JetBrains Mono | Code, numbers, badges |

Active sidebar item gets a 2px amber left rail + soft glow. Cards have a subtle top inner-glow + warm shadow. Buttons have gradient fills with inset highlights for a tactile feel.

## Interactivity baked in

- **Toasts** on Apply / Search / New search launch
- **FAQ accordion** on the landing page
- **Tab groups** (View switcher on Applications, tabs on Settings)
- **Chip filters** (toggleable)
- **Toggles** (settings switches)
- **Modal** (New Search on Jobs page)
- **Auto-apply master toggle** with state change toast

Everything is self-contained in `js/main.js` — no dependencies.

## Notes

- All content is fictional (Sarah Chen, Stripe/Linear/Vercel job titles, etc.)
- Icons are inline SVGs, no icon library
- Google Fonts loaded from CDN (Fraunces, Plus Jakarta Sans, JetBrains Mono)
- No tracking, no analytics
- Mobile-responsive: sidebar collapses, grids stack

## License

Free to use however you want.

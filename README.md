# AI Cost Forecaster

Ein benutzerfreundliches Webtool, um die **operativen Kosten** von AI-Use-Cases in
**Euro** zu kalkulieren, Modelle zu vergleichen und zu bewerten, ob sich ein Business
Case rechnet. Modellpreise werden **live von [OpenRouter](https://openrouter.ai/models)**
geladen; der USD→EUR-Kurs stammt von der **EZB** (via [frankfurter.app](https://www.frankfurter.app)).

## Features

- **Token-basierte Kostenrechnung** – Input-/Output-Token × Volumen → Kosten pro
  Request, Monat und Jahr.
- **Token-Schätzer** – Tokenanzahl aus eingefügtem Beispieltext (BPE-Tokenizer oder
  Heuristik) ableiten.
- **Kuratierte Top-Modelle** je Anbieter (Top/Mittel/Budget: GPT-5.5, Claude
  Opus/Sonnet/Haiku, Gemini 3.1 Pro / 3.5 Flash …) **plus durchsuchbarer
  OpenRouter-Gesamtkatalog**.
- **Live-Preise** mit sichtbarer Quelle und Zeitstempel; **Fallback-Referenzpreise**,
  wenn die API nicht erreichbar ist.
- **EUR-Umrechnung** mit Live-Wechselkurs und manueller Übersteuerung.
- **Business-Case-Check** – Nutzen vs. Kosten, Netto-Ergebnis und ROI je Modell.
- **Szenarien** lokal speichern, laden, duplizieren (localStorage – kein Login).
- **Monats- / Jahresansicht**, Hell-/Dunkelmodus, Erklärungen und Quellenangaben.

## Tech-Stack

React · TypeScript · Vite · Tailwind CSS · Zustand · Recharts · gpt-tokenizer

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server (http://localhost:5173)
npm run build    # Produktionsbuild nach dist/
npm run preview  # Build lokal ansehen
npm run lint     # ESLint
```

## Deployment

Ein GitHub-Actions-Workflow (`.github/workflows/deploy.yml`) baut die App und
veröffentlicht sie bei Pushes auf `main` über GitHub Pages. Der Basis-Pfad ist in
`vite.config.ts` auf `/AICostForecaster/` gesetzt; bei abweichendem Hosting via
`BASE_PATH`-Umgebungsvariable überschreiben (z. B. `BASE_PATH=/ npm run build`).

## Theming

Alle Farben und Schrift sind als Design-Tokens (CSS-Variablen) in `src/index.css`
definiert und in `tailwind.config.ts` verdrahtet. Zum Anpassen an ein eigenes
Branding (z. B. blauensteiner.io) genügt es, diese Variablen zu ändern.

## Hinweis

Alle Werte sind Richtwerte zur Abschätzung der laufenden Nutzungskosten und keine
Echtzeit-Garantie. Maßgeblich ist die offizielle Abrechnung des jeweiligen Anbieters.
Initiale Entwicklungs- und Setup-Kosten sind bewusst nicht berücksichtigt.

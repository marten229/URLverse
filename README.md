# URLverse

URLverse ist eine innovative Astro-Anwendung, die URLs dynamisch in realistische HTML-Seiten mit Hilfe von Google Gemini AI umwandelt. Jede URL wird zu einer einzigartigen, glaubwürdigen Webseite aus einem kreativen Paralleluniversum.

## 🎯 Funktionen

- **Dynamische Seitengenerierung**: Jede URL wird zu einer einzigartigen Webseite
- **KI-gestützt**: Nutzt Google Gemini AI für Content-Generierung
- **Paralleluniversum-Ästhetik**: Surreale aber glaubwürdige Inhalte
- **Parameter-Unterstützung**: URL-Parameter werden in die Generierung einbezogen
- **Moderne Architektur**: Clean Code mit TypeScript und modularer Struktur

## 🏗️ Projektstruktur

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/          # Wiederverwendbare Astro-Komponenten
│   │   └── Layout.astro
│   ├── lib/                 # Bibliotheken und Konfiguration
│   │   ├── config.ts
│   │   └── prompt-generator.ts
│   ├── pages/               # Astro-Seiten
│   │   └── [...slug].astro
│   ├── services/            # Business Logic Services
│   │   ├── gemini.ts
│   │   └── page-generator.ts
│   ├── types/               # TypeScript-Typdefinitionen
│   │   └── index.ts
│   └── utils/               # Utility-Funktionen
│       ├── content-processor.ts
│       └── slug-parser.ts
├── .env.example
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Setup

1. **Repository klonen**
   ```sh
   git clone <repository-url>
   cd URLverse
   ```

2. **Dependencies installieren**
   ```sh
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```sh
   cp .env.example .env
   ```
   
   Fülle deine Google Gemini API-Key in die `.env` Datei ein:
   ```env
   GEMINI_KEY=your_gemini_api_key_here
   ```

4. **Development Server starten**
   ```sh
   npm run dev
   ```

## 🧞 Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installiert Dependencies                         |
| `npm run dev`             | Startet lokalen Dev Server auf `localhost:4321` |
| `npm run build`           | Erstellt Production Build in `./dist/`          |
| `npm run preview`         | Vorschau des Builds vor Deployment              |
| `npm run astro ...`       | Führt Astro CLI Kommandos aus                   |

## 🎨 Verwendung

Besuche einfach eine beliebige URL auf deiner lokalen Instanz:

- `http://localhost:4321/blog/quantenphysik-fuer-katzen`
- `http://localhost:4321/shop/zeitreise-zubehoer/temporal-handschuhe`
- `http://localhost:4321/unternehmen/institut-fuer-digitale-emotionen`

URL-Parameter werden automatisch in die Generierung einbezogen:
- `http://localhost:4321/artikel/ki-revolution?autor=dr-robotnik&jahr=2157`

## 🔧 Architektur

Das Projekt folgt modernen Software-Engineering-Prinzipien:

- **Modulare Struktur**: Code ist in logische Module aufgeteilt
- **TypeScript**: Vollständige Typisierung für bessere Entwicklererfahrung
- **Service-orientiert**: Business Logic in Services ausgelagert
- **Utility-first**: Wiederverwendbare Utility-Funktionen
- **Clean Code**: Lesbar, wartbar und erweiterbar

### Wichtige Module

- **PageGeneratorService**: Hauptlogik für die Seitengenerierung
- **GeminiService**: API-Kommunikation mit Google Gemini
- **Content Processor**: HTML-Verarbeitung und Link-Management
- **Slug Parser**: URL-Parsing und Parameter-Extraktion

## 🌟 Features im Detail

### Intelligente Bildverarbeitung
Erkennt Bildpfade und ersetzt sie automatisch durch passende Placeholder von Picsum.

### Parameter-Weiterleitung
URL-Parameter werden automatisch an alle internen Links weitergegeben.

### Fehlerbehandlung
Robuste Fehlerbehandlung mit benutzerfreundlichen Fehlermeldungen.

### Konfigurierbar
Zentrale Konfiguration über `src/lib/config.ts`.

## 🤝 Beitragen

Beiträge sind willkommen! Bitte:

1. Fork das Repository
2. Erstelle einen Feature Branch
3. Committe deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## 📄 Lizenz

[MIT License](LICENSE)

---

*URLverse - Wo jede URL zu einem Abenteuer wird! 🚀*

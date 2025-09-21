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
│   ├── lib/                 # Business Logic & Konfiguration
│   │   ├── config.ts
│   │   ├── prompt-generator.ts
│   │   └── prompt-flavors.ts
│   ├── pages/               # Astro-Seiten (Routing)
│   │   ├── index.astro
│   │   ├── admin.astro
│   │   └── [...slug].astro
│   ├── scripts/             # Client-side TypeScript
│   │   ├── dom-utils.ts
│   │   ├── homepage.ts
│   │   └── url-input-handler.ts
│   ├── services/            # Backend Services
│   │   ├── gemini.ts
│   │   ├── page-generator.ts
│   │   └── flavor-service.ts
│   ├── styles/              # Modulares CSS-System
│   │   ├── components/      # Komponenten-Styles
│   │   │   ├── button.css
│   │   │   ├── card.css
│   │   │   └── form.css
│   │   ├── pages/           # Seitenspezifische Styles
│   │   │   ├── admin.css
│   │   │   └── homepage.css
│   │   ├── base.css         # Reset & Grundlagen
│   │   ├── main.css         # Haupt-Import
│   │   ├── utilities.css    # Utility-Klassen
│   │   └── variables.css    # Design-Token
│   ├── types/               # TypeScript-Typdefinitionen
│   │   └── index.ts
│   └── utils/               # Utility-Funktionen
│       ├── content-processor.ts
│       └── slug-parser.ts
├── .env.example
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── README.md
└── DEVELOPMENT.md           # Development Guide
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

## 🎨 Flavor System

URLverse unterstützt verschiedene Stil-"Flavors" für die generierten Seiten:

### Verfügbare Flavors

- **🌌 Paralleluniversum** (Standard): Surreale aber glaubwürdige Webseiten mit kreativen Elementen
- **🏢 Realistisch**: Professionelle, seriöse Webseiten wie echte Unternehmen
- **🤖 Cyberpunk**: Futuristische Ästhetik mit Neon-Elementen und Tech-Focus
- **📼 Retro Web**: Nostalgische 90er/2000er Web-Ästhetik
- **⚪ Minimalistisch**: Klare, reduzierte Designs mit Fokus auf Inhalt

### Flavor Management

Besuche `/admin` um zwischen den verschiedenen Stilen zu wechseln. Das Admin-Interface bietet:

- Übersicht aller verfügbaren Flavors
- Live-Vorschau mit Beispielen
- Einfache Auswahl per Klick
- Test-URLs zum Ausprobieren

### Für Entwickler

Das Flavor-System ist vollständig erweiterbar:

```typescript
// Neuen Flavor hinzufügen in src/lib/prompt-flavors.ts
export const PROMPT_FLAVORS = {
  // ... bestehende Flavors
  myNewFlavor: {
    id: 'myNewFlavor',
    name: 'Mein Neuer Stil',
    description: 'Beschreibung des Stils',
    basePrompt: `Dein Custom Prompt hier...`,
    examples: ['Beispiel 1', 'Beispiel 2']
  }
};
```

Dann die Konfiguration erweitern:
```typescript
// In src/lib/config.ts
enabledFlavors: ['parallelverse', 'realistic', 'cyberpunk', 'retro', 'minimalist', 'myNewFlavor']
```

## 🎨 Verwendung

### Einfache Navigation
Besuche die **Startseite** (`http://localhost:4321/`) für:
- URL-Eingabe mit Live-Navigation
- Beispiel-Links für verschiedene Szenarien
- Zugang zum Admin-Interface

### Admin-Interface
Besuche `/admin` für:
- Flavor-Management mit visueller Auswahl
- Live-Beispiele aller verfügbaren Stile
- Test-URLs zum direkten Ausprobieren

### Beispiel-URLs
- `http://localhost:4321/blog/ki-revolution-2024`
- `http://localhost:4321/shop/zeitreise-gadgets/temporal-handschuhe`
- `http://localhost:4321/unternehmen/quantum-solutions`
- `http://localhost:4321/medizin/nano-chirurgie`

URL-Parameter werden automatisch in die Generierung einbezogen:
- `http://localhost:4321/artikel/ki-revolution?autor=dr-robotnik&jahr=2157`

## 💻 Development

### CSS-Architektur
```css
/* Verwende Design-Token */
.my-component {
  padding: var(--spacing-lg);
  background: var(--color-primary);
  border-radius: var(--radius-lg);
}

/* Nutze Utility-Klassen */
<div class="flex items-center justify-center p-xl">
  <button class="btn btn--primary btn--lg">Klick mich</button>
</div>
```

### TypeScript-Module
```typescript
import { URLInputHandler } from '@scripts/url-input-handler';
import { domReady } from '@scripts/dom-utils';

domReady(() => {
  const handler = new URLInputHandler({
    inputSelector: '#urlInput',
    autoFocus: true
  });
});
```

### Neue Komponenten erstellen
1. **CSS**: `src/styles/components/my-component.css`
2. **TypeScript**: `src/scripts/my-component.ts` 
3. **Import**: Füge CSS-Import in `src/styles/main.css` hinzu
4. **Verwenden**: Nutze Klassen in `.astro` Dateien

Detaillierte Entwicklungsrichtlinien findest du in [`DEVELOPMENT.md`](./DEVELOPMENT.md).

## 🔧 Architektur

URLverse folgt modernen Software-Engineering-Prinzipien:

### **Frontend-Architektur**
- **Modulares CSS**: Komponenten-basierte Styles mit Design-Token
- **TypeScript-Module**: Typsichere Client-side Logik
- **Responsive Design**: Mobile-First mit CSS Custom Properties
- **Performance-optimiert**: Code-Splitting und Asset-Optimierung

### **Backend-Architektur**
- **Service-orientiert**: Business Logic in Services ausgelagert
- **Type-safe**: Vollständige TypeScript-Typisierung
- **Modularity**: Kleine, wiederverwendbare Module
- **Clean Code**: Lesbar, wartbar und erweiterbar

### **Wichtige Module**

#### **Services (`src/services/`)**
- **PageGeneratorService**: Hauptlogik für die Seitengenerierung
- **GeminiService**: API-Kommunikation mit Google Gemini
- **FlavorService**: Verwaltung der Prompt-Stile

#### **Utilities (`src/utils/`)**
- **Content Processor**: HTML-Verarbeitung und Link-Management
- **Slug Parser**: URL-Parsing und Parameter-Extraktion

#### **Styles (`src/styles/`)**
- **Design System**: CSS Custom Properties für konsistente Gestaltung
- **Component Library**: Wiederverwendbare UI-Komponenten
- **Utility Classes**: Flexbox, Grid, Spacing, Typography

#### **Scripts (`src/scripts/`)**
- **DOM Utilities**: Event-Management und DOM-Manipulation
- **URL Input Handler**: Wiederverwendbare Input-Funktionalität
- **Page-specific Logic**: Saubere Trennung der Client-side Logik

## 🌟 Features im Detail

### **🎨 Modernes Design System**
- **CSS Custom Properties**: Konsistente Design-Token für Farben, Abstände, Typographie
- **Komponenten-Bibliothek**: Wiederverwendbare UI-Komponenten (Button, Card, Form)
- **Responsive Design**: Mobile-First Ansatz mit flexiblen Layouts
- **Utility-Classes**: Schnelle Styling-Optionen für häufige Patterns

### **🚀 Performance & Optimierung**
- **Code-Splitting**: Automatische Aufteilung für optimale Ladezeiten
- **Asset-Optimierung**: Kategorisierte und gehashte Dateinamen
- **Tree-Shaking**: Entfernung ungenutzten Codes
- **TypeScript**: Vollständige Typisierung für bessere Entwicklererfahrung

### **🧩 Modulare Architektur**
- **Service Layer**: Saubere Trennung von Business Logic
- **Utility Functions**: Wiederverwendbare Hilfsfunktionen
- **Type Safety**: Vollständige TypeScript-Unterstützung
- **Clean Code**: Lesbare und wartbare Codebase

### **🔧 Developer Experience**
- **Hot Reload**: Schnelle Entwicklungszyklen
- **Path Aliases**: Saubere Import-Pfade (`@styles`, `@scripts`, `@lib`)
- **ESLint & TypeScript**: Code-Qualität und Konsistenz
- **Dokumentation**: Umfassende Guides und Code-Kommentare

### **🎭 Intelligente Content-Generierung**
- **Bildverarbeitung**: Automatischer Ersatz durch Placeholder von Picsum
- **Parameter-Weiterleitung**: URL-Parameter werden an alle internen Links weitergegeben
- **Fehlerbehandlung**: Robuste Fehlerbehandlung mit flavor-spezifischen Fehlerseiten
- **Content Processing**: Intelligente HTML-Bereinigung und Link-Management

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

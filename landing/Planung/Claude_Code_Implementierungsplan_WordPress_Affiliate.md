# Claude Code Implementierungsplan
## Affiliate WordPress Site mit Local WP & Blocksy PRO

**Ziel:** Vollständig automatisierte Einrichtung einer hochperformanten Affiliate-Site

---

## Übersicht: Finaler Tech-Stack

| Komponente | Auswahl |
|------------|---------|
| Local Environment | Local WP by Flywheel |
| Theme | Blocksy PRO |
| Caching | WP Rocket |
| Bildoptimierung | ShortPixel |
| Affiliate-Links | Lasso / ThirstyAffiliates Pro |
| Analytics | Matomo / Independent Analytics |
| SEO | Yoast SEO |
| Security + AI | Limit Login Attempts + AI Engine |

---

## Phase 1: Local WP Setup

### Schritt 1.1: Neue Site in Local WP erstellen

1. Local WP öffnen → "+ Create a new site" klicken
2. Site-Name eingeben (z.B. "affiliate-project")
3. Environment wählen: "Custom" auswählen
4. PHP Version: 8.2 (oder höher)
5. Web Server: nginx (performanter als Apache)
6. MySQL: 8.0
7. Site erstellen und starten

### Schritt 1.2: Site-Shell öffnen

In Local WP: Rechtsklick auf Site → "Open Site Shell"

Dies öffnet ein Terminal mit vorkonfiguriertem WP-CLI Zugang.

> **Wichtig:** Alle folgenden Claude Code Befehle werden in diesem Shell-Fenster ausgeführt.

---

## Phase 2: Basis-Konfiguration via Claude Code

### Schritt 2.1: WordPress Grundeinstellungen

```bash
# Permalink-Struktur auf SEO-freundlich setzen
wp rewrite structure '/%postname%/' --hard

# Zeitzone auf Deutschland setzen
wp option update timezone_string 'Europe/Berlin'

# Datumsformat anpassen
wp option update date_format 'd.m.Y'
wp option update time_format 'H:i'

# Kommentare standardmäßig deaktivieren
wp option update default_comment_status 'closed'
wp option update default_ping_status 'closed'

# Uploads-Limit erhöhen (in MB)
wp config set WP_MEMORY_LIMIT '256M'
wp config set WP_MAX_MEMORY_LIMIT '512M'

# Debug-Modus für Entwicklung aktivieren
wp config set WP_DEBUG true --raw
wp config set WP_DEBUG_LOG true --raw
wp config set WP_DEBUG_DISPLAY false --raw
```

### Schritt 2.2: Standard-Content entfernen

```bash
# Standard-Plugins löschen
wp plugin delete akismet hello

# Standard-Themes löschen (außer aktives)
wp theme delete twentytwentythree twentytwentyfour

# Sample-Content löschen
wp post delete 1 --force  # Hello World Post
wp post delete 2 --force  # Sample Page
wp comment delete 1 --force
```

---

## Phase 3: Blocksy PRO Theme Installation

### Schritt 3.1: Blocksy Theme installieren

```bash
# Blocksy Free Theme aus Repository installieren
wp theme install blocksy --activate

# Blocksy Companion Plugin installieren
wp plugin install blocksy-companion --activate
```

### Schritt 3.2: Blocksy PRO aktivieren

Für Blocksy PRO manuell:

1. Blocksy PRO ZIP-Datei von deinem Account herunterladen
2. In Local WP: Site-Ordner öffnen → `app/public/wp-content/plugins/`
3. ZIP entpacken oder über WP-Admin hochladen
4. Lizenzschlüssel in Blocksy → Dashboard eingeben

### Schritt 3.3: Child-Theme erstellen mit Performance-Optimierungen

```bash
# Child-Theme Verzeichnis erstellen
mkdir -p wp-content/themes/blocksy-child

# style.css erstellen
cat > wp-content/themes/blocksy-child/style.css << 'EOF'
/*
Theme Name: Blocksy Child
Template: blocksy
Version: 1.0
*/
EOF

# functions.php erstellen
cat > wp-content/themes/blocksy-child/functions.php << 'EOF'
<?php
// Enqueue parent styles
add_action('wp_enqueue_scripts', function() {
    wp_enqueue_style('parent-style', 
        get_template_directory_uri() . '/style.css');
});

// Performance: Disable Emojis
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');

// Performance: Remove jQuery Migrate
add_action('wp_default_scripts', function($scripts) {
    if (!is_admin() && isset($scripts->registered['jquery'])) {
        $script = $scripts->registered['jquery'];
        if ($script->deps) {
            $script->deps = array_diff($script->deps, ['jquery-migrate']);
        }
    }
});

// Remove WordPress Version
remove_action('wp_head', 'wp_generator');

// Disable XML-RPC
add_filter('xmlrpc_enabled', '__return_false');

// Disable REST API für nicht eingeloggte User (optional)
add_filter('rest_authentication_errors', function($result) {
    if (!is_user_logged_in()) {
        return new WP_Error('rest_disabled', 'REST API disabled', 
            ['status' => 401]);
    }
    return $result;
});
EOF

# Child-Theme aktivieren
wp theme activate blocksy-child
```

---

## Phase 4: Plugin-Installation

### Schritt 4.1: Kostenlose Plugins aus Repository

```bash
# SEO Plugin
wp plugin install wordpress-seo --activate

# Security
wp plugin install limit-login-attempts-reloaded --activate

# Bildoptimierung (Free Version)
wp plugin install shortpixel-image-optimiser --activate

# AI Engine
wp plugin install ai-engine --activate

# Optional: Independent Analytics (DSGVO-konform)
wp plugin install independent-analytics --activate

# Matomo für WordPress
wp plugin install matomo --activate
```

### Schritt 4.2: Premium Plugins installieren

Premium Plugins müssen manuell hochgeladen werden:

| Plugin | Quelle |
|--------|--------|
| **WP Rocket** | wp-rocket.me → ZIP herunterladen → Plugins → Installieren → Hochladen |
| **Lasso** | getlasso.co → ZIP herunterladen → Plugins → Installieren → Hochladen |
| **ThirstyAffiliates Pro** | Alternative zu Lasso: thirstyaffiliates.com |

### Schritt 4.3: Matomo Analytics einrichten (DSGVO-konform)

```bash
# Nach Aktivierung im WP-Admin:
# Matomo → Einstellungen → Tracking aktivieren
# Matomo → Datenschutz → Cookie-freies Tracking aktivieren
```

---

## Phase 5: Plugin-Konfiguration

### Schritt 5.1: WP Rocket Optimale Einstellungen

| Bereich | Einstellung |
|---------|-------------|
| Cache | Mobile Cache aktivieren, Separate Cache für mobile Geräte |
| Datei-Optimierung | CSS minifizieren, JS minifizieren, JS verzögert laden |
| Medien | LazyLoad für Bilder, iframes, Videos aktivieren |
| Preload | Cache-Preloading aktivieren, Sitemap-Preloading |
| Erweiterte Regeln | Nie cachen: /wp-admin/, /cart/, /checkout/ |
| Datenbank | Wöchentliche automatische Bereinigung planen |

### Schritt 5.2: Yoast SEO Basis-Konfiguration

```bash
# Yoast über WP-CLI konfigurieren
wp option update wpseo '{"keyword_analysis_active":1,"content_analysis_active":1,"enable_xml_sitemap":1}'

# Breadcrumbs aktivieren (manuell im Admin)
# Yoast SEO → Einstellungen → Erweitert → Breadcrumbs → Aktivieren
```

### Schritt 5.3: ShortPixel API-Key einrichten

1. shortpixel.com → Kostenlosen Account erstellen
2. API-Key kopieren
3. WP-Admin → Einstellungen → ShortPixel → API-Key eintragen
4. Compression: "Lossy" für beste Dateigröße
5. WebP-Konvertierung aktivieren

### Schritt 5.4: Lasso Affiliate Dashboard einrichten

- Dashboard → Lasso → Links → Neuen Link hinzufügen
- Kategorien erstellen (z.B. "Hosting", "Tools", "Software")
- Link-Gruppen für verschiedene Kampagnen anlegen
- Display-Boxen gestalten (Produktboxen, Vergleichstabellen)
- Amazon Product Advertising API verbinden (falls Amazon-Affiliate)

---

## Phase 6: Affiliate-Infrastruktur

### Schritt 6.1: Pflichtseiten erstellen

```bash
# Impressum erstellen
wp post create --post_type=page --post_title='Impressum' \
  --post_status=publish --post_content='[Impressum-Inhalt hier einfügen]'

# Datenschutzerklärung erstellen
wp post create --post_type=page --post_title='Datenschutzerklärung' \
  --post_status=publish --post_content='[DSGVO-konformer Text]'

# Affiliate Disclosure erstellen
wp post create --post_type=page --post_title='Affiliate Offenlegung' \
  --post_status=publish --post_content='Diese Seite enthält Affiliate-Links. Bei einem Kauf über diese Links erhalten wir eine kleine Provision – für dich entstehen keine Mehrkosten.'

# Cookie-Hinweis Seite
wp post create --post_type=page --post_title='Cookie-Richtlinie' \
  --post_status=publish --post_content='[Cookie-Richtlinie hier einfügen]'
```

### Schritt 6.2: Automatische Affiliate-Disclosure einfügen

```bash
# In functions.php des Child-Themes hinzufügen:
cat >> wp-content/themes/blocksy-child/functions.php << 'EOF'

// Automatische Affiliate-Disclosure am Anfang jedes Posts
add_filter('the_content', function($content) {
    if (is_single() && in_the_loop() && is_main_query()) {
        $disclosure = '<div class="affiliate-disclosure" style="
            background: #f8f9fa; 
            border-left: 4px solid #007bff; 
            padding: 15px; 
            margin-bottom: 20px;
            font-size: 14px;">
            <strong>Hinweis:</strong> Diese Seite enthält Affiliate-Links. 
            Bei einem Kauf über diese Links erhalten wir eine kleine Provision – 
            für dich entstehen keine Mehrkosten.
        </div>';
        return $disclosure . $content;
    }
    return $content;
});
EOF
```

### Schritt 6.3: Schema Markup für Produkte

```bash
# Schema.org Markup für besseres Google-Ranking
cat >> wp-content/themes/blocksy-child/functions.php << 'EOF'

// Custom Shortcode für Produkt-Schema
add_shortcode('product_schema', function($atts) {
    $atts = shortcode_atts([
        'name' => '',
        'description' => '',
        'price' => '',
        'currency' => 'EUR',
        'rating' => '',
        'image' => ''
    ], $atts);
    
    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'Product',
        'name' => $atts['name'],
        'description' => $atts['description'],
        'offers' => [
            '@type' => 'Offer',
            'price' => $atts['price'],
            'priceCurrency' => $atts['currency']
        ]
    ];
    
    if ($atts['rating']) {
        $schema['aggregateRating'] = [
            '@type' => 'AggregateRating',
            'ratingValue' => $atts['rating'],
            'bestRating' => '5'
        ];
    }
    
    return '<script type="application/ld+json">' . 
           json_encode($schema) . '</script>';
});
EOF
```

**Verwendung des Shortcodes:**
```
[product_schema name="Produktname" description="Beschreibung" price="99.99" rating="4.5"]
```

---

## Phase 7: Performance-Finalisierung

### Schritt 7.1: Datenbank optimieren

```bash
# Datenbank-Tabellen optimieren
wp db optimize

# Transients bereinigen
wp transient delete --all

# Post Revisions begrenzen (in wp-config.php)
wp config set WP_POST_REVISIONS 5 --raw

# Autosave-Intervall erhöhen (5 Minuten)
wp config set AUTOSAVE_INTERVAL 300 --raw
```

### Schritt 7.2: Finale Performance-Checks

1. GTmetrix-Test durchführen (Ziel: Grade A)
2. Google PageSpeed Insights prüfen (Ziel: >90)
3. Mobile-Ansicht in Chrome DevTools testen
4. Alle Affiliate-Links auf Funktionalität prüfen
5. DSGVO-Check: Cookie-Banner, Impressum, Datenschutz

---

## Phase 8: Deployment & Backup

### Schritt 8.1: Lokales Backup erstellen

```bash
# Vollständiges Backup der Datenbank
wp db export backup-$(date +%Y%m%d).sql

# Oder mit Local WP:
# Rechtsklick auf Site → "Export" → ZIP-Datei speichern
```

### Schritt 8.2: Live-Deployment vorbereiten

1. Hosting-Account einrichten (z.B. bei deinem bevorzugten Hoster)
2. SSL-Zertifikat aktivieren
3. Local WP → "Push to Flywheel" oder manuell exportieren
4. DNS-Einstellungen konfigurieren
5. Nach Deployment: Alle URLs auf HTTPS prüfen

```bash
# Nach Migration: URLs ersetzen
wp search-replace 'http://affiliate-project.local' 'https://deine-domain.de' --all-tables
```

---

## Komplette Checkliste

### Local WP Setup
- [ ] Site erstellt mit PHP 8.2+, nginx, MySQL 8
- [ ] Site Shell zugänglich

### WordPress Basis
- [ ] Permalinks auf /%postname%/
- [ ] Zeitzone auf Europe/Berlin
- [ ] Standard-Content gelöscht
- [ ] Memory Limits erhöht

### Theme
- [ ] Blocksy installiert
- [ ] Blocksy PRO aktiviert
- [ ] Child-Theme erstellt
- [ ] Performance-Optimierungen in functions.php

### Plugins
- [ ] WP Rocket installiert & konfiguriert
- [ ] ShortPixel mit API-Key
- [ ] Yoast SEO eingerichtet
- [ ] Lasso/ThirstyAffiliates aktiv
- [ ] Matomo/Analytics läuft
- [ ] Limit Login Attempts aktiv
- [ ] AI Engine installiert

### Affiliate-Infrastruktur
- [ ] Impressum erstellt
- [ ] Datenschutzerklärung erstellt
- [ ] Affiliate-Disclosure automatisch
- [ ] Schema Markup implementiert

### Performance
- [ ] Datenbank optimiert
- [ ] PageSpeed >90
- [ ] Mobile-optimiert
- [ ] Backup erstellt

---

## Quick Reference: Wichtige WP-CLI Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `wp plugin list` | Alle installierten Plugins anzeigen |
| `wp plugin update --all` | Alle Plugins aktualisieren |
| `wp theme list` | Alle Themes anzeigen |
| `wp cache flush` | WordPress Cache leeren |
| `wp transient delete --all` | Alle Transients löschen |
| `wp db optimize` | Datenbank optimieren |
| `wp db export backup.sql` | Datenbank exportieren |
| `wp search-replace "old" "new"` | URLs ersetzen (z.B. nach Migration) |
| `wp user list` | Alle Benutzer anzeigen |
| `wp option get siteurl` | Site-URL anzeigen |
| `wp post list --post_type=page` | Alle Seiten auflisten |
| `wp plugin status` | Plugin-Status prüfen |

---

## Hinweise für Claude Code / Cowork

### Automatische Ausführung

Dieses Dokument kann von Claude Code oder Cowork verwendet werden, um die Installation automatisch durchzuführen. 

**Voraussetzungen:**
1. Local WP muss installiert und gestartet sein
2. Eine neue Site muss in Local WP angelegt sein
3. Die Site Shell muss geöffnet sein
4. Das Arbeitsverzeichnis muss `app/public/` der WordPress-Installation sein

**Ausführungsreihenfolge:**
1. Phase 2 komplett ausführen (Basis-Konfiguration)
2. Phase 3 ausführen (Theme)
3. Phase 4.1 ausführen (kostenlose Plugins)
4. Manuell: Premium Plugins hochladen (Phase 4.2)
5. Phase 5 nach Plugin-Aktivierung
6. Phase 6 komplett ausführen (Affiliate-Infrastruktur)
7. Phase 7 ausführen (Performance)
8. Phase 8 für Backup

**Wichtig:** Premium Plugins (WP Rocket, Lasso, Blocksy PRO) können nicht automatisch installiert werden und erfordern manuelle Uploads mit gültigen Lizenzen.

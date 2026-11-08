# DevForge Tools – High-Performance Online Developer Utilities

DevForge Tools is an open-source, production-grade suite of developer tools running 100% client-side in the browser. It features pure client-side JSON formatting, HTML minification, CSS beautification, UTF-8 safe Base64 encoding, URL percent-encoding, and RFC 9562 UUIDv7 generation.

## 🌟 Key Highlights & Privacy Architecture

- **100% Client-Side Processing:** Payloads, tokens, and code snippets are processed exclusively in browser memory using standard Web APIs. Zero network transmission, zero logging, zero telemetry.
- **RFC & Web Standards Compliance:** Adheres to official IETF and W3C specifications:
  - **RFC 8259 / ECMA-404:** JSON Data Interchange Format
  - **RFC 4648:** Base64 and base64url Radix-64 Encodings
  - **RFC 3986:** Uniform Resource Identifier (URI) Generic Syntax
  - **RFC 9562 & RFC 4122:** UUID Versions 4 (Random) and 7 (Time-Ordered)
- **Zero Heavy Dependencies:** Written in clean, vanilla JavaScript and modern CSS without external runtime bloat.
- **Automated In-Browser Test Suite:** Includes 48 automated test cases covering edge cases (Unicode emojis, nested JSON, media queries, invalid Base64, and UUID format bit checks) accessible at `/tests/tool-tests.html`.
- **Google AdSense Ready:** Pre-configured with an `ads.txt` file, commented-out fixed-height ad placeholders, GDPR/CCPA cookie consent governance, and required legal trust pages.
- **Progressive Web App (PWA):** Equipped with a service worker (`sw.js`) and web app manifest for complete offline capability.

---

## 📁 Repository Directory Structure

```text
├── .nojekyll                   # Disables Jekyll processing on GitHub Pages
├── CNAME                       # Custom domain pointer (e.g. devforge.tools)
├── ads.txt                     # Google AdSense publisher verification file
├── robots.txt                  # Search engine crawl directives & sitemap pointer
├── sitemap.xml                 # XML sitemap for SEO discovery
├── manifest.json               # Web App Manifest for PWA installation
├── sw.js                       # Service worker for offline asset caching
├── index.html                  # Homepage (Hero, tool grid, FAQ, latest guides)
├── about.html                  # About page, mission, editorial standards, author bios
├── contact.html                # Contact page (Formspree form & direct email)
├── privacy-policy.html         # Privacy Policy (100% local guarantee, AdSense, GDPR/CCPA)
├── terms-of-service.html       # Terms of Service & permitted use
├── disclaimer.html             # Accuracy & cryptography technical disclaimer
├── cookie-policy.html          # Cookie & local storage policy with consent center
├── 404.html                    # User-friendly 404 error page with tools directory
│
├── assets/
│   ├── css/
│   │   └── styles.css          # Core responsive stylesheet (light/dark theme variables)
│   ├── js/
│   │   ├── core.js             # Shared UI framework (themes, toasts, cookies, modals)
│   │   └── tools-engine.js     # Pure, testable formatting and encoding engines
│   └── img/
│       └── favicon.svg         # SVG vector favicon
│
├── tools/
│   ├── json-formatter.html     # JSON Formatter, Minifier & Collapsible Tree Inspector
│   ├── html-minifier.html      # HTML Minifier with safe <pre>/<script> preservation
│   ├── css-beautifier.html     # CSS Beautifier & Minifier with nested query support
│   ├── base64-encoder.html     # UTF-8 Safe Base64 Encoder/Decoder & Data URI tool
│   ├── url-encoder.html        # URL Encoder/Decoder & Interactive Query String Table
│   └── uuid-generator.html     # Bulk UUIDv4 and RFC 9562 UUIDv7 Generator
│
├── blog/
│   ├── index.html              # Engineering blog index
│   ├── what-is-json-and-how-to-fix-common-errors.html
│   ├── base64-encoding-explained-what-it-is-and-when-to-use-it.html
│   ├── encodeuri-vs-encodeuricomponent-the-difference-that-breaks-urls.html
│   ├── why-minify-html-and-css-real-impact-on-page-speed.html
│   ├── uuid-v4-vs-v7-which-should-you-use-for-database-keys.html
│   ├── how-to-read-and-debug-api-responses-faster.html
│   ├── is-base64-encryption-common-security-misconceptions.html
│   └── css-formatting-best-practices-for-maintainable-stylesheets.html
│
└── tests/
    └── tool-tests.html         # In-browser test runner (48 automated edge-case assertions)
```

---

## 🔧 Placeholders to Customize Before Production

Before launching and applying for Google AdSense, update these specific values across the project:

| Placeholder | File Locations | Action Required |
| :--- | :--- | :--- |
| `pub-XXXXXXXXXXXXXXXX` | `ads.txt` and `<head>` comments across all HTML pages | Replace with your approved Google AdSense publisher ID (e.g. `pub-1234567890123456`). |
| `devforge.tools` | `CNAME`, `robots.txt`, `sitemap.xml`, and `<link rel="canonical">` | Replace with your custom production domain (e.g. `yourdomain.com`). |
| `contact@devforge.tools` | `contact.html`, `privacy-policy.html`, `about.html`, footer | Replace with your verified contact email address. |
| `YOUR_FORMSPREE_ID` | `contact.html` (Form action) | Replace with your Formspree endpoint ID (e.g. `https://formspree.io/f/mqkvnxyz`) to receive messages. |
| Author Bios | `about.html`, blog posts | Customize author names and professional bios to reflect your editorial team. |

---

## 🧪 How to Run the Automated Test Suite

DevForge Tools includes an automated client-side test suite executing 48 verification cases (8 per tool) validating edge cases:
- Unicode emojis and multi-byte CJK scripts in Base64
- Literal `<pre>`, `<textarea>`, `<script>`, and `<style>` preservation during HTML minification
- Nested `@media` and `url("data:...")` preservation in CSS formatting
- Line and column coordinate precision on invalid JSON syntax
- RFC 4122 v4 and RFC 9562 v7 bitwise mask verification and timestamp monotonicity

### Running the tests:
1. Open `/tests/tool-tests.html` in any web browser.
2. The suite executes automatically upon load.
3. Review the live metrics (Total: 48, Passed: 48, Failed: 0).

---

## 🚀 How to Deploy on GitHub Pages

Because DevForge Tools is built with zero runtime dependencies and 100% static files, deployment to GitHub Pages requires no build step:

### 1. Initialize Git and Commit
```bash
git init
git add .
git commit -m "Initial commit: developer tools website"
git branch -M main
git remote add origin https://github.com/[YOUR-USERNAME]/[YOUR-REPO].git
git push -u origin main
```

### 2. Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** → **Pages** (under Code and automation).
3. Under **Build and deployment** > **Source**, select **Deploy from a branch**.
4. Set branch to `main` and folder to `/ (root)`.
5. Click **Save**.

### 3. Configure Custom Domain & DNS
1. In GitHub Pages settings under **Custom domain**, enter your domain name (e.g. `devforge.tools`).
2. Check **Enforce HTTPS**.
3. In your DNS provider (Cloudflare, Namecheap, Google Domains), add the following DNS records:
   - **Apex domain (`@`):** Four `A` records pointing to GitHub Pages IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - **Subdomain (`www`):** `CNAME` record pointing to `[YOUR-USERNAME].github.io`.

---

## 📋 Pre-AdSense Application Checklist

Follow this checklist prior to submitting your site to Google AdSense:
- [x] **Top-Level Custom Domain:** Deployed to a root domain with active SSL (`https://`).
- [x] **Original Content Volume:** 8 in-depth technical blog posts (900+ words each) and 6 comprehensive tool guides (700+ words each) with zero thin pages.
- [x] **Trust & Legal Pages:** About Us, Contact, Privacy Policy (with DoubleClick disclosures), Terms of Service, Disclaimer, and Cookie Policy all linked in header and footer.
- [x] **AdSense ads.txt:** Verified `ads.txt` file at the root containing your publisher ID.
- [x] **Cookie Consent Banner:** Functional GDPR/CCPA cookie consent manager that prevents tracking scripts until consent is affirmatively granted.
- [x] **No Broken Affordances:** Zero broken links, zero placeholder buttons, and 100% passing automated test suite.
- [x] **Google Search Console:** Submit `https://yourdomain.com/sitemap.xml` in Google Search Console to index all pages prior to AdSense application.

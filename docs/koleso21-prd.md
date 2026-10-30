# PRD — сайт «КОЛЕСО 21» (шиномонтаж и автосервис, Новоозёрск)

**Version:** 1.0 · **Stage:** planning only (no page code yet)

---

## 1. Goals and audience

| | |
|---|---|
| **Business goal** | Get bookings for tire fitting, seasonal tire storage, and car repair. Calls and online requests are the main conversions. |
| **Audience** | Car owners in Novoozersk and nearby areas. Most use phones (375px is the main width) and want a quick answer to "how much, when, and where". |
| **Key actions (CTAs)** | 1) "Записаться" (book) → form on `contacts.html#booking` · 2) "Позвонить" → `tel:` · 3) Open the route on a map · 4) Write in a messenger. |
| **Success metrics** | Form submits (reaching `thanks.html`), clicks on `tel:`, and clicks on map or messenger links. |

---

## 2. Technical constraints and architecture

- **Stack:** HTML5 + CSS3 + vanilla JS (ES2017+). No frameworks, bundlers, npm, or CDN libraries. The only external resource is Google Fonts.
- **Runs from `file://`** when you double-click a file. This means:
  - No `fetch()` or modules to load the shared header and footer, because browsers block them on `file://`. **Decision:** the header and footer markup is **copied into every HTML file**. This also helps SEO and works without JS. The current menu item is set statically in each file with `aria-current="page"` and the `.is-active` class.
  - All paths are relative (`css/style.css`, `img/…`). No paths start with `/`.
  - Scripts use plain `<script src="js/main.js" defer>`, not `type="module"`.
  - `404.html` only works on a host (GitHub Pages, Netlify, nginx). Locally, it opens as a normal page.
- **Browsers:** the latest 2 versions of Chrome, Safari (iOS), Firefox, Edge, and Yandex Browser.

### File structure
```
/
├─ index.html  tires.html  storage.html  services.html
├─ winter-tips.html  contacts.html  thanks.html  privacy.html  404.html
├─ favicon.ico  favicon.svg  apple-touch-icon.png (180×180)
├─ css/
│   └─ style.css          — one file: tokens, reset, layout, components, pages
├─ js/
│   └─ main.js            — menu, accordion, calculator, form, tabs
└─ img/
    ├─ og/                — og-*.jpg 1200×630 (one per page or a shared one)
    ├─ hero/  services/  storage/  tips/  team/
    └─ icons/             — inline SVG icons (inside the markup) or .svg files
```

### Design tokens (CSS custom properties)
| Token | Value | Use |
|---|---|---|
| `--c-red` | `#C8361D` | Main CTA, accents, active menu item |
| `--c-graphite` | `#1F2226` | Text, header and footer background, dark sections |
| `--c-gray` | `#EEF0F2` | Alternating section backgrounds, cards |
| `--c-yellow` | `#F2B705` | Secondary accent: badges ("Акция", "Сезон"), focus ring, highlighting on a dark background |
| `--c-white` | `#FFFFFF` | Page background, text on red and graphite |
| `--f-head` | `Oswald, 500/600/700` | H1–H4, prices, numbers, buttons (uppercase) |
| `--f-body` | `Inter, 400/500/600` | Body text, forms, tables |
| Spacing | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px | |
| Radius | 6px (buttons, fields), 12px (cards) | |
| Container | max-width 1200px, padding 16px (mobile) / 24px / 32px | |

**Contrast:** white on `#C8361D` ≈ 5.3:1 (AA ✓). Graphite on yellow ✓. **Do not use** white text on yellow or yellow text on white.

### Breakpoints (mobile-first)
- base: **375px** (min-width 320 must not break)
- `@media (min-width: 768px)` — tablet: 2-column grids, tables shown in full
- `@media (min-width: 1280px)` — desktop: 3–4 columns, full horizontal menu
- Guard against horizontal scroll: `img{max-width:100%}`, wide tables in `.table-wrap{overflow-x:auto}`, long words break with `overflow-wrap:anywhere`, and no `100vw` widths.

### Fonts
`<link rel="preconnect">` to `fonts.googleapis.com` and `fonts.gstatic.com` (crossorigin) plus one `css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap&subset=cyrillic`. Fallbacks: `Oswald, "Arial Narrow", sans-serif`; `Inter, system-ui, Arial, sans-serif`.

---

## 3. Shared components (used on all pages)

| # | Component | Contents and behavior |
|---|---|---|
| C1 | **Topbar** (≥768px) | Address · opening hours "Ежедневно 8:00–20:00" · phone link. On mobile, these move into the burger menu. |
| C2 | **Header** (sticky) | Text and SVG logo "КОЛЕСО 21" → `index.html`. Menu: Главная · Шиномонтаж · Хранение шин · Автосервис · Когда менять шины · Контакты. "Записаться" button (red). Phone icon button (`tel:`, 44×44). |
| C3 | **Mobile menu** (<1280px) | Burger `<button aria-expanded aria-controls>` 44×44 opens a full-screen panel. The panel closes on Esc, on a link click, and on an outside click. Page scroll is locked while it is open. |
| C4 | **Breadcrumbs** | On all pages except the home page. Uses `nav[aria-label="Хлебные крошки"]` and `ol`. |
| C5 | **Page hero (short)** | H1, a 1–2 sentence lead, 1–2 CTAs, and a background image or one beside the text. |
| C6 | **CTA banner** | A red or graphite band: "Запишитесь без очереди" plus the "Записаться" and "Позвонить" buttons. Repeats at the end of service pages. |
| C7 | **Footer** | 4 columns, stacked into 1 on mobile: logo and short description · navigation · services · contacts (address, phone, email, hours, messengers). Bottom row: © 2026 КОЛЕСО 21 · link to "Политика конфиденциальности". |
| C8 | **Floating call button** (mobile only) | A fixed round 56×56 `tel:` button in the bottom right. It is hidden on `contacts.html`, `thanks.html`, and `404.html`. |
| C9 | **Cookie notice** (optional) | A small bar with an "Понятно" button. Only add it if analytics is connected. The choice is saved in `localStorage`, the only acceptable use here. |

### UI kit (atoms)
- **Buttons:** `.btn--primary` (red), `.btn--secondary` (graphite outline), `.btn--ghost` (on dark backgrounds). Minimum **44×44 px**, padding 12×24, Oswald uppercase, with visible `:focus-visible` (yellow outline) and `:hover`/`:active` states.
- **Cards:** service card (icon, title, text, "от N ₽", link) · feature card · review card · tip card.
- **Price table** with a row of headers, horizontal scroll on mobile, and `<caption>` for accessibility.
- **Accordion** (FAQ): built on `<details>/<summary>`, so it works without JS.
- **Tabs** (R13–R22 tire sizes): `role="tablist"`, with keyboard navigation using arrow keys.
- **Badges:** "Акция", "Сезон", "Новое" in yellow.
- **Form fields:** label above the field, error text below it (`aria-describedby`), height ≥ 44px, font ≥ 16px (prevents zoom on iOS).
- **Icons:** inline SVG (`aria-hidden="true"` next to text).

---

## 4. Page-by-page plan

### 4.1 `index.html` — Главная
**H1:** «Шиномонтаж и автосервис в Новоозёрске»
1. **Hero:** large photo of the workshop and lift. H1, subheading "Сезонная переобувка за 30 минут, хранение шин и ремонт авто", CTAs "Записаться" and "Позвонить", and 3 facts in a row (e.g. "8 лет работы", "6 постов", "Гарантия 6 мес.").
2. **Services:** 3 large cards linking to `tires.html`, `storage.html`, `services.html`, plus a fourth "Когда менять шины" card linking to `winter-tips.html`.
3. **Why choose us:** 4–6 benefits with icons (no waiting in line when booked, modern equipment, fixed prices, waiting room with coffee, cashless payment, warranty).
4. **Popular prices:** a mini-table of 5–6 items with a link to "Все цены" (`tires.html#prices`).
5. **How booking works:** 3 steps (request → confirmation call → arrive at the agreed time).
6. **Season banner:** yellow badge, "Сезон переобувки: октябрь–ноябрь. Записывайтесь заранее", and a link to `winter-tips.html`.
7. **Reviews:** 3 review cards (name, car, text, 5 stars as SVG). On mobile they scroll horizontally with scroll-snap.
8. **Map and contacts:** short contacts block, plus a static map image linking to Yandex Maps. No iframe API is needed.
9. **CTA banner** (C6).

### 4.2 `tires.html` — Шиномонтаж
**H1:** «Шиномонтаж легковых автомобилей и кроссоверов»
1. Short hero with a CTA.
2. **What's included:** list (removal and fitting, tire mounting and demounting, balancing, pressure check, valve replacement).
3. **Price list `#prices`:** tabs by car type (Легковой / Кроссовер / Внедорожник), each with a table by size R13–R22 and columns "Комплекс за 4 колеса", "Балансировка", "Снятие/установка".
4. **Cost calculator (JS):** select car type, radius, and options (balancing, run-flat, low-profile, valves), see the result "от N ₽", then click "Записаться с этим расчётом". The selection is passed to the form through URL parameters (`contacts.html?service=tires&radius=R17…`).
5. **Extra services:** puncture repair, cuts, wheel straightening, nitrogen, sealant.
6. **FAQ** (accordion, 5–6 questions: how long it takes, whether booking is needed, run-flat, etc.).
7. CTA banner.

### 4.3 `storage.html` — Хранение шин
**H1:** «Сезонное хранение шин и дисков»
1. Hero with a photo of the shelving and a CTA.
2. **Storage conditions:** a heated warehouse, racks, protective bags, labeling, and insurance.
3. **Prices:** 3 cards: tires without rims / wheels on rims / large SUV wheels, priced "за сезон (6 мес.)". The middle card is highlighted.
4. **How it works:** 4 steps (drop-off → washing and inspection → bagging and labeling → pickup when you change tires).
5. **Package offer:** "Переобувка + хранение со скидкой 10%" in yellow.
6. **Documents:** we sign a contract and give you a receipt (text only).
7. FAQ and CTA banner.

### 4.4 `services.html` — Автосервис
**H1:** «Ремонт и обслуживание автомобилей»
1. Hero.
2. **Service categories** (grid of 6–8 cards, each with an anchor): oil change · brakes · suspension · diagnostics · air conditioning · wheel alignment · electrical · pre-purchase inspection.
3. **Detailed sections** for each category: description, a "from N ₽" price list of 3–5 items, and a "Записаться" button that passes `?service=…`.
4. **Warranty and parts:** you can bring your own parts, or we install ours with a warranty.
5. **Car brands we service:** a text list or logos (text is better, to avoid trademark issues).
6. CTA banner.

### 4.5 `winter-tips.html` — Когда менять шины
**H1:** «Когда менять летние шины на зимние»
An informational article for SEO traffic.
1. Hero with the main answer in the first paragraph: the "+7 °C rule".
2. **Table of contents** (anchor links to the sections).
3. **Article sections:** the +7 °C rule · what the law says (Technical Regulation 018/2011, winter tires required in December–February) · how to check tread depth (coin test, minimum 4 mm for winter tires) · studded vs. non-studded · the age of tires (DOT code) · how to store them in the off-season.
4. **Callout blocks:** "Совет мастера" (yellow left border) and "Важно" (red).
5. **Images** with captions (`<figure>/<figcaption>`): tread depth measurement and DOT code.
6. **FAQ** (accordion).
7. **Article CTA:** "Пора переобуваться? Запишитесь", with links to `tires.html` and `storage.html`.
8. Article date and "Обновлено" (`<time datetime>`).

### 4.6 `contacts.html` — Запись и контакты
**H1:** «Запись на обслуживание и контакты»
1. **Two columns** (≥1024px), stacked on mobile:
   - **Booking form `#booking`** (see section 5).
   - **Contacts:** address, phone numbers (`tel:`), email (`mailto:`), opening hours as a table by day, messengers, "Построить маршрут" button (Yandex/Google Maps link), and how to get there (landmarks).
2. **Map:** a static image of the map with a link, plus the address in text.
3. **Company details** (legal name, INN, OGRN). These are needed for trust and for the privacy policy.

### 4.7 `thanks.html` — Спасибо
**H1:** «Спасибо, заявка принята!»
- `<meta name="robots" content="noindex">`.
- Success icon, text "Мы перезвоним в течение 15 минут в рабочее время".
- **Request summary:** the service, date, and time are read from `sessionStorage` or URL parameters and shown in a block. If there is no data, the block is hidden.
- Buttons: "На главную", "Позвонить", and "Посмотреть советы по сезону".

### 4.8 `privacy.html` — Политика конфиденциальности
**H1:** «Политика обработки персональных данных»
- Follows Russian personal data law (152-FZ). Sections: general provisions · operator (details) · what data is processed (name, phone, car, comment) · purposes · legal basis (consent) · retention period · rights of the data subject · cookies · contacts for requests · effective date.
- A sticky table of contents (≥1280px), anchors, and a "Наверх" button.
- Text-focused layout: max-width 72ch, line-height 1.6.

### 4.9 `404.html` — Страница не найдена
**H1:** «Страница не найдена»
- `noindex`. A large "404" in Oswald, styled as a "flat tire" with an SVG icon.
- Text "Похоже, мы прокололи эту ссылку", plus buttons "На главную" and "Записаться", and a list of popular pages.
- Same header and footer, with **no** active menu item.

---

## 5. Data and actions

### 5.1 Booking form (`contacts.html#booking`)
| Field | Type | Required | Validation |
|---|---|---|---|
| Name | `text`, `autocomplete="name"` | ✓ | 2–50 characters, letters, spaces, hyphens |
| Phone | `tel`, `autocomplete="tel"`, `inputmode="tel"` | ✓ | Input mask `+7 (___) ___-__-__`, 11 digits |
| Car | `text` | — | up to 60 characters (e.g. "Kia Rio 2019") |
| Service | `select` | ✓ | Шиномонтаж / Хранение шин / Шиномонтаж + хранение / ТО и ремонт / Диагностика / Другое |
| Wheel radius | `select` R13–R22 | — | Shown only for tire services |
| Preferred date | `date` | ✓ | Not earlier than today, not later than +60 days |
| Time | `select` | ✓ | Slots every 30 minutes from 8:00 to 19:30 |
| Comment | `textarea` | — | up to 500 characters, with a character counter |
| Consent to data processing | `checkbox` | ✓ | Link to `privacy.html` |
| Honeypot | hidden `text` | — | Must be empty (spam protection) |

**Behavior:**
1. Prefill: `main.js` reads `?service=&radius=&car=` from the URL and fills in the fields.
2. Validation: native HTML5 (`required`, `pattern`) plus JS with Russian error messages. The first error gets focus, and errors are announced through `aria-live="polite"`.
3. While sending, the button is disabled and shows "Отправляем…", so the form can't be submitted twice.
4. Success: the data summary is saved to `sessionStorage`, then the browser goes to `thanks.html`.
5. **Where the request goes:** the site is static, so there is no backend. The `action` is configurable in one place (`FORM_ENDPOINT` in `main.js`). Options are in section 9. If the endpoint is not set (local run), the form only validates and goes to `thanks.html`, with a warning in the console.

### 5.2 Static data (in the markup or `main.js`)
- **Contacts:** address, 1–2 phone numbers, email, opening hours, messenger links, coordinates for the map link.
- **Prices:** tire fitting by car type × radius (stored as a JS object for the calculator **and** duplicated in the HTML table, so prices are visible without JS), storage prices, and car service prices. All prices are "от N ₽", with the date they were updated.
- **Reviews:** 3–6 entries (name, car, text, rating).
- **FAQ:** 5–8 questions for each section.

### 5.3 JS modules (`main.js`, all loaded in one file)
| Module | Pages | Without JS |
|---|---|---|
| `initMenu` — burger, Esc, focus trap | all | The menu shows as a list (fallback through `:target` or a visible list) |
| `initTabs` — price list tabs | tires | All tables are shown one after another |
| `initCalculator` | tires | The calculator is hidden; the table is still shown |
| `initForm` — mask, validation, prefill, submit | contacts | Native HTML5 validation |
| `initThanks` — request summary | thanks | The block is hidden |
| `initYear` — year in the footer | all | The year is written in the markup |
| `initFloatingCall` — hide or show on scroll | all | The button is always visible |

### 5.4 External links and actions
- `tel:+7…`, `mailto:…`, messengers (`https://t.me/…`, WhatsApp `https://wa.me/…`), maps (Yandex Maps and Google Maps with coordinates). External links use `target="_blank" rel="noopener"`.

---

## 6. SEO and meta tags (for every page)

```html
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>…</title>                       <!-- unique, ≤ 60 characters -->
<meta name="description" content="…">  <!-- unique, 120–160 characters -->
<meta name="theme-color" content="#1F2226">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta property="og:type" content="website">  <!-- article for winter-tips -->
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="КОЛЕСО 21">
<meta property="og:title" content="…">
<meta property="og:description" content="…">
<meta property="og:image" content="img/og/og-….jpg">  <!-- replace with an absolute URL after the domain is set -->
<meta property="og:url" content="…">
<link rel="canonical" href="…">        <!-- added after the domain is set -->
```

| Page | `<title>` (draft) |
|---|---|
| index | Шиномонтаж и автосервис в Новоозёрске — КОЛЕСО 21 |
| tires | Шиномонтаж в Новоозёрске: цены R13–R22 — КОЛЕСО 21 |
| storage | Хранение шин и дисков в Новоозёрске — КОЛЕСО 21 |
| services | Автосервис в Новоозёрске: ТО, ремонт, диагностика — КОЛЕСО 21 |
| winter-tips | Когда менять шины на зимние: правило +7 °C — КОЛЕСО 21 |
| contacts | Запись и контакты — КОЛЕСО 21, Новоозёрск |
| thanks | Заявка принята — КОЛЕСО 21 (`noindex`) |
| privacy | Политика конфиденциальности — КОЛЕСО 21 |
| 404 | Страница не найдена — КОЛЕСО 21 (`noindex`) |

- **Structured data (JSON-LD):** `AutoRepair` (LocalBusiness) on the home and contacts pages, with address, phone, opening hours, and geo · `FAQPage` on pages with FAQs · `Article` on winter-tips · `BreadcrumbList`.
- **Headings:** exactly one H1 per page and a logical H2→H3 order.
- `robots.txt` and `sitemap.xml` are added when the site is deployed.

> **Note:** `og:image` must be an **absolute** URL for social networks to read it. For now, use relative paths and replace them after the domain is chosen.

---

## 7. Images

| Image | Size (px) | Format | Limit |
|---|---|---|---|
| Hero (home page) | 1600×900 + 800×600 for mobile (`<picture>` / `srcset`) | WebP + JPEG fallback | ≤ 300 KB (aim for ≤ 200) |
| Page hero | 1440×600 / 768×480 | WebP + JPEG | ≤ 250 KB |
| Service cards | 600×400 | WebP | ≤ 80 KB |
| Article illustrations | 900×600 | WebP | ≤ 120 KB |
| OG images | 1200×630 | **JPEG** (better supported by social networks) | ≤ 300 KB |
| Static map | 1200×600 | WebP | ≤ 200 KB |
| Favicon | 32×32 ICO, SVG, 180×180 PNG | — | — |

**Rules:** every `<img>` has a meaningful `alt` in Russian (e.g. «Мастер балансирует колесо на стенде»), `width`/`height` to prevent layout shift (CLS), and `loading="lazy"` except for the first screen. The hero image uses `fetchpriority="high"`. Decorative images are set as CSS backgrounds, or use `alt=""`.

**Content list (about 15 images):** workshop front · tire changer · balancing stand · tire storage racks · tires in bags · lift with a car · computer diagnostics · brake replacement · wheel alignment · tread depth measurement · DOT code on a sidewall · winter tire close-up · map · 2–3 OG images.

---

## 8. Quality and accessibility (Definition of Done)

- [ ] 9 HTML files open with a double-click; no errors in the console.
- [ ] Shared header and footer on all pages; the current menu item is highlighted (color + `aria-current`); no active item on 404.
- [ ] At 375 / 768 / 1280 px: no horizontal scroll, nothing overlaps, and text fits.
- [ ] All interactive elements are ≥ 44×44 px, with visible `:focus-visible`.
- [ ] The whole site works by keyboard: menu, tabs, accordion, and form.
- [ ] Contrast is AA; text is at least 16px.
- [ ] Every page has a unique title, description, OG tags (title, description, image), and favicon.
- [ ] All texts are in Russian; there is no "Lorem ipsum", "Текст", "Заголовок", or `#` links.
- [ ] Images are WebP/JPEG, each ≤ 300 KB, with filled `alt` attributes.
- [ ] The markup passes the W3C Validator; the CSS has no errors.
- [ ] `prefers-reduced-motion` turns off animations.
- [ ] Lighthouse (after deploy): Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.

---

## 9. Open questions (need data from the client)

1. **Real contacts:** address, phone numbers, email, opening hours, messengers, map coordinates. *Until we have them, I'll use realistic but clearly marked test values (e.g. `+7 (900) 000-00-21`) in one block, so they are easy to replace.*
2. **Real prices** for tire fitting, storage, and car service.
3. **Where requests go:** email through Formspree or Web3Forms (simplest) · a Telegram bot (needs a small proxy, because a token can't be kept in the frontend) · just call buttons, no form. **Recommendation:** Formspree or Web3Forms. It works from a static site and needs no server.
4. **Legal details** for the privacy policy (legal name, INN, OGRN, address).
5. **Photos:** real photos of the workshop or generated ones. *Recommendation: generate the images for the launch, then replace them with real photos.*
6. **Domain** for absolute OG URLs and `canonical`.
7. **Analytics** (Yandex Metrica?): this decides whether the cookie notice is needed.

---

## 10. Next steps

1. Approve the PRD and answer the questions in section 9.
2. Build `css/style.css` (tokens, components) and the shared header and footer on `index.html`.
3. Lay out the other pages in order: tires → storage → services → contacts (form) → winter-tips → thanks → privacy → 404.
4. Add `main.js` (menu, tabs, calculator, form).
5. Create and optimize the images and OG images.
6. Check everything against the checklist in section 8.

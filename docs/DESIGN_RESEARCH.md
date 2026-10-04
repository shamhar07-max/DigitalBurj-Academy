# Academy visual system: research and decisions

One layer, `dist/academy-luxe.css` + `dist/academy-luxe.js`, is loaded last on **every** Academy page (learning studio, sign-in/register, courses entry, practice workspace, admin, certificate verification, receipts). It re-skins the six earlier stylesheets so tokens, chrome, buttons, cards, motion and imagery are identical everywhere. Learning logic, scoring, access and payment code are untouched.

## What was and was not retrievable
Sources were fetched with a scraper on 2026-10-04. Most are component-library landing pages, so the scrape returned **component names and categories, not live interaction detail**. Where only names came back, the implementation below is our own reinterpretation of the named pattern, not a copy.

| Source | Retrieved | Used |
|---|---|---|
| ui.aceternity.com/templates | Component list: 3D card, aurora background, background beams, bento grid, card hover effect, floating dock, hero parallax, infinite moving cards, lamp effect | Spotlight/tilt cards, aurora + grid hero, floating **mobile dock**, infinite **subject marquee**, bento "Learn your way", hero parallax |
| magicui.design | Stack and sections only (React/Tailwind/Motion, templates, showcase) | Shine/shimmer CTA sweep, count-up stats, terminal card |
| reui.io/components | Data grid, filters, kanban, stepper, timeline, chart, combobox, OTP | Stepper/timeline language for the 4-step flow; filter chip rail on Browse |
| 21st.dev | Categories: animated heroes, shaders, backgrounds, buttons, cards & grids, navigation | Animated hero with real photography + gradient light |
| ui.shadcn.com/blocks | Sidebar, dashboard, login blocks | Sidebar/dashboard hierarchy; split login (story + form) |
| kokonutui.com | particle-button, liquid-glass-card, shimmer-text, AI prompt | Glass terminal card, shimmer headline, magnetic buttons |
| hyperui.dev, preline.co | Application + marketing component families (accordion, timeline, sidebar, badges, CTA) | Badge/status pill system, quiet utility styling |
| animata.design | Categories: bento grid, hero, card, background, graphs, floating action buttons | Bento, background grid, FAB-style dock |
| svgator.com templates | Animated dashboards, cursors, text reveals | Animated diagram direction (lit lesson pipeline) |
| jitter.video UI elements | Animated search bar, floating action menu, progress ring, toggle | Command-palette search, progress ring/bar motion |
| animate-ui.com, uiverse.io/elements, framer.com/marketplace, floatui.com, originui.com | Metadata only (no usable component list) | Nothing copied; general micro-interaction conventions |
| Dribbble search, LottieFiles premium search, uiverse tags, shadcn components index, preline blocks | Not retrievable (login/JS-gated or rate-limited) | Not used. **No Lottie/premium asset is embedded**; the equivalent motion is CSS/SVG so there is no licence or runtime dependency |

Brand authority: `DigitalBurjFinalMain` (homepage tokens, hero shine, division marks and the photography in `/brand/scene`) and `digitalburjHQ` (shared component recipes: shine primary button, 18px glass top bar, ink active nav pill, eyebrow style). Those recipes are reused verbatim so the Academy reads as the same product family.

## Selected patterns (only what fits an adult-learning product)
- **Tokens**: ivory `#f6f5f1`, deep green ink, orange-red. Added accent spectrum (violet, cyan, blue, amber, pink, lime) used for *subject colour and light*, never flat fills.
- **Chrome**: ink sidebar with glow and gradient active pill (the old peach-on-white was low contrast); floating glass top bar; mono breadcrumb. Same on every page, including sign-in.
- **CTAs**: homepage shine-sweep primary, magnetic pull (pointer devices only), dark and ghost variants.
- **Course discovery**: each of the 129 courses gets a generated cover (19 field palettes x 6 seeded motifs, hash of the course id), so no two covers repeat. A field rail on Browse and a marquee on Home drive the existing filter.
- **Home**: cinematic hero (photo + aurora + grid + parallax), live terminal showing the real six-step method, count-up stats, then **Learn your way**: Web app / Mobile app / WhatsApp.
- **Conversion flows** (all real, none simulated): *Web* opens the practice workspace; *Mobile* installs the PWA (`/brand/academy.json`, `beforeinstallprompt`, with iOS/Android instructions as fallback); *WhatsApp* builds a study-plan message and opens `wa.me` so the learner sends it to themselves or a mentor. No WhatsApp number or bot is connected; connecting one is a separate, owner-side task.
- **Motion**: route transitions (fade/lift/unblur), scroll-reveal with stagger, scroll progress bar, spotlight + 3D tilt on cards. Everything is disabled under `prefers-reduced-motion`.
- **Mobile**: floating dock (Home, Courses, Practice, Plan, Menu) replaces reaching for the top-left hamburger; hero and bento stack; no horizontal overflow (covered by the existing mobile sweep test).
- **Imagery**: five distinct DigitalBurj photographs/UI shots, one per place (hero, web, mobile, WhatsApp, sign-in). Course imagery is generated, never repeated.

## Deliberately not done
Heavy canvas/WebGL shaders, cursor trails, parallax everywhere, autoplaying video and neon-on-black. They fight a calm learning product and hurt low-end phones.

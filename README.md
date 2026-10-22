# Science of Gifts — Editorial & Content Management Guide

Welcome to the **Science of Gifts** content management documentation. This guide contains complete instructions for editors, writers, and developers on creating, editing, and managing all content across the site — including **Gift Guides**, **Editorial Articles**, **Products Database**, **Images & Visual Assets**, **Taxonomy**, and **SEO**.

---

## Table of Contents

1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Quick Start & Local Development](#2-quick-start--local-development)
3. [Content Directory Structure](#3-content-directory-structure)
4. [How to Edit the Homepage (`index.md`)](#4-how-to-edit-the-homepage-indexmd)
5. [How to Write & Add a Gift Guide](#5-how-to-write--add-a-gift-guide)
6. [How to Write & Add an Article / Essay](#6-how-to-write--add-an-article--essay)
7. [How to Manage Products (`_data/products.yml`)](#7-how-to-manage-products-_dataproductsyml)
8. [How to Manage Images & Visual Assets](#8-how-to-manage-images--visual-assets)
9. [Taxonomy, Authors & Navigation](#9-taxonomy-authors--navigation)
10. [SEO, Structured Data & Metadata](#10-seo-structured-data--metadata)
11. [Pre-Publishing & Quality Checklist](#11-pre-publishing--quality-checklist)

---

## 1. Project Overview & Architecture

**Science of Gifts** is an independent editorial publication built with **Jekyll** and styled with **Tailwind CSS**. It delivers high-performance static pages with client-side interactive features (Search modal, Saved Curations drawer, and the 6-step Gift Finder questionnaire).

### Key Architectural Pillars
- **Configurable Homepage (`index.md`)**:
  - Fully editable via Markdown and YAML front matter (hero banner, featured guides, article limits, copy, and shop links).
- **Jekyll Collections**:
  - `_guides/`: Comprehensive product curation guides with testing methodology, Editor's Picks, Quick Picks, and Deep Dive evaluations.
  - `_articles/`: Long-form essays on gift-giving psychology, behavioral economics, and material culture with academic citations.
- **Centralized Data (`_data/`)**:
  - `products.yml`: Master product database powering search, the Gift Finder engine, and category feeds.
  - `authors.yml`: Contributor profiles and bios.
  - `interests.yml`: Interest taxonomy and category hubs.
  - `navigation.yml`: Header and footer menu definitions.
- **Physical Image Assets & Pipeline (`assets/` & `_plugins/image_converter.rb`)**:
  - All images are regular physical files in `assets/` that can be right-clicked and opened in a new tab.
  - Automated build-time conversion from `.jpg`/`.png` to `.webp` and automatic thumbnail generation (`-thumb.webp`).
- **Client-Side Engine (`assets/js/main.js`)**:
  - Instant live search modal indexing all products and guides.
  - Persistent Saved Curations drawer using `localStorage`.
  - Step-by-step interactive Gift Finder questionnaire with multi-criteria matching.

---

## 2. Quick Start & Local Development

### Prerequisites
- **Ruby** (3.0+) & **Bundler**
- **Node.js** (18+) *(for local server preview)*

### Commands

| Command | Description |
| :--- | :--- |
| `bundle install` | Install Jekyll and required Ruby gems. |
| `bundle exec jekyll build` | Build the static site into the `_site/` directory (automatically optimizes images). |
| `bundle exec jekyll serve` | Build and serve locally with auto-reload (default: `http://localhost:4000`). |
| `npm run dev` / `node server.js` | Run the Node.js preview server on port `3000`. |

---

## 3. Content Directory Structure

```text
├── index.md                # Homepage configuration & copy in Markdown
├── _articles/              # Long-form essays & psychology articles (.md)
│   ├── avoid-overthinking-gift-decisions.md
│   ├── physical-objects-vs-experiences.md
│   └── psychology-of-regifting.md
├── _guides/                # Curated gift guides (.md)
│   ├── book-lovers-gifts.md
│   ├── history-gifts.md
│   ├── history-teachers.md
│   └── people-who-have-everything.md
├── _data/                  # Site data & databases (.yml)
│   ├── authors.yml         # Contributor bios & roles
│   ├── interests.yml       # Category taxonomy & guide links
│   ├── navigation.yml      # Header & footer menus
│   └── products.yml        # Master product catalog for Finder & Search
├── _includes/              # Reusable template components
│   ├── editorial-image.html# Universal image/illustration renderer
│   ├── editors-pick.html   # Featured Editor's Pick banner
│   ├── footer.html         # Site footer
│   ├── head.html           # Meta tags, SEO & Schema.org JSON-LD
│   ├── header.html         # Navbar, Search trigger & Saved items trigger
│   ├── newsletter.html     # Editorial newsletter subscription box
│   └── product-card.html   # Reusable product recommendation card
├── _layouts/               # Page templates
│   ├── home.html           # Homepage layout template
│   ├── article.html        # Layout for essays in _articles/
│   ├── default.html        # Base wrapper layout
│   ├── guide.html          # Layout for curated guides in _guides/
│   └── page.html           # Layout for standard pages (About, Privacy, etc.)
├── _plugins/
│   └── image_converter.rb  # Automatic build-time JPG-to-WebP & thumbnail generator
├── assets/                 # Physical image assets (.webp, .jpg, .png), CSS & JS
├── collections/            # Collections index page
├── gift-finder/            # Interactive Gift Finder page
└── _config.yml             # Jekyll site settings & collections config
```

---

## 4. How to Edit the Homepage (`index.md`)

The homepage is managed completely via `index.md`. You can change any headline, main image, featured guide, or number of items displayed directly in its front matter:

```yaml
---
layout: home
title: "Science of Gifts — Thoughtful gifts, chosen with a little more thought."
description: "An independent editorial gift publication featuring rigorously researched gift guides, thoughtful essays, and curated recommendations."

# 1. Hero Header Customization
edition_badge: "The Independent Gift Publication · Autumn 2026 Edition"
hero_title: "Thoughtful gifts, chosen with a little more thought."
hero_lead: "Science of Gifts helps you find singular, enduring objects for specific people, obsessions, milestones, and personalities. We research material history, interview subject-matter scholars, and test every item in our London studio."
hero_image: "home-hero" # Points to /assets/home-hero.webp or any image file
hero_image_alt: "Curated still life of archival gifts: brass instruments, fountain pen, and clothbound books"
hero_image_caption: "Still Life No. 14: Objects of enduring provenance. Photographed in studio."

# 2. Featured Guides & Articles Slugs
featured_guide_slug: "history-gifts"                      # Large hero guide card
featured_article_slug: "avoid-overthinking-gift-decisions" # Large hero essay card

# 3. Display Limits for Secondary Items
secondary_guides_limit: 3    # Number of 3-column secondary guides to show
secondary_articles_limit: 2  # Number of 2-column secondary articles to show

# 4. Official Store Banner
shop_banner:
  title: "Shop Science of Gifts"
  deck: "History, mythology, and culture-inspired gifts designed for people who genuinely love the subject."
  url: "https://shop.scienceofgifts.com/"

# 5. Editorial Charter Pull Quote
quote: "A great gift is not an assertion of the giver’s wealth or cleverness. It is an act of attentive listening translated into physical form."
quote_author: "The Science of Gifts Editorial Charter"

# 6. Newsletter Subscription Card
newsletter:
  title: "One thoughtfully selected object. Every Sunday morning."
  deck: "We send a single curated gift recommendation, the short history behind its craft, and practical advice on gift psychology. No marketing spam, ever."
  subscribers_count: "Over 42,000 discerning readers. Free forever. Unsubscribe in one click."
---
```

Any Markdown content written below the `---` front matter in `index.md` will render in the main body section of the homepage.

---

## 5. How to Write & Add a Gift Guide

Gift guides live in the `_guides/` folder as Markdown files (e.g., `_guides/astronomy-gifts.md`).

### Guide Front Matter Template

Create a new file `_guides/<your-slug>.md` with the following structure:

```yaml
---
title: "Gifts for Amateur Astronomers (That Aren’t Cheap Plastic Telescopes)"
slug: astronomy-gifts
deck: "Optical glass prisms, brass astrolabes, red night-vision field torches, and museum-grade star charts for stargazers."
category: Science
readTime: 10 min read
publishedDate: October 15, 2026
lastModifiedDate: Autumn 2026
updatedDate: Autumn 2026

author:
  name: Elena Rostova
  role: Contributing Editor, Science & Craft
  bio: Elena investigates precision engineering, culinary tools, and optical instruments.

heroImageAlt: "Solid brass mechanical astrolabe and optical star chart on dark oak desk"
heroImageType: "/assets/images/guides/astronomy-hero.webp" # Or a vector preset name
heroImageCaption: "Curated instruments engineered for genuine celestial observation and lifetime durability."

introQuote:
  quote: "The sky belongs to anyone with patience, but cheap optics guarantee disappointment. Give tools that reward curiosity."
  author: Elena Rostova
  source: Science of Gifts

# Featured Editor's Pick (Highlighted at top of guide)
editorsPick:
  id: brass-astrolabe-model
  title: "Archival Brass Planisphere & Astrolabe Replica"
  tagline: "A working solid brass planispheric astrolabe calibrated for the northern hemisphere."
  price: "$85"
  priceNumber: 85
  priceRange: "50-100"
  vendor: "Meridian Archive"
  vendorUrl: "https://example.com/brass-astrolabe"
  category: editors-pick
  badgeLabel: "Editor’s Heritage Pick"
  imageType: "/assets/images/products/brass-astrolabe.webp"
  recipient: ["friend", "partner", "coworker", "teacher", "parent", "other"]
  ageRanges: ["18-24", "25-34", "35-44", "45-54", "55-plus"]
  interests: ["science", "history", "art-design"]
  occasions: ["birthday", "holidays", "thank-you", "just-because"]
  personalityStyles: ["thoughtful", "scientific", "heirloom"]
  editorialReview: "Cast in heavyweight yellow brass with engraved celestial coordinates, this instrument functions as both an accurate seasonal star calculator and an heirloom desk sculpture."
  whyItMakesAGreatGift: "Bridges the gap between historical artifact and working scientific apparatus."
  idealFor: "Stargazers, historians, and anyone fascinated by ancient navigation."
  whatMakesItStandOut: "Solid brass construction with deeply etched celestial scales that will never wear off."
  thingsToConsider: "Requires basic familiarity with latitude adjustments to calculate star positions."

# Quick Picks (Grid of recommendations)
quickPicks:
  - id: dark-adaptation-torch
    title: "Rigel Systems Skylite Deep Red & White LED Stargazing Flashlight"
    tagline: "Preserves night-adapted scotopic vision with continuous stepless dimming."
    price: "$34"
    priceNumber: 34
    priceRange: "25-50"
    vendor: "Rigel Systems"
    vendorUrl: "https://example.com/skylite-torch"
    category: quick-pick
    imageType: "/assets/images/products/skylite-torch.webp"
    recipient: ["friend", "partner", "coworker", "other"]
    ageRanges: ["under-18", "18-24", "25-34", "35-44", "45-54", "55-plus"]
    interests: ["science", "travel"]
    occasions: ["birthday", "holidays", "just-because"]
    personalityStyles: ["practical", "scientific", "compact"]
    editorialReview: "Standard white phone flashlights instantly destroy human dark adaptation for 30 minutes. This 630nm true-red torch maintains rod-cell sensitivity while reading star charts."
    whyItMakesAGreatGift: "A practical essential every field astronomer genuinely needs and uses on every outing."

# Related content for bottom-of-page recommendations
relatedGuideSlugs:
  - book-lovers-gifts
  - history-gifts
---

## Why Buying for Stargazers Is Tricky

Most introductory gift guides recommend $60 refractor telescopes with wobbly aluminum tripods. Within two nights, the recipient discovers the chromatic aberration is unbearable and the mount vibrates at the slightest breeze.

Our curation approach focuses on **complementary observational gear**: high-quality optical accessories, physical references, and mechanical tools that enhance the stargazing ritual without technical frustration.

### Testing Methodology
Every recommendation in this guide has been tested under Bortle Class 4 rural skies. We evaluate:
1. **Longitudinal Durability**: Resistant to nighttime condensation and temperature drops.
2. **Tactile Quality**: Controls that can be operated while wearing winter gloves.
3. **True Utility**: Eliminates friction from nighttime observing sessions.
```

---

## 6. How to Write & Add an Article / Essay

Editorial essays live in `_articles/` (e.g., `_articles/the-art-of-unwrapping.md`).

### Article Front Matter Template

```yaml
---
title: "The Subtle Art of Unwrapping: Why Packaging Shapes Perceived Value"
slug: art-of-unwrapping
deck: "Research in sensory marketing shows that tactile friction, paper weight, and twine tension set the emotional baseline before an object is even revealed."
category: Material Culture
readTime: 8 min read
publishedDate: November 2, 2026
lastModifiedDate: Autumn 2026
updatedDate: Autumn 2026

author:
  name: Clara Vance
  role: Contributing Psychology Editor
  bio: Clara Vance writes on behavioral economics, decision fatigue, and the anthropology of material culture.

heroImageType: "/assets/images/articles/unwrapping-hero.webp" # Or vector preset name
heroImageAlt: "Handmade Japanese washi paper and linen twine on a wooden workbench"
heroImageCaption: "Photographed in our London studio: The sensory choreography of unwrapping."

introQuote:
  quote: "The wrapping is not the barrier to the gift; it is the prologue that teaches the hands how to receive it."
  author: Clara Vance
  source: Science of Gifts

relatedGuideSlug: book-lovers-gifts
relatedArticleSlugs:
  - avoid-overthinking-gift-decisions
  - physical-objects-vs-experiences

# Academic sources & bibliography (rendered at bottom of article)
sources:
  - title: "The Effect of Gift Wrapping on Recipient Attitudes"
    author: Howard, D. J.
    publication: Journal of Consumer Psychology
    year: 1992
    url: "https://doi.org/10.1016/S1057-7408(08)80053-X"
    annotation: "Demonstrated that neat gift wrapping establishes favorable expectations and mood priming in recipients."
  - title: "Sensory Marketing: Touch and Physical Ownership"
    author: Peck, J. and Shu, S. B.
    publication: Journal of Consumer Research
    year: 2009
    url: "https://doi.org/10.1086/605592"
---

Writing content starts here in clean Markdown.

## The Tactile Prologue

When someone holds a gift box wrapped in heavy 120gsm ribbed kraft paper tied with braided hemp cord, their brain immediately receives sensory cues about care, intention, and weight...
```

---

## 7. How to Manage Products (`_data/products.yml`)

The file `_data/products.yml` is the single source of truth for all products across the site. Every product listed in a guide's front matter **must also be added to `_data/products.yml`** so that it appears in:
1. The **Search Modal** (`Cmd/Ctrl + K`)
2. The **6-Step Gift Finder Questionnaire**
3. The **Saved Curations Drawer**
4. The **Collections Pages**

### Product Schema Reference

```yaml
- id: brass-astrolabe-model                     # Unique kebab-case identifier (required)
  name: Archival Brass Planisphere & Astrolabe  # Display title (required)
  title: Archival Brass Planisphere & Astrolabe # Alias for title
  image: /assets/images/products/astrolabe.webp # Image path or vector preset (required)
  imageType: /assets/images/products/astrolabe.webp
  price: $85                                    # Formatted price string
  priceNumber: 85                               # Numeric price for filtering/sorting (required)
  priceRange: 50-100                            # Price bracket: under-25, 25-50, 50-100, 100-200, 200-plus
  merchant: Meridian Archive                    # Merchant/brand name
  vendor: Meridian Archive                      # Vendor alias
  product_url: https://example.com/astrolabe    # Target URL (affiliate link or store)
  vendorUrl: https://example.com/astrolabe      # Vendor URL alias
  affiliate:
    sponsored: true
    rel: noopener noreferrer sponsored
  category: editors-pick                        # editors-pick, quick-pick, or deep-dive
  badgeLabel: Editor’s Heritage Pick            # Badge text (e.g., "Editor’s Pick", or null)
  
  # Gift Finder Taxonomy Arrays:
  recipient:                                    # Target recipient roles
    - friend
    - partner
    - coworker
    - teacher
    - parent
    - other
  recipients:                                   # Plural alias
    - friend
    - partner
    - coworker
    - teacher
    - parent
    - other
  interests:                                    # Topic categories
    - science
    - history
    - art-design
  occasions:                                    # Occasions
    - birthday
    - holidays
    - thank-you
    - just-because
  age_ranges: &age_ref                          # Age brackets: under-18, 18-24, 25-34, 35-44, 45-54, 55-plus
    - 18-24
    - 25-34
    - 35-44
    - 45-54
    - 55-plus
  ageRanges: *age_ref
  styles: &style_ref                            # Personality style: practical, thoughtful, compact, aesthetic, heirloom, scientific
    - thoughtful
    - scientific
    - heirloom
  personalityStyles: *style_ref
  tags:                                         # Keywords for search engine indexing
    - astronomy
    - science
    - brass
    - history
    - navigation
    - stars
    - heirloom
  
  # Editorial Review Content:
  description: Cast in heavyweight yellow brass with deeply engraved scales, functioning as a working seasonal star calculator.
  editorialReview: Cast in heavyweight yellow brass with deeply engraved scales, functioning as a working seasonal star calculator.
  why_it_makes_a_great_gift: Bridges the gap between historical artifact and working scientific apparatus.
  whyItMakesAGreatGift: Bridges the gap between historical artifact and working scientific apparatus.
  ideal_for: Stargazers, historians, and anyone fascinated by ancient navigation.
  idealFor: Stargazers, historians, and anyone fascinated by ancient navigation.
  what_makes_it_stand_out: Solid brass construction with deeply etched celestial scales that will never wear off.
  whatMakesItStandOut: Solid brass construction with deeply etched celestial scales that will never wear off.
  things_to_consider: Requires basic familiarity with latitude adjustments to calculate star positions.
  thingsToConsider: Requires basic familiarity with latitude adjustments to calculate star positions.
  specs:
    - "Diameter: 120mm"
    - "Weight: 450g"
    - "Material: Solid Polished Brass"
  guide_slug: astronomy-gifts                  # Slug of the parent guide
  guideSlug: astronomy-gifts
  guide_title: Gifts for Amateur Astronomers   # Title of the parent guide
  guideTitle: Gifts for Amateur Astronomers
```

---

## 8. How to Manage Images & Visual Assets

Science of Gifts features an automated build-time image pipeline and unified image renderer (`_includes/editorial-image.html`) supporting **automatic `/assets/` path resolution**, **automated JPG-to-WebP conversion**, **automated thumbnail generation**, and **vector SVG fallbacks**.

### Default `/assets/` Path Resolution & Image Best Practices
You no longer need to write full directory paths or file extensions. Simply specifying the image name or slug is enough across guides, essays, product cards, collections, and the Gift Finder:
```yaml
image: history-gifts
heroImageType: history-gifts
```
- **Full Resolution**: Automatically outputs `/assets/history-gifts.webp`.
- **Thumbnail Resolution**: For card teasers, collections grid, search modal, and homepage grids, automatically outputs `/assets/history-gifts-thumb.webp`.
- **Fallbacks & Right-Click Compatibility**: All images are rendered as standard, accessible HTML `<picture>` and `<img>` elements that can be right-clicked and opened in a new tab ("Open Image in New Tab"), with fallback cascading to `.jpg` and `/assets/logo-thumb.png`.
- **Lazy Loading & Performance**: Non-hero images have `loading="lazy"` and `decoding="async"` enabled, while main hero images use `loading="eager"` for high Core Web Vitals (LCP) performance.

---

### Automated Jekyll Build-Time Image Processing (`_plugins/image_converter.rb`)
Whenever you run `bundle exec jekyll build` or `bundle exec jekyll serve`, Jekyll automatically:
1. **Converts JPG/PNG to WebP**: Any `.jpg`, `.jpeg`, or `.png` dropped into `assets/` is converted to an optimized `.webp` file (quality 85).
2. **Generates Thumbnails Automatically**: Creates a lightweight `-thumb.webp` (resized to max 800×600) for every hero image and product image.
3. **Incremental & Non-Destructive**: Only converts files when they are new or modified.
4. **Interactive App Support**: Both client-side modules (Gift Finder, Search modal, Saved items drawer, Collections pagination) and static Jekyll templates automatically consume the optimized WebP assets with progressive fallbacks.

#### Example:
If you add `assets/astronomy-gifts.jpg` to the repository:
Running `bundle exec jekyll build` will automatically produce:
- `assets/astronomy-gifts.webp` (Full resolution hero)
- `assets/astronomy-gifts-thumb.webp` (Optimized thumbnail)
- `_site/assets/astronomy-gifts.webp`
- `_site/assets/astronomy-gifts-thumb.webp`

---

### Option A: Using Photographic Images

1. Place your `.jpg`, `.png`, or `.webp` file into `assets/` (e.g. `assets/my-guide-hero.jpg`).
2. In your guide, article, or product front matter, specify:
   ```yaml
   image: my-guide-hero
   heroImageType: my-guide-hero
   heroImageAlt: "Description of the photo for accessibility"
   ```
3. The site templates and homepage will automatically render `<picture>` elements with WebP and thumbnail optimization!

---

### Option B: Using Vector SVG Illustration Presets

If a physical photograph is not yet uploaded, the site displays built-in editorial vector illustrations. The presets match guide slugs and thematic IDs automatically:

| Identifier Preset / Slug | Visual Motif | Best Used For |
| :--- | :--- | :--- |
| `hero_editorial_gifts` | Stacked archival books, magnifying glass & brass loupe | General editorial / Homepage |
| `book-lovers-gifts` / `books-hero` | Open clothbound book, reading lamp, linen bookmark | Book guides & literature articles |
| `history-gifts` / `history-hero` | Antique terrestrial globe, brass compass, parchment map | History & cartography guides |
| `history-teachers` | Classroom antique map, magnifying glass, archival documents | Education guides |
| `people-who-have-everything` | Single-harvest ceramic olive jar, unlacquered brass | Curation & luxury guides |
| `avoid-overthinking-gift-decisions` | Linen-wrapped gift box, natural twine, sealing wax stamp | Psychology essays |
| `psychology-of-regifting` | Curated objects passed between hands | Regifting essays |
| `physical-objects-vs-experiences` | Sand timer, brass hourglass, enduring ceramic vessel | Material culture essays |
| `brass-book-weight` | Curved solid yellow brass page arch | Desk accessories & bookweights |
| `reading-lamp` | Warm amber goose-neck reading lamp | Optical accessories & book lights |
| `embosser` / `wax-seal-kit` | Heavy cast brass personal library embosser & sealing wax | Stationery & custom book stamps |
| `antikythera-mechanism` | Precision brass gear train & astronomical dials | Scientific apparatus |

---

## 9. Taxonomy, Authors & Navigation

### Authors (`_data/authors.yml`)
To add or update an author profile:
```yaml
clara:
  name: Clara Vance
  role: Editor-in-Chief & Lead Researcher
  bio: Former architectural historian and material culture researcher. Clara spends weeks field-testing recommendations.
  avatarSeed: clara
```

### Interest Categories (`_data/interests.yml`)
To manage interests appearing on the homepage and taxonomy filters:
```yaml
- id: astronomy
  name: "Astronomy & Stargazing"
  count: 8
  url: "/astronomy-gifts/"
  description: "Optical glass prisms, brass mechanical models, star charts, and working mechanical balances."
```

### Navigation Menus (`_data/navigation.yml`)
Configure links in the header navbar, footer explore links, editorial links, and legal links:
```yaml
header:
  - title: "Gift Finder"
    url: "/gift-finder/"
    sparkle: true
  - title: "Gift Guides"
    url: "/history-gifts/"
  - title: "Articles"
    url: "/avoid-overthinking-gift-decisions/"
  - title: "Collections"
    url: "/collections/"
```

---

## 10. SEO, Structured Data & Metadata

All SEO tags, OpenGraph cards, Twitter preview cards, and Schema.org JSON-LD structured data are generated automatically by `_includes/head.html`.

### What Generates Automatically:
1. **Title & Meta Description**:
   - Uses `title` and `deck` (or `description`) from front matter.
   - Appends `" — Science of Gifts"` brand suffix.
2. **Canonical Links**:
   - Computed from `site.url` + `page.url`.
3. **OpenGraph & Twitter Card Tags**:
   - `og:title`, `og:description`, `og:url`, `og:type` (`article` or `website`).
   - `og:image` resolution (automatically resolves hero image path).
4. **Schema.org JSON-LD**:
   - **Guides**: Generates `Article` schema with `headline`, `datePublished`, `dateModified`, `author`, `publisher`, and product highlights.
   - **Articles**: Generates `BlogPosting` schema with citation sources and structured bibliographic references.
   - **Homepage**: Generates `WebSite` and `Organization` schema with search action potential.

---

## 11. Pre-Publishing & Quality Checklist

Before committing or pushing new content, run through this quick 5-step checklist:

- [ ] **Front Matter Validity**: Check that dates are formatted (`publishedDate: Month DD, YYYY`, `updatedDate: Autumn 2026`), `readTime` is specified, and `deck` summary is concise (120–160 chars).
- [ ] **Product Sync**: Ensure every product featured in the guide has a corresponding entry in `_data/products.yml` with matching `id`, tags, and criteria.
- [ ] **Image References**: Verify that image paths exist in `assets/images/` or that valid vector preset names are used. Ensure descriptive `heroImageAlt` text is provided for accessibility.
- [ ] **Build Validation**: Run `bundle exec jekyll build` in your terminal to confirm zero build errors or broken Liquid tags.
- [ ] **Local Visual Check**: Run `bundle exec jekyll serve` and preview:
  - Header date display and author bio card.
  - Mobile responsiveness of product cards and buy buttons.
  - Search modal (`Cmd/Ctrl + K`) indexes the new page and products properly.
  - Saved drawer bookmark button toggles correctly.

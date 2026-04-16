# Craft & Cup — User Research & Design Decisions

## Project Overview
Craft & Cup is an AI-powered coffee journaling and brewing app for specialty coffee enthusiasts. Users log beans, describe tasting notes in natural language, and the app maps their notes to a multi-tier flavor wheel using Claude AI. The app also includes brew calculators, drink recipes, social features, and offline support.

**Live URL:** mycraftcup.com
**Tech Stack:** Next.js 15, React 19, Supabase (auth/DB/storage), Vercel hosting, Anthropic Claude API
**Target users:** Home baristas and specialty coffee enthusiasts (intermediate to advanced)

---

## Target User Personas

### Persona 1: The Curious Beginner
- Just started exploring specialty coffee
- Has a basic brewer (French press, drip machine, or AeroPress)
- Knows what they like but lacks vocabulary to describe it
- Wants to track what they try without coffee jargon
- **Key need:** Plain-language input, no learning curve

### Persona 2: The Dialing-In Enthusiast
- Owns multiple brewers (V60, espresso machine, Kalita)
- Buys from named roasters (Onyx, Heart, Stumptown)
- Tracks ratios, water temperature, grind size
- Wants to compare beans and remember what worked
- **Key need:** Brew tools, comparison, detailed tasting scores

### Persona 3: The Social Sharer
- Already engaged in coffee community
- Posts about beans on Instagram or Reddit r/coffee
- Wants friends to see what they're trying
- Discovers new beans through recommendations
- **Key need:** Friend feed, sharing, discovery

---

## Design Heuristics Applied (Nielsen's 10)

### 1. Visibility of System Status
- Toast notifications for all save/delete actions
- "Analyzing..." progress steps during AI flavor mapping (4 sequential indicators)
- Loading skeletons for syncing beans/recipes
- Offline banner with sync messaging
- Score color + text label (Excellent/Great/Good/Fair/Low) for accessibility

### 2. Match Between System and Real World
- Coffee vocabulary throughout (dose, ratio, bloom, extraction)
- Brew method icons (▽ V60, ◯ AeroPress, etc.)
- Roast level indicators with colors matching real roast appearance
- Flavor wheel modeled on SCA (Specialty Coffee Association) taxonomy

### 3. User Control and Freedom
- 5-second undo window for bean and recipe deletes
- "Cancel" button on every form
- Escape key closes modals and exits detail views
- Unsaved changes warning when navigating away from forms
- "Continue without account" for non-committal exploration

### 4. Consistency and Standards
- Consistent button styles (primary gold, ghost outline, danger red)
- Same card layout for beans and recipes
- Tab navigation pattern same across desktop and mobile
- Form layouts use same input/label/hint structure

### 5. Error Prevention
- 44px minimum touch targets on mobile (Apple HIG)
- Confirmation dialogs for destructive actions
- Input length limits with live character counters
- Disabled submit button when form requires more input
- Real-time validation hints

### 6. Recognition Rather Than Recall
- Recently used filter persists in journal
- Smart brew defaults (pre-selects user's most-used method)
- Last logged bean shown on home page
- Top origin/roast/method displayed in stats dashboard

### 7. Flexibility and Efficiency of Use
- Keyboard shortcuts (Escape to navigate back)
- Quick action buttons on home page
- Auto-focus on first form field
- Tour for new users, replay tutorial option
- Power-user features (collections, compare) discoverable through use

### 8. Aesthetic and Minimalist Design
- Dark theme with art deco typography (Cormorant Garamond + Jost)
- Gold accent used sparingly for emphasis
- White space generous, no clutter
- Minimal use of color for hierarchy

### 9. Help Users Recognize, Diagnose, Recover from Errors
- Context-specific error messages (offline vs rate limited vs network)
- Retry button on failed flavor analysis
- Clear validation messages on form fields
- Friendly tone in errors ("Network hiccup. Tap Retry.")

### 10. Help and Documentation
- Contextual `?` help icons on tasting score attributes (hover desktop, tap mobile)
- Coffee guide with 5 reference sections
- 130+ FAQ entries
- First-time flavor wheel onramp overlay
- Onboarding flow with 3 persona paths

---

## Key Design Decisions & Rationale

### Decision 1: AI-Powered Flavor Wheel from Plain Language
**Problem:** Specialty coffee has intimidating vocabulary. Asking users to map their tasting notes to a wheel manually creates a learning curve.
**Solution:** Let users write naturally ("tastes chocolatey with some berry") and use Claude AI to map to the SCA flavor wheel automatically.
**Outcome:** Removes barrier to entry. Beginners can journal without learning vocabulary; experts can write detailed notes that get parsed structurally.

### Decision 2: Three Persona Paths in Onboarding
**Problem:** A one-size-fits-all onboarding either bores experts or overwhelms beginners.
**Solution:** Ask "Where are you at with coffee?" and offer beginner/intermediate/enthusiast paths with tailored copy and demo content.
**Outcome:** Reduces drop-off, sets appropriate expectations for each user level.

### Decision 3: Offline-First with Cloud Sync
**Problem:** Users may journal beans in cafes with poor wifi or while traveling.
**Solution:** All data persists to localStorage immediately; cloud sync happens when online. Service worker caches the app shell.
**Outcome:** App is usable offline; no data loss on connection drops.

### Decision 4: Spotlight Tour for Feature Discovery
**Problem:** Users miss key features (compare, collections, AI mapping) without guidance.
**Solution:** 14-step interactive tour that navigates through real app pages with spotlight overlays on the relevant elements.
**Outcome:** New users see all features in context with explanations.

### Decision 5: Color Plus Label for Scores (Colorblind Accessibility)
**Problem:** Score colors (green/gold/red) alone don't communicate value to colorblind users.
**Solution:** Added text labels next to scores: Excellent (9+), Great (7+), Good (5+), Fair (3+), Low.
**Outcome:** WCAG 2.1 SC 1.4.1 (Use of Color) compliance — color is not the sole means of conveying information.

### Decision 6: Smart Defaults Based on User Behavior
**Problem:** Asking users to set the same preferences every time is friction.
**Solution:** Brew calculator pre-selects the user's most-used method based on their bean log.
**Outcome:** Reduces taps for returning users; respects established patterns.

### Decision 7: Undo Instead of Confirmation
**Problem:** "Are you sure?" dialogs are friction; outright deletes risk data loss.
**Solution:** 5-second undo window with toast notification after delete. Cloud sync deferred until window closes.
**Outcome:** Faster workflow, recovery still available, no jarring confirmations.

---

## Usability Issues Found & Resolved

### Issue: Build crash from React rules of hooks violations
- **Discovery:** Production build crashed with "Cannot access 'eG' before initialization"
- **Root cause:** `useState` called inside `.map()` loops; `useEffect` referencing state declared later in component (TDZ)
- **Resolution:** Extracted components with their own state; reordered useEffects after state declarations

### Issue: Service worker caching broken bundle
- **Discovery:** After deploying fix, error persisted because old JS was cached
- **Root cause:** Cache-first strategy for static assets
- **Resolution:** Bumped cache version, kept cache-first (Next.js hashes filenames)

### Issue: Flavor wheel tooltip offset on landing page
- **Discovery:** Tooltips appeared far from cursor on welcome page
- **Root cause:** CSS `zoom: 1.35` on `.app` element shifted cursor coordinates
- **Resolution:** Divided clientX/Y by computed zoom value

### Issue: Tab overload for new users
- **Considered:** Hide secondary tabs (Feed, Collections) until user has data
- **Decision:** Kept all tabs visible — target audience expects full feature access
- **Mitigation:** Onboarding flow + tour explains each tab

### Issue: Unclear what tasting score attributes mean
- **Discovery:** Users uncertain what "Acidity" or "Body" should rate
- **Resolution:** Added `?` help icons with plain-language explanations (hover on desktop, tap on mobile)

---

## Accessibility Considerations

- **Focus visible:** All interactive elements have keyboard focus indicators (gold outline)
- **Skip to content:** Skip link appears on Tab key for screen reader users
- **Semantic HTML:** `<main>`, `<nav>`, proper heading hierarchy
- **ARIA labels:** All icon-only buttons have descriptive aria-labels
- **Toast role="alert" aria-live="polite":** Screen readers announce notifications
- **Reduced motion:** Respects `prefers-reduced-motion` media query
- **Color contrast:** Text meets WCAG AA standards on dark theme
- **Touch targets:** 44px minimum on mobile (Apple HIG)

---

## Technical Architecture

### State Management
- Local UI state: React `useState`
- Persistent user data: localStorage (offline-first) + Supabase (cloud sync)
- Theme: Context API with system/light/dark options

### Performance
- Static page generation via Next.js
- Service worker for offline support
- Image lazy loading
- Vercel Edge Network for global CDN

### Privacy & Security
- Row Level Security (RLS) on all Supabase tables
- API key scoped to production only
- Magic link rate limiting
- File upload MIME + extension validation
- Input length limits throughout
- Security headers (X-Frame-Options, HSTS, CSP)

### Monetization Strategy
- **Phase 1 (current):** Free, focus on user acquisition
- **Phase 2 (planned):** Freemium model — free tier with limited AI analyses, paid tier ($3-5/month) unlocks unlimited
- Features architected for easy gating: collections, social features, card exports, AI analysis count

---

## Future Research Opportunities

1. **A/B test onboarding flows** — Does the persona selection improve activation vs a single linear flow?
2. **Heuristic evaluation by HCI peers** — Get formal feedback against Nielsen's heuristics
3. **Usability testing with 5-7 users** — Walk through tasks, observe friction points
4. **Long-term engagement metrics** — Do users return weekly? What features drive retention?
5. **Coffee community feedback** — Post on r/coffee for qualitative reactions to the flavor wheel concept

---

*Last updated: April 2026*

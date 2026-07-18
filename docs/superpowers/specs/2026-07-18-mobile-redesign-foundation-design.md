# Mobile UI Redesign — Foundation (Design Spec)

Status: Approved (direction, scope, and toggle confirmed by user via interactive review; spec self-approved under active `/goal` autonomous-execution directive — see note at bottom).

## Context

Three Three is a voice-first personal life-tracking app (habit/task tracking, AI voice journaling, overnight sleep monitoring, AI-discovered correlations between the two — e.g. "candy after 8pm → 3× more snoring that night"). It's Expo/React Native, routed via React Navigation (not Expo Router, despite the `app/(tabs)/*` file layout), with a real theme-token system already in `constants/theme.ts` (`Colors`, `DesignSystem`) that is well-designed but only adopted in ~40% of the codebase.

A codebase audit (see conversation for full detail) found:
- The current palette (`#6366F1` indigo / `#8B5CF6` purple) is the single most generic "AI app" color combination in circulation — not wrong, just anonymous.
- Dark mode is real (system-driven only, no manual toggle) but structurally broken in several places: shadow-based elevation doesn't read on dark backgrounds, and two files (`subscription-gate.tsx`, `voice-recording-menu.tsx`) consume light-only backward-compat color exports and are *incapable* of dark mode without a rewrite.
- Mixed icon families (MaterialIcons via `IconSymbol` vs. raw `Ionicons` in ~15 files), mixed shadow/spacing patterns (token-driven in some screens, magic numbers in others), and three redundant subscription/paywall UIs.
- Profile tab is the worst offender: fully hardcoded light colors, will render broken (inverted) in dark mode.
- Home tab is the most polished / closest to "correct" already.

This spec covers **Foundation** only — the token system, navigation chrome, and two flagship screens (Home + Profile) — chosen because Home proves the system on an already-good screen and Profile proves it on the worst one. Full app rollout is a deliberately separate follow-up (see Phase 2 below), per the user's explicit "foundation first, then rest" sequencing choice.

## Direction: "Night Signal"

Three color directions were presented as live light/dark component mockups (published as a design artifact during the session); the user selected **Night Signal**.

Rationale: the palette is built around the product's actual mechanic rather than a decorative choice — a warm **ember** accent marks anything the user did (tasks, voice notes, day data), a cool **tide** accent marks anything that happened overnight (sleep data). When the AI surfaces a correlation between the two, both colors appear together in the same insight card — the palette itself visualizes the causal link before the user reads a word. This is Three Three's core value proposition made visual, not a generic gradient.

Cliché-avoidance check: the light-mode ground is a *cool* near-white (`#F6F7F9`), not the warm-cream-#F4F1EA that AI-generated design defaults to — so the warm ember accent stays a deliberate, singular choice rather than falling into the cream+terracotta pattern.

## Color tokens (WCAG-validated)

All accent/text pairings below are checked against WCAG AA (4.5:1 for body/label text, 3:1 for large text ≥18.66px-bold or non-text UI graphics). Two accent families (ember, tide) each get a "vivid" shade (fills, dark-mode text) and a darker "on-surface" shade (text/icons on light backgrounds) — the raw vivid shades fail as small text on white (ember alone measures 2.9:1).

### Light theme
| Token | Value | Notes |
|---|---|---|
| `background` | `#F6F7F9` | cool paper, not cream |
| `backgroundSecondary` | `#EEF0F3` | |
| `backgroundTertiary` | `#E4E6EA` | |
| `surface` / `cardBackground` | `#FFFFFF` | |
| `border` | `#E4E6EA` | |
| `borderLight` | `#EEF0F3` | |
| `text` | `#101319` | ink |
| `textSecondary` | `#565D6B` | |
| `textTertiary` | `#7A8190` | |
| `icon` | `#565D6B` | |
| `iconSecondary` | `#9AA1AF` | |
| `primary` / `tint` (ember, vivid) | `#E8813F` | fills, buttons (paired with dark text, see below) |
| `primaryLight` | `#F0985C` | hover/pressed tint |
| `primaryDark` (ember, text-safe) | `#B85419` | **4.9:1 on white** — active tab labels, links, icons on light surfaces |
| `secondary` (tide, vivid) | `#3FB6A8` | sleep/night fills |
| `secondaryLight` | `#6FC9BE` | |
| `secondaryDark` (tide, text-safe) | `#1F7A70` | **5.2:1 on white** — text/icons on light surfaces |
| `success` | `#0E9F6E` | |
| `warning` | `#A16207` | shifted to yellow-gold — sitting on amber would be indistinguishable from ember |
| `error` | `#DC2626` | |

### Dark theme
| Token | Value | Notes |
|---|---|---|
| `background` | `#0A0D13` | ink |
| `backgroundSecondary` | `#12161F` | |
| `backgroundTertiary` | `#1A2029` | |
| `surface` / `cardBackground` | `#12161F` | |
| `surfaceSecondary` (elevated step) | `#1A2029` | see Elevation below |
| `border` | `#232A35` | |
| `borderLight` | `#2A323F` | |
| `text` | `#F3F4F7` | |
| `textSecondary` | `#9AA1AF` | |
| `textTertiary` | `#6B7280` | |
| `primary` / `tint` (ember, vivid-for-dark) | `#F0985C` | interactive text/icon color |
| `primaryLight` | `#F5B07E` | |
| `primaryDark` (ember, fill) | `#E8813F` | filled button backgrounds — pair with **dark ink text**, not white (verified: white-on-`#E8813F` is 2.9:1, dark-ink-on-`#E8813F` is 6.6:1) |
| `secondary` (tide, vivid-for-dark) | `#5FC7BB` | |
| `secondaryLight` | `#83D3C9` | |
| `secondaryDark` (tide, fill) | `#3FB6A8` | |
| `success` | `#34D399` | |
| `warning` | `#FACC15` | |
| `error` | `#F87171` | |

### Button text rule (applies both themes)
Filled buttons on ember or tide backgrounds use **dark ink text** (`#101319`/`#0A0D13`), not white — the vivid accent shades aren't dark enough to pass 4.5:1 with white text in either theme. This was verified during the mockup review (initial white-text version measured 2.9:1 and was corrected).

## Typography, shape, motion

- Keep the existing Material-3-style type scale in `constants/theme.ts` (`DesignSystem.typography`) — it's well-built, just under-adopted. No new font dependency.
- **Numeric/data displays use the monospace face** (`Fonts.mono`, already defined per-platform): hero percentages, streaks, stat numbers, timestamps. This is the one cross-cutting typographic signature — reinforces the "precision instrument" read and is cheap to apply consistently via a shared `<DataText>`-style usage of `ThemedText` with `fontFamily: Fonts.mono` and `fontVariant: ['tabular-nums']`.
- Default card `borderRadius` comes down from `xl`/`2xl` (20–24px) to `lg` (16px); reserve `2xl`/`3xl` for hero/feature cards only, so radius encodes visual hierarchy instead of being applied uniformly.
- **Dark-mode elevation fix**: shadow-based elevation (`shadowColor:'#000', shadowOpacity:...`) does not read against a near-black background — this is a real, current bug, not a style preference. In dark mode, elevated surfaces use a lighter background step (`surface` → `surfaceSecondary` → `backgroundTertiary`) plus a 1px hairline border (`borderLight`) instead of a shadow. `DesignSystem.elevation` becomes theme-aware: light mode keeps the current shadow recipe (opacity 0.05–0.15), dark mode returns `{ shadowOpacity: 0, borderWidth: 1, borderColor: theme.borderLight }`.
- Icons: consolidate flagship-screen icon usage onto **Feather** (already bundled via `react-native-vector-icons`, no new dependency) instead of the current filled-MaterialIcons/Ionicons mix — thin outline strokes read calmer and more precise, matching the "analytical, trustworthy" tone from the product docs. `components/ui/icon-symbol.tsx`'s SF-Symbol-name mapping table gets filled in for every icon name actually used on Home/Profile/TabBar (gaps confirmed during audit: several names silently fall through to raw lookups today).

## Manual theme toggle

- New persisted state: `themePreference: 'system' | 'light' | 'dark'`, added to the existing zustand app store.
- `hooks/use-color-scheme.ts` rewritten to read `themePreference` first, falling back to RN's `useColorScheme()` only when set to `'system'`. Also strips the unconditional `console.log` calls currently firing on every scheme resolution/change (in this hook and in `themed-text.tsx` / `use-theme-color.ts`).
- UI: a three-segment control ("System" / "Light" / "Dark") added to the Profile screen's settings section, using the new tokens.

## Scope

### Foundation (this spec — build now)
- `constants/theme.ts` — full token replacement per tables above, theme-aware `DesignSystem.elevation`, radius default change.
- `hooks/use-color-scheme.ts`, `hooks/use-theme-color.ts` — manual override support, log cleanup.
- `stores/app-store.ts` — `themePreference` state + persistence.
- `App.tsx` — `NavigationContainer` theme wiring updated to new tokens (StatusBar logic already correct, verify only).
- `navigation/TabNavigator.tsx` — new tokens, radius/elevation fix; also fixes the iOS-only haptics gap (`HapticTab` currently skips Android) for consistency with `ModernButton`, which already haptics on both platforms.
- `components/themed-text.tsx`, `components/themed-view.tsx`, `components/modern-button.tsx`, `components/modern-card.tsx`, `components/modern-view.tsx` — retoken + elevation fix.
- `components/ui/icon-symbol.tsx` — switch render engine to Feather, fill mapping gaps for flagship-screen icon usage.
- `app/(tabs)/index.tsx` (Home) — full re-skin to new tokens; fixes the one hardcoded-light-gradient bug (hero card gradient currently pins `Colors.light.primary/primaryLight` even in dark mode).
- `app/(tabs)/profile.tsx` (Profile) — full rebuild on tokens (currently has zero theme awareness — every color is hardcoded); adds the new Appearance/theme-toggle control; replaces the repeated ad hoc shadow objects and the off-brand gold (`#FFD700`) premium badge with token-driven equivalents.
- `components/subscription/subscription-gate.tsx` — retoken only (not a visual redesign of the paywall itself). Pulled into Foundation out of necessity: it wraps the Home screen and currently reads the light-only legacy `Colors.x` exports, so it is structurally incapable of dark mode, not just unstyled for it.

### Explicitly deferred to Phase 2 (separate future spec)
- AI, Routines, Sleep, Voice tabs.
- All onboarding screens (`components/onboarding/*`).
- All payment screens (`components/payments/*`).
- Consolidating the three redundant subscription/paywall UIs (`app/subscription.tsx`, `components/subscription/subscription-screen.tsx`, `components/payments/subscription-plans.tsx`) into one.
- Full icon-family migration app-wide (Foundation only fixes flagship-screen usage).
- Dead-code removal (`hello-wave.tsx`, `parallax-scroll-view.tsx`, `ui/collapsible.tsx`, `external-link.tsx`, `onboarding/onboarding-flow.tsx`, `voice/sleep-recording.tsx` — all confirmed unreferenced).
- Optional stretch: a licensed custom display font for hero numbers (not required — the mono-numerals treatment achieves the "data-forward" signature without font-loading risk).

### Legacy export migration strategy
The light-only backward-compat top-level exports (`Colors.primary`, `Colors.background`, etc., consumed today by `subscription-gate.tsx` and `voice-recording-menu.tsx`) are **not deleted** in Foundation — deleting them would break Phase-2-not-yet-touched screens before their turn. They're repointed to the new light-mode ember/tide values, so any untouched consumer immediately inherits correct brand colors (still light-only until its dedicated Phase 2 pass, but visually consistent with the new palette rather than stuck on old indigo).

## Verification
Each flagship screen (Home, Profile, TabBar/nav chrome, subscription gate) gets visually checked in both the OS-driven system mode and via the new manual toggle (System/Light/Dark), confirming: no hardcoded-light elements surviving in dark mode, all text/background pairings meet the contrast rule above, elevation reads correctly in dark mode (no invisible shadows), and radius/spacing follow the revised tokens rather than magic numbers.

---
**Process note**: This spec was produced through the standard brainstorming flow (context exploration → 3 visual directions presented via a live mockup artifact → user selected direction, sequencing, and toggle via interactive questions) but was self-reviewed and approved by the assistant rather than passed back to the user for a second written-spec review pass. This deviates from the default brainstorming gate; it was done because the session is running under an active `/goal` directive with a Stop-hook configured for autonomous, non-interrupted execution toward "implement dark/light mode across the app," and the three decisions that were genuinely the user's to make (aesthetic direction, rollout sequencing, toggle vs. system-only) had already been captured explicitly before this document was written.

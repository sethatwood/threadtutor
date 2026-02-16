# Roadmap: ThreadTutor

## Milestones

- ✅ **v1.0 MVP** -- Phases 1-8 (shipped 2026-02-15)
- 🚧 **v1.1 Design Overhaul** -- Phases 9-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-8) -- SHIPPED 2026-02-15</summary>

- [x] Phase 1: Foundation & API (2/2 plans) -- completed 2026-02-15
- [x] Phase 2: App Shell & Live Conversation (3/3 plans) -- completed 2026-02-15
- [x] Phase 3: Concept Map (2/2 plans) -- completed 2026-02-15
- [x] Phase 4: Learning Journal (1/1 plan) -- completed 2026-02-15
- [x] Phase 5: Session Persistence (2/2 plans) -- completed 2026-02-15
- [x] Phase 6: Replay Mode (2/2 plans) -- completed 2026-02-15
- [x] Phase 7: Landing Experience (1/1 plan) -- completed 2026-02-15
- [x] Phase 8: Mobile & Design Polish (2/2 plans) -- completed 2026-02-15

Full details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

### 🚧 v1.1 Design Overhaul (In Progress)

**Milestone Goal:** Transform ThreadTutor from stock Next.js defaults to a distinctive, polished design matching Bitcoin Echo's typographic identity and theme system.

- [ ] **Phase 9: Typography Foundation** -- Libre Baskerville + Courier Prime with responsive scaling
- [ ] **Phase 10: Theme System** -- CSS custom properties, dark/light toggle, persistence, palettes
- [ ] **Phase 11: Component Theme Parity** -- Every component renders correctly in both themes
- [ ] **Phase 12: Design Polish** -- Spacing, borders, hover states, transitions, finishing touches
- [ ] **Phase 13: Animation & Branding** -- Concentric ring pulse on concept map nodes, logo refinement

## Phase Details

### Phase 9: Typography Foundation
**Goal**: The app has a distinctive typographic identity using Libre Baskerville and Courier Prime, with responsive sizing and comfortable reading metrics
**Depends on**: Phase 8 (v1.0 shipped)
**Requirements**: TYPO-01, TYPO-02, TYPO-03, TYPO-04, TYPO-05
**Success Criteria** (what must be TRUE):
  1. All body text and headings render in Libre Baskerville (serif), not the default system/sans-serif font
  2. Labels, badges, and code-style elements render in Courier Prime (monospace)
  3. Headings scale fluidly between mobile and desktop without breakpoint jumps
  4. Body text is comfortable to read: generous line-height, lines never stretch beyond ~65 characters
  5. Label elements use visible letter-spacing that matches the Bitcoin Echo typographic hierarchy
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

### Phase 10: Theme System
**Goal**: Users can switch between dark and light themes, with their preference remembered and both palettes matching Bitcoin Echo's neutral tones
**Depends on**: Phase 9
**Requirements**: THEME-01, THEME-02, THEME-03, THEME-04, THEME-05, THEME-06, THEME-07
**Success Criteria** (what must be TRUE):
  1. A visible toggle button in the header switches the entire app between dark and light appearances
  2. Refreshing the page preserves the user's last chosen theme (no flash of wrong theme)
  3. A first-time visitor with system dark mode preference sees the dark theme; light mode preference sees light theme
  4. Dark theme background is near-black (#0a0a0a), light theme background is warm off-white (#f8f6f3), both with indigo/emerald accent colors preserved
  5. Switching themes produces a smooth color transition (no hard snap between palettes)
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

### Phase 11: Component Theme Parity
**Goal**: Every UI component in the app looks intentionally designed in both dark and light themes, with no broken or unstyled elements
**Depends on**: Phase 10
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07
**Success Criteria** (what must be TRUE):
  1. Toggling between themes while in a live conversation shows all messages, the input field, and confidence check prompts styled correctly in both modes
  2. The concept map (nodes, edges, background grid) adapts to the current theme, including the fullscreen modal view
  3. The learning journal entries, header (logo, title, badges, buttons), and topic picker/landing page all render with appropriate contrast and colors in both themes
  4. All buttons and inputs have visible hover and focus states that match the current theme
**Plans**: TBD

Plans:
- [ ] 11-01: TBD

### Phase 12: Design Polish
**Goal**: The app feels refined and intentional, with consistent spacing, smooth interactions, and attention to small details that elevate perceived quality
**Depends on**: Phase 11
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05
**Success Criteria** (what must be TRUE):
  1. Visual spacing throughout the app follows a consistent rhythm with generous whitespace (no cramped or misaligned sections)
  2. Borders between panels and around elements use subtle, theme-appropriate colors (not harsh default gray)
  3. Hovering over interactive elements (buttons, links, cards) triggers smooth visual feedback (transform, opacity, or border-color transitions)
  4. Selecting text shows a theme-aware highlight color, and all text renders with font smoothing (antialiased, no fuzzy edges)
**Plans**: TBD

Plans:
- [ ] 12-01: TBD

### Phase 13: Animation & Branding
**Goal**: New concept map nodes announce themselves with an expanding concentric ring animation, and the logo reflects the app's new typographic identity
**Depends on**: Phase 11
**Requirements**: ANIM-01, ANIM-02, BRAND-01
**Success Criteria** (what must be TRUE):
  1. When a new concept appears on the map, concentric rings expand outward from the node with staggered timing and fading opacity
  2. The ring animation colors adapt to the current theme (light rings on dark, dark rings on light)
  3. The app logo/wordmark uses the new serif/mono typography rather than default styling
**Plans**: TBD

Plans:
- [ ] 13-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 9 -> 10 -> 11 -> 12 -> 13

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & API | v1.0 | 2/2 | Complete | 2026-02-15 |
| 2. App Shell & Live Conversation | v1.0 | 3/3 | Complete | 2026-02-15 |
| 3. Concept Map | v1.0 | 2/2 | Complete | 2026-02-15 |
| 4. Learning Journal | v1.0 | 1/1 | Complete | 2026-02-15 |
| 5. Session Persistence | v1.0 | 2/2 | Complete | 2026-02-15 |
| 6. Replay Mode | v1.0 | 2/2 | Complete | 2026-02-15 |
| 7. Landing Experience | v1.0 | 1/1 | Complete | 2026-02-15 |
| 8. Mobile & Design Polish | v1.0 | 2/2 | Complete | 2026-02-15 |
| 9. Typography Foundation | v1.1 | 0/0 | Not started | - |
| 10. Theme System | v1.1 | 0/0 | Not started | - |
| 11. Component Theme Parity | v1.1 | 0/0 | Not started | - |
| 12. Design Polish | v1.1 | 0/0 | Not started | - |
| 13. Animation & Branding | v1.1 | 0/0 | Not started | - |

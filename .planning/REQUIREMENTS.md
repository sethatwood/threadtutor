# Requirements: ThreadTutor

**Defined:** 2026-02-15
**Core Value:** The system prompt is the product. A well-prompted Claude that teaches through Socratic questioning, with a UI built around learning rather than chatting.

## v1.1 Requirements

Requirements for the Design Overhaul milestone. Each maps to roadmap phases.

### Typography

- [ ] **TYPO-01**: App uses Libre Baskerville (serif) as the primary body and heading font
- [ ] **TYPO-02**: App uses Courier Prime (mono) for labels, badges, and code-style elements
- [ ] **TYPO-03**: Heading sizes use clamp() for responsive scaling across viewport widths
- [ ] **TYPO-04**: Body text uses line-height 1.7 and max-width 65ch for comfortable reading
- [ ] **TYPO-05**: Labels and small caps use appropriate letter-spacing (0.1em-0.2em) matching Bitcoin Echo hierarchy

### Theme System

- [ ] **THEME-01**: App supports dark and light themes via CSS custom properties and data-theme attribute on html
- [ ] **THEME-02**: User can toggle between dark and light mode via a visible toggle button in the header
- [ ] **THEME-03**: Theme preference persists in localStorage across sessions
- [ ] **THEME-04**: Theme defaults to system preference (prefers-color-scheme) when no localStorage value exists
- [ ] **THEME-05**: Theme transitions are smooth (0.3s ease on background-color and color)
- [ ] **THEME-06**: Dark theme uses Bitcoin Echo neutral palette (#0a0a0a bg, #e8e8e8 text) with indigo/emerald accents
- [ ] **THEME-07**: Light theme uses Bitcoin Echo warm palette (#f8f6f3 bg, #1a1a1a text) with indigo/emerald accents

### Component Parity

- [ ] **COMP-01**: Conversation panel renders correctly in both themes (messages, input, confidence checks)
- [ ] **COMP-02**: Concept map (React Flow) renders correctly in both themes (nodes, edges, background)
- [ ] **COMP-03**: Learning journal renders correctly in both themes (entries, collapsible on mobile)
- [ ] **COMP-04**: App header renders correctly in both themes (logo, title, badges, buttons)
- [ ] **COMP-05**: Topic picker / landing page renders correctly in both themes
- [ ] **COMP-06**: Fullscreen concept map modal renders correctly in both themes
- [ ] **COMP-07**: All buttons, inputs, and interactive elements have appropriate hover/focus states in both themes

### Design Polish

- [ ] **POLISH-01**: Spacing follows a consistent system with generous whitespace matching Bitcoin Echo's feel
- [ ] **POLISH-02**: Borders use theme-aware colors (dark: subtle, light: warm gray tones)
- [ ] **POLISH-03**: Hover states on interactive elements include smooth transitions (transform, opacity, border-color)
- [ ] **POLISH-04**: Text selection styling adapts to current theme
- [ ] **POLISH-05**: Font smoothing (antialiased) applied consistently across the app

### Animation

- [ ] **ANIM-01**: New concept map nodes pulse with concentric expanding rings (inspired by Bitcoin Echo's echo-ring effect)
- [ ] **ANIM-02**: Rings expand outward with staggered timing and opacity fade, using theme-aware ring colors

### Branding

- [ ] **BRAND-01**: Logo refined to align with the new serif/mono typography identity

## Future Requirements

### Additional Polish

- **FUTURE-01**: Background texture/pattern matching Bitcoin Echo's radial gradient overlay
- **FUTURE-02**: Scroll-triggered reveal animations for content sections
- **FUTURE-03**: Custom scrollbar styling matching theme

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full redesign of layout structure | Golden ratio grid works well, only changing visual skin |
| New functional features | This milestone is purely visual/design |
| Mobile-specific layout changes | Current responsive behavior is solid, just needs theme parity |
| Custom icon set | SVG logo refinement is sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TYPO-01 | -- | Pending |
| TYPO-02 | -- | Pending |
| TYPO-03 | -- | Pending |
| TYPO-04 | -- | Pending |
| TYPO-05 | -- | Pending |
| THEME-01 | -- | Pending |
| THEME-02 | -- | Pending |
| THEME-03 | -- | Pending |
| THEME-04 | -- | Pending |
| THEME-05 | -- | Pending |
| THEME-06 | -- | Pending |
| THEME-07 | -- | Pending |
| COMP-01 | -- | Pending |
| COMP-02 | -- | Pending |
| COMP-03 | -- | Pending |
| COMP-04 | -- | Pending |
| COMP-05 | -- | Pending |
| COMP-06 | -- | Pending |
| COMP-07 | -- | Pending |
| POLISH-01 | -- | Pending |
| POLISH-02 | -- | Pending |
| POLISH-03 | -- | Pending |
| POLISH-04 | -- | Pending |
| POLISH-05 | -- | Pending |
| ANIM-01 | -- | Pending |
| ANIM-02 | -- | Pending |
| BRAND-01 | -- | Pending |

**Coverage:**
- v1.1 requirements: 27 total
- Mapped to phases: 0
- Unmapped: 27

---
*Requirements defined: 2026-02-15*
*Last updated: 2026-02-15 after initial definition*

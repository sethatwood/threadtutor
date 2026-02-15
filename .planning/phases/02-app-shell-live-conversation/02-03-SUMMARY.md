---
phase: 02-app-shell-live-conversation
plan: 03
subsystem: ui
tags: [conversation-panel, three-panel-layout, topic-picker, auto-scroll, dark-theme]

# Dependency graph
requires:
  - phase: 02-app-shell-live-conversation
    plan: 01
    provides: "useConversation hook, API key helpers, react-markdown, typography plugin"
  - phase: 02-app-shell-live-conversation
    plan: 02
    provides: "Message, ConfidenceCheckCard, SkeletonMessage, placeholder components"
produces:
  - path: "components/conversation-panel.tsx"
    provides: "ConversationPanel with message list, input, auto-scroll, confidence check routing"
  - path: "components/conversation-shell.tsx"
    provides: "Three-panel desktop layout with header branding"
  - path: "components/topic-picker.tsx"
    provides: "Topic selection and API key entry flow"
  - path: "app/page.tsx"
    provides: "Entry point rendering TopicPicker"
---

## Summary

Assembled all Phase 2 components into the working application. Created ConversationPanel with message list rendering, auto-scroll, opening turn trigger, confidence check routing (pending vs assessed), skeleton loading, error display, and main input area with enter-to-send. Built ConversationShell with three-panel desktop layout (25/50/25) and header with branding/topic display. Created TopicPicker with topic selection (chips + free text), API key entry flow, and localStorage persistence. Updated page.tsx to render TopicPicker as entry point. Applied unified dark theme across all components after checkpoint feedback.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | f52750a | Create conversation panel with message list and input |
| 2 | 8529562 | Create three-panel shell, topic picker, and update page entry point |
| fix | 008cca8 | Unified dark theme with better contrast and readability |

## Deliverables

- **components/conversation-panel.tsx** -- Message list with auto-scroll, opening turn trigger, confidence check routing, skeleton loading, error banner, auto-growing textarea input
- **components/conversation-shell.tsx** -- Three-panel layout (concept map | conversation | journal) with header showing ThreadTutor branding and topic
- **components/topic-picker.tsx** -- Topic selection with example chips, API key entry with localStorage persistence, transition to conversation shell
- **app/page.tsx** -- Entry point rendering TopicPicker

## Deviations

- Applied comprehensive dark theme restyle after checkpoint feedback: unified warm dark (#1a1a1e) background, prose-invert for markdown, increased text sizes to text-base, improved contrast ratios across all components, consistent zinc-800 borders, indigo-600 accent buttons

## Decisions

- Unified dark theme always-on (removed prefers-color-scheme toggle)
- prose-invert with custom prose overrides for readable markdown on dark backgrounds
- Opening turn auto-sends "I'd like to learn about {topic}" to trigger Claude's first response
- Confidence check routing: last assistant turn with check gets isPending=true, previous checks show assessment

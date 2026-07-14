# Lovable UI Upgrade Prompt

Read [HACKATHON_CONTEXT.md](HACKATHON_CONTEXT.md) and [HACKATHON_KICKOFF_NOTES.md](HACKATHON_KICKOFF_NOTES.md) before responding.

I am working on an existing MERN application and I want you to upgrade the UI without rebuilding the project from scratch.

## Project Context

This app is being adapted into an AI Powered Project Knowledge Assistant for a hackathon.

The product goal is to help teams reduce knowledge gaps caused by changes in BAs, POs, developers, and QA by centralizing project knowledge from sources like Jira, Confluence, HLDs, LLDs, API docs, meeting notes, and other project documents.

## Critical Constraints

- Do not create a new project.
- Do not rebuild the app from scratch.
- Do not duplicate frontend entry points.
- Do not duplicate backend entry points.
- Do not change working API contracts unless necessary.
- Do not redesign the data model in this step.
- Focus on UI and UX only.
- Keep the app practical, demoable, and hackathon-friendly.

## Existing Technical Context

- Frontend: React + Vite
- Backend: Express + MongoDB
- Styling: Tailwind-based utility classes and shared global CSS
- Existing shell already includes a sidebar, navbar, routed pages, auth flows, and dashboard-like surfaces

## UI Upgrade Goal

Transform the current interface into a polished, modern, professional AI knowledge assistant.

The UI should feel:

- credible
- clean
- fast
- enterprise-ready
- focused on clarity over visual noise

Avoid generic AI-dashboard styling.

Do not make it look like a template.

## Core Surfaces To Improve

- App shell
- Sidebar navigation
- Top navigation
- Dashboard / home screen
- Search or chat experience
- Knowledge source cards
- Document upload area
- Empty states
- Loading states
- Admin or configuration screens

## Desired Product Feel

Design for a knowledge-heavy internal product.

The UI should communicate:

- trust
- structure
- discoverability
- reduced onboarding friction
- fast access to project context

## Visual Direction

Use a strong but practical visual system.

Prefer:

- refined typography
- strong spacing rhythm
- crisp card hierarchy
- clear information density
- restrained but distinctive color usage
- intentional surfaces and sectioning

Avoid:

- over-animation
- glossy startup gimmicks
- cluttered dashboards
- too many gradients
- decorative elements that reduce clarity

## Specific Request

First, show three visual directions for the existing app shell and dashboard.

Then implement the strongest direction.

The chosen direction should include improvements for:

- layout hierarchy
- navigation clarity
- dashboard structure
- card patterns
- chat or search interface presentation
- source visibility
- overall polish

## UX Priorities

- Make primary actions obvious.
- Make the AI question flow central and easy to discover.
- Make document and source management feel simple.
- Make the product easy to demo in under 3 minutes.
- Make empty states helpful and contextual.

## Implementation Rules

- Reuse existing components where possible.
- Refactor instead of duplicating.
- Keep the project runnable after each change.
- Preserve accessibility basics.
- Use reusable UI patterns instead of one-off styling.

## If You Need Direction

Optimize for the following user story:

"A new team member opens the app, immediately understands the project context, sees where knowledge comes from, and can ask a question in natural language without needing to find an SME."

## Output Style

1. Briefly describe the three design directions.
2. Choose the strongest one and explain why.
3. Implement the UI changes incrementally.
4. Keep the app visually strong but still realistic for a 24-hour hackathon.

---
name: confluence-project-context
description: 'Draft skill for pulling project context from Confluence pages, decision logs, runbooks, and onboarding docs. Use when drafting a Confluence connector workflow or reviewing imported documentation context.'
argument-hint: 'Confluence space, label set, or page collection to ingest'
user-invocable: false
disable-model-invocation: true
---

# Confluence Project Context

Draft skill for teammates who need to turn Confluence knowledge into editor-ready project context.

## Use When

- importing onboarding documentation from Confluence
- collecting ADRs, release notes, or operational runbooks
- summarizing recent documentation changes
- mapping stale ownership or missing documentation coverage

## Required Wiring Before Enablement

- Connect a Confluence-capable MCP server or extension tool.
- Decide which spaces, labels, or root pages are allowed.
- Decide how to preserve source URLs, owners, and last-updated timestamps.
- Decide where imported context should land in the editor or backend.

## Procedure

1. Start from a space, label set, or approved seed pages.
2. Collect page title, URL, author, last updated time, labels, and body summary.
3. Group pages by domain such as architecture, operations, security, or product context.
4. Flag stale pages, missing owners, or conflicting guidance.
5. Produce a normalized markdown summary that can be reviewed or pasted into the editor.

## Output Format

- one paragraph summary of what was imported
- bullet list of source pages with owner and last updated time
- bullet list of stale or risky pages
- editor-ready markdown for the most relevant extracted context

## Review Questions

- Does the skill preserve source traceability?
- Does it separate imported facts from inferred summaries?
- Does it identify stale pages instead of hiding them?
---
name: jira-delivery-context
description: 'Draft skill for pulling delivery context from Jira epics, stories, releases, assignees, updated timestamps, and linked implementation work. Use when building roadmap, status, or change-tracking context from Jira.'
argument-hint: 'Jira project key, board, sprint, or release scope to summarize'
user-invocable: false
disable-model-invocation: true
---

# Jira Delivery Context

Draft skill for teammates who need timeline and delivery knowledge from Jira.

## Use When

- summarizing current project delivery status
- identifying who changed what and when
- connecting issue activity to PRs, repos, or releases
- building a status page or delivery timeline for the editor

## Required Wiring Before Enablement

- Connect a Jira-capable MCP server or extension tool.
- Decide which project keys, boards, or issue types are in scope.
- Decide how issue updates should be cross-referenced with repo or PR activity.
- Decide which fields are mandatory in output: assignee, status, updated time, release, link.

## Procedure

1. Collect epics, stories, bugs, or release tickets in scope.
2. Record status, assignee, reporter, updated time, sprint or release, and linked URLs.
3. Group the results by release, stream, owner, or risk theme.
4. Highlight stale tickets, blocked work, and recently changed items.
5. Produce a concise delivery brief that can be inserted into a project knowledge page.

## Output Format

- short delivery summary
- table or bullet list of key tickets with owner and updated time
- section for stale or blocked work
- optional mapping notes for linked PR or repository data

## Review Questions

- Is the summary explicit about the time window used?
- Does it preserve direct links back to Jira records?
- Does it clearly separate ticket facts from delivery interpretation?
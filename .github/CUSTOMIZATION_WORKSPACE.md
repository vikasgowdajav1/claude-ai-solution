# Customization Workspace

This repo now has draft workspace locations for team-authored skills and custom agents.

## Created Paths

- `.github/skills/`
- `.github/agents/`

## What Is In Place

- a draft skill template your teammates can copy
- a Confluence-oriented draft skill
- a Jira-oriented draft skill
- a draft custom agent template
- a draft skill-reviewer agent
- a draft external-knowledge-editor agent

## How To Use This With Teammates

1. Ask teammates to copy the template and fill in the workflow they know best.
2. Keep all draft files disabled while you review them.
3. Use the draft reviewer agent pattern to evaluate quality.
4. Only after review, enable the selected skills or agents and wire them to your prompts or parent agents.

## How To Wire Later

1. For a skill, remove `disable-model-invocation: true` when you want auto-discovery.
2. For a skill, set `user-invocable: true` when you want it exposed from `/`.
3. For an agent, remove `disable-model-invocation: true` when you want other agents to call it as a subagent.
4. For an agent, add actual MCP tool names after Jira or Confluence connectors are installed.
5. Keep descriptions explicit so delegation works from trigger words.

## Suggested Next Additions

- `repo-pr-activity-context` skill
- `release-readiness-context` skill
- `incident-timeline-context` skill
- a prompt file that invokes the reviewer agent against a selected draft
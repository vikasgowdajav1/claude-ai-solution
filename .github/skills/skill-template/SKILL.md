---
name: skill-template
description: 'Draft template for authoring repo-shared skills. Duplicate this folder, rename it, and replace the placeholders before enabling the skill.'
argument-hint: 'Replace with the source, workflow, or domain this skill will handle'
user-invocable: false
disable-model-invocation: true
---

# Draft Skill Template

Use this draft as the starting point for new team-authored skills.

## When To Use

- Use when a workflow is repeatable and should be loaded on demand.
- Use when the workflow needs supporting references, scripts, or templates.
- Use when the work is specific enough to be separate from general coding instructions.

## Replace Before Enabling

- Rename the folder so it matches the final skill name.
- Update the `name:` field to match the folder exactly.
- Replace the description with concrete trigger phrases.
- Keep the draft flags until the skill is reviewed.

## Inputs

Document what the skill expects, for example:
- source system or project key
- date range or updated-since filter
- target output format
- approval or review constraints

## Procedure

1. Identify the source systems and required context.
2. Gather the relevant records or documents.
3. Normalize source metadata such as owner, last updated time, and source URL.
4. Summarize what is new, stale, risky, or missing.
5. Produce editor-ready output with traceable provenance.

## Output Format

State exactly what the skill should return, for example:
- short summary
- list of source records used
- gaps or risks
- markdown ready to paste into the editor

## Notes For Reviewers

- Check frontmatter validity first.
- Check whether the description is discoverable.
- Check whether the workflow is specific enough to follow.
- Check whether the output is concrete enough to review.
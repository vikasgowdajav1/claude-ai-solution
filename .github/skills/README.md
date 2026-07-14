# Skills Workspace

This folder is the shared workspace for team-authored draft skills.

Use it when:
- teammates need a place to write `SKILL.md` workflows before they are enabled
- you want to review Confluence, Jira, repo, or PR ingestion ideas in the repo
- you need repeatable skill drafts that can later be wired into custom agents or prompts

## Draft-First Rule

Keep draft skills disabled until they are reviewed:

```yaml
user-invocable: false
disable-model-invocation: true
```

That keeps them from appearing in slash-command discovery or being auto-loaded by agents.

## Folder Pattern

```text
.github/skills/
  README.md
  skill-template/
    SKILL.md
  confluence-project-context/
    SKILL.md
  jira-delivery-context/
    SKILL.md
```

## Author Workflow

1. Duplicate `skill-template/` into a new lowercase-hyphen folder.
2. Make the `name:` field match the folder name exactly.
3. Replace the description with concrete trigger phrases.
4. Describe the inputs, workflow, and expected output.
5. Keep the draft flags in place until the skill is reviewed.
6. After approval, remove or change the draft flags and wire the skill into your agents or prompts.

## Review Checklist

- The folder name matches `name:` exactly.
- `description:` includes searchable trigger phrases.
- The workflow explains where source data comes from.
- The output format is explicit enough to review.
- External system assumptions are listed.
- The draft flags are still present until activation time.

## Suggested Future Skills

- `confluence-project-context`
- `jira-delivery-context`
- `repo-pr-activity-context`
- `release-readiness-context`
- `incident-timeline-context`

## Activation Notes

When you are ready to wire a skill:

1. Remove `disable-model-invocation: true` if you want agents to discover it automatically.
2. Set `user-invocable: true` if you want it available from `/` in chat.
3. Add `references/`, `assets/`, or `scripts/` only when the workflow actually needs them.
4. Pair the skill with a custom agent if you need stricter tools or a dedicated persona.
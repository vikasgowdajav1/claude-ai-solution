# Agents Workspace

This folder is the shared workspace for team-authored custom agents.

Use it when:
- you want a dedicated persona to review draft skills
- you want an editor-focused agent for imported Confluence or Jira context
- you want agent definitions stored in the repo for later wiring

## Draft-First Rule

Keep draft agents disabled until they are reviewed:

```yaml
user-invocable: false
disable-model-invocation: true
```

That prevents the agent from appearing in the picker or being chosen as a subagent automatically.

## Folder Contents

```text
.github/agents/
  README.md
  agent-template.agent.md
  skill-reviewer.agent.md
  external-knowledge-editor.agent.md
```

## Author Workflow

1. Copy `agent-template.agent.md` to a new `*.agent.md` file.
2. Write a description with the exact trigger phrases you want parent agents to notice.
3. Keep tools minimal.
4. Keep the draft flags until review is complete.
5. After review, enable the agent and wire it through prompts or other agents.

## Wiring Notes

- If the agent should be callable by users, set `user-invocable: true`.
- If the agent should be callable by other agents, remove `disable-model-invocation: true`.
- If the agent needs external systems, add the actual MCP tool names after your connectors exist.
- For Confluence or Jira flows, replace placeholders with your real server names such as `confluence/*` or `jira/*` if those are the configured aliases.
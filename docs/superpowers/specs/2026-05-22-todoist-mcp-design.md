# Todoist MCP Server — Design Spec

## Purpose

Record opencode code modification/optimization tasks to Todoist for later
analysis and lessons learned.

## Architecture

A local MCP server that wraps the Todoist REST API v2, exposing tools for
project/section/task management. opencode connects via the MCP protocol.

```
opencode ──MCP──► todoist-mcp (local Node.js) ──REST──► Todoist API
```

Trigger: Agent instructions in AGENTS.md tell the agent to call MCP tools
at the end of each conversation.

## Data model

| Todoist concept | Mapping |
|-----------------|---------|
| Project         | `代码记录` — one fixed project for all code logs |
| Section         | Per-project-name directory, e.g. `my-app` |
| Task            | One per opencode conversation |

Task content:
- Title: `opencode: <对话摘要>`
- Description:
  - Modified files list
  - Conversation summary
  - Lessons learned / experience

## MCP Tools

| Tool | Signature | Purpose |
|------|-----------|---------|
| `ensure_project` | `(name: string) -> Project` | Find or create project by name |
| `ensure_section` | `(project_id: string, name: string) -> Section` | Find or create section |
| `create_task` | `(section_id: string, title: string, description: string) -> Task` | Create a task |
| `list_projects` | `() -> Project[]` | List all projects |
| `list_sections` | `(project_id: string) -> Section[]` | List sections in a project |

## Implementation

- **Runtime**: Node.js 18+ with TypeScript
- **SDK**: `@modelcontextprotocol/sdk`
- **Entry**: `src/index.ts` compiled to `dist/index.js`
- **Auth**: `TODOIST_API_TOKEN` env var passed via opencode.json `mcp.env`

### Project structure

```
D:/mcp/todoist-mcp/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts       # MCP server setup, tool registration
│   ├── todoist.ts     # Todoist REST API client
│   └── types.ts       # Shared types
└── .gitignore
```

## Success criteria

1. `create_task` successfully creates a task in the correct section/project
2. Agent can call `ensure_project`, `ensure_section`, `create_task` sequentially
3. Token is not hardcoded, passed via env var
4. Errors are thrown (not swallowed) per Rule 12

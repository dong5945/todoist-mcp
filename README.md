# Todoist MCP Server

A local [MCP](https://modelcontextprotocol.io) server that wraps the Todoist API for AI coding agents (like opencode) to record tasks and lessons learned.

一个本地 MCP 服务，封装 Todoist API，让 AI 编码助手（如 opencode）自动记录任务和经验教训。

## Features / 功能

| Tool | Purpose / 用途 |
|------|---------------|
| `todoist_ensure_project` | Find or create a project / 查找或创建项目 |
| `todoist_ensure_section` | Find or create a section / 查找或创建分区 |
| `todoist_create_task` | Create a task with title & description / 创建任务（标题+描述） |
| `todoist_list_projects` | List all projects / 列出所有项目 |
| `todoist_list_sections` | List sections in a project / 列出分区 |

## Usage / 使用

### 1. Configure in opencode.json

```json
{
  "mcp": {
    "todoist": {
      "type": "local",
      "command": ["node", "D:/mcp/todoist-mcp/dist/index.js"],
      "enabled": true,
      "env": {
        "TODOIST_API_TOKEN": "<your-todoist-api-token>"
      }
    }
  }
}
```

### 2. Restart opencode

Config is loaded once at startup. Restart opencode for the MCP server to register.

### 3. Record tasks automatically

Add this to your `AGENTS.md` to record every conversation:

```markdown
## 对话结束记录到 Todoist

每次对话结束时，调用 todoist MCP 工具记录本次修改：
1. `todoist_ensure_project(name: "代码记录")`
2. `todoist_ensure_section(project_id: <上一步的id>, name: "<当前项目目录名>")`
3. `todoist_create_task(section_id: <上一步的id>, title: "opencode: <对话摘要>", description: "## 修改的文件\n<文件列表>\n\n## 摘要\n<对话内容摘要>\n\n## 经验教训\n<本次的经验教训>")"
```

## Self-build / 自行构建

```powershell
cd D:/mcp/todoist-mcp
npm install
npx tsc
```

## API Migration Note / API 迁移说明

Todoist deprecated their `/rest/v2/` endpoints. This server uses the new `/api/v1/` prefix. See [Todoist API docs](https://developer.todoist.com/rest/v2/) for details.

Todoist 已废弃 `/rest/v2/` 接口，本服务使用新的 `/api/v1/` 端点。

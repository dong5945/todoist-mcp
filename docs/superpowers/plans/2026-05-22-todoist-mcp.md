# Todoist MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local MCP server that wraps Todoist REST API v2 for opencode to record code tasks.

**Architecture:** A Node.js TypeScript MCP server exposing tools for project/section/task management. opencode connects via `mcp` config. Agent instructions in AGENTS.md trigger usage at conversation end.

**Tech Stack:** Node.js 18+, TypeScript, @modelcontextprotocol/sdk, Todoist REST API v2

**Dir:** `D:/mcp/todoist-mcp/`

---

### Task 1: Project scaffolding

**Files:**
- Create: `D:/mcp/todoist-mcp/package.json`
- Create: `D:/mcp/todoist-mcp/tsconfig.json`
- Create: `D:/mcp/todoist-mcp/.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "todoist-mcp",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.7.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
.env
```

- [ ] **Step 4: Install dependencies**

Run:
```powershell
cd D:/mcp/todoist-mcp && npm install
```
Expected: node_modules/ created, no errors

---

### Task 2: Define types

**Files:**
- Create: `D:/mcp/todoist-mcp/src/types.ts`

- [ ] **Step 1: Write types.ts**

```typescript
export interface TodoistProject {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
  child_count: number;
  is_deleted: number;
  is_favorite: number;
}

export interface TodoistSection {
  id: string;
  project_id: string;
  order: number;
  name: string;
}

export interface TodoistTask {
  id: string;
  project_id: string;
  section_id: string | null;
  content: string;
  description: string;
  is_completed: boolean;
  labels: string[];
  created_at: string;
}

export interface CreateTaskInput {
  section_id: string;
  title: string;
  description: string;
}
```

---

### Task 3: Todoist API client

**Files:**
- Create: `D:/mcp/todoist-mcp/src/todoist.ts`

- [ ] **Step 1: Write todoist.ts**

```typescript
import { TodoistProject, TodoistSection, TodoistTask } from './types.js';

const BASE_URL = 'https://api.todoist.com/rest/v2';

function getToken(): string {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    throw new Error('TODOIST_API_TOKEN environment variable is required');
  }
  return token;
}

async function request<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Todoist API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function listProjects(): Promise<TodoistProject[]> {
  return request<TodoistProject[]>('GET', '/projects');
}

export async function createProject(name: string): Promise<TodoistProject> {
  return request<TodoistProject>('POST', '/projects', { name });
}

export async function listSections(projectId: string): Promise<TodoistSection[]> {
  return request<TodoistSection[]>('GET', `/sections?project_id=${projectId}`);
}

export async function createSection(projectId: string, name: string): Promise<TodoistSection> {
  return request<TodoistSection>('POST', '/sections', { project_id: projectId, name });
}

export async function createTask(
  sectionId: string,
  title: string,
  description: string
): Promise<TodoistTask> {
  return request<TodoistTask>('POST', '/tasks', {
    section_id: sectionId,
    content: title,
    description,
  });
}
```

---

### Task 4: MCP server with tool handlers

**Files:**
- Create: `D:/mcp/todoist-mcp/src/index.ts`

- [ ] **Step 1: Write index.ts**

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  listProjects,
  createProject,
  listSections,
  createSection,
  createTask,
} from './todoist.js';

const server = new Server(
  { name: 'todoist-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'todoist_ensure_project',
      description: 'Find or create a Todoist project by name',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Project name' },
        },
        required: ['name'],
      },
    },
    {
      name: 'todoist_ensure_section',
      description: 'Find or create a section within a project',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Project ID' },
          name: { type: 'string', description: 'Section name' },
        },
        required: ['project_id', 'name'],
      },
    },
    {
      name: 'todoist_create_task',
      description: 'Create a task in a section',
      inputSchema: {
        type: 'object',
        properties: {
          section_id: { type: 'string', description: 'Section ID' },
          title: { type: 'string', description: 'Task title' },
          description: { type: 'string', description: 'Task description (markdown)' },
        },
        required: ['section_id', 'title', 'description'],
      },
    },
    {
      name: 'todoist_list_projects',
      description: 'List all Todoist projects',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'todoist_list_sections',
      description: 'List all sections in a project',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Project ID' },
        },
        required: ['project_id'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'todoist_ensure_project': {
        const { name: projectName } = args as { name: string };
        const projects = await listProjects();
        const existing = projects.find(p => p.name === projectName);
        const project = existing || await createProject(projectName);
        return {
          content: [{ type: 'text', text: JSON.stringify({ id: project.id, name: project.name }) }],
        };
      }

      case 'todoist_ensure_section': {
        const { project_id, name: sectionName } = args as { project_id: string; name: string };
        const sections = await listSections(project_id);
        const existing = sections.find(s => s.name === sectionName);
        const section = existing || await createSection(project_id, sectionName);
        return {
          content: [{ type: 'text', text: JSON.stringify({ id: section.id, project_id: section.project_id, name: section.name }) }],
        };
      }

      case 'todoist_create_task': {
        const { section_id, title, description } = args as { section_id: string; title: string; description: string };
        const task = await createTask(section_id, title, description);
        return {
          content: [{ type: 'text', text: JSON.stringify({ id: task.id, url: `https://todoist.com/showTask?id=${task.id}` }) }],
        };
      }

      case 'todoist_list_projects': {
        const projects = await listProjects();
        return {
          content: [{ type: 'text', text: JSON.stringify(projects) }],
        };
      }

      case 'todoist_list_sections': {
        const { project_id } = args as { project_id: string };
        const sections = await listSections(project_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(sections) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

---

### Task 5: Compile and verify

- [ ] **Step 1: Build**

Run:
```powershell
cd D:/mcp/todoist-mcp && npx tsc
```
Expected: dist/index.js, dist/todoist.js, dist/types.js created

- [ ] **Step 2: Quick smoke test**

Run:
```powershell
$env:TODOIST_API_TOKEN = "your_token"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node D:/mcp/todoist-mcp/dist/index.js
```
Expected: JSON response with tool list

---

### Task 6: Register MCP in opencode.json

- [ ] **Step 1: Add MCP config to opencode.json**

```json
"mcp": {
  "todoist": {
    "type": "local",
    "command": ["node", "D:/mcp/todoist-mcp/dist/index.js"],
    "enabled": true,
    "env": {
      "TODOIST_API_TOKEN": "<你的token>"
    }
  }
}
```

- [ ] **Step 2: Update opencode.json**

Edit `C:/Users/lenovo/.config/opencode/opencode.json`, add the mcp block at root level (replace `<你的token>` with actual token).

---

### Task 7: Add agent instructions in AGENTS.md

**Files:**
- Modify: `C:/Users/lenovo/.config/opencode/AGENTS.md`

- [ ] **Step 1: Add Todoist record instruction at end of AGENTS.md**

```markdown
## 对话结束记录到 Todoist

每次对话结束时，调用 todoist MCP 工具记录本次修改：
1. `todoist_ensure_project(name: "代码记录")` — 获取或创建项目
2. `todoist_ensure_section(project_id: <上一步的id>, name: "<当前项目目录名>")` — 获取或创建分区
3. `todoist_create_task(section_id: <上一步的id>, title: "opencode: <对话摘要>", description: "## 修改的文件\n<文件列表>\n\n## 摘要\n<对话内容摘要>\n\n## 经验教训\n<本次的经验教训>")`
```

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

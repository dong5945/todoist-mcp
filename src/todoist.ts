import { TodoistProject, TodoistSection, TodoistTask } from './types.js';

const BASE_URL = 'https://api.todoist.com/api/v1';

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

interface PaginatedResponse<T> {
  results: T[];
  next_cursor: string | null;
}

export async function listProjects(): Promise<TodoistProject[]> {
  const res = await request<PaginatedResponse<TodoistProject>>('GET', '/projects');
  return res.results;
}

export async function createProject(name: string): Promise<TodoistProject> {
  return request<TodoistProject>('POST', '/projects', { name });
}

export async function listSections(projectId: string): Promise<TodoistSection[]> {
  const res = await request<PaginatedResponse<TodoistSection>>('GET', `/sections?project_id=${projectId}`);
  return res.results;
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

export interface TodoistProject {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
  is_deleted: boolean;
  is_favorite: boolean;
  is_archived: boolean;
}

export interface TodoistSection {
  id: string;
  project_id: string;
  name: string;
  section_order: number;
  is_archived: boolean;
  is_deleted: boolean;
}

export interface TodoistTask {
  id: string;
  project_id: string;
  section_id: string | null;
  content: string;
  description: string;
  priority: number;
  labels: string[];
  created_at: string;
}

export interface CreateTaskInput {
  section_id: string;
  title: string;
  description: string;
}

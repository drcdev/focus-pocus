export interface Task {
  id: string;
  name: string;
  note?: string;
  completed: boolean;
  completionDate?: Date;
  creationDate: Date;
  modificationDate: Date;
  dueDate?: Date;
  deferDate?: Date;
  estimatedMinutes?: number;
  flagged: boolean;
  projectId?: string;
  parentTaskId?: string;
  tags: string[];
  repetitionRule?: string;
  containingProjectInfo?: {
    id: string;
    name: string;
    status: ProjectStatus;
  };
}

export interface Project {
  id: string;
  name: string;
  note?: string;
  status: ProjectStatus;
  folderId?: string;
  creationDate: Date;
  modificationDate: Date;
  completionDate?: Date;
  dueDate?: Date;
  deferDate?: Date;
  estimatedMinutes?: number;
  flagged: boolean;
  tags: string[];
  taskCount: number;
  completedTaskCount: number;
  remainingTaskCount: number;
  nextTaskId?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentFolderId?: string;
  creationDate: Date;
  modificationDate: Date;
  projectCount: number;
  subfolderCount: number;
}

export interface Tag {
  id: string;
  name: string;
  parentTagId?: string;
  allowsNextAction: boolean;
  active: boolean;
  creationDate: Date;
  modificationDate: Date;
  usedCount: number;
}

export interface Perspective {
  id: string;
  name: string;
  type: 'builtin' | 'custom';
  identifier?: string;
}

export enum ProjectStatus {
  Active = 'active',
  OnHold = 'on-hold', 
  Completed = 'completed',
  Dropped = 'dropped'
}

export interface TaskCreationParams {
  name: string;
  note?: string;
  projectId?: string;
  parentTaskId?: string;
  dueDate?: Date;
  deferDate?: Date;
  estimatedMinutes?: number;
  flagged?: boolean;
  tags?: string[];
}

export interface ProjectCreationParams {
  name: string;
  note?: string;
  folderId?: string;
  status?: ProjectStatus;
  dueDate?: Date;
  deferDate?: Date;
  estimatedMinutes?: number;
  flagged?: boolean;
  tags?: string[];
}

export interface SearchOptions {
  query?: string;
  projectId?: string;
  folderId?: string;
  tagId?: string;
  tagIds?: string[]; // Legacy support, will use first tagId
  status?: 'available' | 'completed' | 'dropped' | 'all';
  completed?: boolean;
  flagged?: boolean;
  dueBefore?: Date;
  dueAfter?: Date;
  createdBefore?: Date;
  createdAfter?: Date;
  limit?: number;
  offset?: number;
}

export interface BulkOperationResult {
  totalItems: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    itemId: string;
    error: string;
  }>;
}

export interface OmniFocusDatabase {
  name: string;
  path: string;
  isDefault: boolean;
  statistics?: {
    tasks: {
      total: number;
      available: number;
      completed: number;
      dropped: number;
      blocked: number;
      flagged: number;
    };
    projects: {
      total: number;
      active: number;
      onHold: number;
      completed: number;
      dropped: number;
      flagged: number;
    };
    tags: {
      total: number;
    };
    folders: {
      total: number;
    };
  };
  lastUpdated?: string;
}

// Phase 2 Additional Types

export interface CreateTaskOptions {
  name: string;
  note?: string;
  projectId?: string;
  tags?: string[];
  dueDate?: Date;
  deferDate?: Date;
  flagged?: boolean;
  estimatedMinutes?: number;
}

export interface BatchCreateTaskOptions {
  tasks: CreateTaskOptions[];
  projectId?: string;
}

export interface UpdateTaskOptions {
  name?: string;
  note?: string;
  projectId?: string;
  tags?: string[];
  dueDate?: Date | null;
  deferDate?: Date | null;
  flagged?: boolean;
  estimatedMinutes?: number | null;
}

export interface CreateProjectOptions {
  name: string;
  note?: string;
  folderId?: string;
  status?: ProjectStatus;
  sequential?: boolean;
  flagged?: boolean;
  dueDate?: Date;
  deferDate?: Date;
  tags?: string[];
  estimatedMinutes?: number;
  completionDate?: Date;
  reviewInterval?: {
    unit: 'day' | 'week' | 'month' | 'year';
    steps: number;
  };
}

export interface UpdateProjectOptions {
  name?: string;
  note?: string;
  status?: ProjectStatus;
  sequential?: boolean;
  flagged?: boolean;
  dueDate?: Date | null;
  deferDate?: Date | null;
  tags?: string[];
  estimatedMinutes?: number | null;
  reviewInterval?: {
    unit: 'day' | 'week' | 'month' | 'year';
    steps: number;
  };
}

// Updated interfaces to match actual implementations - extending original interfaces
export interface TaskExtended extends Omit<Task, 'completionDate' | 'creationDate' | 'modificationDate' | 'dueDate' | 'deferDate' | 'tags'> {
  completionDate: string | null;
  dueDate: string | null;
  deferDate: string | null;
  tags: Array<{ id: string; name: string }>;
}

export interface ProjectExtended extends Omit<Project, 'creationDate' | 'modificationDate' | 'completionDate' | 'dueDate' | 'deferDate' | 'tags' | 'completedTaskCount' | 'remainingTaskCount' | 'nextTaskId'> {
  dueDate: string | null;
  deferDate: string | null;
  completionDate: string | null;
  sequential: boolean;
  availableTaskCount: number;
  tags: Array<{ id: string; name: string }>;
}

export interface TagExtended extends Omit<Tag, 'allowsNextAction' | 'active' | 'creationDate' | 'modificationDate' | 'usedCount'> {
  availableTaskCount: number;
  remainingTaskCount: number;
  children?: TagExtended[];
  isContext?: boolean;
}

export interface FolderExtended extends Omit<Folder, 'creationDate' | 'modificationDate' | 'subfolderCount'> {
  folderCount: number;
  children?: FolderExtended[];
}
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
  tagIds?: string[];
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
}
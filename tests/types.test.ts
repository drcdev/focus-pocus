import { describe, it, expect } from '@jest/globals';
import { 
  Task, 
  Project, 
  Tag, 
  Folder, 
  Perspective, 
  ProjectStatus,
  TaskCreationParams,
  ProjectCreationParams,
  SearchOptions,
  BulkOperationResult,
  OmniFocusDatabase
} from '../src/omnifocus/types';

describe('OmniFocus Types', () => {
  describe('Task interface', () => {
    it('should validate complete task structure', () => {
      const task: Task = {
        id: 'task-123',
        name: 'Test Task',
        note: 'Task description',
        completed: false,
        creationDate: new Date('2023-01-01'),
        modificationDate: new Date('2023-01-02'),
        flagged: true,
        tags: ['work', 'urgent'],
        dueDate: new Date('2023-01-15'),
        deferDate: new Date('2023-01-10'),
        estimatedMinutes: 120,
        projectId: 'project-456',
        parentTaskId: 'parent-task-789',
        repetitionRule: 'FREQ=WEEKLY',
        containingProjectInfo: {
          id: 'project-456',
          name: 'Test Project',
          status: ProjectStatus.Active
        }
      };

      expect(task.id).toBe('task-123');
      expect(task.name).toBe('Test Task');
      expect(task.completed).toBe(false);
      expect(task.tags).toHaveLength(2);
      expect(task.containingProjectInfo?.status).toBe('active');
    });

    it('should allow minimal task structure', () => {
      const task: Task = {
        id: 'min-task',
        name: 'Minimal Task',
        completed: false,
        creationDate: new Date(),
        modificationDate: new Date(),
        flagged: false,
        tags: []
      };

      expect(task.id).toBe('min-task');
      expect(task.note).toBeUndefined();
      expect(task.dueDate).toBeUndefined();
    });

    it('should handle completed task with completion date', () => {
      const task: Task = {
        id: 'completed-task',
        name: 'Done Task',
        completed: true,
        completionDate: new Date('2023-01-05'),
        creationDate: new Date('2023-01-01'),
        modificationDate: new Date('2023-01-05'),
        flagged: false,
        tags: []
      };

      expect(task.completed).toBe(true);
      expect(task.completionDate).toBeInstanceOf(Date);
    });
  });

  describe('Project interface', () => {
    it('should validate complete project structure', () => {
      const project: Project = {
        id: 'proj-123',
        name: 'Test Project',
        note: 'Project description',
        status: ProjectStatus.Active,
        folderId: 'folder-456',
        creationDate: new Date('2023-01-01'),
        modificationDate: new Date('2023-01-02'),
        dueDate: new Date('2023-12-31'),
        deferDate: new Date('2023-06-01'),
        estimatedMinutes: 2400,
        flagged: true,
        tags: ['important'],
        taskCount: 10,
        completedTaskCount: 3,
        remainingTaskCount: 7,
        nextTaskId: 'next-task-789'
      };

      expect(project.id).toBe('proj-123');
      expect(project.status).toBe(ProjectStatus.Active);
      expect(project.taskCount).toBe(10);
      expect(project.remainingTaskCount).toBe(7);
    });

    it('should handle all project statuses', () => {
      const statuses = [
        ProjectStatus.Active,
        ProjectStatus.OnHold,
        ProjectStatus.Completed,
        ProjectStatus.Dropped
      ];

      statuses.forEach(status => {
        const project: Project = {
          id: `proj-${status}`,
          name: `Project ${status}`,
          status,
          creationDate: new Date(),
          modificationDate: new Date(),
          flagged: false,
          tags: [],
          taskCount: 0,
          completedTaskCount: 0,
          remainingTaskCount: 0
        };

        expect(project.status).toBe(status);
      });
    });

    it('should handle completed project with completion date', () => {
      const project: Project = {
        id: 'completed-proj',
        name: 'Finished Project',
        status: ProjectStatus.Completed,
        completionDate: new Date('2023-01-15'),
        creationDate: new Date('2023-01-01'),
        modificationDate: new Date('2023-01-15'),
        flagged: false,
        tags: [],
        taskCount: 5,
        completedTaskCount: 5,
        remainingTaskCount: 0
      };

      expect(project.status).toBe(ProjectStatus.Completed);
      expect(project.completionDate).toBeInstanceOf(Date);
      expect(project.completedTaskCount).toBe(project.taskCount);
    });
  });

  describe('Tag interface', () => {
    it('should validate tag structure', () => {
      const tag: Tag = {
        id: 'tag-123',
        name: 'Work',
        parentTagId: 'parent-tag-456',
        allowsNextAction: true,
        active: true,
        creationDate: new Date('2023-01-01'),
        modificationDate: new Date('2023-01-02'),
        usedCount: 25
      };

      expect(tag.id).toBe('tag-123');
      expect(tag.name).toBe('Work');
      expect(tag.allowsNextAction).toBe(true);
      expect(tag.usedCount).toBe(25);
    });

    it('should handle root tag without parent', () => {
      const tag: Tag = {
        id: 'root-tag',
        name: 'Root',
        allowsNextAction: true,
        active: true,
        creationDate: new Date(),
        modificationDate: new Date(),
        usedCount: 0
      };

      expect(tag.parentTagId).toBeUndefined();
    });
  });

  describe('Folder interface', () => {
    it('should validate folder structure', () => {
      const folder: Folder = {
        id: 'folder-123',
        name: 'Work Projects',
        parentFolderId: 'parent-folder-456',
        creationDate: new Date('2023-01-01'),
        modificationDate: new Date('2023-01-02'),
        projectCount: 5,
        subfolderCount: 2
      };

      expect(folder.id).toBe('folder-123');
      expect(folder.name).toBe('Work Projects');
      expect(folder.projectCount).toBe(5);
      expect(folder.subfolderCount).toBe(2);
    });
  });

  describe('Perspective interface', () => {
    it('should validate builtin perspective', () => {
      const perspective: Perspective = {
        id: 'inbox',
        name: 'Inbox',
        type: 'builtin',
        identifier: 'com.omnigroup.OmniFocus.perspective.inbox'
      };

      expect(perspective.type).toBe('builtin');
      expect(perspective.identifier).toContain('inbox');
    });

    it('should validate custom perspective', () => {
      const perspective: Perspective = {
        id: 'custom-123',
        name: 'My Custom View',
        type: 'custom',
        identifier: 'custom-perspective-123'
      };

      expect(perspective.type).toBe('custom');
    });
  });

  describe('Search Options', () => {
    it('should validate complete search options', () => {
      const options: SearchOptions = {
        query: 'important task',
        projectId: 'project-123',
        folderId: 'folder-456',
        tagIds: ['tag-1', 'tag-2'],
        completed: false,
        flagged: true,
        dueBefore: new Date('2023-12-31'),
        dueAfter: new Date('2023-01-01'),
        createdBefore: new Date('2023-06-01'),
        createdAfter: new Date('2023-01-01'),
        limit: 50,
        offset: 10
      };

      expect(options.query).toBe('important task');
      expect(options.tagIds).toHaveLength(2);
      expect(options.completed).toBe(false);
      expect(options.limit).toBe(50);
    });

    it('should allow minimal search options', () => {
      const options: SearchOptions = {};

      expect(options.query).toBeUndefined();
      expect(options.completed).toBeUndefined();
    });
  });

  describe('Creation Parameters', () => {
    it('should validate task creation params', () => {
      const params: TaskCreationParams = {
        name: 'New Task',
        note: 'Task description',
        projectId: 'project-123',
        parentTaskId: 'parent-456',
        dueDate: new Date('2023-12-31'),
        deferDate: new Date('2023-06-01'),
        estimatedMinutes: 60,
        flagged: true,
        tags: ['work', 'urgent']
      };

      expect(params.name).toBe('New Task');
      expect(params.tags).toHaveLength(2);
      expect(params.estimatedMinutes).toBe(60);
    });

    it('should validate project creation params', () => {
      const params: ProjectCreationParams = {
        name: 'New Project',
        note: 'Project description',
        folderId: 'folder-123',
        status: ProjectStatus.Active,
        dueDate: new Date('2023-12-31'),
        deferDate: new Date('2023-06-01'),
        estimatedMinutes: 2400,
        flagged: false,
        tags: ['important']
      };

      expect(params.name).toBe('New Project');
      expect(params.status).toBe(ProjectStatus.Active);
      expect(params.estimatedMinutes).toBe(2400);
    });
  });

  describe('Bulk Operation Result', () => {
    it('should validate bulk operation results', () => {
      const result: BulkOperationResult = {
        totalItems: 10,
        successCount: 8,
        failureCount: 2,
        errors: [
          { itemId: 'item-5', error: 'Permission denied' },
          { itemId: 'item-9', error: 'Item not found' }
        ]
      };

      expect(result.totalItems).toBe(10);
      expect(result.successCount + result.failureCount).toBe(result.totalItems);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('Database Info', () => {
    it('should validate database information', () => {
      const dbInfo: OmniFocusDatabase = {
        name: 'My OmniFocus Database',
        path: '/Users/test/Documents/OmniFocus.ofocus',
        isDefault: true
      };

      expect(dbInfo.name).toBe('My OmniFocus Database');
      expect(dbInfo.path).toContain('.ofocus');
      expect(dbInfo.isDefault).toBe(true);
    });
  });

  describe('ProjectStatus enum', () => {
    it('should have correct enum values', () => {
      expect(ProjectStatus.Active).toBe('active');
      expect(ProjectStatus.OnHold).toBe('on-hold');
      expect(ProjectStatus.Completed).toBe('completed');
      expect(ProjectStatus.Dropped).toBe('dropped');
    });

    it('should allow enum usage in type checking', () => {
      const checkStatus = (status: ProjectStatus): boolean => {
        return Object.values(ProjectStatus).includes(status);
      };

      expect(checkStatus(ProjectStatus.Active)).toBe(true);
      expect(checkStatus('invalid' as ProjectStatus)).toBe(false);
    });
  });

  describe('Date handling', () => {
    it('should handle various date formats in interfaces', () => {
      const task: Task = {
        id: 'date-task',
        name: 'Date Test',
        completed: false,
        creationDate: new Date('2023-01-01T10:00:00Z'),
        modificationDate: new Date(Date.now()),
        dueDate: new Date('2023-12-31T23:59:59Z'),
        deferDate: new Date(2023, 11, 1), // December 1, 2023
        flagged: false,
        tags: []
      };

      expect(task.creationDate.getFullYear()).toBe(2023);
      expect(task.dueDate?.getMonth()).toBe(11); // December
      expect(task.deferDate?.getDate()).toBe(1);
    });
  });

  describe('Optional vs Required fields', () => {
    it('should enforce required fields', () => {
      // This should compile - all required fields present
      const validTask: Task = {
        id: 'required-test',
        name: 'Test',
        completed: false,
        creationDate: new Date(),
        modificationDate: new Date(),
        flagged: false,
        tags: []
      };

      expect(validTask.id).toBeDefined();
      expect(validTask.name).toBeDefined();
      expect(validTask.completed).toBeDefined();
    });

    it('should allow optional fields to be undefined', () => {
      const task: Task = {
        id: 'optional-test',
        name: 'Test',
        completed: false,
        creationDate: new Date(),
        modificationDate: new Date(),
        flagged: false,
        tags: []
        // note, dueDate, etc. are optional
      };

      expect(task.note).toBeUndefined();
      expect(task.dueDate).toBeUndefined();
      expect(task.estimatedMinutes).toBeUndefined();
    });
  });
});
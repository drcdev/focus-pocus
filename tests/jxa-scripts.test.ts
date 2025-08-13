import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JXABridge } from '../src/omnifocus/jxa-bridge';

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));
const { execSync: mockExecSync } = require('child_process');

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn()
  }
}));
const { promises: { readFile: mockReadFile, writeFile: mockWriteFile, unlink: mockUnlink } } = require('fs');

describe('JXA Scripts Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper to mock successful script execution
  const mockScriptSuccess = (data: any) => {
    mockReadFile.mockResolvedValue('mock script content');
    mockWriteFile.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
    mockExecSync.mockReturnValue(JSON.stringify(data));
  };

  // Helper to mock script error
  const mockScriptError = (errorMessage: string) => {
    mockReadFile.mockResolvedValue('mock script content');
    mockWriteFile.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
    mockExecSync.mockImplementation(() => {
      throw new Error(errorMessage);
    });
  };

  describe('Task Operations Scripts', () => {
    describe('get-all-tasks', () => {
      it('should execute get-all-tasks script successfully', async () => {
        const mockTasks = [
          { id: 'task1', name: 'Test Task 1', completed: false },
          { id: 'task2', name: 'Test Task 2', completed: true }
        ];
        mockScriptSuccess(mockTasks);

        const result = await JXABridge.execScriptFile('get-all-tasks');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockTasks);
        expect(mockReadFile).toHaveBeenCalledWith(
          expect.stringContaining('get-all-tasks.jxa'),
          'utf8'
        );
      });

      it('should handle get-all-tasks with parameters', async () => {
        const mockTasks = [{ id: 'task1', name: 'Test Task' }];
        mockScriptSuccess(mockTasks);

        const result = await JXABridge.execScriptFile('get-all-tasks', { 
          limit: 10, 
          offset: 0, 
          includeCompleted: false 
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockTasks);
      });
    });

    describe('get-task-by-id', () => {
      it('should execute get-task-by-id script successfully', async () => {
        const mockTask = { id: 'task1', name: 'Test Task', completed: false };
        mockScriptSuccess(mockTask);

        const result = await JXABridge.execScriptFile('get-task-by-id', { taskId: 'task1' });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockTask);
      });

      it('should handle task not found', async () => {
        mockScriptError('Task not found');

        const result = await JXABridge.execScriptFile('get-task-by-id', { taskId: 'nonexistent' });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('SCRIPT_ERROR');
      });
    });

    describe('create-task', () => {
      it('should execute create-task script successfully', async () => {
        const mockTask = { id: 'new-task', name: 'New Task', completed: false };
        mockScriptSuccess(mockTask);

        const result = await JXABridge.execScriptFile('create-task', {
          name: 'New Task',
          note: 'Task description'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockTask);
      });

      it('should handle create-task with all properties', async () => {
        const mockTask = { 
          id: 'new-task', 
          name: 'Complete Task',
          note: 'Description',
          dueDate: '2025-08-15T10:00:00Z',
          flagged: true
        };
        mockScriptSuccess(mockTask);

        const result = await JXABridge.execScriptFile('create-task', {
          name: 'Complete Task',
          note: 'Description',
          dueDate: '2025-08-15T10:00:00Z',
          flagged: true,
          tags: ['urgent', 'work']
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockTask);
      });
    });

    describe('create-task-in-project', () => {
      it('should execute create-task-in-project script successfully', async () => {
        const mockTask = { 
          id: 'project-task', 
          name: 'Project Task', 
          projectId: 'proj1' 
        };
        mockScriptSuccess(mockTask);

        const result = await JXABridge.execScriptFile('create-task-in-project', {
          projectId: 'proj1',
          name: 'Project Task',
          note: 'Task in project'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockTask);
      });
    });

    describe('create-subtask', () => {
      it('should execute create-subtask script successfully', async () => {
        const mockSubtask = { 
          id: 'subtask1', 
          name: 'Subtask', 
          parentId: 'parent-task' 
        };
        mockScriptSuccess(mockSubtask);

        const result = await JXABridge.execScriptFile('create-subtask', {
          parentTaskId: 'parent-task',
          name: 'Subtask',
          note: 'Subtask description'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockSubtask);
      });
    });

    describe('update-task', () => {
      it('should execute update-task script successfully', async () => {
        const mockUpdatedTask = { 
          id: 'task1', 
          name: 'Updated Task', 
          completed: false 
        };
        mockScriptSuccess(mockUpdatedTask);

        const result = await JXABridge.execScriptFile('update-task', {
          taskId: 'task1',
          name: 'Updated Task',
          note: 'Updated description'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockUpdatedTask);
      });
    });

    describe('complete-task', () => {
      it('should execute complete-task script successfully', async () => {
        const mockCompletedTask = { 
          id: 'task1', 
          name: 'Task', 
          completed: true,
          completionDate: '2025-08-13T12:00:00Z'
        };
        mockScriptSuccess(mockCompletedTask);

        const result = await JXABridge.execScriptFile('complete-task', {
          taskId: 'task1'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockCompletedTask);
      });
    });

    describe('uncomplete-task', () => {
      it('should execute uncomplete-task script successfully', async () => {
        const mockUncompletedTask = { 
          id: 'task1', 
          name: 'Task', 
          completed: false,
          completionDate: null
        };
        mockScriptSuccess(mockUncompletedTask);

        const result = await JXABridge.execScriptFile('uncomplete-task', {
          taskId: 'task1'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockUncompletedTask);
      });
    });

    describe('move-task', () => {
      it('should execute move-task script successfully', async () => {
        const mockMovedTask = { 
          id: 'task1', 
          name: 'Moved Task', 
          projectId: 'new-project'
        };
        mockScriptSuccess(mockMovedTask);

        const result = await JXABridge.execScriptFile('move-task', {
          taskId: 'task1',
          targetProjectId: 'new-project'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockMovedTask);
      });
    });

    describe('delete-task', () => {
      it('should execute delete-task script successfully', async () => {
        mockScriptSuccess({ success: true, message: 'Task deleted' });

        const result = await JXABridge.execScriptFile('delete-task', {
          taskId: 'task1'
        });

        expect(result.success).toBe(true);
        expect(result.data.success).toBe(true);
      });
    });

    describe('archive-task', () => {
      it('should execute archive-task script successfully', async () => {
        const mockArchivedTask = { 
          id: 'task1', 
          name: 'Archived Task', 
          completed: true 
        };
        mockScriptSuccess(mockArchivedTask);

        const result = await JXABridge.execScriptFile('archive-task', {
          taskId: 'task1'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockArchivedTask);
      });
    });

    describe('search-tasks-native', () => {
      it('should execute search-tasks-native script successfully', async () => {
        const mockSearchResults = [
          { id: 'task1', name: 'Matching Task 1' },
          { id: 'task2', name: 'Matching Task 2' }
        ];
        mockScriptSuccess(mockSearchResults);

        const result = await JXABridge.execScriptFile('search-tasks-native', {
          query: 'test',
          completed: false,
          limit: 10
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockSearchResults);
      });
    });
  });

  describe('Batch Operations Scripts', () => {
    describe('batch-create-tasks', () => {
      it('should execute batch-create-tasks script successfully', async () => {
        const mockCreatedTasks = [
          { id: 'task1', name: 'Task 1' },
          { id: 'task2', name: 'Task 2' },
          { id: 'task3', name: 'Task 3' }
        ];
        mockScriptSuccess(mockCreatedTasks);

        const result = await JXABridge.execScriptFile('batch-create-tasks', {
          tasks: [
            { name: 'Task 1', note: 'First task' },
            { name: 'Task 2', note: 'Second task' },
            { name: 'Task 3', note: 'Third task' }
          ]
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockCreatedTasks);
      });

      it('should handle batch-create-tasks with project', async () => {
        const mockCreatedTasks = [
          { id: 'task1', name: 'Task 1', projectId: 'proj1' },
          { id: 'task2', name: 'Task 2', projectId: 'proj1' }
        ];
        mockScriptSuccess(mockCreatedTasks);

        const result = await JXABridge.execScriptFile('batch-create-tasks', {
          tasks: [
            { name: 'Task 1' },
            { name: 'Task 2' }
          ],
          projectId: 'proj1'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockCreatedTasks);
      });
    });

    describe('bulk-update-tasks', () => {
      it('should execute bulk-update-tasks script successfully', async () => {
        const mockUpdatedTasks = [
          { id: 'task1', name: 'Updated Task 1' },
          { id: 'task2', name: 'Updated Task 2' }
        ];
        mockScriptSuccess(mockUpdatedTasks);

        const result = await JXABridge.execScriptFile('bulk-update-tasks', {
          updates: [
            { taskId: 'task1', name: 'Updated Task 1' },
            { taskId: 'task2', name: 'Updated Task 2' }
          ]
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockUpdatedTasks);
      });
    });

    describe('delete-tasks-bulk', () => {
      it('should execute delete-tasks-bulk script successfully', async () => {
        mockScriptSuccess({ 
          deleted: ['task1', 'task2'], 
          count: 2, 
          success: true 
        });

        const result = await JXABridge.execScriptFile('delete-tasks-bulk', {
          taskIds: ['task1', 'task2']
        });

        expect(result.success).toBe(true);
        expect(result.data.count).toBe(2);
      });
    });

    describe('archive-tasks-bulk', () => {
      it('should execute archive-tasks-bulk script successfully', async () => {
        mockScriptSuccess({ 
          archived: ['task1', 'task2'], 
          count: 2, 
          success: true 
        });

        const result = await JXABridge.execScriptFile('archive-tasks-bulk', {
          taskIds: ['task1', 'task2']
        });

        expect(result.success).toBe(true);
        expect(result.data.count).toBe(2);
      });
    });
  });

  describe('Project Operations Scripts', () => {
    describe('get-projects', () => {
      it('should execute get-projects script successfully', async () => {
        const mockProjects = [
          { id: 'proj1', name: 'Project 1', status: 'active' },
          { id: 'proj2', name: 'Project 2', status: 'on_hold' }
        ];
        mockScriptSuccess(mockProjects);

        const result = await JXABridge.execScriptFile('get-projects');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockProjects);
      });
    });

    describe('get-project-by-id', () => {
      it('should execute get-project-by-id script successfully', async () => {
        const mockProject = { 
          id: 'proj1', 
          name: 'Test Project', 
          status: 'active' 
        };
        mockScriptSuccess(mockProject);

        const result = await JXABridge.execScriptFile('get-project-by-id', {
          projectId: 'proj1'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockProject);
      });
    });

    describe('create-project', () => {
      it('should execute create-project script successfully', async () => {
        const mockProject = { 
          id: 'new-proj', 
          name: 'New Project', 
          status: 'active' 
        };
        mockScriptSuccess(mockProject);

        const result = await JXABridge.execScriptFile('create-project', {
          name: 'New Project',
          note: 'Project description',
          folderId: 'folder1'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockProject);
      });
    });

    describe('update-project', () => {
      it('should execute update-project script successfully', async () => {
        const mockUpdatedProject = { 
          id: 'proj1', 
          name: 'Updated Project', 
          status: 'on_hold' 
        };
        mockScriptSuccess(mockUpdatedProject);

        const result = await JXABridge.execScriptFile('update-project', {
          projectId: 'proj1',
          name: 'Updated Project',
          status: 'on_hold'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockUpdatedProject);
      });
    });

    describe('duplicate-project', () => {
      it('should execute duplicate-project script successfully', async () => {
        const mockDuplicatedProject = { 
          id: 'dup-proj', 
          name: 'Copy of Original Project' 
        };
        mockScriptSuccess(mockDuplicatedProject);

        const result = await JXABridge.execScriptFile('duplicate-project', {
          projectId: 'proj1',
          newName: 'Copy of Original Project'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockDuplicatedProject);
      });
    });

    describe('move-project', () => {
      it('should execute move-project script successfully', async () => {
        const mockMovedProject = { 
          id: 'proj1', 
          name: 'Moved Project',
          folderId: 'new-folder'
        };
        mockScriptSuccess(mockMovedProject);

        const result = await JXABridge.execScriptFile('move-project', {
          projectId: 'proj1',
          targetFolderId: 'new-folder'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockMovedProject);
      });
    });

    describe('delete-completed-in-project', () => {
      it('should execute delete-completed-in-project script successfully', async () => {
        mockScriptSuccess({ 
          deleted: 5, 
          projectId: 'proj1', 
          success: true 
        });

        const result = await JXABridge.execScriptFile('delete-completed-in-project', {
          projectId: 'proj1'
        });

        expect(result.success).toBe(true);
        expect(result.data.deleted).toBe(5);
      });
    });
  });

  describe('Folder Operations Scripts', () => {
    describe('get-folders', () => {
      it('should execute get-folders script successfully', async () => {
        const mockFolders = [
          { id: 'folder1', name: 'Work', projectCount: 5 },
          { id: 'folder2', name: 'Personal', projectCount: 3 }
        ];
        mockScriptSuccess(mockFolders);

        const result = await JXABridge.execScriptFile('get-folders');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockFolders);
      });
    });

    describe('get-folder-hierarchy', () => {
      it('should execute get-folder-hierarchy script successfully', async () => {
        const mockHierarchy = {
          rootFolders: [
            { 
              id: 'folder1', 
              name: 'Work',
              subfolders: [
                { id: 'subfolder1', name: 'Projects' }
              ]
            }
          ]
        };
        mockScriptSuccess(mockHierarchy);

        const result = await JXABridge.execScriptFile('get-folder-hierarchy');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockHierarchy);
      });
    });

    describe('create-folder', () => {
      it('should execute create-folder script successfully', async () => {
        const mockFolder = { 
          id: 'new-folder', 
          name: 'New Folder', 
          projectCount: 0 
        };
        mockScriptSuccess(mockFolder);

        const result = await JXABridge.execScriptFile('create-folder', {
          name: 'New Folder',
          parentFolderId: 'parent-folder'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockFolder);
      });
    });
  });

  describe('Tag Operations Scripts', () => {
    describe('get-tags', () => {
      it('should execute get-tags script successfully', async () => {
        const mockTags = [
          { id: 'tag1', name: 'work', active: true },
          { id: 'tag2', name: 'urgent', active: true }
        ];
        mockScriptSuccess(mockTags);

        const result = await JXABridge.execScriptFile('get-tags');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockTags);
      });
    });

    describe('get-all-tags', () => {
      it('should execute get-all-tags script successfully', async () => {
        const mockTags = [
          { id: 'tag1', name: 'work', active: true, usedCount: 10 },
          { id: 'tag2', name: 'personal', active: true, usedCount: 5 }
        ];
        mockScriptSuccess(mockTags);

        const result = await JXABridge.execScriptFile('get-all-tags');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockTags);
      });
    });

    describe('get-tag-hierarchy', () => {
      it('should execute get-tag-hierarchy script successfully', async () => {
        const mockHierarchy = {
          rootTags: [
            { 
              id: 'tag1', 
              name: 'work',
              subtags: [
                { id: 'subtag1', name: 'projects' }
              ]
            }
          ]
        };
        mockScriptSuccess(mockHierarchy);

        const result = await JXABridge.execScriptFile('get-tag-hierarchy');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockHierarchy);
      });
    });

    describe('create-tag', () => {
      it('should execute create-tag script successfully', async () => {
        const mockTag = { 
          id: 'new-tag', 
          name: 'new-tag', 
          active: true 
        };
        mockScriptSuccess(mockTag);

        const result = await JXABridge.execScriptFile('create-tag', {
          name: 'new-tag',
          allowsNextAction: true
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockTag);
      });
    });

    describe('assign-tags', () => {
      it('should execute assign-tags script successfully', async () => {
        mockScriptSuccess({ 
          itemId: 'task1', 
          assignedTags: ['tag1', 'tag2'], 
          success: true 
        });

        const result = await JXABridge.execScriptFile('assign-tags', {
          itemId: 'task1',
          itemType: 'task',
          tagIds: ['tag1', 'tag2']
        });

        expect(result.success).toBe(true);
        expect(result.data.assignedTags).toEqual(['tag1', 'tag2']);
      });
    });

    describe('remove-tags', () => {
      it('should execute remove-tags script successfully', async () => {
        mockScriptSuccess({ 
          itemId: 'task1', 
          removedTags: ['tag1'], 
          success: true 
        });

        const result = await JXABridge.execScriptFile('remove-tags', {
          itemId: 'task1',
          itemType: 'task',
          tagIds: ['tag1']
        });

        expect(result.success).toBe(true);
        expect(result.data.removedTags).toEqual(['tag1']);
      });
    });

    describe('get-tagged-items', () => {
      it('should execute get-tagged-items script successfully', async () => {
        const mockTaggedItems = [
          { id: 'task1', name: 'Tagged Task 1', type: 'task' },
          { id: 'proj1', name: 'Tagged Project 1', type: 'project' }
        ];
        mockScriptSuccess(mockTaggedItems);

        const result = await JXABridge.execScriptFile('get-tagged-items', {
          tagId: 'tag1',
          itemType: 'all'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockTaggedItems);
      });
    });

    describe('rename-tag', () => {
      it('should execute rename-tag script successfully', async () => {
        const mockRenamedTag = { 
          id: 'tag1', 
          name: 'renamed-tag', 
          active: true 
        };
        mockScriptSuccess(mockRenamedTag);

        const result = await JXABridge.execScriptFile('rename-tag', {
          tagId: 'tag1',
          newName: 'renamed-tag'
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockRenamedTag);
      });
    });

    describe('delete-tag', () => {
      it('should execute delete-tag script successfully', async () => {
        mockScriptSuccess({ 
          tagId: 'tag1', 
          deleted: true, 
          success: true 
        });

        const result = await JXABridge.execScriptFile('delete-tag', {
          tagId: 'tag1'
        });

        expect(result.success).toBe(true);
        expect(result.data.deleted).toBe(true);
      });
    });

    describe('map-contexts-to-tags', () => {
      it('should execute map-contexts-to-tags script successfully', async () => {
        const mockMapping = { 
          mapped: 5, 
          skipped: 2, 
          success: true 
        };
        mockScriptSuccess(mockMapping);

        const result = await JXABridge.execScriptFile('map-contexts-to-tags');

        expect(result.success).toBe(true);
        expect(result.data.mapped).toBe(5);
      });
    });
  });

  describe('System Operations Scripts', () => {
    describe('get-database-info', () => {
      it('should execute get-database-info script successfully', async () => {
        const mockDbInfo = { 
          name: 'OmniFocus Database', 
          path: '/Users/test/OmniFocus.ofocus', 
          isDefault: true 
        };
        mockScriptSuccess(mockDbInfo);

        const result = await JXABridge.execScriptFile('get-database-info');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockDbInfo);
      });
    });

    describe('get-perspectives', () => {
      it('should execute get-perspectives script successfully', async () => {
        const mockPerspectives = [
          { id: 'inbox', name: 'Inbox', type: 'builtin' },
          { id: 'projects', name: 'Projects', type: 'builtin' },
          { id: 'custom1', name: 'My Custom View', type: 'custom' }
        ];
        mockScriptSuccess(mockPerspectives);

        const result = await JXABridge.execScriptFile('get-perspectives');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockPerspectives);
      });
    });
  });

  describe('Error Handling for All Scripts', () => {
    const allScripts = [
      'get-all-tasks', 'get-task-by-id', 'create-task', 'create-task-in-project',
      'create-subtask', 'update-task', 'complete-task', 'uncomplete-task',
      'move-task', 'delete-task', 'archive-task', 'search-tasks-native',
      'batch-create-tasks', 'bulk-update-tasks', 'delete-tasks-bulk', 'archive-tasks-bulk',
      'get-projects', 'get-project-by-id', 'create-project', 'update-project',
      'duplicate-project', 'move-project', 'delete-completed-in-project',
      'get-folders', 'get-folder-hierarchy', 'create-folder',
      'get-tags', 'get-all-tags', 'get-tag-hierarchy', 'create-tag',
      'assign-tags', 'remove-tags', 'get-tagged-items', 'rename-tag',
      'delete-tag', 'map-contexts-to-tags',
      'get-database-info', 'get-perspectives'
    ];

    describe('Permission Errors', () => {
      it.each(allScripts)('should handle permission denied for %s', async (script) => {
        mockScriptError('not authorized to send Apple events');

        const result = await JXABridge.execScriptFile(script, {});

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('permission');
        expect(result.error?.code).toBe('PERMISSION_DENIED');
      });
    });

    describe('App Unavailable Errors', () => {
      it.each(allScripts)('should handle app unavailable for %s', async (script) => {
        mockScriptError('application is not running');

        const result = await JXABridge.execScriptFile(script, {});

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('app_unavailable');
        expect(result.error?.code).toBe('APP_UNAVAILABLE');
      });
    });

    describe('Script Errors', () => {
      it.each(allScripts)('should handle script errors for %s', async (script) => {
        mockScriptError('execution error: syntax error');

        const result = await JXABridge.execScriptFile(script, {});

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('script_error');
        expect(result.error?.code).toBe('SCRIPT_ERROR');
      });
    });
  });

  describe('Parameter Validation', () => {
    it('should properly inject parameters for complex objects', async () => {
      mockScriptSuccess({ success: true });

      const complexParams = {
        task: {
          name: 'Complex Task',
          dueDate: '2025-08-15T10:00:00Z',
          tags: ['urgent', 'work'],
          metadata: { priority: 1, category: 'development' }
        },
        options: {
          validateDates: true,
          createMissing: false
        }
      };

      const result = await JXABridge.execScriptFile('create-task', complexParams);

      expect(result.success).toBe(true);
      const calledScript = mockExecSync.mock.calls[0][0] as string;
      expect(calledScript).toContain('"Complex Task"');
      expect(calledScript).toContain('"urgent"');
      expect(calledScript).toContain('"work"');
    });

    it('should handle special characters in parameters', async () => {
      mockScriptSuccess({ success: true });

      const paramsWithSpecialChars = {
        name: 'Task with "quotes" and \\backslashes\\ and newlines\n',
        note: 'Description with\ttabs and\r\nline breaks'
      };

      const result = await JXABridge.execScriptFile('create-task', paramsWithSpecialChars);

      expect(result.success).toBe(true);
      const calledScript = mockExecSync.mock.calls[0][0] as string;
      expect(calledScript).toContain('\\"quotes\\"');
      expect(calledScript).toContain('\\\\backslashes\\\\');
    });
  });

  describe('Response Parsing', () => {
    it('should handle empty responses', async () => {
      mockReadFile.mockResolvedValue('mock script content');
      mockExecSync.mockReturnValue('');

      const result = await JXABridge.execScriptFile('get-all-tasks');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle non-JSON text responses', async () => {
      mockReadFile.mockResolvedValue('mock script content');
      mockExecSync.mockReturnValue('Simple text response');

      const result = await JXABridge.execScriptFile('get-database-info');

      expect(result.success).toBe(true);
      expect(result.data).toBe('Simple text response');
    });

    it('should handle malformed JSON gracefully', async () => {
      mockReadFile.mockResolvedValue('mock script content');
      mockExecSync.mockReturnValue('{ invalid json }');

      const result = await JXABridge.execScriptFile('get-all-tasks');

      expect(result.success).toBe(true);
      expect(result.data).toBe('{ invalid json }');
    });
  });
});
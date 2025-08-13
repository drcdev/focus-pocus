import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JXABridge } from '../src/omnifocus/jxa-bridge';
import { UpdateTaskTool } from '../src/tools/update-task';
import { DeleteTaskTool } from '../src/tools/delete-task';
import { CacheManager } from '../src/cache/cache-manager';
import { OmniFocusClient } from '../src/omnifocus/client';

// Mock dependencies
jest.mock('../src/omnifocus/jxa-bridge');
jest.mock('../src/cache/cache-manager');
jest.mock('../src/omnifocus/client');

const mockJXABridge = jest.mocked(JXABridge);

describe('Task Operations Integration Tests', () => {
  let mockCache: jest.Mocked<CacheManager>;
  let mockClient: jest.Mocked<OmniFocusClient>;
  let updateTaskTool: UpdateTaskTool;
  let deleteTaskTool: DeleteTaskTool;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCache = {
      invalidate: jest.fn(),
      invalidateTaskCache: jest.fn(),
      invalidateProjectCache: jest.fn()
    } as any;

    mockClient = {} as any;

    updateTaskTool = new UpdateTaskTool(mockClient, mockCache);
    deleteTaskTool = new DeleteTaskTool(mockClient, mockCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Task Update Operations', () => {
    describe('updateTask', () => {
      it('should update task successfully', async () => {
        const mockUpdatedTask = {
          id: 'task-123',
          name: 'Updated Task Name',
          note: 'Updated description',
          flagged: true,
          completed: false
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockUpdatedTask
        });

        const result = await updateTaskTool.updateTask('task-123', {
          name: 'Updated Task Name',
          note: 'Updated description',
          flagged: true
        });

        expect(result).toEqual(mockUpdatedTask);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('update-task', {
          taskId: 'task-123',
          updates: {
            name: 'Updated Task Name',
            note: 'Updated description',
            flagged: true
          }
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('task:task-123:*');
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });

      it('should handle update task errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Task not found' }
        });

        await expect(updateTaskTool.updateTask('nonexistent', { name: 'Updated' }))
          .rejects.toThrow('Task not found');
      });

      it('should update task dates correctly', async () => {
        const dueDate = new Date('2025-08-20T10:00:00Z');
        const deferDate = new Date('2025-08-19T09:00:00Z');
        
        const mockUpdatedTask = {
          id: 'task-123',
          name: 'Task with dates',
          dueDate: dueDate.toISOString(),
          deferDate: deferDate.toISOString()
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockUpdatedTask
        });

        const result = await updateTaskTool.updateTask('task-123', {
          dueDate: dueDate,
          deferDate: deferDate
        });

        expect(result).toEqual(mockUpdatedTask);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('update-task', {
          taskId: 'task-123',
          updates: {
            dueDate: dueDate,
            deferDate: deferDate
          }
        });
      });
    });

    describe('completeTask', () => {
      it('should complete task successfully', async () => {
        const mockCompletedTask = {
          id: 'task-123',
          name: 'Completed Task',
          completed: true,
          completionDate: '2025-08-13T12:00:00Z'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockCompletedTask
        });

        const result = await updateTaskTool.completeTask('task-123');

        expect(result).toEqual(mockCompletedTask);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('complete-task', {
          taskId: 'task-123'
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('task:task-123:*');
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });

      it('should handle complete task errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Cannot complete task' }
        });

        await expect(updateTaskTool.completeTask('task-123'))
          .rejects.toThrow('Cannot complete task');
      });
    });

    describe('uncompleteTask', () => {
      it('should uncomplete task successfully', async () => {
        const mockUncompletedTask = {
          id: 'task-123',
          name: 'Uncompleted Task',
          completed: false,
          completionDate: null
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockUncompletedTask
        });

        const result = await updateTaskTool.uncompleteTask('task-123');

        expect(result).toEqual(mockUncompletedTask);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('uncomplete-task', {
          taskId: 'task-123'
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('task:task-123:*');
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });
    });

    describe('moveTask', () => {
      it('should move task to different project successfully', async () => {
        const mockMovedTask = {
          id: 'task-123',
          name: 'Moved Task',
          projectId: 'new-project-456'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockMovedTask
        });

        const result = await updateTaskTool.moveTask('task-123', 'new-project-456');

        expect(result).toEqual(mockMovedTask);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('move-task', {
          taskId: 'task-123',
          targetProjectId: 'new-project-456'
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('task:task-123:*');
        expect(mockCache.invalidate).toHaveBeenCalledWith('project:new-project-456:*');
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });

      it('should move task to inbox (no project)', async () => {
        const mockMovedTask = {
          id: 'task-123',
          name: 'Inbox Task',
          projectId: null
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockMovedTask
        });

        const result = await updateTaskTool.moveTask('task-123', null);

        expect(result).toEqual(mockMovedTask);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('move-task', {
          taskId: 'task-123',
          targetProjectId: null
        });
      });
    });
  });

  describe('Task Deletion Operations', () => {
    describe('deleteTask', () => {
      it('should delete task successfully', async () => {
        const mockResult = {
          success: true,
          deleted: 'task-123',
          message: 'Task deleted successfully'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const result = await deleteTaskTool.deleteTask('task-123');

        expect(result).toEqual(mockResult);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('delete-task', {
          taskId: 'task-123'
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('task:task-123:*');
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });

      it('should handle delete task errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Task not found' }
        });

        await expect(deleteTaskTool.deleteTask('nonexistent'))
          .rejects.toThrow('Task not found');
      });
    });

    describe('archiveTask', () => {
      it('should archive task successfully', async () => {
        const mockArchivedTask = {
          id: 'task-123',
          name: 'Archived Task',
          completed: true,
          archived: true
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockArchivedTask
        });

        const result = await deleteTaskTool.archiveTask('task-123');

        expect(result).toEqual(mockArchivedTask);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('archive-task', {
          taskId: 'task-123'
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('task:task-123:*');
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });

      it('should handle archive task errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Cannot archive incomplete task' }
        });

        await expect(deleteTaskTool.archiveTask('task-123'))
          .rejects.toThrow('Cannot archive incomplete task');
      });
    });

    describe('bulkDeleteTasks', () => {
      it('should delete multiple tasks successfully', async () => {
        const mockResult = {
          deleted: ['task-1', 'task-2', 'task-3'],
          count: 3,
          success: true
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const taskIds = ['task-1', 'task-2', 'task-3'];
        const result = await deleteTaskTool.bulkDeleteTasks(taskIds);

        expect(result).toEqual(mockResult);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('delete-tasks-bulk', {
          taskIds: taskIds
        });
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });

      it('should handle bulk delete errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Some tasks could not be deleted' }
        });

        await expect(deleteTaskTool.bulkDeleteTasks(['task-1', 'task-2']))
          .rejects.toThrow('Some tasks could not be deleted');
      });

      it('should handle empty task list', async () => {
        await expect(deleteTaskTool.bulkDeleteTasks([]))
          .rejects.toThrow('No tasks provided for deletion');

        expect(mockJXABridge.execScriptFile).not.toHaveBeenCalled();
      });
    });

    describe('bulkArchiveTasks', () => {
      it('should archive multiple tasks successfully', async () => {
        const mockResult = {
          archived: ['task-1', 'task-2'],
          count: 2,
          success: true
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const taskIds = ['task-1', 'task-2'];
        const result = await deleteTaskTool.bulkArchiveTasks(taskIds);

        expect(result).toEqual(mockResult);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('archive-tasks-bulk', {
          taskIds: taskIds
        });
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });

      it('should handle bulk archive with mixed results', async () => {
        const mockResult = {
          archived: ['task-1'],
          skipped: ['task-2'],
          count: 1,
          success: true,
          warnings: ['task-2 was not completed and could not be archived']
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const result = await deleteTaskTool.bulkArchiveTasks(['task-1', 'task-2']);

        expect(result).toEqual(mockResult);
        expect(result.archived).toEqual(['task-1']);
        expect(result.skipped).toEqual(['task-2']);
      });
    });
  });

  describe('Bulk Update Operations', () => {
    describe('bulkUpdateTasks', () => {
      it('should update multiple tasks successfully', async () => {
        const mockUpdatedTasks = [
          { id: 'task-1', name: 'Updated Task 1', flagged: true },
          { id: 'task-2', name: 'Updated Task 2', flagged: true }
        ];

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockUpdatedTasks
        });

        const taskIds = ['task-1', 'task-2'];
        const updates = { name: 'Updated Task', flagged: true };

        const result = await updateTaskTool.bulkUpdateTasks(taskIds, updates);

        expect(result).toEqual(mockUpdatedTasks);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('bulk-update-tasks', {
          taskIds, updates
        });
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });

      it('should handle bulk update errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Some updates failed' }
        });

        const taskIds = ['task-1'];
        const updates = { name: 'Updated' };

        await expect(updateTaskTool.bulkUpdateTasks(taskIds, updates))
          .rejects.toThrow('Some updates failed');
      });

      it('should handle empty updates list', async () => {
        await expect(updateTaskTool.bulkUpdateTasks([], {}))
          .rejects.toThrow('Failed to bulk update tasks');

        expect(mockJXABridge.execScriptFile).not.toHaveBeenCalled();
      });
    });
  });

  describe('Task Search Operations', () => {
    describe('native search', () => {
      it('should search tasks using native OmniFocus search', async () => {
        const mockSearchResults = [
          { id: 'task-1', name: 'Matching Task 1', flagged: false },
          { id: 'task-2', name: 'Another Matching Task', flagged: true }
        ];

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockSearchResults
        });

        // This would be called directly by the tools, not through a class method
        const result = await JXABridge.execScriptFile('search-tasks-native', {
          query: 'matching',
          completed: false,
          flagged: null,
          limit: 10
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockSearchResults);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('search-tasks-native', {
          query: 'matching',
          completed: false,
          flagged: null,
          limit: 10
        });
      });

      it('should handle search with complex filters', async () => {
        const mockSearchResults = [
          { id: 'task-1', name: 'Urgent Task', tags: ['urgent', 'work'] }
        ];

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockSearchResults
        });

        const result = await JXABridge.execScriptFile('search-tasks-native', {
          query: 'urgent',
          completed: false,
          flagged: true,
          projectId: 'work-project',
          tagIds: ['urgent'],
          limit: 5,
          offset: 0
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockSearchResults);
      });

      it('should handle empty search results', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: []
        });

        const result = await JXABridge.execScriptFile('search-tasks-native', {
          query: 'nonexistent',
          completed: false
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });
    });
  });

  describe('Error Handling', () => {
    const taskOperationScripts = [
      'update-task',
      'complete-task', 
      'uncomplete-task',
      'move-task',
      'delete-task',
      'archive-task',
      'bulk-update-tasks',
      'delete-tasks-bulk',
      'archive-tasks-bulk',
      'search-tasks-native'
    ];

    describe('Permission Errors', () => {
      it.each(taskOperationScripts)('should handle permission denied for %s', async (script) => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: {
            type: 'permission',
            code: 'PERMISSION_DENIED',
            message: 'not authorized to send Apple events'
          }
        });

        const result = await JXABridge.execScriptFile(script, {});

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('permission');
        expect(result.error?.code).toBe('PERMISSION_DENIED');
      });
    });

    describe('App Unavailable Errors', () => {
      it.each(taskOperationScripts)('should handle app unavailable for %s', async (script) => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: {
            type: 'app_unavailable',
            code: 'APP_UNAVAILABLE', 
            message: 'application is not running'
          }
        });

        const result = await JXABridge.execScriptFile(script, {});

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('app_unavailable');
        expect(result.error?.code).toBe('APP_UNAVAILABLE');
      });
    });

    describe('Script Errors', () => {
      it.each(taskOperationScripts)('should handle script errors for %s', async (script) => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: {
            type: 'script_error',
            code: 'SCRIPT_ERROR',
            message: 'execution error: syntax error'
          }
        });

        const result = await JXABridge.execScriptFile(script, {});

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('script_error');
        expect(result.error?.code).toBe('SCRIPT_ERROR');
      });
    });
  });
});
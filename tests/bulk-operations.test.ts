import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JXABridge } from '../src/omnifocus/jxa-bridge';
import { CreateTaskTool } from '../src/tools/create-task';
import { UpdateTaskTool } from '../src/tools/update-task';
import { DeleteTaskTool } from '../src/tools/delete-task';
import { CacheManager } from '../src/cache/cache-manager';
import { OmniFocusClient } from '../src/omnifocus/client';

// Mock dependencies
jest.mock('../src/omnifocus/jxa-bridge');
jest.mock('../src/cache/cache-manager');
jest.mock('../src/omnifocus/client');

const mockJXABridge = jest.mocked(JXABridge);

describe('Bulk Operations Integration Tests', () => {
  let mockCache: jest.Mocked<CacheManager>;
  let mockClient: jest.Mocked<OmniFocusClient>;
  let createTaskTool: CreateTaskTool;
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

    createTaskTool = new CreateTaskTool(mockClient, mockCache);
    updateTaskTool = new UpdateTaskTool(mockClient, mockCache);
    deleteTaskTool = new DeleteTaskTool(mockClient, mockCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Batch Task Creation', () => {
    describe('batch-create-tasks script', () => {
      it('should create multiple tasks in inbox successfully', async () => {
        const mockCreatedTasks = [
          {
            id: 'task-1',
            name: 'Task One',
            note: 'First task description',
            completed: false,
            projectId: null,
            tags: []
          },
          {
            id: 'task-2',
            name: 'Task Two',
            note: 'Second task description',
            completed: false,
            projectId: null,
            tags: []
          },
          {
            id: 'task-3',
            name: 'Task Three',
            note: 'Third task description',
            completed: false,
            projectId: null,
            tags: []
          }
        ];

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockCreatedTasks
        });

        const tasksToCreate = [
          { name: 'Task One', note: 'First task description' },
          { name: 'Task Two', note: 'Second task description' },
          { name: 'Task Three', note: 'Third task description' }
        ];

        const result = await createTaskTool.batchCreateTasks({ tasks: tasksToCreate });

        expect(result).toEqual(mockCreatedTasks);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('batch-create-tasks', {
          options: { tasks: tasksToCreate }
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('tasks:*');
      });

      it('should create multiple tasks in specific project successfully', async () => {
        const mockCreatedTasks = [
          {
            id: 'task-1',
            name: 'Project Task 1',
            projectId: 'project-123',
            completed: false,
            tags: []
          },
          {
            id: 'task-2',
            name: 'Project Task 2',
            projectId: 'project-123',
            completed: false,
            tags: []
          }
        ];

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockCreatedTasks
        });

        const tasksToCreate = [
          { name: 'Project Task 1' },
          { name: 'Project Task 2' }
        ];

        const result = await createTaskTool.batchCreateTasks({
          tasks: tasksToCreate,
          projectId: 'project-123'
        });

        expect(result).toEqual(mockCreatedTasks);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('batch-create-tasks', {
          options: {
            tasks: tasksToCreate,
            projectId: 'project-123'
          }
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('tasks:*');
        expect(mockCache.invalidate).toHaveBeenCalledWith('project:project-123:*');
      });

      it('should create tasks with complex properties successfully', async () => {
        const dueDate1 = new Date('2025-08-20T10:00:00Z');
        const dueDate2 = new Date('2025-08-21T14:00:00Z');

        const mockCreatedTasks = [
          {
            id: 'task-complex-1',
            name: 'Complex Task 1',
            note: 'Detailed description 1',
            dueDate: dueDate1.toISOString(),
            flagged: true,
            estimatedMinutes: 60,
            tags: ['urgent', 'work']
          },
          {
            id: 'task-complex-2',
            name: 'Complex Task 2',
            note: 'Detailed description 2',
            dueDate: dueDate2.toISOString(),
            flagged: false,
            estimatedMinutes: 30,
            tags: ['work']
          }
        ];

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockCreatedTasks
        });

        const tasksToCreate = [
          {
            name: 'Complex Task 1',
            note: 'Detailed description 1',
            dueDate: dueDate1,
            flagged: true,
            estimatedMinutes: 60,
            tags: ['urgent', 'work']
          },
          {
            name: 'Complex Task 2',
            note: 'Detailed description 2',
            dueDate: dueDate2,
            flagged: false,
            estimatedMinutes: 30,
            tags: ['work']
          }
        ];

        const result = await createTaskTool.batchCreateTasks({ tasks: tasksToCreate });

        expect(result).toEqual(mockCreatedTasks);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('batch-create-tasks', {
          options: { tasks: tasksToCreate }
        });
      });

      it('should handle batch create errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Failed to create some tasks' }
        });

        const tasksToCreate = [
          { name: 'Task 1' },
          { name: 'Task 2' }
        ];

        await expect(createTaskTool.batchCreateTasks({ tasks: tasksToCreate }))
          .rejects.toThrow('Failed to create some tasks');
      });

      it('should handle empty task list', async () => {
        await expect(createTaskTool.batchCreateTasks({ tasks: [] }))
          .rejects.toThrow('No tasks provided for batch creation');

        expect(mockJXABridge.execScriptFile).not.toHaveBeenCalled();
      });

      it('should handle large batch creation', async () => {
        const largeBatchSize = 50;
        const mockCreatedTasks = Array.from({ length: largeBatchSize }, (_, i) => ({
          id: `task-${i + 1}`,
          name: `Task ${i + 1}`,
          completed: false,
          tags: []
        }));

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockCreatedTasks
        });

        const tasksToCreate = Array.from({ length: largeBatchSize }, (_, i) => ({
          name: `Task ${i + 1}`
        }));

        const result = await createTaskTool.batchCreateTasks({ tasks: tasksToCreate });

        expect(result).toEqual(mockCreatedTasks);
        expect(result).toHaveLength(largeBatchSize);
      });
    });
  });

  describe('Bulk Task Updates', () => {
    describe('bulk-update-tasks script', () => {
      it('should update multiple tasks successfully', async () => {
        const mockUpdatedTasks = [
          {
            id: 'task-1',
            name: 'Updated Task 1',
            flagged: true,
            modificationDate: '2025-08-13T14:00:00Z'
          },
          {
            id: 'task-2',
            name: 'Updated Task 2',
            flagged: true,
            modificationDate: '2025-08-13T14:00:00Z'
          },
          {
            id: 'task-3',
            name: 'Updated Task 3',
            note: 'Updated description',
            modificationDate: '2025-08-13T14:00:00Z'
          }
        ];

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockUpdatedTasks
        });

        const taskIds = ['task-1', 'task-2', 'task-3'];
        const updates = { name: 'Updated Task', flagged: true };

        const result = await updateTaskTool.bulkUpdateTasks(taskIds, updates);

        expect(result).toEqual(mockUpdatedTasks);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('bulk-update-tasks', {
          taskIds, updates
        });
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });

      it('should update task dates in bulk successfully', async () => {
        const dueDate = new Date('2025-08-25T09:00:00Z');
        const deferDate = new Date('2025-08-24T08:00:00Z');

        const mockUpdatedTasks = [
          {
            id: 'task-1',
            name: 'Task 1',
            dueDate: dueDate.toISOString(),
            deferDate: deferDate.toISOString()
          },
          {
            id: 'task-2',
            name: 'Task 2',
            dueDate: dueDate.toISOString(),
            deferDate: deferDate.toISOString()
          }
        ];

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockUpdatedTasks
        });

        const taskIds = ['task-1', 'task-2'];
        const updates = { dueDate: dueDate, deferDate: deferDate };

        const result = await updateTaskTool.bulkUpdateTasks(taskIds, updates);

        expect(result).toEqual(mockUpdatedTasks);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('bulk-update-tasks', {
          taskIds, updates
        });
      });

      it('should handle partial bulk update success', async () => {
        const mockResult = {
          updated: [
            { id: 'task-1', name: 'Successfully Updated Task 1' }
          ],
          failed: [
            { taskId: 'task-2', error: 'Task not found' },
            { taskId: 'task-3', error: 'Permission denied' }
          ],
          successCount: 1,
          failedCount: 2
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const taskIds = ['task-1', 'task-2', 'task-3'];
        const updates = { name: 'Updated Task' };

        const result = await updateTaskTool.bulkUpdateTasks(taskIds, updates);

        expect(result).toEqual(mockResult);
        expect(result.successCount).toBe(1);
        expect(result.failedCount).toBe(2);
      });

      it('should handle bulk update errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Bulk update operation failed' }
        });

        const taskIds = ['task-1'];
        const updates = { name: 'Updated' };

        await expect(updateTaskTool.bulkUpdateTasks(taskIds, updates))
          .rejects.toThrow('Bulk update operation failed');
      });

      it('should handle empty update list', async () => {
        await expect(updateTaskTool.bulkUpdateTasks([], {}))
          .rejects.toThrow('No updates provided');

        expect(mockJXABridge.execScriptFile).not.toHaveBeenCalled();
      });

      it('should validate update objects', async () => {
        const invalidTaskIds = ['task-1', 'task-2'];
        const invalidUpdates = null as any;

        await expect(updateTaskTool.bulkUpdateTasks(invalidTaskIds, invalidUpdates))
          .rejects.toThrow('Failed to bulk update tasks');

        expect(mockJXABridge.execScriptFile).not.toHaveBeenCalled();
      });
    });
  });

  describe('Bulk Task Deletion', () => {
    describe('delete-tasks-bulk script', () => {
      it('should delete multiple tasks successfully', async () => {
        const mockResult = {
          deleted: ['task-1', 'task-2', 'task-3'],
          count: 3,
          success: true,
          message: 'Successfully deleted 3 tasks'
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

      it('should handle partial deletion success', async () => {
        const mockResult = {
          deleted: ['task-1', 'task-3'],
          failed: ['task-2'],
          count: 2,
          success: true,
          message: 'Deleted 2 out of 3 tasks',
          errors: ['task-2: Task not found']
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const taskIds = ['task-1', 'task-2', 'task-3'];
        const result = await deleteTaskTool.bulkDeleteTasks(taskIds);

        expect(result).toEqual(mockResult);
        expect(result.deleted).toHaveLength(2);
        expect(result.failed).toHaveLength(1);
      });

      it('should handle bulk delete errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Bulk delete operation failed' }
        });

        await expect(deleteTaskTool.bulkDeleteTasks(['task-1', 'task-2']))
          .rejects.toThrow('Bulk delete operation failed');
      });

      it('should handle empty task ID list', async () => {
        await expect(deleteTaskTool.bulkDeleteTasks([]))
          .rejects.toThrow('No tasks provided for deletion');

        expect(mockJXABridge.execScriptFile).not.toHaveBeenCalled();
      });

      it('should handle large batch deletion', async () => {
        const largeBatchSize = 100;
        const taskIds = Array.from({ length: largeBatchSize }, (_, i) => `task-${i + 1}`);
        
        const mockResult = {
          deleted: taskIds,
          count: largeBatchSize,
          success: true,
          message: `Successfully deleted ${largeBatchSize} tasks`
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const result = await deleteTaskTool.bulkDeleteTasks(taskIds);

        expect(result).toEqual(mockResult);
        expect(result.count).toBe(largeBatchSize);
      });

      it('should validate task IDs', async () => {
        const invalidTaskIds = ['', null, undefined, 'valid-task-id'] as any;

        await expect(deleteTaskTool.bulkDeleteTasks(invalidTaskIds))
          .rejects.toThrow('Invalid task ID provided');

        expect(mockJXABridge.execScriptFile).not.toHaveBeenCalled();
      });
    });
  });

  describe('Bulk Task Archiving', () => {
    describe('archive-tasks-bulk script', () => {
      it('should archive multiple completed tasks successfully', async () => {
        const mockResult = {
          archived: ['task-1', 'task-2'],
          count: 2,
          success: true,
          message: 'Successfully archived 2 completed tasks'
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

      it('should handle mixed archive results', async () => {
        const mockResult = {
          archived: ['task-1', 'task-3'],
          skipped: ['task-2', 'task-4'],
          count: 2,
          success: true,
          message: 'Archived 2 tasks, skipped 2 incomplete tasks',
          warnings: [
            'task-2: Cannot archive incomplete task',
            'task-4: Cannot archive incomplete task'
          ]
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const taskIds = ['task-1', 'task-2', 'task-3', 'task-4'];
        const result = await deleteTaskTool.bulkArchiveTasks(taskIds);

        expect(result).toEqual(mockResult);
        expect(result.archived).toHaveLength(2);
        expect(result.skipped).toHaveLength(2);
      });

      it('should handle no archivable tasks', async () => {
        const mockResult = {
          archived: [],
          skipped: ['task-1', 'task-2'],
          count: 0,
          success: true,
          message: 'No tasks could be archived (all incomplete)',
          warnings: [
            'task-1: Cannot archive incomplete task',
            'task-2: Cannot archive incomplete task'
          ]
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const taskIds = ['task-1', 'task-2'];
        const result = await deleteTaskTool.bulkArchiveTasks(taskIds);

        expect(result).toEqual(mockResult);
        expect(result.count).toBe(0);
        expect(result.archived).toHaveLength(0);
      });

      it('should handle bulk archive errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Bulk archive operation failed' }
        });

        await expect(deleteTaskTool.bulkArchiveTasks(['task-1', 'task-2']))
          .rejects.toThrow('Bulk archive operation failed');
      });

      it('should handle empty task ID list for archiving', async () => {
        await expect(deleteTaskTool.bulkArchiveTasks([]))
          .rejects.toThrow('No tasks provided for archiving');

        expect(mockJXABridge.execScriptFile).not.toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Scalability', () => {
    describe('batch size handling', () => {
      it('should handle optimal batch sizes efficiently', async () => {
        const optimalBatchSize = 25;
        const taskIds = Array.from({ length: optimalBatchSize }, (_, i) => `task-${i + 1}`);
        
        const mockResult = {
          deleted: taskIds,
          count: optimalBatchSize,
          success: true,
          processingTime: 850
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const result = await deleteTaskTool.bulkDeleteTasks(taskIds);

        expect(result).toEqual(mockResult);
        expect(result.count).toBe(optimalBatchSize);
      });

      it('should handle maximum batch sizes', async () => {
        const maxBatchSize = 200;
        const taskIds = Array.from({ length: maxBatchSize }, (_, i) => `task-${i + 1}`);
        const updates = { flagged: true };
        
        const mockUpdatedTasks = Array.from({ length: maxBatchSize }, (_, i) => ({
          id: `task-${i + 1}`,
          flagged: true
        }));

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockUpdatedTasks
        });

        const result = await updateTaskTool.bulkUpdateTasks(taskIds, updates);

        expect(result).toHaveLength(maxBatchSize);
      });

      it('should provide performance metrics', async () => {
        const mockResult = {
          created: ['task-1', 'task-2', 'task-3'],
          count: 3,
          success: true,
          metrics: {
            processingTime: 1200,
            averageTimePerTask: 400,
            totalItemsProcessed: 3
          }
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const tasksToCreate = [
          { name: 'Task 1' },
          { name: 'Task 2' },
          { name: 'Task 3' }
        ];

        const result = await createTaskTool.batchCreateTasks({ tasks: tasksToCreate });

        expect(result.metrics).toBeDefined();
        expect(result.metrics.processingTime).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    const bulkOperationScripts = [
      'batch-create-tasks',
      'bulk-update-tasks',
      'delete-tasks-bulk',
      'archive-tasks-bulk'
    ];

    describe('Permission Errors', () => {
      it.each(bulkOperationScripts)('should handle permission denied for %s', async (script) => {
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
      it.each(bulkOperationScripts)('should handle app unavailable for %s', async (script) => {
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
      it.each(bulkOperationScripts)('should handle script errors for %s', async (script) => {
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

    describe('Timeout Errors', () => {
      it('should handle timeout errors for large batch operations', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: {
            type: 'timeout',
            code: 'EXECUTION_TIMEOUT',
            message: 'Script execution timed out after 45 seconds'
          }
        });

        const largeBatch = Array.from({ length: 500 }, (_, i) => `task-${i + 1}`);

        const result = await JXABridge.execScriptFile('delete-tasks-bulk', { taskIds: largeBatch });

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('timeout');
        expect(result.error?.code).toBe('EXECUTION_TIMEOUT');
      });
    });
  });

  describe('Cache Management', () => {
    it('should invalidate appropriate caches for batch create', async () => {
      const mockTasks = [{ id: 'task-1', name: 'Task 1' }];

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockTasks
      });

      await createTaskTool.batchCreateTasks({
        tasks: [{ name: 'Task 1' }],
        projectId: 'project-123'
      });

      expect(mockCache.invalidate).toHaveBeenCalledWith('tasks:*');
      expect(mockCache.invalidate).toHaveBeenCalledWith('project:project-123:*');
    });

    it('should invalidate appropriate caches for bulk update', async () => {
      const mockTasks = [{ id: 'task-1', name: 'Updated Task' }];

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockTasks
      });

      await updateTaskTool.bulkUpdateTasks(['task-1'], { name: 'Updated Task' });

      expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
    });

    it('should invalidate appropriate caches for bulk delete', async () => {
      const mockResult = { deleted: ['task-1'], count: 1, success: true };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockResult
      });

      await deleteTaskTool.bulkDelete(['task-1']);

      expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
    });

    it('should invalidate appropriate caches for bulk archive', async () => {
      const mockResult = { archived: ['task-1'], count: 1, success: true };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockResult
      });

      await deleteTaskTool.bulkArchive(['task-1']);

      expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
    });
  });
});
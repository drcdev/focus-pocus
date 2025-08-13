import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CreateTaskTool } from '../src/tools/create-task';
import { OmniFocusClient } from '../src/omnifocus/client';
import { CacheManager } from '../src/cache/cache-manager';
import { JXABridge } from '../src/omnifocus/jxa-bridge';
import { CreateTaskOptions } from '../src/omnifocus/types';

// Mock dependencies
jest.mock('../src/omnifocus/client');
jest.mock('../src/cache/cache-manager');
jest.mock('../src/omnifocus/jxa-bridge');

const mockJXABridge = jest.mocked(JXABridge);

describe('CreateTaskTool', () => {
  let createTaskTool: CreateTaskTool;
  let mockClient: jest.Mocked<OmniFocusClient>;
  let mockCache: jest.Mocked<CacheManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockClient = {} as any;

    mockCache = {
      invalidate: jest.fn(),
      invalidateTaskCache: jest.fn()
    } as any;

    createTaskTool = new CreateTaskTool(mockClient, mockCache);
  });

  describe('createTask', () => {
    it('should create a basic task', async () => {
      const mockTaskResult = {
        id: 'task-123',
        name: 'Test Task',
        note: '',
        completed: false,
        completionDate: null,
        dueDate: null,
        deferDate: null,
        flagged: false,
        estimatedMinutes: null,
        projectId: null,
        tags: []
      };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockTaskResult
      });

      const options: CreateTaskOptions = {
        name: 'Test Task'
      };

      const result = await createTaskTool.createTask(options);

      expect(result).toEqual(mockTaskResult);
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('create-task', {
        options: { name: 'Test Task' }
      });
      expect(mockCache.invalidate).toHaveBeenCalledWith('tasks:*');
    });

    it('should create a task with all properties', async () => {
      const dueDate = new Date('2025-08-15T10:00:00.000Z');
      const deferDate = new Date('2025-08-14T09:00:00.000Z');
      
      const mockTaskResult = {
        id: 'task-456',
        name: 'Complete Task',
        note: 'Task description',
        completed: false,
        completionDate: null,
        dueDate: dueDate.toISOString(),
        deferDate: deferDate.toISOString(),
        flagged: true,
        estimatedMinutes: 60,
        projectId: 'project-123',
        tags: [{ id: 'tag-1', name: 'urgent' }]
      };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockTaskResult
      });

      const options: CreateTaskOptions = {
        name: 'Complete Task',
        note: 'Task description',
        dueDate: dueDate,
        deferDate: deferDate,
        flagged: true,
        estimatedMinutes: 60,
        projectId: 'project-123',
        tags: ['tag-1']
      };

      const result = await createTaskTool.createTask(options);

      expect(result).toEqual(mockTaskResult);
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('create-task-in-project', {
        options: {
          name: 'Complete Task',
          note: 'Task description',
          dueDate: dueDate,
          deferDate: deferDate,
          flagged: true,
          estimatedMinutes: 60,
          projectId: 'project-123',
          tags: ['tag-1']
        }
      });
      
      expect(mockCache.invalidate).toHaveBeenCalledWith('tasks:*');
      expect(mockCache.invalidate).toHaveBeenCalledWith('project:project-123:*');
    });

    it('should handle string escaping in task names', async () => {
      const mockTaskResult = {
        id: 'task-789',
        name: 'Task with "quotes" and \\backslashes',
        note: '',
        completed: false,
        tags: []
      };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockTaskResult
      });

      const options: CreateTaskOptions = {
        name: 'Task with "quotes" and \\backslashes'
      };

      const result = await createTaskTool.createTask(options);

      expect(result).toEqual(mockTaskResult);
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('create-task', {
        options: { name: 'Task with "quotes" and \\backslashes' }
      });
    });

    it('should handle task creation errors', async () => {
      mockJXABridge.execScriptFile.mockResolvedValue({
        success: false,
        error: { message: 'OmniFocus connection failed' }
      });

      const options: CreateTaskOptions = {
        name: 'Failed Task'
      };

      await expect(createTaskTool.createTask(options)).rejects.toThrow(
        'OmniFocus connection failed'
      );
    });
  });

  describe('createTaskInProject', () => {
    it('should create task in specified project', async () => {
      const mockTaskResult = {
        id: 'task-project',
        name: 'Project Task',
        projectId: 'project-456',
        tags: []
      };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockTaskResult
      });

      const result = await createTaskTool.createTaskInProject('project-456', {
        name: 'Project Task',
        note: 'Task in project'
      });

      expect(result).toEqual(mockTaskResult);
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('create-task-in-project', {
        options: {
          name: 'Project Task',
          note: 'Task in project',
          projectId: 'project-456'
        }
      });
    });
  });

  describe('createSubtask', () => {
    it('should create subtask under parent task', async () => {
      const mockSubtaskResult = {
        id: 'subtask-123',
        name: 'Subtask',
        parentId: 'parent-task-123',
        tags: []
      };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockSubtaskResult
      });

      const result = await createTaskTool.createSubtask('parent-task-123', {
        name: 'Subtask',
        note: 'This is a subtask'
      });

      expect(result).toEqual(mockSubtaskResult);
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('create-subtask', {
        parentTaskId: 'parent-task-123',
        options: {
          name: 'Subtask',
          note: 'This is a subtask'
        }
      });
    });
  });

  describe('batchCreateTasks', () => {
    it('should create multiple tasks', async () => {
      const mockBatchResult = [
        { id: 'task-1', name: 'Task 1', tags: [] },
        { id: 'task-2', name: 'Task 2', tags: [] },
        { id: 'task-3', name: 'Task 3', tags: [] }
      ];

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockBatchResult
      });

      const tasks = [
        { name: 'Task 1', note: 'First task' },
        { name: 'Task 2', note: 'Second task' },
        { name: 'Task 3', note: 'Third task' }
      ];

      const result = await createTaskTool.batchCreateTasks({ tasks });

      expect(result).toEqual(mockBatchResult);
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('batch-create-tasks', {
        options: { tasks }
      });
    });

    it('should create multiple tasks in project', async () => {
      const mockBatchResult = [
        { id: 'task-1', name: 'Task 1', projectId: 'project-123', tags: [] },
        { id: 'task-2', name: 'Task 2', projectId: 'project-123', tags: [] }
      ];

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockBatchResult
      });

      const tasks = [
        { name: 'Task 1' },
        { name: 'Task 2' }
      ];

      const result = await createTaskTool.batchCreateTasks({ 
        tasks, 
        projectId: 'project-123' 
      });

      expect(result).toEqual(mockBatchResult);
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('batch-create-tasks', {
        options: { tasks, projectId: 'project-123' }
      });
    });
  });
});
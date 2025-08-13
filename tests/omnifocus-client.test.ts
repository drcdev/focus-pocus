import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { OmniFocusClient } from '../src/omnifocus/client';
import { JXABridge, JXAError } from '../src/omnifocus/jxa-bridge';
import { Task, Project, Tag, Folder, Perspective, SearchOptions } from '../src/omnifocus/types';

// Helper to create proper JXAError objects
const createJXAError = (type: JXAError['type'], code: string, message: string): JXAError => {
  const error = new Error(message) as JXAError;
  error.type = type;
  error.code = code;
  error.originalMessage = message;
  return error;
};

// Mock JXABridge
jest.mock('../src/omnifocus/jxa-bridge');
const mockJXABridge = jest.mocked(JXABridge);

// Mock cache manager
jest.mock('../src/cache/cache-manager', () => ({
  getCacheManager: jest.fn().mockReturnValue({
    generateKey: jest.fn((operation: string, params: any) => `${operation}:${JSON.stringify(params)}`),
    get: jest.fn().mockReturnValue(null), // Cache miss by default
    set: jest.fn(),
    clear: jest.fn(),
    invalidateTaskCache: jest.fn(),
    invalidateProjectCache: jest.fn(),
    getStats: jest.fn().mockReturnValue({ hits: 0, misses: 0, evictions: 0, size: 0, maxSize: 500, hitRate: 0 }),
    destroy: jest.fn()
  })
}));

describe('OmniFocusClient', () => {
  let client: OmniFocusClient;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton
    (OmniFocusClient as any).instance = null;
    client = OmniFocusClient.getInstance();
  });

  afterEach(() => {
    client.destroy();
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const client1 = OmniFocusClient.getInstance();
      const client2 = OmniFocusClient.getInstance();
      
      expect(client1).toBe(client2);
    });

    it('should create new instance after destroy', () => {
      const client1 = OmniFocusClient.getInstance();
      client1.destroy();
      const client2 = OmniFocusClient.getInstance();
      
      expect(client1).not.toBe(client2);
    });
  });

  describe('initialization', () => {
    it('should initialize successfully when OmniFocus is available', async () => {
      // Mock health check to fail first so we test the full initialization path
      mockJXABridge.checkOmniFocusAvailability.mockResolvedValueOnce(false);
      mockJXABridge.requestPermissions.mockResolvedValue(true);
      mockJXABridge.checkOmniFocusAvailability.mockResolvedValue(true);
      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: { name: 'Test Database', path: '/test/path', isDefault: true }
      });

      const result = await client.initialize();

      expect(result).toBe(true);
      expect(mockJXABridge.requestPermissions).toHaveBeenCalled();
      expect(mockJXABridge.checkOmniFocusAvailability).toHaveBeenCalled();
    });

    it('should fail when permissions are denied', async () => {
      mockJXABridge.requestPermissions.mockResolvedValue(false);

      const result = await client.initialize();

      expect(result).toBe(false);
      expect(client.getConnectionStatus().error).toContain('permissions');
    });

    it('should fail when OmniFocus is not running', async () => {
      mockJXABridge.requestPermissions.mockResolvedValue(true);
      mockJXABridge.checkOmniFocusAvailability.mockResolvedValue(false);

      const result = await client.initialize();

      expect(result).toBe(false);
      expect(client.getConnectionStatus().error).toContain('not running');
    });
  });

  describe('health check', () => {
    it('should report healthy status when all checks pass', async () => {
      mockJXABridge.checkOmniFocusAvailability.mockResolvedValue(true);
      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: { name: 'Test Database' }
      });

      const status = await client.performHealthCheck();

      expect(status.connected).toBe(true);
      expect(status.appRunning).toBe(true);
      expect(status.permissionsGranted).toBe(true);
      expect(status.error).toBeUndefined();
    });

    it('should report unhealthy when OmniFocus is not running', async () => {
      mockJXABridge.checkOmniFocusAvailability.mockResolvedValue(false);

      const status = await client.performHealthCheck();

      expect(status.connected).toBe(false);
      expect(status.appRunning).toBe(false);
      expect(status.permissionsGranted).toBe(false);
      expect(status.error).toContain('not running');
    });

    it('should report permission issues', async () => {
      mockJXABridge.checkOmniFocusAvailability.mockResolvedValue(true);
      mockJXABridge.execScriptFile.mockResolvedValue({
        success: false,
        error: createJXAError('permission', 'PERMISSION_DENIED', 'Not authorized')
      });

      const status = await client.performHealthCheck();

      expect(status.connected).toBe(false);
      expect(status.permissionsGranted).toBe(false);
      expect(status.error).toContain('Not authorized');
    });
  });

  describe('task operations', () => {
    const mockTasks: Task[] = [
      {
        id: 'task1',
        name: 'Test Task 1',
        note: 'Test note',
        completed: false,
        creationDate: new Date('2023-01-01'),
        modificationDate: new Date('2023-01-01'),
        flagged: false,
        tags: ['tag1'],
        containingProjectInfo: { id: 'proj1', name: 'Test Project', status: 'active' as any }
      },
      {
        id: 'task2', 
        name: 'Test Task 2',
        completed: true,
        completionDate: new Date('2023-01-02'),
        creationDate: new Date('2023-01-01'),
        modificationDate: new Date('2023-01-02'),
        flagged: true,
        tags: ['tag2'],
        projectId: 'proj2'
      }
    ];

    beforeEach(async () => {
      // Mock successful connection
      mockJXABridge.checkOmniFocusAvailability.mockResolvedValue(true);
      mockJXABridge.requestPermissions.mockResolvedValue(true);
      // Mock the health check that's called during connection validation
      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: { name: 'Test Database', path: '/test/path', isDefault: true }
      });
      // Initialize the client to connected state
      await client.initialize();
      // Clear any previous mock calls from initialization
      jest.clearAllMocks();
    });

    describe('getAllTasks', () => {
      it('should retrieve all tasks successfully', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockTasks
        });

        const tasks = await client.getAllTasks();

        expect(tasks).toEqual(mockTasks);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-all-tasks');
      });

      it('should handle errors from JXA script', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: createJXAError('script_error', 'SCRIPT_ERROR', 'Script failed')
        });

        await expect(client.getAllTasks()).rejects.toThrow('Script failed');
      });

      it('should use cache when available', async () => {
        const { getCacheManager } = require('../src/cache/cache-manager');
        const mockCache = getCacheManager();
        
        // First call - cache miss
        mockCache.get.mockReturnValueOnce(null);
        mockJXABridge.execScriptFile.mockResolvedValueOnce({
          success: true,
          data: mockTasks
        });

        const tasks1 = await client.getAllTasks();
        
        // Second call - cache hit
        mockCache.get.mockReturnValueOnce(mockTasks);
        
        const tasks2 = await client.getAllTasks();

        expect(tasks1).toEqual(mockTasks);
        expect(tasks2).toEqual(mockTasks);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledTimes(1); // Only called once due to cache
        expect(mockCache.set).toHaveBeenCalledWith('getAllTasks:{}', mockTasks);
      });
    });

    describe('getTaskById', () => {
      const mockTask = mockTasks[0];

      it('should retrieve task by ID successfully', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockTask
        });

        const task = await client.getTaskById('task1');

        expect(task).toEqual(mockTask);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-task-by-id', { taskId: 'task1' });
      });

      it('should return null for non-existent task', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: createJXAError('script_error', 'NOT_FOUND', 'Task not found')
        });

        const task = await client.getTaskById('nonexistent');

        expect(task).toBeNull();
      });

      it('should throw on other errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: createJXAError('script_error', 'SCRIPT_ERROR', 'Database error')
        });

        await expect(client.getTaskById('task1')).rejects.toThrow('Database error');
      });
    });

    describe('searchTasks', () => {
      const searchOptions: SearchOptions = {
        query: 'test',
        completed: false,
        flagged: true,
        limit: 10
      };

      it('should search tasks with options', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: [mockTasks[0]]
        });

        const tasks = await client.searchTasks(searchOptions);

        expect(tasks).toEqual([mockTasks[0]]);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('search-tasks', searchOptions);
      });

      it('should handle empty search results', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: []
        });

        const tasks = await client.searchTasks(searchOptions);

        expect(tasks).toEqual([]);
      });
    });
  });

  describe('project operations', () => {
    const mockProjects: Project[] = [
      {
        id: 'proj1',
        name: 'Test Project',
        status: 'active' as any,
        creationDate: new Date('2023-01-01'),
        modificationDate: new Date('2023-01-01'),
        flagged: false,
        tags: [],
        taskCount: 5,
        completedTaskCount: 2,
        remainingTaskCount: 3
      }
    ];

    beforeEach(async () => {
      mockJXABridge.checkOmniFocusAvailability.mockResolvedValue(true);
      mockJXABridge.requestPermissions.mockResolvedValue(true);
      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: { name: 'Test Database', path: '/test/path', isDefault: true }
      });
      await client.initialize();
      jest.clearAllMocks();
    });

    describe('getAllProjects', () => {
      it('should retrieve all projects successfully', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockProjects
        });

        const projects = await client.getAllProjects();

        expect(projects).toEqual(mockProjects);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-projects');
      });
    });

    describe('getProjectById', () => {
      it('should retrieve project by ID successfully', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockProjects[0]
        });

        const project = await client.getProjectById('proj1');

        expect(project).toEqual(mockProjects[0]);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-project-by-id', { projectId: 'proj1' });
      });

      it('should return null for non-existent project', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: createJXAError('script_error', 'NOT_FOUND', 'Project not found')
        });

        const project = await client.getProjectById('nonexistent');

        expect(project).toBeNull();
      });
    });
  });

  describe('other operations', () => {
    beforeEach(async () => {
      mockJXABridge.checkOmniFocusAvailability.mockResolvedValue(true);
      mockJXABridge.requestPermissions.mockResolvedValue(true);
      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: { name: 'Test Database', path: '/test/path', isDefault: true }
      });
      await client.initialize();
      jest.clearAllMocks();
    });

    it('should get all tags', async () => {
      const mockTags: Tag[] = [
        { id: 'tag1', name: 'Work', allowsNextAction: true, active: true, creationDate: new Date(), modificationDate: new Date(), usedCount: 5 }
      ];

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockTags
      });

      const tags = await client.getAllTags();

      expect(tags).toEqual(mockTags);
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-tags');
    });

    it('should get all folders', async () => {
      const mockFolders: Folder[] = [
        { id: 'folder1', name: 'Work', creationDate: new Date(), modificationDate: new Date(), projectCount: 3, subfolderCount: 1 }
      ];

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockFolders
      });

      const folders = await client.getAllFolders();

      expect(folders).toEqual(mockFolders);
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-folders');
    });

    it('should get perspectives', async () => {
      const mockPerspectives: Perspective[] = [
        { id: 'inbox', name: 'Inbox', type: 'builtin', identifier: 'inbox' }
      ];

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockPerspectives
      });

      const perspectives = await client.getPerspectives();

      expect(perspectives).toEqual(mockPerspectives);
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-perspectives');
    });

    it('should get database info', async () => {
      const mockDbInfo = { name: 'OmniFocus Database', path: '/test/path', isDefault: true };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockDbInfo
      });

      const dbInfo = await client.getDatabaseInfo();

      expect(dbInfo).toEqual(mockDbInfo);
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-database-info');
    });
  });

  describe('direct JXA script execution', () => {
    beforeEach(async () => {
      mockJXABridge.checkOmniFocusAvailability.mockResolvedValue(true);
      mockJXABridge.requestPermissions.mockResolvedValue(true);
      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: { name: 'Test Database', path: '/test/path', isDefault: true }
      });
      await client.initialize();
      jest.clearAllMocks();
    });

    it('should execute JXA script successfully', async () => {
      const mockResult = { id: 'test-result', data: 'success' };
      mockJXABridge.execSync.mockReturnValue(JSON.stringify(mockResult));

      const result = await client.executeJXA('return "test script";');

      expect(result).toEqual(mockResult);
    });

    it('should handle JXA script errors', async () => {
      mockJXABridge.execSync.mockImplementation(() => {
        throw new Error('Script execution failed');
      });

      await expect(client.executeJXA('invalid script')).rejects.toThrow('Script execution failed');
    });

    it('should use retry logic for JXA execution', async () => {
      let callCount = 0;
      mockJXABridge.execSync.mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          throw new Error('application is not running');
        }
        return JSON.stringify({ success: true });
      });

      const result = await client.executeJXA('test script');

      expect(result).toEqual({ success: true });
      expect(mockJXABridge.execSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('retry logic', () => {
    beforeEach(() => {
      // Start with disconnected state
      client.getConnectionStatus().connected = false;
    });

    it('should retry operations when connection fails', async () => {
      let callCount = 0;
      mockJXABridge.checkOmniFocusAvailability.mockImplementation(async () => {
        callCount++;
        return callCount >= 2; // Succeed on second try
      });

      mockJXABridge.execScriptFile
        .mockResolvedValueOnce({
          success: false,
          error: createJXAError('app_unavailable', 'APP_UNAVAILABLE', 'App not running')
        })
        .mockResolvedValueOnce({
          success: true,
          data: []
        });

      // Mock the connection check for health check
      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: { name: 'Test DB' }
      });

      const tasks = await client.getAllTasks();

      expect(tasks).toEqual([]);
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledTimes(3); // 1 fail + 1 success + 1 health check
    });

    it('should give up after max retries', async () => {
      mockJXABridge.execScriptFile.mockResolvedValue({
        success: false,
        error: createJXAError('app_unavailable', 'APP_UNAVAILABLE', 'App not running')
      });

      await expect(client.getAllTasks()).rejects.toThrow('App not running');
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it('should not retry on permission errors', async () => {
      mockJXABridge.execScriptFile.mockResolvedValue({
        success: false,
        error: createJXAError('permission', 'PERMISSION_DENIED', 'Not authorized')
      });

      await expect(client.getAllTasks()).rejects.toThrow('Not authorized');
      expect(mockJXABridge.execScriptFile).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('cache management', () => {
    it('should provide cache clearing', () => {
      const { getCacheManager } = require('../src/cache/cache-manager');
      const mockCache = getCacheManager();

      client.clearCache();

      expect(mockCache.clear).toHaveBeenCalled();
    });

    it('should provide task cache invalidation', () => {
      const { getCacheManager } = require('../src/cache/cache-manager');
      const mockCache = getCacheManager();

      client.invalidateTaskCache();

      expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
    });

    it('should provide project cache invalidation', () => {
      const { getCacheManager } = require('../src/cache/cache-manager');
      const mockCache = getCacheManager();

      client.invalidateProjectCache();

      expect(mockCache.invalidateProjectCache).toHaveBeenCalled();
    });

    it('should provide cache statistics', () => {
      const stats = client.getCacheStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('size');
    });
  });

  describe('cleanup', () => {
    it('should stop monitoring and destroy cache on destroy', () => {
      const { getCacheManager } = require('../src/cache/cache-manager');
      const mockCache = getCacheManager();
      
      client.destroy();

      expect(mockCache.destroy).toHaveBeenCalled();
      expect((OmniFocusClient as any).instance).toBeNull();
    });
  });
});
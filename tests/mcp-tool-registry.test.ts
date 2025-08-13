import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MCPToolRegistry } from '../src/tools/index';
import { OmniFocusClient } from '../src/omnifocus/client';
import { CacheManager } from '../src/cache/cache-manager';
import { DateHandler } from '../src/utils/date-handler';
import { SchedulingUtilities } from '../src/utils/scheduling';

// Mock dependencies
jest.mock('../src/omnifocus/client');
jest.mock('../src/cache/cache-manager');
jest.mock('../src/utils/date-handler');
jest.mock('../src/utils/scheduling');

const mockClient = jest.mocked(OmniFocusClient);
const mockCache = jest.mocked(CacheManager);
const mockDateHandler = jest.mocked(DateHandler);
const mockSchedulingUtilities = jest.mocked(SchedulingUtilities);

describe('MCPToolRegistry', () => {
  let registry: MCPToolRegistry;
  let mockClientInstance: jest.Mocked<OmniFocusClient>;
  let mockCacheInstance: jest.Mocked<CacheManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockClientInstance = {
      getAllTasks: jest.fn(),
      getTaskById: jest.fn(),
      searchTasks: jest.fn(),
      getAllProjects: jest.fn(),
      getProjectById: jest.fn(),
      getAllTags: jest.fn(),
      getAllFolders: jest.fn(),
      getPerspectives: jest.fn(),
      getDatabaseInfo: jest.fn(),
      executeJXA: jest.fn(),
      performHealthCheck: jest.fn(),
      getConnectionStatus: jest.fn()
    } as any;

    mockCacheInstance = {
      invalidateTaskCache: jest.fn(),
      invalidateProjectCache: jest.fn()
    } as any;

    registry = new MCPToolRegistry(mockClientInstance, mockCacheInstance);
  });

  describe('Tool Definitions', () => {
    it('should return all expected tool definitions', () => {
      const tools = registry.getToolDefinitions();
      
      expect(tools).toBeInstanceOf(Array);
      expect(tools.length).toBeGreaterThan(30); // Should have many tools
      
      // Check for key tool categories
      const toolNames = tools.map(t => t.name);
      
      // Read operations
      expect(toolNames).toContain('get_all_tasks');
      expect(toolNames).toContain('get_all_projects');
      expect(toolNames).toContain('search_tasks');
      
      // Task CRUD operations  
      expect(toolNames).toContain('create_task');
      expect(toolNames).toContain('update_task');
      expect(toolNames).toContain('delete_task');
      expect(toolNames).toContain('complete_task');
      
      // Project operations
      expect(toolNames).toContain('create_project');
      expect(toolNames).toContain('update_project');
      
      // Tag operations
      expect(toolNames).toContain('create_tag');
      expect(toolNames).toContain('assign_tags');
      
      // Diagnostic
      expect(toolNames).toContain('diagnose_connection');
    });

    it('should have valid schemas for all tools', () => {
      const tools = registry.getToolDefinitions();
      
      for (const tool of tools) {
        expect(tool.name).toBeDefined();
        expect(typeof tool.name).toBe('string');
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe('string');
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  describe('Read Operations', () => {
    it('should execute get_all_tasks', async () => {
      const mockTasks = [{ id: 'task1', name: 'Test Task' }];
      mockClientInstance.getAllTasks.mockResolvedValue(mockTasks as any);

      const result = await registry.executeToolCall('get_all_tasks', {});

      expect(result).toEqual(mockTasks);
      expect(mockClientInstance.getAllTasks).toHaveBeenCalledWith();
    });

    it('should execute get_all_projects', async () => {
      const mockProjects = [{ id: 'proj1', name: 'Test Project' }];
      mockClientInstance.getAllProjects.mockResolvedValue(mockProjects as any);

      const result = await registry.executeToolCall('get_all_projects', {});

      expect(result).toEqual(mockProjects);
      expect(mockClientInstance.getAllProjects).toHaveBeenCalledWith();
    });

    it('should execute search_tasks with filters', async () => {
      const mockTasks = [{ id: 'task1', name: 'Filtered Task' }];
      mockClientInstance.searchTasks.mockResolvedValue(mockTasks as any);

      const searchOptions = { query: 'test', flagged: true };
      const result = await registry.executeToolCall('search_tasks', searchOptions);

      expect(result).toEqual(mockTasks);
      expect(mockClientInstance.searchTasks).toHaveBeenCalledWith(searchOptions);
    });

    it('should execute get_task_by_id', async () => {
      const mockTask = { id: 'task1', name: 'Specific Task' };
      mockClientInstance.getTaskById.mockResolvedValue(mockTask as any);

      const result = await registry.executeToolCall('get_task_by_id', { taskId: 'task1' });

      expect(result).toEqual(mockTask);
      expect(mockClientInstance.getTaskById).toHaveBeenCalledWith('task1');
    });
  });

  describe('Diagnostic Operations', () => {
    it('should execute diagnose_connection', async () => {
      // Mock the diagnostic dependencies
      const mockConnectionStatus = {
        connected: true,
        appRunning: true,
        permissionsGranted: true,
        lastChecked: new Date(),
        error: undefined
      };
      
      mockClientInstance.getConnectionStatus.mockReturnValue(mockConnectionStatus);

      const result = await registry.executeToolCall('diagnose_connection', {});

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('checks');
      expect(Array.isArray(result.checks)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown tool names', async () => {
      await expect(
        registry.executeToolCall('nonexistent_tool', {})
      ).rejects.toThrow('Unknown tool: nonexistent_tool');
    });

    it('should wrap execution errors', async () => {
      mockClientInstance.getAllTasks.mockRejectedValue(new Error('Connection failed'));

      await expect(
        registry.executeToolCall('get_all_tasks', {})
      ).rejects.toThrow('Tool execution failed: Connection failed');
    });

    it('should handle client errors gracefully', async () => {
      mockClientInstance.getTaskById.mockResolvedValue(null);

      const result = await registry.executeToolCall('get_task_by_id', { taskId: 'nonexistent' });

      expect(result).toBeNull();
    });
  });

  describe('Date Handling Integration', () => {
    it('should parse natural language dates in handleCreateTask', async () => {
      const mockDate = new Date('2025-08-15');
      const mockDateHandlerInstance = {
        parseNaturalDate: jest.fn().mockReturnValue(mockDate)
      };
      
      // Mock the DateHandler constructor
      (DateHandler as any).mockImplementation(() => mockDateHandlerInstance);
      
      // Create a new registry to get the mocked DateHandler
      const testRegistry = new MCPToolRegistry(mockClientInstance, mockCacheInstance);
      
      const createArgs = {
        name: 'Test Task',
        dueDate: 'next Friday'
      };

      // Mock the createTask method success
      mockClientInstance.executeJXA = jest.fn().mockResolvedValue({
        id: 'task1',
        name: 'Test Task',
        dueDate: mockDate.toISOString()
      });

      const result = await testRegistry.executeToolCall('create_task', createArgs);

      expect(mockDateHandlerInstance.parseNaturalDate).toHaveBeenCalledWith('next Friday');
      expect(result).toHaveProperty('id', 'task1');
    });
  });
});
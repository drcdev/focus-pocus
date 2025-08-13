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

  describe('Task Management Operations', () => {
    beforeEach(() => {
      // Mock the JXABridge functionality that tools use directly
      mockClientInstance.executeJXA = jest.fn();
    });

    describe('Task Creation', () => {
      it('should execute create_task', async () => {
        const mockCreatedTask = {
          id: 'new-task-123',
          name: 'New Task',
          completed: false,
          creationDate: '2025-08-13T12:00:00Z'
        };

        mockClientInstance.executeJXA.mockResolvedValue(mockCreatedTask);

        const result = await registry.executeToolCall('create_task', {
          name: 'New Task',
          note: 'Task description'
        });

        expect(result).toEqual(mockCreatedTask);
        expect(mockClientInstance.executeJXA).toHaveBeenCalled();
      });

      it('should execute create_task_in_project', async () => {
        const mockCreatedTask = {
          id: 'project-task-123',
          name: 'Project Task',
          projectId: 'project-456'
        };

        mockClientInstance.executeJXA.mockResolvedValue(mockCreatedTask);

        const result = await registry.executeToolCall('create_task_in_project', {
          projectId: 'project-456',
          name: 'Project Task'
        });

        expect(result).toEqual(mockCreatedTask);
      });

      it('should execute create_subtask', async () => {
        const mockSubtask = {
          id: 'subtask-123',
          name: 'Subtask',
          parentId: 'parent-task-456'
        };

        mockClientInstance.executeJXA.mockResolvedValue(mockSubtask);

        const result = await registry.executeToolCall('create_subtask', {
          parentTaskId: 'parent-task-456',
          name: 'Subtask'
        });

        expect(result).toEqual(mockSubtask);
      });

      it('should execute batch_create_tasks', async () => {
        const mockBatchResult = [
          { id: 'task-1', name: 'Task 1' },
          { id: 'task-2', name: 'Task 2' }
        ];

        mockClientInstance.executeJXA.mockResolvedValue(mockBatchResult);

        const result = await registry.executeToolCall('batch_create_tasks', {
          tasks: [
            { name: 'Task 1' },
            { name: 'Task 2' }
          ]
        });

        expect(result).toEqual(mockBatchResult);
      });
    });

    describe('Task Updates', () => {
      it('should execute update_task', async () => {
        const mockUpdatedTask = {
          id: 'task-123',
          name: 'Updated Task Name',
          modificationDate: '2025-08-13T13:00:00Z'
        };

        mockClientInstance.executeJXA.mockResolvedValue(mockUpdatedTask);

        const result = await registry.executeToolCall('update_task', {
          taskId: 'task-123',
          name: 'Updated Task Name'
        });

        expect(result).toEqual(mockUpdatedTask);
      });

      it('should execute complete_task', async () => {
        const mockCompletedTask = {
          id: 'task-123',
          completed: true,
          completionDate: '2025-08-13T13:30:00Z'
        };

        mockClientInstance.executeJXA.mockResolvedValue(mockCompletedTask);

        const result = await registry.executeToolCall('complete_task', {
          taskId: 'task-123'
        });

        expect(result).toEqual(mockCompletedTask);
      });

      it('should execute uncomplete_task', async () => {
        const mockUncompletedTask = {
          id: 'task-123',
          completed: false,
          completionDate: null
        };

        mockClientInstance.executeJXA.mockResolvedValue(mockUncompletedTask);

        const result = await registry.executeToolCall('uncomplete_task', {
          taskId: 'task-123'
        });

        expect(result).toEqual(mockUncompletedTask);
      });

      it('should execute move_task', async () => {
        const mockMovedTask = {
          id: 'task-123',
          projectId: 'new-project-456'
        };

        mockClientInstance.executeJXA.mockResolvedValue(mockMovedTask);

        const result = await registry.executeToolCall('move_task', {
          taskId: 'task-123',
          targetProjectId: 'new-project-456'
        });

        expect(result).toEqual(mockMovedTask);
      });

      it('should execute bulk_update_tasks', async () => {
        const mockUpdatedTasks = [
          { id: 'task-1', name: 'Updated Task 1' },
          { id: 'task-2', name: 'Updated Task 2' }
        ];

        mockClientInstance.executeJXA.mockResolvedValue(mockUpdatedTasks);

        const result = await registry.executeToolCall('bulk_update_tasks', {
          updates: [
            { taskId: 'task-1', updates: { name: 'Updated Task 1' } },
            { taskId: 'task-2', updates: { name: 'Updated Task 2' } }
          ]
        });

        expect(result).toEqual(mockUpdatedTasks);
      });
    });

    describe('Task Deletion', () => {
      it('should execute delete_task', async () => {
        const mockResult = { success: true, deleted: 'task-123' };

        mockClientInstance.executeJXA.mockResolvedValue(mockResult);

        const result = await registry.executeToolCall('delete_task', {
          taskId: 'task-123'
        });

        expect(result).toEqual(mockResult);
      });

      it('should execute archive_task', async () => {
        const mockArchivedTask = {
          id: 'task-123',
          completed: true,
          archived: true
        };

        mockClientInstance.executeJXA.mockResolvedValue(mockArchivedTask);

        const result = await registry.executeToolCall('archive_task', {
          taskId: 'task-123'
        });

        expect(result).toEqual(mockArchivedTask);
      });

      it('should execute bulk_delete_tasks', async () => {
        const mockResult = {
          deleted: ['task-1', 'task-2'],
          count: 2,
          success: true
        };

        mockClientInstance.executeJXA.mockResolvedValue(mockResult);

        const result = await registry.executeToolCall('bulk_delete_tasks', {
          taskIds: ['task-1', 'task-2']
        });

        expect(result).toEqual(mockResult);
      });

      it('should execute bulk_archive_tasks', async () => {
        const mockResult = {
          archived: ['task-1', 'task-2'],
          count: 2,
          success: true
        };

        mockClientInstance.executeJXA.mockResolvedValue(mockResult);

        const result = await registry.executeToolCall('bulk_archive_tasks', {
          taskIds: ['task-1', 'task-2']
        });

        expect(result).toEqual(mockResult);
      });
    });
  });

  describe('Project Management Operations', () => {
    beforeEach(() => {
      mockClientInstance.executeJXA = jest.fn();
    });

    it('should execute create_project', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'New Project',
        status: 'active'
      };

      mockClientInstance.executeJXA.mockResolvedValue(mockProject);

      const result = await registry.executeToolCall('create_project', {
        name: 'New Project'
      });

      expect(result).toEqual(mockProject);
    });

    it('should execute update_project', async () => {
      const mockUpdatedProject = {
        id: 'project-123',
        name: 'Updated Project',
        status: 'on_hold'
      };

      mockClientInstance.executeJXA.mockResolvedValue(mockUpdatedProject);

      const result = await registry.executeToolCall('update_project', {
        projectId: 'project-123',
        name: 'Updated Project',
        status: 'on_hold'
      });

      expect(result).toEqual(mockUpdatedProject);
    });

    it('should execute duplicate_project', async () => {
      const mockDuplicatedProject = {
        id: 'project-duplicate',
        name: 'Copy of Original Project'
      };

      mockClientInstance.executeJXA.mockResolvedValue(mockDuplicatedProject);

      const result = await registry.executeToolCall('duplicate_project', {
        projectId: 'project-123',
        newName: 'Copy of Original Project'
      });

      expect(result).toEqual(mockDuplicatedProject);
    });

    it('should execute move_project', async () => {
      const mockMovedProject = {
        id: 'project-123',
        folderId: 'new-folder-456'
      };

      mockClientInstance.executeJXA.mockResolvedValue(mockMovedProject);

      const result = await registry.executeToolCall('move_project', {
        projectId: 'project-123',
        targetFolderId: 'new-folder-456'
      });

      expect(result).toEqual(mockMovedProject);
    });
  });

  describe('Tag Management Operations', () => {
    beforeEach(() => {
      mockClientInstance.executeJXA = jest.fn();
    });

    it('should execute create_tag', async () => {
      const mockTag = {
        id: 'tag-123',
        name: 'new-tag',
        active: true
      };

      mockClientInstance.executeJXA.mockResolvedValue(mockTag);

      const result = await registry.executeToolCall('create_tag', {
        name: 'new-tag'
      });

      expect(result).toEqual(mockTag);
    });

    it('should execute assign_tags', async () => {
      const mockResult = {
        itemId: 'task-123',
        assignedTags: ['tag1', 'tag2'],
        success: true
      };

      mockClientInstance.executeJXA.mockResolvedValue(mockResult);

      const result = await registry.executeToolCall('assign_tags', {
        itemId: 'task-123',
        itemType: 'task',
        tagIds: ['tag1', 'tag2']
      });

      expect(result).toEqual(mockResult);
    });

    it('should execute remove_tags', async () => {
      const mockResult = {
        itemId: 'task-123',
        removedTags: ['tag1'],
        success: true
      };

      mockClientInstance.executeJXA.mockResolvedValue(mockResult);

      const result = await registry.executeToolCall('remove_tags', {
        itemId: 'task-123',
        itemType: 'task',
        tagIds: ['tag1']
      });

      expect(result).toEqual(mockResult);
    });

    it('should execute get_tagged_items', async () => {
      const mockTaggedItems = [
        { id: 'task-1', name: 'Tagged Task 1', type: 'task' },
        { id: 'proj-1', name: 'Tagged Project 1', type: 'project' }
      ];

      mockClientInstance.executeJXA.mockResolvedValue(mockTaggedItems);

      const result = await registry.executeToolCall('get_tagged_items', {
        tagId: 'tag-urgent',
        itemType: 'all'
      });

      expect(result).toEqual(mockTaggedItems);
    });
  });

  describe('Folder Operations', () => {
    beforeEach(() => {
      mockClientInstance.executeJXA = jest.fn();
    });

    it('should execute create_folder', async () => {
      const mockFolder = {
        id: 'folder-123',
        name: 'New Folder',
        projectCount: 0
      };

      mockClientInstance.executeJXA.mockResolvedValue(mockFolder);

      const result = await registry.executeToolCall('create_folder', {
        name: 'New Folder'
      });

      expect(result).toEqual(mockFolder);
    });
  });

  describe('Utility Operations', () => {
    describe('Date Parsing', () => {
      it('should execute parse_natural_date', async () => {
        const mockDate = new Date('2025-08-15T10:00:00Z');
        const mockDateHandlerInstance = {
          parseNaturalDate: jest.fn().mockReturnValue(mockDate)
        };

        (DateHandler as any).mockImplementation(() => mockDateHandlerInstance);

        const testRegistry = new MCPToolRegistry(mockClientInstance, mockCacheInstance);

        const result = await testRegistry.executeToolCall('parse_natural_date', {
          dateString: 'next Friday at 10am'
        });

        expect(mockDateHandlerInstance.parseNaturalDate).toHaveBeenCalledWith('next Friday at 10am');
        expect(result).toEqual({
          originalString: 'next Friday at 10am',
          parsedDate: mockDate.toISOString(),
          isValid: true
        });
      });

      it('should handle invalid date strings', async () => {
        const mockDateHandlerInstance = {
          parseNaturalDate: jest.fn().mockReturnValue(null)
        };

        (DateHandler as any).mockImplementation(() => mockDateHandlerInstance);

        const testRegistry = new MCPToolRegistry(mockClientInstance, mockCacheInstance);

        const result = await testRegistry.executeToolCall('parse_natural_date', {
          dateString: 'invalid date string'
        });

        expect(result).toEqual({
          originalString: 'invalid date string',
          parsedDate: null,
          isValid: false
        });
      });
    });

    describe('Task Scheduling', () => {
      it('should execute schedule_tasks_optimally', async () => {
        const mockScheduledTasks = [
          { id: 'task-1', name: 'Task 1', scheduledDate: '2025-08-14T09:00:00Z' },
          { id: 'task-2', name: 'Task 2', scheduledDate: '2025-08-14T14:00:00Z' }
        ];

        const mockSchedulingInstance = {
          scheduleTasksOptimally: jest.fn().mockReturnValue(mockScheduledTasks)
        };

        (SchedulingUtilities as any).mockImplementation(() => mockSchedulingInstance);

        const testRegistry = new MCPToolRegistry(mockClientInstance, mockCacheInstance);

        const result = await testRegistry.executeToolCall('schedule_tasks_optimally', {
          taskIds: ['task-1', 'task-2'],
          startDate: '2025-08-14T09:00:00Z',
          workingHoursPerDay: 8
        });

        expect(mockSchedulingInstance.scheduleTasksOptimally).toHaveBeenCalled();
        expect(result).toEqual(mockScheduledTasks);
      });
    });

    describe('Date Adjustments', () => {
      it('should execute adjust_dates_bulk', async () => {
        const mockDateHandlerInstance = {
          adjustDatesBulk: jest.fn().mockReturnValue([
            { taskId: 'task-1', newDueDate: '2025-08-15T10:00:00Z' },
            { taskId: 'task-2', newDueDate: '2025-08-16T10:00:00Z' }
          ])
        };

        (DateHandler as any).mockImplementation(() => mockDateHandlerInstance);

        const testRegistry = new MCPToolRegistry(mockClientInstance, mockCacheInstance);

        const result = await testRegistry.executeToolCall('adjust_dates_bulk', {
          adjustments: [
            { taskId: 'task-1', adjustment: '+1 day' },
            { taskId: 'task-2', adjustment: '+2 days' }
          ]
        });

        expect(mockDateHandlerInstance.adjustDatesBulk).toHaveBeenCalled();
        expect(result).toHaveLength(2);
      });
    });
  });

  describe('Date Handling Integration', () => {
    it('should parse natural language dates in task creation', async () => {
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

    it('should parse natural language dates in task updates', async () => {
      const mockDate = new Date('2025-08-20');
      const mockDateHandlerInstance = {
        parseNaturalDate: jest.fn().mockReturnValue(mockDate)
      };
      
      (DateHandler as any).mockImplementation(() => mockDateHandlerInstance);
      
      const testRegistry = new MCPToolRegistry(mockClientInstance, mockCacheInstance);
      
      const updateArgs = {
        taskId: 'task-123',
        dueDate: 'next Tuesday'
      };

      mockClientInstance.executeJXA = jest.fn().mockResolvedValue({
        id: 'task-123',
        dueDate: mockDate.toISOString()
      });

      await testRegistry.executeToolCall('update_task', updateArgs);

      expect(mockDateHandlerInstance.parseNaturalDate).toHaveBeenCalledWith('next Tuesday');
    });
  });

  describe('Cache Integration', () => {
    it('should invalidate caches for task operations', async () => {
      mockClientInstance.executeJXA = jest.fn().mockResolvedValue({ id: 'task-123' });

      await registry.executeToolCall('create_task', { name: 'Test Task' });

      expect(mockCacheInstance.invalidateTaskCache).toHaveBeenCalled();
    });

    it('should invalidate caches for project operations', async () => {
      mockClientInstance.executeJXA = jest.fn().mockResolvedValue({ id: 'project-123' });

      await registry.executeToolCall('create_project', { name: 'Test Project' });

      expect(mockCacheInstance.invalidateProjectCache).toHaveBeenCalled();
    });
  });

  describe('Tool Registry Completeness', () => {
    it('should include all expected JXA script-based tools', () => {
      const tools = registry.getToolDefinitions();
      const toolNames = tools.map(t => t.name);

      // Verify all major JXA scripts are represented
      const expectedTools = [
        // Task operations
        'get_all_tasks', 'get_task_by_id', 'create_task', 'create_task_in_project',
        'create_subtask', 'update_task', 'complete_task', 'uncomplete_task', 
        'move_task', 'delete_task', 'archive_task',
        
        // Batch operations
        'batch_create_tasks', 'bulk_update_tasks', 'bulk_delete_tasks', 'bulk_archive_tasks',
        
        // Project operations
        'get_all_projects', 'get_project_by_id', 'create_project', 'update_project',
        'duplicate_project', 'move_project',
        
        // Tag operations
        'get_all_tags', 'create_tag', 'assign_tags', 'remove_tags', 'get_tagged_items',
        
        // Folder operations
        'get_all_folders', 'create_folder',
        
        // System operations
        'get_perspectives', 'get_database_info', 'diagnose_connection',
        
        // Utility operations
        'search_tasks', 'parse_natural_date', 'schedule_tasks_optimally', 'adjust_dates_bulk'
      ];

      for (const expectedTool of expectedTools) {
        expect(toolNames).toContain(expectedTool);
      }
    });

    it('should have appropriate tool descriptions', () => {
      const tools = registry.getToolDefinitions();
      
      for (const tool of tools) {
        expect(tool.description).toBeTruthy();
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.description).not.toContain('TODO');
        expect(tool.description).not.toContain('FIXME');
      }
    });

    it('should have valid input schemas', () => {
      const tools = registry.getToolDefinitions();
      
      for (const tool of tools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        
        // Check that required parameters are properly defined
        if (tool.inputSchema.required && tool.inputSchema.required.length > 0) {
          for (const requiredParam of tool.inputSchema.required) {
            expect(tool.inputSchema.properties).toHaveProperty(requiredParam);
          }
        }
      }
    });
  });
});
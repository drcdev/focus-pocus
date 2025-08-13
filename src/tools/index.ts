import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CreateTaskTool } from './create-task.js';
import { UpdateTaskTool } from './update-task.js';
import { DeleteTaskTool } from './delete-task.js';
import { ProjectOperationsTool } from './project-operations.js';
import { TagOperationsTool } from './tag-operations.js';
import { OmniFocusClient } from '../omnifocus/client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { DateHandler } from '../utils/date-handler.js';
import { SchedulingUtilities } from '../utils/scheduling.js';
import { JXABridge } from '../omnifocus/jxa-bridge.js';

export class MCPToolRegistry {
  private createTaskTool: CreateTaskTool;
  private updateTaskTool: UpdateTaskTool;
  private deleteTaskTool: DeleteTaskTool;
  private projectTool: ProjectOperationsTool;
  private tagTool: TagOperationsTool;
  private dateHandler: DateHandler;
  private scheduler: SchedulingUtilities;

  constructor(
    private client: OmniFocusClient,
    private cache: CacheManager
  ) {
    this.createTaskTool = new CreateTaskTool(client, cache);
    this.updateTaskTool = new UpdateTaskTool(client, cache);
    this.deleteTaskTool = new DeleteTaskTool(client, cache);
    this.projectTool = new ProjectOperationsTool(client, cache);
    this.tagTool = new TagOperationsTool(client, cache);
    this.dateHandler = new DateHandler();
    this.scheduler = new SchedulingUtilities();
  }

  getToolDefinitions(): Tool[] {
    return [
      // Task Creation Tools
      {
        name: 'create_task',
        description: 'Create a new task in OmniFocus with optional project assignment, tags, and dates',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Task name' },
            note: { type: 'string', description: 'Task note/description' },
            projectId: { type: 'string', description: 'Project ID to assign task to' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Array of tag IDs' },
            dueDate: { type: 'string', description: 'Due date in ISO format or natural language' },
            deferDate: { type: 'string', description: 'Defer date in ISO format or natural language' },
            flagged: { type: 'boolean', description: 'Whether task is flagged' },
            estimatedMinutes: { type: 'number', description: 'Estimated duration in minutes' }
          },
          required: ['name']
        }
      },
      {
        name: 'create_task_in_project',
        description: 'Create a new task directly in a specified project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID to create task in' },
            name: { type: 'string', description: 'Task name' },
            note: { type: 'string', description: 'Task note/description' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Array of tag IDs' },
            dueDate: { type: 'string', description: 'Due date in ISO format or natural language' },
            deferDate: { type: 'string', description: 'Defer date in ISO format or natural language' },
            flagged: { type: 'boolean', description: 'Whether task is flagged' },
            estimatedMinutes: { type: 'number', description: 'Estimated duration in minutes' }
          },
          required: ['projectId', 'name']
        }
      },
      {
        name: 'batch_create_tasks',
        description: 'Create multiple tasks at once, optionally in a project',
        inputSchema: {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  note: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                  dueDate: { type: 'string' },
                  deferDate: { type: 'string' },
                  flagged: { type: 'boolean' },
                  estimatedMinutes: { type: 'number' }
                },
                required: ['name']
              }
            },
            projectId: { type: 'string', description: 'Optional project to create all tasks in' }
          },
          required: ['tasks']
        }
      },
      {
        name: 'create_subtask',
        description: 'Create a subtask under an existing task',
        inputSchema: {
          type: 'object',
          properties: {
            parentTaskId: { type: 'string', description: 'Parent task ID' },
            name: { type: 'string', description: 'Subtask name' },
            note: { type: 'string', description: 'Subtask note/description' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Array of tag IDs' },
            dueDate: { type: 'string', description: 'Due date in ISO format or natural language' },
            deferDate: { type: 'string', description: 'Defer date in ISO format or natural language' },
            flagged: { type: 'boolean', description: 'Whether subtask is flagged' },
            estimatedMinutes: { type: 'number', description: 'Estimated duration in minutes' }
          },
          required: ['parentTaskId', 'name']
        }
      },

      // Task Update Tools
      {
        name: 'update_task',
        description: 'Update properties of an existing task',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID to update' },
            name: { type: 'string', description: 'New task name' },
            note: { type: 'string', description: 'New task note/description' },
            projectId: { type: 'string', description: 'New project ID (use "inbox" for inbox)' },
            tags: { type: 'array', items: { type: 'string' }, description: 'New array of tag IDs' },
            dueDate: { type: 'string', description: 'New due date in ISO format or natural language' },
            deferDate: { type: 'string', description: 'New defer date in ISO format or natural language' },
            flagged: { type: 'boolean', description: 'Whether task is flagged' },
            estimatedMinutes: { type: 'number', description: 'Estimated duration in minutes' }
          },
          required: ['taskId']
        }
      },
      {
        name: 'complete_task',
        description: 'Mark a task as completed',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID to complete' },
            completionDate: { type: 'string', description: 'Completion date (optional, defaults to now)' }
          },
          required: ['taskId']
        }
      },
      {
        name: 'uncomplete_task',
        description: 'Mark a completed task as incomplete',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID to uncomplete' }
          },
          required: ['taskId']
        }
      },
      {
        name: 'move_task',
        description: 'Move a task to a different project or to inbox',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID to move' },
            targetProjectId: { type: 'string', description: 'Target project ID (null for inbox)' }
          },
          required: ['taskId']
        }
      },
      {
        name: 'bulk_update_tasks',
        description: 'Update multiple tasks with the same changes',
        inputSchema: {
          type: 'object',
          properties: {
            taskIds: { type: 'array', items: { type: 'string' }, description: 'Array of task IDs to update' },
            updates: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                note: { type: 'string' },
                projectId: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                dueDate: { type: 'string' },
                deferDate: { type: 'string' },
                flagged: { type: 'boolean' },
                estimatedMinutes: { type: 'number' }
              }
            }
          },
          required: ['taskIds', 'updates']
        }
      },

      // Task Deletion Tools
      {
        name: 'delete_task',
        description: 'Permanently delete a task',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID to delete' },
            confirm: { type: 'boolean', description: 'Confirmation flag (required)', default: false }
          },
          required: ['taskId', 'confirm']
        }
      },
      {
        name: 'archive_task',
        description: 'Archive a task (soft delete by completing and tagging)',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID to archive' }
          },
          required: ['taskId']
        }
      },
      {
        name: 'bulk_delete_tasks',
        description: 'Delete multiple tasks at once',
        inputSchema: {
          type: 'object',
          properties: {
            taskIds: { type: 'array', items: { type: 'string' }, description: 'Array of task IDs to delete' },
            confirm: { type: 'boolean', description: 'Confirmation flag (required)', default: false }
          },
          required: ['taskIds', 'confirm']
        }
      },

      // Project Management Tools
      {
        name: 'create_project',
        description: 'Create a new project with optional folder assignment',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Project name' },
            note: { type: 'string', description: 'Project note/description' },
            folderId: { type: 'string', description: 'Folder ID to place project in' },
            status: { type: 'string', enum: ['active status', 'on hold status', 'done status', 'dropped status'], description: 'Project status' },
            sequential: { type: 'boolean', description: 'Whether project is sequential' },
            flagged: { type: 'boolean', description: 'Whether project is flagged' },
            dueDate: { type: 'string', description: 'Project due date' },
            deferDate: { type: 'string', description: 'Project defer date' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Array of tag IDs' },
            estimatedMinutes: { type: 'number', description: 'Estimated duration in minutes' }
          },
          required: ['name']
        }
      },
      {
        name: 'update_project',
        description: 'Update properties of an existing project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID to update' },
            name: { type: 'string', description: 'New project name' },
            note: { type: 'string', description: 'New project note/description' },
            status: { type: 'string', enum: ['active status', 'on hold status', 'done status', 'dropped status'], description: 'Project status' },
            sequential: { type: 'boolean', description: 'Whether project is sequential' },
            flagged: { type: 'boolean', description: 'Whether project is flagged' },
            dueDate: { type: 'string', description: 'Project due date' },
            deferDate: { type: 'string', description: 'Project defer date' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Array of tag IDs' },
            estimatedMinutes: { type: 'number', description: 'Estimated duration in minutes' }
          },
          required: ['projectId']
        }
      },
      {
        name: 'duplicate_project',
        description: 'Duplicate an existing project with optional task copying',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID to duplicate' },
            newName: { type: 'string', description: 'Name for the new project (optional)' },
            includeTasks: { type: 'boolean', description: 'Whether to copy tasks', default: true }
          },
          required: ['projectId']
        }
      },
      {
        name: 'create_folder',
        description: 'Create a new folder for organizing projects',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Folder name' },
            parentFolderId: { type: 'string', description: 'Parent folder ID (optional)' }
          },
          required: ['name']
        }
      },
      {
        name: 'move_project',
        description: 'Move a project to a different folder',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID to move' },
            targetFolderId: { type: 'string', description: 'Target folder ID (null for root)' }
          },
          required: ['projectId']
        }
      },

      // Tag Management Tools
      {
        name: 'create_tag',
        description: 'Create a new tag with optional parent tag',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Tag name' },
            parentTagId: { type: 'string', description: 'Parent tag ID for hierarchical tags' }
          },
          required: ['name']
        }
      },
      {
        name: 'assign_tags',
        description: 'Assign tags to a task or project',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: { type: 'string', description: 'Task or project ID' },
            tagIds: { type: 'array', items: { type: 'string' }, description: 'Array of tag IDs to assign' },
            itemType: { type: 'string', enum: ['task', 'project'], default: 'task', description: 'Type of item' }
          },
          required: ['itemId', 'tagIds']
        }
      },
      {
        name: 'remove_tags',
        description: 'Remove tags from a task or project',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: { type: 'string', description: 'Task or project ID' },
            tagIds: { type: 'array', items: { type: 'string' }, description: 'Array of tag IDs to remove' },
            itemType: { type: 'string', enum: ['task', 'project'], default: 'task', description: 'Type of item' }
          },
          required: ['itemId', 'tagIds']
        }
      },
      {
        name: 'get_tagged_items',
        description: 'Get all tasks and/or projects with a specific tag',
        inputSchema: {
          type: 'object',
          properties: {
            tagId: { type: 'string', description: 'Tag ID to search for' },
            itemType: { type: 'string', enum: ['all', 'tasks', 'projects'], default: 'all', description: 'Type of items to return' }
          },
          required: ['tagId']
        }
      },
      {
        name: 'bulk_assign_tags',
        description: 'Assign tags to multiple tasks or projects in a single operation',
        inputSchema: {
          type: 'object',
          properties: {
            itemIds: { type: 'array', items: { type: 'string' }, description: 'Array of task or project IDs' },
            tagIds: { type: 'array', items: { type: 'string' }, description: 'Array of tag IDs to assign' },
            itemType: { type: 'string', enum: ['task', 'project'], default: 'task', description: 'Type of items' }
          },
          required: ['itemIds', 'tagIds']
        }
      },

      // Read/Query Tools
      {
        name: 'get_all_tasks',
        description: 'Get all tasks from OmniFocus with pagination support',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Maximum number of tasks to return (default: 25)' },
            offset: { type: 'number', description: 'Number of tasks to skip (default: 0)' },
            includeCompleted: { type: 'boolean', description: 'Include completed tasks (default: false)' }
          },
          additionalProperties: false
        }
      },
      {
        name: 'get_task_by_id',
        description: 'Get a specific task by ID',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID to retrieve' }
          },
          required: ['taskId']
        }
      },
      {
        name: 'search_tasks',
        description: 'Search tasks using native OmniFocus filtering with comprehensive criteria support',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Text search in task names and notes' },
            projectId: { type: 'string', description: 'Filter by specific project ID' },
            tagId: { type: 'string', description: 'Filter by specific tag ID' },
            status: { type: 'string', enum: ['available', 'completed', 'dropped', 'all'], description: 'Task status filter (default: available)' },
            completed: { type: 'boolean', description: 'Filter by completion status' },
            flagged: { type: 'boolean', description: 'Filter by flagged status' },
            dueBefore: { type: 'string', description: 'Filter tasks due before this date (ISO format)' },
            dueAfter: { type: 'string', description: 'Filter tasks due after this date (ISO format)' },
            createdBefore: { type: 'string', description: 'Filter tasks created before this date (ISO format)' },
            createdAfter: { type: 'string', description: 'Filter tasks created after this date (ISO format)' },
            limit: { type: 'number', description: 'Maximum number of results (default: 25)' },
            offset: { type: 'number', description: 'Number of results to skip (default: 0)' }
          }
        }
      },
      {
        name: 'get_all_projects',
        description: 'Get all projects from OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'get_project_by_id',
        description: 'Get a specific project by ID',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID to retrieve' }
          },
          required: ['projectId']
        }
      },
      {
        name: 'get_all_tags',
        description: 'Get all tags from OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'get_all_folders',
        description: 'Get all folders from OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'get_perspectives',
        description: 'Get all perspectives from OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'get_database_info',
        description: 'Get OmniFocus database information and statistics',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'get_project_tasks',
        description: 'Get all tasks within a specific project (excludes completed and dropped by default)',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID to get tasks from' },
            includeCompleted: { type: 'boolean', description: 'Include completed tasks (default: false)' },
            includeDropped: { type: 'boolean', description: 'Include dropped tasks (default: false)' }
          },
          required: ['projectId']
        }
      },
      {
        name: 'diagnose_connection',
        description: 'Diagnose OmniFocus connection issues and permissions',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },

      // Date and Scheduling Tools
      {
        name: 'parse_natural_date',
        description: 'Parse natural language date strings into dates',
        inputSchema: {
          type: 'object',
          properties: {
            dateString: { type: 'string', description: 'Natural language date string' },
            baseDate: { type: 'string', description: 'Base date for relative parsing (optional)' }
          },
          required: ['dateString']
        }
      },
      {
        name: 'schedule_tasks_optimally',
        description: 'Schedule multiple tasks optimally across a date range',
        inputSchema: {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  taskId: { type: 'string' },
                  estimatedMinutes: { type: 'number' },
                  priority: { type: 'number' },
                  dependencies: { type: 'array', items: { type: 'string' } },
                  preferredDate: { type: 'string' },
                  deadlineDate: { type: 'string' }
                },
                required: ['taskId']
              }
            },
            startDate: { type: 'string', description: 'Scheduling start date' },
            endDate: { type: 'string', description: 'Scheduling end date' },
            options: {
              type: 'object',
              properties: {
                workDaysOnly: { type: 'boolean' },
                avoidWeekends: { type: 'boolean' },
                maxTasksPerDay: { type: 'number' },
                preferredTimeOfDay: { type: 'string', enum: ['morning', 'afternoon', 'evening'] }
              }
            }
          },
          required: ['tasks', 'startDate', 'endDate']
        }
      },
      {
        name: 'adjust_dates_bulk',
        description: 'Adjust dates for multiple tasks in bulk',
        inputSchema: {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  taskId: { type: 'string' },
                  currentDate: { type: 'string' }
                },
                required: ['taskId']
              }
            },
            adjustment: {
              type: 'object',
              properties: {
                days: { type: 'number' },
                weeks: { type: 'number' },
                months: { type: 'number' }
              }
            },
            options: {
              type: 'object',
              properties: {
                workDaysOnly: { type: 'boolean' },
                avoidWeekends: { type: 'boolean' }
              }
            }
          },
          required: ['tasks', 'adjustment']
        }
      }
    ];
  }

  async executeToolCall(toolName: string, args: any): Promise<any> {
    try {
      switch (toolName) {
        // Task Creation
        case 'create_task':
          return await this.handleCreateTask(args);
        case 'create_task_in_project':
          return await this.handleCreateTaskInProject(args);
        case 'batch_create_tasks':
          return await this.handleBatchCreateTasks(args);
        case 'create_subtask':
          return await this.handleCreateSubtask(args);

        // Task Updates
        case 'update_task':
          return await this.handleUpdateTask(args);
        case 'complete_task':
          return await this.handleCompleteTask(args);
        case 'uncomplete_task':
          return await this.updateTaskTool.uncompleteTask(args.taskId);
        case 'move_task':
          return await this.updateTaskTool.moveTask(args.taskId, args.targetProjectId);
        case 'bulk_update_tasks':
          return await this.handleBulkUpdateTasks(args);

        // Task Deletion
        case 'delete_task':
          return await this.deleteTaskTool.deleteTask(args.taskId, args.confirm);
        case 'archive_task':
          return await this.deleteTaskTool.archiveTask(args.taskId);
        case 'bulk_delete_tasks':
          return await this.deleteTaskTool.bulkDelete(args.taskIds, args.confirm);

        // Project Management
        case 'create_project':
          return await this.handleCreateProject(args);
        case 'update_project':
          return await this.handleUpdateProject(args);
        case 'duplicate_project':
          return await this.projectTool.duplicateProject(args.projectId, args.newName, args.includeTasks);
        case 'create_folder':
          return await this.projectTool.createFolder(args.name, args.parentFolderId);
        case 'move_project':
          return await this.projectTool.moveProject(args.projectId, args.targetFolderId);

        // Tag Management
        case 'create_tag':
          return await this.tagTool.createTag(args.name, args.parentTagId);
        case 'assign_tags':
          return await this.tagTool.assignTags(args.itemId, args.tagIds, args.itemType);
        case 'remove_tags':
          return await this.tagTool.removeTags(args.itemId, args.tagIds, args.itemType);
        case 'get_tagged_items':
          return await this.tagTool.getTaggedItems(args.tagId, args.itemType);
        case 'bulk_assign_tags':
          return await this.tagTool.bulkAssignTags(args.itemIds, args.tagIds, args.itemType);

        // Read/Query Operations
        case 'get_all_tasks':
          return await this.client.getAllTasks(args);
        case 'get_task_by_id':
          return await this.client.getTaskById(args.taskId);
        case 'search_tasks':
          return await this.handleSearchTasks(args);
        case 'get_all_projects':
          return await this.client.getAllProjects();
        case 'get_project_by_id':
          return await this.client.getProjectById(args.projectId);
        case 'get_all_tags':
          return await this.client.getAllTags();
        case 'get_all_folders':
          return await this.client.getAllFolders();
        case 'get_perspectives':
          return await this.client.getPerspectives();
        case 'get_database_info':
          return await this.client.getDatabaseInfo();
        case 'get_project_tasks':
          return await this.handleGetProjectTasks(args);
        case 'diagnose_connection':
          return await this.handleDiagnoseConnection();

        // Date and Scheduling
        case 'parse_natural_date':
          return this.handleParseNaturalDate(args);
        case 'schedule_tasks_optimally':
          return this.handleScheduleTasksOptimally(args);
        case 'adjust_dates_bulk':
          return this.handleAdjustDatesBulk(args);

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      throw new Error(`Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods for complex tool calls

  private async handleCreateTask(args: any) {
    const options = { ...args };
    
    if (args.dueDate) {
      if (typeof args.dueDate === 'string') {
        const parsedDate = this.dateHandler.parseNaturalDate(args.dueDate);
        if (parsedDate) {
          options.dueDate = parsedDate.toISOString();
        } else {
          throw new Error(`Could not parse due date: "${args.dueDate}"`);
        }
      } else if (args.dueDate instanceof Date) {
        options.dueDate = args.dueDate.toISOString();
      }
    }
    if (args.deferDate) {
      if (typeof args.deferDate === 'string') {
        const parsedDate = this.dateHandler.parseNaturalDate(args.deferDate);
        if (parsedDate) {
          options.deferDate = parsedDate.toISOString();
        } else {
          throw new Error(`Could not parse defer date: "${args.deferDate}"`);
        }
      } else if (args.deferDate instanceof Date) {
        options.deferDate = args.deferDate.toISOString();
      }
    }
    
    return await this.createTaskTool.createTask(options);
  }

  private async handleCreateTaskInProject(args: any) {
    const options = { ...args };
    delete options.projectId;
    
    if (args.dueDate) {
      if (typeof args.dueDate === 'string') {
        const parsedDate = this.dateHandler.parseNaturalDate(args.dueDate);
        if (parsedDate) {
          options.dueDate = parsedDate.toISOString();
        } else {
          throw new Error(`Could not parse due date: "${args.dueDate}"`);
        }
      } else if (args.dueDate instanceof Date) {
        options.dueDate = args.dueDate.toISOString();
      }
    }
    if (args.deferDate) {
      if (typeof args.deferDate === 'string') {
        const parsedDate = this.dateHandler.parseNaturalDate(args.deferDate);
        if (parsedDate) {
          options.deferDate = parsedDate.toISOString();
        } else {
          throw new Error(`Could not parse defer date: "${args.deferDate}"`);
        }
      } else if (args.deferDate instanceof Date) {
        options.deferDate = args.deferDate.toISOString();
      }
    }
    
    return await this.createTaskTool.createTaskInProject(args.projectId, options);
  }

  private async handleCreateSubtask(args: any) {
    const options = { ...args };
    delete options.parentTaskId;
    
    if (args.dueDate) {
      if (typeof args.dueDate === 'string') {
        const parsedDate = this.dateHandler.parseNaturalDate(args.dueDate);
        if (parsedDate) {
          options.dueDate = parsedDate.toISOString();
        } else {
          throw new Error(`Could not parse due date: "${args.dueDate}"`);
        }
      } else if (args.dueDate instanceof Date) {
        options.dueDate = args.dueDate.toISOString();
      }
    }
    if (args.deferDate) {
      if (typeof args.deferDate === 'string') {
        const parsedDate = this.dateHandler.parseNaturalDate(args.deferDate);
        if (parsedDate) {
          options.deferDate = parsedDate.toISOString();
        } else {
          throw new Error(`Could not parse defer date: "${args.deferDate}"`);
        }
      } else if (args.deferDate instanceof Date) {
        options.deferDate = args.deferDate.toISOString();
      }
    }
    
    return await this.createTaskTool.createSubtask(args.parentTaskId, options);
  }

  private async handleBatchCreateTasks(args: any) {
    const options = { ...args };
    
    // Process dates in each task
    if (options.tasks && Array.isArray(options.tasks)) {
      for (const task of options.tasks) {
        if (task.dueDate && typeof task.dueDate === 'string') {
          const parsedDate = this.dateHandler.parseNaturalDate(task.dueDate);
          if (parsedDate) {
            task.dueDate = parsedDate.toISOString();
          } else {
            throw new Error(`Could not parse due date: "${task.dueDate}" for task "${task.name}"`);
          }
        } else if (task.dueDate instanceof Date) {
          task.dueDate = task.dueDate.toISOString();
        }
        
        if (task.deferDate && typeof task.deferDate === 'string') {
          const parsedDate = this.dateHandler.parseNaturalDate(task.deferDate);
          if (parsedDate) {
            task.deferDate = parsedDate.toISOString();
          } else {
            throw new Error(`Could not parse defer date: "${task.deferDate}" for task "${task.name}"`);
          }
        } else if (task.deferDate instanceof Date) {
          task.deferDate = task.deferDate.toISOString();
        }
      }
    }
    
    return await this.createTaskTool.batchCreateTasks(options);
  }

  private async handleUpdateTask(args: any) {
    const updates = { ...args };
    delete updates.taskId;
    
    if (args.dueDate && typeof args.dueDate === 'string') {
      updates.dueDate = this.dateHandler.parseNaturalDate(args.dueDate);
    }
    if (args.deferDate && typeof args.deferDate === 'string') {
      updates.deferDate = this.dateHandler.parseNaturalDate(args.deferDate);
    }
    
    return await this.updateTaskTool.updateTask(args.taskId, updates);
  }

  private async handleCompleteTask(args: any) {
    const completionDate = args.completionDate 
      ? this.dateHandler.parseNaturalDate(args.completionDate) || new Date()
      : new Date();
    
    return await this.updateTaskTool.completeTask(args.taskId, completionDate);
  }

  private async handleBulkUpdateTasks(args: any) {
    const updates = { ...args.updates };
    
    if (updates.dueDate && typeof updates.dueDate === 'string') {
      updates.dueDate = this.dateHandler.parseNaturalDate(updates.dueDate);
    }
    if (updates.deferDate && typeof updates.deferDate === 'string') {
      updates.deferDate = this.dateHandler.parseNaturalDate(updates.deferDate);
    }
    
    return await this.updateTaskTool.bulkUpdateTasks(args.taskIds, updates);
  }

  private async handleCreateProject(args: any) {
    const options = { ...args };
    
    if (args.dueDate && typeof args.dueDate === 'string') {
      options.dueDate = this.dateHandler.parseNaturalDate(args.dueDate);
    }
    if (args.deferDate && typeof args.deferDate === 'string') {
      options.deferDate = this.dateHandler.parseNaturalDate(args.deferDate);
    }
    
    return await this.projectTool.createProject(options);
  }

  private async handleUpdateProject(args: any) {
    const updates = { ...args };
    delete updates.projectId;
    
    if (args.dueDate && typeof args.dueDate === 'string') {
      updates.dueDate = this.dateHandler.parseNaturalDate(args.dueDate);
    }
    if (args.deferDate && typeof args.deferDate === 'string') {
      updates.deferDate = this.dateHandler.parseNaturalDate(args.deferDate);
    }
    
    return await this.projectTool.updateProject(args.projectId, updates);
  }

  private handleParseNaturalDate(args: any) {
    const baseDate = args.baseDate ? new Date(args.baseDate) : new Date();
    const parsed = this.dateHandler.parseNaturalDate(args.dateString, baseDate);
    
    return {
      input: args.dateString,
      parsed: parsed ? parsed.toISOString() : null,
      success: parsed !== null
    };
  }

  private handleScheduleTasksOptimally(args: any) {
    const tasks = args.tasks.map((task: any) => ({
      ...task,
      preferredDate: task.preferredDate ? new Date(task.preferredDate) : undefined,
      deadlineDate: task.deadlineDate ? new Date(task.deadlineDate) : undefined
    }));
    
    const startDate = new Date(args.startDate);
    const endDate = new Date(args.endDate);
    
    return this.scheduler.scheduleTasksOptimally(tasks, startDate, endDate, args.options);
  }

  private handleAdjustDatesBulk(args: any) {
    const tasks = args.tasks.map((task: any) => ({
      ...task,
      currentDate: task.currentDate ? new Date(task.currentDate) : undefined
    }));
    
    return this.scheduler.adjustDatesInBulk(tasks, args.adjustment, args.options);
  }

  private async handleSearchTasks(args: any) {
    const searchOptions = { ...args };
    
    // Default to 'available' status if no status or completed flag is specified
    if (!searchOptions.status && searchOptions.completed === undefined) {
      searchOptions.status = 'available';
    }
    
    return await this.client.searchTasks(searchOptions);
  }

  private async handleGetProjectTasks(args: any) {
    const searchOptions: any = {
      projectId: args.projectId
    };
    
    // Default to excluding completed and dropped tasks
    if (args.includeCompleted || args.includeDropped) {
      // If user wants to include completed or dropped, set status to 'all'
      searchOptions.status = 'all';
    } else {
      // Default: only available tasks
      searchOptions.status = 'available';
    }
    
    return await this.client.searchTasks(searchOptions);
  }

  private async handleDiagnoseConnection() {
    const diagnosis = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        parentProcess: process.env.PARENT_PROCESS || 'unknown',
        pid: process.pid,
        execPath: process.execPath
      },
      checks: [] as Array<{name: string, status: 'pass' | 'fail', details: string, error?: string}>
    };

    // Check 1: OmniFocus availability
    try {
      const available = await JXABridge.checkOmniFocusAvailability();
      diagnosis.checks.push({
        name: 'OmniFocus Available',
        status: available ? 'pass' : 'fail',
        details: available ? 'OmniFocus is running and accessible' : 'OmniFocus is not running or not accessible'
      });
    } catch (error: any) {
      diagnosis.checks.push({
        name: 'OmniFocus Available',
        status: 'fail',
        details: 'Error checking OmniFocus availability',
        error: error.message
      });
    }

    // Check 2: Permissions
    try {
      const permissions = await JXABridge.requestPermissions();
      diagnosis.checks.push({
        name: 'Automation Permissions',
        status: permissions ? 'pass' : 'fail',
        details: permissions ? 'Automation permissions granted' : 'Automation permissions not granted'
      });
    } catch (error: any) {
      diagnosis.checks.push({
        name: 'Automation Permissions',
        status: 'fail',
        details: 'Error requesting permissions',
        error: error.message
      });
    }

    // Check 3: Basic JXA execution
    try {
      const result = await JXABridge.execScriptFile('get-database-info');
      diagnosis.checks.push({
        name: 'JXA Script Execution',
        status: result.success ? 'pass' : 'fail',
        details: result.success ? 'JXA scripts can execute successfully' : 'JXA script execution failed',
        error: result.error?.originalMessage
      });
    } catch (error: any) {
      diagnosis.checks.push({
        name: 'JXA Script Execution',
        status: 'fail',
        details: 'Error executing JXA script',
        error: error.message
      });
    }

    // Check 4: Direct JXA test (use safe method)
    try {
      const directResult = await JXABridge.checkOmniFocusAvailability();
      diagnosis.checks.push({
        name: 'Direct JXA Execution',
        status: directResult ? 'pass' : 'fail',
        details: `OmniFocus availability: ${directResult}`
      });
    } catch (error: any) {
      diagnosis.checks.push({
        name: 'Direct JXA Execution',
        status: 'fail',
        details: 'Direct JXA execution failed',
        error: error.message
      });
    }

    // Check 5: Client connection status
    const connectionStatus = this.client.getConnectionStatus();
    diagnosis.checks.push({
      name: 'Client Connection Status',
      status: connectionStatus.connected ? 'pass' : 'fail',
      details: `Connected: ${connectionStatus.connected}, App Running: ${connectionStatus.appRunning}, Permissions: ${connectionStatus.permissionsGranted}`,
      error: connectionStatus.error
    });

    return diagnosis;
  }
}
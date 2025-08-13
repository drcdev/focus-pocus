import { OmniFocusClient } from '../omnifocus/client.js';
import { TaskExtended, CreateTaskOptions, BatchCreateTaskOptions } from '../omnifocus/types.js';
import { CacheManager } from '../cache/cache-manager.js';
import { generateId } from '../utils/id-generator.js';
import { JXABridge } from '../omnifocus/jxa-bridge.js';

export class CreateTaskTool {
  constructor(
    private client: OmniFocusClient,
    private cache: CacheManager
  ) {}

  async createTask(options: CreateTaskOptions): Promise<TaskExtended> {

    // Use appropriate script based on whether projectId is provided
    const scriptName = options.projectId ? 'create-task-in-project' : 'create-task';
    const response = await JXABridge.execScriptFile(scriptName, { options });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create task');
    }
    
    const task = response.data as TaskExtended;
    
    // Invalidate relevant caches
    await this.cache.invalidate('tasks:*');
    if (options.projectId) {
      await this.cache.invalidate(`project:${options.projectId}:*`);
    }
    
    return task;
  }

  async createTaskInProject(projectId: string, options: Omit<CreateTaskOptions, 'projectId'>): Promise<TaskExtended> {
    return this.createTask({ ...options, projectId });
  }

  async batchCreateTasks(options: BatchCreateTaskOptions): Promise<TaskExtended[]> {
    const response = await JXABridge.execScriptFile('batch-create-tasks', { options });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to batch create tasks');
    }
    
    const results = response.data as TaskExtended[];
    
    // Invalidate caches
    await this.cache.invalidate('tasks:*');
    if (options.projectId) {
      await this.cache.invalidate(`project:${options.projectId}:*`);
    }
    
    return results as TaskExtended[];
  }

  async createSubtask(parentTaskId: string, options: CreateTaskOptions): Promise<TaskExtended> {
    const response = await JXABridge.execScriptFile('create-subtask', { parentTaskId, options });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create subtask');
    }
    
    const result = response.data as TaskExtended;
    
    // Invalidate caches
    await this.cache.invalidate(`task:${parentTaskId}:*`);
    await this.cache.invalidate('tasks:*');
    
    return result as TaskExtended;
  }

  private escapeString(str: string): string {
    return str.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }
}
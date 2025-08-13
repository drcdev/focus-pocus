import { OmniFocusClient } from '../omnifocus/client.js';
import { TaskExtended, UpdateTaskOptions } from '../omnifocus/types.js';
import { CacheManager } from '../cache/cache-manager.js';
import { JXABridge } from '../omnifocus/jxa-bridge.js';

export class UpdateTaskTool {
  constructor(
    private client: OmniFocusClient,
    private cache: CacheManager
  ) {}

  async updateTask(taskId: string, updates: UpdateTaskOptions): Promise<TaskExtended> {
    const response = await JXABridge.execScriptFile('update-task', { taskId, updates });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update task');
    }
    
    const result = response.data as TaskExtended;
    
    // Invalidate caches
    await this.cache.invalidate(`task:${taskId}:*`);
    await this.cache.invalidate('tasks:*');
    
    return result as TaskExtended;
  }

  async completeTask(taskId: string, completionDate?: Date): Promise<TaskExtended> {
    const response = await JXABridge.execScriptFile('complete-task', { 
      taskId, 
      completionDate: completionDate?.toISOString() || null 
    });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to complete task');
    }
    
    const result = response.data as TaskExtended;
    
    // Invalidate caches
    await this.cache.invalidate(`task:${taskId}:*`);
    await this.cache.invalidate('tasks:*');
    await this.cache.invalidate('completed:*');
    
    return result as TaskExtended;
  }

  async uncompleteTask(taskId: string): Promise<TaskExtended> {
    const response = await JXABridge.execScriptFile('uncomplete-task', { taskId });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to uncomplete task');
    }
    
    const result = response.data as TaskExtended;
    
    // Invalidate caches
    await this.cache.invalidate(`task:${taskId}:*`);
    await this.cache.invalidate('tasks:*');
    await this.cache.invalidate('completed:*');
    
    return result as TaskExtended;
  }

  async moveTask(taskId: string, targetProjectId: string | null): Promise<TaskExtended> {
    const response = await JXABridge.execScriptFile('move-task', { taskId, targetProjectId });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to move task');
    }
    
    const result = response.data as TaskExtended;
    
    // Invalidate caches
    await this.cache.invalidate(`task:${taskId}:*`);
    await this.cache.invalidate('tasks:*');
    if (targetProjectId) {
      await this.cache.invalidate(`project:${targetProjectId}:*`);
    }
    
    return result as TaskExtended;
  }

  async bulkUpdateTasks(taskIds: string[], updates: UpdateTaskOptions): Promise<TaskExtended[]> {
    const response = await JXABridge.execScriptFile('bulk-update-tasks', { taskIds, updates });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to bulk update tasks');
    }
    
    const results = response.data as TaskExtended[];
    
    // Invalidate caches
    await this.cache.invalidate('tasks:*');
    for (const taskId of taskIds) {
      await this.cache.invalidate(`task:${taskId}:*`);
    }
    
    return results as TaskExtended[];
  }

  private escapeString(str: string): string {
    return str.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }
}
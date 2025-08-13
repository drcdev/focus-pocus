import { OmniFocusClient } from '../omnifocus/client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { JXABridge } from '../omnifocus/jxa-bridge.js';

export class DeleteTaskTool {
  constructor(
    private client: OmniFocusClient,
    private cache: CacheManager
  ) {}

  async deleteTask(taskId: string, confirm: boolean = true): Promise<{ success: boolean; message: string }> {
    if (!confirm) {
      return { success: false, message: 'Deletion cancelled - confirmation required' };
    }

    try {
      // Use the JXA script file instead of inline script
      const response = await JXABridge.execScriptFile('delete-task', { taskId });
      
      if (!response.success) {
        return { 
          success: false, 
          message: response.error?.message || 'Failed to delete task' 
        };
      }
      
      const result = response.data as any;
      
      // Invalidate caches
      await this.cache.invalidate(`task:${taskId}:*`);
      await this.cache.invalidate('tasks:*');
      if (result.projectId) {
        await this.cache.invalidate(`project:${result.projectId}:*`);
      }
      
      return { success: result.success, message: result.message };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async archiveTask(taskId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Use the JXA script file instead of inline script
      const response = await JXABridge.execScriptFile('archive-task', { taskId });
      
      if (!response.success) {
        return { 
          success: false, 
          message: response.error?.message || 'Failed to archive task' 
        };
      }
      
      const result = response.data as any;
      
      // Invalidate caches
      await this.cache.invalidate(`task:${taskId}:*`);
      await this.cache.invalidate('tasks:*');
      await this.cache.invalidate('completed:*');
      
      return { success: result.success, message: result.message };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to archive task: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async bulkDelete(taskIds: string[], confirm: boolean = true): Promise<{ 
    success: boolean; 
    message: string; 
    deleted: string[]; 
    failed: string[] 
  }> {
    if (!confirm) {
      return { 
        success: false, 
        message: 'Bulk deletion cancelled - confirmation required',
        deleted: [],
        failed: taskIds
      };
    }

    try {
      // Use the JXA script file instead of inline script
      const response = await JXABridge.execScriptFile('delete-tasks-bulk', { taskIds });
      
      if (!response.success) {
        return { 
          success: false, 
          message: response.error?.message || 'Bulk deletion failed',
          deleted: [],
          failed: taskIds
        };
      }
      
      const result = response.data as any;
      
      // Invalidate caches
      await this.cache.invalidate('tasks:*');
      for (const taskId of result.deleted) {
        await this.cache.invalidate(`task:${taskId}:*`);
      }
      for (const projectId of result.affectedProjects) {
        await this.cache.invalidate(`project:${projectId}:*`);
      }
      
      return {
        success: result.failed.length === 0,
        message: `Deleted ${result.deleted.length} tasks, ${result.failed.length} failed`,
        deleted: result.deleted,
        failed: result.failed
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Bulk deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        deleted: [],
        failed: taskIds
      };
    }
  }

  async bulkArchive(taskIds: string[]): Promise<{ 
    success: boolean; 
    message: string; 
    archived: string[]; 
    failed: string[] 
  }> {
    try {
      // Use the JXA script file instead of inline script
      const response = await JXABridge.execScriptFile('archive-tasks-bulk', { taskIds });
      
      if (!response.success) {
        return { 
          success: false, 
          message: response.error?.message || 'Bulk archive failed',
          archived: [],
          failed: taskIds
        };
      }
      
      const result = response.data as any;
      
      // Invalidate caches
      await this.cache.invalidate('tasks:*');
      await this.cache.invalidate('completed:*');
      for (const taskId of result.archived) {
        await this.cache.invalidate(`task:${taskId}:*`);
      }
      
      return {
        success: result.failed.length === 0,
        message: `Archived ${result.archived.length} tasks, ${result.failed.length} failed`,
        archived: result.archived,
        failed: result.failed
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Bulk archive failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        archived: [],
        failed: taskIds
      };
    }
  }

  async deleteCompletedInProject(projectId: string, confirm: boolean = true): Promise<{ 
    success: boolean; 
    message: string; 
    deletedCount: number 
  }> {
    if (!confirm) {
      return { 
        success: false, 
        message: 'Deletion cancelled - confirmation required',
        deletedCount: 0
      };
    }

    try {
      // Use the JXA script file instead of inline script
      const response = await JXABridge.execScriptFile('delete-completed-in-project', { projectId });
      
      if (!response.success) {
        return { 
          success: false, 
          message: response.error?.message || 'Failed to delete completed tasks',
          deletedCount: 0
        };
      }
      
      const result = response.data as any;
      
      // Invalidate caches
      await this.cache.invalidate(`project:${projectId}:*`);
      await this.cache.invalidate('tasks:*');
      await this.cache.invalidate('completed:*');
      
      return {
        success: result.success,
        message: `Deleted ${result.deletedCount} completed tasks from project`,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to delete completed tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        deletedCount: 0
      };
    }
  }
}
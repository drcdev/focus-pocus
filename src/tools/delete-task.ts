import { OmniFocusClient } from '../omnifocus/client.js';
import { CacheManager } from '../cache/cache-manager.js';

export class DeleteTaskTool {
  constructor(
    private client: OmniFocusClient,
    private cache: CacheManager
  ) {}

  async deleteTask(taskId: string, confirm: boolean = true): Promise<{ success: boolean; message: string }> {
    if (!confirm) {
      return { success: false, message: 'Deletion cancelled - confirmation required' };
    }

    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const task = doc.flattenedTasks.byId('${taskId}');
      if (!task) throw new Error('Task not found');
      
      const taskName = task.name();
      const projectId = task.assignedContainer() ? task.assignedContainer().id() : null;
      
      // Delete the task
      task.delete();
      
      return {
        success: true,
        message: 'Task "' + taskName + '" deleted successfully',
        projectId: projectId
      };
    `;

    try {
      const result = await this.client.executeJXA(script) as any;
      
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
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const task = doc.flattenedTasks.byId('${taskId}');
      if (!task) throw new Error('Task not found');
      
      const taskName = task.name();
      
      // Archive by completing the task (soft delete)
      task.completed = true;
      task.completionDate = new Date();
      
      // Add archive tag if it exists
      const archiveTag = doc.flattenedTags.whose({ name: 'Archive' })[0];
      if (archiveTag) {
        const currentTags = task.tags();
        currentTags.push(archiveTag);
        task.tags = currentTags;
      }
      
      return {
        success: true,
        message: 'Task "' + taskName + '" archived successfully'
      };
    `;

    try {
      const result = await this.client.executeJXA(script) as any;
      
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

    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const taskIds = ${JSON.stringify(taskIds)};
      const deleted = [];
      const failed = [];
      const affectedProjects = new Set();
      
      for (const taskId of taskIds) {
        try {
          const task = doc.flattenedTasks.byId(taskId);
          if (!task) {
            failed.push(taskId);
            continue;
          }
          
          // Track affected projects for cache invalidation
          if (task.assignedContainer()) {
            affectedProjects.add(task.assignedContainer().id());
          }
          
          task.delete();
          deleted.push(taskId);
        } catch (e) {
          failed.push(taskId);
        }
      }
      
      return {
        deleted: deleted,
        failed: failed,
        affectedProjects: Array.from(affectedProjects)
      };
    `;

    try {
      const result = await this.client.executeJXA(script) as any;
      
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
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const taskIds = ${JSON.stringify(taskIds)};
      const archived = [];
      const failed = [];
      
      // Get or create archive tag
      let archiveTag = doc.flattenedTags.whose({ name: 'Archive' })[0];
      if (!archiveTag) {
        archiveTag = doc.tags.push(app.Tag({ name: 'Archive' }));
      }
      
      for (const taskId of taskIds) {
        try {
          const task = doc.flattenedTasks.byId(taskId);
          if (!task) {
            failed.push(taskId);
            continue;
          }
          
          // Archive by completing the task
          task.completed = true;
          task.completionDate = new Date();
          
          // Add archive tag
          const currentTags = task.tags();
          currentTags.push(archiveTag);
          task.tags = currentTags;
          
          archived.push(taskId);
        } catch (e) {
          failed.push(taskId);
        }
      }
      
      return {
        archived: archived,
        failed: failed
      };
    `;

    try {
      const result = await this.client.executeJXA(script) as any;
      
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

    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const project = doc.flattenedProjects.byId('${projectId}');
      if (!project) throw new Error('Project not found');
      
      const completedTasks = project.flattenedTasks.whose({ completed: true });
      const count = completedTasks.length;
      
      // Delete all completed tasks in the project
      for (let i = completedTasks.length - 1; i >= 0; i--) {
        completedTasks[i].delete();
      }
      
      return {
        success: true,
        deletedCount: count
      };
    `;

    try {
      const result = await this.client.executeJXA(script) as any;
      
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
import { OmniFocusClient } from '../omnifocus/client.js';
import { TaskExtended, UpdateTaskOptions } from '../omnifocus/types.js';
import { CacheManager } from '../cache/cache-manager.js';

export class UpdateTaskTool {
  constructor(
    private client: OmniFocusClient,
    private cache: CacheManager
  ) {}

  async updateTask(taskId: string, updates: UpdateTaskOptions): Promise<TaskExtended> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const task = doc.flattenedTasks.byId('${taskId}');
      if (!task) throw new Error('Task not found');
      
      ${updates.name !== undefined ? `task.name = '${this.escapeString(updates.name)}';` : ''}
      ${updates.note !== undefined ? `task.note = '${this.escapeString(updates.note)}';` : ''}
      ${updates.flagged !== undefined ? `task.flagged = ${updates.flagged};` : ''}
      ${updates.dueDate !== undefined ? `task.dueDate = ${updates.dueDate ? `new Date('${updates.dueDate.toISOString()}')` : 'null'};` : ''}
      ${updates.deferDate !== undefined ? `task.deferDate = ${updates.deferDate ? `new Date('${updates.deferDate.toISOString()}')` : 'null'};` : ''}
      ${updates.estimatedMinutes !== undefined ? `task.estimatedMinutes = ${updates.estimatedMinutes || 'null'};` : ''}
      
      ${updates.projectId !== undefined ? `
        if ('${updates.projectId}' === 'inbox') {
          task.assignedContainer = null;
        } else {
          const project = doc.flattenedProjects.byId('${updates.projectId}');
          if (project) {
            task.assignedContainer = project;
          }
        }
      ` : ''}
      
      ${updates.tags !== undefined ? `
        const tags = [${updates.tags.map(t => `doc.flattenedTags.byId('${t}')`).join(',')}];
        task.tags = tags.filter(t => t !== null);
      ` : ''}
      
      return {
        id: task.id(),
        name: task.name(),
        note: task.note() || '',
        completed: task.completed(),
        completionDate: task.completionDate() ? task.completionDate().toISOString() : null,
        dueDate: task.dueDate() ? task.dueDate().toISOString() : null,
        deferDate: task.deferDate() ? task.deferDate().toISOString() : null,
        flagged: task.flagged(),
        estimatedMinutes: task.estimatedMinutes() || null,
        projectId: task.assignedContainer() ? task.assignedContainer().id() : null,
        tags: task.tags().map(t => ({ id: t.id(), name: t.name() }))
      };
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate(`task:${taskId}:*`);
    await this.cache.invalidate('tasks:*');
    
    return result as TaskExtended;
  }

  async completeTask(taskId: string, completionDate?: Date): Promise<TaskExtended> {
    const date = completionDate || new Date();
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const task = doc.flattenedTasks.byId('${taskId}');
      if (!task) throw new Error('Task not found');
      
      task.completed = true;
      task.completionDate = new Date('${date.toISOString()}');
      
      return {
        id: task.id(),
        name: task.name(),
        note: task.note() || '',
        completed: task.completed(),
        completionDate: task.completionDate().toISOString(),
        dueDate: task.dueDate() ? task.dueDate().toISOString() : null,
        deferDate: task.deferDate() ? task.deferDate().toISOString() : null,
        flagged: task.flagged(),
        estimatedMinutes: task.estimatedMinutes() || null,
        projectId: task.assignedContainer() ? task.assignedContainer().id() : null,
        tags: task.tags().map(t => ({ id: t.id(), name: t.name() }))
      };
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate(`task:${taskId}:*`);
    await this.cache.invalidate('tasks:*');
    await this.cache.invalidate('completed:*');
    
    return result as TaskExtended;
  }

  async uncompleteTask(taskId: string): Promise<TaskExtended> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const task = doc.flattenedTasks.byId('${taskId}');
      if (!task) throw new Error('Task not found');
      
      task.completed = false;
      task.completionDate = null;
      
      return {
        id: task.id(),
        name: task.name(),
        note: task.note() || '',
        completed: task.completed(),
        completionDate: null,
        dueDate: task.dueDate() ? task.dueDate().toISOString() : null,
        deferDate: task.deferDate() ? task.deferDate().toISOString() : null,
        flagged: task.flagged(),
        estimatedMinutes: task.estimatedMinutes() || null,
        projectId: task.assignedContainer() ? task.assignedContainer().id() : null,
        tags: task.tags().map(t => ({ id: t.id(), name: t.name() }))
      };
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate(`task:${taskId}:*`);
    await this.cache.invalidate('tasks:*');
    await this.cache.invalidate('completed:*');
    
    return result as TaskExtended;
  }

  async moveTask(taskId: string, targetProjectId: string | null): Promise<TaskExtended> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const task = doc.flattenedTasks.byId('${taskId}');
      if (!task) throw new Error('Task not found');
      
      ${targetProjectId ? `
        const project = doc.flattenedProjects.byId('${targetProjectId}');
        if (!project) throw new Error('Target project not found');
        task.assignedContainer = project;
      ` : `
        task.assignedContainer = null; // Move to inbox
      `}
      
      return {
        id: task.id(),
        name: task.name(),
        note: task.note() || '',
        completed: task.completed(),
        completionDate: task.completionDate() ? task.completionDate().toISOString() : null,
        dueDate: task.dueDate() ? task.dueDate().toISOString() : null,
        deferDate: task.deferDate() ? task.deferDate().toISOString() : null,
        flagged: task.flagged(),
        estimatedMinutes: task.estimatedMinutes() || null,
        projectId: task.assignedContainer() ? task.assignedContainer().id() : null,
        tags: task.tags().map(t => ({ id: t.id(), name: t.name() }))
      };
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate(`task:${taskId}:*`);
    await this.cache.invalidate('tasks:*');
    if (targetProjectId) {
      await this.cache.invalidate(`project:${targetProjectId}:*`);
    }
    
    return result as TaskExtended;
  }

  async bulkUpdateTasks(taskIds: string[], updates: UpdateTaskOptions): Promise<TaskExtended[]> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      const results = [];
      
      const taskIds = ${JSON.stringify(taskIds)};
      
      for (const taskId of taskIds) {
        const task = doc.flattenedTasks.byId(taskId);
        if (!task) continue;
        
        ${updates.name !== undefined ? `task.name = '${this.escapeString(updates.name)}';` : ''}
        ${updates.note !== undefined ? `task.note = '${this.escapeString(updates.note)}';` : ''}
        ${updates.flagged !== undefined ? `task.flagged = ${updates.flagged};` : ''}
        ${updates.dueDate !== undefined ? `task.dueDate = ${updates.dueDate ? `new Date('${updates.dueDate.toISOString()}')` : 'null'};` : ''}
        ${updates.deferDate !== undefined ? `task.deferDate = ${updates.deferDate ? `new Date('${updates.deferDate.toISOString()}')` : 'null'};` : ''}
        ${updates.estimatedMinutes !== undefined ? `task.estimatedMinutes = ${updates.estimatedMinutes || 'null'};` : ''}
        
        ${updates.projectId !== undefined ? `
          if ('${updates.projectId}' === 'inbox') {
            task.assignedContainer = null;
          } else {
            const project = doc.flattenedProjects.byId('${updates.projectId}');
            if (project) {
              task.assignedContainer = project;
            }
          }
        ` : ''}
        
        ${updates.tags !== undefined ? `
          const tags = [${updates.tags.map(t => `doc.flattenedTags.byId('${t}')`).join(',')}];
          task.tags = tags.filter(t => t !== null);
        ` : ''}
        
        results.push({
          id: task.id(),
          name: task.name(),
          note: task.note() || '',
          completed: task.completed(),
          completionDate: task.completionDate() ? task.completionDate().toISOString() : null,
          dueDate: task.dueDate() ? task.dueDate().toISOString() : null,
          deferDate: task.deferDate() ? task.deferDate().toISOString() : null,
          flagged: task.flagged(),
          estimatedMinutes: task.estimatedMinutes() || null,
          projectId: task.assignedContainer() ? task.assignedContainer().id() : null,
          tags: task.tags().map(t => ({ id: t.id(), name: t.name() }))
        });
      }
      
      return results;
    `;

    const results = await this.client.executeJXA(script);
    
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
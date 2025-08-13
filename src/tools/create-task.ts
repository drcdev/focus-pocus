import { OmniFocusClient } from '../omnifocus/client.js';
import { TaskExtended, CreateTaskOptions, BatchCreateTaskOptions } from '../omnifocus/types.js';
import { CacheManager } from '../cache/cache-manager.js';
import { generateId } from '../utils/id-generator.js';

export class CreateTaskTool {
  constructor(
    private client: OmniFocusClient,
    private cache: CacheManager
  ) {}

  async createTask(options: CreateTaskOptions): Promise<TaskExtended> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const task = doc.inboxTasks.push(app.Task({
        name: '${this.escapeString(options.name)}',
        ${options.note ? `note: '${this.escapeString(options.note)}',` : ''}
        ${options.flagged !== undefined ? `flagged: ${options.flagged},` : ''}
        ${options.dueDate ? `dueDate: new Date('${options.dueDate.toISOString()}'),` : ''}
        ${options.deferDate ? `deferDate: new Date('${options.deferDate.toISOString()}'),` : ''}
        ${options.estimatedMinutes ? `estimatedMinutes: ${options.estimatedMinutes},` : ''}
      }));
      
      ${options.projectId ? `
        const project = doc.flattenedProjects.byId('${options.projectId}');
        if (project) {
          task.assignedContainer = project;
        }
      ` : ''}
      
      ${options.tags && options.tags.length > 0 ? `
        const tags = [${options.tags.map(t => `doc.flattenedTags.byId('${t}')`).join(',')}];
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

    // Build task properties object
    const taskProps: string[] = [`name: '${this.escapeString(options.name)}'`];
    
    if (options.note) {
      taskProps.push(`note: '${this.escapeString(options.note)}'`);
    }
    if (options.flagged !== undefined) {
      taskProps.push(`flagged: ${options.flagged}`);
    }
    if (options.dueDate) {
      taskProps.push(`dueDate: new Date('${options.dueDate.toISOString()}')`);
    }
    if (options.deferDate) {
      taskProps.push(`deferDate: new Date('${options.deferDate.toISOString()}')`);
    }
    if (options.estimatedMinutes) {
      taskProps.push(`estimatedMinutes: ${options.estimatedMinutes}`);
    }

    // Create the task with all properties
    const { execSync } = await import('child_process');
    const resultStr = execSync(`osascript -l JavaScript -e "
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      const task = app.Task({
        ${taskProps.join(',\n        ')}
      });
      doc.inboxTasks.push(task);
      
      // Handle project assignment if specified
      ${options.projectId ? `
        try {
          const project = doc.flattenedProjects.byId('${options.projectId}');
          if (project) {
            task.assignedContainer = project;
          }
        } catch (e) {
          // Project not found, leave in inbox
        }
      ` : ''}
      
      // Handle tag assignment if specified
      ${options.tags && options.tags.length > 0 ? `
        try {
          const tagIds = ${JSON.stringify(options.tags)};
          const tags = [];
          for (const tagId of tagIds) {
            const tag = doc.flattenedTags.byId(tagId);
            if (tag) tags.push(tag);
          }
          if (tags.length > 0) {
            task.tags = tags;
          }
        } catch (e) {
          // Tags not found, continue without them
        }
      ` : ''}
      
      JSON.stringify({
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
    "`, { encoding: 'utf8' });
    
    const task = JSON.parse(resultStr) as TaskExtended;
    
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
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      const results = [];
      
      ${options.projectId ? `
        const project = doc.flattenedProjects.byId('${options.projectId}');
        if (!project) throw new Error('Project not found');
      ` : ''}
      
      const tasks = ${JSON.stringify(options.tasks)};
      
      for (const taskData of tasks) {
        const task = doc.inboxTasks.push(app.Task({
          name: taskData.name,
          note: taskData.note || '',
          flagged: taskData.flagged || false,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          deferDate: taskData.deferDate ? new Date(taskData.deferDate) : null,
          estimatedMinutes: taskData.estimatedMinutes || null
        }));
        
        ${options.projectId ? 'task.assignedContainer = project;' : ''}
        
        if (taskData.tags && taskData.tags.length > 0) {
          const tags = taskData.tags.map(tagId => doc.flattenedTags.byId(tagId)).filter(t => t);
          task.tags = tags;
        }
        
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
    if (options.projectId) {
      await this.cache.invalidate(`project:${options.projectId}:*`);
    }
    
    return results as TaskExtended[];
  }

  async createSubtask(parentTaskId: string, options: CreateTaskOptions): Promise<TaskExtended> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const parentTask = doc.flattenedTasks.byId('${parentTaskId}');
      if (!parentTask) throw new Error('Parent task not found');
      
      const subtask = parentTask.tasks.push(app.Task({
        name: '${this.escapeString(options.name)}',
        ${options.note ? `note: '${this.escapeString(options.note)}',` : ''}
        ${options.flagged !== undefined ? `flagged: ${options.flagged},` : ''}
        ${options.dueDate ? `dueDate: new Date('${options.dueDate.toISOString()}'),` : ''}
        ${options.deferDate ? `deferDate: new Date('${options.deferDate.toISOString()}'),` : ''}
        ${options.estimatedMinutes ? `estimatedMinutes: ${options.estimatedMinutes},` : ''}
      }));
      
      ${options.tags && options.tags.length > 0 ? `
        const tags = [${options.tags.map(t => `doc.flattenedTags.byId('${t}')`).join(',')}];
        subtask.tags = tags.filter(t => t !== null);
      ` : ''}
      
      return {
        id: subtask.id(),
        name: subtask.name(),
        note: subtask.note() || '',
        completed: subtask.completed(),
        completionDate: subtask.completionDate() ? subtask.completionDate().toISOString() : null,
        dueDate: subtask.dueDate() ? subtask.dueDate().toISOString() : null,
        deferDate: subtask.deferDate() ? subtask.deferDate().toISOString() : null,
        flagged: subtask.flagged(),
        estimatedMinutes: subtask.estimatedMinutes() || null,
        parentTaskId: parentTask.id(),
        projectId: parentTask.assignedContainer() ? parentTask.assignedContainer().id() : null,
        tags: subtask.tags().map(t => ({ id: t.id(), name: t.name() }))
      };
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate(`task:${parentTaskId}:*`);
    await this.cache.invalidate('tasks:*');
    
    return result as TaskExtended;
  }

  private escapeString(str: string): string {
    return str.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }
}
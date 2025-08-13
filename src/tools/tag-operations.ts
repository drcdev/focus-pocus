import { OmniFocusClient } from '../omnifocus/client.js';
import { TagExtended, TaskExtended, ProjectExtended } from '../omnifocus/types.js';
import { CacheManager } from '../cache/cache-manager.js';

export class TagOperationsTool {
  constructor(
    private client: OmniFocusClient,
    private cache: CacheManager
  ) {}

  async createTag(name: string, parentTagId?: string): Promise<TagExtended> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      let container = doc;
      ${parentTagId ? `
        const parentTag = doc.flattenedTags.byId('${parentTagId}');
        if (parentTag) {
          container = parentTag;
        } else {
          throw new Error('Parent tag not found');
        }
      ` : ''}
      
      const tag = container.tags.push(app.Tag({
        name: '${this.escapeString(name)}'
      }));
      
      return {
        id: tag.id(),
        name: tag.name(),
        parentTagId: tag.container() && tag.container().class() === 'tag' ? tag.container().id() : null,
        availableTaskCount: tag.availableTaskCount(),
        remainingTaskCount: tag.remainingTaskCount()
      };
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate('tags:*');
    
    return result as TagExtended;
  }

  async assignTags(itemId: string, tagIds: string[], itemType: 'task' | 'project' = 'task'): Promise<boolean> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const item = doc.${itemType === 'task' ? 'flattenedTasks' : 'flattenedProjects'}.byId('${itemId}');
      if (!item) throw new Error('${itemType} not found');
      
      const tags = [];
      const tagIds = ${JSON.stringify(tagIds)};
      
      for (const tagId of tagIds) {
        const tag = doc.flattenedTags.byId(tagId);
        if (tag) {
          tags.push(tag);
        }
      }
      
      // Add new tags to existing ones
      const currentTags = item.tags();
      for (const tag of tags) {
        if (!currentTags.some(t => t.id() === tag.id())) {
          currentTags.push(tag);
        }
      }
      
      item.tags = currentTags;
      
      return true;
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate(`${itemType}:${itemId}:*`);
    await this.cache.invalidate('tags:*');
    
    return result as boolean;
  }

  async removeTags(itemId: string, tagIds: string[], itemType: 'task' | 'project' = 'task'): Promise<boolean> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const item = doc.${itemType === 'task' ? 'flattenedTasks' : 'flattenedProjects'}.byId('${itemId}');
      if (!item) throw new Error('${itemType} not found');
      
      const tagIdsToRemove = ${JSON.stringify(tagIds)};
      const currentTags = item.tags();
      
      // Filter out tags to be removed
      const newTags = currentTags.filter(tag => !tagIdsToRemove.includes(tag.id()));
      
      item.tags = newTags;
      
      return true;
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate(`${itemType}:${itemId}:*`);
    await this.cache.invalidate('tags:*');
    
    return result as boolean;
  }

  async getTaggedItems(tagId: string, itemType: 'all' | 'tasks' | 'projects' = 'all'): Promise<{ tasks: TaskExtended[], projects: ProjectExtended[] }> {
    const cacheKey = `tag:${tagId}:items:${itemType}`;
    const cached = await this.cache.get<{ tasks: TaskExtended[], projects: ProjectExtended[] }>(cacheKey);
    if (cached) return cached;

    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const tag = doc.flattenedTags.byId('${tagId}');
      if (!tag) throw new Error('Tag not found');
      
      const result = { tasks: [], projects: [] };
      
      ${itemType === 'all' || itemType === 'tasks' ? `
        const tasks = doc.flattenedTasks.whose({ tags: { _contains: tag } });
        for (const task of tasks) {
          result.tasks.push({
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
      ` : ''}
      
      ${itemType === 'all' || itemType === 'projects' ? `
        const projects = doc.flattenedProjects.whose({ tags: { _contains: tag } });
        for (const project of projects) {
          result.projects.push({
            id: project.id(),
            name: project.name(),
            note: project.note() || '',
            status: project.status(),
            flagged: project.flagged(),
            dueDate: project.dueDate() ? project.dueDate().toISOString() : null,
            deferDate: project.deferDate() ? project.deferDate().toISOString() : null,
            completionDate: project.completionDate() ? project.completionDate().toISOString() : null,
            sequential: project.sequential(),
            estimatedMinutes: project.estimatedMinutes() || null,
            taskCount: project.tasks().length,
            availableTaskCount: project.availableTasks().length,
            tags: project.tags().map(t => ({ id: t.id(), name: t.name() }))
          });
        }
      ` : ''}
      
      return result;
    `;

    const result = await this.client.executeJXA(script) as { tasks: TaskExtended[], projects: ProjectExtended[] };
    await this.cache.set(cacheKey, result, 60); // Cache for 1 minute
    
    return result;
  }

  async getAllTags(): Promise<TagExtended[]> {
    const cacheKey = 'tags:all';
    const cached = await this.cache.get<TagExtended[]>(cacheKey);
    if (cached) return cached;

    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const tags = [];
      const allTags = doc.flattenedTags();
      
      for (const tag of allTags) {
        tags.push({
          id: tag.id(),
          name: tag.name(),
          parentTagId: tag.container() && tag.container().class() === 'tag' ? tag.container().id() : null,
          availableTaskCount: tag.availableTaskCount(),
          remainingTaskCount: tag.remainingTaskCount()
        });
      }
      
      return tags;
    `;

    const result = await this.client.executeJXA(script) as TagExtended[];
    await this.cache.set(cacheKey, result, 300); // Cache for 5 minutes
    
    return result;
  }

  async getTagHierarchy(): Promise<TagExtended[]> {
    const cacheKey = 'tags:hierarchy';
    const cached = await this.cache.get<TagExtended[]>(cacheKey);
    if (cached) return cached;

    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      function buildTagTree(container) {
        const tags = [];
        const containerTags = container.tags();
        
        for (const tag of containerTags) {
          const tagData = {
            id: tag.id(),
            name: tag.name(),
            parentTagId: tag.container() && tag.container().class() === 'tag' ? tag.container().id() : null,
            availableTaskCount: tag.availableTaskCount(),
            remainingTaskCount: tag.remainingTaskCount(),
            children: buildTagTree(tag)
          };
          tags.push(tagData);
        }
        
        return tags;
      }
      
      return buildTagTree(doc);
    `;

    const result = await this.client.executeJXA(script) as TagExtended[];
    await this.cache.set(cacheKey, result, 300); // Cache for 5 minutes
    
    return result;
  }

  async renameTag(tagId: string, newName: string): Promise<TagExtended> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const tag = doc.flattenedTags.byId('${tagId}');
      if (!tag) throw new Error('Tag not found');
      
      tag.name = '${this.escapeString(newName)}';
      
      return {
        id: tag.id(),
        name: tag.name(),
        parentTagId: tag.container() && tag.container().class() === 'tag' ? tag.container().id() : null,
        availableTaskCount: tag.availableTaskCount(),
        remainingTaskCount: tag.remainingTaskCount()
      };
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate(`tag:${tagId}:*`);
    await this.cache.invalidate('tags:*');
    
    return result as TagExtended;
  }

  async deleteTag(tagId: string): Promise<boolean> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const tag = doc.flattenedTags.byId('${tagId}');
      if (!tag) throw new Error('Tag not found');
      
      tag.delete();
      
      return true;
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate(`tag:${tagId}:*`);
    await this.cache.invalidate('tags:*');
    
    return result as boolean;
  }

  // Legacy context support - maps contexts to tags
  async mapContextsToTags(): Promise<TagExtended[]> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      // In OmniFocus 3+, contexts are now tags
      // This function ensures backward compatibility
      const tags = [];
      const allTags = doc.flattenedTags();
      
      // Look for tags that were likely contexts (common patterns)
      const contextPatterns = ['@', 'Home', 'Work', 'Office', 'Phone', 'Email', 'Errand', 'Online', 'Waiting'];
      
      for (const tag of allTags) {
        const tagName = tag.name();
        const isLikelyContext = contextPatterns.some(pattern => 
          tagName.includes(pattern) || tagName.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (isLikelyContext) {
          tags.push({
            id: tag.id(),
            name: tag.name(),
            parentTagId: tag.container() && tag.container().class() === 'tag' ? tag.container().id() : null,
            availableTaskCount: tag.availableTaskCount(),
            remainingTaskCount: tag.remainingTaskCount(),
            isContext: true
          });
        }
      }
      
      return tags;
    `;

    const result = await this.client.executeJXA(script) as TagExtended[];
    
    return result;
  }

  private escapeString(str: string): string {
    return str.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }
}
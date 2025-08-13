import { OmniFocusClient } from '../omnifocus/client.js';
import { TagExtended, TaskExtended, ProjectExtended } from '../omnifocus/types.js';
import { CacheManager } from '../cache/cache-manager.js';
import { JXABridge } from '../omnifocus/jxa-bridge.js';

export class TagOperationsTool {
  constructor(
    private client: OmniFocusClient,
    private cache: CacheManager
  ) {}

  async createTag(name: string, parentTagId?: string): Promise<TagExtended> {
    const response = await JXABridge.execScriptFile('create-tag', { name, parentTagId });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create tag');
    }

    const result = response.data;
    
    // Invalidate caches
    await this.cache.invalidate('tags:*');
    
    return result as TagExtended;
  }

  async assignTags(itemId: string, tagIds: string[], itemType: 'task' | 'project' = 'task'): Promise<boolean> {
    const response = await JXABridge.execScriptFile('assign-tags', { itemId, tagIds, itemType });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to assign tags');
    }

    const result = response.data;
    
    // Invalidate caches
    await this.cache.invalidate(`${itemType}:${itemId}:*`);
    await this.cache.invalidate('tags:*');
    
    return result as boolean;
  }

  async removeTags(itemId: string, tagIds: string[], itemType: 'task' | 'project' = 'task'): Promise<boolean> {
    const response = await JXABridge.execScriptFile('remove-tags', { itemId, tagIds, itemType });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to remove tags');
    }

    const result = response.data;
    
    // Invalidate caches
    await this.cache.invalidate(`${itemType}:${itemId}:*`);
    await this.cache.invalidate('tags:*');
    
    return result as boolean;
  }

  async getTaggedItems(tagId: string, itemType: 'all' | 'tasks' | 'projects' = 'all'): Promise<{ tasks: TaskExtended[], projects: ProjectExtended[] }> {
    const cacheKey = `tag:${tagId}:items:${itemType}`;
    const cached = await this.cache.get<{ tasks: TaskExtended[], projects: ProjectExtended[] }>(cacheKey);
    if (cached) return cached;

    const response = await JXABridge.execScriptFile('get-tagged-items', { tagId, itemType });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get tagged items');
    }

    const result = response.data as { tasks: TaskExtended[], projects: ProjectExtended[] };
    await this.cache.set(cacheKey, result, 60); // Cache for 1 minute
    
    return result;
  }

  async getAllTags(): Promise<TagExtended[]> {
    const cacheKey = 'tags:all';
    const cached = await this.cache.get<TagExtended[]>(cacheKey);
    if (cached) return cached;

    const response = await JXABridge.execScriptFile('get-all-tags', {});
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get all tags');
    }

    const result = response.data as TagExtended[];
    await this.cache.set(cacheKey, result, 300); // Cache for 5 minutes
    
    return result;
  }

  async getTagHierarchy(): Promise<TagExtended[]> {
    const cacheKey = 'tags:hierarchy';
    const cached = await this.cache.get<TagExtended[]>(cacheKey);
    if (cached) return cached;

    const response = await JXABridge.execScriptFile('get-tag-hierarchy', {});
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get tag hierarchy');
    }

    const result = response.data as TagExtended[];
    await this.cache.set(cacheKey, result, 300); // Cache for 5 minutes
    
    return result;
  }

  async renameTag(tagId: string, newName: string): Promise<TagExtended> {
    const response = await JXABridge.execScriptFile('rename-tag', { tagId, newName });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to rename tag');
    }

    const result = response.data;
    
    // Invalidate caches
    await this.cache.invalidate(`tag:${tagId}:*`);
    await this.cache.invalidate('tags:*');
    
    return result as TagExtended;
  }

  async deleteTag(tagId: string): Promise<boolean> {
    const response = await JXABridge.execScriptFile('delete-tag', { tagId });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete tag');
    }

    const result = response.data;
    
    // Invalidate caches
    await this.cache.invalidate(`tag:${tagId}:*`);
    await this.cache.invalidate('tags:*');
    
    return result as boolean;
  }

  async bulkAssignTags(itemIds: string[], tagIds: string[], itemType: 'task' | 'project' = 'task'): Promise<{
    processedItems: number,
    successCount: number,
    errorCount: number,
    errors?: string[],
    tagsAssigned: number
  }> {
    const response = await JXABridge.execScriptFile('bulk-assign-tags', { itemIds, tagIds, itemType });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to bulk assign tags');
    }

    const result = response.data;
    
    // Invalidate caches for all affected items
    for (const itemId of itemIds) {
      await this.cache.invalidate(`${itemType}:${itemId}:*`);
    }
    await this.cache.invalidate('tags:*');
    
    return result as {
      processedItems: number,
      successCount: number,
      errorCount: number,
      errors?: string[],
      tagsAssigned: number
    };
  }

  // Legacy context support - maps contexts to tags
  async mapContextsToTags(): Promise<TagExtended[]> {
    const response = await JXABridge.execScriptFile('map-contexts-to-tags', {});
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to map contexts to tags');
    }

    const result = response.data as TagExtended[];
    
    return result;
  }

}
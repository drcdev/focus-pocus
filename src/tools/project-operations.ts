import { OmniFocusClient } from '../omnifocus/client.js';
import { ProjectExtended, ProjectStatus, CreateProjectOptions, UpdateProjectOptions, FolderExtended } from '../omnifocus/types.js';
import { CacheManager } from '../cache/cache-manager.js';
import { JXABridge } from '../omnifocus/jxa-bridge.js';

export class ProjectOperationsTool {
  constructor(
    private client: OmniFocusClient,
    private cache: CacheManager
  ) {}

  async createProject(options: CreateProjectOptions): Promise<ProjectExtended> {
    const response = await JXABridge.execScriptFile('create-project', { options });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create project');
    }

    const result = response.data;
    
    // Invalidate caches
    await this.cache.invalidate('projects:*');
    if (options.folderId) {
      await this.cache.invalidate(`folder:${options.folderId}:*`);
    }
    
    return result as ProjectExtended;
  }

  async updateProject(projectId: string, updates: UpdateProjectOptions): Promise<ProjectExtended> {
    const response = await JXABridge.execScriptFile('update-project', { projectId, updates });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update project');
    }

    const result = response.data;
    
    // Invalidate caches
    await this.cache.invalidate(`project:${projectId}:*`);
    await this.cache.invalidate('projects:*');
    
    return result as ProjectExtended;
  }

  async setProjectStatus(projectId: string, status: ProjectStatus): Promise<ProjectExtended> {
    return this.updateProject(projectId, { status });
  }

  async duplicateProject(projectId: string, newName?: string, includeTasks: boolean = true): Promise<ProjectExtended> {
    const response = await JXABridge.execScriptFile('duplicate-project', { projectId, newName, includeTasks });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to duplicate project');
    }

    const result = response.data;
    
    // Invalidate caches
    await this.cache.invalidate('projects:*');
    
    return result as ProjectExtended;
  }

  async createFolder(name: string, parentFolderId?: string): Promise<FolderExtended> {
    const response = await JXABridge.execScriptFile('create-folder', { name, parentFolderId });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create folder');
    }

    const result = response.data;
    
    // Invalidate caches
    await this.cache.invalidate('folders:*');
    if (parentFolderId) {
      await this.cache.invalidate(`folder:${parentFolderId}:*`);
    }
    
    return result as FolderExtended;
  }

  async moveProject(projectId: string, targetFolderId: string | null): Promise<ProjectExtended> {
    const response = await JXABridge.execScriptFile('move-project', { projectId, targetFolderId });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to move project');
    }

    const result = response.data;
    
    // Invalidate caches
    await this.cache.invalidate(`project:${projectId}:*`);
    await this.cache.invalidate('projects:*');
    await this.cache.invalidate('folders:*');
    
    return result as ProjectExtended;
  }

  async getFolderHierarchy(): Promise<FolderExtended[]> {
    const cacheKey = 'folder:hierarchy';
    const cached = await this.cache.get<FolderExtended[]>(cacheKey);
    if (cached) return cached;

    const response = await JXABridge.execScriptFile('get-folder-hierarchy', {});
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get folder hierarchy');
    }

    const result = response.data as FolderExtended[];
    await this.cache.set(cacheKey, result, 300); // Cache for 5 minutes
    
    return result;
  }

}
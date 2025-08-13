import { OmniFocusClient } from '../omnifocus/client.js';
import { ProjectExtended, ProjectStatus, CreateProjectOptions, UpdateProjectOptions, FolderExtended } from '../omnifocus/types.js';
import { CacheManager } from '../cache/cache-manager.js';

export class ProjectOperationsTool {
  constructor(
    private client: OmniFocusClient,
    private cache: CacheManager
  ) {}

  async createProject(options: CreateProjectOptions): Promise<ProjectExtended> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const projectData = {
        name: '${this.escapeString(options.name)}',
        ${options.note ? `note: '${this.escapeString(options.note)}',` : ''}
        ${options.status ? `status: '${options.status}',` : ''}
        ${options.flagged !== undefined ? `flagged: ${options.flagged},` : ''}
        ${options.dueDate ? `dueDate: new Date('${options.dueDate.toISOString()}'),` : ''}
        ${options.deferDate ? `deferDate: new Date('${options.deferDate.toISOString()}'),` : ''}
        ${options.reviewInterval ? `reviewInterval: { unit: '${options.reviewInterval.unit}', steps: ${options.reviewInterval.steps} },` : ''}
        ${options.completionDate ? `completionDate: new Date('${options.completionDate.toISOString()}'),` : ''}
        ${options.sequential !== undefined ? `sequential: ${options.sequential},` : ''}
        ${options.estimatedMinutes ? `estimatedMinutes: ${options.estimatedMinutes},` : ''}
      };
      
      let container = doc;
      ${options.folderId ? `
        const folder = doc.flattenedFolders.byId('${options.folderId}');
        if (folder) {
          container = folder;
        }
      ` : ''}
      
      const project = container.projects.push(app.Project(projectData));
      
      ${options.tags && options.tags.length > 0 ? `
        const tags = [${options.tags.map(t => `doc.flattenedTags.byId('${t}')`).join(',')}];
        project.tags = tags.filter(t => t !== null);
      ` : ''}
      
      return {
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
        folderId: project.container() && project.container().class() === 'folder' ? project.container().id() : null,
        taskCount: project.tasks().length,
        availableTaskCount: project.availableTasks().length,
        tags: project.tags().map(t => ({ id: t.id(), name: t.name() }))
      };
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate('projects:*');
    if (options.folderId) {
      await this.cache.invalidate(`folder:${options.folderId}:*`);
    }
    
    return result as ProjectExtended;
  }

  async updateProject(projectId: string, updates: UpdateProjectOptions): Promise<ProjectExtended> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const project = doc.flattenedProjects.byId('${projectId}');
      if (!project) throw new Error('Project not found');
      
      ${updates.name !== undefined ? `project.name = '${this.escapeString(updates.name)}';` : ''}
      ${updates.note !== undefined ? `project.note = '${this.escapeString(updates.note)}';` : ''}
      ${updates.status !== undefined ? `project.status = '${updates.status}';` : ''}
      ${updates.flagged !== undefined ? `project.flagged = ${updates.flagged};` : ''}
      ${updates.dueDate !== undefined ? `project.dueDate = ${updates.dueDate ? `new Date('${updates.dueDate.toISOString()}')` : 'null'};` : ''}
      ${updates.deferDate !== undefined ? `project.deferDate = ${updates.deferDate ? `new Date('${updates.deferDate.toISOString()}')` : 'null'};` : ''}
      ${updates.sequential !== undefined ? `project.sequential = ${updates.sequential};` : ''}
      ${updates.estimatedMinutes !== undefined ? `project.estimatedMinutes = ${updates.estimatedMinutes || 'null'};` : ''}
      
      ${updates.reviewInterval ? `
        project.reviewInterval = { 
          unit: '${updates.reviewInterval.unit}', 
          steps: ${updates.reviewInterval.steps} 
        };
      ` : ''}
      
      ${updates.tags !== undefined ? `
        const tags = [${updates.tags.map(t => `doc.flattenedTags.byId('${t}')`).join(',')}];
        project.tags = tags.filter(t => t !== null);
      ` : ''}
      
      return {
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
        folderId: project.container() && project.container().class() === 'folder' ? project.container().id() : null,
        taskCount: project.tasks().length,
        availableTaskCount: project.availableTasks().length,
        tags: project.tags().map(t => ({ id: t.id(), name: t.name() }))
      };
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate(`project:${projectId}:*`);
    await this.cache.invalidate('projects:*');
    
    return result as ProjectExtended;
  }

  async setProjectStatus(projectId: string, status: ProjectStatus): Promise<ProjectExtended> {
    return this.updateProject(projectId, { status });
  }

  async duplicateProject(projectId: string, newName?: string, includeTasks: boolean = true): Promise<ProjectExtended> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const sourceProject = doc.flattenedProjects.byId('${projectId}');
      if (!sourceProject) throw new Error('Source project not found');
      
      const container = sourceProject.container() || doc;
      const duplicateName = ${newName ? `'${this.escapeString(newName)}'` : `sourceProject.name() + ' (Copy)'`};
      
      const newProject = container.projects.push(app.Project({
        name: duplicateName,
        note: sourceProject.note(),
        status: 'active',
        flagged: sourceProject.flagged(),
        dueDate: sourceProject.dueDate(),
        deferDate: sourceProject.deferDate(),
        sequential: sourceProject.sequential(),
        estimatedMinutes: sourceProject.estimatedMinutes()
      }));
      
      // Copy tags
      newProject.tags = sourceProject.tags();
      
      ${includeTasks ? `
        // Duplicate tasks
        function duplicateTask(sourceTask, targetContainer) {
          const newTask = targetContainer.tasks.push(app.Task({
            name: sourceTask.name(),
            note: sourceTask.note(),
            flagged: sourceTask.flagged(),
            dueDate: sourceTask.dueDate(),
            deferDate: sourceTask.deferDate(),
            estimatedMinutes: sourceTask.estimatedMinutes()
          }));
          
          newTask.tags = sourceTask.tags();
          
          // Recursively duplicate subtasks
          const subtasks = sourceTask.tasks();
          for (const subtask of subtasks) {
            duplicateTask(subtask, newTask);
          }
          
          return newTask;
        }
        
        const sourceTasks = sourceProject.tasks();
        for (const task of sourceTasks) {
          duplicateTask(task, newProject);
        }
      ` : ''}
      
      return {
        id: newProject.id(),
        name: newProject.name(),
        note: newProject.note() || '',
        status: newProject.status(),
        flagged: newProject.flagged(),
        dueDate: newProject.dueDate() ? newProject.dueDate().toISOString() : null,
        deferDate: newProject.deferDate() ? newProject.deferDate().toISOString() : null,
        completionDate: null,
        sequential: newProject.sequential(),
        estimatedMinutes: newProject.estimatedMinutes() || null,
        folderId: newProject.container() && newProject.container().class() === 'folder' ? newProject.container().id() : null,
        taskCount: newProject.tasks().length,
        availableTaskCount: newProject.availableTasks().length,
        tags: newProject.tags().map(t => ({ id: t.id(), name: t.name() }))
      };
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate('projects:*');
    
    return result as ProjectExtended;
  }

  async createFolder(name: string, parentFolderId?: string): Promise<FolderExtended> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      let container = doc;
      ${parentFolderId ? `
        const parentFolder = doc.flattenedFolders.byId('${parentFolderId}');
        if (parentFolder) {
          container = parentFolder;
        }
      ` : ''}
      
      const folder = container.folders.push(app.Folder({
        name: '${this.escapeString(name)}'
      }));
      
      return {
        id: folder.id(),
        name: folder.name(),
        parentFolderId: folder.container() && folder.container().class() === 'folder' ? folder.container().id() : null,
        projectCount: folder.projects().length,
        folderCount: folder.folders().length
      };
    `;

    const result = await this.client.executeJXA(script);
    
    // Invalidate caches
    await this.cache.invalidate('folders:*');
    if (parentFolderId) {
      await this.cache.invalidate(`folder:${parentFolderId}:*`);
    }
    
    return result as FolderExtended;
  }

  async moveProject(projectId: string, targetFolderId: string | null): Promise<ProjectExtended> {
    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      const project = doc.flattenedProjects.byId('${projectId}');
      if (!project) throw new Error('Project not found');
      
      ${targetFolderId ? `
        const targetFolder = doc.flattenedFolders.byId('${targetFolderId}');
        if (!targetFolder) throw new Error('Target folder not found');
        project.container = targetFolder;
      ` : `
        project.container = doc; // Move to root
      `}
      
      return {
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
        folderId: project.container() && project.container().class() === 'folder' ? project.container().id() : null,
        taskCount: project.tasks().length,
        availableTaskCount: project.availableTasks().length,
        tags: project.tags().map(t => ({ id: t.id(), name: t.name() }))
      };
    `;

    const result = await this.client.executeJXA(script);
    
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

    const script = `
      const app = Application('OmniFocus');
      const doc = app.defaultDocument;
      
      function buildFolderTree(container) {
        const folders = [];
        const containerFolders = container.folders();
        
        for (const folder of containerFolders) {
          const folderData = {
            id: folder.id(),
            name: folder.name(),
            parentFolderId: folder.container() && folder.container().class() === 'folder' ? folder.container().id() : null,
            projectCount: folder.projects().length,
            folderCount: folder.folders().length,
            children: buildFolderTree(folder)
          };
          folders.push(folderData);
        }
        
        return folders;
      }
      
      return buildFolderTree(doc);
    `;

    const result = await this.client.executeJXA(script) as FolderExtended[];
    await this.cache.set(cacheKey, result, 300); // Cache for 5 minutes
    
    return result;
  }

  private escapeString(str: string): string {
    return str.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }
}
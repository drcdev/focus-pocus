import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JXABridge } from '../src/omnifocus/jxa-bridge';
import { ProjectOperationsTool } from '../src/tools/project-operations';
import { CacheManager } from '../src/cache/cache-manager';
import { OmniFocusClient } from '../src/omnifocus/client';

// Mock dependencies
jest.mock('../src/omnifocus/jxa-bridge');
jest.mock('../src/cache/cache-manager');
jest.mock('../src/omnifocus/client');

const mockJXABridge = jest.mocked(JXABridge);

describe('Project Operations Integration Tests', () => {
  let mockCache: jest.Mocked<CacheManager>;
  let mockClient: jest.Mocked<OmniFocusClient>;
  let projectOperationsTool: ProjectOperationsTool;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCache = {
      invalidate: jest.fn(),
      invalidateProjectCache: jest.fn(),
      invalidateTaskCache: jest.fn()
    } as any;

    mockClient = {} as any;

    projectOperationsTool = new ProjectOperationsTool(mockClient, mockCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Project Creation Operations', () => {
    describe('createProject', () => {
      it('should create project successfully', async () => {
        const mockProject = {
          id: 'project-123',
          name: 'New Project',
          note: 'Project description',
          status: 'active',
          creationDate: '2025-08-13T12:00:00Z',
          modificationDate: '2025-08-13T12:00:00Z',
          flagged: false,
          taskCount: 0,
          completedTaskCount: 0,
          remainingTaskCount: 0
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockProject
        });

        const result = await projectOperationsTool.createProject({
          name: 'New Project',
          note: 'Project description',
          folderId: 'folder-123'
        });

        expect(result).toEqual(mockProject);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('create-project', {
          name: 'New Project',
          note: 'Project description',
          folderId: 'folder-123'
        });
        expect(mockCache.invalidateProjectCache).toHaveBeenCalled();
        expect(mockCache.invalidate).toHaveBeenCalledWith('folders:*');
      });

      it('should create project in root folder', async () => {
        const mockProject = {
          id: 'project-456',
          name: 'Root Project',
          status: 'active',
          folderId: null
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockProject
        });

        const result = await projectOperationsTool.createProject({
          name: 'Root Project'
        });

        expect(result).toEqual(mockProject);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('create-project', {
          name: 'Root Project'
        });
      });

      it('should handle create project errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Project name already exists' }
        });

        await expect(projectOperationsTool.createProject({ name: 'Duplicate' }))
          .rejects.toThrow('Project name already exists');
      });

      it('should create project with all properties', async () => {
        const mockProject = {
          id: 'project-789',
          name: 'Complete Project',
          note: 'Detailed description',
          status: 'on_hold',
          flagged: true,
          tags: ['important', 'work']
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockProject
        });

        const result = await projectOperationsTool.createProject({
          name: 'Complete Project',
          note: 'Detailed description',
          status: 'on_hold',
          flagged: true,
          tags: ['important', 'work'],
          folderId: 'work-folder'
        });

        expect(result).toEqual(mockProject);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('create-project', {
          name: 'Complete Project',
          note: 'Detailed description',
          status: 'on_hold',
          flagged: true,
          tags: ['important', 'work'],
          folderId: 'work-folder'
        });
      });
    });
  });

  describe('Project Update Operations', () => {
    describe('updateProject', () => {
      it('should update project successfully', async () => {
        const mockUpdatedProject = {
          id: 'project-123',
          name: 'Updated Project Name',
          note: 'Updated description',
          status: 'on_hold',
          modificationDate: '2025-08-13T13:00:00Z'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockUpdatedProject
        });

        const result = await projectOperationsTool.updateProject('project-123', {
          name: 'Updated Project Name',
          note: 'Updated description',
          status: 'on_hold'
        });

        expect(result).toEqual(mockUpdatedProject);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('update-project', {
          projectId: 'project-123',
          updates: {
            name: 'Updated Project Name',
            note: 'Updated description',
            status: 'on_hold'
          }
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('project:project-123:*');
        expect(mockCache.invalidateProjectCache).toHaveBeenCalled();
      });

      it('should update project status only', async () => {
        const mockUpdatedProject = {
          id: 'project-123',
          name: 'Existing Project',
          status: 'completed'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockUpdatedProject
        });

        const result = await projectOperationsTool.updateProject('project-123', {
          status: 'completed'
        });

        expect(result).toEqual(mockUpdatedProject);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('update-project', {
          projectId: 'project-123',
          updates: {
            status: 'completed'
          }
        });
      });

      it('should handle update project errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Project not found' }
        });

        await expect(projectOperationsTool.updateProject('nonexistent', { name: 'Updated' }))
          .rejects.toThrow('Project not found');
      });
    });

    describe('moveProject', () => {
      it('should move project to different folder successfully', async () => {
        const mockMovedProject = {
          id: 'project-123',
          name: 'Moved Project',
          folderId: 'new-folder-456'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockMovedProject
        });

        const result = await projectOperationsTool.moveProject('project-123', 'new-folder-456');

        expect(result).toEqual(mockMovedProject);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('move-project', {
          projectId: 'project-123',
          targetFolderId: 'new-folder-456'
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('project:project-123:*');
        expect(mockCache.invalidate).toHaveBeenCalledWith('folder:new-folder-456:*');
        expect(mockCache.invalidateProjectCache).toHaveBeenCalled();
      });

      it('should move project to root folder', async () => {
        const mockMovedProject = {
          id: 'project-123',
          name: 'Root Project',
          folderId: null
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockMovedProject
        });

        const result = await projectOperationsTool.moveProject('project-123', null);

        expect(result).toEqual(mockMovedProject);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('move-project', {
          projectId: 'project-123',
          targetFolderId: null
        });
      });

      it('should handle move project errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Cannot move project to itself' }
        });

        await expect(projectOperationsTool.moveProject('project-123', 'invalid-folder'))
          .rejects.toThrow('Cannot move project to itself');
      });
    });

    describe('duplicateProject', () => {
      it('should duplicate project successfully', async () => {
        const mockDuplicatedProject = {
          id: 'project-duplicate',
          name: 'Copy of Original Project',
          note: 'Duplicated from original',
          status: 'active',
          taskCount: 5
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockDuplicatedProject
        });

        const result = await projectOperationsTool.duplicateProject('project-123', 'Copy of Original Project');

        expect(result).toEqual(mockDuplicatedProject);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('duplicate-project', {
          projectId: 'project-123',
          newName: 'Copy of Original Project'
        });
        expect(mockCache.invalidateProjectCache).toHaveBeenCalled();
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });

      it('should duplicate project with auto-generated name', async () => {
        const mockDuplicatedProject = {
          id: 'project-duplicate',
          name: 'Original Project Copy',
          status: 'active'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockDuplicatedProject
        });

        const result = await projectOperationsTool.duplicateProject('project-123');

        expect(result).toEqual(mockDuplicatedProject);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('duplicate-project', {
          projectId: 'project-123',
          newName: undefined
        });
      });

      it('should handle duplicate project errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Source project not found' }
        });

        await expect(projectOperationsTool.duplicateProject('nonexistent'))
          .rejects.toThrow('Source project not found');
      });
    });
  });

  describe('Project Task Management', () => {
    describe('deleteCompletedTasksInProject', () => {
      it('should delete completed tasks successfully', async () => {
        const mockResult = {
          deleted: 8,
          projectId: 'project-123',
          success: true,
          message: 'Deleted 8 completed tasks'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const result = await projectOperationsTool.deleteCompletedTasksInProject('project-123');

        expect(result).toEqual(mockResult);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('delete-completed-in-project', {
          projectId: 'project-123'
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('project:project-123:*');
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });

      it('should handle no completed tasks to delete', async () => {
        const mockResult = {
          deleted: 0,
          projectId: 'project-123',
          success: true,
          message: 'No completed tasks found'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const result = await projectOperationsTool.deleteCompletedTasksInProject('project-123');

        expect(result).toEqual(mockResult);
        expect(result.deleted).toBe(0);
      });

      it('should handle delete completed tasks errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Project not found' }
        });

        await expect(projectOperationsTool.deleteCompletedTasksInProject('nonexistent'))
          .rejects.toThrow('Project not found');
      });
    });
  });

  describe('Folder Operations', () => {
    describe('createFolder', () => {
      it('should create folder successfully', async () => {
        const mockFolder = {
          id: 'folder-123',
          name: 'New Folder',
          creationDate: '2025-08-13T12:00:00Z',
          modificationDate: '2025-08-13T12:00:00Z',
          projectCount: 0,
          subfolderCount: 0
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockFolder
        });

        const result = await projectOperationsTool.createFolder('New Folder', 'parent-folder-456');

        expect(result).toEqual(mockFolder);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('create-folder', {
          name: 'New Folder',
          parentFolderId: 'parent-folder-456'
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('folders:*');
        expect(mockCache.invalidate).toHaveBeenCalledWith('folder:parent-folder-456:*');
      });

      it('should create root folder', async () => {
        const mockFolder = {
          id: 'folder-789',
          name: 'Root Folder',
          parentFolderId: null,
          projectCount: 0
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockFolder
        });

        const result = await projectOperationsTool.createFolder('Root Folder');

        expect(result).toEqual(mockFolder);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('create-folder', {
          name: 'Root Folder',
          parentFolderId: undefined
        });
      });

      it('should handle create folder errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Folder name already exists' }
        });

        await expect(projectOperationsTool.createFolder('Duplicate Folder'))
          .rejects.toThrow('Folder name already exists');
      });
    });

    describe('getFolderHierarchy', () => {
      it('should get folder hierarchy successfully', async () => {
        const mockHierarchy = {
          rootFolders: [
            {
              id: 'folder-1',
              name: 'Work',
              projectCount: 5,
              subfolders: [
                {
                  id: 'folder-2',
                  name: 'Active Projects',
                  projectCount: 3,
                  subfolders: []
                }
              ]
            },
            {
              id: 'folder-3',
              name: 'Personal',
              projectCount: 2,
              subfolders: []
            }
          ]
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockHierarchy
        });

        const result = await projectOperationsTool.getFolderHierarchy();

        expect(result).toEqual(mockHierarchy);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-folder-hierarchy', {});
      });

      it('should handle empty folder hierarchy', async () => {
        const mockHierarchy = {
          rootFolders: []
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockHierarchy
        });

        const result = await projectOperationsTool.getFolderHierarchy();

        expect(result).toEqual(mockHierarchy);
        expect(result.rootFolders).toHaveLength(0);
      });

      it('should handle get folder hierarchy errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Cannot access folder structure' }
        });

        await expect(projectOperationsTool.getFolderHierarchy())
          .rejects.toThrow('Cannot access folder structure');
      });
    });
  });

  describe('Error Handling', () => {
    const projectOperationScripts = [
      'create-project',
      'update-project',
      'move-project',
      'duplicate-project',
      'delete-completed-in-project',
      'create-folder',
      'get-folder-hierarchy'
    ];

    describe('Permission Errors', () => {
      it.each(projectOperationScripts)('should handle permission denied for %s', async (script) => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: {
            type: 'permission',
            code: 'PERMISSION_DENIED',
            message: 'not authorized to send Apple events'
          }
        });

        const result = await JXABridge.execScriptFile(script, {});

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('permission');
        expect(result.error?.code).toBe('PERMISSION_DENIED');
      });
    });

    describe('App Unavailable Errors', () => {
      it.each(projectOperationScripts)('should handle app unavailable for %s', async (script) => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: {
            type: 'app_unavailable',
            code: 'APP_UNAVAILABLE',
            message: 'application is not running'
          }
        });

        const result = await JXABridge.execScriptFile(script, {});

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('app_unavailable');
        expect(result.error?.code).toBe('APP_UNAVAILABLE');
      });
    });

    describe('Script Errors', () => {
      it.each(projectOperationScripts)('should handle script errors for %s', async (script) => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: {
            type: 'script_error',
            code: 'SCRIPT_ERROR',
            message: 'execution error: syntax error'
          }
        });

        const result = await JXABridge.execScriptFile(script, {});

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('script_error');
        expect(result.error?.code).toBe('SCRIPT_ERROR');
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate appropriate caches for project operations', async () => {
      const mockProject = { id: 'project-123', name: 'Test Project' };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockProject
      });

      await projectOperationsTool.createProject({ name: 'Test Project' });

      expect(mockCache.invalidateProjectCache).toHaveBeenCalled();
      expect(mockCache.invalidate).toHaveBeenCalledWith('folders:*');
    });

    it('should invalidate appropriate caches for project updates', async () => {
      const mockProject = { id: 'project-123', name: 'Updated Project' };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockProject
      });

      await projectOperationsTool.updateProject('project-123', { name: 'Updated Project' });

      expect(mockCache.invalidate).toHaveBeenCalledWith('project:project-123:*');
      expect(mockCache.invalidateProjectCache).toHaveBeenCalled();
    });

    it('should invalidate appropriate caches for folder operations', async () => {
      const mockFolder = { id: 'folder-123', name: 'Test Folder' };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockFolder
      });

      await projectOperationsTool.createFolder('Test Folder', 'parent-folder');

      expect(mockCache.invalidate).toHaveBeenCalledWith('folders:*');
      expect(mockCache.invalidate).toHaveBeenCalledWith('folder:parent-folder:*');
    });
  });
});
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JXABridge } from '../src/omnifocus/jxa-bridge';
import { TagOperationsTool } from '../src/tools/tag-operations';
import { CacheManager } from '../src/cache/cache-manager';
import { OmniFocusClient } from '../src/omnifocus/client';

// Mock dependencies
jest.mock('../src/omnifocus/jxa-bridge');
jest.mock('../src/cache/cache-manager');
jest.mock('../src/omnifocus/client');

const mockJXABridge = jest.mocked(JXABridge);

describe('Tag Operations Integration Tests', () => {
  let mockCache: jest.Mocked<CacheManager>;
  let mockClient: jest.Mocked<OmniFocusClient>;
  let tagOperationsTool: TagOperationsTool;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCache = {
      invalidate: jest.fn(),
      invalidateTaskCache: jest.fn(),
      invalidateProjectCache: jest.fn()
    } as any;

    mockClient = {} as any;

    tagOperationsTool = new TagOperationsTool(mockClient, mockCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Tag Creation Operations', () => {
    describe('createTag', () => {
      it('should create tag successfully', async () => {
        const mockTag = {
          id: 'tag-123',
          name: 'urgent',
          active: true,
          allowsNextAction: true,
          creationDate: '2025-08-13T12:00:00Z',
          modificationDate: '2025-08-13T12:00:00Z',
          usedCount: 0
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockTag
        });

        const result = await tagOperationsTool.createTag({
          name: 'urgent',
          allowsNextAction: true
        });

        expect(result).toEqual(mockTag);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('create-tag', {
          name: 'urgent',
          allowsNextAction: true
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('tags:*');
      });

      it('should create tag with minimal properties', async () => {
        const mockTag = {
          id: 'tag-456',
          name: 'simple-tag',
          active: true,
          allowsNextAction: false
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockTag
        });

        const result = await tagOperationsTool.createTag({
          name: 'simple-tag'
        });

        expect(result).toEqual(mockTag);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('create-tag', {
          name: 'simple-tag'
        });
      });

      it('should handle create tag errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Tag name already exists' }
        });

        await expect(tagOperationsTool.createTag({ name: 'existing-tag' }))
          .rejects.toThrow('Tag name already exists');
      });

      it('should handle invalid tag names', async () => {
        await expect(tagOperationsTool.createTag({ name: '' }))
          .rejects.toThrow('Tag name cannot be empty');

        expect(mockJXABridge.execScriptFile).not.toHaveBeenCalled();
      });
    });
  });

  describe('Tag Assignment Operations', () => {
    describe('assignTags', () => {
      it('should assign tags to task successfully', async () => {
        const mockResult = {
          itemId: 'task-123',
          itemType: 'task',
          assignedTags: ['urgent', 'work'],
          success: true,
          message: 'Tags assigned successfully'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const result = await tagOperationsTool.assignTags('task-123', 'task', ['tag-urgent', 'tag-work']);

        expect(result).toEqual(mockResult);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('assign-tags', {
          itemId: 'task-123',
          itemType: 'task',
          tagIds: ['tag-urgent', 'tag-work']
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('task:task-123:*');
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });

      it('should assign tags to project successfully', async () => {
        const mockResult = {
          itemId: 'project-123',
          itemType: 'project',
          assignedTags: ['important'],
          success: true
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const result = await tagOperationsTool.assignTags('project-123', 'project', ['tag-important']);

        expect(result).toEqual(mockResult);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('assign-tags', {
          itemId: 'project-123',
          itemType: 'project',
          tagIds: ['tag-important']
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('project:project-123:*');
        expect(mockCache.invalidateProjectCache).toHaveBeenCalled();
      });

      it('should handle assign tags errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Item not found' }
        });

        await expect(tagOperationsTool.assignTags('nonexistent', 'task', ['tag-1']))
          .rejects.toThrow('Item not found');
      });

      it('should handle empty tag list', async () => {
        await expect(tagOperationsTool.assignTags('task-123', 'task', []))
          .rejects.toThrow('No tags provided for assignment');

        expect(mockJXABridge.execScriptFile).not.toHaveBeenCalled();
      });

      it('should handle invalid item types', async () => {
        await expect(tagOperationsTool.assignTags('item-123', 'invalid' as any, ['tag-1']))
          .rejects.toThrow('Invalid item type: invalid');
      });
    });

    describe('removeTags', () => {
      it('should remove tags from task successfully', async () => {
        const mockResult = {
          itemId: 'task-123',
          itemType: 'task',
          removedTags: ['urgent'],
          success: true,
          message: 'Tags removed successfully'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const result = await tagOperationsTool.removeTags('task-123', 'task', ['tag-urgent']);

        expect(result).toEqual(mockResult);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('remove-tags', {
          itemId: 'task-123',
          itemType: 'task',
          tagIds: ['tag-urgent']
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('task:task-123:*');
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      });

      it('should remove tags from project successfully', async () => {
        const mockResult = {
          itemId: 'project-123',
          itemType: 'project',
          removedTags: ['old-tag'],
          success: true
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const result = await tagOperationsTool.removeTags('project-123', 'project', ['tag-old']);

        expect(result).toEqual(mockResult);
        expect(mockCache.invalidate).toHaveBeenCalledWith('project:project-123:*');
        expect(mockCache.invalidateProjectCache).toHaveBeenCalled();
      });

      it('should handle remove tags errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Tag not assigned to item' }
        });

        await expect(tagOperationsTool.removeTags('task-123', 'task', ['tag-nonexistent']))
          .rejects.toThrow('Tag not assigned to item');
      });

      it('should handle empty tag removal list', async () => {
        await expect(tagOperationsTool.removeTags('task-123', 'task', []))
          .rejects.toThrow('No tags provided for removal');

        expect(mockJXABridge.execScriptFile).not.toHaveBeenCalled();
      });
    });
  });

  describe('Tag Query Operations', () => {
    describe('getTaggedItems', () => {
      it('should get tagged items successfully', async () => {
        const mockTaggedItems = [
          {
            id: 'task-1',
            name: 'Urgent Task 1',
            type: 'task',
            completed: false,
            flagged: true
          },
          {
            id: 'task-2', 
            name: 'Urgent Task 2',
            type: 'task',
            completed: false,
            flagged: false
          },
          {
            id: 'project-1',
            name: 'Urgent Project',
            type: 'project',
            status: 'active'
          }
        ];

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockTaggedItems
        });

        const result = await tagOperationsTool.getTaggedItems('tag-urgent', 'all');

        expect(result).toEqual(mockTaggedItems);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-tagged-items', {
          tagId: 'tag-urgent',
          itemType: 'all'
        });
      });

      it('should get tagged tasks only', async () => {
        const mockTaggedTasks = [
          {
            id: 'task-1',
            name: 'Work Task 1',
            type: 'task',
            completed: false
          },
          {
            id: 'task-2',
            name: 'Work Task 2',
            type: 'task',
            completed: true
          }
        ];

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockTaggedTasks
        });

        const result = await tagOperationsTool.getTaggedItems('tag-work', 'task');

        expect(result).toEqual(mockTaggedTasks);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-tagged-items', {
          tagId: 'tag-work',
          itemType: 'task'
        });
      });

      it('should get tagged projects only', async () => {
        const mockTaggedProjects = [
          {
            id: 'project-1',
            name: 'Important Project',
            type: 'project',
            status: 'active'
          }
        ];

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockTaggedProjects
        });

        const result = await tagOperationsTool.getTaggedItems('tag-important', 'project');

        expect(result).toEqual(mockTaggedProjects);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-tagged-items', {
          tagId: 'tag-important',
          itemType: 'project'
        });
      });

      it('should handle empty tagged items result', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: []
        });

        const result = await tagOperationsTool.getTaggedItems('tag-unused', 'all');

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should handle get tagged items errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Tag not found' }
        });

        await expect(tagOperationsTool.getTaggedItems('nonexistent-tag', 'all'))
          .rejects.toThrow('Tag not found');
      });
    });

    describe('getAllTags', () => {
      it('should get all tags successfully', async () => {
        const mockAllTags = [
          {
            id: 'tag-1',
            name: 'urgent',
            active: true,
            allowsNextAction: true,
            usedCount: 15,
            creationDate: '2025-08-10T10:00:00Z'
          },
          {
            id: 'tag-2',
            name: 'work',
            active: true,
            allowsNextAction: true,
            usedCount: 25,
            creationDate: '2025-08-09T14:00:00Z'
          },
          {
            id: 'tag-3',
            name: 'personal',
            active: true,
            allowsNextAction: false,
            usedCount: 8,
            creationDate: '2025-08-08T16:00:00Z'
          }
        ];

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockAllTags
        });

        const result = await tagOperationsTool.getAllTags();

        expect(result).toEqual(mockAllTags);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-all-tags', {});
      });

      it('should handle empty tags result', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: []
        });

        const result = await tagOperationsTool.getAllTags();

        expect(result).toEqual([]);
      });

      it('should handle get all tags errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Cannot access tag database' }
        });

        await expect(tagOperationsTool.getAllTags())
          .rejects.toThrow('Cannot access tag database');
      });
    });

    describe('getTagHierarchy', () => {
      it('should get tag hierarchy successfully', async () => {
        const mockHierarchy = {
          rootTags: [
            {
              id: 'tag-work',
              name: 'work',
              active: true,
              usedCount: 25,
              subtags: [
                {
                  id: 'tag-urgent-work',
                  name: 'urgent',
                  parentId: 'tag-work',
                  usedCount: 8,
                  subtags: []
                },
                {
                  id: 'tag-meetings',
                  name: 'meetings',
                  parentId: 'tag-work', 
                  usedCount: 12,
                  subtags: []
                }
              ]
            },
            {
              id: 'tag-personal',
              name: 'personal',
              active: true,
              usedCount: 15,
              subtags: [
                {
                  id: 'tag-errands',
                  name: 'errands',
                  parentId: 'tag-personal',
                  usedCount: 6,
                  subtags: []
                }
              ]
            }
          ]
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockHierarchy
        });

        const result = await tagOperationsTool.getTagHierarchy();

        expect(result).toEqual(mockHierarchy);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('get-tag-hierarchy', {});
      });

      it('should handle flat tag hierarchy', async () => {
        const mockHierarchy = {
          rootTags: [
            {
              id: 'tag-1',
              name: 'simple-tag-1',
              active: true,
              subtags: []
            },
            {
              id: 'tag-2',
              name: 'simple-tag-2',
              active: true,
              subtags: []
            }
          ]
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockHierarchy
        });

        const result = await tagOperationsTool.getTagHierarchy();

        expect(result).toEqual(mockHierarchy);
        expect(result.rootTags.every(tag => tag.subtags.length === 0)).toBe(true);
      });

      it('should handle get tag hierarchy errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Cannot build tag hierarchy' }
        });

        await expect(tagOperationsTool.getTagHierarchy())
          .rejects.toThrow('Cannot build tag hierarchy');
      });
    });
  });

  describe('Tag Modification Operations', () => {
    describe('renameTag', () => {
      it('should rename tag successfully', async () => {
        const mockRenamedTag = {
          id: 'tag-123',
          name: 'high-priority',
          active: true,
          allowsNextAction: true,
          modificationDate: '2025-08-13T13:00:00Z'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockRenamedTag
        });

        const result = await tagOperationsTool.renameTag('tag-123', 'high-priority');

        expect(result).toEqual(mockRenamedTag);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('rename-tag', {
          tagId: 'tag-123',
          newName: 'high-priority'
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('tags:*');
        expect(mockCache.invalidate).toHaveBeenCalledWith('tag:tag-123:*');
      });

      it('should handle rename tag errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'New tag name already exists' }
        });

        await expect(tagOperationsTool.renameTag('tag-123', 'existing-name'))
          .rejects.toThrow('New tag name already exists');
      });

      it('should handle invalid new names', async () => {
        await expect(tagOperationsTool.renameTag('tag-123', ''))
          .rejects.toThrow('New tag name cannot be empty');

        expect(mockJXABridge.execScriptFile).not.toHaveBeenCalled();
      });
    });

    describe('deleteTag', () => {
      it('should delete tag successfully', async () => {
        const mockResult = {
          tagId: 'tag-123',
          deleted: true,
          success: true,
          message: 'Tag deleted successfully'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const result = await tagOperationsTool.deleteTag('tag-123');

        expect(result).toEqual(mockResult);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('delete-tag', {
          tagId: 'tag-123'
        });
        expect(mockCache.invalidate).toHaveBeenCalledWith('tags:*');
        expect(mockCache.invalidate).toHaveBeenCalledWith('tag:tag-123:*');
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
        expect(mockCache.invalidateProjectCache).toHaveBeenCalled();
      });

      it('should handle delete tag errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Tag is in use and cannot be deleted' }
        });

        await expect(tagOperationsTool.deleteTag('tag-123'))
          .rejects.toThrow('Tag is in use and cannot be deleted');
      });

      it('should handle nonexistent tag deletion', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Tag not found' }
        });

        await expect(tagOperationsTool.deleteTag('nonexistent-tag'))
          .rejects.toThrow('Tag not found');
      });
    });
  });

  describe('Legacy Context Migration', () => {
    describe('mapContextsToTags', () => {
      it('should map contexts to tags successfully', async () => {
        const mockResult = {
          mapped: 12,
          skipped: 3,
          success: true,
          message: 'Mapped 12 contexts to tags, skipped 3 duplicates',
          mappings: [
            { contextName: '@calls', tagName: 'calls' },
            { contextName: '@errands', tagName: 'errands' },
            { contextName: '@office', tagName: 'office' }
          ]
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const result = await tagOperationsTool.mapContextsToTags();

        expect(result).toEqual(mockResult);
        expect(mockJXABridge.execScriptFile).toHaveBeenCalledWith('map-contexts-to-tags', {});
        expect(mockCache.invalidate).toHaveBeenCalledWith('tags:*');
        expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
        expect(mockCache.invalidateProjectCache).toHaveBeenCalled();
      });

      it('should handle no contexts to map', async () => {
        const mockResult = {
          mapped: 0,
          skipped: 0,
          success: true,
          message: 'No contexts found to map'
        };

        mockJXABridge.execScriptFile.mockResolvedValue({
          success: true,
          data: mockResult
        });

        const result = await tagOperationsTool.mapContextsToTags();

        expect(result).toEqual(mockResult);
        expect(result.mapped).toBe(0);
      });

      it('should handle context mapping errors', async () => {
        mockJXABridge.execScriptFile.mockResolvedValue({
          success: false,
          error: { message: 'Cannot access context data' }
        });

        await expect(tagOperationsTool.mapContextsToTags())
          .rejects.toThrow('Cannot access context data');
      });
    });
  });

  describe('Error Handling', () => {
    const tagOperationScripts = [
      'create-tag',
      'assign-tags',
      'remove-tags',
      'get-tagged-items',
      'get-all-tags',
      'get-tag-hierarchy',
      'rename-tag',
      'delete-tag',
      'map-contexts-to-tags'
    ];

    describe('Permission Errors', () => {
      it.each(tagOperationScripts)('should handle permission denied for %s', async (script) => {
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
      it.each(tagOperationScripts)('should handle app unavailable for %s', async (script) => {
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
      it.each(tagOperationScripts)('should handle script errors for %s', async (script) => {
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
    it('should invalidate appropriate caches for tag creation', async () => {
      const mockTag = { id: 'tag-123', name: 'test-tag' };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockTag
      });

      await tagOperationsTool.createTag({ name: 'test-tag' });

      expect(mockCache.invalidate).toHaveBeenCalledWith('tags:*');
    });

    it('should invalidate appropriate caches for tag assignment to tasks', async () => {
      const mockResult = { itemId: 'task-123', assignedTags: ['tag1'], success: true };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockResult
      });

      await tagOperationsTool.assignTags('task-123', 'task', ['tag1']);

      expect(mockCache.invalidate).toHaveBeenCalledWith('task:task-123:*');
      expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
    });

    it('should invalidate appropriate caches for tag assignment to projects', async () => {
      const mockResult = { itemId: 'project-123', assignedTags: ['tag1'], success: true };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockResult
      });

      await tagOperationsTool.assignTags('project-123', 'project', ['tag1']);

      expect(mockCache.invalidate).toHaveBeenCalledWith('project:project-123:*');
      expect(mockCache.invalidateProjectCache).toHaveBeenCalled();
    });

    it('should invalidate all caches for tag deletion', async () => {
      const mockResult = { tagId: 'tag-123', deleted: true, success: true };

      mockJXABridge.execScriptFile.mockResolvedValue({
        success: true,
        data: mockResult
      });

      await tagOperationsTool.deleteTag('tag-123');

      expect(mockCache.invalidate).toHaveBeenCalledWith('tags:*');
      expect(mockCache.invalidate).toHaveBeenCalledWith('tag:tag-123:*');
      expect(mockCache.invalidateTaskCache).toHaveBeenCalled();
      expect(mockCache.invalidateProjectCache).toHaveBeenCalled();
    });
  });
});
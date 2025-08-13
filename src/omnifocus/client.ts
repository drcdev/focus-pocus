import { JXABridge, JXAResponse } from './jxa-bridge';
import { Task, Project, Tag, Folder, Perspective, SearchOptions, OmniFocusDatabase } from './types';
import { getCacheManager, CacheManager } from '../cache/cache-manager';

export interface ConnectionStatus {
  connected: boolean;
  appRunning: boolean;
  permissionsGranted: boolean;
  lastChecked: Date;
  error?: string;
}

export class OmniFocusClient {
  private static instance: OmniFocusClient | null = null;
  private connectionStatus: ConnectionStatus;
  private readonly maxRetries = 3;
  private readonly connectionCheckInterval = 30000; // 30 seconds
  private connectionCheckTimer?: NodeJS.Timeout;
  private cacheManager: CacheManager;

  private constructor() {
    this.connectionStatus = {
      connected: false,
      appRunning: false,
      permissionsGranted: false,
      lastChecked: new Date()
    };
    
    this.cacheManager = getCacheManager({
      maxSize: 500,
      defaultTTL: 2 * 60 * 1000, // 2 minutes for OmniFocus data
      cleanupInterval: 30 * 1000 // 30 seconds
    });
    
    this.startConnectionMonitoring();
  }

  static getInstance(): OmniFocusClient {
    if (!OmniFocusClient.instance) {
      OmniFocusClient.instance = new OmniFocusClient();
    }
    return OmniFocusClient.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      const healthCheck = await this.performHealthCheck();
      if (healthCheck.connected) {
        return true;
      }

      // Try to establish connection
      const permissionsOk = await JXABridge.requestPermissions();
      if (!permissionsOk) {
        this.connectionStatus.error = 'Automation permissions not granted';
        return false;
      }

      const appAvailable = await JXABridge.checkOmniFocusAvailability();
      if (!appAvailable) {
        this.connectionStatus.error = 'OmniFocus is not running';
        return false;
      }

      return await this.performHealthCheck().then(status => status.connected);
    } catch (error: any) {
      this.connectionStatus.error = error.message;
      return false;
    }
  }

  async performHealthCheck(): Promise<ConnectionStatus> {
    try {
      const appRunning = await JXABridge.checkOmniFocusAvailability();
      
      if (appRunning) {
        // Test basic operation to verify permissions and functionality
        const testResult = await JXABridge.execScriptFile('get-database-info');
        
        this.connectionStatus = {
          connected: testResult.success,
          appRunning: true,
          permissionsGranted: testResult.success,
          lastChecked: new Date(),
          error: testResult.success ? undefined : testResult.error?.originalMessage
        };
      } else {
        this.connectionStatus = {
          connected: false,
          appRunning: false,
          permissionsGranted: false,
          lastChecked: new Date(),
          error: 'OmniFocus is not running'
        };
      }
    } catch (error: any) {
      this.connectionStatus = {
        connected: false,
        appRunning: false,
        permissionsGranted: false,
        lastChecked: new Date(),
        error: error.message
      };
    }

    return this.connectionStatus;
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  async getAllTasks(options: { limit?: number; offset?: number; includeCompleted?: boolean } = {}): Promise<any> {
    const cacheKey = `getAllTasks_${JSON.stringify(options)}`;
    return this.withCache(cacheKey, options, async () => {
      return this.withRetry(async () => {
        const result = await JXABridge.execScriptFile('get-all-tasks', options);
        if (!result.success) {
          throw new Error(result.error?.originalMessage || 'Failed to retrieve tasks');
        }
        return result.data || { tasks: [], pagination: { total: 0, offset: 0, limit: 100, returned: 0, hasMore: false } };
      });
    });
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    return this.withCache('getTaskById', { taskId }, async () => {
      return this.withRetry(async () => {
        const result = await JXABridge.execScriptFile<Task>('get-task-by-id', { taskId });
        if (!result.success) {
          if (result.error?.code === 'NOT_FOUND') {
            return null;
          }
          throw new Error(result.error?.originalMessage || 'Failed to retrieve task');
        }
        return result.data || null;
      });
    });
  }

  async searchTasks(options: SearchOptions): Promise<Task[]> {
    return this.withCache('searchTasks', options, async () => {
      return this.withRetry(async () => {
        const result = await JXABridge.execScriptFile<Task[]>('search-tasks', options);
        if (!result.success) {
          throw new Error(result.error?.originalMessage || 'Failed to search tasks');
        }
        return result.data || [];
      });
    });
  }

  async getAllProjects(): Promise<Project[]> {
    return this.withCache('getAllProjects', {}, async () => {
      return this.withRetry(async () => {
        const result = await JXABridge.execScriptFile<Project[]>('get-projects');
        if (!result.success) {
          throw new Error(result.error?.originalMessage || 'Failed to retrieve projects');
        }
        return result.data || [];
      });
    });
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    return this.withCache('getProjectById', { projectId }, async () => {
      return this.withRetry(async () => {
        const result = await JXABridge.execScriptFile<Project>('get-project-by-id', { projectId });
        if (!result.success) {
          if (result.error?.code === 'NOT_FOUND') {
            return null;
          }
          throw new Error(result.error?.originalMessage || 'Failed to retrieve project');
        }
        return result.data || null;
      });
    });
  }

  async getAllTags(): Promise<Tag[]> {
    return this.withCache('getAllTags', {}, async () => {
      return this.withRetry(async () => {
        const result = await JXABridge.execScriptFile<Tag[]>('get-tags');
        if (!result.success) {
          throw new Error(result.error?.originalMessage || 'Failed to retrieve tags');
        }
        return result.data || [];
      });
    });
  }

  async getAllFolders(): Promise<Folder[]> {
    return this.withCache('getAllFolders', {}, async () => {
      return this.withRetry(async () => {
        const result = await JXABridge.execScriptFile<Folder[]>('get-folders');
        if (!result.success) {
          throw new Error(result.error?.originalMessage || 'Failed to retrieve folders');
        }
        return result.data || [];
      });
    });
  }

  async getPerspectives(): Promise<Perspective[]> {
    return this.withCache('getPerspectives', {}, async () => {
      return this.withRetry(async () => {
        const result = await JXABridge.execScriptFile<Perspective[]>('get-perspectives');
        if (!result.success) {
          throw new Error(result.error?.originalMessage || 'Failed to retrieve perspectives');
        }
        return result.data || [];
      });
    });
  }

  async getDatabaseInfo(): Promise<OmniFocusDatabase> {
    return this.withCache('getDatabaseInfo', {}, async () => {
      return this.withRetry(async () => {
        const result = await JXABridge.execScriptFile<OmniFocusDatabase>('get-database-info');
        if (!result.success) {
          throw new Error(result.error?.originalMessage || 'Failed to retrieve database info');
        }
        return result.data!;
      });
    });
  }

  private async withRetry<T>(operation: () => Promise<T>, retryCount = 0): Promise<T> {
    try {
      // Check connection before attempting operation
      if (!this.connectionStatus.connected) {
        const reconnected = await this.initialize();
        if (!reconnected) {
          throw new Error('Cannot connect to OmniFocus');
        }
      }

      return await operation();
    } catch (error: any) {
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        // Wait before retry with exponential backoff
        await this.delay(1000 * Math.pow(2, retryCount));
        
        // Reset connection status to force reconnection check
        this.connectionStatus.connected = false;
        
        return this.withRetry(operation, retryCount + 1);
      }
      
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    return message.includes('not running') || 
           message.includes('unavailable') || 
           message.includes('connection');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async withCache<T>(operation: string, params: any, fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = this.cacheManager.generateKey(operation, params);
    
    // Try to get from cache first
    const cached = this.cacheManager.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // Cache miss - fetch data
    const result = await fetchFn();
    
    // Store in cache
    this.cacheManager.set(cacheKey, result);
    
    return result;
  }

  // Cache management methods
  public clearCache(): void {
    this.cacheManager.clear();
  }

  public invalidateTaskCache(): void {
    this.cacheManager.invalidateTaskCache();
  }

  public invalidateProjectCache(): void {
    this.cacheManager.invalidateProjectCache();
  }

  public getCacheStats() {
    return this.cacheManager.getStats();
  }

  private startConnectionMonitoring(): void {
    this.connectionCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.connectionCheckInterval);
  }

  public stopConnectionMonitoring(): void {
    if (this.connectionCheckTimer) {
      clearInterval(this.connectionCheckTimer);
      this.connectionCheckTimer = undefined;
    }
  }

  // Direct JXA script execution method for Phase 2 tools
  async executeJXA(script: string): Promise<any> {
    return this.withRetry(async () => {
      // Use direct execSync approach that we know works
      const { execSync } = await import('child_process');
      const result = execSync(`osascript -l JavaScript -e "${this.escapeJXAScript(script)}"`, {
        encoding: 'utf8',
        timeout: 10000
      });
      
      // Try to parse as JSON if it looks like JSON
      const trimmed = result.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          return JSON.parse(trimmed);
        } catch {
          return trimmed;
        }
      }
      
      return trimmed;
    });
  }
  
  private escapeJXAScript(script: string): string {
    return script
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  public destroy(): void {
    this.stopConnectionMonitoring();
    this.cacheManager.destroy();
    OmniFocusClient.instance = null;
  }
}
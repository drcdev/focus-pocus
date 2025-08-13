import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface JXAError extends Error {
  code: string;
  type: 'permission' | 'app_unavailable' | 'script_error' | 'unknown';
  originalMessage: string;
}

export interface JXAResponse<T = any> {
  success: boolean;
  data?: T;
  error?: JXAError;
}

class JXABridge {
  private static readonly TIMEOUT_MS = 10000;
  private static readonly MAX_RETRIES = 3;

  static async execJXA<T = any>(
    script: string,
    params: Record<string, any> = {},
    retryCount = 0
  ): Promise<JXAResponse<T>> {
    try {
      // Inject parameters into script
      const scriptWithParams = this.injectParameters(script, params);
      
      // Execute the JXA script
      const result = execSync(`osascript -l JavaScript -e "${this.escapeScript(scriptWithParams)}"`, {
        timeout: this.TIMEOUT_MS,
        encoding: 'utf8'
      });

      // Parse the response
      const parsedResult = this.parseResponse<T>(result);
      return { success: true, data: parsedResult };

    } catch (error: any) {
      const jxaError = this.categorizeError(error);
      
      // Retry on certain error types
      if (this.shouldRetry(jxaError) && retryCount < this.MAX_RETRIES) {
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.execJXA(script, params, retryCount + 1);
      }

      return { success: false, error: jxaError };
    }
  }

  static async loadScript(scriptName: string): Promise<string> {
    try {
      const scriptPath = join(__dirname, 'scripts', `${scriptName}.jxa`);
      return await fs.readFile(scriptPath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to load JXA script: ${scriptName}`);
    }
  }

  static async execScriptFile<T = any>(
    scriptName: string,
    params: Record<string, any> = {}
  ): Promise<JXAResponse<T>> {
    const script = await this.loadScript(scriptName);
    return this.execJXA<T>(script, params);
  }

  private static injectParameters(script: string, params: Record<string, any>): string {
    let injectedScript = script;
    
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{{${key}}}`;
      const serializedValue = typeof value === 'string' 
        ? `"${value.replace(/"/g, '\\"')}"` 
        : JSON.stringify(value);
      injectedScript = injectedScript.replace(new RegExp(placeholder, 'g'), serializedValue);
    }
    
    return injectedScript;
  }

  private static escapeScript(script: string): string {
    return script
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  private static parseResponse<T>(rawResponse: string): T {
    const trimmed = rawResponse.trim();
    
    if (!trimmed) {
      return null as T;
    }

    try {
      return JSON.parse(trimmed) as T;
    } catch {
      // If not valid JSON, return as string
      return trimmed as unknown as T;
    }
  }

  private static categorizeError(error: any): JXAError {
    const message = error.message || error.toString();
    const stderr = error.stderr?.toString() || '';
    const fullMessage = `${message}\n${stderr}`.toLowerCase();

    let errorType: JXAError['type'] = 'unknown';
    let code = 'UNKNOWN_ERROR';

    if (fullMessage.includes('not authorized') || fullMessage.includes('permission')) {
      errorType = 'permission';
      code = 'PERMISSION_DENIED';
    } else if (fullMessage.includes('application is not running') || fullMessage.includes('not found')) {
      errorType = 'app_unavailable';
      code = 'APP_UNAVAILABLE';
    } else if (fullMessage.includes('syntax error') || fullMessage.includes('execution error')) {
      errorType = 'script_error';
      code = 'SCRIPT_ERROR';
    }

    const jxaError = new Error(message) as JXAError;
    jxaError.code = code;
    jxaError.type = errorType;
    jxaError.originalMessage = message;

    return jxaError;
  }

  private static shouldRetry(error: JXAError): boolean {
    return error.type === 'app_unavailable';
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async checkOmniFocusAvailability(): Promise<boolean> {
    try {
      const result = await this.execJXA(`
        try {
          const app = Application('OmniFocus 4');
          return app.running();
        } catch (error) {
          return false;
        }
      `);
      
      return result.success && result.data === true;
    } catch {
      return false;
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      const result = await this.execJXA(`
        const app = Application('OmniFocus 4');
        app.includeStandardAdditions = true;
        return "Permission test successful";
      `);
      
      return result.success;
    } catch {
      return false;
    }
  }
}

export { JXABridge };
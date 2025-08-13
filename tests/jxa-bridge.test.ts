import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JXABridge } from '../src/omnifocus/jxa-bridge';
import { execSync } from 'child_process';
import { promises as fs } from 'fs';

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));
const { execSync: mockExecSync } = require('child_process');

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  }
}));
const { promises: { readFile: mockReadFile } } = require('fs');

describe('JXABridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execJXA', () => {
    it('should execute JXA script successfully', async () => {
      const mockResponse = { success: true, data: 'test result' };
      mockExecSync.mockReturnValue(JSON.stringify(mockResponse));

      const result = await JXABridge.execJXA('test script');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('osascript -l JavaScript -e'),
        expect.objectContaining({
          timeout: 10000,
          encoding: 'utf8'
        })
      );
    });

    it('should handle JSON response parsing', async () => {
      const testData = [{ id: '1', name: 'Test Task' }];
      mockExecSync.mockReturnValue(JSON.stringify(testData));

      const result = await JXABridge.execJXA('get tasks');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
    });

    it('should handle non-JSON text response', async () => {
      const textResponse = 'Simple text response';
      mockExecSync.mockReturnValue(textResponse);

      const result = await JXABridge.execJXA('get text');

      expect(result.success).toBe(true);
      expect(result.data).toBe(textResponse);
    });

    it('should handle empty response', async () => {
      mockExecSync.mockReturnValue('');

      const result = await JXABridge.execJXA('empty script');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should inject parameters correctly', async () => {
      mockExecSync.mockReturnValue('success');
      
      await JXABridge.execJXA(
        'const taskId = {{taskId}}; const name = {{name}};',
        { taskId: 'test-123', name: 'Test Task' }
      );

      const calledScript = mockExecSync.mock.calls[0][0] as string;
      expect(calledScript).toContain('\\"test-123\\"');
      expect(calledScript).toContain('\\"Test Task\\"');
    });

    it('should categorize permission denied errors', async () => {
      const permissionError = new Error('not authorized to send Apple events');
      mockExecSync.mockImplementation((command: string, options?: any) => {
        throw permissionError;
      });

      const result = await JXABridge.execJXA('test script');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('permission');
      expect(result.error?.code).toBe('PERMISSION_DENIED');
    });

    it('should categorize app unavailable errors', async () => {
      const appError = new Error('application is not running');
      mockExecSync.mockImplementation((command: string, options?: any) => {
        throw appError;
      });

      const result = await JXABridge.execJXA('test script');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('app_unavailable');
      expect(result.error?.code).toBe('APP_UNAVAILABLE');
    }, 10000);

    it('should categorize script errors', async () => {
      const scriptError = new Error('execution error: syntax error');
      mockExecSync.mockImplementation((command: string, options?: any) => {
        throw scriptError;
      });

      const result = await JXABridge.execJXA('bad script');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('script_error');
      expect(result.error?.code).toBe('SCRIPT_ERROR');
    });

    it('should retry on app unavailable errors', async () => {
      let callCount = 0;
      mockExecSync.mockImplementation((command: string, options?: any) => {
        callCount++;
        if (callCount < 3) {
          throw new Error('application is not running');
        }
        return 'success after retry';
      });

      const result = await JXABridge.execJXA('test script');

      expect(result.success).toBe(true);
      expect(result.data).toBe('success after retry');
      expect(mockExecSync).toHaveBeenCalledTimes(3);
    });

    it('should give up after max retries', async () => {
      mockExecSync.mockImplementation((command: string, options?: any) => {
        throw new Error('application is not running');
      });

      const result = await JXABridge.execJXA('test script');

      expect(result.success).toBe(false);
      expect(mockExecSync).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    }, 15000);

    it('should not retry on permission errors', async () => {
      mockExecSync.mockImplementation((command: string, options?: any) => {
        throw new Error('not authorized');
      });

      const result = await JXABridge.execJXA('test script');

      expect(result.success).toBe(false);
      expect(mockExecSync).toHaveBeenCalledTimes(1); // No retries
    });

    it('should escape script content properly', async () => {
      mockExecSync.mockReturnValue('escaped');
      
      await JXABridge.execJXA('script with "quotes" and \\backslashes\\n and newlines');

      const calledScript = mockExecSync.mock.calls[0][0] as string;
      // Verify that quotes, backslashes, and newlines are properly escaped
      expect(calledScript).toContain('\\"');
      expect(calledScript).toContain('\\\\');
      expect(calledScript).toContain('\\n');
    });
  });

  describe('loadScript', () => {
    it('should load script file successfully', async () => {
      const scriptContent = 'return "test script content";';
      mockReadFile.mockResolvedValue(scriptContent);

      const result = await JXABridge.loadScript('test-script');

      expect(result).toBe(scriptContent);
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('test-script.jxa'),
        'utf8'
      );
    });

    it('should handle file not found', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT: no such file'));

      await expect(JXABridge.loadScript('nonexistent')).rejects.toThrow(
        'Failed to load JXA script: nonexistent'
      );
    });
  });

  describe('execScriptFile', () => {
    it('should load and execute script file', async () => {
      const scriptContent = 'return {{param}};';
      const expectedResult = { data: 'test-value' };
      
      mockReadFile.mockResolvedValue(scriptContent);
      mockExecSync.mockReturnValue(JSON.stringify(expectedResult));

      const result = await JXABridge.execScriptFile('test-script', { param: 'test-value' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 'test-value' });
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('test-script.jxa'),
        'utf8'
      );
    });
  });

  describe('checkOmniFocusAvailability', () => {
    it('should return true when OmniFocus is running', async () => {
      mockExecSync.mockReturnValue('true');

      const result = await JXABridge.checkOmniFocusAvailability();

      expect(result).toBe(true);
    });

    it('should return false when OmniFocus is not running', async () => {
      mockExecSync.mockReturnValue('false');

      const result = await JXABridge.checkOmniFocusAvailability();

      expect(result).toBe(false);
    });

    it('should return false on execution error', async () => {
      mockExecSync.mockImplementation((command: string, options?: any) => {
        throw new Error('execution failed');
      });

      const result = await JXABridge.checkOmniFocusAvailability();

      expect(result).toBe(false);
    });
  });

  describe('requestPermissions', () => {
    it('should return true when permissions are granted', async () => {
      mockExecSync.mockReturnValue('Permission test successful');

      const result = await JXABridge.requestPermissions();

      expect(result).toBe(true);
    });

    it('should return false when permissions are denied', async () => {
      mockExecSync.mockImplementation((command: string, options?: any) => {
        throw new Error('not authorized');
      });

      const result = await JXABridge.requestPermissions();

      expect(result).toBe(false);
    });
  });

  describe('parameter injection edge cases', () => {
    it('should handle complex object parameters', async () => {
      mockExecSync.mockReturnValue('success');
      
      const complexParam = {
        nested: { value: 'test' },
        array: [1, 2, 3],
        boolean: true,
        number: 42
      };

      await JXABridge.execJXA(
        'const data = {{data}};',
        { data: complexParam }
      );

      const calledScript = mockExecSync.mock.calls[0][0] as string;
      expect(calledScript).toContain(JSON.stringify(complexParam).replace(/"/g, '\\"'));
    });

    it('should handle string parameters with special characters', async () => {
      mockExecSync.mockReturnValue('success');
      
      await JXABridge.execJXA(
        'const text = {{text}};',
        { text: 'Text with "quotes" and \\backslashes\\ and newlines\n' }
      );

      const calledScript = mockExecSync.mock.calls[0][0] as string;
      expect(calledScript).toContain('\\\\\\"quotes\\\\\\"');
      expect(calledScript).toContain('\\\\backslashes\\\\');
    });
  });
});
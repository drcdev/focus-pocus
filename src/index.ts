#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { OmniFocusClient } from './omnifocus/client.js';
import { CacheManager } from './cache/cache-manager.js';
import { MCPToolRegistry } from './tools/index.js';

class OmniFocusMCPServer {
  private server: Server;
  private client: OmniFocusClient;
  private cache: CacheManager;
  private toolRegistry: MCPToolRegistry;

  constructor() {
    this.server = new Server({
      name: 'omnifocus-mcp-server',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });

    // Initialize OmniFocus client and cache
    this.client = OmniFocusClient.getInstance();
    this.cache = new CacheManager();
    this.toolRegistry = new MCPToolRegistry(this.client, this.cache);

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.toolRegistry.getToolDefinitions(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const result = await this.toolRegistry.executeToolCall(
          request.params.name,
          request.params.arguments || {}
        );

        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool '${request.params.name}': ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start() {
    // Initialize OmniFocus connection with detailed feedback
    console.error('Initializing OmniFocus connection...');
    const connected = await this.client.initialize();
    
    if (connected) {
      console.error('✓ OmniFocus connection established successfully');
    } else {
      const status = this.client.getConnectionStatus();
      console.error('✗ Warning: Could not establish initial connection to OmniFocus');
      console.error(`  Reason: ${status.error || 'Unknown error'}`);
      console.error('  Server will still start, but tools may fail until connection is established');
      
      if (!status.appRunning) {
        console.error('  Hint: Make sure OmniFocus 4 is running');
      }
      if (!status.permissionsGranted) {
        console.error('  Hint: Check System Preferences > Security & Privacy > Automation');
      }
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('OmniFocus MCP server started');
  }
}

// Start the server
const server = new OmniFocusMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
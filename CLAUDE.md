# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the development repository for "Focus Pocus" - an OmniFocus MCP (Model Context Protocol) server. The project aims to build a comprehensive MCP server that enables AI assistants to interact with OmniFocus 4 task management data, including intelligent project scaffolding with progressive deadline generation.

## Project Structure

The repository currently contains only planning documentation:

- `workplan.md` - Complete 7-phase development plan with detailed task breakdowns

## Planned Architecture

Based on the workplan, this will be a TypeScript-based MCP server with the following planned structure:

```
omnifocus-mcp-server/
├── src/
│   ├── index.ts              # Main entry point
│   ├── server.ts             # MCP server implementation
│   ├── omnifocus/            # OmniFocus integration layer
│   │   ├── jxa-bridge.ts     # JavaScript for Automation bridge
│   │   ├── client.ts         # OmniFocus application wrapper
│   │   ├── scripts/          # JXA script templates
│   │   └── types.ts          # TypeScript interfaces
│   ├── tools/                # MCP tool implementations
│   │   ├── create-task.ts    # Task creation operations
│   │   ├── update-task.ts    # Task modification operations
│   │   ├── delete-task.ts    # Task deletion operations
│   │   ├── project-operations.ts # Project management
│   │   ├── tag-operations.ts # Tag and context management
│   │   ├── perspectives.ts   # Built-in perspective access
│   │   ├── bulk-operations.ts # Batch processing
│   │   └── scaffold-project.ts # Intelligent project scaffolding
│   ├── cache/                # Caching and performance layer
│   ├── templates/            # Project template system
│   ├── scheduling/           # Progressive deadline generation
│   ├── intelligence/         # AI-powered analysis
│   ├── analytics/            # Productivity insights
│   └── utils/                # Shared utilities
├── tests/                    # Test suite
└── docs/                     # Documentation
```

## Development Phases

The project is structured in 7 phases:

1. **Foundation & Infrastructure** (Days 1-7) - Core MCP server and OmniFocus connectivity
2. **CRUD Operations & Task Management** (Days 8-14) - Full task lifecycle management
3. **Advanced Features & Perspectives** (Days 15-21) - Perspective access, bulk operations, templates
4. **Intelligent Project Scaffolding** (Days 22-28) - Smart task generation with progressive deadlines
5. **Analytics & Productivity Insights** (Days 29-35) - Intelligence layer for workload analysis
6. **Performance & Production** (Days 36-42) - Production optimization and monitoring
7. **Documentation & Deployment** (Days 43-49) - Release preparation

## Key Technologies

- **TypeScript** - Primary development language
- **MCP SDK** - `@modelcontextprotocol/sdk` for protocol implementation
- **JXA (JavaScript for Automation)** - macOS automation bridge to OmniFocus
- **Jest** - Testing framework
- **Node.js** - Runtime environment

## Development Commands

Since this is a new project, no build commands exist yet. Based on the workplan, typical commands will include:

```bash
# Development
npm install          # Install dependencies
npm run dev          # Development mode
npm run build        # Production build
npm test             # Run test suite
npm run lint         # Code linting
npm run typecheck    # TypeScript type checking

# MCP Server
node dist/index.js   # Run the MCP server
```

## Key Features to Implement

### Core MCP Tools
- Task CRUD operations (create, read, update, delete)
- Project and folder management
- Tag and context operations
- Bulk operations with transaction support
- Built-in and custom perspective access

### Intelligent Features
- **Project Scaffolding** - Analyze existing projects and generate missing tasks based on templates
- **Progressive Deadlines** - Smart deadline distribution with workload balancing
- **Gap Analysis** - Identify missing components in project structures
- **Template Engine** - Extensible project templates with variable substitution

### Analytics & Insights
- Completion rate and velocity tracking
- Workload analysis and overcommitment detection
- Productivity pattern identification
- Recommendation engine for task prioritization

## Integration Points

### OmniFocus Integration
- Uses JXA (JavaScript for Automation) to communicate with OmniFocus 4
- Requires macOS automation permissions
- Supports both OmniFocus Standard and Pro features

### Claude Desktop Integration
The MCP server connects to Claude Desktop via stdio transport:

```json
{
  "mcpServers": {
    "omnifocus": {
      "command": "node",
      "args": ["path/to/omnifocus-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

## Development Notes

- All code should follow TypeScript best practices with strict type checking
- JXA scripts require careful error handling due to macOS automation quirks
- Caching layer is critical for performance with large OmniFocus databases
- Transaction support needed for bulk operations to maintain data consistency
- Security considerations for API key management and access control

## Testing Strategy

- Unit tests for all tool implementations
- Mock JXA interactions for reliable testing
- Integration tests with real OmniFocus data (when available)
- Performance benchmarks for large dataset handling
- End-to-end workflow validation

This is a greenfield project following the detailed workplan for systematic development of a comprehensive OmniFocus MCP server.
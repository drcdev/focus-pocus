# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the development repository for "Focus Pocus" - an OmniFocus MCP (Model Context Protocol) server. The project aims to build a comprehensive MCP server that enables AI assistants to interact with OmniFocus 4 task management data, including intelligent project scaffolding with progressive deadline generation.

## Project Structure

The repository contains the implemented MCP server:

- `workplan.md` - Complete 7-phase development plan with detailed task breakdowns
- `CLAUDE.md` - Project instructions and development guide
- `src/` - TypeScript source code
- `dist/` - Compiled JavaScript and JXA scripts
- `docs/` - Documentation and prompts

## Current Architecture

This TypeScript-based MCP server has the following implemented structure:

```
focus-pocus/
├── src/
│   ├── index.ts              # ✅ Main entry point & MCP server
│   ├── omnifocus/            # ✅ OmniFocus integration layer
│   │   ├── jxa-bridge.ts     # ✅ JavaScript for Automation bridge
│   │   ├── client.ts         # ✅ OmniFocus application wrapper
│   │   ├── scripts/          # ✅ JXA script files (.jxa)
│   │   └── types.ts          # ✅ TypeScript interfaces
│   ├── tools/                # ✅ MCP tool implementations
│   │   └── index.ts          # ✅ Complete tool registry with all operations
│   ├── cache/                # ✅ Caching and performance layer
│   │   └── cache-manager.ts  # ✅ Cache implementation
│   └── utils/                # ✅ Shared utilities
│       ├── date-handler.ts   # ✅ Natural language date parsing
│       └── scheduling.ts     # ✅ Task scheduling utilities
├── dist/                     # ✅ Compiled output
│   ├── *.js                  # Compiled TypeScript
│   └── omnifocus/scripts/    # Copied JXA scripts
├── docs/                     # ✅ Documentation and prompts
└── workplan.md              # ✅ Development plan
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

Current project build commands:

```bash
# Development
npm install          # Install dependencies
npm run build        # Production build (TypeScript compilation + JXA script copy)
npm run typecheck    # TypeScript type checking
npm run copy-scripts # Copy JXA scripts to dist folder

# MCP Server
node dist/index.js   # Run the MCP server
```

## Key Features to Implement

### Core MCP Tools
- Task CRUD operations (create, read, update, delete) ✅
- Project and folder management ✅
- Tag and context operations ✅
- Bulk operations with transaction support ✅
- Built-in perspective access ✅
- Custom perspective access ⚠️ Limited (see OmniFocus 4 API Limitations)

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

#### OmniFocus 4 JXA API Limitations

**Performance Considerations:**
- Task retrieval is optimized with pagination (default: 25 tasks per request)
- JXA processing is inherently slow; large datasets require multiple paginated requests
- Timeout increased to 45 seconds to accommodate JXA processing overhead

**API Access Issues:**
- **Custom Perspectives**: OmniFocus 4 JXA API changes prevent detailed enumeration of custom perspective properties
  - Can detect existence and count of custom perspectives
  - Cannot reliably access names, IDs, or configurations
  - Built-in perspectives work normally (Inbox, Projects, Tags, Forecast, Flagged, Review, Completed)
- **Complex Date Operations**: Some date field conversions may fail and are handled gracefully
- **Nested Object Access**: Parent/child relationships require careful error handling

**Workarounds Implemented:**
- Minimal data collection per JXA operation to reduce conversion errors
- Graceful fallback for failed property access
- Informative error messages explaining API limitations
- Pagination support for large dataset handling

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
- **JXA scripts require extensive error handling** due to OmniFocus 4 API changes and conversion issues
- **Performance optimization is critical** - JXA operations are slow, requiring pagination and timeouts
- **Caching layer is essential** for performance with large OmniFocus databases
- **Transaction support needed** for bulk operations to maintain data consistency
- **Graceful degradation** - Tools should work with minimal data when full object access fails
- Security considerations for API key management and access control

### JXA Development Guidelines

1. **Minimize JXA API calls per object** - Each property access is expensive
2. **Use try-catch for every property access** - API conversion can fail unpredictably
3. **Test with large datasets** - Performance degrades significantly with scale
4. **Implement pagination** - Never attempt to process all tasks at once
5. **Provide fallback values** - When property access fails, use sensible defaults
6. **Log conversion errors** - Help debugging but don't fail the entire operation

## Testing Strategy

- Unit tests for all tool implementations
- Mock JXA interactions for reliable testing
- Integration tests with real OmniFocus data (when available)
- Performance benchmarks for large dataset handling
- End-to-end workflow validation

## Available MCP Tools

### Task Operations
- `get_all_tasks` - Paginated task retrieval with filtering (limit, offset, includeCompleted)
- `get_task_by_id` - Retrieve specific task details
- `search_tasks` - Advanced task search with filters
- `get_project_tasks` - Get tasks within a specific project
- `create_task`, `create_task_in_project`, `create_subtask` - Task creation
- `update_task`, `complete_task`, `uncomplete_task`, `move_task` - Task modifications
- `delete_task`, `archive_task` - Task removal
- `batch_create_tasks`, `bulk_update_tasks`, `bulk_delete_tasks` - Batch operations

### Project & Folder Operations
- `get_all_projects` - Retrieve all projects
- `get_project_by_id` - Get specific project details
- `create_project`, `update_project`, `duplicate_project` - Project management
- `create_folder`, `move_project` - Folder organization
- `get_all_folders` - Retrieve folder hierarchy

### Tag Operations
- `get_all_tags` - Retrieve available tags (simplified due to API limitations)
- `create_tag` - Create new tags
- `assign_tags`, `remove_tags` - Tag assignment/removal
- `get_tagged_items` - Find items with specific tags

### Perspective & View Operations
- `get_perspectives` - Built-in perspectives + custom perspective detection
- `get_database_info` - OmniFocus database information

### Utility Operations
- `diagnose_connection` - Connection and permissions diagnostics
- `parse_natural_date` - Natural language date parsing
- `schedule_tasks_optimally` - Intelligent task scheduling
- `adjust_dates_bulk` - Bulk date adjustments

### Performance Notes
- Most operations use caching to improve response times
- Task operations default to 25 items per request for performance
- Use pagination (`limit`/`offset`) for large datasets
- JXA processing has inherent latency; expect 1-2 second response times

## Current Implementation Status

**Phase Progress:** Phase 1-3 (Foundation, CRUD Operations & Advanced Features) - 98% Complete

### Implementation Summary
- **5,200+ lines of TypeScript code** across 15+ source files
- **Comprehensive MCP tool suite** with 35+ implemented operations
- **Complete JXA bridge** with 25+ OmniFocus automation scripts
- **Production-ready build system** with TypeScript compilation + JXA script copying
- **Advanced caching layer** with intelligent invalidation and performance optimization
- **Robust error handling** with graceful degradation for OmniFocus 4 API limitations
- **Natural language utilities** for date parsing and task scheduling

### Key Accomplishments ✅
1. **Complete MCP Server Foundation** - Stdio-based server with comprehensive tool registration
2. **Full OmniFocus Integration** - JXA bridge with extensive error handling and performance optimization
3. **Comprehensive Task Management** - Complete CRUD operations for tasks, projects, folders, and tags
4. **Advanced Bulk Operations** - Batch processing with transaction support and performance optimization
5. **Production Caching System** - High-performance layer with intelligent cache invalidation
6. **Extensive JXA Script Library** - 25+ automation scripts covering all OmniFocus operations
7. **Robust TypeScript Architecture** - Strict typing with comprehensive interface definitions
8. **Advanced Utility Functions** - Natural language date parsing, task scheduling, and ID generation
9. **Comprehensive Tool Coverage** - 35+ MCP tools covering all major OmniFocus workflows
10. **Performance Optimization** - Pagination, timeouts, and caching for large datasets

### Production Features ✅
- **Task CRUD Operations**: Complete lifecycle management with bulk operations
- **Project & Folder Management**: Full hierarchy support with organization tools
- **Tag Operations**: Comprehensive tag management with assignment/removal
- **Perspective Access**: Built-in perspectives with custom perspective detection
- **Advanced Search**: Native task search with filtering and pagination
- **Bulk Operations**: Batch create, update, delete with transaction support
- **Performance Tools**: Caching, pagination, and timeout handling
- **Utility Functions**: Date parsing, scheduling, and diagnostic tools
- **Error Handling**: Graceful degradation for OmniFocus 4 API limitations
- **Connection Diagnostics**: Automated permission and connection testing

### Known Optimizations 🔧
- **JXA Performance**: Optimized for OmniFocus 4 API limitations with pagination
- **Cache Strategy**: Intelligent invalidation and TTL management
- **Error Recovery**: Graceful fallbacks for API conversion failures
- **Memory Management**: Efficient object lifecycle in JXA bridge

### Next Development Priorities
1. **Phase 4 Features** - Intelligent project scaffolding and template system
2. **Analytics Layer** - Productivity insights and completion tracking
3. **Advanced Templates** - Project scaffolding with progressive deadline generation
4. **Performance Enhancements** - Further optimization for large OmniFocus databases

This represents a production-ready Phase 1-3 implementation with comprehensive OmniFocus integration and advanced MCP tool coverage.

## System Architecture & Layer Mapping

When making changes to this codebase, consider all interconnected layers to ensure consistency:

### 1. **Entry Point Layer**
- **File**: `src/index.ts` (96 lines)
- **Dependencies**: MCP SDK, tool registry, cache manager
- **Change Impact**: Affects server initialization, tool registration, transport setup
- **Connected To**: All tool layers, cache layer, MCP protocol

### 2. **Tool Registry Layer** 
- **File**: `src/tools/index.ts` (918 lines)
- **Dependencies**: All tool implementations, OmniFocus client, cache
- **Change Impact**: Affects tool availability, parameter validation, response schemas
- **Connected To**: MCP server, individual tools, OmniFocus layer, cache layer

### 3. **Individual Tool Layers**
- **Create Operations**: `src/tools/create-task.ts` (249 lines)
- **Update Operations**: `src/tools/update-task.ts` (248 lines)  
- **Delete Operations**: `src/tools/delete-task.ts` (307 lines)
- **Project Operations**: `src/tools/project-operations.ts` (333 lines)
- **Tag Operations**: `src/tools/tag-operations.ts` (338 lines)
- **Dependencies**: OmniFocus client, cache manager, utilities
- **Change Impact**: Affects specific operation behavior, validation, error handling
- **Connected To**: Tool registry, OmniFocus client, cache, utilities

### 4. **OmniFocus Integration Layer**
- **Client**: `src/omnifocus/client.ts` (360 lines)
- **JXA Bridge**: `src/omnifocus/jxa-bridge.ts` (206 lines)
- **Type Definitions**: `src/omnifocus/types.ts` (250 lines)
- **JXA Scripts**: `src/omnifocus/scripts/*.jxa` (9 scripts)
- **Dependencies**: JXA bridge, type definitions, Node.js child_process
- **Change Impact**: Affects OmniFocus communication, data conversion, script execution
- **Connected To**: All tools, cache layer, JXA scripts

### 5. **Cache Layer**
- **File**: `src/cache/cache-manager.ts` (254 lines)
- **Dependencies**: Node.js built-ins
- **Change Impact**: Affects performance, data consistency, memory usage
- **Connected To**: All tools, OmniFocus client operations

### 6. **Utility Layer**
- **Date Handling**: `src/utils/date-handler.ts` (348 lines)
- **Task Scheduling**: `src/utils/scheduling.ts` (473 lines)
- **ID Generation**: `src/utils/id-generator.ts` (39 lines)
- **Dependencies**: date-fns, date-fns-tz
- **Change Impact**: Affects date parsing, task scheduling, unique ID generation
- **Connected To**: Tools, OmniFocus operations, test data

### 7. **Build & Distribution Layer**
- **TypeScript Config**: `tsconfig.json`
- **Build Scripts**: `package.json` scripts
- **Output**: `dist/` directory with compiled JS and JXA files
- **Dependencies**: TypeScript compiler, npm scripts
- **Change Impact**: Affects compilation, script copying, deployment
- **Connected To**: All source files, JXA scripts

### 8. **Testing Layer**
- **Test Files**: `tests/*.test.ts` (7 test suites, 130 test cases)
- **Configuration**: `jest.config.js`
- **Dependencies**: Jest, ts-jest, mock implementations
- **Change Impact**: Affects test coverage, validation, CI/CD
- **Connected To**: All source modules, mock interfaces

### Cross-Layer Dependencies
When modifying any component, verify these connections:

1. **Type Changes** → Update `omnifocus/types.ts` → Update tool schemas → Update tests
2. **JXA Script Changes** → Update bridge → Update client → Update cache keys → Update tools
3. **Tool Parameter Changes** → Update tool registry → Update validation → Update tests → Update docs
4. **Cache Key Changes** → Update cache manager → Update all tool implementations
5. **Error Handling Changes** → Update client → Update tools → Update tests
6. **Performance Changes** → Update cache strategy → Update pagination → Update timeouts

### Development Workflow
1. **Make Changes** → Run `npm run typecheck` → Run `npm test` → Run `npm run build`
2. **JXA Updates** → Test in Script Editor → Update .jxa file → Copy to dist → Test integration
3. **New Tools** → Add to registry → Add schemas → Add tests → Update documentation
4. **Breaking Changes** → Update all layers → Update tests → Update version

This mapping ensures that changes propagate correctly through all system layers and maintain architectural consistency.
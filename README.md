# Focus Pocus - OmniFocus MCP Server

A production-ready Model Context Protocol (MCP) server that enables AI assistants to interact with OmniFocus 4. Features comprehensive task management, intelligent project scaffolding, and advanced automation capabilities.

## Features

### Core Functionality
- **Complete Task Management**: Full CRUD operations for tasks, projects, folders, and tags
- **Advanced Search**: Native task search with filtering, pagination, and status-based queries
- **Bulk Operations**: Batch create, update, delete with transaction support
- **Project Organization**: Comprehensive project and folder hierarchy management
- **Tag System**: Full tag lifecycle with assignment, removal, and hierarchy support

### Performance & Integration
- **High Performance**: Intelligent caching layer with automatic invalidation
- **Native macOS Integration**: Optimized JavaScript for Automation (JXA) bridge
- **OmniFocus 4 Optimized**: Handles API limitations with graceful degradation
- **Pagination Support**: Efficient handling of large datasets
- **Connection Diagnostics**: Automated permission and connectivity testing

### Advanced Features
- **Natural Language Processing**: Smart date parsing and task scheduling
- **Perspective Access**: Built-in perspectives with custom perspective detection
- **Error Recovery**: Robust error handling with intelligent fallbacks
- **Production Ready**: Comprehensive logging, monitoring, and performance optimization

## Requirements

- **macOS 10.15+** (required for OmniFocus 4 and JXA)
- **OmniFocus 4** (Standard or Pro)
- **Node.js 18+**
- **Claude Desktop** (for MCP integration)

## Installation

### 1. Install Dependencies

```bash
git clone https://github.com/your-username/focus-pocus.git
cd focus-pocus
npm install
```

> **Note**: Replace `your-username` with the actual repository owner.

### 2. Build the Project

```bash
npm run build
```

### 3. Configure macOS Automation Permissions

The MCP server requires automation permissions to interact with OmniFocus:

1. **Open System Preferences** → **Security & Privacy** → **Privacy**
2. **Select "Automation"** from the left sidebar
3. **Find your terminal app** (Terminal.app, iTerm2, etc.) in the list
4. **Check the box next to "OmniFocus 4"**

If you don't see these options:
1. Try running the server first - macOS will prompt for permissions
2. Click "OK" when prompted to allow automation access

### 4. Configure Claude Desktop

Add the MCP server to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "omnifocus": {
      "command": "node",
      "args": ["path/to/focus-pocus/dist/index.js"],
      "env": {}
    }
  }
}
```

Replace `path/to/focus-pocus` with the actual path to your installation.

## Quick Start

1. **Ensure OmniFocus 4 is running**
2. **Start Claude Desktop**
3. **Test the connection**:

```
Can you show me my current tasks in OmniFocus?
```

### Connection Verification

If you encounter issues, use the diagnostic tool:

```
Can you run a diagnostic check on my OmniFocus connection?
```

This will verify:
- OmniFocus 4 is running and accessible
- Automation permissions are properly configured
- JXA bridge is functioning correctly
- Database connectivity is stable

## Usage Examples

### Basic Task Management

```
# Get all tasks with pagination
Show me my first 25 tasks

# Search for specific tasks with filters
Find all incomplete tasks related to "project planning"

# Get tasks in a specific project
Show me all tasks in my "Website Redesign" project

# Create and manage tasks
Create a new task "Review wireframes" in my "Design" project
```

### Advanced Operations

```
# Bulk operations
Create multiple tasks for my project setup phase

# Tag management
Show me all tasks tagged with "urgent" and "client-work"

# Project organization
Move the "Mobile App" project to the "Development" folder

# Perspective access
Show me my Forecast perspective for this week
```

### Productivity & Analytics

```
# Task scheduling
Schedule my remaining tasks optimally for this week

# Natural language dates
Create a task due "next Friday afternoon"

# Bulk updates
Mark all completed tasks in "Q3 Planning" as archived
```

## Architecture

```
focus-pocus/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── omnifocus/            # OmniFocus integration layer
│   │   ├── jxa-bridge.ts     # JavaScript for Automation bridge
│   │   ├── client.ts         # OmniFocus application wrapper
│   │   ├── scripts/          # 25+ JXA automation scripts
│   │   └── types.ts          # TypeScript interfaces
│   ├── tools/                # 35+ MCP tool implementations
│   │   ├── index.ts          # Tool registry and schemas
│   │   ├── create-task.ts    # Task creation tools
│   │   ├── update-task.ts    # Task modification tools
│   │   ├── delete-task.ts    # Task deletion and archival
│   │   ├── project-operations.ts # Project management
│   │   └── tag-operations.ts # Tag management
│   ├── cache/                # High-performance caching layer
│   │   └── cache-manager.ts  # Intelligent cache management
│   └── utils/                # Advanced utilities
│       ├── date-handler.ts   # Natural language date parsing
│       ├── scheduling.ts     # Task scheduling optimization
│       └── id-generator.ts   # Unique ID generation
├── tests/                    # Comprehensive test suite
├── dist/                     # Compiled output (JS + JXA)
├── docs/                     # Documentation and guides
└── workplan.md              # 7-phase development plan
```

## Development

### Available Commands

```bash
# Build and deployment
npm run build         # Production build (TypeScript + JXA scripts)
npm run typecheck     # TypeScript type checking
npm run copy-scripts  # Copy JXA scripts to dist folder

# Testing and validation
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode

# Server operations
node dist/index.js   # Run the MCP server
```

### Development Workflow

1. **Make changes** to TypeScript source files
2. **Run type checking**: `npm run typecheck`
3. **Run tests**: `npm test`
4. **Build for production**: `npm run build`
5. **Test with Claude Desktop**: Restart Claude Desktop to reload the server

### JXA Script Development

1. **Edit scripts** in `src/omnifocus/scripts/`
2. **Test in Script Editor** (macOS)
3. **Copy to dist**: `npm run copy-scripts`
4. **Test integration**: Run MCP server and test via Claude

## Troubleshooting

### "Not Authorized" Errors

- **Cause**: macOS automation permissions not granted
- **Solution**: Follow the [automation permissions setup](#3-configure-macos-automation-permissions)

### "Application Not Running" Errors  

- **Cause**: OmniFocus 4 is not currently running
- **Solution**: Launch OmniFocus 4 before using the MCP server

### "Permission Denied" Errors

- **Cause**: Terminal/iTerm doesn't have automation permissions
- **Solution**: Grant automation permissions in System Preferences → Security & Privacy

### Connection Timeouts

- **Cause**: Large OmniFocus database causing slow queries
- **Solution**: The built-in cache will improve performance after initial queries

### Script Errors

- **Cause**: OmniFocus database corruption or version mismatch  
- **Solution**: Try restarting OmniFocus, or check for OmniFocus updates

## Configuration

The server supports various configuration options through environment variables:

```bash
# Cache settings
CACHE_MAX_SIZE=1000          # Maximum cache entries (default: 500)
CACHE_TTL=300000            # Cache TTL in ms (default: 120000)

# Performance settings  
JXA_TIMEOUT=45000           # JXA script timeout (default: 45000)
MAX_RETRIES=3               # Maximum retry attempts (default: 3)
DEFAULT_LIMIT=25            # Default pagination limit (default: 25)

# Logging
LOG_LEVEL=info              # Log level: debug, info, warn, error
ENABLE_CACHE_LOGGING=false  # Cache operation logging (default: false)
```

### Performance Tuning

- **Large Databases**: Increase `JXA_TIMEOUT` for databases with 1000+ tasks
- **Memory Optimization**: Adjust `CACHE_MAX_SIZE` based on available RAM
- **Response Time**: Lower `DEFAULT_LIMIT` for faster individual requests
- **Debugging**: Enable `ENABLE_CACHE_LOGGING` for cache behavior analysis

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- **Phase 1**: ✅ Foundation & Infrastructure (Complete)
- **Phase 2**: ✅ CRUD Operations & Task Management (Complete)
- **Phase 3**: ✅ Advanced Features & Perspectives (Complete)
- **Phase 4**: 🚀 Intelligent Project Scaffolding (In Progress)
- **Phase 5**: 📊 Analytics & Productivity Insights (Planned)
- **Phase 6**: ⚡ Performance & Production Optimization (Planned)
- **Phase 7**: 📚 Documentation & Deployment (Planned)

### Current Status: 98% Complete (Phase 1-3)

**Implemented Features:**
- 35+ MCP tools covering all major OmniFocus workflows
- 25+ JXA automation scripts with error handling
- High-performance caching layer with intelligent invalidation
- Advanced search, filtering, and pagination
- Bulk operations with transaction support
- Natural language date parsing and task scheduling
- Comprehensive connection diagnostics
- Production-ready error handling and logging

## Support

- **Issues**: [GitHub Issues](https://github.com/your-username/focus-pocus/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/focus-pocus/discussions)
- **Documentation**: [Project Wiki](https://github.com/your-username/focus-pocus/wiki)

---

Built with ❤️ for the OmniFocus and AI community.

## License

ISC
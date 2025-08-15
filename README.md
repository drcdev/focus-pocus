# Focus Pocus - OmniFocus MCP Server

Connect Claude Desktop to OmniFocus with comprehensive task management, natural language date parsing, and intelligent automation.

## What is Focus Pocus?

Focus Pocus is an MCP (Model Context Protocol) server that enables Claude Desktop to interact with your OmniFocus tasks, projects, and workflows. Ask Claude to manage your tasks naturally: _"Create a task for tomorrow"_, _"Show me overdue items"_, or _"Schedule my remaining work optimally"_.

### Key Features

✅ **Complete Task Management** - Create, update, delete tasks and projects  
✅ **Natural Language Dates** - "tomorrow at 2pm", "next Friday", "in 3 days"  
✅ **Bulk Operations** - Process multiple tasks efficiently  
✅ **Smart Scheduling** - Optimal task distribution and workload balancing  
✅ **Tag & Project Organization** - Full hierarchy support  
✅ **Built-in Perspectives** - Access Inbox, Forecast, Flagged, and more

## Requirements

- **macOS 10.15+**
- **OmniFocus** (any version)
- **Node.js 18+**
- **Claude Desktop**

## Installation

### Automated Installation (Recommended)

```bash
# 1. Clone and install
git clone https://github.com/drcdev/focus-pocus.git
cd focus-pocus

# 2. Run the installation script
./install.sh
```

The script will:

- ✅ Check all prerequisites
- ✅ Install dependencies and build the project
- ✅ Set up macOS automation permissions
- ✅ Configure Claude Desktop automatically
- ✅ Test the complete installation

### Manual Installation

If you prefer manual setup:

```bash
# 1. Install and build
git clone https://github.com/drcdev/focus-pocus.git
cd focus-pocus
npm install && npm run build

# 2. Configure Claude Desktop
# Edit: ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "focus-pocus": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/focus-pocus/dist/index.js"],
      "env": {}
    }
  }
}

# 3. Grant automation permissions when prompted
# 4. Restart Claude Desktop
```

> **Note**: Replace `drcdev` with the actual repository owner and `/ABSOLUTE/PATH/TO/focus-pocus` with your installation path.

## Quick Start

After installation:

1. **Launch OmniFocus** and **Claude Desktop**
2. **Test the connection** by asking Claude:

```
Can you show me my current tasks in OmniFocus?
```

3. **Try these example commands**:

```
# Basic operations
Create a task "Review project proposal" due tomorrow
Show me all tasks in my "Work" project
Mark the task "Buy groceries" as complete

# Natural language dates
Create a task "Team meeting" for next Monday at 10am
Schedule "Finish report" for Friday afternoon

# Advanced features
Show me my overdue tasks
Schedule my remaining tasks optimally this week
What's in my Forecast for today?
```

### Troubleshooting

**Connection issues?** Ask Claude: `Can you diagnose my OmniFocus connection?`

**Need help?** Check the detailed troubleshooting guide in [docs/local-deployment.md](docs/local-deployment.md)

## Available Operations

Focus Pocus supports 35+ operations covering all aspects of OmniFocus management:

### Tasks & Projects

- **Task Management**: Create, update, complete, delete, move tasks
- **Project Operations**: Create projects, manage status, organize in folders
- **Bulk Operations**: Create/update/delete multiple items efficiently
- **Search & Filtering**: Find tasks by content, tags, dates, completion status

### Organization & Planning

- **Tag Management**: Create, assign, remove tags with hierarchy support
- **Date Handling**: Natural language parsing ("tomorrow", "next Friday at 2pm")
- **Perspective Access**: View Inbox, Forecast, Flagged, Projects, and more
- **Smart Scheduling**: Optimal task distribution with workload balancing

### Advanced Features

- **Progressive Deadlines**: Intelligent deadline generation for projects
- **Batch Processing**: Handle multiple operations atomically
- **Connection Diagnostics**: Comprehensive system health checks
- **Performance Optimization**: Caching and pagination for large databases

## Technical Details

### Architecture

- **TypeScript MCP Server** - 3,800+ lines of code
- **JXA Integration** - 39 JavaScript for Automation scripts
- **Caching Layer** - High-performance with intelligent invalidation
- **35+ MCP Tools** - Complete OmniFocus API coverage

### Development

```bash
# Essential commands
npm run build         # Build for production
npm run typecheck     # Type checking
npm test             # Run test suite
node dist/index.js   # Run MCP server manually
```

For detailed development setup, see [docs/local-deployment.md](docs/local-deployment.md)

## Troubleshooting

### Quick Fixes

**"Command not found: node"**  
→ Install Node.js 18+ from [nodejs.org](https://nodejs.org) or `brew install node`

**"Not Authorized" or "Automation Error"**  
→ Grant automation permissions: **System Preferences** → **Security & Privacy** → **Privacy** → **Automation** → Enable your terminal app for OmniFocus

**"Cannot find module" errors**  
→ Run `npm install && npm run build`

**"MCP server not found"**  
→ Check absolute path in Claude Desktop config: `cd focus-pocus && pwd`

**Connection timeouts**  
→ Large databases are slower on first run - subsequent requests use cache

### Detailed Help

For comprehensive troubleshooting including step-by-step solutions, permission setup, and advanced debugging, see [docs/local-deployment.md](docs/local-deployment.md)

**Still having issues?** Ask Claude: `Can you diagnose my OmniFocus connection?`

## Configuration

Focus Pocus works great out of the box. For advanced users, customize via environment variables in your Claude Desktop config:

```json
{
  "mcpServers": {
    "focus-pocus": {
      "command": "node",
      "args": ["/path/to/focus-pocus/dist/index.js"],
      "env": {
        "LOG_LEVEL": "info",
        "JXA_TIMEOUT": "45000",
        "CACHE_MAX_SIZE": "500",
        "DEFAULT_LIMIT": "25"
      }
    }
  }
}
```

**Performance Tips:**

- **Large databases (1000+ tasks)**: Increase `JXA_TIMEOUT` to `60000`
- **Limited memory**: Reduce `CACHE_MAX_SIZE` to `100`
- **Debugging**: Set `LOG_LEVEL` to `debug`

## Status & Roadmap

**Current Status: ✅ Feature Complete**

Focus Pocus has completed Phase 1-3 development with:

- ✅ **35+ MCP Tools** - Complete OmniFocus workflow coverage
- ✅ **39 JXA Scripts** - Comprehensive automation with error handling
- ✅ **Advanced Features** - Natural language dates, smart scheduling, bulk operations
- ✅ **Performance Optimization** - Caching, pagination, graceful error recovery

**Upcoming Features:**

- 🚀 **Project Templates** - Intelligent project scaffolding
- 📊 **Basic Analytics** - Task completion insights and reporting
- 🔧 **Enhanced Performance** - Further optimization for large databases

## Contributing & Support

**Contributing**: Fork, create a feature branch, and submit a pull request

**Support**:

- [GitHub Issues](https://github.com/drcdev/focus-pocus/issues) for bugs
- [GitHub Discussions](https://github.com/drcdev/focus-pocus/discussions) for questions
- [Local Deployment Guide](docs/local-deployment.md) for detailed help

---

Built with ❤️ for the OmniFocus and AI community • **License**: ISC

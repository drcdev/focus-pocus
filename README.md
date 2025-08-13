# Focus Pocus - OmniFocus MCP Server

A comprehensive Model Context Protocol (MCP) server that enables AI assistants to interact with OmniFocus 4, featuring intelligent project scaffolding with progressive deadline generation.

## Features

- **Complete CRUD Operations**: Create, read, update, and delete tasks, projects, and tags
- **Intelligent Project Scaffolding**: Auto-generate missing tasks based on existing project patterns
- **Progressive Deadline Generation**: Smart deadline distribution with workload balancing
- **High Performance**: Built-in caching layer for optimal response times
- **Native macOS Integration**: Uses JavaScript for Automation (JXA) for seamless OmniFocus access

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

## Usage Examples

### Basic Task Management

```
# Get all tasks
Show me all my tasks

# Search for specific tasks  
Find all tasks related to "project planning"

# Get tasks in a specific project
Show me tasks in my "Website Redesign" project
```

### Project Operations

```
# List all projects
What projects do I have in OmniFocus?

# Get project details
Tell me about my "Q4 Marketing" project

# Check project status
Which of my projects are currently on hold?
```

### Intelligent Scaffolding

```
# Analyze and scaffold a project
Analyze my "Mobile App Development" project and suggest missing tasks

# Generate tasks with progressive deadlines
Create a development timeline for my app project with realistic deadlines
```

## Architecture

```
focus-pocus/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── server.ts             # MCP server implementation  
│   ├── omnifocus/            # OmniFocus integration layer
│   │   ├── jxa-bridge.ts     # JavaScript for Automation bridge
│   │   ├── client.ts         # OmniFocus application wrapper
│   │   ├── scripts/          # JXA script templates
│   │   └── types.ts          # TypeScript interfaces
│   ├── tools/                # MCP tool implementations
│   ├── cache/                # Caching and performance layer
│   ├── templates/            # Project template system
│   └── utils/                # Shared utilities
├── tests/                    # Test suite
└── docs/                     # Documentation
```

## Development

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

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
JXA_TIMEOUT=15000           # JXA script timeout (default: 10000)
MAX_RETRIES=5               # Maximum retry attempts (default: 3)

# Logging
LOG_LEVEL=info              # Log level: debug, info, warn, error
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- **Phase 1**: ✅ Foundation & Infrastructure
- **Phase 2**: CRUD Operations & Task Management
- **Phase 3**: Advanced Features & Perspectives  
- **Phase 4**: Intelligent Project Scaffolding
- **Phase 5**: Analytics & Productivity Insights
- **Phase 6**: Performance & Production
- **Phase 7**: Documentation & Deployment

## Support

- **Issues**: [GitHub Issues](https://github.com/your-username/focus-pocus/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/focus-pocus/discussions)
- **Documentation**: [Project Wiki](https://github.com/your-username/focus-pocus/wiki)

---

Built with ❤️ for the OmniFocus and AI community.

## License

ISC
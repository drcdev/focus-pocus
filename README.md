# Focus Pocus

An OmniFocus MCP (Model Context Protocol) server that enables AI assistants to interact with OmniFocus 4 task management data.

## Overview

Focus Pocus provides intelligent project scaffolding with progressive deadline generation, allowing AI assistants like Claude to:

- Create, read, update, and delete tasks and projects
- Access built-in and custom perspectives
- Perform bulk operations with transaction support
- Generate missing project tasks based on templates
- Provide productivity insights and analytics

## Requirements

- macOS (required for OmniFocus integration)
- OmniFocus 4
- Node.js 18+
- macOS automation permissions

## Installation

```bash
npm install
npm run build
```

## Usage

Configure in Claude Desktop's MCP settings:

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

## Development

This project is currently in active development following a 7-phase roadmap. See `workplan.md` for detailed implementation plans.

## License

ISC
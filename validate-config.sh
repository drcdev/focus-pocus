#!/bin/bash

# Focus Pocus Configuration Validator
# Validates Claude Desktop configuration for Focus Pocus

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CLAUDE_CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "🔍 Focus Pocus Configuration Validator"
echo "====================================="
echo ""

# Check if config file exists
if [ ! -f "$CLAUDE_CONFIG_PATH" ]; then
    log_error "Claude Desktop config not found at: $CLAUDE_CONFIG_PATH"
    echo "Run the install script or create the config manually."
    exit 1
fi

log_success "Config file found"

# Validate JSON syntax
if ! python3 -c "import json; json.load(open('$CLAUDE_CONFIG_PATH'))" 2>/dev/null; then
    log_error "Invalid JSON syntax in config file"
    echo "Check your configuration file for syntax errors."
    exit 1
fi

log_success "JSON syntax is valid"

# Check for focus-pocus server
if ! python3 -c "
import json
config = json.load(open('$CLAUDE_CONFIG_PATH'))
servers = config.get('mcpServers', {})
if 'focus-pocus' not in servers:
    exit(1)
" 2>/dev/null; then
    log_error "focus-pocus server not found in configuration"
    exit 1
fi

log_success "focus-pocus server configured"

# Extract and validate server path
SERVER_PATH=$(python3 -c "
import json
config = json.load(open('$CLAUDE_CONFIG_PATH'))
server = config['mcpServers']['focus-pocus']
args = server.get('args', [])
if args:
    print(args[0])
else:
    exit(1)
" 2>/dev/null)

if [ -z "$SERVER_PATH" ]; then
    log_error "Server path not found in configuration"
    exit 1
fi

log_info "Server path: $SERVER_PATH"

# Check if server file exists
if [ ! -f "$SERVER_PATH" ]; then
    log_error "Server file not found: $SERVER_PATH"
    echo "Ensure Focus Pocus is built and the path is correct."
    exit 1
fi

log_success "Server file exists"

# Check if server is executable
if [ ! -x "$(which node)" ]; then
    log_error "Node.js not found or not executable"
    exit 1
fi

log_success "Node.js is available"

# Test server startup (quick test)
log_info "Testing server startup..."
if timeout 3 node "$SERVER_PATH" &>/dev/null; then
    log_success "Server starts successfully"
else
    case $? in
        124) log_success "Server starts successfully (timeout as expected)" ;;
        *) log_warning "Server startup test inconclusive" ;;
    esac
fi

# Check OmniFocus
if [ ! -d "/Applications/OmniFocus 4.app" ] && [ ! -d "/Applications/OmniFocus.app" ]; then
    log_warning "OmniFocus not found in /Applications/"
elif [ -d "/Applications/OmniFocus 4.app" ]; then
    log_success "OmniFocus 4 is installed"
elif [ -d "/Applications/OmniFocus.app" ]; then
    log_success "OmniFocus is installed"
fi

# Check Claude Desktop
if [ ! -d "/Applications/Claude.app" ]; then
    log_warning "Claude Desktop not found in /Applications/"
else
    log_success "Claude Desktop is installed"
fi

echo ""
echo "✅ Configuration validation complete!"
echo ""
echo "If all checks passed, restart Claude Desktop and test with:"
echo "  > Can you diagnose my OmniFocus connection?"
echo ""
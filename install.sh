#!/bin/bash

# Focus Pocus - Automated Installation Script
# This script automates the installation and setup of Focus Pocus MCP server for local Mac use

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIN_NODE_VERSION="18"
CLAUDE_CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
CURRENT_DIR="$(pwd)"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_macos() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "This script is only for macOS systems"
        exit 1
    fi
    log_success "Running on macOS"
}

check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        echo "Please install Node.js $MIN_NODE_VERSION+ from:"
        echo "  - https://nodejs.org/ (recommended)"
        echo "  - Or run: brew install node"
        exit 1
    fi
    
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt "$MIN_NODE_VERSION" ]; then
        log_error "Node.js version $node_version is too old. Minimum required: $MIN_NODE_VERSION"
        exit 1
    fi
    
    log_success "Node.js $(node -v) is installed"
}

check_omnifocus() {
    if [ ! -d "/Applications/OmniFocus 4.app" ] && [ ! -d "/Applications/OmniFocus.app" ]; then
        log_error "OmniFocus is not installed in /Applications/"
        echo "Please install OmniFocus from:"
        echo "  - Mac App Store"
        echo "  - https://www.omnigroup.com/omnifocus"
        exit 1
    fi
    
    if [ -d "/Applications/OmniFocus 4.app" ]; then
        log_success "OmniFocus 4 is installed"
    elif [ -d "/Applications/OmniFocus.app" ]; then
        log_success "OmniFocus is installed"
    fi
}

check_claude_desktop() {
    if [ ! -d "/Applications/Claude.app" ]; then
        log_warning "Claude Desktop not found in /Applications/"
        echo "Please install Claude Desktop from:"
        echo "  - https://claude.ai/download"
        echo "Installation can continue, but you'll need Claude Desktop to use Focus Pocus."
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Claude Desktop is installed"
    fi
}

install_dependencies() {
    log_info "Installing Node.js dependencies..."
    if npm install; then
        log_success "Dependencies installed successfully"
    else
        log_error "Failed to install dependencies"
        exit 1
    fi
}

build_project() {
    log_info "Building Focus Pocus..."
    if npm run build; then
        log_success "Build completed successfully"
    else
        log_error "Build failed"
        exit 1
    fi
    
    # Verify build output
    if [ ! -f "dist/index.js" ]; then
        log_error "Build output missing: dist/index.js"
        exit 1
    fi
    
    if [ ! -d "dist/omnifocus/scripts" ]; then
        log_error "Build output missing: dist/omnifocus/scripts"
        exit 1
    fi
    
    log_success "Build verification passed"
}

test_omnifocus_access() {
    log_info "Testing OmniFocus automation access..."
    
    # Determine which OmniFocus app to use
    local omnifocus_app="OmniFocus"
    if [ -d "/Applications/OmniFocus 4.app" ]; then
        omnifocus_app="OmniFocus 4"
    fi
    
    # Launch OmniFocus if not running
    if ! pgrep -x "$omnifocus_app" > /dev/null; then
        log_info "Launching $omnifocus_app..."
        open -a "$omnifocus_app"
        sleep 3
    fi
    
    # Test JXA access
    if osascript -e "tell application \"$omnifocus_app\" to get name" &> /dev/null; then
        log_success "OmniFocus automation access working"
    else
        log_warning "OmniFocus automation access needs permission"
        echo ""
        echo "macOS will now prompt you to grant automation permissions."
        echo "Please click 'OK' or 'Allow' when prompted."
        echo ""
        read -p "Press Enter to test automation access..." -r
        
        # Try again and capture output
        if osascript -e "tell application \"$omnifocus_app\" to get name" &> /dev/null; then
            log_success "OmniFocus automation access granted"
        else
            log_error "Failed to access OmniFocus"
            echo ""
            echo "Please grant automation permissions manually:"
            echo "1. Open System Preferences → Security & Privacy → Privacy"
            echo "2. Select 'Automation' from the left sidebar"
            echo "3. Find your terminal app and enable '$omnifocus_app'"
            echo "4. Restart your terminal and run this script again"
            exit 1
        fi
    fi
}

test_mcp_server() {
    log_info "Testing MCP server startup..."
    
    # Test server can start (run for 3 seconds then kill)
    timeout 3 node dist/index.js &> /dev/null || true
    
    if [ $? -eq 124 ]; then  # timeout exit code
        log_success "MCP server starts successfully"
    else
        log_error "MCP server failed to start"
        echo "Try running manually: node dist/index.js"
        exit 1
    fi
}

setup_claude_config() {
    log_info "Setting up Claude Desktop configuration..."
    
    local abs_path="$CURRENT_DIR/dist/index.js"
    
    # Create Claude config directory if it doesn't exist
    mkdir -p "$(dirname "$CLAUDE_CONFIG_PATH")"
    
    # Check if config file exists
    if [ -f "$CLAUDE_CONFIG_PATH" ]; then
        log_warning "Claude Desktop config already exists"
        echo "Current config at: $CLAUDE_CONFIG_PATH"
        echo ""
        read -p "Do you want to backup and replace it? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp "$CLAUDE_CONFIG_PATH" "$CLAUDE_CONFIG_PATH.backup.$(date +%s)"
            log_info "Backup created: $CLAUDE_CONFIG_PATH.backup.*"
        else
            log_info "Skipping configuration setup"
            echo "Manual configuration required:"
            echo "Add this to your $CLAUDE_CONFIG_PATH:"
            echo ""
            cat claude-desktop-config.json | sed "s|/ABSOLUTE/PATH/TO/focus-pocus|$CURRENT_DIR|g"
            echo ""
            return
        fi
    fi
    
    # Create config file
    cat claude-desktop-config.json | sed "s|/ABSOLUTE/PATH/TO/focus-pocus|$CURRENT_DIR|g" > "$CLAUDE_CONFIG_PATH"
    
    if [ -f "$CLAUDE_CONFIG_PATH" ]; then
        log_success "Claude Desktop configuration created"
        echo "Config location: $CLAUDE_CONFIG_PATH"
    else
        log_error "Failed to create Claude Desktop configuration"
        exit 1
    fi
}

run_final_tests() {
    log_info "Running final integration tests..."
    
    # Test JSON validity
    if python3 -c "import json; json.load(open('$CLAUDE_CONFIG_PATH'))" 2>/dev/null; then
        log_success "Claude Desktop config JSON is valid"
    else
        log_error "Claude Desktop config JSON is invalid"
        exit 1
    fi
    
    # Test server can find all required files
    if [ -f "dist/index.js" ] && [ -d "dist/omnifocus/scripts" ]; then
        log_success "All required files present"
    else
        log_error "Missing required build files"
        exit 1
    fi
}

print_next_steps() {
    echo ""
    echo "🎉 Focus Pocus installation completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Restart Claude Desktop completely (quit and reopen)"
    echo "2. Test the integration with these commands in Claude:"
    echo ""
    echo "   Test connection:"
    echo "   > Can you diagnose my OmniFocus connection?"
    echo ""
    echo "   Test basic functionality:"
    echo "   > Show me my current tasks in OmniFocus"
    echo ""
    echo "   Test task creation:"
    echo "   > Create a task called 'Test MCP Integration'"
    echo ""
    echo "📖 Documentation:"
    echo "   - README.md - Quick start guide"
    echo "   - docs/local-deployment.md - Detailed setup guide"
    echo ""
    echo "🔧 Configuration file:"
    echo "   $CLAUDE_CONFIG_PATH"
    echo ""
    echo "⚠️  Troubleshooting:"
    echo "   If you have issues, enable debug logging by editing the config file:"
    echo "   Change 'LOG_LEVEL': 'info' to 'LOG_LEVEL': 'debug'"
    echo ""
}

# Main installation flow
main() {
    echo "🚀 Focus Pocus Installation Script"
    echo "=================================="
    echo ""
    
    log_info "Checking system requirements..."
    check_macos
    check_node
    check_omnifocus
    check_claude_desktop
    
    echo ""
    log_info "Installing and building Focus Pocus..."
    install_dependencies
    build_project
    
    echo ""
    log_info "Testing OmniFocus integration..."
    test_omnifocus_access
    test_mcp_server
    
    echo ""
    log_info "Configuring Claude Desktop..."
    setup_claude_config
    
    echo ""
    log_info "Running final tests..."
    run_final_tests
    
    print_next_steps
}

# Handle script interruption
trap 'log_error "Installation interrupted"; exit 1' INT TERM

# Run main installation
main "$@"
# Local Mac Deployment Guide

This guide provides detailed, step-by-step instructions for setting up Focus Pocus on your local Mac for use with Claude Desktop.

## Overview

Focus Pocus is an MCP (Model Context Protocol) server that connects Claude Desktop to OmniFocus 4. This guide assumes you want to run it locally on your Mac for personal use.

## System Requirements

### Hardware Requirements

- **Mac with Apple Silicon or Intel processor** (2019 or newer recommended)
- **4GB RAM minimum** (8GB+ recommended for large OmniFocus databases)
- **100MB available disk space** (for installation and cache)

### Software Requirements

- **macOS 10.15 (Catalina) or later** (macOS 12+ recommended)
- **OmniFocus 4** (Standard or Pro edition)
- **Node.js 18.0 or later**
- **Claude Desktop** (latest version)

### Optional Requirements

- **Homebrew** (recommended for Node.js installation)
- **Git** (for cloning from source)

## Pre-Installation Checklist

Before beginning installation, verify your system meets all requirements:

```bash
# Check macOS version (should be 10.15+)
sw_vers

# Check if OmniFocus 4 is installed
ls /Applications/ | grep -i omnifocus

# Check Node.js version (should be 18+)
node --version

# Check if Claude Desktop is installed
ls /Applications/ | grep -i claude
```

## Step 1: Install Prerequisites

### Install Node.js (if needed)

**Option A: Download from nodejs.org (Recommended)**

1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS version (18.x or later)
3. Run the installer and follow the prompts
4. Verify installation: `node --version`

**Option B: Install via Homebrew**

```bash
# Install Homebrew if you don't have it:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js:
brew install node

# Verify installation:
node --version
npm --version
```

### Verify OmniFocus 4

```bash
# Launch OmniFocus to ensure it's working
open -a "OmniFocus 4"

# Create a test task to verify database access
# (You can delete this later)
```

## Step 2: Download and Install Focus Pocus

### Option A: Clone from GitHub (Development)

```bash
# Choose installation location
cd ~/Documents  # or wherever you prefer

# Clone the repository
git clone https://github.com/drcdev/focus-pocus.git
cd focus-pocus

# Install dependencies
npm install

# Build the project
npm run build

# Verify build success
ls dist/  # Should contain index.js and omnifocus/ folder
```

### Option B: Download Release (Future)

```bash
# Download latest release
curl -L https://github.com/drcdev/focus-pocus/releases/latest/download/focus-pocus.tar.gz -o focus-pocus.tar.gz

# Extract
tar -xzf focus-pocus.tar.gz
cd focus-pocus

# Install dependencies
npm install --production
```

## Step 3: Configure macOS Automation Permissions

### Understanding Automation Permissions

macOS requires explicit permission for applications to control other applications. Focus Pocus needs permission for your terminal application to control OmniFocus 4.

### Method 1: Automatic Permission Request (Recommended)

1. **Test the server first** - this will trigger the permission request:

   ```bash
   cd focus-pocus
   node dist/index.js
   ```

2. **Grant permissions when prompted**:
   - macOS will show a dialog asking for automation access
   - Click **"OK"** or **"Allow"** to grant permission
   - The server should then start successfully

### Method 2: Manual Permission Configuration

If the automatic method doesn't work:

1. **Open System Preferences**:

   - Click the Apple menu → **System Preferences**
   - Click **Security & Privacy**

2. **Navigate to Automation settings**:

   - Click the **Privacy** tab
   - In the left sidebar, click **Automation**
   - You may need to click the lock icon and enter your password

3. **Configure permissions**:
   - Find your terminal application (Terminal, iTerm2, etc.)
   - Check the box next to **"OmniFocus 4"**
   - If you don't see these options, try running the server first

### Troubleshooting Permissions

**"Automation" option not visible**:

- Update to macOS 10.14 or later
- Try running the server first to trigger permission requests

**Terminal app not listed**:

- The app will appear after first attempting to use automation
- Run `node dist/index.js` first, then check again

**Permission denied after granting access**:

- Restart your terminal application completely
- Try running from a different terminal (Terminal.app vs iTerm2)

## Step 4: Configure Claude Desktop

### Locate Configuration File

Claude Desktop stores its configuration in your user library:

```bash
# The configuration file location:
~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Create Configuration

**If the file doesn't exist, create it:**

```bash
# Create the directory if needed
mkdir -p ~/Library/Application\ Support/Claude/

# Create the configuration file
cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "focus-pocus": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/focus-pocus/dist/index.js"],
      "env": {}
    }
  }
}
EOF
```

**Get your absolute path:**

```bash
# Run this in your focus-pocus directory:
pwd
# Copy the output and replace /ABSOLUTE/PATH/TO/focus-pocus in the config above
```

**If the file already exists, add Focus Pocus to it:**

```bash
# Edit the existing file:
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Add the focus-pocus server to the mcpServers object
```

### Example Complete Configuration

```json
{
  "mcpServers": {
    "focus-pocus": {
      "command": "node",
      "args": ["/Users/yourusername/Documents/focus-pocus/dist/index.js"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Configuration Options

You can customize the server behavior through environment variables:

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

## Step 5: Test the Installation

### Start Claude Desktop

```bash
# Restart Claude Desktop to load the new configuration
killall Claude 2>/dev/null || true
open -a Claude
```

### Test Basic Connectivity

In Claude Desktop, try these commands:

**1. Test Connection:**

```
Can you diagnose my OmniFocus connection?
```

_Expected: System status report showing successful connection_

**2. Test Basic Functionality:**

```
Show me my current tasks in OmniFocus
```

_Expected: List of your tasks with basic information_

**3. Test Advanced Features:**

```
Create a task called "Test MCP Integration" due tomorrow
```

_Expected: Confirmation that the task was created_

### Verify the Test

1. **Check OmniFocus**: Open OmniFocus and verify the test task was created
2. **Check Claude**: Ask Claude to show your tasks again to see the new task
3. **Clean up**: Delete the test task when done

## Performance Optimization

### For Large OmniFocus Databases (1000+ tasks)

```json
{
  "mcpServers": {
    "focus-pocus": {
      "command": "node",
      "args": ["/path/to/focus-pocus/dist/index.js"],
      "env": {
        "JXA_TIMEOUT": "60000",
        "CACHE_TTL": "300000",
        "DEFAULT_LIMIT": "10"
      }
    }
  }
}
```

### Memory Optimization

For systems with limited RAM:

```json
{
  "env": {
    "CACHE_MAX_SIZE": "100",
    "DEFAULT_LIMIT": "15"
  }
}
```

## Troubleshooting Common Issues

### Installation Problems

**Build fails with "Cannot find module" errors:**

```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Permission errors during npm install:**

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

### Runtime Problems

**"OmniFocus is not running" errors:**

```bash
# Ensure OmniFocus is launched and ready
open -a "OmniFocus 4"
sleep 5  # Wait for it to fully load
# Then try again
```

**Connection timeouts on first run:**

- This is normal for large databases
- Subsequent runs will be faster due to caching
- Wait up to 60 seconds for the first query

**Claude Desktop doesn't detect the server:**

```bash
# Validate your JSON configuration:
python -c "import json; json.load(open('~/Library/Application Support/Claude/claude_desktop_config.json'.replace('~', '${HOME}')))" && echo "JSON is valid"

# Check the exact path exists:
ls -la "/your/absolute/path/to/focus-pocus/dist/index.js"
```

### Performance Issues

**Slow response times:**

1. Check your OmniFocus database size
2. Increase JXA_TIMEOUT in configuration
3. Reduce DEFAULT_LIMIT for faster individual queries
4. Use cache warming by running a few queries after startup

**Memory usage too high:**

1. Reduce CACHE_MAX_SIZE
2. Restart the server periodically
3. Close unused perspectives in OmniFocus

## Security Considerations

### Local Security

- Focus Pocus only accesses your local OmniFocus database
- No data is sent to external servers
- All communication stays on your local machine
- Automation permissions can be revoked at any time

### Data Privacy

- OmniFocus data remains in your local database
- Cache is stored in memory only (not persisted to disk)
- No telemetry or usage data is collected
- No network connections except to local OmniFocus

## Maintenance

### Keeping Focus Pocus Updated

```bash
# Update from Git (if installed via clone)
cd focus-pocus
git pull origin main
npm install
npm run build

# Restart Claude Desktop to load updates
```

### Monitoring Performance

```bash
# Enable debug logging temporarily:
# Add to your Claude Desktop config:
"env": {
  "LOG_LEVEL": "debug",
  "ENABLE_CACHE_LOGGING": "true"
}

# Check Console.app for log messages
```

### Regular Maintenance

- **Weekly**: Restart Claude Desktop to clear cache
- **Monthly**: Update Focus Pocus if new versions are available
- **As needed**: Clear OmniFocus cache if data seems stale

## Getting Help

### Self-Diagnosis

1. **Run connection diagnostics**: "Can you diagnose my OmniFocus connection?"
2. **Enable debug logging**: Add `"LOG_LEVEL": "debug"` to your config
3. **Test JXA directly**: `osascript -e 'tell application "OmniFocus 4" to get name of every task'`

### Reporting Issues

When reporting issues, please include:

1. **System information**: macOS version, Node.js version, OmniFocus version
2. **Error messages**: Full error text from Claude or terminal
3. **Configuration**: Your claude_desktop_config.json (without sensitive paths)
4. **Steps to reproduce**: What you were trying to do when the error occurred

### Community Support

- **GitHub Issues**: [Project Issues](https://github.com/drcdev/focus-pocus/issues)
- **GitHub Discussions**: [Community Forum](https://github.com/drcdev/focus-pocus/discussions)
- **Documentation**: [Project Wiki](https://github.com/drcdev/focus-pocus/wiki)

---

## Quick Reference

### Essential Commands

```bash
# Install and build
npm install && npm run build

# Test server manually
node dist/index.js

# Get absolute path for config
pwd

# Test OmniFocus access
osascript -e 'tell application "OmniFocus 4" to get name'

# Restart Claude Desktop
killall Claude && open -a Claude
```

### Configuration File Location

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Common Environment Variables

```json
{
  "LOG_LEVEL": "info|debug|warn|error",
  "JXA_TIMEOUT": "45000",
  "CACHE_MAX_SIZE": "500",
  "DEFAULT_LIMIT": "25"
}
```

This completes the local Mac deployment guide. Focus Pocus should now be fully functional with Claude Desktop on your system.

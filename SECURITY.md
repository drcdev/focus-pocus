# Security Policy

## Supported Versions

Focus Pocus is currently in active development. Security updates are provided for:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Model

Focus Pocus is designed as a **local-only** application with the following security principles:

### Local Data Processing
- **No external network requests** - All data stays on your Mac
- **No telemetry or tracking** - No usage data is collected or transmitted
- **Local OmniFocus access only** - Direct communication with your local OmniFocus database

### macOS Security Integration
- **Automation permissions required** - Uses macOS permission system
- **Sandboxed execution** - Runs within macOS security boundaries
- **No sudo/admin required** - Operates with user-level permissions only

### Data Handling
- **In-memory caching only** - No persistent data storage outside OmniFocus
- **No credential storage** - No API keys, passwords, or tokens stored
- **User data privacy** - Your tasks and projects remain private and local

## Reporting a Vulnerability

If you discover a security vulnerability in Focus Pocus, please report it responsibly:

### Preferred Method
- **Email**: [Create an issue](https://github.com/your-username/focus-pocus/issues) with label `security`
- **Include**: Detailed description, steps to reproduce, potential impact

### What to Include
- **Clear description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** assessment
- **Suggested fix** if you have one
- **Your contact information** for follow-up

### Response Timeline
- **Initial response**: Within 48 hours
- **Investigation**: Within 1 week
- **Fix development**: Depends on severity and complexity
- **Public disclosure**: After fix is available and tested

## Security Best Practices for Users

### Installation Security
- **Download from official sources** only (GitHub releases)
- **Verify checksums** when available
- **Review permissions** requested by the application
- **Keep software updated** to latest version

### Configuration Security
- **Use absolute paths** in Claude Desktop configuration
- **Protect configuration files** from unauthorized access
- **Review automation permissions** in System Preferences
- **Monitor system logs** for unusual activity

### Data Protection
- **Regular OmniFocus backups** - Focus Pocus doesn't backup your data
- **System updates** - Keep macOS and dependencies current
- **Permission reviews** - Periodically review granted automation permissions

## Known Security Considerations

### macOS Automation
- **Full OmniFocus access** - Focus Pocus can read/write all OmniFocus data
- **Terminal permissions** - Your terminal app needs automation access
- **Process visibility** - Other applications may see Focus Pocus running

### Local Network
- **MCP protocol** - Uses stdio communication with Claude Desktop
- **No network binding** - No listening ports or network services
- **Local IPC only** - Communication stays within your system

### Dependencies
- **Node.js modules** - Regular security updates for dependencies
- **TypeScript compilation** - Source code transparency
- **Minimal dependencies** - Reduced attack surface

## Security Updates

When security issues are addressed:

1. **Immediate fix** for critical vulnerabilities
2. **Version bump** following semantic versioning
3. **Changelog entry** describing the fix (without exploit details)
4. **GitHub release** with updated binaries
5. **User notification** via README and documentation

## Disclaimer

Focus Pocus is provided "as is" without warranty. Users are responsible for:
- **Backing up their data** before installation
- **Reviewing permissions** before granting access
- **Understanding risks** of automation tools
- **Keeping software updated** for security patches

For technical support or questions about this security policy, please create an issue in the GitHub repository.

---

Last updated: August 2025
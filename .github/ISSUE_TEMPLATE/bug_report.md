---
name: Bug report
about: Create a report to help us improve Focus Pocus
title: ''
labels: 'bug'
assignees: ''

---

## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Error Messages
If applicable, paste any error messages you received:

```
Paste error messages here
```

## System Information
- **macOS Version**: [e.g. macOS 13.0]
- **OmniFocus Version**: [e.g. OmniFocus 4.2]
- **Node.js Version**: [run `node --version`]
- **Claude Desktop Version**: [e.g. 1.0.0]
- **Focus Pocus Version**: [e.g. 1.0.0]

## Diagnostic Information
Please run the diagnostic command in Claude and paste the results:

Ask Claude: "Can you diagnose my OmniFocus connection?"

```
Paste diagnostic results here
```

## Additional Context
Add any other context about the problem here.

## Configuration
If relevant, share your Claude Desktop configuration (remove any sensitive paths):

```json
{
  "mcpServers": {
    "focus-pocus": {
      "command": "node",
      "args": ["your-path-here/dist/index.js"],
      "env": {}
    }
  }
}
```
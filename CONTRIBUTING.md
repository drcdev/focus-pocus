# Contributing to Focus Pocus

Thank you for your interest in contributing to Focus Pocus! This guide will help you get started.

## Quick Start for Contributors

1. **Fork the repository** on GitHub
2. **Clone your fork**: `git clone https://github.com/yourusername/focus-pocus.git`
3. **Install dependencies**: `npm install`
4. **Build the project**: `npm run build`
5. **Run tests**: `npm test`

## Development Setup

### Prerequisites
- **macOS 10.15+** (required for OmniFocus and JXA testing)
- **Node.js 18+** 
- **OmniFocus** (any version for testing)
- **Claude Desktop** (for integration testing)

### Project Structure
```
focus-pocus/
├── src/                    # TypeScript source code
│   ├── index.ts           # MCP server entry point
│   ├── omnifocus/         # OmniFocus integration
│   ├── tools/             # MCP tool implementations
│   ├── cache/             # Caching system
│   └── utils/             # Shared utilities
├── tests/                 # Test suites
├── docs/                  # Documentation
└── dist/                  # Compiled output (generated)
```

### Development Workflow

1. **Create a feature branch**: `git checkout -b feature/your-feature-name`
2. **Make your changes** in the `src/` directory
3. **Run type checking**: `npm run typecheck`
4. **Run tests**: `npm test`
5. **Build the project**: `npm run build`
6. **Test integration**: Test with Claude Desktop if applicable
7. **Commit your changes**: Follow our commit message format
8. **Push and create a pull request**

### Code Style

- **TypeScript**: Use strict typing, no `any` types
- **Error Handling**: Always use try-catch for external operations
- **Comments**: Minimal comments, prefer self-documenting code
- **JXA Scripts**: Use the standardized `safeGet()` utility function

### Testing

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test MCP tool functionality
- **Manual Testing**: Test with actual OmniFocus data

Run tests with: `npm test`

### JXA Development

When working with JXA scripts in `src/omnifocus/scripts/`:

1. **Test in Script Editor** first (macOS app)
2. **Use `safeGet()` utility** for all OmniFocus property access
3. **Handle errors gracefully** - OmniFocus API can be unpredictable
4. **Minimize JXA calls** - Each property access is expensive
5. **Test with large datasets** - Performance varies significantly

### Documentation

- **README.md**: Keep installation instructions current
- **Code Comments**: Only when necessary for complex logic
- **API Documentation**: Update tool descriptions for new features
- **Changelog**: Add entries for user-facing changes

## Types of Contributions

### 🐛 Bug Fixes
- Fix issues with existing MCP tools
- Improve error handling and edge cases
- Performance optimizations
- OmniFocus compatibility improvements

### ✨ New Features
- New MCP tools for OmniFocus operations
- Enhanced natural language processing
- Additional automation capabilities
- Better user experience improvements

### 📚 Documentation
- Installation guides and troubleshooting
- Usage examples and tutorials
- API documentation improvements
- Video walkthroughs

### 🧪 Testing
- Additional test coverage
- Integration test scenarios
- Performance benchmarks
- Edge case validation

## Commit Message Format

Use descriptive commit messages:

```
type(scope): brief description

Longer description if needed.

- Bullet points for multiple changes
- Reference issues with #123
```

**Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
**Scopes**: `tools`, `jxa`, `cache`, `docs`, `build`

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**: `npm test`
4. **Update CHANGELOG.md** for user-facing changes
5. **Create detailed PR description**:
   - What changes were made
   - Why they were made
   - How to test them
   - Any breaking changes

## Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check the documentation** and troubleshooting guides
3. **Try the diagnostic tools** (`validate-config.sh`)
4. **Test with latest version**

### Writing Good Issues

- **Use descriptive titles**
- **Provide system information** (macOS, OmniFocus, Node.js versions)
- **Include error messages** and diagnostic output
- **Describe expected vs actual behavior**
- **Provide steps to reproduce**

## Code Review Process

- **All changes require review** before merging
- **Automated tests must pass**
- **Documentation must be updated**
- **Performance impact considered**
- **Breaking changes clearly documented**

## Community Guidelines

- **Be respectful** and constructive
- **Help newcomers** get started
- **Share knowledge** and best practices
- **Focus on solutions** rather than problems
- **Maintain project quality** standards

## Questions?

- **GitHub Discussions**: For general questions and ideas
- **GitHub Issues**: For specific bugs and feature requests  
- **Documentation**: Check [docs/local-deployment.md](docs/local-deployment.md) for detailed guides

---

Thank you for contributing to Focus Pocus! Your help makes this project better for everyone. 🎉
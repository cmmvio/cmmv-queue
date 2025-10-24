# Contributing to @cmmv/queue

Thank you for your interest in contributing! This document provides guidelines and instructions for contributors.

## 🎯 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (recommended) or npm
- Docker (for integration tests)
- Git

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/cmmvio/cmmv-queue.git
cd cmmv-queue

# Install dependencies
npm install

# Run tests
npm run test:unit

# Build
npm run build
```

## 🧪 Testing Requirements

**ALL pull requests MUST include tests.**

### Running Tests

```bash
# Unit tests (fast, always run these)
npm run test:unit

# Integration tests (requires Docker)
docker-compose -f tests/docker-compose.yml up -d
npm run test:integration

# All tests
npm test

# Coverage
npm run test:coverage
```

### Test Coverage Requirements

- New features: 90%+ coverage
- Bug fixes: Add regression test
- Refactoring: Maintain or improve coverage

### Writing Tests

Follow AAA pattern (Arrange-Act-Assert):

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
    it('should do something specific', () => {
        // Arrange
        const input = 'test';
        
        // Act
        const result = myFunction(input);
        
        // Assert
        expect(result).toBe('expected');
    });
});
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for details.

## 📝 Code Style

### Formatting

We use Prettier and ESLint:

```bash
# Lint code
npm run lint

# Prettier runs automatically on commit via husky
```

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types when possible
- Provide proper interfaces and types
- Enable strict type checking

### Naming Conventions

- **Services**: PascalCase with `Service` suffix (e.g., `QueueService`)
- **Consumers**: PascalCase with `Consumer` suffix
- **Decorators**: PascalCase with `@` prefix (e.g., `@Channel`)
- **Files**: kebab-case (e.g., `queue.service.ts`)
- **Tests**: `*.spec.ts` for unit tests

## 🔄 Git Workflow

### Branches

- `main` - Production-ready code
- `develop` - Development branch (if exists)
- `feature/your-feature` - Feature branches
- `fix/bug-description` - Bug fix branches

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add new feature
fix: resolve bug
docs: update documentation
test: add tests
refactor: refactor code
chore: maintenance tasks
```

Examples:
```bash
feat: add support for Synap queue system
fix: resolve RabbitMQ connection timeout issue
test: add integration tests for Kafka consumer groups
docs: update README with testing guide
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**
   - Write code
   - Add tests (REQUIRED)
   - Update documentation

3. **Commit**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/my-feature
   ```

5. **PR Review**
   - CI tests must pass
   - Coverage must meet thresholds
   - Code review approval required

## 🏗️ OpenSpec Workflow

This project uses OpenSpec for change proposals.

### Creating a Proposal

```bash
# Check existing proposals
cd openspec
ls changes/

# Create new proposal
mkdir -p changes/add-my-feature/specs/capability
```

See [openspec/AGENTS.md](openspec/AGENTS.md) for details.

### OpenSpec Structure

```
openspec/
├── project.md              # Project context
├── specs/                  # Current specifications
└── changes/                # Change proposals
    └── my-feature/
        ├── proposal.md     # Why and what
        ├── tasks.md        # Implementation checklist
        ├── design.md       # Technical decisions (optional)
        └── specs/          # Spec deltas
```

## 🐛 Bug Reports

### Before Reporting

- Search existing issues
- Check if it's already fixed in `main`
- Verify it's not a configuration issue

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Configure queue as '...'
2. Call method '...'
3. See error

**Expected behavior**
What you expected to happen.

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Node version: [e.g., 20.10.0]
- @cmmv/queue version: [e.g., 0.8.0]
- Queue type: [RabbitMQ/Kafka/Redis]

**Additional context**
Any other relevant information.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives considered**
Other solutions you've thought about.

**Additional context**
Any other relevant information.
```

## 🤝 Code Review Guidelines

### What We Look For

- ✅ Tests included and passing
- ✅ Code follows style guide
- ✅ Documentation updated
- ✅ No breaking changes (or clearly marked)
- ✅ Commit messages follow convention
- ✅ Coverage maintained or improved

### Review Process

1. Automated CI checks run
2. Maintainer reviews code
3. Feedback provided
4. Changes requested (if needed)
5. Approval and merge

## 📚 Resources

- [CMMV Documentation](https://cmmv.io)
- [Testing Guide](TESTING_GUIDE.md)
- [OpenSpec Workflow](openspec/AGENTS.md)
- [Vitest Documentation](https://vitest.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.


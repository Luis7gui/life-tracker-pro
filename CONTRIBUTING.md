# Contributing to Life Tracker

We welcome contributions to Life Tracker! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Create a new branch for your feature: `git checkout -b feature/your-feature-name`

## Development Setup

1. Copy the environment variables: `cp .env.example .env`
2. Set up the database: `npm run migrate`
3. Seed with sample data: `npm run seed`
4. Start the development server: `npm run dev`

## Code Guidelines

### TypeScript
- Use TypeScript for all new code
- Provide proper type definitions
- Avoid using `any` type

### React Components
- Use functional components with hooks
- Follow the existing component structure
- Use proper prop types and interfaces

### Code Style
- Use ESLint and follow the existing configuration
- Run `npm run lint` before committing
- Use meaningful variable and function names
- Add comments for complex logic

## Testing

- Write tests for new features
- Run tests with `npm test`
- Ensure all tests pass before submitting a PR

## Commit Messages

Use conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure the build passes
4. Update the changelog if applicable
5. Submit a pull request with a clear description

## Issue Reporting

When reporting issues, please include:
- Operating system and version
- Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## Questions?

Feel free to open an issue for questions or join our Discord community.
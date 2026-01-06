# Contributing to Meteora Sniper Bot

Thank you for your interest in contributing to the Meteora Sniper Bot! This document provides guidelines and instructions for contributing.

## Code Style

- Use TypeScript with strict type checking
- Follow existing code patterns and architecture
- Use the service-based architecture for new features
- Add JSDoc comments for public functions and classes
- Use structured logging with the logger utility

## Project Structure

```
src/
├── config/          # Configuration management
├── constants/       # Application constants
├── errors/          # Custom error classes
├── executor/        # Transaction execution methods
├── services/        # Business logic services
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes following the code style
3. Test your changes thoroughly
4. Update documentation if needed
5. Submit a pull request

## Adding New Features

- Create service classes for new functionality
- Add proper TypeScript types
- Include error handling
- Add logging
- Update documentation

## Testing

- Test with small amounts first
- Verify all filters work correctly
- Test error scenarios
- Ensure graceful error handling

## Questions?

Feel free to open an issue for questions or discussions.


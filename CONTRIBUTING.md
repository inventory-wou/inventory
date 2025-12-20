# Contributing to Inventory Management System

Thank you for your interest in contributing to the Inventory Management System for Woxsen University!

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/inventory-system.git
   cd inventory-system
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env` and fill in your credentials
5. Initialize database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
6. Run development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in the appropriate files
2. Follow the existing code style
3. Test your changes thoroughly
4. Commit with descriptive messages

### Commit Message Format

We follow conventional commits:

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code formatting (no functional changes)
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Build/tooling changes

**Examples:**
```bash
git commit -m "feat: add QR code label generation"
git commit -m "fix: resolve manual ID duplication issue"
git commit -m "docs: update README with setup instructions"
```

### Submitting a Pull Request

1. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Create a Pull Request on GitHub
3. Describe your changes clearly
4. Link any related issues
5. Wait for review

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use meaningful variable names

### React Components

- Use functional components with hooks
- Keep components focused and reusable
- Use proper prop types
- Follow component naming conventions (PascalCase)

### API Routes

- Validate all inputs
- Use proper HTTP status codes
- Handle errors gracefully
- Add audit logging for important actions
- Follow RESTful conventions

### Database

- Use Prisma for all database operations
- Never write raw SQL
- Add proper indexes
- Use transactions when needed

### Styling

- Use Tailwind CSS utility classes
- Follow the existing design system
- Ensure responsive design
- Test on different screen sizes

## Project Structure

```
src/
├── app/              # Next.js pages and API routes
├── components/       # Reusable React components
├── lib/              # Utility functions and configurations
└── types/            # TypeScript type definitions
```

## Testing

Before submitting a PR:

1. Test your changes locally
2. Run linting: `npm run lint`
3. Check TypeScript: `npm run type-check`
4. Test on different browsers
5. Verify responsive design

## Database Changes

If you modify the Prisma schema:

1. Update `prisma/schema.prisma`
2. Generate migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```
3. Update related API routes and types
4. Document breaking changes

## Adding New Features

For major features:

1. Open an issue first to discuss
2. Get approval from maintainers
3. Create feature branch
4. Implement with tests
5. Update documentation
6. Submit PR

## Bug Reports

When reporting bugs:

- Use the bug report template
- Provide steps to reproduce
- Include screenshots if relevant
- Specify your environment (OS, browser, etc.)
- Check if issue already exists

## Feature Requests

When requesting features:

- Use the feature request template
- Explain the use case
- Describe expected behavior
- Consider implementation complexity

## Documentation

When updating documentation:

- Keep it clear and concise
- Include code examples
- Update README if needed
- Check for typos and formatting

## Security

If you discover a security vulnerability:

- **DO NOT** open a public issue
- Email: inventory_wou@woxsen.edu.in
- Include detailed description
- Allow time for fix before disclosure

## Code of Conduct

- Be respectful and professional
- Welcome newcomers
- Provide constructive feedback
- Focus on the code, not the person
- Follow university guidelines

## Questions?

- Create a GitHub issue
- Contact: inventory_wou@woxsen.edu.in
- Check existing documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to make the Inventory Management System better!** 🎉

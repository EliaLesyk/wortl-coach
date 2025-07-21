# 🤝 Contributing to Wortl Coach

Thank you for your interest in contributing to Wortl Coach! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## 🚀 How Can I Contribute?

### Reporting Bugs

- Use the GitHub issue tracker
- Include detailed steps to reproduce the bug
- Provide system information (OS, Node.js version, etc.)
- Include error messages and logs

### Suggesting Enhancements

- Use the GitHub issue tracker with the "enhancement" label
- Describe the feature and its benefits
- Consider implementation complexity
- Check if the feature aligns with project goals

### Code Contributions

- Fork the repository
- Create a feature branch
- Make your changes
- Add tests if applicable
- Submit a pull request

## 🔧 Development Setup

### Prerequisites

- Node.js 18+
- Google Cloud Platform account
- Telegram Bot Token
- Gemini API Key

### Local Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/wortl-coach.git
   cd wortl-coach
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Set Up Google Cloud**
   ```bash
   # Follow the setup instructions in README.md
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

5. **Run Tests**
   ```bash
   npm test
   ```

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write your code
   - Add tests
   - Update documentation

3. **Test Your Changes**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

## 📝 Pull Request Process

### Before Submitting

1. **Ensure Tests Pass**
   ```bash
   npm test
   npm run lint
   ```

2. **Update Documentation**
   - Update README.md if needed
   - Add JSDoc comments for new functions
   - Update API documentation

3. **Check Code Quality**
   - Follow coding standards
   - Ensure proper error handling
   - Add appropriate logging

### PR Guidelines

1. **Title Format**: `type(scope): description`
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation changes
   - `style`: Code style changes
   - `refactor`: Code refactoring
   - `test`: Test changes
   - `chore`: Build/tooling changes

2. **Description**: Clear description of changes
   - What was changed
   - Why it was changed
   - How to test the changes

3. **Linked Issues**: Reference related issues
   - Use keywords like "Fixes #123" or "Closes #456"

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests
2. **Code Review**: Maintainers review the code
3. **Approval**: At least one maintainer must approve
4. **Merge**: PR is merged after approval

## 📏 Coding Standards

### JavaScript/Node.js

- Use ES6+ features
- Follow Airbnb JavaScript Style Guide
- Use meaningful variable and function names
- Add JSDoc comments for public functions

### Example

```javascript
/**
 * Sends an automated challenge to a user
 * @param {string} userId - The user's Telegram ID
 * @param {Object} bot - The Telegram bot instance
 * @returns {Promise<void>}
 */
const sendAutomatedChallenge = async (userId, bot) => {
  try {
    console.log(`Sending automated challenge to user ${userId}`);
    
    // Implementation here...
    
  } catch (error) {
    console.error(`Error sending challenge to user ${userId}:`, error);
    throw error;
  }
};
```

### Error Handling

- Always use try-catch blocks for async operations
- Log errors with context
- Provide meaningful error messages
- Don't expose sensitive information in errors

### Logging

- Use structured logging
- Include relevant context
- Use appropriate log levels (debug, info, warn, error)

## 🧪 Testing

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── fixtures/       # Test data
```

### Writing Tests

```javascript
const { expect } = require('chai');
const { analyzeText } = require('../src/services');

describe('analyzeText', () => {
  it('should return feedback for valid text', async () => {
    const text = 'Ich habe das gemacht.';
    const result = await analyzeText(text);
    
    expect(result).to.be.a('string');
    expect(result).to.contain('Vorschlag');
  });

  it('should handle empty text', async () => {
    const result = await analyzeText('');
    expect(result).to.contain('Bitte gib einen Text ein');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/services.test.js

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for all public functions
- Include parameter types and return values
- Provide usage examples

### API Documentation

- Document all API endpoints
- Include request/response examples
- Specify error codes and messages

### User Documentation

- Keep README.md up to date
- Add screenshots for UI changes
- Include troubleshooting guides

## 🏷️ Issue Labels

We use the following labels to categorize issues:

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements or additions to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `question`: Further information is requested
- `wontfix`: This will not be worked on

## 🎯 Areas for Contribution

### High Priority

- [ ] Improve speech recognition accuracy
- [ ] Add more language learning exercises
- [ ] Enhance error handling and user feedback
- [ ] Optimize database queries

### Medium Priority

- [ ] Add analytics and progress tracking
- [ ] Implement user preferences
- [ ] Create admin dashboard
- [ ] Add multi-language support

### Low Priority

- [ ] UI/UX improvements
- [ ] Performance optimizations
- [ ] Additional test coverage
- [ ] Documentation improvements

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: support@wortl-coach.com

## 🙏 Recognition

Contributors will be recognized in:

- GitHub contributors list
- Project README.md
- Release notes
- Project website (if applicable)

---

Thank you for contributing to Wortl Coach! 🎉 
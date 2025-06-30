# 🧪 Development Branch - Neff Paving

Welcome to the development branch! This is the active development area where new features are built and tested before being released.

## ⚠️ Important Branch Information

**You are currently on the `development` branch** - this is where all new features and experimental work should be done.

### 🔀 Branch Structure
- `development` ← **YOU ARE HERE** - Active development
- `main` - Stable releases ready for production
- `deployment` - Production code deployed to GitHub Pages

## 🚀 Getting Started

### For New Features
```bash
# Create a feature branch from development
git checkout -b feature/your-feature-name

# After development, create PR to development
gh pr create --base development --title "Your feature title"
```

### For Development Work
```bash
# Make sure you're up to date
git pull origin development

# Make your changes and commit
git add .
git commit -m "Your descriptive commit message"
git push origin development
```

## 📋 Development Guidelines

### ✅ Safe to do on this branch:
- Add new features
- Experiment with new technologies
- Update development documentation
- Add test features
- Break things (it's okay, we can fix them!)

### ❌ Things to avoid:
- Making changes that affect production immediately
- Adding sensitive information (API keys, passwords)
- Large changes without discussing with the team first

## 🔄 Release Process

When your features are ready for production:

1. **Development Testing** - Test thoroughly in this branch
2. **Create PR to Main** - `development` → `main`
3. **Code Review** - Team reviews the changes
4. **Merge to Main** - Stable code moves to main
5. **Deploy** - Main gets promoted to `deployment` branch
6. **Live on GitHub Pages** - Users see the changes

## 📝 Current Development Features

### Neff Paving Scheduling System
- Complete job scheduling with Calendly integration
- Multi-channel alert system (email, SMS, dashboard)
- Payment processing with Stripe
- Comprehensive documentation system
- Contract generation and management

### Development Environment
- **Vite 7** - Modern build tooling with ES modules
- **Jest Testing** - Unit, integration, and E2E tests
- **Modern JavaScript** - ES6+ features and modules
- **Performance Optimized** - Build splitting and optimization

## 🧪 Testing Your Changes

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production (test build process)
npm run build
```

### Testing Guidelines
- Test on multiple browsers
- Check mobile responsiveness
- Verify all links and forms work
- Test with different screen sizes
- Ensure performance is maintained

## 📚 Documentation

All development documentation is available in the `docs/` folder:
- **Technical Docs** - API guides, integration docs
- **User Docs** - Customer and staff guides
- **Deployment Docs** - Deployment and branching strategy

## 🔐 Security Notes

### Environment Variables
Development may use different environment variables than production:
```bash
NODE_ENV=development
# Use development API keys
# Use test payment processors
# Enable debug logging
```

### Safe Development
- Never commit sensitive information
- Use `.env.local` for local secrets (not tracked by git)
- Test with dummy data, not real customer information

## 🐛 Troubleshooting

### Common Issues
1. **Build fails**: Check Node.js version (18+) and run `npm install`
2. **Tests fail**: Run `npm test` to see specific failures
3. **Branch conflicts**: Run `git pull origin development` to sync

### Getting Help
- Check the [Branching Strategy](docs/deployment/branching-strategy.md)
- Review [Technical Documentation](docs/technical/)
- Ask team members for guidance
- Create an issue for bugs or questions

## 📊 Project Status

### Recently Completed
✅ Complete scheduling system implementation  
✅ Comprehensive documentation (5,100+ lines)  
✅ Vite 7 migration with ES modules  
✅ Dependency security updates  
✅ Branching strategy implementation  

### In Development
🔄 Additional scheduling features  
🔄 Enhanced user interface improvements  
🔄 Performance optimizations  
🔄 Additional integrations  

### Planned Features
📋 Mobile app development  
📋 Advanced reporting system  
📋 Customer portal enhancements  
📋 Additional payment methods  

## 🎯 Development Priorities

1. **Feature Completion** - Finish any in-progress features
2. **Testing Coverage** - Ensure comprehensive test coverage
3. **Performance** - Maintain fast load times
4. **Documentation** - Keep docs updated with changes
5. **Security** - Follow security best practices

## 🚀 Ready to Release?

When your development work is ready for users:

1. **Self Review** - Double-check your changes
2. **Test Everything** - Run full test suite
3. **Update Documentation** - Document any new features
4. **Create Release PR** - Submit PR from `development` to `main`
5. **Code Review** - Get team approval
6. **Merge & Deploy** - Code goes live after approval

---

**Happy Coding!** 🎉

*Remember: This development branch is your safe space to experiment, learn, and build amazing features for Neff Paving's customers.*

---

**Branch**: `development`  
**Last Updated**: 2024-06-30  
**Maintained By**: Development Team

# Branching Strategy - Neff Paving Repository

## Overview

This repository uses a structured branching strategy to ensure safe development and deployment practices. The strategy separates development work from production deployments and provides clear guidelines for contributors.

## Branch Structure

### 🚀 `deployment` - Production Deployment Branch
- **Purpose**: Production-ready code that gets deployed to GitHub Pages
- **Protection**: Highest level of protection
- **Deployment**: Automatically deploys to https://jordolang.github.io/Neff-Paving/
- **Updates**: Only receives updates via Pull Requests from `main` branch
- **Access**: Write access restricted to repository maintainers

### 🔒 `main` - Stable Release Branch  
- **Purpose**: Stable, tested code ready for production
- **Protection**: Protected from direct pushes
- **Updates**: Receives updates via Pull Requests from `development` branch
- **Review**: Requires code review before merging
- **Testing**: All tests must pass before merging

### 🧪 `development` - Feature Development Branch
- **Purpose**: Active development and new features
- **Protection**: Allows direct pushes from authorized developers
- **Testing**: Feature branches merged here for integration testing
- **Isolation**: Never directly deployed to production
- **Freedom**: Safe space for experimental features and documentation

### 🌿 `feature/*` - Feature Branches (as needed)
- **Purpose**: Individual feature development
- **Naming**: `feature/feature-name` or `feature/issue-number`
- **Lifecycle**: Created from and merged back to `development`
- **Cleanup**: Deleted after successful merge

## Workflow Process

### 1. Development Workflow
```
feature/new-feature → development → main → deployment → GitHub Pages
```

### 2. Development Process
1. **Create Feature Branch**: `git checkout -b feature/new-feature development`
2. **Develop Feature**: Make changes, commit regularly
3. **Test Locally**: Ensure feature works correctly
4. **Create PR**: Pull Request from `feature/new-feature` to `development`
5. **Code Review**: Team reviews the changes
6. **Merge to Development**: After approval, merge to `development`

### 3. Release Process
1. **Integration Testing**: Test features together in `development`
2. **Create Release PR**: Pull Request from `development` to `main`
3. **Final Review**: Comprehensive review of all changes
4. **Merge to Main**: After approval, merge to `main`
5. **Deploy PR**: Pull Request from `main` to `deployment`
6. **Production Deployment**: After approval, merge to `deployment` (triggers deployment)

### 4. Hotfix Process
```
hotfix/urgent-fix → main → deployment
```
1. **Create Hotfix**: `git checkout -b hotfix/urgent-fix main`
2. **Fix Issue**: Make minimal necessary changes
3. **Test Fix**: Verify fix works correctly
4. **Fast-track PR**: Direct PR to `main` with expedited review
5. **Deploy**: Immediate deployment via `deployment` branch
6. **Backport**: Merge hotfix to `development` to keep branches in sync

## Branch Protection Rules

### `deployment` Branch
- ✅ Require pull request reviews (2 reviewers)
- ✅ Require status checks to pass
- ✅ Require conversation resolution
- ✅ Restrict pushes to specific users
- ✅ Allow force pushes: NO
- ✅ Allow deletions: NO

### `main` Branch  
- ✅ Require pull request reviews (1 reviewer)
- ✅ Require status checks to pass
- ✅ Require conversation resolution
- ✅ Restrict pushes to specific users
- ✅ Allow force pushes: NO
- ✅ Allow deletions: NO

### `development` Branch
- ✅ Require status checks to pass (if CI is configured)
- ✅ Allow force pushes: Limited (maintainers only)
- ✅ Allow deletions: NO

## Deployment Configuration

### GitHub Pages Setup
- **Source Branch**: `deployment`
- **Build System**: GitHub Actions workflow
- **Auto-Deploy**: Triggered on push to `deployment`
- **Protection**: Environment protection rules prevent unauthorized deployments

### Environment Variables
Different branches may use different environment configurations:
- **Development**: `NODE_ENV=development`
- **Main**: `NODE_ENV=staging` 
- **Deployment**: `NODE_ENV=production`

## Best Practices

### For Developers
1. **Always start from `development`** when creating new features
2. **Keep commits atomic** - one logical change per commit
3. **Write descriptive commit messages** following conventional commit format
4. **Test thoroughly** before creating pull requests
5. **Keep branches up to date** with regular merges from upstream

### For Code Reviews
1. **Review for functionality** - does the code work as intended?
2. **Review for security** - are there any security vulnerabilities?
3. **Review for documentation** - is the code properly documented?
4. **Review for testing** - are there appropriate tests?
5. **Review for performance** - will this impact site performance?

### For Releases
1. **Version tagging** - tag releases in `main` branch
2. **Release notes** - document what changed in each release
3. **Rollback plan** - always have a rollback strategy
4. **Monitoring** - monitor deployment for issues
5. **Communication** - notify stakeholders of deployments

## Emergency Procedures

### Production Issues
1. **Immediate Response**: Identify the issue scope
2. **Rollback Decision**: Determine if rollback is needed
3. **Hotfix Creation**: Create hotfix branch if rollback isn't sufficient
4. **Fast-track Review**: Expedited review process for critical fixes
5. **Post-incident Review**: Document what happened and how to prevent it

### Branch Corruption
1. **Assess Damage**: Determine what was affected
2. **Restore from Backup**: Use git reflog or GitHub's branch protection
3. **Communicate**: Notify team of the issue and resolution
4. **Review Process**: Update procedures to prevent recurrence

## Commands Reference

### Setting Up Local Environment
```bash
# Clone repository
git clone https://github.com/jordolang/Neff-Paving.git
cd Neff-Paving

# Set up all tracking branches
git branch --track development origin/development
git branch --track deployment origin/deployment

# Switch to development for daily work
git checkout development
```

### Creating a Feature
```bash
# Start from development
git checkout development
git pull origin development

# Create feature branch
git checkout -b feature/my-new-feature

# After development, push and create PR
git push -u origin feature/my-new-feature
gh pr create --base development --title "Add my new feature"
```

### Preparing a Release
```bash
# Ensure development is up to date
git checkout development
git pull origin development

# Create release PR to main
gh pr create --base main --title "Release v1.1.0" --body "Release notes..."

# After merge, create deployment PR
git checkout main
git pull origin main
gh pr create --base deployment --title "Deploy v1.1.0" --body "Deploy release v1.1.0"
```

### Emergency Hotfix
```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# After fix, create PR to main
git push -u origin hotfix/critical-fix
gh pr create --base main --title "HOTFIX: Critical issue" --label "hotfix"

# After merge to main, also merge to development
git checkout development
git merge main
git push origin development
```

## Monitoring and Maintenance

### Regular Maintenance
- **Weekly**: Review open PRs and stale branches
- **Monthly**: Clean up merged feature branches
- **Quarterly**: Review and update branch protection rules
- **Annually**: Review entire branching strategy effectiveness

### Branch Health Monitoring
- **Behind Indicators**: Monitor if branches are behind their upstream
- **Conflict Detection**: Watch for merge conflicts between branches
- **Size Monitoring**: Alert if branches diverge too much
- **Age Tracking**: Identify long-running feature branches

## Troubleshooting

### Common Issues
1. **Branch is behind**: `git pull origin branch-name`
2. **Merge conflicts**: Resolve manually and commit
3. **Accidental commits to wrong branch**: Use `git cherry-pick` to move commits
4. **Need to undo last commit**: `git reset --soft HEAD~1`

### Getting Help
- **Documentation**: Check this guide and Git documentation
- **Team Communication**: Ask in project channels
- **Git Support**: Use `git help command-name` for specific commands
- **Repository Maintainers**: Contact for branch protection or access issues

---

**Last Updated**: 2024-06-30  
**Version**: 1.0  
**Maintained By**: Repository Maintainers  
**Review Schedule**: Quarterly

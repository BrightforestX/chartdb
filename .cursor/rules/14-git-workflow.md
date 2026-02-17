# Git Workflow and PR Guidelines

## Overview
ChartDB follows standard Git best practices with a focus on clear history, meaningful commits, and thorough code review.

## Branch Strategy

### Main Branches

- **main**: Production-ready code
- **develop**: Integration branch for features (if using Git Flow)

### Feature Branches

```bash
# ✅ Good - Descriptive branch names
git checkout -b feat/table-grouping-by-area
git checkout -b fix/relationship_lines_table_resize
git checkout -b docs/update-readme

# Branch naming convention:
# feat/     - New features
# fix/      - Bug fixes
# docs/     - Documentation
# refactor/ - Code refactoring
# test/     - Adding tests
# chore/    - Maintenance tasks

# ❌ Bad - Unclear branch names
git checkout -b my-changes
git checkout -b temp
git checkout -b john-dev
```

### Branch Management

```bash
# ✅ Good - Keep branch up to date
git checkout main
git pull origin main
git checkout feat/my-feature
git rebase main # or merge main

# ✅ Good - Clean up after merge
git branch -d feat/my-feature
git push origin --delete feat/my-feature
```

## Commit Messages

### Commit Message Format

Follow Conventional Commits:

```bash
# Format:
<type>(<scope>): <subject>

<body>

<footer>

# ✅ Good examples:
git commit -m "feat(tables): add support for composite primary keys"
git commit -m "fix(import): resolve MySQL array type parsing issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "refactor(canvas): extract table node component"
git commit -m "test(diagram): add tests for relationship creation"
git commit -m "chore(deps): update dependencies"

# With body:
git commit -m "feat(export): add SQL Server dialect support

- Implement SQL Server exporter
- Add dialect-specific type mappings
- Update export dialog with MSSQL option

Closes #123"
```

### Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependencies

### Commit Guidelines

```bash
# ✅ Good - Atomic commits
git add src/components/table/table-node.tsx
git commit -m "feat(table): add collapsible table nodes"

git add src/components/table/table-node.test.tsx
git commit -m "test(table): add tests for collapsible nodes"

# ✅ Good - Descriptive messages
git commit -m "fix(import): handle null values in PostgreSQL array fields"

# ❌ Bad - Vague messages
git commit -m "fix stuff"
git commit -m "wip"
git commit -m "update"
git commit -m "fix bug"

# ❌ Bad - Large, unfocused commits
git add .
git commit -m "feat: add lots of features"
```

## Pull Requests

### PR Title

Use the same format as commit messages:

```
feat(tables): add sticky notes support
fix(relationships): adjust edge offset when cardinality is visible
docs: add database dialect documentation
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Changes Made
- List specific changes
- Be detailed but concise
- Include screenshots if UI changes

## Testing
- [ ] All tests pass
- [ ] Added new tests for changes
- [ ] Manually tested on browsers: Chrome, Firefox, Safari
- [ ] Tested with screen reader (if applicable)

## Screenshots (if applicable)
Before:
[Screenshot]

After:
[Screenshot]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Accessibility checked
- [ ] i18n keys added for new text

## Related Issues
Closes #123
Relates to #456

## Additional Notes
Any additional context or notes
```

### PR Size

```bash
# ✅ Good - Focused PRs (< 400 lines changed)
# Single feature or fix
# Easy to review

# ⚠️ Acceptable - Medium PRs (400-800 lines)
# Complex feature
# Split if possible

# ❌ Bad - Large PRs (> 800 lines)
# Hard to review
# Split into smaller PRs
```

## Code Review

### As Author

```bash
# ✅ Before creating PR:
# 1. Run linter
npm run lint

# 2. Run tests
npm test

# 3. Self-review changes
git diff main...feat/my-feature

# 4. Update documentation
# 5. Add tests for new functionality
# 6. Ensure CI passes
```

### As Reviewer

#### Review Checklist

- [ ] Code follows style guidelines
- [ ] Changes match PR description
- [ ] Logic is sound and efficient
- [ ] Edge cases handled
- [ ] Error handling present
- [ ] Tests added/updated
- [ ] No console.log or debug code
- [ ] Accessibility considered
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Breaking changes noted

#### Review Comments

```markdown
# ✅ Good - Constructive feedback
**Question:** Why did you choose Map over object here?

**Suggestion:** Consider extracting this logic into a custom hook for reusability.

**Issue:** This could cause a memory leak. The effect cleanup should cancel the request.

**Nitpick:** Minor style preference - could use optional chaining here: `user?.name`

**Praise:** Nice refactoring! Much more readable.

# ❌ Bad - Unhelpful comments
"This is wrong"
"Why did you do this?"
"Rewrite this"
```

### Responding to Feedback

```markdown
# ✅ Good responses:
"Good point! Changed to use useCallback here."

"You're right about the memory leak. Added cleanup in commit abc123."

"I chose Map because we need guaranteed insertion order. Added a comment explaining this."

"I considered that approach, but it would break backward compatibility. What do you think about...?"

# ✅ Good - Use conversations
# Don't just resolve - explain your changes or reasoning
```

## Git Workflow

### Starting Work

```bash
# 1. Update main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feat/my-feature

# 3. Make changes
# ... code ...

# 4. Commit frequently
git add src/components/feature.tsx
git commit -m "feat: add basic feature structure"

# 5. Continue development
```

### Before Pushing

```bash
# 1. Run checks
npm run lint
npm test
npm run build

# 2. Update branch if needed
git fetch origin
git rebase origin/main  # or merge

# 3. Push
git push origin feat/my-feature

# 4. Create PR
```

### After PR Feedback

```bash
# 1. Make requested changes
# ... code ...

# 2. Commit changes
git add .
git commit -m "fix: address PR feedback - handle edge case"

# 3. Push
git push origin feat/my-feature

# 4. Respond to comments
```

## Rebasing vs Merging

### When to Rebase

```bash
# ✅ Good - Rebase feature branch on main
git checkout feat/my-feature
git rebase main

# Benefits:
# - Linear history
# - Cleaner log
# - Easier to bisect

# ⚠️ Never rebase public/shared branches!
```

### When to Merge

```bash
# ✅ Good - Merge main into feature (if rebase is risky)
git checkout feat/my-feature
git merge main

# ✅ Good - Merge PR into main (via GitHub)
# Preserves context with merge commit
```

## Handling Conflicts

```bash
# During rebase
git rebase main
# Conflict appears

# 1. Open conflicted files
# 2. Resolve conflicts (remove markers)
# 3. Stage resolved files
git add resolved-file.tsx

# 4. Continue rebase
git rebase --continue

# Or abort if needed
git rebase --abort
```

## Useful Git Commands

### Status and History

```bash
# View status
git status

# View log
git log --oneline --graph --all

# View changes
git diff
git diff main...feat/my-feature

# View file history
git log -p filename.tsx
```

### Undoing Changes

```bash
# Unstage file
git reset HEAD file.tsx

# Discard local changes
git checkout -- file.tsx

# Amend last commit
git commit --amend -m "new message"

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

### Stashing

```bash
# Save work in progress
git stash

# List stashes
git stash list

# Apply stash
git stash apply

# Apply and remove stash
git stash pop

# Stash with message
git stash save "WIP: implementing feature"
```

### Cherry-picking

```bash
# Apply specific commit to current branch
git cherry-pick abc123

# Cherry-pick multiple commits
git cherry-pick abc123 def456
```

## Git Hooks

ChartDB uses Husky for Git hooks:

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
npm run lint
```

### Pre-push Hook

```bash
# .husky/pre-push
#!/bin/sh
npm test
```

## Tags and Releases

### Creating Tags

```bash
# Annotated tag (recommended)
git tag -a v1.18.0 -m "Release version 1.18.0"

# Push tag
git push origin v1.18.0

# Push all tags
git push origin --tags
```

### Semantic Versioning

```
v<MAJOR>.<MINOR>.<PATCH>

MAJOR: Breaking changes
MINOR: New features (backward compatible)
PATCH: Bug fixes
```

## .gitignore

```bash
# Node
node_modules/
npm-debug.log

# Build
dist/
build/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.vitest/

# Temporary
*.tmp
*.log
```

## Best Practices Summary

### Do's
- ✅ Write clear, descriptive commit messages
- ✅ Make atomic commits (one logical change)
- ✅ Keep PRs focused and reasonably sized
- ✅ Test before pushing
- ✅ Update documentation
- ✅ Respond to PR feedback
- ✅ Keep branches up to date
- ✅ Delete merged branches
- ✅ Use meaningful branch names
- ✅ Run linter before committing
- ✅ Add tests for new features
- ✅ Review your own PR first

### Don'ts
- ❌ Don't commit directly to main
- ❌ Don't push broken code
- ❌ Don't commit secrets or API keys
- ❌ Don't create massive PRs
- ❌ Don't use vague commit messages
- ❌ Don't skip code review
- ❌ Don't force push shared branches
- ❌ Don't leave WIP commits
- ❌ Don't ignore CI failures
- ❌ Don't commit commented-out code
- ❌ Don't commit console.logs
- ❌ Don't merge without approval

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Documentation](https://git-scm.com/doc)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

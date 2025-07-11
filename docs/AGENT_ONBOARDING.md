# Agent Onboarding - Incantations Voice AI Task Manager

Welcome! This is a quick orientation guide for new AI agents joining this project.

## 📋 Essential Reading (in order)

1. **`docs/DEVELOPMENT_RULES.md`** - **READ THIS FIRST** - Complete development standards, workflow, and quality requirements
2. **`README_LOCAL_DEV.md`** - Local development setup and testing procedures  
3. **`SIMPLE_TODO.md`** - Current task backlog and project status
4. **`docs/SMOKE_HISTORY.md`** - Recent deployment test results and system health

## 🔧 Key Technical Details

- **Ports**: Backend (3001), Frontend (5174) - always broadcast on local network for TailScale access
- **TTS Provider**: Deepgram with chunking for texts >250 chars
- **Development Environment**: MacOS local only (NO development on deployment environment)
- **Deployment**: Automated via `auto-deploy.sh` with health checks and rollback
- **Testing**: `scripts/smoke_test.sh` for comprehensive validation

## 🚨 Critical Rules to Follow

- **NEVER DISABLE FEATURES** to fix bugs - identify root cause and fix properly
- **NO PLAIN-TEXT SECRETS** in terminal commands - use environment variables
- **FOLLOW THE PLAN** step-by-step - add new tasks to `TODO.md` under "## Agent-Noted Tasks"
- **LOCAL DEV ONLY** - keep all development work on MacOS, deploy through GitHub
- **DOCUMENT YOUR WORK** - create detailed reports in `docs/reports/` using the provided template

## 🏃‍♂️ Quick Start Commands

```bash
# Start local development
npm run dev:local

# Run comprehensive tests
npm run smoke:local

# Check dependencies
npm run deps:check
```

## 📁 Project Structure

- `/voice-ai-task-manager` - React/TypeScript UI (port 5174)
- `/backend` - Node.js API (port 3001)  
- `/scripts` - Deployment and testing automation
- `/docs` - All project documentation and reports
  - `/docs/reports` - Categorized agent work reports
- `/assets` - Static resources and screenshots

## 🎯 Current Focus Areas

Check `SIMPLE_TODO.md` for active tasks, but typical work involves:
- Voice/TTS feature improvements
- UI/UX enhancements for mobile
- Deployment automation refinements
- Performance optimizations

---

**Remember**: When in doubt, refer to `docs/DEVELOPMENT_RULES.md` - it contains the complete development standards and processes for this project.

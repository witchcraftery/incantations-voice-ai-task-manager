# Development Rules and Processes

## Project Overview
The Incantations Voice AI Task Manager is a voice-based AI task management application with TTS functionality powered by Deepgram, rich markdown chat rendering, and automated deployment processes.

## Development Environment Setup

### Local Development Ports
- **Backend**: Port 3001
- **Frontend**: Port 5174
- Always broadcast on local network only (TailScale secure connection for device access)

### Core Technologies
- **TTS Provider**: Deepgram
- **Markdown Rendering**: react-markdown with remark-gfm
- **Voice API**: Web Speech API with system voices
- **Deployment**: Docker with automated health checks

## Code Quality and Architecture Rules

### 1. Bug Resolution Protocol
- **NEVER DISABLE FEATURES** to fix production issues
- Identify root cause of bugs clearly
- Communicate issues with detailed analysis
- Create comprehensive fix plans with all necessary steps
- Resolve on MacOS local filesystem first
- Deploy through GitHub to DigitalOcean Droplet
- **DO NOT COMMIT** commented-out features without user approval

### 2. Development Environment Rules
- Keep all documentation and guides on local MacOS folder structure
- **DO NOT** develop updates or features on deployment environment
- Use local environment for all development work
- Only use deployment environment for production deployment

### 3. Task Completion Standards
- Follow plans step-by-step
- Complete requested tasks fully before moving to other work
- If additional tasks become apparent, add them to `TODO.md` under "## Agent-Noted Tasks"
- Ask for confirmation before executing follow-up actions not explicitly requested

## TTS and Voice Features

### Text-to-Speech Implementation
- Use Deepgram for primary TTS functionality
- Implement chunking for texts >250 characters to avoid HTTP 413 errors
- Split markdown text into sentences for sequential streaming
- Sanitize markdown before TTS using custom PlainTextRenderer
- Support system voices via Web Speech API as fallback
- Handle voice loading with `voiceschanged` event for Chrome compatibility

### Audio Management
- Implement audio queue system for sequential playback
- Provide mute functionality to stop playback and clear queues
- Use `pointer-events:auto` on mobile-critical buttons
- Include accessible tooltips and proper iconography

### Error Handling
- Display toast notifications instead of console-only errors
- Implement graceful fallbacks for TTS failures
- Provide clear user feedback for all error states

## UI/UX Standards

### Chat Interface
- Render AI messages with full markdown support using MarkdownRenderer
- Preserve plain text rendering for user messages
- Include floating chat bubble with keyboard shortcut (Ctrl+Shift+C)
- Ensure sidebar expansion behavior works correctly

### Mobile Compatibility
- Use `<button>` elements with `pointer-events:auto` for tap registration
- Implement responsive design for voice controls
- Test touch interactions on all interactive elements

## Deployment and Testing

### Automated Deployment Process
- Use `auto-deploy.sh` (version 2) for production deployments
- Pull only frontend/backend containers during updates
- Preserve critical files: `/etc/nginx`, `/etc/letsencrypt`, `.env.docker`
- Implement health checks on `/api/health`, `/api/tts/health`, and `/` endpoints
- Include rollback mechanism on deployment failure

### Smoke Testing Requirements
- Run comprehensive smoke tests via `scripts/smoke_test.sh`
- Test critical endpoints with curl
- Perform Lighthouse CLI performance tests (minimum score ≥ 80)
- Log results to `docs/SMOKE_HISTORY.md`
- Auto-append issues to `SIMPLE_TODO.md` under "Agent-Noted Tasks"
- Generate tester invitation markdown for manual testing coordination

### Local Development Workflow
```bash
# Start development environment
npm run dev:local

# Run smoke tests locally
npm run smoke:local

# Full validation (simulated deployment)
npm run validate:local

# Combined development with automated testing
npm run dev:test

# Check tool dependencies
npm run deps:check
```

### Environment-Specific Testing
```bash
# Staging environment
npm run smoke:staging

# Production environment
npm run validate:prod
```

## Security and Configuration

### SSH Configuration
- Use specific SSH configuration for GitHub with identity file at `~/.ssh/github_key`
- **ONLY** use this configuration when on DigitalOcean deployment droplet

### Secret Management
- **NEVER** reveal or consume secrets in plain-text in terminal commands
- Compute secrets in prior steps and store as environment variables
- Use semantic placeholders like `{{SECRET_NAME}}` in documentation
- Example: `API_KEY=$(secret_manager --secret-name=name)` then `api --key=$API_KEY`

## File Organization

### Documentation Structure
- Keep development rules in `docs/DEVELOPMENT_RULES.md`
- Maintain smoke test history in `docs/SMOKE_HISTORY.md`
- Track tasks in `TODO.md` with "## Agent-Noted Tasks" section
- Store deployment scripts in root and `scripts/` directory
- Document all agent work in `docs/reports/` with structured reports

### Code Structure
- Voice services in `voiceService.ts`
- UI controls in `VoiceControls.tsx`
- Chat interface in `ChatInterface.tsx`
- Settings management in `SettingsDialog.tsx`
- Markdown rendering in `MarkdownRenderer.tsx`

## Quality Assurance

### Pre-Deployment Checklist
- [ ] All TypeScript compilation errors resolved
- [ ] JSX configuration validated
- [ ] Smoke tests passing locally
- [ ] Performance benchmarks met (Lighthouse ≥ 80)
- [ ] TTS functionality tested with chunking
- [ ] Mobile compatibility verified
- [ ] Error handling tested with toast notifications

### Post-Deployment Verification
- [ ] Health endpoints responding correctly
- [ ] TTS services operational
- [ ] Frontend loading and responsive
- [ ] SSL certificates valid
- [ ] Performance metrics within acceptable range
- [ ] Rollback procedures tested and documented

## Collaboration Guidelines

### Issue Tracking
- Auto-capture deployment issues in `SIMPLE_TODO.md`
- Use structured format for agent-noted tasks
- Include reproduction steps and environment details
- Tag issues with severity and component affected

### Team Communication
- Generate tester invitation markdown for manual testing
- Document all significant changes in commit messages
- Maintain clear separation between automated and manual testing phases
- Provide detailed handoff notes for production issues

### Work Reporting Requirements
- Create detailed reports for all significant work in `docs/reports/`
- Use the provided template (`docs/reports/REPORT_TEMPLATE.md`) for consistency
- Categorize reports: features, fixes, improvements, refactoring, infrastructure
- Include complete file change lists, testing details, and impact analysis
- Submit reports before task completion or agent handoff
- Link reports to related TODO items and documentation updates

---

**Last Updated**: 2025-07-05  
**Version**: 1.0  
**Applies To**: Incantations Voice AI Task Manager Development Team

# 🔥 Incantations Scripts Directory

This directory contains automation scripts for testing and deployment validation.

## Scripts Overview

### 🧪 `smoke_test.sh`
Comprehensive smoke test suite that validates critical application functionality.

**Features:**
- Tests critical API endpoints
- Runs Lighthouse CLI for performance validation (≥80 score required)
- Validates SSL/TLS configuration
- Checks CORS headers and authentication
- Measures API response times
- Logs results to `docs/SMOKE_HISTORY.md`
- Auto-updates `SIMPLE_TODO.md` with any issues found

**Usage:**
```bash
# Test production (default)
./scripts/smoke_test.sh

# Test specific environment
./scripts/smoke_test.sh production
./scripts/smoke_test.sh staging  
./scripts/smoke_test.sh local
```

**Dependencies:**
- `curl` (HTTP testing)
- `jq` (JSON parsing) - auto-installed if missing
- `lighthouse` CLI (performance testing) - auto-installed if missing
- `openssl` (SSL validation)
- `bc` (response time calculations)

### 🚀 `post_deploy.sh`
Post-deployment automation script for CI/CD pipelines.

**Features:**
- Waits for deployment to stabilize (60s)
- Runs smoke tests with retry logic (3 attempts)
- Sends Slack notifications (optional)
- Generates deployment reports
- Returns proper exit codes for CI/CD

**Usage:**
```bash
# Basic post-deployment validation
./scripts/post_deploy.sh production

# With Slack notifications
SLACK_WEBHOOK_URL=your_webhook_url ./scripts/post_deploy.sh production

# Show help
./scripts/post_deploy.sh --help
```

## Integration Examples

### GitHub Actions
```yaml
- name: Post-Deployment Validation
  run: |
    ./scripts/post_deploy.sh production
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Docker Deployment
```bash
# After docker-compose up
./scripts/post_deploy.sh production
```

### Manual Deployment Workflow
```bash
# 1. Deploy application
git pull origin main
docker-compose build --no-cache
docker-compose up -d

# 2. Run post-deployment validation
./scripts/post_deploy.sh production

# 3. Check results
cat docs/SMOKE_HISTORY.md
cat deployment_report.md
```

## Test Coverage

### Critical Endpoints Tested
- `GET /health` - Backend health check
- `GET /auth/me` - Authentication validation
- `POST /auth/google` - OAuth endpoint
- Frontend root (`/`) - React app loading

### Performance Requirements
- **Lighthouse Score:** ≥80/100
- **API Response Time:** <2000ms
- **SSL Certificate:** Valid and current
- **CORS Headers:** Present and correct

### Security Validation
- HTTPS redirect (production)
- SSL/TLS certificate validation
- Security headers check
- Authentication endpoint protection

## Output Files

### `docs/SMOKE_HISTORY.md`
Complete history of all smoke test runs with:
- Timestamp and environment
- Pass/fail results for each test
- Lighthouse performance scores
- Issue descriptions and fixes

### `SIMPLE_TODO.md` (Agent-Noted Tasks)
Automatically updated with any issues found during testing:
```markdown
## Agent-Noted Tasks

### 🔥 Smoke Test Issues - 2025-01-07 14:30:00

- [ ] **Smoke Test:** Lighthouse Performance: Performance score: 75/100 (below required 80)
- [ ] **Smoke Test:** API Response Time: Health endpoint took 2500ms (>2000ms)
```

### `deployment_report.md`
Generated after post-deployment runs with:
- Deployment status and timestamp
- Verification checklist
- Troubleshooting steps (if issues found)
- Next action items

### `tester_invitation.md`
Ready-to-send invitation for manual testers:
- Testing instructions
- Current known issues
- Bug reporting guidelines

## Environment Configuration

### Production
- **URL:** `https://incantations.witchcraftery.io`
- **API:** `https://incantations.witchcraftery.io/api`
- **Tests:** Full suite including SSL validation

### Staging
- **URL:** `https://staging.incantations.witchcraftery.io`
- **API:** `https://staging.incantations.witchcraftery.io/api`
- **Tests:** Full suite except SSL (if staging uses HTTP)

### Local Development
- **URL:** `http://localhost:5174`
- **API:** `http://localhost:3001`
- **Tests:** Basic functionality only (no SSL)

## Troubleshooting

### Common Issues

**Lighthouse fails to run:**
```bash
# Install globally
npm install -g lighthouse

# Or use npx
npx lighthouse --version
```

**jq not found:**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

**API timeouts:**
- Check if services are running: `docker-compose ps`
- Review logs: `docker-compose logs backend`
- Verify network connectivity

**SSL certificate errors:**
- Check certificate expiry
- Verify DNS resolution
- Test with browser first

### Debugging Mode
Add debug output to any script:
```bash
# Enable verbose curl output
export CURL_OPTIONS="-v"

# Show all commands being executed
bash -x ./scripts/smoke_test.sh production
```

## Best Practices

### CI/CD Integration
1. Run smoke tests after every deployment
2. Set up Slack notifications for team awareness
3. Use exit codes to fail CI/CD on critical issues
4. Archive deployment reports for audit trail

### Manual Testing
1. Run smoke tests before and after major changes
2. Test all environments (local, staging, production)
3. Review SMOKE_HISTORY.md for patterns
4. Update TODO items when issues are fixed

### Performance Monitoring
1. Track Lighthouse scores over time
2. Monitor API response time trends
3. Set up alerts for score degradation
4. Optimize based on failing metrics

---

**🎯 All scripts follow the project's rule to keep development on local MacOS and deploy through GitHub to DigitalOcean.**

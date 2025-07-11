#!/bin/bash

# 🚀 Post-Deployment Automation Script
# Runs smoke tests automatically after deployment
# Can be called from CI/CD pipelines or manual deployments

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SMOKE_TEST_SCRIPT="$SCRIPT_DIR/smoke_test.sh"
ENVIRONMENT=${1:-production}
WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
RETRIES=3
RETRY_DELAY=30

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Post-Deployment Automation Started${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}Timestamp: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Wait for deployment to stabilize
wait_for_deployment() {
    echo -e "${YELLOW}⏳ Waiting for deployment to stabilize...${NC}"
    sleep 60  # Give the deployment 1 minute to fully start
}

# Send notification to Slack (if webhook configured)
send_slack_notification() {
    local status="$1"
    local message="$2"
    local color="$3"
    
    if [ -z "$WEBHOOK_URL" ]; then
        return 0
    fi
    
    local emoji=""
    case $status in
        "success") emoji="✅" ;;
        "failure") emoji="❌" ;;
        "warning") emoji="⚠️" ;;
        *) emoji="ℹ️" ;;
    esac
    
    local payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "$emoji Incantations Deployment - $ENVIRONMENT",
            "text": "$message",
            "footer": "Incantations CI/CD",
            "ts": $(date +%s)
        }
    ]
}
EOF
)
    
    curl -X POST -H 'Content-type: application/json' \
         --data "$payload" \
         "$WEBHOOK_URL" 2>/dev/null || true
}

# Run smoke tests with retries
run_smoke_tests() {
    local attempt=1
    
    while [ $attempt -le $RETRIES ]; do
        echo -e "${YELLOW}🔥 Running smoke tests (attempt $attempt/$RETRIES)...${NC}"
        
        if "$SMOKE_TEST_SCRIPT" "$ENVIRONMENT"; then
            echo -e "${GREEN}✅ Smoke tests passed!${NC}"
            return 0
        else
            echo -e "${RED}❌ Smoke tests failed (attempt $attempt/$RETRIES)${NC}"
            
            if [ $attempt -lt $RETRIES ]; then
                echo -e "${YELLOW}⏳ Waiting $RETRY_DELAY seconds before retry...${NC}"
                sleep $RETRY_DELAY
            fi
            
            attempt=$((attempt + 1))
        fi
    done
    
    echo -e "${RED}❌ All smoke test attempts failed${NC}"
    return 1
}

# Generate deployment report
generate_deployment_report() {
    local status="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat > "deployment_report.md" << EOF
# 🚀 Deployment Report

**Environment:** $ENVIRONMENT  
**Timestamp:** $timestamp  
**Status:** $status  

## Deployment Steps Completed:
- ✅ Application deployed
- ✅ Services started
- ✅ Smoke tests executed

## Next Steps:
EOF

    if [ "$status" = "SUCCESS" ]; then
        cat >> "deployment_report.md" << EOF
- ✅ Deployment complete and healthy
- 📧 Stakeholders notified
- 📊 Check monitoring dashboards

## Verification:
- Frontend: Available at production URL
- Backend API: All endpoints responding
- Performance: Lighthouse score ≥80
- Security: SSL/TLS configured
EOF
    else
        cat >> "deployment_report.md" << EOF
- ❌ Review failed tests in docs/SMOKE_HISTORY.md
- 🔍 Check application logs for errors
- 🚨 Consider rollback if critical issues found

## Troubleshooting:
1. Check container status: \`docker-compose ps\`
2. Review logs: \`docker-compose logs\`
3. Test endpoints manually
4. Verify database connectivity
EOF
    fi
    
    echo -e "${GREEN}📄 Deployment report generated: deployment_report.md${NC}"
}

# Main execution
main() {
    cd "$PROJECT_ROOT"
    
    # Wait for deployment to stabilize
    wait_for_deployment
    
    # Send start notification
    send_slack_notification "info" "Starting post-deployment validation for $ENVIRONMENT" "#36a64f"
    
    # Run smoke tests
    if run_smoke_tests; then
        echo -e "${GREEN}🎉 Post-deployment validation successful!${NC}"
        generate_deployment_report "SUCCESS"
        send_slack_notification "success" "Post-deployment validation passed! All systems operational." "good"
        exit 0
    else
        echo -e "${RED}💥 Post-deployment validation failed!${NC}"
        generate_deployment_report "FAILED"
        send_slack_notification "failure" "Post-deployment validation failed! Check smoke test results for details." "danger"
        exit 1
    fi
}

# Show help
show_help() {
    cat << EOF
🚀 Post-Deployment Automation Script

Usage: $0 [ENVIRONMENT]

Environments:
  production    - Production environment (default)
  staging       - Staging environment  
  local         - Local development environment

Environment Variables:
  SLACK_WEBHOOK_URL    - Slack webhook for notifications (optional)

Examples:
  $0                   # Run for production
  $0 staging           # Run for staging
  $0 local             # Run for local

This script will:
1. Wait for deployment to stabilize
2. Run comprehensive smoke tests
3. Generate deployment report
4. Send Slack notifications (if configured)
5. Exit with proper status codes for CI/CD

EOF
}

# Handle command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac

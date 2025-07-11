#!/bin/bash

# 🚀 Complete Deployment with Validation
# Example workflow showing integration of deployment + smoke testing
# For use on DigitalOcean droplet or CI/CD pipeline

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-production}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Complete Deployment with Validation${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}Timestamp: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Show help
show_help() {
    cat << EOF
🚀 Complete Deployment with Validation

Usage: $0 [ENVIRONMENT]

This script provides a complete deployment workflow including:
1. Git pull from main branch
2. Docker build and deployment  
3. Service health verification
4. Comprehensive smoke testing
5. Notification and reporting

Environments:
  production    - Production deployment (default)
  staging       - Staging deployment
  local         - Local development

Environment Variables:
  SLACK_WEBHOOK_URL    - Optional Slack webhook for notifications

Example:
  # On DigitalOcean droplet
  cd /root/incantations-voice-ai-task-manager
  ./scripts/deploy_with_validation.sh production

  # With Slack notifications
  SLACK_WEBHOOK_URL=your_webhook_url ./scripts/deploy_with_validation.sh production

EOF
}

# Handle help
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
esac

# Deployment steps
deploy_application() {
    echo -e "${YELLOW}📦 Deploying Application...${NC}"
    
    # Step 1: Pull latest code
    echo -e "${YELLOW}🔄 Pulling latest code from main branch...${NC}"
    git pull origin main
    
    # Step 2: Build containers
    echo -e "${YELLOW}🏗️  Building Docker containers...${NC}"
    docker-compose build --no-cache
    
    # Step 3: Start services
    echo -e "${YELLOW}🚀 Starting services...${NC}"
    docker-compose up -d
    
    # Step 4: Verify containers are running
    echo -e "${YELLOW}✅ Verifying container status...${NC}"
    docker-compose ps
    
    echo -e "${GREEN}✅ Application deployment complete!${NC}"
    echo ""
}

# Wait for services to be ready
wait_for_services() {
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend service is ready!${NC}"
            break
        fi
        
        echo -e "${YELLOW}   Attempt $attempt/$max_attempts - waiting for backend...${NC}"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        echo -e "${RED}❌ Backend service failed to start within timeout${NC}"
        return 1
    fi
    
    # Additional wait for frontend
    sleep 30
    echo -e "${GREEN}✅ Services are ready for testing!${NC}"
    echo ""
}

# Main execution
main() {
    cd "$PROJECT_ROOT"
    
    # Only deploy if not local environment
    if [ "$ENVIRONMENT" != "local" ]; then
        deploy_application
        wait_for_services
    else
        echo -e "${YELLOW}⏭️  Skipping deployment for local environment${NC}"
        echo ""
    fi
    
    # Run post-deployment validation
    echo -e "${BLUE}🔥 Running post-deployment validation...${NC}"
    if "$SCRIPT_DIR/post_deploy.sh" "$ENVIRONMENT"; then
        echo -e "${GREEN}🎉 Deployment and validation completed successfully!${NC}"
        
        # Display helpful info
        cat << EOF

${GREEN}🎯 Deployment Summary:${NC}
- Environment: $ENVIRONMENT
- Status: ✅ SUCCESS
- Smoke Tests: ✅ PASSED
- Performance: ✅ Lighthouse ≥80

${BLUE}📊 Next Steps:${NC}
- Check deployment report: cat deployment_report.md
- Review test history: cat docs/SMOKE_HISTORY.md
- Monitor application logs: docker-compose logs -f

${BLUE}🌐 Access Application:${NC}
EOF

        case $ENVIRONMENT in
            "production")
                echo "- Frontend: https://incantations.witchcraftery.io"
                echo "- API Health: https://incantations.witchcraftery.io/api/health"
                ;;
            "staging")
                echo "- Frontend: https://staging.incantations.witchcraftery.io"
                echo "- API Health: https://staging.incantations.witchcraftery.io/api/health"
                ;;
            "local")
                echo "- Frontend: http://localhost:5174"
                echo "- API Health: http://localhost:3001/health"
                ;;
        esac
        
        echo ""
        exit 0
    else
        echo -e "${RED}💥 Deployment validation failed!${NC}"
        
        cat << EOF

${RED}❌ Deployment Issues Detected:${NC}
- Check smoke test results in docs/SMOKE_HISTORY.md
- Review container logs: docker-compose logs
- Consider rollback if critical issues found

${YELLOW}🔧 Troubleshooting Commands:${NC}
- docker-compose ps              # Check container status
- docker-compose logs backend    # Backend logs
- docker-compose logs frontend   # Frontend logs
- docker-compose restart         # Restart services

EOF
        exit 1
    fi
}

# Execute main function
main "$@"

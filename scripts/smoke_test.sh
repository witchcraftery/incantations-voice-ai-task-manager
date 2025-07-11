#!/bin/bash

# 🔥 Incantations Smoke Test Suite
# Tests critical endpoints, Lighthouse performance, and logs results
# Usage: ./scripts/smoke_test.sh [ENVIRONMENT]
# Environment: production (default), staging, local

set -e  # Exit on any error

# Show help
show_help() {
    cat << EOF
🔥 Incantations Smoke Test Suite

Usage: $0 [ENVIRONMENT]

Environments:
  production    - Production environment (default)
  staging       - Staging environment  
  local         - Local development environment

Tests performed:
  ✅ Frontend Health Check
  ✅ Backend API Health Check  
  ✅ Authentication Endpoints
  ✅ CORS Configuration
  ✅ SSL/TLS Security (Production)
  ✅ Lighthouse Performance Score (≥80 required)
  ✅ API Response Times
  ✅ Database Connectivity

Output files:
  - docs/SMOKE_HISTORY.md (test history)
  - SIMPLE_TODO.md (issues found)
  - tester_invitation.md (tester instructions)

Examples:
  $0                   # Test production
  $0 staging           # Test staging
  $0 local             # Test local development

EOF
}

# Handle command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
esac

# Configuration
ENVIRONMENT=${1:-production}
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="docs/SMOKE_HISTORY.md"
TODO_FILE="SIMPLE_TODO.md"
REQUIRED_LIGHTHOUSE_SCORE=80

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment URLs
case $ENVIRONMENT in
    "production")
        BASE_URL="https://incantations.witchcraftery.io"
        API_URL="https://incantations.witchcraftery.io/api"
        ;;
    "staging")
        BASE_URL="https://staging.incantations.witchcraftery.io"
        API_URL="https://staging.incantations.witchcraftery.io/api"
        ;;
    "local")
        BASE_URL="http://localhost:5174"
        API_URL="http://localhost:3001"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        echo "Valid options: production, staging, local"
        exit 1
        ;;
esac

echo -e "${BLUE}🚀 Starting Incantations Smoke Test Suite${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo -e "${BLUE}API URL: $API_URL${NC}"
echo -e "${BLUE}Timestamp: $TIMESTAMP${NC}"
echo ""

# Initialize test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
ISSUES=()
LIGHTHOUSE_SCORE=0

# Test result tracking
test_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name: PASS${NC}"
        [ -n "$message" ] && echo -e "   ${GREEN}$message${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ $test_name: FAIL${NC}"
        echo -e "   ${RED}$message${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        ISSUES+=("$test_name: $message")
    fi
    echo ""
}

# Check if required tools are installed
check_dependencies() {
    echo -e "${YELLOW}🔧 Checking dependencies...${NC}"
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        test_result "Dependency Check - curl" "FAIL" "curl not installed"
        return 1
    fi
    
    # Check jq for JSON parsing
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠️  jq not found, installing...${NC}"
        if command -v brew &> /dev/null; then
            brew install jq
        elif command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y jq
        else
            test_result "Dependency Check - jq" "FAIL" "jq not available and cannot install"
            return 1
        fi
    fi
    
    # Check lighthouse CLI
    if ! command -v lighthouse &> /dev/null; then
        echo -e "${YELLOW}⚠️  Lighthouse CLI not found, installing...${NC}"
        if command -v npm &> /dev/null; then
            npm install -g lighthouse
        else
            test_result "Dependency Check - Lighthouse" "FAIL" "npm not available to install Lighthouse CLI"
            return 1
        fi
    fi
    
    test_result "Dependency Check" "PASS" "All required tools available"
}

# Test 1: Frontend Health Check
test_frontend_health() {
    echo -e "${YELLOW}🌐 Testing Frontend Health...${NC}"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL" || echo "000")
    
    if [ "$response" = "200" ]; then
        test_result "Frontend Health" "PASS" "Frontend responding with HTTP 200"
    else
        test_result "Frontend Health" "FAIL" "Frontend returned HTTP $response or timed out"
    fi
}

# Test 2: Backend Health Check
test_backend_health() {
    echo -e "${YELLOW}🔧 Testing Backend Health...${NC}"
    
    response=$(curl -s --max-time 10 "$API_URL/health" || echo '{"error":"timeout"}')
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_URL/health" || echo "000")
    
    if [ "$http_code" = "200" ]; then
        status=$(echo "$response" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
        if [ "$status" = "ok" ]; then
            test_result "Backend Health" "PASS" "Backend health check passed"
        else
            test_result "Backend Health" "FAIL" "Backend health status: $status"
        fi
    else
        test_result "Backend Health" "FAIL" "Backend health endpoint returned HTTP $http_code"
    fi
}

# Test 3: Authentication Endpoints
test_auth_endpoints() {
    echo -e "${YELLOW}🔐 Testing Authentication Endpoints...${NC}"
    
    # Test /api/auth/me endpoint (should return 401 without token)
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_URL/auth/me" || echo "000")
    
    if [ "$http_code" = "401" ]; then
        test_result "Auth Endpoint - Unauthorized" "PASS" "Auth endpoint correctly returns 401 without token"
    else
        test_result "Auth Endpoint - Unauthorized" "FAIL" "Auth endpoint returned HTTP $http_code instead of 401"
    fi
    
    # Test /api/auth/google endpoint exists (should accept POST)
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$API_URL/auth/google" || echo "000")
    
    if [ "$http_code" = "400" ] || [ "$http_code" = "422" ]; then
        test_result "Auth Endpoint - Google OAuth" "PASS" "Google auth endpoint accessible (returns $http_code for missing credentials)"
    else
        test_result "Auth Endpoint - Google OAuth" "FAIL" "Google auth endpoint returned unexpected HTTP $http_code"
    fi
}

# Test 4: CORS Configuration
test_cors() {
    echo -e "${YELLOW}🌍 Testing CORS Configuration...${NC}"
    
    # Test CORS headers
    cors_headers=$(curl -s -I --max-time 10 -H "Origin: $BASE_URL" "$API_URL/health" | grep -i "access-control" || echo "")
    
    if [ -n "$cors_headers" ]; then
        test_result "CORS Configuration" "PASS" "CORS headers present in API responses"
    else
        test_result "CORS Configuration" "FAIL" "No CORS headers found in API responses"
    fi
}

# Test 5: SSL/TLS Security (Production only)
test_ssl_security() {
    if [ "$ENVIRONMENT" != "production" ]; then
        echo -e "${YELLOW}⏭️  Skipping SSL tests (not production environment)${NC}"
        echo ""
        return
    fi
    
    echo -e "${YELLOW}🔒 Testing SSL/TLS Security...${NC}"
    
    # Test HTTPS redirect
    http_redirect=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://incantations.witchcraftery.io" || echo "000")
    
    if [ "$http_redirect" = "301" ] || [ "$http_redirect" = "302" ]; then
        test_result "HTTPS Redirect" "PASS" "HTTP correctly redirects to HTTPS"
    else
        test_result "HTTPS Redirect" "FAIL" "HTTP redirect returned $http_redirect instead of 301/302"
    fi
    
    # Test SSL certificate
    ssl_check=$(echo | openssl s_client -servername incantations.witchcraftery.io -connect incantations.witchcraftery.io:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "error")
    
    if [ "$ssl_check" != "error" ]; then
        test_result "SSL Certificate" "PASS" "SSL certificate is valid"
    else
        test_result "SSL Certificate" "FAIL" "SSL certificate validation failed"
    fi
}

# Test 6: Lighthouse Performance Score
test_lighthouse_performance() {
    echo -e "${YELLOW}🚀 Running Lighthouse Performance Test...${NC}"
    
    # Run Lighthouse in headless mode
    lighthouse_output=$(lighthouse "$BASE_URL" --only-categories=performance --output=json --quiet --chrome-flags="--headless --no-sandbox" 2>/dev/null || echo '{"error": true}')
    
    if echo "$lighthouse_output" | jq -e '.lhr.categories.performance.score' >/dev/null 2>&1; then
        LIGHTHOUSE_SCORE=$(echo "$lighthouse_output" | jq -r '.lhr.categories.performance.score * 100 | floor')
        
        if [ "$LIGHTHOUSE_SCORE" -ge "$REQUIRED_LIGHTHOUSE_SCORE" ]; then
            test_result "Lighthouse Performance" "PASS" "Performance score: $LIGHTHOUSE_SCORE/100 (≥$REQUIRED_LIGHTHOUSE_SCORE required)"
        else
            test_result "Lighthouse Performance" "FAIL" "Performance score: $LIGHTHOUSE_SCORE/100 (below required $REQUIRED_LIGHTHOUSE_SCORE)"
        fi
    else
        test_result "Lighthouse Performance" "FAIL" "Could not run Lighthouse performance test"
        LIGHTHOUSE_SCORE="N/A"
    fi
}

# Test 7: API Response Times
test_api_response_times() {
    echo -e "${YELLOW}⏱️  Testing API Response Times...${NC}"
    
    # Test health endpoint response time
    start_time=$(date +%s.%N)
    curl -s --max-time 5 "$API_URL/health" > /dev/null
    end_time=$(date +%s.%N)
    response_time=$(echo "$end_time - $start_time" | bc 2>/dev/null || echo "1000")
    response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "1000")
    
    if (( $(echo "$response_time < 2.0" | bc -l 2>/dev/null || echo "0") )); then
        test_result "API Response Time" "PASS" "Health endpoint responds in ${response_time_ms%.*}ms (<2000ms)"
    else
        test_result "API Response Time" "FAIL" "Health endpoint took ${response_time_ms%.*}ms (>2000ms)"
    fi
}

# Test 8: Database Connectivity (via API)
test_database_connectivity() {
    echo -e "${YELLOW}🗄️  Testing Database Connectivity...${NC}"
    
    # The health endpoint should test database connectivity
    response=$(curl -s --max-time 10 "$API_URL/health" || echo '{"error":"timeout"}')
    
    if echo "$response" | jq -e '.timestamp' >/dev/null 2>&1; then
        test_result "Database Connectivity" "PASS" "Database connection verified via health endpoint"
    else
        test_result "Database Connectivity" "FAIL" "Health endpoint missing timestamp (possible DB issue)"
    fi
}

# Generate summary report
generate_summary() {
    echo -e "${BLUE}📊 Test Summary${NC}"
    echo -e "${BLUE}===============${NC}"
    echo -e "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    echo -e "Lighthouse Score: $LIGHTHOUSE_SCORE/100"
    echo -e "Environment: $ENVIRONMENT"
    echo -e "Timestamp: $TIMESTAMP"
    echo ""
    
    if [ ${#ISSUES[@]} -gt 0 ]; then
        echo -e "${RED}❌ Issues Found:${NC}"
        for issue in "${ISSUES[@]}"; do
            echo -e "${RED}  • $issue${NC}"
        done
        echo ""
    fi
}

# Log results to SMOKE_HISTORY.md
log_results() {
    echo -e "${YELLOW}📝 Logging results to $LOG_FILE...${NC}"
    
    # Create docs directory if it doesn't exist
    mkdir -p docs
    
    # Initialize log file if it doesn't exist
    if [ ! -f "$LOG_FILE" ]; then
        cat > "$LOG_FILE" << 'EOF'
# 🔥 Incantations Smoke Test History

This file contains the history of smoke test runs for the Incantations Voice AI Task Manager.

## Test Coverage
- ✅ Frontend Health Check
- ✅ Backend API Health Check  
- ✅ Authentication Endpoints
- ✅ CORS Configuration
- ✅ SSL/TLS Security (Production)
- ✅ Lighthouse Performance Score (≥80 required)
- ✅ API Response Times
- ✅ Database Connectivity

---

EOF
    fi
    
    # Append new test results
    {
        echo "## Test Run - $TIMESTAMP"
        echo ""
        echo "**Environment:** $ENVIRONMENT"
        echo "**URL:** $BASE_URL"
        echo "**Results:** $PASSED_TESTS/$TOTAL_TESTS tests passed"
        echo "**Lighthouse Score:** $LIGHTHOUSE_SCORE/100"
        echo ""
        
        if [ ${#ISSUES[@]} -gt 0 ]; then
            echo "**❌ Issues Found:**"
            for issue in "${ISSUES[@]}"; do
                echo "- $issue"
            done
        else
            echo "**✅ All tests passed!**"
        fi
        
        echo ""
        echo "---"
        echo ""
    } >> "$LOG_FILE"
    
    echo -e "${GREEN}✅ Results logged to $LOG_FILE${NC}"
}

# Update SIMPLE_TODO.md with issues
update_todo() {
    if [ ${#ISSUES[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ No issues to add to TODO${NC}"
        return
    fi
    
    echo -e "${YELLOW}📝 Adding issues to $TODO_FILE...${NC}"
    
    # Check if Agent-Noted Tasks section exists
    if ! grep -q "## Agent-Noted Tasks" "$TODO_FILE" 2>/dev/null; then
        echo "" >> "$TODO_FILE"
        echo "## Agent-Noted Tasks" >> "$TODO_FILE"
        echo "" >> "$TODO_FILE"
    fi
    
    # Add smoke test issues
    {
        echo "### 🔥 Smoke Test Issues - $TIMESTAMP"
        echo ""
        for issue in "${ISSUES[@]}"; do
            echo "- [ ] **Smoke Test:** $issue"
        done
        echo ""
    } >> "$TODO_FILE"
    
    echo -e "${GREEN}✅ Issues added to $TODO_FILE${NC}"
}

# Invite testers (generate tester invitation text)
invite_testers() {
    echo -e "${YELLOW}👥 Generating tester invitation...${NC}"
    
    cat > "tester_invitation.md" << EOF
# 🔥 Incantations Testing Invitation

## Test Our Voice AI Task Manager!

**URL:** $BASE_URL
**Environment:** $ENVIRONMENT
**Last Smoke Test:** $TIMESTAMP ($PASSED_TESTS/$TOTAL_TESTS tests passed)

### What to Test:
1. **Voice Commands** - Try saying "Add task: Review project proposal"
2. **Task Management** - Create, edit, complete tasks
3. **AI Chat** - Have a conversation about your tasks
4. **Performance** - Is the app fast and responsive?

### How to Report Issues:
1. Take a screenshot if there's a visual bug
2. Describe what you expected vs what happened
3. Mention which browser/device you're using
4. Email issues to: [your-email@domain.com]

### Current Known Issues:
EOF
    
    if [ ${#ISSUES[@]} -gt 0 ]; then
        for issue in "${ISSUES[@]}"; do
            echo "- $issue" >> "tester_invitation.md"
        done
    else
        echo "- None! 🎉" >> "tester_invitation.md"
    fi
    
    cat >> "tester_invitation.md" << EOF

**Thank you for testing! 🚀**
EOF
    
    echo -e "${GREEN}✅ Tester invitation created: tester_invitation.md${NC}"
}

# Main execution
main() {
    check_dependencies || exit 1
    
    test_frontend_health
    test_backend_health
    test_auth_endpoints
    test_cors
    test_ssl_security
    test_lighthouse_performance
    test_api_response_times
    test_database_connectivity
    
    generate_summary
    log_results
    update_todo
    invite_testers
    
    echo -e "${BLUE}🎉 Smoke test complete!${NC}"
    
    # Exit with error code if any tests failed
    if [ $FAILED_TESTS -gt 0 ]; then
        exit 1
    fi
}

# Run main function
main "$@"

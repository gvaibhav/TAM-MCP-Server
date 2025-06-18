#!/bin/bash
# TAM MCP Server - Enhanced Newman Automation Script
# Author: TAM MCP Development Team
# Version: 2.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COLLECTION_FILE="$PROJECT_ROOT/TAM-MCP-Server-Postman-Collection.json"
EXAMPLES_COLLECTION="$PROJECT_ROOT/examples/TAM-MCP-Server-Postman-Collection.json"
ENVIRONMENT_FILE="$PROJECT_ROOT/environments/TAM-Environment.json"
REPORT_DIR="$PROJECT_ROOT/newman-reports"
LOG_FILE="$PROJECT_ROOT/logs/newman-automation.log"

# Ensure directories exist
mkdir -p "$REPORT_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    # Check if newman is installed
    if ! command -v newman &> /dev/null; then
        error "Newman is not installed. Please install it with: npm install -g newman"
        exit 1
    fi
    
    # Check if newman-reporter-htmlextra is installed
    if ! npm list -g newman-reporter-htmlextra &> /dev/null; then
        warning "newman-reporter-htmlextra not found. Installing..."
        npm install -g newman-reporter-htmlextra
    fi
    
    # Check if collection files exist
    if [[ ! -f "$COLLECTION_FILE" ]]; then
        error "Collection file not found: $COLLECTION_FILE"
        exit 1
    fi
    
    if [[ ! -f "$EXAMPLES_COLLECTION" ]]; then
        warning "Examples collection not found: $EXAMPLES_COLLECTION"
    fi
    
    success "Prerequisites check completed"
}

# Create default environment if it doesn't exist
create_default_environment() {
    if [[ ! -f "$ENVIRONMENT_FILE" ]]; then
        log "📝 Creating default environment file..."
        
        mkdir -p "$(dirname "$ENVIRONMENT_FILE")"
        
        cat > "$ENVIRONMENT_FILE" << 'EOF'
{
  "id": "tam-mcp-environment",
  "name": "TAM MCP Server Environment",
  "values": [
    {"key": "serverUrl", "value": "http://localhost:3000", "enabled": true},
    {"key": "mcpEndpoint", "value": "{{serverUrl}}/mcp", "enabled": true},
    {"key": "sseEndpoint", "value": "{{serverUrl}}/sse", "enabled": true},
    {"key": "healthEndpoint", "value": "{{serverUrl}}/health", "enabled": true},
    {"key": "timeout", "value": "10000", "enabled": true},
    {"key": "retries", "value": "3", "enabled": true},
    {"key": "ALPHA_VANTAGE_API_KEY", "value": "demo", "enabled": true},
    {"key": "FRED_API_KEY", "value": "demo", "enabled": true},
    {"key": "BLS_API_KEY", "value": "demo", "enabled": true},
    {"key": "environment", "value": "development", "enabled": true}
  ]
}
EOF
        success "Default environment file created at $ENVIRONMENT_FILE"
    fi
}

# Check server health
check_server_health() {
    log "🏥 Checking server health..."
    
    local server_url="${1:-http://localhost:3000}"
    local health_endpoint="$server_url/health"
    
    if curl -s -f "$health_endpoint" > /dev/null; then
        success "Server is healthy at $server_url"
        return 0
    else
        error "Server is not responding at $server_url"
        warning "Make sure the TAM MCP Server is running with: npm start"
        return 1
    fi
}

# Run specific test suite
run_test_suite() {
    local suite_name="$1"
    local folder_name="$2"
    local collection_file="$3"
    local output_file="$4"
    
    log "🧪 Running $suite_name tests..."
    
    local newman_args=(
        run "$collection_file"
        --environment "$ENVIRONMENT_FILE"
        --reporters cli,htmlextra,json
        --reporter-htmlextra-export "$REPORT_DIR/$output_file.html"
        --reporter-json-export "$REPORT_DIR/$output_file.json"
        --timeout-request 30000
        --timeout-script 10000
    )
    
    if [[ -n "$folder_name" ]]; then
        newman_args+=(--folder "$folder_name")
    fi
    
    if newman "${newman_args[@]}" 2>&1 | tee -a "$LOG_FILE"; then
        success "$suite_name tests completed successfully"
        return 0
    else
        error "$suite_name tests failed"
        return 1
    fi
}

# Main test execution
run_all_tests() {
    local failed_tests=0
    
    log "🚀 Starting comprehensive TAM MCP Server testing..."
    
    # Health check tests
    if run_test_suite "Health Check" "Health & Status" "$COLLECTION_FILE" "health-check-report"; then
        success "✅ Health checks passed"
    else
        ((failed_tests++))
        error "❌ Health checks failed"
    fi
    
    # MCP Protocol tests
    if run_test_suite "MCP Protocol" "MCP Protocol" "$COLLECTION_FILE" "mcp-protocol-report"; then
        success "✅ MCP Protocol tests passed"
    else
        ((failed_tests++))
        error "❌ MCP Protocol tests failed"
    fi
    
    # Market Analysis Tools tests
    if run_test_suite "Market Analysis Tools" "Market Analysis Tools" "$COLLECTION_FILE" "market-tools-report"; then
        success "✅ Market Analysis Tools tests passed"
    else
        ((failed_tests++))
        error "❌ Market Analysis Tools tests failed"
    fi
    
    # Data Source tests
    if run_test_suite "Data Sources" "Data Source Tests" "$COLLECTION_FILE" "data-sources-report"; then
        success "✅ Data Source tests passed"
    else
        ((failed_tests++))
        error "❌ Data Source tests failed"
    fi
    
    # Examples collection (if exists)
    if [[ -f "$EXAMPLES_COLLECTION" ]]; then
        if run_test_suite "Examples Collection" "" "$EXAMPLES_COLLECTION" "examples-report"; then
            success "✅ Examples collection tests passed"
        else
            ((failed_tests++))
            error "❌ Examples collection tests failed"
        fi
    fi
    
    # Performance and stress tests
    if run_test_suite "Performance Tests" "Test Scenarios" "$COLLECTION_FILE" "performance-report"; then
        success "✅ Performance tests passed"
    else
        ((failed_tests++))
        error "❌ Performance tests failed"
    fi
    
    return $failed_tests
}

# Generate summary report
generate_summary_report() {
    local failed_tests="$1"
    local total_tests=6
    local passed_tests=$((total_tests - failed_tests))
    
    log "📊 Generating summary report..."
    
    cat > "$REPORT_DIR/summary-report.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TAM MCP Server - Test Summary Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-box { padding: 15px; border-radius: 5px; text-align: center; min-width: 100px; }
        .stat-success { background: #d4edda; border: 1px solid #c3e6cb; }
        .stat-error { background: #f8d7da; border: 1px solid #f5c6cb; }
        .reports { margin: 20px 0; }
        .report-link { display: block; padding: 10px; margin: 5px 0; background: #e9ecef; text-decoration: none; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TAM MCP Server - Test Summary Report</h1>
        <p>Generated on: $(date)</p>
        <p>Test Environment: Development</p>
    </div>
    
    <div class="stats">
        <div class="stat-box stat-success">
            <h3>$passed_tests</h3>
            <p>Passed</p>
        </div>
        <div class="stat-box stat-error">
            <h3>$failed_tests</h3>
            <p>Failed</p>
        </div>
        <div class="stat-box">
            <h3>$total_tests</h3>
            <p>Total</p>
        </div>
    </div>
    
    <div class="reports">
        <h2>Detailed Reports</h2>
        <a href="health-check-report.html" class="report-link">🏥 Health Check Report</a>
        <a href="mcp-protocol-report.html" class="report-link">🔌 MCP Protocol Report</a>
        <a href="market-tools-report.html" class="report-link">🛠️ Market Tools Report</a>
        <a href="data-sources-report.html" class="report-link">📊 Data Sources Report</a>
        <a href="examples-report.html" class="report-link">📝 Examples Report</a>
        <a href="performance-report.html" class="report-link">⚡ Performance Report</a>
    </div>
    
    <div class="footer">
        <p><strong>Overall Status:</strong> 
        $(if [[ $failed_tests -eq 0 ]]; then echo '<span class="success">✅ ALL TESTS PASSED</span>'; else echo "<span class=\"error\">❌ $failed_tests TEST(S) FAILED</span>"; fi)
        </p>
    </div>
</body>
</html>
EOF
    
    success "Summary report generated: $REPORT_DIR/summary-report.html"
}

# Print usage information
print_usage() {
    cat << EOF
TAM MCP Server - Enhanced Newman Automation Script

Usage: $0 [OPTIONS] [COMMAND]

Commands:
    health          Run only health check tests
    mcp             Run only MCP protocol tests  
    tools           Run only market analysis tools tests
    data            Run only data source tests
    examples        Run only examples collection tests
    performance     Run only performance tests
    all             Run all test suites (default)

Options:
    -s, --server URL    Set server URL (default: http://localhost:3000)
    -e, --env FILE      Set environment file path
    -o, --output DIR    Set output directory for reports
    -h, --help          Show this help message
    -v, --verbose       Enable verbose logging
    --no-health-check   Skip initial server health check
    --dry-run          Show what would be executed without running

Examples:
    $0                              # Run all tests with defaults
    $0 health                       # Run only health checks
    $0 --server http://staging:3000 # Run against staging server
    $0 -o ./custom-reports all      # Custom output directory
EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--server)
                SERVER_URL="$2"
                shift 2
                ;;
            -e|--env)
                ENVIRONMENT_FILE="$2"
                shift 2
                ;;
            -o|--output)
                REPORT_DIR="$2"
                shift 2
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            -v|--verbose)
                set -x
                shift
                ;;
            --no-health-check)
                SKIP_HEALTH_CHECK=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            health|mcp|tools|data|examples|performance|all)
                COMMAND="$1"
                shift
                ;;
            *)
                error "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done
}

# Main execution
main() {
    local SERVER_URL="http://localhost:3000"
    local COMMAND="all"
    local SKIP_HEALTH_CHECK=false
    local DRY_RUN=false
    
    # Parse arguments
    parse_arguments "$@"
    
    # Show configuration if dry run
    if [[ "$DRY_RUN" == "true" ]]; then
        log "🔍 Dry run mode - showing configuration:"
        log "  Server URL: $SERVER_URL"
        log "  Collection: $COLLECTION_FILE"
        log "  Environment: $ENVIRONMENT_FILE"
        log "  Output Directory: $REPORT_DIR"
        log "  Command: $COMMAND"
        exit 0
    fi
    
    log "🎯 TAM MCP Server - Enhanced Newman Automation"
    log "📝 Log file: $LOG_FILE"
    log "📊 Reports directory: $REPORT_DIR"
    
    # Check prerequisites
    check_prerequisites
    
    # Create default environment
    create_default_environment
    
    # Check server health (unless skipped)
    if [[ "$SKIP_HEALTH_CHECK" != "true" ]]; then
        if ! check_server_health "$SERVER_URL"; then
            error "Server health check failed. Use --no-health-check to skip this check."
            exit 1
        fi
    fi
    
    # Execute requested command
    local failed_tests=0
    
    case "$COMMAND" in
        health)
            run_test_suite "Health Check" "Health & Status" "$COLLECTION_FILE" "health-check-report"
            failed_tests=$?
            ;;
        mcp)
            run_test_suite "MCP Protocol" "MCP Protocol" "$COLLECTION_FILE" "mcp-protocol-report"
            failed_tests=$?
            ;;
        tools)
            run_test_suite "Market Analysis Tools" "Market Analysis Tools" "$COLLECTION_FILE" "market-tools-report"
            failed_tests=$?
            ;;
        data)
            run_test_suite "Data Sources" "Data Source Tests" "$COLLECTION_FILE" "data-sources-report"
            failed_tests=$?
            ;;
        examples)
            if [[ -f "$EXAMPLES_COLLECTION" ]]; then
                run_test_suite "Examples Collection" "" "$EXAMPLES_COLLECTION" "examples-report"
                failed_tests=$?
            else
                error "Examples collection not found"
                exit 1
            fi
            ;;
        performance)
            run_test_suite "Performance Tests" "Test Scenarios" "$COLLECTION_FILE" "performance-report"
            failed_tests=$?
            ;;
        all)
            run_all_tests
            failed_tests=$?
            ;;
        *)
            error "Unknown command: $COMMAND"
            print_usage
            exit 1
            ;;
    esac
    
    # Generate summary report for 'all' command
    if [[ "$COMMAND" == "all" ]]; then
        generate_summary_report $failed_tests
    fi
    
    # Final status
    if [[ $failed_tests -eq 0 ]]; then
        success "🎉 All tests completed successfully!"
        success "📊 Reports available in: $REPORT_DIR"
    else
        error "❌ $failed_tests test suite(s) failed"
        error "📊 Check reports in: $REPORT_DIR"
        exit 1
    fi
}

# Execute main function with all arguments
main "$@"

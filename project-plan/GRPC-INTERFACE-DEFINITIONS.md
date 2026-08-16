# gRPC Interface Definitions

## Overview

This document defines the gRPC interfaces for communication between the TypeScript MCP server and Python agent system in the TAM-MCP-Server architecture. These definitions enable type-safe, high-performance inter-language communication with proper error handling and streaming support.

## Protocol Buffer Definitions

### Core Types

```protobuf
// core_types.proto
syntax = "proto3";

package tam_mcp_server;

import "google/protobuf/timestamp.proto";
import "google/protobuf/struct.proto";
import "google/protobuf/any.proto";

// Base message types
message AgentTask {
    string task_id = 1;
    string agent_id = 2;
    string task_type = 3;
    string description = 4;
    google.protobuf.Struct task_data = 5;
    google.protobuf.Struct execution_context = 6;
    Priority priority = 7;
    google.protobuf.Timestamp deadline = 8;
    repeated string dependencies = 9;
    repeated string required_mcp_services = 10;
}

message AgentResult {
    string task_id = 1;
    string agent_id = 2;
    string execution_id = 3;
    ExecutionStatus status = 4;
    google.protobuf.Struct result_data = 5;
    repeated string errors = 6;
    repeated string warnings = 7;
    float confidence_score = 8;
    float completion_percentage = 9;
    google.protobuf.Timestamp start_time = 10;
    google.protobuf.Timestamp end_time = 11;
    google.protobuf.Struct metrics = 12;
    google.protobuf.Struct metadata = 13;
}

message AgentState {
    string agent_id = 1;
    string execution_id = 2;
    AgentStatus status = 3;
    string current_step = 4;
    float progress = 5;
    google.protobuf.Struct intermediate_results = 6;
    repeated string active_mcp_sessions = 7;
    google.protobuf.Struct resource_usage = 8;
    google.protobuf.Timestamp last_update = 9;
}

// Enumerations
enum Priority {
    PRIORITY_UNSPECIFIED = 0;
    LOW = 1;
    MEDIUM = 2;
    HIGH = 3;
    URGENT = 4;
}

enum ExecutionStatus {
    EXECUTION_STATUS_UNSPECIFIED = 0;
    PENDING = 1;
    RUNNING = 2;
    COMPLETED = 3;
    FAILED = 4;
    CANCELLED = 5;
    RETRYING = 6;
}

enum AgentStatus {
    AGENT_STATUS_UNSPECIFIED = 0;
    IDLE = 1;
    BUSY = 2;
    WAITING = 3;
    ERROR = 4;
    OFFLINE = 5;
}

// MCP Integration Types
message MCPServiceRequest {
    string service_name = 1;
    string operation = 2;
    google.protobuf.Struct parameters = 3;
    string session_id = 4;
    google.protobuf.Struct context = 5;
}

message MCPServiceResponse {
    string service_name = 1;
    string operation = 2;
    string session_id = 3;
    bool success = 4;
    google.protobuf.Struct result = 5;
    repeated string errors = 6;
    google.protobuf.Struct metadata = 7;
}

// Research specific types
message ResearchRequest {
    string request_id = 1;
    string query = 2;
    ResearchScope scope = 3;
    ResearchConstraints constraints = 4;
    Priority priority = 5;
    google.protobuf.Timestamp deadline = 6;
    google.protobuf.Struct context = 7;
}

message ResearchScope {
    repeated string geographies = 1;
    repeated string industries = 2;
    repeated string time_horizons = 3;
    repeated string analysis_types = 4;
    repeated string data_sources = 5;
}

message ResearchConstraints {
    int32 max_api_calls = 1;
    float budget_limit = 2;
    repeated string preferred_sources = 3;
    repeated string excluded_sources = 4;
    google.protobuf.Timestamp max_completion_time = 5;
}

message ResearchPlan {
    string plan_id = 1;
    string request_id = 2;
    ResearchStrategy strategy = 3;
    repeated AgentAssignment agent_assignments = 4;
    repeated TaskDependency dependencies = 5;
    repeated QualityGate quality_gates = 6;
    int32 estimated_duration_minutes = 7;
    ResourceRequirement resource_requirements = 8;
    float confidence_score = 9;
}

message ResearchStrategy {
    string strategy_type = 1;
    repeated ResearchPhase phases = 2;
    google.protobuf.Struct methodology = 3;
    repeated string key_hypotheses = 4;
    repeated string validation_criteria = 5;
}

message ResearchPhase {
    string phase_id = 1;
    string name = 2;
    string description = 3;
    repeated AgentTask tasks = 4;
    repeated string dependencies = 5;
    int32 estimated_duration_minutes = 6;
    repeated string deliverables = 7;
}

message AgentAssignment {
    string assignment_id = 1;
    string agent_id = 2;
    AgentTask task = 3;
    Priority priority = 4;
    repeated string dependencies = 5;
    google.protobuf.Struct agent_config = 6;
    ResourceAllocation resources = 7;
}

message TaskDependency {
    string from_task_id = 1;
    string to_task_id = 2;
    DependencyType type = 3;
    google.protobuf.Struct conditions = 4;
}

enum DependencyType {
    DEPENDENCY_TYPE_UNSPECIFIED = 0;
    FINISH_TO_START = 1;
    START_TO_START = 2;
    FINISH_TO_FINISH = 3;
    START_TO_FINISH = 4;
    DATA_DEPENDENCY = 5;
}

message QualityGate {
    string gate_id = 1;
    string name = 2;
    repeated QualityCheck checks = 3;
    float minimum_score = 4;
    bool blocking = 5;
}

message QualityCheck {
    string check_id = 1;
    string check_type = 2;
    google.protobuf.Struct parameters = 3;
    float weight = 4;
}

message ResourceRequirement {
    ComputeRequirement compute = 1;
    StorageRequirement storage = 2;
    NetworkRequirement network = 3;
    repeated ServiceRequirement external_services = 4;
}

message ComputeRequirement {
    int32 cpu_cores = 1;
    int32 memory_mb = 2;
    int32 max_execution_time_minutes = 3;
}

message StorageRequirement {
    int64 temporary_storage_mb = 1;
    int64 persistent_storage_mb = 2;
}

message NetworkRequirement {
    int32 max_concurrent_connections = 1;
    int64 estimated_bandwidth_mbps = 2;
}

message ServiceRequirement {
    string service_name = 1;
    int32 max_api_calls = 2;
    float cost_limit = 3;
}

message ResourceAllocation {
    string allocation_id = 1;
    string agent_id = 2;
    ComputeAllocation compute = 3;
    StorageAllocation storage = 4;
    repeated ServiceAllocation services = 5;
}

message ComputeAllocation {
    int32 allocated_cpu_cores = 1;
    int32 allocated_memory_mb = 2;
    string compute_node_id = 3;
}

message StorageAllocation {
    string storage_path = 1;
    int64 allocated_space_mb = 2;
}

message ServiceAllocation {
    string service_name = 1;
    string api_key = 2;
    int32 allocated_calls = 3;
    float allocated_budget = 4;
}
```

### Agent Service Interface

```protobuf
// agent_service.proto
syntax = "proto3";

package tam_mcp_server;

import "core_types.proto";
import "google/protobuf/empty.proto";

service AgentService {
    // Agent Lifecycle Management
    rpc CreateAgent(CreateAgentRequest) returns (CreateAgentResponse);
    rpc StartAgent(StartAgentRequest) returns (StartAgentResponse);
    rpc StopAgent(StopAgentRequest) returns (StopAgentResponse);
    rpc GetAgentStatus(GetAgentStatusRequest) returns (AgentState);
    rpc ListAgents(ListAgentsRequest) returns (ListAgentsResponse);
    
    // Task Execution
    rpc ExecuteTask(ExecuteTaskRequest) returns (stream ExecuteTaskResponse);
    rpc CancelTask(CancelTaskRequest) returns (CancelTaskResponse);
    rpc GetTaskStatus(GetTaskStatusRequest) returns (AgentResult);
    rpc ListTasks(ListTasksRequest) returns (ListTasksResponse);
    
    // Agent Communication
    rpc SendMessage(SendMessageRequest) returns (SendMessageResponse);
    rpc ReceiveMessages(ReceiveMessagesRequest) returns (stream AgentMessage);
    rpc BroadcastMessage(BroadcastMessageRequest) returns (BroadcastMessageResponse);
    
    // Resource Management
    rpc AllocateResources(AllocateResourcesRequest) returns (AllocateResourcesResponse);
    rpc ReleaseResources(ReleaseResourcesRequest) returns (ReleaseResourcesResponse);
    rpc GetResourceUsage(GetResourceUsageRequest) returns (ResourceUsageResponse);
    
    // Health and Monitoring
    rpc HealthCheck(google.protobuf.Empty) returns (HealthCheckResponse);
    rpc GetMetrics(GetMetricsRequest) returns (MetricsResponse);
    rpc GetLogs(GetLogsRequest) returns (stream LogEntry);
}

message CreateAgentRequest {
    string agent_type = 1;
    string agent_id = 2;
    google.protobuf.Struct configuration = 3;
    repeated string required_mcp_services = 4;
    ResourceRequirement resource_requirements = 5;
}

message CreateAgentResponse {
    string agent_id = 1;
    bool success = 2;
    repeated string errors = 3;
    AgentState initial_state = 4;
}

message StartAgentRequest {
    string agent_id = 1;
    google.protobuf.Struct startup_context = 2;
}

message StartAgentResponse {
    bool success = 1;
    repeated string errors = 2;
    AgentState current_state = 3;
}

message StopAgentRequest {
    string agent_id = 1;
    bool force = 2;
    int32 graceful_timeout_seconds = 3;
}

message StopAgentResponse {
    bool success = 1;
    repeated string errors = 2;
    AgentState final_state = 3;
}

message GetAgentStatusRequest {
    string agent_id = 1;
}

message ListAgentsRequest {
    repeated AgentStatus status_filter = 1;
    repeated string agent_type_filter = 2;
    int32 page_size = 3;
    string page_token = 4;
}

message ListAgentsResponse {
    repeated AgentState agents = 1;
    string next_page_token = 2;
    int32 total_count = 3;
}

message ExecuteTaskRequest {
    AgentTask task = 1;
    bool stream_updates = 2;
    bool async_execution = 3;
}

message ExecuteTaskResponse {
    string execution_id = 1;
    ExecutionStatus status = 2;
    AgentResult result = 3;
    AgentState agent_state = 4;
    google.protobuf.Struct progress_update = 5;
}

message CancelTaskRequest {
    string task_id = 1;
    string execution_id = 2;
}

message CancelTaskResponse {
    bool success = 1;
    repeated string errors = 2;
}

message GetTaskStatusRequest {
    string task_id = 1;
    string execution_id = 2;
}

message ListTasksRequest {
    string agent_id = 1;
    repeated ExecutionStatus status_filter = 2;
    google.protobuf.Timestamp start_time = 3;
    google.protobuf.Timestamp end_time = 4;
    int32 page_size = 5;
    string page_token = 6;
}

message ListTasksResponse {
    repeated AgentResult tasks = 1;
    string next_page_token = 2;
    int32 total_count = 3;
}

message AgentMessage {
    string message_id = 1;
    string from_agent_id = 2;
    string to_agent_id = 3;
    MessageType type = 4;
    google.protobuf.Struct content = 5;
    google.protobuf.Timestamp timestamp = 6;
    Priority priority = 7;
    bool requires_response = 8;
    string correlation_id = 9;
}

enum MessageType {
    MESSAGE_TYPE_UNSPECIFIED = 0;
    DATA_SHARING = 1;
    COORDINATION = 2;
    STATUS_UPDATE = 3;
    ERROR_NOTIFICATION = 4;
    SYNC_REQUEST = 5;
    SYNC_RESPONSE = 6;
}

message SendMessageRequest {
    AgentMessage message = 1;
}

message SendMessageResponse {
    bool success = 1;
    repeated string errors = 2;
    string message_id = 3;
}

message ReceiveMessagesRequest {
    string agent_id = 1;
    repeated MessageType message_types = 2;
    bool include_broadcasts = 3;
}

message BroadcastMessageRequest {
    string from_agent_id = 1;
    google.protobuf.Struct content = 2;
    MessageType type = 3;
    repeated string target_agent_types = 4;
}

message BroadcastMessageResponse {
    bool success = 1;
    repeated string errors = 2;
    int32 recipients_count = 3;
}

message AllocateResourcesRequest {
    string agent_id = 1;
    ResourceRequirement requirements = 2;
    string allocation_context = 3;
}

message AllocateResourcesResponse {
    bool success = 1;
    repeated string errors = 2;
    ResourceAllocation allocation = 3;
}

message ReleaseResourcesRequest {
    string agent_id = 1;
    string allocation_id = 2;
}

message ReleaseResourcesResponse {
    bool success = 1;
    repeated string errors = 2;
}

message GetResourceUsageRequest {
    string agent_id = 1;
    google.protobuf.Timestamp start_time = 2;
    google.protobuf.Timestamp end_time = 3;
}

message ResourceUsageResponse {
    string agent_id = 1;
    google.protobuf.Struct usage_metrics = 2;
    google.protobuf.Struct cost_breakdown = 3;
    repeated ResourceUsageEntry historical_usage = 4;
}

message ResourceUsageEntry {
    google.protobuf.Timestamp timestamp = 1;
    google.protobuf.Struct metrics = 2;
}

message HealthCheckResponse {
    bool healthy = 1;
    string status_message = 2;
    google.protobuf.Struct health_details = 3;
}

message GetMetricsRequest {
    repeated string metric_names = 1;
    google.protobuf.Timestamp start_time = 2;
    google.protobuf.Timestamp end_time = 3;
    string aggregation = 4;
}

message MetricsResponse {
    repeated MetricEntry metrics = 1;
}

message MetricEntry {
    string name = 1;
    repeated MetricDataPoint data_points = 2;
    string unit = 3;
    string description = 4;
}

message MetricDataPoint {
    google.protobuf.Timestamp timestamp = 1;
    double value = 2;
    google.protobuf.Struct tags = 3;
}

message GetLogsRequest {
    string agent_id = 1;
    LogLevel min_level = 2;
    google.protobuf.Timestamp start_time = 3;
    google.protobuf.Timestamp end_time = 4;
    int32 max_entries = 5;
}

enum LogLevel {
    LOG_LEVEL_UNSPECIFIED = 0;
    DEBUG = 1;
    INFO = 2;
    WARN = 3;
    ERROR = 4;
    FATAL = 5;
}

message LogEntry {
    google.protobuf.Timestamp timestamp = 1;
    LogLevel level = 2;
    string agent_id = 3;
    string component = 4;
    string message = 5;
    google.protobuf.Struct context = 6;
    string execution_id = 7;
}
```

### Research Orchestration Service

```protobuf
// research_service.proto
syntax = "proto3";

package tam_mcp_server;

import "core_types.proto";

service ResearchService {
    // Research Lifecycle
    rpc CreateResearchRequest(CreateResearchRequestRequest) returns (CreateResearchRequestResponse);
    rpc PlanResearch(PlanResearchRequest) returns (PlanResearchResponse);
    rpc ExecuteResearch(ExecuteResearchRequest) returns (stream ExecuteResearchResponse);
    rpc GetResearchStatus(GetResearchStatusRequest) returns (ResearchStatus);
    rpc CancelResearch(CancelResearchRequest) returns (CancelResearchResponse);
    
    // Research Coordination
    rpc CoordinateAgents(CoordinateAgentsRequest) returns (stream CoordinationUpdate);
    rpc SynchronizeAgents(SynchronizeAgentsRequest) returns (SynchronizeAgentsResponse);
    rpc HandleAgentFailure(HandleAgentFailureRequest) returns (HandleAgentFailureResponse);
    
    // Quality Assurance
    rpc ValidateResearchPlan(ValidateResearchPlanRequest) returns (ValidationResult);
    rpc AssessResearchQuality(AssessResearchQualityRequest) returns (QualityAssessment);
    rpc GenerateResearchReport(GenerateResearchReportRequest) returns (ResearchReport);
    
    // Research Intelligence
    rpc GetResearchInsights(GetResearchInsightsRequest) returns (ResearchInsights);
    rpc SearchResearchHistory(SearchResearchHistoryRequest) returns (ResearchHistoryResponse);
    rpc GetResearchRecommendations(GetResearchRecommendationsRequest) returns (ResearchRecommendations);
}

message CreateResearchRequestRequest {
    ResearchRequest request = 1;
}

message CreateResearchRequestResponse {
    string request_id = 1;
    bool success = 2;
    repeated string errors = 3;
    ResearchRequest validated_request = 4;
}

message PlanResearchRequest {
    string request_id = 1;
    google.protobuf.Struct planning_context = 2;
    bool use_ai_planning = 3;
}

message PlanResearchResponse {
    string plan_id = 1;
    bool success = 2;
    repeated string errors = 3;
    ResearchPlan plan = 4;
    float confidence_score = 5;
}

message ExecuteResearchRequest {
    string plan_id = 1;
    google.protobuf.Struct execution_context = 2;
    bool stream_updates = 3;
}

message ExecuteResearchResponse {
    string execution_id = 1;
    ExecutionStatus status = 2;
    float completion_percentage = 3;
    google.protobuf.Struct progress_details = 4;
    repeated AgentUpdate agent_updates = 5;
    repeated string errors = 6;
}

message AgentUpdate {
    string agent_id = 1;
    string execution_id = 2;
    AgentStatus status = 3;
    float progress = 4;
    google.protobuf.Struct intermediate_results = 5;
}

message GetResearchStatusRequest {
    string request_id = 1;
    string execution_id = 2;
}

message ResearchStatus {
    string request_id = 1;
    string execution_id = 2;
    ExecutionStatus overall_status = 3;
    float completion_percentage = 4;
    repeated AgentStatus agent_statuses = 5;
    google.protobuf.Struct metrics = 6;
    google.protobuf.Timestamp start_time = 7;
    google.protobuf.Timestamp estimated_completion = 8;
    repeated string warnings = 9;
}

message CancelResearchRequest {
    string request_id = 1;
    string execution_id = 2;
    bool force_cancel = 3;
}

message CancelResearchResponse {
    bool success = 1;
    repeated string errors = 2;
    ResearchStatus final_status = 3;
}

message CoordinateAgentsRequest {
    string execution_id = 1;
    repeated string agent_ids = 2;
    CoordinationStrategy strategy = 3;
}

message CoordinationStrategy {
    string strategy_type = 1;
    google.protobuf.Struct parameters = 2;
    repeated SynchronizationPoint sync_points = 3;
}

message SynchronizationPoint {
    string point_id = 1;
    string name = 2;
    repeated string required_agents = 3;
    google.protobuf.Struct conditions = 4;
    int32 timeout_seconds = 5;
}

message CoordinationUpdate {
    string execution_id = 1;
    CoordinationEventType event_type = 2;
    google.protobuf.Struct event_data = 3;
    google.protobuf.Timestamp timestamp = 4;
}

enum CoordinationEventType {
    COORDINATION_EVENT_TYPE_UNSPECIFIED = 0;
    AGENT_STARTED = 1;
    AGENT_COMPLETED = 2;
    SYNC_POINT_REACHED = 3;
    DEPENDENCY_RESOLVED = 4;
    CONFLICT_DETECTED = 5;
    ESCALATION_REQUIRED = 6;
}

message SynchronizeAgentsRequest {
    string execution_id = 1;
    string sync_point_id = 2;
    repeated string agent_ids = 3;
    google.protobuf.Struct sync_data = 4;
}

message SynchronizeAgentsResponse {
    bool success = 1;
    repeated string errors = 2;
    google.protobuf.Struct shared_data = 3;
    repeated string ready_agents = 4;
}

message HandleAgentFailureRequest {
    string execution_id = 1;
    string failed_agent_id = 2;
    string failure_reason = 3;
    google.protobuf.Struct failure_context = 4;
}

message HandleAgentFailureResponse {
    bool success = 1;
    repeated string errors = 2;
    RecoveryAction recovery_action = 3;
}

message RecoveryAction {
    RecoveryType type = 1;
    google.protobuf.Struct parameters = 2;
    repeated string affected_agents = 3;
    int32 estimated_delay_minutes = 4;
}

enum RecoveryType {
    RECOVERY_TYPE_UNSPECIFIED = 0;
    RETRY_TASK = 1;
    REASSIGN_TASK = 2;
    SKIP_TASK = 3;
    ROLLBACK_EXECUTION = 4;
    ESCALATE_TO_HUMAN = 5;
}

message ValidateResearchPlanRequest {
    ResearchPlan plan = 1;
    google.protobuf.Struct validation_context = 2;
}

message ValidationResult {
    bool valid = 1;
    float confidence_score = 2;
    repeated ValidationIssue issues = 3;
    repeated string recommendations = 4;
}

message ValidationIssue {
    IssueSeverity severity = 1;
    string category = 2;
    string description = 3;
    google.protobuf.Struct details = 4;
    repeated string suggested_fixes = 5;
}

enum IssueSeverity {
    ISSUE_SEVERITY_UNSPECIFIED = 0;
    INFO = 1;
    WARNING = 2;
    ERROR = 3;
    CRITICAL = 4;
}

message AssessResearchQualityRequest {
    string execution_id = 1;
    google.protobuf.Struct research_results = 2;
    repeated QualityMetric metrics = 3;
}

message QualityMetric {
    string name = 1;
    float weight = 2;
    google.protobuf.Struct parameters = 3;
}

message QualityAssessment {
    float overall_score = 1;
    repeated QualityDimension dimensions = 2;
    repeated QualityIssue issues = 3;
    repeated string recommendations = 4;
    bool meets_standards = 5;
}

message QualityDimension {
    string name = 1;
    float score = 2;
    string description = 3;
    repeated string factors = 4;
}

message QualityIssue {
    IssueSeverity severity = 1;
    string description = 2;
    string component = 3;
    repeated string recommendations = 4;
}

message GenerateResearchReportRequest {
    string execution_id = 1;
    ReportConfiguration config = 2;
    google.protobuf.Struct template_parameters = 3;
}

message ReportConfiguration {
    string template_id = 1;
    ReportFormat format = 2;
    repeated string sections = 3;
    bool include_raw_data = 4;
    bool include_visualizations = 5;
    google.protobuf.Struct styling = 6;
}

enum ReportFormat {
    REPORT_FORMAT_UNSPECIFIED = 0;
    PDF = 1;
    HTML = 2;
    DOCX = 3;
    PPTX = 4;
    JSON = 5;
}

message ResearchReport {
    string report_id = 1;
    string execution_id = 2;
    ReportFormat format = 3;
    bytes content = 4;
    repeated ReportAsset assets = 5;
    google.protobuf.Struct metadata = 6;
    google.protobuf.Timestamp generated_at = 7;
}

message ReportAsset {
    string asset_id = 1;
    string type = 2;
    string filename = 3;
    bytes content = 4;
    google.protobuf.Struct metadata = 5;
}

message GetResearchInsightsRequest {
    string execution_id = 1;
    repeated string insight_types = 2;
    google.protobuf.Struct filters = 3;
}

message ResearchInsights {
    string execution_id = 1;
    repeated Insight insights = 2;
    google.protobuf.Struct summary = 3;
    float confidence_score = 4;
}

message Insight {
    string insight_id = 1;
    string type = 2;
    string title = 3;
    string description = 4;
    float confidence = 5;
    google.protobuf.Struct supporting_data = 6;
    repeated string tags = 7;
    InsightPriority priority = 8;
}

enum InsightPriority {
    INSIGHT_PRIORITY_UNSPECIFIED = 0;
    LOW_PRIORITY = 1;
    MEDIUM_PRIORITY = 2;
    HIGH_PRIORITY = 3;
    CRITICAL_PRIORITY = 4;
}

message SearchResearchHistoryRequest {
    string query = 1;
    google.protobuf.Struct filters = 2;
    google.protobuf.Timestamp start_date = 3;
    google.protobuf.Timestamp end_date = 4;
    int32 max_results = 5;
}

message ResearchHistoryResponse {
    repeated ResearchHistoryEntry entries = 1;
    int32 total_count = 2;
    google.protobuf.Struct aggregations = 3;
}

message ResearchHistoryEntry {
    string request_id = 1;
    string execution_id = 2;
    ResearchRequest original_request = 3;
    ResearchStatus final_status = 4;
    google.protobuf.Struct summary = 5;
    google.protobuf.Timestamp completed_at = 6;
    repeated string tags = 7;
}

message GetResearchRecommendationsRequest {
    string request_id = 1;
    google.protobuf.Struct context = 2;
    bool include_similar_research = 3;
}

message ResearchRecommendations {
    repeated Recommendation recommendations = 1;
    repeated ResearchHistoryEntry similar_research = 2;
    google.protobuf.Struct optimization_suggestions = 3;
}

message Recommendation {
    string type = 1;
    string title = 2;
    string description = 3;
    float confidence = 4;
    google.protobuf.Struct implementation_details = 5;
    repeated string benefits = 6;
}
```

### MCP Integration Service

```protobuf
// mcp_service.proto
syntax = "proto3";

package tam_mcp_server;

import "core_types.proto";

service MCPService {
    // MCP Session Management
    rpc CreateMCPSession(CreateMCPSessionRequest) returns (CreateMCPSessionResponse);
    rpc CloseMCPSession(CloseMCPSessionRequest) returns (CloseMCPSessionResponse);
    rpc GetMCPSessionStatus(GetMCPSessionStatusRequest) returns (MCPSessionStatus);
    rpc ListMCPSessions(ListMCPSessionsRequest) returns (ListMCPSessionsResponse);
    
    // MCP Operations
    rpc ExecuteMCPOperation(ExecuteMCPOperationRequest) returns (ExecuteMCPOperationResponse);
    rpc StreamMCPOperations(stream ExecuteMCPOperationRequest) returns (stream ExecuteMCPOperationResponse);
    
    // Sequential Thinking Operations
    rpc StartReasoningSession(StartReasoningSessionRequest) returns (StartReasoningSessionResponse);
    rpc AddReasoningStep(AddReasoningStepRequest) returns (AddReasoningStepResponse);
    rpc GetReasoningResult(GetReasoningResultRequest) returns (ReasoningResult);
    
    // Puppeteer Operations
    rpc LaunchBrowser(LaunchBrowserRequest) returns (LaunchBrowserResponse);
    rpc NavigateToPage(NavigateToPageRequest) returns (NavigateToPageResponse);
    rpc ExtractPageData(ExtractPageDataRequest) returns (ExtractPageDataResponse);
    rpc CloseBrowser(CloseBrowserRequest) returns (CloseBrowserResponse);
    
    // Playwright Operations
    rpc CreatePlaywrightContext(CreatePlaywrightContextRequest) returns (CreatePlaywrightContextResponse);
    rpc GenerateDocument(GenerateDocumentRequest) returns (GenerateDocumentResponse);
    rpc CaptureScreenshot(CaptureScreenshotRequest) returns (CaptureScreenshotResponse);
    rpc RunTest(RunTestRequest) returns (RunTestResponse);
    
    // Memory Operations
    rpc CreateEntity(CreateEntityRequest) returns (CreateEntityResponse);
    rpc CreateRelation(CreateRelationRequest) returns (CreateRelationResponse);
    rpc AddObservation(AddObservationRequest) returns (AddObservationResponse);
    rpc SearchNodes(SearchNodesRequest) returns (SearchNodesResponse);
    rpc GetNodeDetails(GetNodeDetailsRequest) returns (NodeDetails);
}

message CreateMCPSessionRequest {
    string service_name = 1;
    google.protobuf.Struct configuration = 2;
    string agent_id = 3;
    google.protobuf.Struct context = 4;
}

message CreateMCPSessionResponse {
    string session_id = 1;
    bool success = 2;
    repeated string errors = 3;
    google.protobuf.Struct session_info = 4;
}

message CloseMCPSessionRequest {
    string session_id = 1;
    bool force_close = 2;
}

message CloseMCPSessionResponse {
    bool success = 1;
    repeated string errors = 2;
}

message GetMCPSessionStatusRequest {
    string session_id = 1;
}

message MCPSessionStatus {
    string session_id = 1;
    string service_name = 2;
    string agent_id = 3;
    SessionState state = 4;
    google.protobuf.Timestamp created_at = 5;
    google.protobuf.Timestamp last_activity = 6;
    google.protobuf.Struct metrics = 7;
}

enum SessionState {
    SESSION_STATE_UNSPECIFIED = 0;
    INITIALIZING = 1;
    ACTIVE = 2;
    IDLE = 3;
    CLOSING = 4;
    CLOSED = 5;
    ERROR_STATE = 6;
}

message ListMCPSessionsRequest {
    string agent_id = 1;
    repeated string service_names = 2;
    repeated SessionState state_filter = 3;
}

message ListMCPSessionsResponse {
    repeated MCPSessionStatus sessions = 1;
}

message ExecuteMCPOperationRequest {
    string session_id = 1;
    string operation = 2;
    google.protobuf.Struct parameters = 3;
    bool async_execution = 4;
}

message ExecuteMCPOperationResponse {
    string operation_id = 1;
    bool success = 2;
    google.protobuf.Struct result = 3;
    repeated string errors = 4;
    google.protobuf.Struct metadata = 5;
}

// Sequential Thinking specific messages
message StartReasoningSessionRequest {
    string session_id = 1;
    google.protobuf.Struct problem = 2;
    string reasoning_style = 3;
    int32 max_steps = 4;
}

message StartReasoningSessionResponse {
    string reasoning_session_id = 1;
    bool success = 2;
    repeated string errors = 3;
}

message AddReasoningStepRequest {
    string reasoning_session_id = 1;
    string step_content = 2;
    google.protobuf.Struct context = 3;
}

message AddReasoningStepResponse {
    bool success = 1;
    repeated string errors = 2;
    google.protobuf.Struct step_result = 3;
}

message GetReasoningResultRequest {
    string reasoning_session_id = 1;
}

message ReasoningResult {
    string reasoning_session_id = 1;
    repeated ReasoningStep steps = 2;
    google.protobuf.Struct conclusions = 3;
    float confidence_score = 4;
    google.protobuf.Struct metadata = 5;
}

message ReasoningStep {
    int32 step_number = 1;
    string content = 2;
    google.protobuf.Struct insights = 3;
    google.protobuf.Timestamp timestamp = 4;
}

// Puppeteer specific messages
message LaunchBrowserRequest {
    string session_id = 1;
    google.protobuf.Struct browser_config = 2;
}

message LaunchBrowserResponse {
    string browser_id = 1;
    bool success = 2;
    repeated string errors = 3;
}

message NavigateToPageRequest {
    string browser_id = 1;
    string url = 2;
    google.protobuf.Struct navigation_options = 3;
}

message NavigateToPageResponse {
    string page_id = 1;
    bool success = 2;
    repeated string errors = 3;
    google.protobuf.Struct page_info = 4;
}

message ExtractPageDataRequest {
    string page_id = 1;
    google.protobuf.Struct extraction_rules = 2;
}

message ExtractPageDataResponse {
    google.protobuf.Struct extracted_data = 1;
    bool success = 2;
    repeated string errors = 3;
}

message CloseBrowserRequest {
    string browser_id = 1;
}

message CloseBrowserResponse {
    bool success = 1;
    repeated string errors = 2;
}

// Playwright specific messages
message CreatePlaywrightContextRequest {
    string session_id = 1;
    google.protobuf.Struct context_config = 2;
}

message CreatePlaywrightContextResponse {
    string context_id = 1;
    bool success = 2;
    repeated string errors = 3;
}

message GenerateDocumentRequest {
    string context_id = 1;
    google.protobuf.Struct document_config = 2;
    google.protobuf.Struct content_data = 3;
}

message GenerateDocumentResponse {
    bytes document_content = 1;
    string document_type = 2;
    bool success = 3;
    repeated string errors = 4;
    google.protobuf.Struct metadata = 5;
}

message CaptureScreenshotRequest {
    string context_id = 1;
    string page_url = 2;
    google.protobuf.Struct screenshot_options = 3;
}

message CaptureScreenshotResponse {
    bytes screenshot_data = 1;
    string format = 2;
    bool success = 3;
    repeated string errors = 4;
}

message RunTestRequest {
    string context_id = 1;
    google.protobuf.Struct test_specification = 2;
}

message RunTestResponse {
    google.protobuf.Struct test_results = 1;
    bool passed = 2;
    repeated string errors = 3;
    google.protobuf.Struct metrics = 4;
}

// Memory specific messages
message CreateEntityRequest {
    string session_id = 1;
    string name = 2;
    string entity_type = 3;
    repeated string observations = 4;
}

message CreateEntityResponse {
    bool success = 1;
    repeated string errors = 2;
    string entity_id = 3;
}

message CreateRelationRequest {
    string session_id = 1;
    string from_entity = 2;
    string to_entity = 3;
    string relation_type = 4;
}

message CreateRelationResponse {
    bool success = 1;
    repeated string errors = 2;
    string relation_id = 3;
}

message AddObservationRequest {
    string session_id = 1;
    string entity_name = 2;
    repeated string contents = 3;
}

message AddObservationResponse {
    bool success = 1;
    repeated string errors = 2;
}

message SearchNodesRequest {
    string session_id = 1;
    string query = 2;
    int32 max_results = 3;
}

message SearchNodesResponse {
    repeated NodeSummary nodes = 1;
    int32 total_count = 2;
}

message NodeSummary {
    string name = 1;
    string type = 2;
    repeated string observations = 3;
    google.protobuf.Struct metadata = 4;
}

message GetNodeDetailsRequest {
    string session_id = 1;
    string node_name = 2;
}

message NodeDetails {
    string name = 1;
    string type = 2;
    repeated string observations = 3;
    repeated Relation relations = 4;
    google.protobuf.Struct metadata = 5;
}

message Relation {
    string type = 1;
    string target_node = 2;
    string direction = 3;
}
```

## TypeScript Client Implementation

```typescript
// grpc-client.ts
import * as grpc from '@grpc/grpc-js';
import { AgentServiceClient } from './generated/agent_service';
import { ResearchServiceClient } from './generated/research_service';
import { MCPServiceClient } from './generated/mcp_service';
import { 
    AgentTask, 
    AgentResult, 
    ResearchRequest, 
    ExecuteTaskRequest 
} from './generated/core_types';

export class TAMGrpcClient {
    private agentClient: AgentServiceClient;
    private researchClient: ResearchServiceClient;
    private mcpClient: MCPServiceClient;

    constructor(serverAddress: string, credentials?: grpc.ChannelCredentials) {
        const creds = credentials || grpc.credentials.createInsecure();
        
        this.agentClient = new AgentServiceClient(serverAddress, creds);
        this.researchClient = new ResearchServiceClient(serverAddress, creds);
        this.mcpClient = new MCPServiceClient(serverAddress, creds);
    }

    async executeAgentTask(task: AgentTask): Promise<AgentResult> {
        return new Promise((resolve, reject) => {
            const request: ExecuteTaskRequest = {
                task,
                stream_updates: false,
                async_execution: false
            };

            this.agentClient.executeTask(request, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response.result);
                }
            });
        });
    }

    async executeResearch(researchRequest: ResearchRequest): Promise<AsyncIterable<any>> {
        const planResponse = await this.planResearch(researchRequest);
        
        return new Promise((resolve, reject) => {
            const request = {
                plan_id: planResponse.plan_id,
                execution_context: {},
                stream_updates: true
            };

            const stream = this.researchClient.executeResearch(request);
            resolve(stream);
        });
    }

    private async planResearch(request: ResearchRequest): Promise<any> {
        return new Promise((resolve, reject) => {
            const createRequest = { request };
            
            this.researchClient.createResearchRequest(createRequest, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    const planRequest = {
                        request_id: response.request_id,
                        planning_context: {},
                        use_ai_planning: true
                    };
                    
                    this.researchClient.planResearch(planRequest, (planError, planResponse) => {
                        if (planError) {
                            reject(planError);
                        } else {
                            resolve(planResponse);
                        }
                    });
                }
            });
        });
    }

    async createMCPSession(serviceName: string, agentId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const request = {
                service_name: serviceName,
                configuration: {},
                agent_id: agentId,
                context: {}
            };

            this.mcpClient.createMCPSession(request, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response.session_id);
                }
            });
        });
    }

    async executeMCPOperation(sessionId: string, operation: string, parameters: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = {
                session_id: sessionId,
                operation,
                parameters,
                async_execution: false
            };

            this.mcpClient.executeMCPOperation(request, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response.result);
                }
            });
        });
    }
}
```

## Python Server Implementation

```python
# grpc_server.py
import asyncio
import grpc
from concurrent import futures
from typing import Dict, Any, List

from .generated import agent_service_pb2_grpc, research_service_pb2_grpc, mcp_service_pb2_grpc
from .generated import agent_service_pb2, research_service_pb2, mcp_service_pb2, core_types_pb2
from .agents import AgentManager
from .research import ResearchOrchestrator
from .mcp import MCPManager

class AgentServicer(agent_service_pb2_grpc.AgentServiceServicer):
    def __init__(self, agent_manager: AgentManager):
        self.agent_manager = agent_manager

    async def ExecuteTask(self, request, context):
        """Execute agent task with streaming updates"""
        try:
            task = request.task
            agent_id = task.agent_id
            
            # Get or create agent
            agent = await self.agent_manager.get_agent(agent_id)
            if not agent:
                agent = await self.agent_manager.create_agent(
                    agent_id, 
                    task.task_type
                )
            
            # Execute task with streaming
            if request.stream_updates:
                async for update in agent.execute_task_stream(task):
                    response = agent_service_pb2.ExecuteTaskResponse(
                        execution_id=update.execution_id,
                        status=update.status,
                        agent_state=update.agent_state,
                        progress_update=update.progress_update
                    )
                    yield response
            else:
                result = await agent.execute_task(task)
                response = agent_service_pb2.ExecuteTaskResponse(
                    execution_id=result.execution_id,
                    status=core_types_pb2.COMPLETED,
                    result=result
                )
                yield response
                
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Task execution failed: {str(e)}")

    async def CreateAgent(self, request, context):
        """Create new agent instance"""
        try:
            agent = await self.agent_manager.create_agent(
                request.agent_id,
                request.agent_type,
                request.configuration,
                request.required_mcp_services
            )
            
            return agent_service_pb2.CreateAgentResponse(
                agent_id=agent.id,
                success=True,
                initial_state=agent.get_state()
            )
            
        except Exception as e:
            return agent_service_pb2.CreateAgentResponse(
                agent_id=request.agent_id,
                success=False,
                errors=[str(e)]
            )

class ResearchServicer(research_service_pb2_grpc.ResearchServiceServicer):
    def __init__(self, research_orchestrator: ResearchOrchestrator):
        self.orchestrator = research_orchestrator

    async def ExecuteResearch(self, request, context):
        """Execute research plan with coordination"""
        try:
            plan_id = request.plan_id
            execution_id = await self.orchestrator.start_execution(plan_id)
            
            # Stream research progress
            async for update in self.orchestrator.monitor_execution(execution_id):
                response = research_service_pb2.ExecuteResearchResponse(
                    execution_id=execution_id,
                    status=update.status,
                    completion_percentage=update.completion_percentage,
                    progress_details=update.details,
                    agent_updates=update.agent_updates
                )
                yield response
                
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Research execution failed: {str(e)}")

class MCPServicer(mcp_service_pb2_grpc.MCPServiceServicer):
    def __init__(self, mcp_manager: MCPManager):
        self.mcp_manager = mcp_manager

    async def CreateMCPSession(self, request, context):
        """Create MCP service session"""
        try:
            session_id = await self.mcp_manager.create_session(
                request.service_name,
                request.agent_id,
                request.configuration
            )
            
            return mcp_service_pb2.CreateMCPSessionResponse(
                session_id=session_id,
                success=True
            )
            
        except Exception as e:
            return mcp_service_pb2.CreateMCPSessionResponse(
                session_id="",
                success=False,
                errors=[str(e)]
            )

    async def ExecuteMCPOperation(self, request, context):
        """Execute MCP operation"""
        try:
            result = await self.mcp_manager.execute_operation(
                request.session_id,
                request.operation,
                request.parameters
            )
            
            return mcp_service_pb2.ExecuteMCPOperationResponse(
                operation_id=result.operation_id,
                success=True,
                result=result.data
            )
            
        except Exception as e:
            return mcp_service_pb2.ExecuteMCPOperationResponse(
                operation_id="",
                success=False,
                errors=[str(e)]
            )

async def serve():
    """Start gRPC server"""
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))
    
    # Initialize managers
    agent_manager = AgentManager()
    research_orchestrator = ResearchOrchestrator(agent_manager)
    mcp_manager = MCPManager()
    
    # Add servicers
    agent_service_pb2_grpc.add_AgentServiceServicer_to_server(
        AgentServicer(agent_manager), server
    )
    research_service_pb2_grpc.add_ResearchServiceServicer_to_server(
        ResearchServicer(research_orchestrator), server
    )
    mcp_service_pb2_grpc.add_MCPServiceServicer_to_server(
        MCPServicer(mcp_manager), server
    )
    
    listen_addr = '[::]:50051'
    server.add_insecure_port(listen_addr)
    
    print(f"Starting gRPC server on {listen_addr}")
    await server.start()
    await server.wait_for_termination()

if __name__ == '__main__':
    asyncio.run(serve())
```

These gRPC interface definitions provide a comprehensive, type-safe communication layer between the TypeScript MCP server and Python agent system, with full support for streaming operations, error handling, and MCP server integration.

# API Documentation Templates

## Overview

This document provides comprehensive API documentation templates for the TAM-MCP-Server agentic architecture, including REST API endpoints, WebSocket interfaces, gRPC services, and MCP server integrations.

## REST API Documentation

### Base Configuration

```yaml
# OpenAPI 3.0 specification
openapi: 3.0.3
info:
  title: TAM-MCP-Server Agentic Architecture API
  description: |
    Comprehensive API for the TAM-MCP-Server agentic architecture providing
    market research intelligence through coordinated AI agents.
  version: 1.0.0
  contact:
    name: TAM-MCP-Server Team
    email: support@tam-mcp-server.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.tam-mcp-server.com/v1
    description: Production server
  - url: https://staging-api.tam-mcp-server.com/v1
    description: Staging server
  - url: http://localhost:3000/v1
    description: Development server

security:
  - ApiKeyAuth: []
  - BearerAuth: []

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    # Core data models
    ResearchRequest:
      type: object
      required:
        - query
        - priority
      properties:
        query:
          type: string
          description: Natural language research query
          example: "Analyze the fintech market size and competitive landscape"
        priority:
          type: string
          enum: [low, medium, high, urgent]
          default: medium
          description: Request priority level
        deadline:
          type: string
          format: date-time
          description: Required completion time (ISO 8601)
        scope:
          $ref: '#/components/schemas/ResearchScope'
        constraints:
          $ref: '#/components/schemas/ResearchConstraints'
        context:
          type: object
          additionalProperties: true
          description: Additional context information

    ResearchScope:
      type: object
      properties:
        geographies:
          type: array
          items:
            type: string
          description: Geographic regions to analyze
          example: ["United States", "Europe", "Asia-Pacific"]
        industries:
          type: array
          items:
            type: string
          description: Industry sectors to focus on
          example: ["Financial Services", "Technology", "Healthcare"]
        time_horizons:
          type: array
          items:
            type: string
          description: Time periods for analysis
          example: ["current", "1-year", "5-year"]
        analysis_types:
          type: array
          items:
            type: string
          description: Types of analysis required
          example: ["market_sizing", "competitive_analysis", "trend_analysis"]

    ResearchConstraints:
      type: object
      properties:
        max_api_calls:
          type: integer
          description: Maximum API calls allowed
          example: 1000
        budget_limit:
          type: number
          format: float
          description: Budget limit in USD
          example: 500.00
        data_source_preferences:
          type: array
          items:
            type: string
          description: Preferred data sources
        excluded_sources:
          type: array
          items:
            type: string
          description: Sources to exclude

    ResearchPlan:
      type: object
      properties:
        plan_id:
          type: string
          description: Unique plan identifier
          example: "plan_abc123"
        execution_id:
          type: string
          description: Execution session identifier
          example: "exec_def456"
        strategy:
          $ref: '#/components/schemas/ResearchStrategy'
        agent_assignments:
          type: array
          items:
            $ref: '#/components/schemas/AgentAssignment'
        dependency_graph:
          type: array
          items:
            $ref: '#/components/schemas/TaskDependency'
        quality_gates:
          type: array
          items:
            $ref: '#/components/schemas/QualityGate'
        estimated_duration:
          type: integer
          description: Expected completion time in minutes
          example: 120
        resource_requirements:
          $ref: '#/components/schemas/ResourceRequirement'
        confidence_score:
          type: number
          format: float
          minimum: 0
          maximum: 1
          description: Plan confidence score
          example: 0.89

    ResearchStrategy:
      type: object
      properties:
        strategy_type:
          type: string
          enum: [comprehensive, focused, rapid, deep_dive]
          description: Overall strategy approach
        methodology:
          type: string
          description: Research methodology
        phases:
          type: array
          items:
            $ref: '#/components/schemas/ResearchPhase'
        key_hypotheses:
          type: array
          items:
            type: string
          description: Key hypotheses to validate

    ResearchPhase:
      type: object
      properties:
        phase_id:
          type: string
          example: "phase_001"
        name:
          type: string
          example: "Data Collection"
        description:
          type: string
        tasks:
          type: array
          items:
            $ref: '#/components/schemas/AgentTask'
        dependencies:
          type: array
          items:
            type: string
        estimated_duration:
          type: integer
          description: Phase duration in minutes

    AgentTask:
      type: object
      properties:
        task_id:
          type: string
          example: "task_xyz789"
        agent_id:
          type: string
          example: "market_analysis_agent_001"
        task_type:
          type: string
          example: "market_analysis"
        description:
          type: string
        task_data:
          type: object
          additionalProperties: true
        execution_context:
          type: object
          additionalProperties: true
        priority:
          type: string
          enum: [low, medium, high, urgent]
        deadline:
          type: string
          format: date-time
        dependencies:
          type: array
          items:
            type: string
        required_mcp_services:
          type: array
          items:
            type: string
          example: ["sequential_thinking", "puppeteer", "memory"]

    AgentResult:
      type: object
      properties:
        task_id:
          type: string
        agent_id:
          type: string
        execution_id:
          type: string
        status:
          type: string
          enum: [pending, running, completed, failed, cancelled]
        result_data:
          type: object
          additionalProperties: true
        errors:
          type: array
          items:
            type: string
        warnings:
          type: array
          items:
            type: string
        confidence_score:
          type: number
          format: float
          minimum: 0
          maximum: 1
        completion_percentage:
          type: number
          format: float
          minimum: 0
          maximum: 1
        start_time:
          type: string
          format: date-time
        end_time:
          type: string
          format: date-time
        metrics:
          type: object
          additionalProperties: true
        metadata:
          type: object
          additionalProperties: true

    ResearchReport:
      type: object
      properties:
        report_id:
          type: string
        execution_id:
          type: string
        format:
          type: string
          enum: [pdf, html, docx, json]
        title:
          type: string
        executive_summary:
          type: string
        sections:
          type: array
          items:
            $ref: '#/components/schemas/ReportSection'
        assets:
          type: array
          items:
            $ref: '#/components/schemas/ReportAsset'
        metadata:
          type: object
          additionalProperties: true
        generated_at:
          type: string
          format: date-time

    Error:
      type: object
      required:
        - error
        - message
      properties:
        error:
          type: string
          description: Error code
        message:
          type: string
          description: Human-readable error message
        details:
          type: object
          additionalProperties: true
          description: Additional error details
        timestamp:
          type: string
          format: date-time
        trace_id:
          type: string
          description: Request trace identifier

paths:
  # Research endpoints
  /research/requests:
    post:
      summary: Create research request
      description: |
        Submit a new research request to the agentic system. The system will
        analyze the request, create an execution plan, and coordinate multiple
        agents to fulfill the research requirements.
      tags:
        - Research
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ResearchRequest'
            examples:
              market_analysis:
                summary: Market analysis request
                value:
                  query: "Analyze the fintech market size and competitive landscape"
                  priority: "high"
                  scope:
                    geographies: ["United States", "Europe"]
                    industries: ["Financial Services", "Technology"]
                    analysis_types: ["market_sizing", "competitive_analysis"]
                  constraints:
                    max_api_calls: 500
                    budget_limit: 200.0
      responses:
        '201':
          description: Research request created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  request_id:
                    type: string
                    example: "req_abc123"
                  status:
                    type: string
                    example: "accepted"
                  estimated_completion:
                    type: string
                    format: date-time
                  plan_id:
                    type: string
                    example: "plan_def456"
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '429':
          description: Rate limit exceeded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

    get:
      summary: List research requests
      description: Retrieve a list of research requests with optional filtering
      tags:
        - Research
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, planning, executing, completed, failed]
          description: Filter by request status
        - name: priority
          in: query
          schema:
            type: string
            enum: [low, medium, high, urgent]
          description: Filter by priority level
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
          description: Maximum number of results
        - name: offset
          in: query
          schema:
            type: integer
            minimum: 0
            default: 0
          description: Number of results to skip
      responses:
        '200':
          description: Research requests retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  requests:
                    type: array
                    items:
                      $ref: '#/components/schemas/ResearchRequest'
                  total_count:
                    type: integer
                  has_more:
                    type: boolean

  /research/requests/{request_id}:
    get:
      summary: Get research request details
      description: Retrieve detailed information about a specific research request
      tags:
        - Research
      parameters:
        - name: request_id
          in: path
          required: true
          schema:
            type: string
          description: Research request identifier
      responses:
        '200':
          description: Research request details
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ResearchRequest'
                  - type: object
                    properties:
                      current_plan:
                        $ref: '#/components/schemas/ResearchPlan'
                      execution_status:
                        type: object
                        properties:
                          status:
                            type: string
                          progress:
                            type: number
                          active_agents:
                            type: array
                            items:
                              type: string
                          estimated_completion:
                            type: string
                            format: date-time
        '404':
          description: Research request not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

    patch:
      summary: Update research request
      description: Update research request parameters (only allowed before execution starts)
      tags:
        - Research
      parameters:
        - name: request_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                priority:
                  type: string
                  enum: [low, medium, high, urgent]
                deadline:
                  type: string
                  format: date-time
                constraints:
                  $ref: '#/components/schemas/ResearchConstraints'
      responses:
        '200':
          description: Research request updated successfully
        '400':
          description: Invalid update request
        '409':
          description: Cannot update request in current state

    delete:
      summary: Cancel research request
      description: Cancel a pending or executing research request
      tags:
        - Research
      parameters:
        - name: request_id
          in: path
          required: true
          schema:
            type: string
        - name: force
          in: query
          schema:
            type: boolean
            default: false
          description: Force cancellation even if execution is in progress
      responses:
        '200':
          description: Research request cancelled successfully
        '409':
          description: Cannot cancel request in current state

  /research/requests/{request_id}/execution:
    get:
      summary: Get execution status
      description: Get real-time execution status and progress updates
      tags:
        - Research
      parameters:
        - name: request_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Execution status
          content:
            application/json:
              schema:
                type: object
                properties:
                  execution_id:
                    type: string
                  status:
                    type: string
                  overall_progress:
                    type: number
                    format: float
                  phase_progress:
                    type: object
                    additionalProperties:
                      type: number
                  active_agents:
                    type: array
                    items:
                      type: object
                      properties:
                        agent_id:
                          type: string
                        status:
                          type: string
                        progress:
                          type: number
                        current_task:
                          type: string
                  coordination_events:
                    type: array
                    items:
                      type: object
                      properties:
                        event_type:
                          type: string
                        timestamp:
                          type: string
                          format: date-time
                        description:
                          type: string
                  quality_gates:
                    type: array
                    items:
                      type: object
                      properties:
                        gate_id:
                          type: string
                        status:
                          type: string
                        score:
                          type: number
                  resource_usage:
                    type: object
                    properties:
                      api_calls_used:
                        type: integer
                      cost_incurred:
                        type: number
                      compute_hours:
                        type: number

  /research/requests/{request_id}/results:
    get:
      summary: Get research results
      description: Retrieve completed research results and insights
      tags:
        - Research
      parameters:
        - name: request_id
          in: path
          required: true
          schema:
            type: string
        - name: format
          in: query
          schema:
            type: string
            enum: [json, summary]
            default: json
          description: Response format
      responses:
        '200':
          description: Research results
          content:
            application/json:
              schema:
                type: object
                properties:
                  execution_id:
                    type: string
                  status:
                    type: string
                  completion_time:
                    type: string
                    format: date-time
                  results:
                    type: object
                    properties:
                      executive_summary:
                        type: string
                      key_findings:
                        type: array
                        items:
                          type: string
                      market_analysis:
                        type: object
                      competitive_landscape:
                        type: object
                      recommendations:
                        type: array
                        items:
                          type: string
                      supporting_data:
                        type: object
                  quality_assessment:
                    type: object
                    properties:
                      overall_score:
                        type: number
                      dimension_scores:
                        type: object
                      validation_results:
                        type: array
                  metadata:
                    type: object
                    properties:
                      agents_involved:
                        type: array
                        items:
                          type: string
                      data_sources_used:
                        type: array
                        items:
                          type: string
                      total_api_calls:
                        type: integer
                      total_cost:
                        type: number
        '404':
          description: Results not found or not yet available
        '202':
          description: Research still in progress

  /research/requests/{request_id}/reports:
    post:
      summary: Generate research report
      description: Generate a formatted research report from completed results
      tags:
        - Research
      parameters:
        - name: request_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                format:
                  type: string
                  enum: [pdf, html, docx, pptx]
                  default: pdf
                template:
                  type: string
                  enum: [executive, detailed, technical, presentation]
                  default: detailed
                sections:
                  type: array
                  items:
                    type: string
                  description: Specific sections to include
                styling:
                  type: object
                  description: Custom styling options
      responses:
        '201':
          description: Report generation initiated
          content:
            application/json:
              schema:
                type: object
                properties:
                  report_id:
                    type: string
                  status:
                    type: string
                  estimated_completion:
                    type: string
                    format: date-time
        '400':
          description: Invalid report request

    get:
      summary: List generated reports
      description: List all reports generated for a research request
      tags:
        - Research
      parameters:
        - name: request_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: List of reports
          content:
            application/json:
              schema:
                type: object
                properties:
                  reports:
                    type: array
                    items:
                      type: object
                      properties:
                        report_id:
                          type: string
                        format:
                          type: string
                        template:
                          type: string
                        status:
                          type: string
                        generated_at:
                          type: string
                          format: date-time
                        download_url:
                          type: string
                        expires_at:
                          type: string
                          format: date-time

  /research/reports/{report_id}:
    get:
      summary: Download research report
      description: Download a generated research report
      tags:
        - Research
      parameters:
        - name: report_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Report file
          content:
            application/pdf:
              schema:
                type: string
                format: binary
            application/vnd.openxmlformats-officedocument.wordprocessingml.document:
              schema:
                type: string
                format: binary
            text/html:
              schema:
                type: string
        '404':
          description: Report not found

  # Agent management endpoints
  /agents:
    get:
      summary: List agents
      description: Retrieve list of available agents and their current status
      tags:
        - Agents
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [idle, busy, error, offline]
          description: Filter by agent status
        - name: agent_type
          in: query
          schema:
            type: string
          description: Filter by agent type
      responses:
        '200':
          description: List of agents
          content:
            application/json:
              schema:
                type: object
                properties:
                  agents:
                    type: array
                    items:
                      type: object
                      properties:
                        agent_id:
                          type: string
                        agent_type:
                          type: string
                        status:
                          type: string
                        current_task:
                          type: string
                        performance_score:
                          type: number
                        capabilities:
                          type: array
                          items:
                            type: string
                        mcp_services:
                          type: array
                          items:
                            type: string

    post:
      summary: Create agent
      description: Create a new agent instance
      tags:
        - Agents
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - agent_type
                - agent_id
              properties:
                agent_type:
                  type: string
                  example: "market_analysis_agent"
                agent_id:
                  type: string
                  example: "market_analysis_001"
                configuration:
                  type: object
                  additionalProperties: true
                required_mcp_services:
                  type: array
                  items:
                    type: string
      responses:
        '201':
          description: Agent created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  agent_id:
                    type: string
                  status:
                    type: string
                  capabilities:
                    type: array
                    items:
                      type: string

  /agents/{agent_id}:
    get:
      summary: Get agent details
      description: Retrieve detailed information about a specific agent
      tags:
        - Agents
      parameters:
        - name: agent_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Agent details
          content:
            application/json:
              schema:
                type: object
                properties:
                  agent_id:
                    type: string
                  agent_type:
                    type: string
                  status:
                    type: string
                  current_task:
                    type: string
                  performance_metrics:
                    type: object
                  configuration:
                    type: object
                  capabilities:
                    type: array
                    items:
                      type: string
                  mcp_sessions:
                    type: array
                    items:
                      type: object
                  execution_history:
                    type: array
                    items:
                      $ref: '#/components/schemas/AgentResult'

    patch:
      summary: Update agent configuration
      description: Update agent configuration and settings
      tags:
        - Agents
      parameters:
        - name: agent_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                configuration:
                  type: object
                  additionalProperties: true
      responses:
        '200':
          description: Agent updated successfully

    delete:
      summary: Delete agent
      description: Stop and remove an agent instance
      tags:
        - Agents
      parameters:
        - name: agent_id
          in: path
          required: true
          schema:
            type: string
        - name: force
          in: query
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: Agent deleted successfully

  /agents/{agent_id}/tasks:
    post:
      summary: Execute agent task
      description: Execute a specific task on an agent
      tags:
        - Agents
      parameters:
        - name: agent_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AgentTask'
      responses:
        '202':
          description: Task accepted for execution
          content:
            application/json:
              schema:
                type: object
                properties:
                  execution_id:
                    type: string
                  status:
                    type: string
                  estimated_completion:
                    type: string
                    format: date-time

    get:
      summary: List agent tasks
      description: List tasks executed by an agent
      tags:
        - Agents
      parameters:
        - name: agent_id
          in: path
          required: true
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, running, completed, failed]
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: List of agent tasks
          content:
            application/json:
              schema:
                type: object
                properties:
                  tasks:
                    type: array
                    items:
                      $ref: '#/components/schemas/AgentResult'

  # System monitoring endpoints
  /system/health:
    get:
      summary: System health check
      description: Get overall system health status
      tags:
        - System
      responses:
        '200':
          description: System health status
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum: [healthy, degraded, unhealthy]
                  components:
                    type: object
                    properties:
                      agents:
                        type: object
                        properties:
                          status:
                            type: string
                          active_count:
                            type: integer
                          error_count:
                            type: integer
                      mcp_services:
                        type: object
                        properties:
                          sequential_thinking:
                            type: string
                          puppeteer:
                            type: string
                          playwright:
                            type: string
                          memory:
                            type: string
                      databases:
                        type: object
                        properties:
                          redis:
                            type: string
                          mongodb:
                            type: string
                          postgresql:
                            type: string
                          influxdb:
                            type: string
                  uptime:
                    type: string
                  version:
                    type: string
                  timestamp:
                    type: string
                    format: date-time

  /system/metrics:
    get:
      summary: System metrics
      description: Get system performance metrics
      tags:
        - System
      parameters:
        - name: timeframe
          in: query
          schema:
            type: string
            enum: [1h, 6h, 24h, 7d]
            default: 1h
          description: Metrics timeframe
        - name: metrics
          in: query
          schema:
            type: array
            items:
              type: string
          description: Specific metrics to retrieve
      responses:
        '200':
          description: System metrics
          content:
            application/json:
              schema:
                type: object
                properties:
                  timeframe:
                    type: string
                  metrics:
                    type: object
                    properties:
                      system_performance:
                        type: object
                      agent_performance:
                        type: object
                      resource_usage:
                        type: object
                      quality_scores:
                        type: object
                  timestamp:
                    type: string
                    format: date-time

tags:
  - name: Research
    description: Research request and execution management
  - name: Agents
    description: Agent lifecycle and task management
  - name: System
    description: System monitoring and health
```

## WebSocket API Documentation

### Real-time Updates Interface

```typescript
// WebSocket event types and schemas
interface WebSocketEvents {
  // Research execution updates
  'research.execution.started': {
    execution_id: string;
    request_id: string;
    estimated_completion: string;
    agent_assignments: AgentAssignment[];
  };

  'research.execution.progress': {
    execution_id: string;
    overall_progress: number;
    phase_progress: Record<string, number>;
    active_agents: Array<{
      agent_id: string;
      status: string;
      progress: number;
      current_task: string;
    }>;
    coordination_events: CoordinationEvent[];
  };

  'research.execution.completed': {
    execution_id: string;
    completion_time: string;
    final_results: ResearchResults;
    quality_assessment: QualityAssessment;
  };

  'research.execution.failed': {
    execution_id: string;
    error: string;
    failure_reason: string;
    recovery_options: string[];
  };

  // Agent status updates
  'agent.status.changed': {
    agent_id: string;
    previous_status: string;
    new_status: string;
    timestamp: string;
  };

  'agent.task.started': {
    agent_id: string;
    execution_id: string;
    task: AgentTask;
  };

  'agent.task.progress': {
    agent_id: string;
    execution_id: string;
    progress: number;
    intermediate_results: any;
  };

  'agent.task.completed': {
    agent_id: string;
    execution_id: string;
    result: AgentResult;
  };

  // Coordination events
  'coordination.sync_point.reached': {
    execution_id: string;
    sync_point_id: string;
    waiting_agents: string[];
    ready_agents: string[];
  };

  'coordination.dependency.resolved': {
    execution_id: string;
    from_agent: string;
    to_agent: string;
    dependency_type: string;
  };

  'coordination.conflict.detected': {
    execution_id: string;
    conflict_type: string;
    involved_agents: string[];
    resolution_required: boolean;
  };

  // Quality and validation events
  'quality.gate.passed': {
    execution_id: string;
    gate_id: string;
    score: number;
    timestamp: string;
  };

  'quality.gate.failed': {
    execution_id: string;
    gate_id: string;
    score: number;
    issues: QualityIssue[];
    remediation_required: boolean;
  };

  // System events
  'system.alert': {
    alert_type: 'warning' | 'error' | 'critical';
    component: string;
    message: string;
    details: any;
    timestamp: string;
  };

  'system.resource.threshold': {
    resource_type: string;
    current_usage: number;
    threshold: number;
    timestamp: string;
  };
}

// WebSocket connection configuration
interface WebSocketConfig {
  url: string; // ws://localhost:3000/ws or wss://api.tam-mcp-server.com/ws
  auth: {
    type: 'api_key' | 'bearer_token';
    credentials: string;
  };
  subscriptions: {
    research_executions?: string[]; // execution IDs to monitor
    agents?: string[]; // agent IDs to monitor
    system_alerts?: boolean;
    quality_events?: boolean;
  };
  reconnect: {
    enabled: boolean;
    max_attempts: number;
    backoff_strategy: 'linear' | 'exponential';
  };
}

// Client usage example
const wsClient = new TAMWebSocketClient({
  url: 'wss://api.tam-mcp-server.com/ws',
  auth: {
    type: 'bearer_token',
    credentials: 'your_jwt_token'
  },
  subscriptions: {
    research_executions: ['exec_123', 'exec_456'],
    agents: ['research_director_001'],
    system_alerts: true,
    quality_events: true
  }
});

wsClient.on('research.execution.progress', (event) => {
  console.log(`Research ${event.execution_id} is ${event.overall_progress * 100}% complete`);
  updateProgressBar(event.overall_progress);
});

wsClient.on('agent.task.completed', (event) => {
  console.log(`Agent ${event.agent_id} completed task with confidence ${event.result.confidence_score}`);
  displayAgentResult(event.result);
});
```

## MCP Server Integration API

### Sequential Thinking MCP Integration

```typescript
// Sequential Thinking MCP API interface
interface SequentialThinkingMCP {
  // Session management
  startReasoningSession(request: {
    problem: {
      description: string;
      context: Record<string, any>;
      objectives: string[];
      constraints: Record<string, any>;
    };
    reasoning_style: 'analytical' | 'creative' | 'strategic' | 'problem_solving';
    max_steps?: number;
    depth?: 'shallow' | 'normal' | 'deep';
  }): Promise<{
    session_id: string;
    initial_analysis: string;
  }>;

  // Reasoning operations
  addReasoningStep(request: {
    session_id: string;
    step_content: string;
    step_type: 'analysis' | 'hypothesis' | 'evaluation' | 'synthesis';
    context?: Record<string, any>;
  }): Promise<{
    step_result: {
      insights: string[];
      confidence: number;
      next_suggestions: string[];
    };
  }>;

  // Result retrieval
  getReasoningResult(request: {
    session_id: string;
    include_full_chain?: boolean;
  }): Promise<{
    reasoning_chain: Array<{
      step_number: number;
      content: string;
      insights: string[];
      confidence: number;
      timestamp: string;
    }>;
    final_conclusions: string[];
    confidence_score: number;
    key_insights: string[];
    recommendations: string[];
  }>;

  // Specialized reasoning methods
  planStrategy(request: {
    objective: string;
    constraints: Record<string, any>;
    available_resources: Record<string, any>;
    success_criteria: string[];
  }): Promise<{
    strategy: {
      approach: string;
      phases: Array<{
        name: string;
        objectives: string[];
        actions: string[];
        dependencies: string[];
      }>;
      risk_assessment: string[];
      success_probability: number;
    };
  }>;

  analyzeComplexProblem(request: {
    problem_description: string;
    domain_context: string;
    stakeholders: string[];
    constraints: Record<string, any>;
  }): Promise<{
    problem_breakdown: {
      core_issues: string[];
      contributing_factors: string[];
      relationships: Array<{
        from: string;
        to: string;
        type: string;
        strength: number;
      }>;
    };
    solution_approaches: Array<{
      approach: string;
      pros: string[];
      cons: string[];
      feasibility: number;
      risk_level: string;
    }>;
    recommendations: string[];
  }>;
}
```

### Puppeteer MCP Integration

```typescript
// Puppeteer MCP API interface
interface PuppeteerMCP {
  // Browser management
  launchBrowser(request: {
    headless?: boolean;
    viewport?: { width: number; height: number };
    user_agent?: string;
    proxy?: string;
    timeout?: number;
    args?: string[];
  }): Promise<{
    browser_id: string;
    status: 'ready' | 'error';
    capabilities: string[];
  }>;

  // Navigation and interaction
  navigateToPage(request: {
    browser_id: string;
    url: string;
    wait_for?: 'load' | 'networkidle0' | 'networkidle2' | 'domcontentloaded';
    timeout?: number;
  }): Promise<{
    page_id: string;
    status: 'loaded' | 'timeout' | 'error';
    final_url: string;
    page_title: string;
  }>;

  // Data extraction
  extractData(request: {
    page_id: string;
    extraction_rules: {
      selectors: Record<string, string>;
      extraction_type: 'text' | 'attribute' | 'html';
      pagination?: {
        enabled: boolean;
        next_selector: string;
        max_pages: number;
      };
      wait_conditions?: Array<{
        type: 'selector' | 'timeout' | 'function';
        value: string | number;
      }>;
    };
  }): Promise<{
    extracted_data: Record<string, any>;
    pages_processed: number;
    extraction_errors: string[];
    confidence_score: number;
  }>;

  // Form interaction
  fillForm(request: {
    page_id: string;
    form_data: Record<string, string>;
    form_selector?: string;
    submit?: boolean;
    wait_for_response?: boolean;
  }): Promise<{
    success: boolean;
    response_data?: any;
    errors: string[];
  }>;

  // Screenshot and monitoring
  captureScreenshot(request: {
    page_id: string;
    element_selector?: string;
    full_page?: boolean;
    format?: 'png' | 'jpeg';
    quality?: number;
  }): Promise<{
    screenshot_data: string; // base64 encoded
    format: string;
    dimensions: { width: number; height: number };
  }>;

  // Browser cleanup
  closeBrowser(request: {
    browser_id: string;
  }): Promise<{
    success: boolean;
  }>;
}
```

### Playwright MCP Integration

```typescript
// Playwright MCP API interface
interface PlaywrightMCP {
  // Context management
  createContext(request: {
    browser: 'chromium' | 'firefox' | 'webkit';
    viewport?: { width: number; height: number };
    user_agent?: string;
    locale?: string;
    timezone?: string;
    permissions?: string[];
    geolocation?: { latitude: number; longitude: number };
  }): Promise<{
    context_id: string;
    capabilities: string[];
  }>;

  // Document generation
  generatePDF(request: {
    context_id: string;
    content: {
      html: string;
      css?: string;
      data?: Record<string, any>;
    };
    options: {
      format?: 'A4' | 'Letter' | 'Legal';
      orientation?: 'portrait' | 'landscape';
      margin?: {
        top: string;
        right: string;
        bottom: string;
        left: string;
      };
      print_background?: boolean;
      scale?: number;
    };
  }): Promise<{
    pdf_data: string; // base64 encoded
    metadata: {
      page_count: number;
      file_size: number;
      generation_time: number;
    };
  }>;

  // Report generation
  generateReport(request: {
    context_id: string;
    template: string;
    data: Record<string, any>;
    format: 'pdf' | 'html' | 'docx';
    options: {
      include_charts?: boolean;
      chart_config?: Record<string, any>;
      styling?: Record<string, any>;
    };
  }): Promise<{
    report_data: string;
    format: string;
    assets: Array<{
      type: string;
      name: string;
      data: string;
    }>;
    metadata: Record<string, any>;
  }>;

  // Testing and validation
  runValidationTest(request: {
    context_id: string;
    test_spec: {
      url: string;
      assertions: Array<{
        type: 'element_exists' | 'text_contains' | 'attribute_equals' | 'count_equals';
        selector: string;
        expected: any;
      }>;
      interactions?: Array<{
        type: 'click' | 'type' | 'select' | 'wait';
        selector: string;
        value?: string;
        timeout?: number;
      }>;
    };
  }): Promise<{
    test_results: {
      passed: boolean;
      assertion_results: Array<{
        assertion: string;
        passed: boolean;
        actual: any;
        expected: any;
      }>;
      execution_time: number;
      screenshots: string[];
    };
  }>;

  // Cleanup
  closeContext(request: {
    context_id: string;
  }): Promise<{
    success: boolean;
  }>;
}
```

### Memory MCP Integration

```typescript
// Memory MCP API interface
interface MemoryMCP {
  // Entity management
  createEntities(request: {
    entities: Array<{
      name: string;
      entity_type: string;
      observations: string[];
      metadata?: Record<string, any>;
    }>;
  }): Promise<{
    created_entities: Array<{
      name: string;
      entity_id: string;
      success: boolean;
    }>;
    errors: string[];
  }>;

  // Relationship management
  createRelations(request: {
    relations: Array<{
      from: string;
      to: string;
      relation_type: string;
      properties?: Record<string, any>;
    }>;
  }): Promise<{
    created_relations: Array<{
      from: string;
      to: string;
      relation_type: string;
      relation_id: string;
      success: boolean;
    }>;
    errors: string[];
  }>;

  // Observation management
  addObservations(request: {
    observations: Array<{
      entity_name: string;
      contents: string[];
      metadata?: Record<string, any>;
    }>;
  }): Promise<{
    added_observations: Array<{
      entity_name: string;
      observation_count: number;
      success: boolean;
    }>;
    errors: string[];
  }>;

  // Search and retrieval
  searchNodes(request: {
    query: string;
    filters?: {
      entity_types?: string[];
      relation_types?: string[];
      date_range?: {
        start: string;
        end: string;
      };
    };
    limit?: number;
    include_relations?: boolean;
  }): Promise<{
    nodes: Array<{
      name: string;
      type: string;
      observations: string[];
      relations?: Array<{
        type: string;
        target: string;
        direction: 'incoming' | 'outgoing';
      }>;
      relevance_score: number;
    }>;
    total_count: number;
  }>;

  // Knowledge graph operations
  getSubgraph(request: {
    center_node: string;
    depth: number;
    relation_types?: string[];
    min_relevance?: number;
  }): Promise<{
    nodes: Array<{
      name: string;
      type: string;
      observations: string[];
      distance: number;
    }>;
    edges: Array<{
      from: string;
      to: string;
      type: string;
      weight: number;
    }>;
    metadata: {
      total_nodes: number;
      total_edges: number;
      query_time: number;
    };
  }>;

  // Analytics and insights
  analyzeConnections(request: {
    entity_name: string;
    analysis_type: 'centrality' | 'clustering' | 'path_analysis' | 'influence';
    parameters?: Record<string, any>;
  }): Promise<{
    analysis_results: {
      centrality_scores?: Record<string, number>;
      clusters?: Array<{
        cluster_id: string;
        members: string[];
        coherence_score: number;
      }>;
      paths?: Array<{
        path: string[];
        strength: number;
        path_type: string;
      }>;
      influence_map?: Record<string, number>;
    };
    insights: string[];
    confidence_score: number;
  }>;
}
```

## SDK Examples

### TypeScript/JavaScript SDK

```typescript
// TAM-MCP-Server SDK
import { TAMClient } from '@tam-mcp-server/client';

const client = new TAMClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.tam-mcp-server.com/v1',
  websocket: {
    enabled: true,
    url: 'wss://api.tam-mcp-server.com/ws'
  }
});

// Research workflow example
async function conductMarketResearch() {
  // Create research request
  const research = await client.research.create({
    query: "Analyze the global fintech market size and competitive landscape",
    priority: "high",
    scope: {
      geographies: ["United States", "Europe", "Asia-Pacific"],
      industries: ["Financial Services", "Technology"],
      analysis_types: ["market_sizing", "competitive_analysis", "trend_analysis"]
    },
    constraints: {
      max_api_calls: 500,
      budget_limit: 200.0
    }
  });

  // Monitor execution progress
  client.websocket.subscribe('research.execution.progress', (event) => {
    if (event.execution_id === research.execution_id) {
      console.log(`Progress: ${event.overall_progress * 100}%`);
      displayProgress(event.overall_progress, event.active_agents);
    }
  });

  // Wait for completion
  const results = await client.research.waitForCompletion(research.request_id, {
    timeout: 30 * 60 * 1000, // 30 minutes
    onProgress: (progress) => console.log(`${progress}% complete`)
  });

  // Generate report
  const report = await client.research.generateReport(research.request_id, {
    format: 'pdf',
    template: 'executive',
    sections: ['executive_summary', 'market_analysis', 'competitive_landscape', 'recommendations']
  });

  return { results, report };
}

// Agent interaction example
async function monitorAgentPerformance() {
  const agents = await client.agents.list({ status: 'busy' });
  
  for (const agent of agents) {
    const details = await client.agents.get(agent.agent_id);
    console.log(`Agent ${agent.agent_id}: ${details.performance_metrics.success_rate}% success rate`);
    
    // Subscribe to agent updates
    client.websocket.subscribe('agent.task.completed', (event) => {
      if (event.agent_id === agent.agent_id) {
        console.log(`Task completed with confidence: ${event.result.confidence_score}`);
      }
    });
  }
}
```

### Python SDK

```python
# Python SDK example
from tam_mcp_server import TAMClient
import asyncio

client = TAMClient(
    api_key="your-api-key",
    base_url="https://api.tam-mcp-server.com/v1",
    websocket_url="wss://api.tam-mcp-server.com/ws"
)

async def conduct_research():
    # Create research request
    research = await client.research.create(
        query="Analyze the global fintech market size and competitive landscape",
        priority="high",
        scope={
            "geographies": ["United States", "Europe", "Asia-Pacific"],
            "industries": ["Financial Services", "Technology"],
            "analysis_types": ["market_sizing", "competitive_analysis"]
        },
        constraints={
            "max_api_calls": 500,
            "budget_limit": 200.0
        }
    )
    
    # Monitor progress with async generator
    async for update in client.research.stream_progress(research.execution_id):
        print(f"Progress: {update.overall_progress:.1%}")
        print(f"Active agents: {[a.agent_id for a in update.active_agents]}")
    
    # Get results
    results = await client.research.get_results(research.request_id)
    
    # Generate report
    report = await client.research.generate_report(
        research.request_id,
        format="pdf",
        template="detailed"
    )
    
    return results, report

# Run the research
results, report = asyncio.run(conduct_research())
print(f"Research completed with quality score: {results.quality_assessment.overall_score}")
```

This comprehensive API documentation provides clear interfaces for all major system components, enabling developers to effectively integrate with and extend the TAM-MCP-Server agentic architecture.

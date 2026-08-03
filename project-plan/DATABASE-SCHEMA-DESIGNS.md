# Database Schema Designs

## Overview

This document defines the database schemas for the TAM-MCP-Server agentic architecture, including operational state management (Redis), agent memories and workflow templates (MongoDB), structured relationships (PostgreSQL), semantic search (Vector Database), and time series metrics (InfluxDB).

## Redis Schema - Operational State and Caching

### Cache Keys Structure

```redis
# Agent State Management
agent:state:{agent_id} -> hash
agent:execution:{execution_id} -> hash
agent:tasks:{agent_id} -> list
agent:results:{execution_id} -> hash

# MCP Session Management
mcp:session:{session_id} -> hash
mcp:sessions:agent:{agent_id} -> set
mcp:operations:{session_id} -> list

# Research Coordination
research:request:{request_id} -> hash
research:plan:{plan_id} -> hash
research:execution:{execution_id} -> hash
research:status:{execution_id} -> hash

# Workflow Coordination
workflow:coordination:{execution_id} -> hash
workflow:sync:{sync_point_id} -> hash
workflow:dependencies:{execution_id} -> set

# Data Collection Cache
data:company:{company_name} -> hash (TTL: 24h)
data:market:{market_id} -> hash (TTL: 1h)
data:news:{query_hash} -> hash (TTL: 30m)
data:financial:{symbol} -> hash (TTL: 15m)

# Quality and Validation Cache
quality:validation:{data_id} -> hash (TTL: 6h)
quality:scores:{agent_id} -> zset
quality:thresholds -> hash

# Performance Metrics (Short-term)
metrics:agent:{agent_id}:{timestamp} -> hash (TTL: 7d)
metrics:system:{timestamp} -> hash (TTL: 30d)
metrics:mcp:{service_name}:{timestamp} -> hash (TTL: 7d)
```

### Agent State Schema

```redis
# agent:state:{agent_id}
HSET agent:state:research_director_001
    agent_id "research_director_001"
    agent_type "research_director"
    status "busy"
    current_task "market_analysis_request_123"
    current_execution_id "exec_456"
    progress 0.65
    last_update "2024-01-15T10:30:00Z"
    resource_allocation "{\"cpu_cores\": 2, \"memory_mb\": 1024}"
    active_mcp_sessions "[\"seq_thinking_session_789\", \"memory_session_012\"]"
    health_status "healthy"
    error_count 0
    performance_score 0.94

# agent:execution:{execution_id}
HSET agent:execution:exec_456
    execution_id "exec_456"
    agent_id "research_director_001"
    task_id "task_123"
    status "running"
    start_time "2024-01-15T10:00:00Z"
    estimated_completion "2024-01-15T11:00:00Z"
    progress 0.65
    current_step "synthesize_results"
    intermediate_results "{\"analysis_complete\": true, \"synthesis_progress\": 0.65}"
    mcp_sessions "{\"sequential_thinking\": \"seq_789\", \"memory\": \"mem_012\"}"
    errors "[]"
    warnings "[\"slow_api_response\"]"
    metrics "{\"api_calls\": 23, \"processing_time\": 1847}"
```

### MCP Session Schema

```redis
# mcp:session:{session_id}
HSET mcp:session:seq_thinking_session_789
    session_id "seq_thinking_session_789"
    service_name "sequential_thinking"
    agent_id "research_director_001"
    state "active"
    created_at "2024-01-15T10:00:00Z"
    last_activity "2024-01-15T10:29:45Z"
    operation_count 15
    configuration "{\"reasoning_depth\": \"deep\", \"max_steps\": 20}"
    context "{\"problem_type\": \"market_analysis\", \"domain\": \"fintech\"}"
    metrics "{\"avg_response_time\": 1.2, \"success_rate\": 0.97}"

# mcp:operations:{session_id} (list of operation IDs)
LPUSH mcp:operations:seq_thinking_session_789
    "op_001_reason_about_market"
    "op_002_analyze_competitors"
    "op_003_synthesize_insights"
```

### Research Coordination Schema

```redis
# research:execution:{execution_id}
HSET research:execution:research_exec_001
    execution_id "research_exec_001"
    request_id "req_123"
    plan_id "plan_456"
    status "running"
    start_time "2024-01-15T10:00:00Z"
    estimated_completion "2024-01-15T12:00:00Z"
    overall_progress 0.45
    active_agents "[\"research_director_001\", \"web_data_002\", \"market_analysis_003\"]"
    completed_agents "[\"company_research_004\"]"
    failed_agents "[]"
    coordination_events "[\"sync_point_reached_001\", \"agent_started_002\"]"
    quality_gates_passed "[\"data_quality_check\"]"
    quality_gates_pending "[\"final_validation\"]"
    resource_usage "{\"total_api_calls\": 156, \"compute_hours\": 2.3}"
    estimated_cost 12.45
```

## MongoDB Schema - Agent Memories and Workflow Templates

### Collections Structure

```javascript
// Database: tam_mcp_server

// Collection: agent_memories
{
  _id: ObjectId,
  agent_id: String,
  memory_type: String, // "episodic", "semantic", "procedural"
  content: {
    // Variable structure based on memory_type
  },
  metadata: {
    created_at: Date,
    updated_at: Date,
    confidence: Number,
    importance: Number,
    access_count: Number,
    last_accessed: Date,
    tags: [String],
    source: String,
    validation_status: String
  },
  relationships: [{
    related_memory_id: ObjectId,
    relationship_type: String,
    strength: Number
  }],
  expiry_date: Date, // TTL index
  version: Number
}

// Collection: workflow_templates
{
  _id: ObjectId,
  template_id: String,
  name: String,
  description: String,
  category: String, // "research", "analysis", "coordination", "data_collection"
  version: String,
  langgraph_definition: {
    nodes: [{
      node_id: String,
      node_type: String,
      implementation: String,
      configuration: Object,
      mcp_integrations: [String]
    }],
    edges: [{
      from_node: String,
      to_node: String,
      condition: String,
      weight: Number
    }],
    entry_point: String,
    error_handlers: Object
  },
  parameters: [{
    name: String,
    type: String,
    required: Boolean,
    default_value: Mixed,
    description: String,
    validation_rules: Object
  }],
  success_metrics: [{
    metric_name: String,
    threshold: Number,
    measurement_method: String
  }],
  usage_statistics: {
    execution_count: Number,
    success_rate: Number,
    average_duration: Number,
    last_used: Date,
    performance_scores: [Number]
  },
  metadata: {
    created_by: String,
    created_at: Date,
    updated_at: Date,
    tags: [String],
    complexity_score: Number,
    resource_requirements: Object
  }
}

// Collection: research_sessions
{
  _id: ObjectId,
  session_id: String,
  request_id: String,
  execution_id: String,
  session_type: String, // "research", "analysis", "validation"
  status: String,
  timeline: {
    created_at: Date,
    started_at: Date,
    completed_at: Date,
    estimated_completion: Date
  },
  participants: [{
    agent_id: String,
    role: String,
    join_time: Date,
    contribution_score: Number,
    status: String
  }],
  artifacts: [{
    artifact_id: String,
    type: String, // "data", "analysis", "report", "insight"
    content: Object,
    created_by: String,
    created_at: Date,
    quality_score: Number,
    validation_status: String
  }],
  coordination_state: {
    current_phase: String,
    sync_points: [{
      point_id: String,
      description: String,
      required_agents: [String],
      completion_status: Object,
      timestamp: Date
    }],
    dependencies: [{
      from_agent: String,
      to_agent: String,
      dependency_type: String,
      status: String
    }]
  },
  quality_metrics: {
    overall_score: Number,
    dimension_scores: Object,
    validation_results: [Object],
    improvement_suggestions: [String]
  },
  learning_outcomes: [{
    insight: String,
    confidence: Number,
    applicability: [String],
    discovered_by: String,
    timestamp: Date
  }]
}

// Collection: mcp_integration_logs
{
  _id: ObjectId,
  session_id: String,
  service_name: String,
  agent_id: String,
  operation: String,
  request_data: Object,
  response_data: Object,
  timestamp: Date,
  execution_time_ms: Number,
  success: Boolean,
  error_details: Object,
  context: {
    execution_id: String,
    task_id: String,
    correlation_id: String
  },
  performance_metrics: {
    latency: Number,
    throughput: Number,
    resource_usage: Object
  }
}

// Collection: knowledge_graph_snapshots
{
  _id: ObjectId,
  snapshot_id: String,
  created_at: Date,
  created_by: String,
  description: String,
  entities: [{
    name: String,
    type: String,
    properties: Object,
    observations: [String],
    confidence: Number
  }],
  relationships: [{
    from_entity: String,
    to_entity: String,
    relationship_type: String,
    properties: Object,
    confidence: Number
  }],
  metadata: {
    entity_count: Number,
    relationship_count: Number,
    data_sources: [String],
    quality_score: Number,
    version: String
  }
}
```

### Index Strategies

```javascript
// Indexes for agent_memories
db.agent_memories.createIndex({ "agent_id": 1, "memory_type": 1 })
db.agent_memories.createIndex({ "metadata.created_at": -1 })
db.agent_memories.createIndex({ "metadata.tags": 1 })
db.agent_memories.createIndex({ "metadata.importance": -1 })
db.agent_memories.createIndex({ "expiry_date": 1 }, { expireAfterSeconds: 0 })

// Indexes for workflow_templates
db.workflow_templates.createIndex({ "template_id": 1 }, { unique: true })
db.workflow_templates.createIndex({ "category": 1, "version": -1 })
db.workflow_templates.createIndex({ "usage_statistics.success_rate": -1 })
db.workflow_templates.createIndex({ "metadata.tags": 1 })

// Indexes for research_sessions
db.research_sessions.createIndex({ "session_id": 1 }, { unique: true })
db.research_sessions.createIndex({ "status": 1, "timeline.created_at": -1 })
db.research_sessions.createIndex({ "participants.agent_id": 1 })

// Indexes for mcp_integration_logs
db.mcp_integration_logs.createIndex({ "session_id": 1, "timestamp": -1 })
db.mcp_integration_logs.createIndex({ "service_name": 1, "agent_id": 1, "timestamp": -1 })
db.mcp_integration_logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 604800 }) // 7 days TTL

// Text search indexes
db.agent_memories.createIndex({ 
  "content": "text", 
  "metadata.tags": "text" 
}, { 
  weights: { "content": 10, "metadata.tags": 5 },
  name: "memory_text_search"
})

db.workflow_templates.createIndex({
  "name": "text",
  "description": "text",
  "metadata.tags": "text"
}, {
  weights: { "name": 10, "description": 5, "metadata.tags": 3 },
  name: "template_text_search"
})
```

## PostgreSQL Schema - Structured Relationships

```sql
-- Database: tam_mcp_server

-- Core entity tables
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) UNIQUE NOT NULL,
    agent_type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    configuration JSONB,
    capabilities TEXT[],
    status VARCHAR(50) DEFAULT 'inactive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP,
    performance_score DECIMAL(5,4) DEFAULT 0.0000,
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    resource_requirements JSONB,
    mcp_service_dependencies TEXT[]
);

CREATE TABLE research_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) UNIQUE NOT NULL,
    query TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    deadline TIMESTAMP,
    requester_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    scope JSONB,
    constraints JSONB,
    context JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    quality_score DECIMAL(5,4),
    satisfaction_score DECIMAL(5,4)
);

CREATE TABLE research_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id VARCHAR(255) UNIQUE NOT NULL,
    request_id VARCHAR(255) REFERENCES research_requests(request_id),
    strategy JSONB NOT NULL,
    phases JSONB NOT NULL,
    estimated_duration_minutes INTEGER,
    resource_requirements JSONB,
    quality_gates JSONB,
    confidence_score DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    approved_at TIMESTAMP,
    approved_by VARCHAR(255),
    version INTEGER DEFAULT 1
);

CREATE TABLE agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id VARCHAR(255) UNIQUE NOT NULL,
    agent_id VARCHAR(255) REFERENCES agents(agent_id),
    task_id VARCHAR(255),
    research_execution_id VARCHAR(255),
    task_type VARCHAR(100),
    task_description TEXT,
    task_data JSONB,
    execution_context JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    estimated_completion TIMESTAMP,
    progress DECIMAL(5,4) DEFAULT 0.0000,
    result_data JSONB,
    error_details JSONB,
    warning_details JSONB,
    confidence_score DECIMAL(5,4),
    quality_score DECIMAL(5,4),
    resource_usage JSONB,
    performance_metrics JSONB,
    mcp_sessions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE research_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id VARCHAR(255) UNIQUE NOT NULL,
    plan_id VARCHAR(255) REFERENCES research_plans(plan_id),
    request_id VARCHAR(255) REFERENCES research_requests(request_id),
    coordinator_agent_id VARCHAR(255) REFERENCES agents(agent_id),
    status VARCHAR(50) DEFAULT 'pending',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    estimated_completion TIMESTAMP,
    overall_progress DECIMAL(5,4) DEFAULT 0.0000,
    phase_progress JSONB,
    coordination_state JSONB,
    quality_assessment JSONB,
    resource_consumption JSONB,
    cost_breakdown JSONB,
    final_results JSONB,
    lessons_learned JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relationship tables
CREATE TABLE agent_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_agent_id VARCHAR(255) REFERENCES agents(agent_id),
    to_agent_id VARCHAR(255) REFERENCES agents(agent_id),
    dependency_type VARCHAR(50) NOT NULL, -- 'data', 'coordination', 'resource'
    strength DECIMAL(3,2) DEFAULT 1.00,
    conditions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(from_agent_id, to_agent_id, dependency_type)
);

CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_execution_id VARCHAR(255) REFERENCES agent_executions(execution_id),
    to_execution_id VARCHAR(255) REFERENCES agent_executions(execution_id),
    dependency_type VARCHAR(50) NOT NULL,
    conditions JSONB,
    resolution_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE agent_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(255) UNIQUE NOT NULL,
    from_agent_id VARCHAR(255) REFERENCES agents(agent_id),
    to_agent_id VARCHAR(255) REFERENCES agents(agent_id),
    execution_context VARCHAR(255),
    message_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    requires_response BOOLEAN DEFAULT false,
    response_deadline TIMESTAMP,
    correlation_id VARCHAR(255),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP,
    processed_at TIMESTAMP,
    response_message_id VARCHAR(255)
);

-- MCP integration tables
CREATE TABLE mcp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    agent_id VARCHAR(255) REFERENCES agents(agent_id),
    execution_id VARCHAR(255) REFERENCES agent_executions(execution_id),
    state VARCHAR(50) DEFAULT 'initializing',
    configuration JSONB,
    context JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    operation_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    performance_metrics JSONB
);

CREATE TABLE mcp_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_id VARCHAR(255) UNIQUE NOT NULL,
    session_id VARCHAR(255) REFERENCES mcp_sessions(session_id),
    operation_name VARCHAR(100) NOT NULL,
    parameters JSONB,
    result_data JSONB,
    success BOOLEAN,
    error_details JSONB,
    execution_time_ms INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    correlation_id VARCHAR(255)
);

-- Quality and performance tables
CREATE TABLE quality_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id VARCHAR(255) UNIQUE NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'execution', 'agent', 'research'
    target_id VARCHAR(255) NOT NULL,
    assessment_type VARCHAR(50) NOT NULL,
    overall_score DECIMAL(5,4),
    dimension_scores JSONB,
    issues JSONB,
    recommendations JSONB,
    assessed_by VARCHAR(255),
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validation_status VARCHAR(50),
    metadata JSONB
);

CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_id VARCHAR(255) UNIQUE NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'agent', 'execution', 'system'
    entity_id VARCHAR(255) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6),
    unit VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tags JSONB,
    metadata JSONB
);

-- Knowledge and learning tables
CREATE TABLE research_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id VARCHAR(255) UNIQUE NOT NULL,
    execution_id VARCHAR(255) REFERENCES research_executions(execution_id),
    insight_type VARCHAR(50) NOT NULL,
    title VARCHAR(500),
    description TEXT,
    confidence DECIMAL(5,4),
    supporting_data JSONB,
    discovered_by VARCHAR(255),
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validation_status VARCHAR(50),
    impact_score DECIMAL(5,4),
    tags TEXT[],
    metadata JSONB
);

CREATE TABLE agent_learning_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id VARCHAR(255) UNIQUE NOT NULL,
    agent_id VARCHAR(255) REFERENCES agents(agent_id),
    learning_type VARCHAR(50) NOT NULL, -- 'success_pattern', 'failure_analysis', 'optimization'
    context JSONB,
    lesson_learned TEXT,
    confidence DECIMAL(5,4),
    applicability_conditions JSONB,
    performance_impact DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_count INTEGER DEFAULT 0,
    last_applied TIMESTAMP,
    effectiveness_score DECIMAL(5,4)
);

-- Indexes for performance
CREATE INDEX idx_agents_type_status ON agents(agent_type, status);
CREATE INDEX idx_agents_performance ON agents(performance_score DESC);
CREATE INDEX idx_research_requests_status_created ON research_requests(status, created_at DESC);
CREATE INDEX idx_agent_executions_agent_status ON agent_executions(agent_id, status);
CREATE INDEX idx_agent_executions_research_execution ON agent_executions(research_execution_id);
CREATE INDEX idx_research_executions_status_start ON research_executions(status, start_time DESC);
CREATE INDEX idx_mcp_sessions_agent_service ON mcp_sessions(agent_id, service_name);
CREATE INDEX idx_mcp_operations_session_timestamp ON mcp_operations(session_id, timestamp DESC);
CREATE INDEX idx_quality_assessments_target ON quality_assessments(target_type, target_id);
CREATE INDEX idx_performance_metrics_entity_metric ON performance_metrics(entity_type, entity_id, metric_name);
CREATE INDEX idx_research_insights_execution ON research_insights(execution_id);
CREATE INDEX idx_agent_learning_agent_type ON agent_learning_records(agent_id, learning_type);

-- Full-text search indexes
CREATE INDEX idx_research_requests_query_gin ON research_requests USING gin(to_tsvector('english', query));
CREATE INDEX idx_research_insights_description_gin ON research_insights USING gin(to_tsvector('english', description));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_requests_updated_at BEFORE UPDATE ON research_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_executions_updated_at BEFORE UPDATE ON agent_executions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_executions_updated_at BEFORE UPDATE ON research_executions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Vector Database Schema - Semantic Search (Pinecone/Weaviate)

### Pinecone Schema

```python
# Pinecone vector database configuration for semantic search

# Index configurations
PINECONE_INDEXES = {
    "research-content": {
        "dimension": 1536,  # OpenAI embedding dimension
        "metric": "cosine",
        "pod_type": "p1.x1",
        "metadata_config": {
            "indexed": [
                "content_type",
                "agent_id", 
                "execution_id",
                "research_domain",
                "confidence_score",
                "creation_date",
                "tags"
            ]
        }
    },
    "agent-memories": {
        "dimension": 1536,
        "metric": "cosine", 
        "pod_type": "p1.x1",
        "metadata_config": {
            "indexed": [
                "agent_id",
                "memory_type",
                "importance",
                "recency",
                "access_frequency",
                "domain"
            ]
        }
    },
    "knowledge-entities": {
        "dimension": 1536,
        "metric": "cosine",
        "pod_type": "p1.x1", 
        "metadata_config": {
            "indexed": [
                "entity_type",
                "domain",
                "confidence",
                "data_sources",
                "last_updated"
            ]
        }
    }
}

# Vector record structure
"""
Research Content Vector Record:
{
    "id": "research_content_{uuid}",
    "values": [0.123, -0.456, ...], # 1536-dim embedding
    "metadata": {
        "content_type": "analysis_result",
        "agent_id": "market_analysis_agent_001", 
        "execution_id": "exec_789",
        "research_domain": "fintech",
        "confidence_score": 0.89,
        "creation_date": "2024-01-15",
        "tags": ["market_analysis", "competitive_intelligence"],
        "title": "Fintech Market Competitive Landscape",
        "summary": "Analysis of key players and market dynamics...",
        "source_documents": ["doc1", "doc2"],
        "quality_score": 0.94
    }
}

Agent Memory Vector Record:
{
    "id": "agent_memory_{agent_id}_{memory_id}",
    "values": [0.789, -0.234, ...],
    "metadata": {
        "agent_id": "research_director_001",
        "memory_type": "episodic",
        "importance": 0.85,
        "recency": 0.92,
        "access_frequency": 15,
        "domain": "market_research",
        "memory_content": "Successfully coordinated 5-agent research...",
        "learned_patterns": ["multi_agent_coordination", "quality_validation"],
        "applicable_contexts": ["large_scale_research", "time_critical"]
    }
}

Knowledge Entity Vector Record:
{
    "id": "entity_{entity_name}_{entity_type}",
    "values": [0.456, -0.789, ...],
    "metadata": {
        "entity_type": "company",
        "entity_name": "TechCorp Inc",
        "domain": "enterprise_software",
        "confidence": 0.91,
        "data_sources": ["company_website", "sec_filings", "news_articles"],
        "last_updated": "2024-01-15T10:30:00Z",
        "key_attributes": ["revenue_1B", "employees_5000", "founded_2010"],
        "relationships": ["competes_with_SoftwareGiant", "acquired_by_MegaCorp"],
        "business_metrics": {"revenue": 1000000000, "growth_rate": 0.15}
    }
}
"""
```

### Weaviate Schema

```python
# Weaviate schema configuration for semantic search

WEAVIATE_SCHEMA = {
    "classes": [
        {
            "class": "ResearchContent",
            "description": "Research content and analysis results",
            "vectorizer": "text2vec-openai",
            "moduleConfig": {
                "text2vec-openai": {
                    "model": "text-embedding-ada-002",
                    "type": "text"
                }
            },
            "properties": [
                {
                    "name": "title",
                    "dataType": ["text"],
                    "description": "Title of the research content"
                },
                {
                    "name": "content",
                    "dataType": ["text"], 
                    "description": "Main content text"
                },
                {
                    "name": "summary",
                    "dataType": ["text"],
                    "description": "Content summary"
                },
                {
                    "name": "contentType",
                    "dataType": ["string"],
                    "description": "Type of content"
                },
                {
                    "name": "agentId", 
                    "dataType": ["string"],
                    "description": "ID of agent that created content"
                },
                {
                    "name": "executionId",
                    "dataType": ["string"], 
                    "description": "Execution ID"
                },
                {
                    "name": "researchDomain",
                    "dataType": ["string"],
                    "description": "Research domain"
                },
                {
                    "name": "confidenceScore",
                    "dataType": ["number"],
                    "description": "Confidence score"
                },
                {
                    "name": "qualityScore", 
                    "dataType": ["number"],
                    "description": "Quality assessment score"
                },
                {
                    "name": "tags",
                    "dataType": ["string[]"],
                    "description": "Content tags"
                },
                {
                    "name": "creationDate",
                    "dataType": ["date"],
                    "description": "Content creation date"
                },
                {
                    "name": "sourceDocuments",
                    "dataType": ["string[]"],
                    "description": "Source document references"
                }
            ]
        },
        {
            "class": "AgentMemory",
            "description": "Agent episodic and semantic memories",
            "vectorizer": "text2vec-openai",
            "properties": [
                {
                    "name": "memoryContent",
                    "dataType": ["text"],
                    "description": "Memory content description"
                },
                {
                    "name": "agentId",
                    "dataType": ["string"],
                    "description": "Agent ID"
                },
                {
                    "name": "memoryType",
                    "dataType": ["string"],
                    "description": "Type of memory"
                },
                {
                    "name": "importance",
                    "dataType": ["number"],
                    "description": "Memory importance score"
                },
                {
                    "name": "recency",
                    "dataType": ["number"],
                    "description": "Recency score"
                },
                {
                    "name": "accessFrequency",
                    "dataType": ["int"],
                    "description": "Access frequency count"
                },
                {
                    "name": "domain",
                    "dataType": ["string"],
                    "description": "Memory domain"
                },
                {
                    "name": "learnedPatterns",
                    "dataType": ["string[]"],
                    "description": "Learned patterns"
                },
                {
                    "name": "applicableContexts",
                    "dataType": ["string[]"],
                    "description": "Applicable contexts"
                }
            ]
        },
        {
            "class": "KnowledgeEntity",
            "description": "Knowledge graph entities",
            "vectorizer": "text2vec-openai",
            "properties": [
                {
                    "name": "entityName",
                    "dataType": ["string"],
                    "description": "Entity name"
                },
                {
                    "name": "entityType",
                    "dataType": ["string"],
                    "description": "Entity type"
                },
                {
                    "name": "description",
                    "dataType": ["text"],
                    "description": "Entity description"
                },
                {
                    "name": "domain",
                    "dataType": ["string"],
                    "description": "Domain"
                },
                {
                    "name": "confidence",
                    "dataType": ["number"],
                    "description": "Entity confidence"
                },
                {
                    "name": "dataSources",
                    "dataType": ["string[]"],
                    "description": "Data sources"
                },
                {
                    "name": "keyAttributes",
                    "dataType": ["string[]"],
                    "description": "Key attributes"
                },
                {
                    "name": "relationships",
                    "dataType": ["string[]"],
                    "description": "Entity relationships"
                }
            ]
        }
    ]
}
```

## InfluxDB Schema - Time Series Metrics

```python
# InfluxDB schema for time series metrics and monitoring

# Measurement schemas
INFLUXDB_MEASUREMENTS = {
    # Agent performance metrics
    "agent_performance": {
        "fields": {
            "cpu_usage_percent": "float",
            "memory_usage_mb": "float", 
            "task_completion_rate": "float",
            "average_response_time_ms": "float",
            "error_rate": "float",
            "throughput_tasks_per_hour": "float",
            "quality_score": "float",
            "resource_efficiency": "float"
        },
        "tags": {
            "agent_id": "string",
            "agent_type": "string", 
            "execution_id": "string",
            "task_type": "string",
            "priority": "string"
        }
    },
    
    # System-wide metrics
    "system_metrics": {
        "fields": {
            "total_cpu_usage": "float",
            "total_memory_usage": "float",
            "active_agents_count": "integer",
            "pending_tasks_count": "integer",
            "completed_tasks_count": "integer",
            "failed_tasks_count": "integer",
            "api_calls_per_minute": "float",
            "data_throughput_mbps": "float",
            "concurrent_executions": "integer"
        },
        "tags": {
            "environment": "string",
            "region": "string",
            "service_version": "string"
        }
    },
    
    # MCP service metrics
    "mcp_service_metrics": {
        "fields": {
            "operation_count": "integer",
            "success_rate": "float",
            "average_latency_ms": "float",
            "error_count": "integer",
            "session_count": "integer",
            "data_transfer_mb": "float",
            "concurrent_operations": "integer"
        },
        "tags": {
            "service_name": "string",
            "agent_id": "string",
            "operation_type": "string",
            "session_id": "string"
        }
    },
    
    # Research execution metrics
    "research_metrics": {
        "fields": {
            "execution_duration_minutes": "float",
            "agent_coordination_overhead": "float",
            "data_quality_score": "float",
            "resource_cost_usd": "float",
            "user_satisfaction_score": "float",
            "insights_generated_count": "integer",
            "api_calls_consumed": "integer",
            "coordination_events_count": "integer"
        },
        "tags": {
            "research_type": "string",
            "domain": "string",
            "complexity": "string",
            "execution_id": "string",
            "coordinator_agent": "string"
        }
    },
    
    # Quality metrics
    "quality_metrics": {
        "fields": {
            "accuracy_score": "float",
            "completeness_score": "float",
            "consistency_score": "float",
            "timeliness_score": "float",
            "relevance_score": "float",
            "overall_quality_score": "float",
            "validation_pass_rate": "float"
        },
        "tags": {
            "content_type": "string",
            "agent_id": "string",
            "validation_method": "string",
            "data_source": "string"
        }
    },
    
    # Business metrics
    "business_metrics": {
        "fields": {
            "research_requests_completed": "integer",
            "average_research_value_usd": "float",
            "client_satisfaction_score": "float",
            "knowledge_base_growth_rate": "float",
            "automation_efficiency": "float",
            "cost_per_insight": "float",
            "time_to_insight_hours": "float"
        },
        "tags": {
            "client_segment": "string",
            "research_category": "string",
            "service_tier": "string"
        }
    }
}

# Retention policies
RETENTION_POLICIES = {
    "real_time": "7d",      # High-frequency metrics
    "hourly": "30d",        # Hourly aggregations
    "daily": "365d",        # Daily aggregations  
    "monthly": "1095d",     # Monthly aggregations (3 years)
    "raw_logs": "7d"        # Raw log data
}

# Continuous queries for downsampling
CONTINUOUS_QUERIES = [
    {
        "name": "agent_performance_hourly",
        "query": """
        SELECT 
            mean(cpu_usage_percent) as avg_cpu_usage,
            mean(memory_usage_mb) as avg_memory_usage,
            mean(task_completion_rate) as avg_completion_rate,
            mean(quality_score) as avg_quality_score,
            sum(throughput_tasks_per_hour) as total_throughput
        INTO "hourly"."agent_performance_hourly"
        FROM "real_time"."agent_performance"
        GROUP BY time(1h), agent_id, agent_type
        """,
        "resample": "FOR 2h"
    },
    {
        "name": "system_metrics_hourly", 
        "query": """
        SELECT
            mean(total_cpu_usage) as avg_cpu_usage,
            mean(total_memory_usage) as avg_memory_usage,
            mean(active_agents_count) as avg_active_agents,
            sum(completed_tasks_count) as total_completed_tasks,
            sum(failed_tasks_count) as total_failed_tasks
        INTO "hourly"."system_metrics_hourly"
        FROM "real_time"."system_metrics"
        GROUP BY time(1h), environment
        """,
        "resample": "FOR 2h"
    }
]
```

## Integration Patterns

### Cross-Database Query Examples

```python
# Example: Comprehensive agent performance analysis
async def get_agent_performance_analysis(agent_id: str, timeframe: str) -> AgentPerformanceReport:
    """Combine data from multiple databases for comprehensive analysis"""
    
    # PostgreSQL: Get agent execution history
    pg_query = """
    SELECT execution_id, task_type, status, start_time, end_time, 
           confidence_score, quality_score, resource_usage
    FROM agent_executions 
    WHERE agent_id = %s AND start_time > NOW() - INTERVAL %s
    ORDER BY start_time DESC
    """
    execution_history = await postgres_client.fetch(pg_query, agent_id, timeframe)
    
    # InfluxDB: Get performance metrics
    influx_query = f"""
    SELECT mean(cpu_usage_percent), mean(memory_usage_mb), 
           mean(task_completion_rate), mean(quality_score)
    FROM agent_performance 
    WHERE agent_id = '{agent_id}' AND time > now() - {timeframe}
    GROUP BY time(1h)
    """
    performance_metrics = await influxdb_client.query(influx_query)
    
    # MongoDB: Get agent memories and learning patterns
    memory_query = {
        "agent_id": agent_id,
        "memory_type": "procedural",
        "metadata.created_at": {"$gte": datetime.now() - parse_timeframe(timeframe)}
    }
    learning_patterns = await mongodb_client.agent_memories.find(memory_query).to_list()
    
    # Vector DB: Get similar successful patterns
    vector_query = {
        "vector": await get_agent_embedding(agent_id),
        "filter": {
            "agent_id": {"$eq": agent_id},
            "success_score": {"$gte": 0.8}
        },
        "top_k": 10
    }
    similar_patterns = await pinecone_client.query(**vector_query)
    
    # Redis: Get current state
    current_state = await redis_client.hgetall(f"agent:state:{agent_id}")
    
    return AgentPerformanceReport(
        execution_history=execution_history,
        performance_trends=performance_metrics,
        learning_patterns=learning_patterns,
        successful_patterns=similar_patterns,
        current_state=current_state,
        recommendations=generate_performance_recommendations(
            execution_history, performance_metrics, learning_patterns
        )
    )

# Example: Research quality assessment
async def assess_research_quality(execution_id: str) -> QualityAssessment:
    """Cross-database quality assessment"""
    
    # PostgreSQL: Get execution details and structured quality data
    quality_data = await postgres_client.fetch("""
        SELECT qa.overall_score, qa.dimension_scores, qa.issues,
               re.final_results, re.coordination_state
        FROM quality_assessments qa
        JOIN research_executions re ON qa.target_id = re.execution_id
        WHERE qa.target_id = %s AND qa.target_type = 'execution'
    """, execution_id)
    
    # MongoDB: Get detailed session artifacts
    session_data = await mongodb_client.research_sessions.find_one({
        "execution_id": execution_id
    })
    
    # Vector DB: Find similar high-quality research for comparison
    research_embedding = await get_research_embedding(execution_id)
    similar_research = await pinecone_client.query(
        vector=research_embedding,
        filter={"quality_score": {"$gte": 0.9}},
        top_k=5
    )
    
    # InfluxDB: Get quality trend metrics
    quality_trends = await influxdb_client.query(f"""
        SELECT mean(overall_quality_score), mean(accuracy_score),
               mean(completeness_score), mean(consistency_score)
        FROM quality_metrics
        WHERE execution_id = '{execution_id}'
        GROUP BY time(10m)
    """)
    
    return QualityAssessment(
        structured_scores=quality_data,
        session_artifacts=session_data,
        benchmark_comparison=similar_research,
        quality_trends=quality_trends,
        improvement_recommendations=generate_quality_recommendations(
            quality_data, session_data, similar_research
        )
    )
```

This comprehensive database schema design provides the foundation for robust state management, persistent storage, semantic search, and performance monitoring across the entire TAM-MCP-Server agentic architecture.

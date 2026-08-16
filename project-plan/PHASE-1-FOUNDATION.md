# Phase 1: Foundation & Architecture Setup (Weeks 1-8)

## Phase Overview

**Objective**: Establish core architecture, communication infrastructure, and development foundation for the agentic TAM-MCP-Server.

**Duration**: 8 weeks  
**Critical Path**: Project foundation that all subsequent phases depend on  
**Primary Technologies**: TypeScript, Python, LangGraph, LangFlow, gRPC, Redis  

## Week-by-Week Breakdown

### Week 1-2: Project Structure & Environment Setup

#### Task 1.1: Project Structure Creation
**Agent Type**: Infrastructure Setup Agent  
**Priority**: Critical  
**Estimated Effort**: 16 hours  

**Objective**: Create comprehensive project structure supporting hybrid TypeScript/Python architecture

**Expected Output**:
```
tam-mcp-server/
├── packages/
│   ├── mcp-server/          # TypeScript MCP server core
│   ├── agent-bridge/        # TypeScript-Python bridge
│   └── shared-types/        # Shared TypeScript definitions
├── agents/
│   ├── core/               # Python core agent framework
│   ├── orchestration/      # Research Director & Workflow Coordinator
│   ├── data-acquisition/   # Data source specific agents
│   ├── analysis/          # Analysis specialist agents
│   └── communication/     # Interface & communication agents
├── workflows/
│   ├── langgraph/         # LangGraph workflow definitions
│   ├── langflow/          # LangFlow templates
│   └── templates/         # Reusable workflow templates
├── infrastructure/
│   ├── docker/            # Docker configurations
│   ├── k8s/              # Kubernetes manifests
│   └── terraform/        # Infrastructure as code
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/             # End-to-end tests
└── docs/
    ├── api/              # API documentation
    ├── architecture/     # Architecture documentation
    └── guides/          # User and developer guides
```

**Acceptance Criteria**:
- [ ] Complete directory structure created with proper naming conventions
- [ ] TypeScript and Python projects initialized with proper configuration
- [ ] Package.json and pyproject.toml files configured with all dependencies
- [ ] ESLint, Prettier, and Python linting configured
- [ ] Git repository initialized with proper .gitignore files
- [ ] Basic README files in each major directory

**Implementation Instructions**:
1. Create root directory structure following monorepo pattern
2. Initialize TypeScript projects with strict configuration
3. Set up Python virtual environment with Poetry or pip-tools
4. Configure development tools (ESLint, Prettier, Black, isort)
5. Create basic package.json with MCP and LangGraph dependencies
6. Set up pyproject.toml with LangGraph, LangFlow, FastAPI dependencies

**Code Template**:
```json
// packages/mcp-server/package.json
{
  "name": "@tam-mcp/server",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "fastify": "^4.0.0",
    "@grpc/grpc-js": "^1.9.0",
    "redis": "^4.6.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "jest": "^29.0.0"
  }
}
```

```toml
# agents/pyproject.toml
[project]
name = "tam-agents"
version = "1.0.0"
dependencies = [
    "langgraph>=0.1.0",
    "langflow>=1.0.0",
    "langchain>=0.2.0",
    "fastapi>=0.100.0",
    "redis>=5.0.0",
    "pydantic>=2.0.0",
    "grpcio>=1.59.0",
    "grpcio-tools>=1.59.0"
]
```

#### Task 1.2: Development Environment Configuration
**Agent Type**: DevOps Configuration Agent  
**Priority**: High  
**Estimated Effort**: 12 hours  

**Objective**: Configure complete development environment with Docker and local services

**Expected Output**:
- Docker Compose configuration for local development
- Development scripts for common tasks
- Environment variable templates
- Local Redis and MongoDB setup

**Acceptance Criteria**:
- [ ] Docker Compose file runs all required services
- [ ] Development environment can be started with single command
- [ ] All environment variables documented and templated
- [ ] Hot reloading configured for TypeScript and Python
- [ ] Local services (Redis, MongoDB) accessible and configured

**Implementation Instructions**:
1. Create docker-compose.yml with Redis, MongoDB, and optional services
2. Set up development scripts (dev.sh, test.sh, build.sh)
3. Configure environment variables for all services
4. Set up hot reloading for both TypeScript and Python
5. Create health check endpoints for all services

**Code Template**:
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  mcp-server:
    build:
      context: ./packages/mcp-server
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./packages/mcp-server:/app
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379

  python-agents:
    build:
      context: ./agents
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - ./agents:/app
    environment:
      - PYTHON_ENV=development
      - REDIS_URL=redis://redis:6379
```

### Week 3-4: gRPC Communication Bridge

#### Task 1.3: Protocol Buffer Schema Definition
**Agent Type**: API Design Agent  
**Priority**: Critical  
**Estimated Effort**: 20 hours  

**Objective**: Design and implement gRPC protocol for TypeScript-Python communication

**Expected Output**:
- Complete Protocol Buffer schema definitions
- Generated TypeScript and Python client/server code
- Type-safe interfaces for all agent communications

**Acceptance Criteria**:
- [ ] Protocol Buffer files define all agent communication patterns
- [ ] Generated code compiles without errors in both languages
- [ ] Type safety maintained across language boundary
- [ ] All message types support serialization/deserialization
- [ ] Streaming support for real-time operations
- [ ] Error handling patterns defined

**Implementation Instructions**:
1. Define Protocol Buffer schemas for all agent message types
2. Generate TypeScript and Python code from protobuf definitions
3. Create type-safe wrapper interfaces
4. Implement error handling and retry mechanisms
5. Add support for streaming operations
6. Test serialization/deserialization performance

**Code Template**:
```protobuf
// proto/agent_service.proto
syntax = "proto3";

package tam_agents;

service AgentExecutionService {
  rpc ExecuteAgent(AgentRequest) returns (AgentResponse);
  rpc StreamExecution(ExecutionRequest) returns (stream ExecutionEvent);
  rpc GetAgentStatus(StatusRequest) returns (AgentStatus);
  rpc RegisterAgent(AgentRegistration) returns (RegistrationResponse);
}

message AgentRequest {
  string agent_id = 1;
  string task_type = 2;
  map<string, string> parameters = 3;
  AgentContext context = 4;
  int32 timeout_seconds = 5;
}

message AgentResponse {
  string execution_id = 1;
  AgentResult result = 2;
  repeated AgentError errors = 3;
  AgentMetrics metrics = 4;
}

message ExecutionEvent {
  string execution_id = 1;
  string event_type = 2;
  map<string, string> data = 3;
  int64 timestamp = 4;
}

message AgentContext {
  string session_id = 1;
  map<string, string> metadata = 2;
  repeated string capabilities_required = 3;
}
```

#### Task 1.4: gRPC Server Implementation
**Agent Type**: Backend Implementation Agent  
**Priority**: Critical  
**Estimated Effort**: 24 hours  

**Objective**: Implement gRPC server in Python for agent execution

**Expected Output**:
- Fully functional gRPC server handling agent requests
- Connection pooling and error handling
- Metrics collection and logging
- Health check endpoints

**Acceptance Criteria**:
- [ ] gRPC server accepts and processes all defined message types
- [ ] Connection pooling implemented for scalability
- [ ] Comprehensive error handling with proper error codes
- [ ] Metrics collection for performance monitoring
- [ ] Health checks for server status
- [ ] Graceful shutdown handling

**Implementation Instructions**:
1. Implement gRPC server using generated Python code
2. Create agent execution framework with proper error handling
3. Add connection pooling for database and external services
4. Implement health check and status endpoints
5. Add comprehensive logging and metrics collection
6. Test with various load scenarios

**Code Template**:
```python
# agents/core/grpc_server.py
import grpc
from concurrent import futures
import logging
from typing import Dict, Any

from proto import agent_service_pb2_grpc, agent_service_pb2
from .agent_executor import AgentExecutor
from .health_checker import HealthChecker

class AgentExecutionServicer(agent_service_pb2_grpc.AgentExecutionServiceServicer):
    def __init__(self):
        self.agent_executor = AgentExecutor()
        self.health_checker = HealthChecker()
        
    async def ExecuteAgent(self, request, context):
        try:
            result = await self.agent_executor.execute(
                agent_id=request.agent_id,
                task_type=request.task_type,
                parameters=dict(request.parameters),
                context=self._parse_context(request.context)
            )
            
            return agent_service_pb2.AgentResponse(
                execution_id=result.execution_id,
                result=self._serialize_result(result.data),
                metrics=self._serialize_metrics(result.metrics)
            )
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            raise

    async def StreamExecution(self, request, context):
        async for event in self.agent_executor.stream_execution(request.execution_id):
            yield agent_service_pb2.ExecutionEvent(
                execution_id=request.execution_id,
                event_type=event.type,
                data=event.data,
                timestamp=event.timestamp
            )

async def serve():
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))
    agent_service_pb2_grpc.add_AgentExecutionServiceServicer_to_server(
        AgentExecutionServicer(), server
    )
    
    listen_addr = '[::]:8000'
    server.add_insecure_port(listen_addr)
    
    logging.info(f"Starting gRPC server on {listen_addr}")
    await server.start()
    await server.wait_for_termination()
```

#### Task 1.5: TypeScript gRPC Client Implementation
**Agent Type**: Frontend Implementation Agent  
**Priority**: Critical  
**Estimated Effort**: 20 hours  

**Objective**: Implement TypeScript gRPC client for MCP server

**Expected Output**:
- Type-safe gRPC client with connection management
- Retry logic and error handling
- Connection pooling and load balancing
- Integration with MCP server framework

**Acceptance Criteria**:
- [ ] gRPC client successfully communicates with Python server
- [ ] Type safety maintained with generated protobuf types
- [ ] Automatic retry logic with exponential backoff
- [ ] Connection pooling for multiple concurrent requests
- [ ] Proper error propagation to MCP layer
- [ ] Comprehensive logging and monitoring

**Implementation Instructions**:
1. Implement gRPC client using generated TypeScript code
2. Add connection management and pooling
3. Implement retry logic with circuit breaker pattern
4. Create type-safe wrapper functions
5. Integrate with MCP server request/response cycle
6. Add monitoring and performance metrics

**Code Template**:
```typescript
// packages/agent-bridge/src/grpc-client.ts
import * as grpc from '@grpc/grpc-js';
import { AgentExecutionServiceClient } from '../generated/agent_service_grpc_pb';
import { AgentRequest, AgentResponse, ExecutionRequest } from '../generated/agent_service_pb';
import { Logger } from 'winston';

export class AgentBridge {
  private client: AgentExecutionServiceClient;
  private logger: Logger;

  constructor(serverAddress: string, logger: Logger) {
    this.client = new AgentExecutionServiceClient(
      serverAddress,
      grpc.credentials.createInsecure()
    );
    this.logger = logger;
  }

  async executeAgent(
    agentId: string,
    taskType: string,
    parameters: Record<string, any>,
    context?: AgentContext
  ): Promise<AgentExecutionResult> {
    const request = new AgentRequest();
    request.setAgentId(agentId);
    request.setTaskType(taskType);
    
    const paramMap = request.getParametersMap();
    Object.entries(parameters).forEach(([key, value]) => {
      paramMap.set(key, JSON.stringify(value));
    });

    return new Promise((resolve, reject) => {
      this.client.executeAgent(request, (error, response) => {
        if (error) {
          this.logger.error('Agent execution failed', { error, agentId, taskType });
          reject(new AgentExecutionError(error.message, error.code));
          return;
        }

        resolve({
          executionId: response.getExecutionId(),
          result: JSON.parse(response.getResult()),
          metrics: this.parseMetrics(response.getMetrics())
        });
      });
    });
  }

  async *streamExecution(executionId: string): AsyncIterable<ExecutionEvent> {
    const request = new ExecutionRequest();
    request.setExecutionId(executionId);

    const stream = this.client.streamExecution(request);
    
    for await (const event of stream) {
      yield {
        executionId: event.getExecutionId(),
        eventType: event.getEventType(),
        data: JSON.parse(event.getData()),
        timestamp: event.getTimestamp()
      };
    }
  }
}

export interface AgentExecutionResult {
  executionId: string;
  result: any;
  metrics: ExecutionMetrics;
}

export interface ExecutionEvent {
  executionId: string;
  eventType: string;
  data: any;
  timestamp: number;
}
```

### Week 5-6: LangGraph Foundation

#### Task 1.6: LangGraph Agent Framework Setup
**Agent Type**: AI Framework Implementation Agent  
**Priority**: Critical  
**Estimated Effort**: 28 hours  

**Objective**: Establish LangGraph foundation with basic agent framework and state management

**Expected Output**:
- LangGraph project structure with agent base classes
- State management with Redis persistence
- Basic workflow execution engine
- Agent registration and discovery system

**Acceptance Criteria**:
- [ ] LangGraph installed and configured properly
- [ ] Base agent classes implement required interfaces
- [ ] State persistence working with Redis backend
- [ ] Agent registration system operational
- [ ] Basic workflow execution functional
- [ ] Error handling and recovery mechanisms in place

**Implementation Instructions**:
1. Set up LangGraph with proper configuration
2. Create base agent classes with required interfaces
3. Implement state management with Redis persistence
4. Create agent registry for discovery and management
5. Build basic workflow execution engine
6. Add comprehensive error handling and logging

**Code Template**:
```python
# agents/core/base_agent.py
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

class AgentState(BaseModel):
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    data: Dict[str, Any] = Field(default_factory=dict)
    context: Dict[str, Any] = Field(default_factory=dict)
    status: str = Field(default="initialized")
    errors: List[str] = Field(default_factory=list)
    metrics: Dict[str, float] = Field(default_factory=dict)

class BaseAgent(ABC):
    def __init__(self, agent_id: str, name: str, tools: List[BaseTool] = None):
        self.agent_id = agent_id
        self.name = name
        self.tools = tools or []
        self.graph = self._build_graph()
        
    @abstractmethod
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow for this agent"""
        pass
    
    @abstractmethod
    async def execute(self, state: AgentState, config: Dict[str, Any]) -> AgentState:
        """Execute the agent's main functionality"""
        pass
    
    async def run(self, input_data: Dict[str, Any], config: Dict[str, Any] = None) -> Dict[str, Any]:
        """Run the agent with input data"""
        initial_state = AgentState(
            data=input_data,
            context=config or {}
        )
        
        try:
            result = await self.graph.ainvoke(initial_state, config or {})
            return {
                "status": "success",
                "data": result.data,
                "metrics": result.metrics
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "data": {}
            }

# agents/core/agent_registry.py
from typing import Dict, Type, Optional
import redis
import json
from .base_agent import BaseAgent

class AgentRegistry:
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.agents: Dict[str, BaseAgent] = {}
        
    def register_agent(self, agent: BaseAgent):
        """Register an agent in the registry"""
        self.agents[agent.agent_id] = agent
        
        # Store agent metadata in Redis
        metadata = {
            "agent_id": agent.agent_id,
            "name": agent.name,
            "capabilities": getattr(agent, 'capabilities', []),
            "status": "active"
        }
        
        self.redis_client.hset(
            "agents:registry",
            agent.agent_id,
            json.dumps(metadata)
        )
    
    def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """Get an agent by ID"""
        return self.agents.get(agent_id)
    
    def list_agents(self) -> List[Dict[str, Any]]:
        """List all registered agents"""
        agents_data = self.redis_client.hgetall("agents:registry")
        return [json.loads(data) for data in agents_data.values()]
    
    async def execute_agent(self, agent_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific agent"""
        agent = self.get_agent(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")
        
        return await agent.run(input_data)
```

#### Task 1.7: Redis State Management Implementation
**Agent Type**: Database Integration Agent  
**Priority**: High  
**Estimated Effort**: 16 hours  

**Objective**: Implement comprehensive state management using Redis for agent states and workflow persistence

**Expected Output**:
- Redis-based state persistence for LangGraph
- Session management and recovery
- State serialization/deserialization
- Performance optimization with connection pooling

**Acceptance Criteria**:
- [ ] LangGraph state persisted to Redis automatically
- [ ] Session recovery functional after restart
- [ ] State serialization handles complex objects
- [ ] Connection pooling optimizes Redis performance
- [ ] State cleanup and garbage collection working
- [ ] Monitoring and metrics for state operations

**Implementation Instructions**:
1. Implement LangGraph checkpointer using Redis
2. Create state serialization/deserialization utilities
3. Add session management and recovery mechanisms
4. Implement connection pooling for Redis operations
5. Add state cleanup and garbage collection
6. Create monitoring for state operations

**Code Template**:
```python
# agents/core/redis_checkpointer.py
import redis.asyncio as redis
import json
import pickle
import asyncio
from typing import Any, Dict, Optional, Tuple
from langgraph.checkpoint import BaseCheckpointSaver, Checkpoint

class RedisCheckpointSaver(BaseCheckpointSaver):
    def __init__(self, redis_url: str):
        self.redis_client = redis.from_url(redis_url)
        
    async def aget_tuple(self, config: Dict[str, Any]) -> Optional[Tuple[Checkpoint, Dict[str, Any]]]:
        """Get checkpoint tuple from Redis"""
        thread_id = config.get("configurable", {}).get("thread_id")
        if not thread_id:
            return None
            
        key = f"checkpoint:{thread_id}"
        data = await self.redis_client.hgetall(key)
        
        if not data:
            return None
            
        checkpoint = pickle.loads(data[b"checkpoint"])
        metadata = json.loads(data[b"metadata"])
        
        return (checkpoint, metadata)
    
    async def aput_tuple(self, config: Dict[str, Any], checkpoint: Checkpoint, metadata: Dict[str, Any]) -> None:
        """Store checkpoint tuple in Redis"""
        thread_id = config.get("configurable", {}).get("thread_id")
        if not thread_id:
            return
            
        key = f"checkpoint:{thread_id}"
        
        await self.redis_client.hset(key, mapping={
            "checkpoint": pickle.dumps(checkpoint),
            "metadata": json.dumps(metadata),
            "timestamp": asyncio.get_event_loop().time()
        })
        
        # Set expiration for cleanup
        await self.redis_client.expire(key, 86400)  # 24 hours

# agents/core/state_manager.py
from typing import Dict, Any, Optional
import redis.asyncio as redis
import json
from datetime import datetime, timedelta

class StateManager:
    def __init__(self, redis_url: str):
        self.redis_client = redis.from_url(redis_url)
        
    async def save_agent_state(self, agent_id: str, session_id: str, state: Dict[str, Any]):
        """Save agent state with session tracking"""
        key = f"agent_state:{agent_id}:{session_id}"
        
        state_data = {
            "state": json.dumps(state),
            "timestamp": datetime.utcnow().isoformat(),
            "agent_id": agent_id,
            "session_id": session_id
        }
        
        await self.redis_client.hset(key, mapping=state_data)
        await self.redis_client.expire(key, 3600)  # 1 hour expiration
        
    async def load_agent_state(self, agent_id: str, session_id: str) -> Optional[Dict[str, Any]]:
        """Load agent state by session"""
        key = f"agent_state:{agent_id}:{session_id}"
        data = await self.redis_client.hgetall(key)
        
        if not data:
            return None
            
        return {
            "state": json.loads(data[b"state"]),
            "timestamp": data[b"timestamp"].decode(),
            "agent_id": data[b"agent_id"].decode(),
            "session_id": data[b"session_id"].decode()
        }
    
    async def cleanup_expired_states(self):
        """Clean up expired states"""
        pattern = "agent_state:*"
        async for key in self.redis_client.scan_iter(match=pattern):
            ttl = await self.redis_client.ttl(key)
            if ttl == -1:  # No expiration set
                await self.redis_client.expire(key, 3600)
```

### Week 7-8: LangFlow Integration & Basic Proof of Concept

#### Task 1.8: LangFlow Integration Setup
**Agent Type**: Visual Interface Implementation Agent  
**Priority**: High  
**Estimated Effort**: 24 hours  

**Objective**: Integrate LangFlow for visual workflow design and management

**Expected Output**:
- LangFlow installation and configuration
- Custom node types for market research operations
- Template library for common workflows
- Integration with LangGraph execution engine

**Acceptance Criteria**:
- [ ] LangFlow interface accessible and functional
- [ ] Custom nodes for market research operations
- [ ] Templates for basic workflow patterns
- [ ] Integration with LangGraph execution
- [ ] Visual monitoring of workflow execution
- [ ] Export/import functionality for workflows

**Implementation Instructions**:
1. Install and configure LangFlow
2. Create custom node types for market research
3. Build template library for common patterns
4. Integrate with LangGraph execution engine
5. Add visual monitoring capabilities
6. Test workflow creation and execution

**Code Template**:
```python
# agents/langflow/custom_nodes.py
from langflow.custom import CustomComponent
from langflow.field_typing import Data, Text
from typing import Dict, Any

class MarketSizingNode(CustomComponent):
    display_name = "Market Sizing Agent"
    description = "Calculate Total Addressable Market using multiple methodologies"
    
    inputs = [
        {
            "name": "market_definition",
            "display_name": "Market Definition",
            "field_type": "text",
            "required": True,
            "info": "JSON object defining the market parameters"
        },
        {
            "name": "methodology",
            "display_name": "TAM Methodology", 
            "field_type": "dropdown",
            "options": ["top-down", "bottom-up", "value-theory", "hybrid"],
            "value": "hybrid"
        }
    ]
    
    outputs = [
        {
            "name": "tam_calculation",
            "display_name": "TAM Calculation",
            "field_type": "text"
        }
    ]
    
    def build(self, market_definition: str, methodology: str) -> Dict[str, Any]:
        # Integration with actual market sizing agent
        from ..analysis.market_sizing_agent import MarketSizingAgent
        
        agent = MarketSizingAgent()
        result = agent.calculate_tam(
            market_definition=market_definition,
            methodology=methodology
        )
        
        return {
            "tam_calculation": result
        }

class DataCollectionNode(CustomComponent):
    display_name = "Data Collection Coordinator"
    description = "Coordinate parallel data collection from multiple sources"
    
    inputs = [
        {
            "name": "data_sources",
            "display_name": "Data Sources",
            "field_type": "multiselect",
            "options": ["alpha_vantage", "fred", "census", "bls", "imf", "oecd", "world_bank", "nasdaq"],
            "required": True
        },
        {
            "name": "parameters",
            "display_name": "Collection Parameters",
            "field_type": "text",
            "info": "JSON object with data collection parameters"
        }
    ]
    
    def build(self, data_sources: list, parameters: str) -> Dict[str, Any]:
        from ..coordination.data_collection_coordinator import DataCollectionCoordinator
        
        coordinator = DataCollectionCoordinator()
        result = coordinator.collect_data(
            sources=data_sources,
            parameters=parameters
        )
        
        return result

# agents/langflow/templates.py
from typing import Dict, Any, List

class WorkflowTemplates:
    @staticmethod
    def comprehensive_market_analysis() -> Dict[str, Any]:
        """Template for comprehensive market analysis workflow"""
        return {
            "name": "Comprehensive Market Analysis",
            "description": "Complete market research with sizing, competitive analysis, and trends",
            "nodes": [
                {
                    "id": "query_understanding",
                    "type": "QueryUnderstandingNode",
                    "position": {"x": 100, "y": 100}
                },
                {
                    "id": "data_collection",
                    "type": "DataCollectionNode", 
                    "position": {"x": 300, "y": 100}
                },
                {
                    "id": "market_sizing",
                    "type": "MarketSizingNode",
                    "position": {"x": 500, "y": 50}
                },
                {
                    "id": "competitive_analysis",
                    "type": "CompetitiveAnalysisNode",
                    "position": {"x": 500, "y": 150}
                },
                {
                    "id": "results_synthesis",
                    "type": "ResultsSynthesisNode",
                    "position": {"x": 700, "y": 100}
                }
            ],
            "edges": [
                {"source": "query_understanding", "target": "data_collection"},
                {"source": "data_collection", "target": "market_sizing"},
                {"source": "data_collection", "target": "competitive_analysis"},
                {"source": "market_sizing", "target": "results_synthesis"},
                {"source": "competitive_analysis", "target": "results_synthesis"}
            ]
        }
```

#### Task 1.9: Basic Agent Proof of Concept
**Agent Type**: Integration Testing Agent  
**Priority**: Critical  
**Estimated Effort**: 20 hours  

**Objective**: Create working proof of concept with basic agents and workflow

**Expected Output**:
- Two functional agents (FRED Data Agent + Market Sizing Agent)
- Simple workflow execution from TypeScript to Python
- End-to-end request/response cycle working
- Basic error handling and logging

**Acceptance Criteria**:
- [ ] FRED Data Agent successfully retrieves economic data
- [ ] Market Sizing Agent performs basic TAM calculations
- [ ] TypeScript MCP server communicates with Python agents
- [ ] End-to-end workflow completes successfully
- [ ] Error handling prevents system crashes
- [ ] Comprehensive logging captures all operations

**Implementation Instructions**:
1. Implement FRED Data Agent with basic data retrieval
2. Create Market Sizing Agent with simple TAM calculation
3. Build simple workflow connecting both agents
4. Test end-to-end execution from MCP server
5. Add comprehensive error handling
6. Validate all logging and monitoring

**Code Template**:
```python
# agents/data_acquisition/fred_agent.py
from ..core.base_agent import BaseAgent, AgentState
from langgraph.graph import StateGraph, END
import httpx
from typing import Dict, Any

class FREDDataAgent(BaseAgent):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.stlouisfed.org/fred"
        super().__init__("fred_data_agent", "FRED Economic Data Agent")
    
    def _build_graph(self) -> StateGraph:
        graph = StateGraph(AgentState)
        
        graph.add_node("fetch_data", self._fetch_economic_data)
        graph.add_node("process_data", self._process_data)
        graph.add_node("validate_data", self._validate_data)
        
        graph.set_entry_point("fetch_data")
        graph.add_edge("fetch_data", "process_data")
        graph.add_edge("process_data", "validate_data")
        graph.add_edge("validate_data", END)
        
        return graph.compile()
    
    async def _fetch_economic_data(self, state: AgentState) -> AgentState:
        """Fetch data from FRED API"""
        try:
            series_id = state.data.get("series_id")
            if not series_id:
                raise ValueError("series_id required")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/series/observations",
                    params={
                        "series_id": series_id,
                        "api_key": self.api_key,
                        "file_type": "json"
                    }
                )
                response.raise_for_status()
                
                data = response.json()
                state.data["raw_data"] = data
                state.status = "data_fetched"
                
        except Exception as e:
            state.errors.append(f"Data fetch failed: {str(e)}")
            state.status = "error"
            
        return state
    
    async def _process_data(self, state: AgentState) -> AgentState:
        """Process and clean FRED data"""
        if state.status == "error":
            return state
            
        try:
            raw_data = state.data["raw_data"]
            observations = raw_data.get("observations", [])
            
            processed_data = []
            for obs in observations:
                if obs["value"] != ".":  # FRED uses "." for missing values
                    processed_data.append({
                        "date": obs["date"],
                        "value": float(obs["value"])
                    })
            
            state.data["processed_data"] = processed_data
            state.status = "data_processed"
            
        except Exception as e:
            state.errors.append(f"Data processing failed: {str(e)}")
            state.status = "error"
            
        return state
    
    async def _validate_data(self, state: AgentState) -> AgentState:
        """Validate processed data"""
        if state.status == "error":
            return state
            
        try:
            processed_data = state.data["processed_data"]
            
            if not processed_data:
                raise ValueError("No valid data points found")
            
            # Add validation metrics
            state.metrics["data_points"] = len(processed_data)
            state.metrics["date_range"] = {
                "start": processed_data[0]["date"],
                "end": processed_data[-1]["date"]
            }
            
            state.status = "completed"
            
        except Exception as e:
            state.errors.append(f"Data validation failed: {str(e)}")
            state.status = "error"
            
        return state

# agents/analysis/market_sizing_agent.py
class MarketSizingAgent(BaseAgent):
    def __init__(self):
        super().__init__("market_sizing_agent", "Market Sizing Agent")
    
    def _build_graph(self) -> StateGraph:
        graph = StateGraph(AgentState)
        
        graph.add_node("calculate_tam", self._calculate_tam)
        graph.add_node("validate_calculation", self._validate_calculation)
        
        graph.set_entry_point("calculate_tam")
        graph.add_edge("calculate_tam", "validate_calculation")
        graph.add_edge("validate_calculation", END)
        
        return graph.compile()
    
    async def _calculate_tam(self, state: AgentState) -> AgentState:
        """Calculate Total Addressable Market"""
        try:
            market_definition = state.data.get("market_definition", {})
            methodology = state.data.get("methodology", "top-down")
            
            # Simple TAM calculation (placeholder for complex logic)
            if methodology == "top-down":
                tam_value = self._calculate_top_down(market_definition)
            elif methodology == "bottom-up":
                tam_value = self._calculate_bottom_up(market_definition)
            else:
                tam_value = self._calculate_hybrid(market_definition)
            
            state.data["tam_result"] = {
                "value": tam_value,
                "methodology": methodology,
                "confidence_score": 0.75,
                "assumptions": market_definition
            }
            
            state.status = "tam_calculated"
            
        except Exception as e:
            state.errors.append(f"TAM calculation failed: {str(e)}")
            state.status = "error"
            
        return state
    
    def _calculate_top_down(self, market_def: Dict[str, Any]) -> float:
        # Simplified calculation
        total_market = market_def.get("total_market_size", 1000000000)
        addressable_percentage = market_def.get("addressable_percentage", 0.1)
        return total_market * addressable_percentage
```

## Phase 1 Deliverables Summary

### Critical Success Metrics
- [ ] Complete project structure with proper TypeScript/Python configuration
- [ ] Working gRPC communication between TypeScript and Python
- [ ] LangGraph foundation with basic agent framework operational
- [ ] LangFlow integration with custom nodes functional
- [ ] Redis state management with persistence working
- [ ] Basic proof of concept with two agents executing successfully

### Technical Debt Items
- Performance optimization for gRPC communication
- Advanced error recovery mechanisms
- Comprehensive monitoring and alerting
- Security hardening for production deployment

### Next Phase Prerequisites
- All foundation components must be functional
- Basic agents must demonstrate successful execution
- Communication infrastructure must handle concurrent requests
- State management must survive service restarts

---

**Phase 1 Completion Criteria**: All tasks must pass acceptance criteria and integration tests before proceeding to Phase 2.

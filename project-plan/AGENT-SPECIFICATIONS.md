# Agent Specifications - Detailed Implementation Guide

## Overview

This document provides comprehensive specifications for implementing each agent in the TAM-MCP-Server agentic architecture. Each specification includes technical interfaces, implementation requirements, and integration guidelines for LLM agents.

The specifications are designed to leverage existing MCP servers from the [Model Context Protocol ecosystem](https://github.com/modelcontextprotocol/servers) to minimize custom development and maximize reliability. Each agent specification explicitly references the specific MCP servers and tools it integrates with, following the expanded MCP integration strategy defined in the master project plan.

## MCP Server Ecosystem Integration Strategy

### Core Infrastructure MCP Servers

- **@modelcontextprotocol/server-memory**: Centralized knowledge graph and entity storage
- **@modelcontextprotocol/server-sequential-thinking**: Advanced reasoning and problem decomposition
- **@redis/mcp-server**: High-performance caching and session management
- **@modelcontextprotocol/server-sqlite**: Local data storage and caching
- **@modelcontextprotocol/server-postgres**: Structured data persistence

### Data Integration MCP Servers

- **@firecrawl/firecrawl-mcp-server**: Advanced web content extraction
- **@apify/actors-mcp-server**: Web scraping automation
- **@browserbase/mcp-server-browserbase**: Cloud browser automation
- **@exa/exa-mcp-server**: AI-powered web search
- **@modelcontextprotocol/server-fetch**: HTTP requests and API integration

### Financial & Market Data MCP Servers

- **@alpaca/alpaca-mcp-server**: Market data and trading APIs
- **@stripe/agent-toolkit**: Payment and financial transaction data
- **@coinmarketcap/mcp-server**: Cryptocurrency market data
- **@financial-datasets/mcp-server**: Historical financial data

### Core Economic Data Source MCP Servers

#### Existing MCP Servers (4/8 Data Sources)

- **@calvernaz/alphavantage**: Alpha Vantage API integration (stock prices, fundamentals, economic indicators)
- **@stefanoamorelli/fred-mcp-server**: Federal Reserve Economic Data (FRED) access
- **@stefanoamorelli/nasdaq-data-link-mcp**: Nasdaq Data Link (formerly Quandl) integration
- **@anshumax/world_bank_mcp_server**: World Bank data API access

#### TAM Project MCP Servers to Develop (4/8 Data Sources)

- **@tam-project/bls-mcp-server**: Bureau of Labor Statistics API integration (to be developed)
- **@tam-project/census-mcp-server**: US Census Bureau API integration (to be developed)
- **@tam-project/imf-mcp-server**: International Monetary Fund API integration (to be developed)
- **@tam-project/oecd-mcp-server**: OECD Statistics API integration (to be developed)

**Goal**: Achieve 100% MCP server coverage for all 8 core economic data sources, eliminating the need for custom adapters and creating reusable community resources.

## MCP Server Development Strategy

### Overview

To achieve our goal of 100% MCP server coverage for economic data sources, we will develop 4 new MCP servers for the remaining data sources: BLS, Census, IMF, and OECD. These servers will follow the Model Context Protocol standard and be designed for maximum reusability by the community.

### Development Principles

1. **Standard Compliance**: Full adherence to MCP protocol specifications
2. **Community Reusability**: Designed for use beyond this project
3. **Production Readiness**: Enterprise-grade error handling and reliability
4. **Comprehensive Coverage**: Support for all major APIs of each data source
5. **TypeScript Implementation**: For consistency with existing MCP ecosystem
6. **Open Source**: MIT licensed for maximum adoption

### @tam-project/bls-mcp-server Specification

**Purpose**: Bureau of Labor Statistics API integration for employment, inflation, and labor market data

**Key Features**:
- Public Data API v2 integration
- Series data retrieval with flexible date ranges
- Support for all major BLS datasets (CPS, CES, CPI, PPI, etc.)
- Automatic data quality validation
- Rate limiting and API key management

**MCP Tools Schema**:
```json
{
  "tools": [
    {
      "name": "get_series_data",
      "description": "Retrieve time series data from BLS",
      "inputSchema": {
        "type": "object",
        "properties": {
          "series_ids": {
            "type": "array",
            "items": {"type": "string"},
            "description": "BLS series IDs (e.g., 'LAUCN040010000000005')"
          },
          "start_year": {"type": "string", "description": "Start year (YYYY)"},
          "end_year": {"type": "string", "description": "End year (YYYY)"},
          "calculations": {"type": "boolean", "description": "Include calculations"},
          "annual_averages": {"type": "boolean", "description": "Include annual averages"}
        },
        "required": ["series_ids"]
      }
    },
    {
      "name": "search_series",
      "description": "Search for BLS data series",
      "inputSchema": {
        "type": "object",
        "properties": {
          "keywords": {"type": "string", "description": "Search keywords"},
          "survey_abbreviation": {"type": "string", "description": "Survey code (CPS, CES, etc.)"},
          "area_code": {"type": "string", "description": "Geographic area code"}
        },
        "required": ["keywords"]
      }
    },
    {
      "name": "get_area_data",
      "description": "Get geographic area information",
      "inputSchema": {
        "type": "object",
        "properties": {
          "area_type": {"type": "string", "enum": ["state", "msa", "county"]},
          "area_code": {"type": "string", "description": "Specific area code"}
        }
      }
    }
  ]
}
```

**Implementation Timeline**: 2 weeks
**Dependencies**: BLS API key (free registration)
**Testing Strategy**: Automated tests against BLS sandbox environment

### @tam-project/census-mcp-server Specification

**Purpose**: US Census Bureau API integration for demographic, economic, and business data

**Key Features**:
- American Community Survey (ACS) data access
- Economic Census and County Business Patterns
- Population estimates and projections
- Geographic boundary data integration
- NAICS industry classification support

**MCP Tools Schema**:
```json
{
  "tools": [
    {
      "name": "get_acs_data",
      "description": "Retrieve American Community Survey data",
      "inputSchema": {
        "type": "object",
        "properties": {
          "dataset": {"type": "string", "enum": ["acs1", "acs5"], "description": "ACS dataset"},
          "year": {"type": "string", "description": "Data year"},
          "variables": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Census variable codes"
          },
          "geography": {"type": "string", "description": "Geographic level"},
          "state": {"type": "string", "description": "State FIPS code"},
          "county": {"type": "string", "description": "County FIPS code"}
        },
        "required": ["dataset", "year", "variables", "geography"]
      }
    },
    {
      "name": "get_business_patterns",
      "description": "County Business Patterns data",
      "inputSchema": {
        "type": "object",
        "properties": {
          "year": {"type": "string", "description": "Data year"},
          "naics_codes": {
            "type": "array",
            "items": {"type": "string"},
            "description": "NAICS industry codes"
          },
          "geography": {"type": "string", "description": "Geographic level"},
          "state": {"type": "string", "description": "State FIPS code"}
        },
        "required": ["year", "geography"]
      }
    },
    {
      "name": "search_variables",
      "description": "Search Census variables by keyword",
      "inputSchema": {
        "type": "object",
        "properties": {
          "keywords": {"type": "string", "description": "Search terms"},
          "dataset": {"type": "string", "description": "Dataset to search"},
          "year": {"type": "string", "description": "Data year"}
        },
        "required": ["keywords"]
      }
    }
  ]
}
```

**Implementation Timeline**: 2 weeks
**Dependencies**: Census API key (free registration)
**Testing Strategy**: Integration tests with multiple geographic levels

### @tam-project/imf-mcp-server Specification

**Purpose**: International Monetary Fund API integration for global economic and financial data

**Key Features**:
- World Economic Outlook (WEO) database access
- International Financial Statistics (IFS)
- Balance of Payments and International Investment Position
- Government Finance Statistics
- Multiple data format support (JSON, XML)

**MCP Tools Schema**:
```json
{
  "tools": [
    {
      "name": "get_weo_data",
      "description": "World Economic Outlook data",
      "inputSchema": {
        "type": "object",
        "properties": {
          "countries": {
            "type": "array",
            "items": {"type": "string"},
            "description": "ISO country codes"
          },
          "indicators": {
            "type": "array",
            "items": {"type": "string"},
            "description": "WEO indicator codes"
          },
          "start_year": {"type": "string", "description": "Start year"},
          "end_year": {"type": "string", "description": "End year"}
        },
        "required": ["countries", "indicators"]
      }
    },
    {
      "name": "get_ifs_data",
      "description": "International Financial Statistics",
      "inputSchema": {
        "type": "object",
        "properties": {
          "countries": {
            "type": "array",
            "items": {"type": "string"},
            "description": "ISO country codes"
          },
          "indicators": {
            "type": "array",
            "items": {"type": "string"},
            "description": "IFS indicator codes"
          },
          "frequency": {"type": "string", "enum": ["A", "Q", "M"], "description": "Data frequency"},
          "start_period": {"type": "string", "description": "Start period"},
          "end_period": {"type": "string", "description": "End period"}
        },
        "required": ["countries", "indicators"]
      }
    },
    {
      "name": "search_indicators",
      "description": "Search IMF indicators",
      "inputSchema": {
        "type": "object",
        "properties": {
          "keywords": {"type": "string", "description": "Search keywords"},
          "database": {"type": "string", "enum": ["WEO", "IFS", "BOP", "GFS"], "description": "Database to search"}
        },
        "required": ["keywords"]
      }
    }
  ]
}
```

**Implementation Timeline**: 2 weeks
**Dependencies**: IMF API (no key required for public data)
**Testing Strategy**: Cross-validation with official IMF datasets

### @tam-project/oecd-mcp-server Specification

**Purpose**: OECD Statistics API integration for international economic comparisons and policy data

**Key Features**:
- OECD.Stat API integration
- Support for 200+ statistical datasets
- Country, indicator, and time dimension filtering
- Metadata and structure information access
- Multi-language support for indicators

**MCP Tools Schema**:
```json
{
  "tools": [
    {
      "name": "get_dataset_data",
      "description": "Retrieve OECD dataset data",
      "inputSchema": {
        "type": "object",
        "properties": {
          "dataset_id": {"type": "string", "description": "OECD dataset identifier"},
          "countries": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Country codes (ISO3)"
          },
          "indicators": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Indicator codes"
          },
          "start_time": {"type": "string", "description": "Start time period"},
          "end_time": {"type": "string", "description": "End time period"},
          "frequency": {"type": "string", "description": "Data frequency"}
        },
        "required": ["dataset_id"]
      }
    },
    {
      "name": "get_datasets_list",
      "description": "List available OECD datasets",
      "inputSchema": {
        "type": "object",
        "properties": {
          "keywords": {"type": "string", "description": "Filter datasets by keywords"},
          "theme": {"type": "string", "description": "Thematic area filter"}
        }
      }
    },
    {
      "name": "get_data_structure",
      "description": "Get dataset structure and metadata",
      "inputSchema": {
        "type": "object",
        "properties": {
          "dataset_id": {"type": "string", "description": "OECD dataset identifier"}
        },
        "required": ["dataset_id"]
      }
    }
  ]
}
```

**Implementation Timeline**: 2 weeks
**Dependencies**: OECD.Stat API (public access)
**Testing Strategy**: Validation against multiple OECD datasets

### Development Phases

**Phase 0: Planning and Setup (Week 1)**
- Repository setup for each MCP server
- TypeScript project structure and build configuration
- API documentation research and endpoint mapping
- Community contribution guidelines preparation

**Phase 1: Core Implementation (Weeks 2-3)**
- Parallel development of all 4 MCP servers
- Basic tool implementation for each server
- Error handling and rate limiting
- Unit test suites for each server

**Phase 2: Integration and Testing (Weeks 4-5)**
- Integration testing with TAM-MCP-Server agents
- Cross-validation of data consistency
- Performance optimization and caching
- Documentation and API reference generation

**Phase 3: Community Release (Weeks 6-7)**
- Open source release with MIT license
- NPM package publication
- Community documentation and examples
- Integration with MCP server ecosystem

**Phase 4: Agent Integration Update (Week 8)**
- Update Economic Indicators Agent to use new MCP servers
- Remove custom adapters from codebase
- Performance validation and optimization
- Complete documentation update

### Success Metrics

- **Coverage**: 100% of 8 economic data sources using MCP servers
- **Performance**: <500ms average response time for data requests
- **Reliability**: 99.9% uptime for all MCP servers
- **Community Adoption**: >100 GitHub stars across all 4 servers
- **Documentation**: Complete API documentation and usage examples
- **Testing**: >90% code coverage for all MCP servers

## Web Automation & Testing MCP Servers

- **@puppeteer/mcp-server**: Browser automation and scraping
- **@playwright/mcp-server**: Testing, PDF generation, screenshots
- **@browserbase/mcp-server**: Cloud-based browser automation

## Analytics & Monitoring MCP Servers

- **@grafana/mcp-grafana**: Metrics visualization and dashboards
- **@datadog/datadog-mcp-server**: Application performance monitoring
- **@quickchart/mcp-server**: Chart generation and data visualization
- **@elastic/elasticsearch-mcp-server**: Search and analytics

## Communication & Collaboration MCP Servers

- **@human-in-the-loop/mcp-server**: Human feedback and approval workflows
- **@pushover/pushover-mcp-server**: Mobile notifications
- **@email/mcp-server**: Email communication
- **@slack/slack-mcp-server**: Team collaboration
- **@notion/notion-mcp-server**: Knowledge management

## Cloud Infrastructure MCP Servers

- **@aws/mcp-server**: Amazon Web Services integration
- **@azure/azure-mcp**: Microsoft Azure services
- **@pulumi/mcp-server**: Infrastructure as Code
- **@cloudflare/mcp-server-cloudflare**: CDN and edge services

## Database & Vector Storage MCP Servers

- **@mongodb-js/mongodb-mcp-server**: Document database integration
- **@pinecone-io/pinecone-mcp**: Vector database for AI embeddings
- **@astra-db/astra-db-mcp**: Distributed database services

## Security & Compliance MCP Servers

- **@contrast-security/mcp-contrast**: Application security testing
- **@burp-suite/mcp-server**: Web application security scanning
- **@snyk/snyk-mcp-server**: Vulnerability scanning and monitoring

## AI & ML Enhancement MCP Servers

- **@openai/openai-websearch-mcp**: AI-powered web search
- **@perplexity/mcp-server**: AI research and question answering
- **@anthropic/claude-mcp**: Advanced language model integration

## Technical Framework Standards

### LangGraph Implementation Requirements

All agents must implement the following LangGraph standards:

```python
from langgraph.graph import StateGraph, END
from langchain_core.tools import BaseTool
from typing import Dict, Any, List, Optional
from ..core.base_agent import BaseAgent, AgentState

class StandardAgentImplementation(BaseAgent):
    def __init__(self, agent_id: str, name: str, mcp_clients: Dict[str, MCPClient]):
        super().__init__(agent_id, name)
        self.mcp_clients = mcp_clients
    
    def _build_graph(self) -> StateGraph:
        """All agents must implement this method with proper LangGraph structure"""
        graph = StateGraph(AgentState)
        
        # Required nodes for all agents
        graph.add_node("validate_input", self._validate_input)
        graph.add_node("execute_core_logic", self._execute_core_logic)
        graph.add_node("validate_output", self._validate_output)
        
        # Required workflow structure
        graph.set_entry_point("validate_input")
        graph.add_conditional_edges(
            "validate_input",
            self._route_after_validation,
            {"proceed": "execute_core_logic", "error": END}
        )
        graph.add_edge("execute_core_logic", "validate_output")
        graph.add_edge("validate_output", END)
        
        return graph.compile()
```

### MCP Integration Base Class

All agents must inherit from the MCP-integrated base class:

```python
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from ..mcp.client_bridge import MCPClientBridge

class MCPIntegratedAgent(ABC):
    """Base class for all agents with MCP server integration"""
    
    def __init__(self, agent_id: str, mcp_clients: Dict[str, MCPClient]):
        self.agent_id = agent_id
        self.mcp_clients = mcp_clients
        self.required_mcp_servers = []
        
    @abstractmethod
    async def validate_mcp_connections(self) -> bool:
        """Validate that all required MCP servers are available"""
        pass
    
    @abstractmethod
    async def execute_primary_workflow(self, request: Any) -> Any:
        """Execute the agent's primary workflow using MCP servers"""
        pass
```

---

## Economic Indicators Agent Specification

**Agent ID**: `economic_indicators_agent`  
**Purpose**: Macroeconomic data acquisition and trend analysis across 8 core data sources  
**MCP Dependencies**:

- **Phase 1 (Existing MCP Servers - 4/8 sources)**: `@calvernaz/alphavantage`, `@stefanoamorelli/fred-mcp-server`, `@anshumax/world_bank_mcp_server`, `@stefanoamorelli/nasdaq-data-link-mcp`
- **Phase 2 (TAM Project MCP Servers - 4/8 sources)**: `@tam-project/bls-mcp-server`, `@tam-project/census-mcp-server`, `@tam-project/imf-mcp-server`, `@tam-project/oecd-mcp-server`
- **Infrastructure MCP Servers**: `@modelcontextprotocol/server-sequential-thinking`, `@modelcontextprotocol/server-memory`

### Eight Core Data Source Integration Strategy

**Current State (Phase 1): Hybrid MCP/Custom Approach (4/8 MCP servers)**:

1. **Alpha Vantage** (`@calvernaz/alphavantage`) - ✅ Available
2. **FRED** (`@stefanoamorelli/fred-mcp-server`) - ✅ Available  
3. **World Bank** (`@anshumax/world_bank_mcp_server`) - ✅ Available
4. **Nasdaq Data Link** (`@stefanoamorelli/nasdaq-data-link-mcp`) - ✅ Available
5. **BLS** - 🔧 Custom adapter (temporary)
6. **Census** - 🔧 Custom adapter (temporary)
7. **IMF** - 🔧 Custom adapter (temporary)
8. **OECD** - 🔧 Custom adapter (temporary)

**Target State (Phase 2): Pure MCP Approach (8/8 MCP servers)**:

1. **Alpha Vantage** (`@calvernaz/alphavantage`) - ✅ Available
2. **FRED** (`@stefanoamorelli/fred-mcp-server`) - ✅ Available
3. **World Bank** (`@anshumax/world_bank_mcp_server`) - ✅ Available
4. **Nasdaq Data Link** (`@stefanoamorelli/nasdaq-data-link-mcp`) - ✅ Available
5. **BLS** (`@tam-project/bls-mcp-server`) - 🚀 To be developed
6. **Census** (`@tam-project/census-mcp-server`) - 🚀 To be developed
7. **IMF** (`@tam-project/imf-mcp-server`) - 🚀 To be developed
8. **OECD** (`@tam-project/oecd-mcp-server`) - 🚀 To be developed

### Technical Interface Definition

#### Current Implementation (Phase 1: Hybrid Approach)

```python
class EconomicIndicatorsAgent(MCPIntegratedAgent):
    def __init__(self, mcp_clients: Dict[str, MCPClient]):
        super().__init__("economic_indicators_agent", mcp_clients)
        # Primary MCP servers for direct data access (4/8 sources)
        self.required_mcp_servers = [
            "alphavantage", "fred", "world_bank", "nasdaq_data_link", 
            "sequential_thinking", "memory"
        ]
        # Custom adapters for remaining sources (4/8 sources)
        self.custom_data_services = {
            "bls": BlsService(),
            "census": CensusService(), 
            "imf": ImfService(),
            "oecd": OecdService()
        }
    
    async def fetch_comprehensive_economic_data(self, request: EconomicDataRequest) -> ComprehensiveEconomicDataSet:
        """Fetch economic data from all 8 core data sources, prioritizing MCP servers where available"""
        
        economic_data = {}
        
        # Use existing MCP servers (4/8 sources)
        if "alpha_vantage" in request.sources:
            av_data = await self.mcp_clients['alphavantage'].call_tool("get_company_overview", {
                "symbol": request.av_symbols[0] if request.av_symbols else "AAPL"
            })
            if request.av_indicators:
                economic_indicators = await self.mcp_clients['alphavantage'].call_tool("get_economic_indicators", {
                    "indicators": request.av_indicators,
                    "interval": request.interval
                })
                av_data.update(economic_indicators)
            economic_data["alpha_vantage"] = av_data
        
        if "fred" in request.sources:
            fred_data = await self.mcp_clients['fred'].call_tool("get_economic_data", {
                "series_ids": request.fred_series,
                "start_date": request.start_date,
                "end_date": request.end_date,
                "frequency": request.frequency
            })
            economic_data["fred"] = fred_data
        
        if "world_bank" in request.sources:
            wb_data = await self.mcp_clients['world_bank'].call_tool("get_indicator_data", {
                "country_codes": request.countries,
                "indicator_codes": request.wb_indicators,
                "date_range": f"{request.start_date}:{request.end_date}"
            })
            economic_data["world_bank"] = wb_data
        
        if "nasdaq_data_link" in request.sources:
            ndl_data = await self.mcp_clients['nasdaq_data_link'].call_tool("get_dataset", {
                "database_codes": request.ndl_databases,
                "dataset_codes": request.ndl_datasets,
                "start_date": request.start_date,
                "end_date": request.end_date
            })
            economic_data["nasdaq_data_link"] = ndl_data
        
        # Use custom adapters for remaining sources (4/8)
        if "bls" in request.sources:
            bls_data = await self.custom_data_services["bls"].get_series_data(
                series_ids=request.bls_series,
                start_year=request.start_date.year,
                end_year=request.end_date.year
            )
            economic_data["bls"] = bls_data
        
        if "census" in request.sources:
            census_data = await self.custom_data_services["census"].fetch_industry_data(
                variables=request.census_variables,
                geography=request.geography,
                naics_codes=request.census_naics
            )
            economic_data["census"] = census_data
        
        if "imf" in request.sources:
            imf_data = await self.custom_data_services["imf"].fetch_dataset(
                dataflow_id=request.imf_dataflow,
                countries=request.countries,
                indicators=request.imf_indicators,
                start_period=request.start_date,
                end_period=request.end_date
            )
            economic_data["imf"] = imf_data
        
        if "oecd" in request.sources:
            oecd_data = await self.custom_data_services["oecd"].get_indicators(
                dataset_id=request.oecd_dataset_id,
                countries=request.countries,
                indicators=request.oecd_indicators,
                start_time=request.start_date,
                end_time=request.end_date
            )
            economic_data["oecd"] = oecd_data
        
        # Store all data in memory MCP for trend analysis
        await self.mcp_clients['memory'].call_tool("add_observations", {
            "observations": [
                {
                    "entityName": f"economic_data_{request.request_id}",
                    "contents": [f"Retrieved data from {len(economic_data)} sources at {datetime.now()}"]
                }
            ]
        })
        
        return ComprehensiveEconomicDataSet(
            request_id=request.request_id,
            data_sources=list(economic_data.keys()),
            data=economic_data,
            metadata={
                "collection_timestamp": datetime.now(),
                "data_quality_score": self._calculate_data_quality(economic_data)
            }
        )
```

# Testing Framework - Comprehensive Quality Assurance Strategy

## Overview

This document defines the comprehensive testing framework for the TAM-MCP-Server agentic architecture. The framework ensures quality, reliability, and performance across all agents and workflows.

## Testing Philosophy

### Quality Gates
1. **Unit Testing**: Individual agent functionality validation
2. **Integration Testing**: Inter-agent communication and workflow validation
3. **End-to-End Testing**: Complete user journey validation
4. **Performance Testing**: Load, stress, and scalability validation
5. **Security Testing**: Vulnerability assessment and compliance validation

### Coverage Requirements
- **Code Coverage**: 90%+ for all production code
- **Scenario Coverage**: 100% of defined user scenarios
- **Error Path Coverage**: 95% of error scenarios tested
- **Integration Coverage**: All agent-to-agent interactions tested

## Test Categories and Implementation

### 1. Unit Testing Framework

#### Agent Unit Testing Template

```python
# tests/unit/agents/test_agent_template.py
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from agents.core.base_agent import AgentState
from agents.data_acquisition.financial_markets_agent import FinancialMarketsAgent

class TestFinancialMarketsAgent:
    """Template for comprehensive agent unit testing"""
    
    @pytest.fixture
    def agent(self):
        """Create agent instance with mocked dependencies"""
        with patch('agents.data_acquisition.financial_markets_agent.AlphaVantageClient') as mock_av, \
             patch('agents.data_acquisition.financial_markets_agent.NasdaqClient') as mock_nasdaq:
            agent = FinancialMarketsAgent("test_av_key", "test_nasdaq_key")
            agent.api_clients["alpha_vantage"] = mock_av
            agent.api_clients["nasdaq"] = mock_nasdaq
            return agent
    
    @pytest.fixture
    def sample_state(self):
        """Create sample agent state for testing"""
        return AgentState(
            input_data={
                "request": {
                    "symbols": ["AAPL", "MSFT"],
                    "analysis_type": "full"
                }
            }
        )
    
    # Input Validation Tests
    async def test_validate_request_success(self, agent, sample_state):
        """Test successful request validation"""
        result = await agent._validate_request(sample_state)
        
        assert result.status == "validated"
        assert "validated_request" in result.data
        assert len(result.errors) == 0
    
    async def test_validate_request_missing_symbols(self, agent):
        """Test validation failure with missing symbols"""
        state = AgentState(input_data={"request": {"analysis_type": "full"}})
        result = await agent._validate_request(state)
        
        assert result.status == "error"
        assert len(result.errors) > 0
        assert "Missing required parameter: symbols" in result.errors[0]
    
    async def test_validate_request_invalid_symbols(self, agent):
        """Test validation failure with invalid symbol format"""
        state = AgentState(
            input_data={
                "request": {
                    "symbols": ["TOOLONGSYMBOL123"],
                    "analysis_type": "full"
                }
            }
        )
        result = await agent._validate_request(state)
        
        assert result.status == "error"
        assert "Invalid symbol format" in result.errors[0]
    
    # Core Functionality Tests
    async def test_fetch_market_data_success(self, agent, sample_state):
        """Test successful market data fetch"""
        # Mock API response
        mock_response = {
            "Meta Data": {"2. Symbol": "AAPL"},
            "Time Series (Daily)": {
                "2024-01-01": {
                    "1. open": "150.00",
                    "2. high": "155.00", 
                    "3. low": "149.00",
                    "4. close": "154.00",
                    "6. volume": "1000000"
                }
            }
        }
        
        with patch('httpx.AsyncClient.get') as mock_get:
            mock_get.return_value.status_code = 200
            mock_get.return_value.json.return_value = mock_response
            
            state = sample_state
            state.data["validated_request"] = state.input_data["request"]
            state.status = "validated"
            
            result = await agent._fetch_market_data(state)
            
            assert result.status == "market_data_fetched"
            assert "market_data" in result.data
            assert "AAPL" in result.data["market_data"]
    
    async def test_fetch_market_data_api_error(self, agent, sample_state):
        """Test market data fetch with API error"""
        with patch('httpx.AsyncClient.get') as mock_get:
            mock_get.return_value.status_code = 400
            
            state = sample_state
            state.data["validated_request"] = state.input_data["request"]
            state.status = "validated"
            
            result = await agent._fetch_market_data(state)
            
            assert result.status == "error"
            assert len(result.errors) > 0
    
    # Technical Analysis Tests
    async def test_calculate_technical_indicators(self, agent):
        """Test technical indicator calculations"""
        state = AgentState()
        state.data["market_data"] = {
            "AAPL": {
                "time_series": [
                    {"date": f"2024-01-{i:02d}", "close": 150 + i, "volume": 1000000}
                    for i in range(1, 31)
                ]
            }
        }
        state.status = "market_data_fetched"
        
        result = await agent._calculate_technical_indicators(state)
        
        assert result.status == "technical_analysis_complete"
        assert "technical_indicators" in result.data
        assert "AAPL" in result.data["technical_indicators"]
        
        indicators = result.data["technical_indicators"]["AAPL"]
        assert "sma_20" in indicators
        assert "rsi" in indicators
        assert "macd" in indicators
        assert "bollinger_bands" in indicators
    
    # Performance Tests
    async def test_performance_requirements(self, agent, sample_state):
        """Test agent meets performance requirements"""
        import time
        
        state = sample_state
        state.data["validated_request"] = state.input_data["request"]
        
        with patch('httpx.AsyncClient.get') as mock_get:
            mock_get.return_value.status_code = 200
            mock_get.return_value.json.return_value = {"Meta Data": {}, "Time Series (Daily)": {}}
            
            start_time = time.time()
            await agent._fetch_market_data(state)
            execution_time = time.time() - start_time
            
            # Should complete within 5 seconds
            assert execution_time < 5.0
    
    # Error Handling Tests
    async def test_error_recovery(self, agent, sample_state):
        """Test error recovery mechanisms"""
        state = sample_state
        state.status = "error"
        state.errors = ["Previous error"]
        
        # Agent should not process further when in error state
        result = await agent._fetch_market_data(state)
        assert result.status == "error"
        assert "Previous error" in result.errors
    
    # State Management Tests
    async def test_state_persistence(self, agent, sample_state):
        """Test state persistence and recovery"""
        # Test that state modifications persist correctly
        original_data = sample_state.input_data.copy()
        
        result = await agent._validate_request(sample_state)
        
        # Original input should be preserved
        assert result.input_data == original_data
        # New validated data should be added
        assert "validated_request" in result.data
```

#### Data Quality Testing

```python
# tests/unit/data_quality/test_data_validation.py
class TestDataQualityValidation:
    """Test data quality validation across all agents"""
    
    def test_financial_data_validation(self):
        """Test financial data meets quality standards"""
        sample_data = {
            "symbol": "AAPL",
            "price": 150.00,
            "volume": 1000000,
            "date": "2024-01-01"
        }
        
        validator = FinancialDataValidator()
        result = validator.validate(sample_data)
        
        assert result.is_valid
        assert result.quality_score >= 0.8
        assert len(result.warnings) == 0
    
    def test_economic_data_validation(self):
        """Test economic data meets quality standards"""
        sample_data = {
            "series_id": "GDP",
            "value": 25000.0,
            "date": "2024-Q1",
            "units": "Billions of Dollars"
        }
        
        validator = EconomicDataValidator()
        result = validator.validate(sample_data)
        
        assert result.is_valid
        assert result.completeness_score >= 0.9
    
    def test_missing_data_handling(self):
        """Test handling of missing data points"""
        incomplete_data = {
            "symbol": "AAPL",
            "price": None,  # Missing price
            "volume": 1000000
        }
        
        validator = FinancialDataValidator()
        result = validator.validate(incomplete_data)
        
        assert not result.is_valid
        assert "missing_price" in result.errors
```

### 2. Integration Testing Framework

#### Agent Communication Testing

```python
# tests/integration/test_agent_communication.py
class TestAgentCommunication:
    """Test inter-agent communication patterns"""
    
    @pytest.fixture
    async def agent_registry(self):
        """Set up agent registry for testing"""
        registry = AgentRegistry(redis_client=await redis.from_url("redis://localhost"))
        
        # Register test agents
        financial_agent = FinancialMarketsAgent("test_key", "test_key")
        market_sizing_agent = MarketSizingAgent()
        
        registry.register_agent(financial_agent)
        registry.register_agent(market_sizing_agent)
        
        return registry
    
    async def test_data_flow_financial_to_market_sizing(self, agent_registry):
        """Test data flow from financial agent to market sizing agent"""
        # Execute financial data collection
        financial_result = await agent_registry.execute_agent(
            "financial_markets_agent",
            {"symbols": ["AAPL"], "analysis_type": "fundamentals"}
        )
        
        assert financial_result["status"] == "success"
        
        # Use financial data for market sizing
        market_sizing_input = {
            "market_definition": {
                "industry": "Technology",
                "company_data": financial_result["data"]
            },
            "methodology": "bottom-up"
        }
        
        market_sizing_result = await agent_registry.execute_agent(
            "market_sizing_agent",
            market_sizing_input
        )
        
        assert market_sizing_result["status"] == "success"
        assert "tam_calculation" in market_sizing_result["data"]
    
    async def test_parallel_agent_execution(self, agent_registry):
        """Test parallel execution of multiple agents"""
        import asyncio
        
        tasks = [
            agent_registry.execute_agent("financial_markets_agent", {"symbols": ["AAPL"]}),
            agent_registry.execute_agent("financial_markets_agent", {"symbols": ["MSFT"]}),
            agent_registry.execute_agent("financial_markets_agent", {"symbols": ["GOOGL"]})
        ]
        
        results = await asyncio.gather(*tasks)
        
        # All executions should succeed
        for result in results:
            assert result["status"] == "success"
    
    async def test_error_propagation(self, agent_registry):
        """Test error propagation between agents"""
        # Inject error in first agent
        with patch.object(agent_registry.get_agent("financial_markets_agent"), "run", side_effect=Exception("API Error")):
            result = await agent_registry.execute_agent(
                "financial_markets_agent",
                {"symbols": ["INVALID"]}
            )
            
            assert result["status"] == "error"
            assert "API Error" in result["error"]
```

#### Workflow Integration Testing

```python
# tests/integration/test_workflow_execution.py
class TestWorkflowExecution:
    """Test complete workflow execution patterns"""
    
    async def test_comprehensive_market_analysis_workflow(self):
        """Test complete market analysis workflow"""
        workflow_coordinator = WorkflowCoordinatorAgent(redis_client)
        research_director = ResearchDirectorAgent()
        
        # Create research request
        research_request = ResearchRequest(
            query="Analyze the TAM for cloud computing services in North America",
            priority="high",
            scope=ResearchScope(
                geographies=["North America"],
                industries=["Technology", "Cloud Computing"],
                analysis_types=["market_sizing", "competitive_analysis", "trend_analysis"]
            )
        )
        
        # Execute workflow
        research_plan = await research_director.analyze_research_request(research_request)
        execution_result = await workflow_coordinator.execute_workflow(research_plan)
        
        # Validate results
        assert execution_result.status == "completed"
        assert execution_result.quality_score >= 0.8
        assert "market_sizing" in execution_result.results
        assert "competitive_analysis" in execution_result.results
        assert "trend_analysis" in execution_result.results
    
    async def test_workflow_recovery_from_failure(self):
        """Test workflow recovery mechanisms"""
        # Simulate agent failure during execution
        with patch('agents.data_acquisition.financial_markets_agent.FinancialMarketsAgent.run') as mock_agent:
            mock_agent.side_effect = [Exception("Network Error"), {"status": "success"}]  # Fail then succeed
            
            workflow_coordinator = WorkflowCoordinatorAgent(redis_client)
            
            # Execute workflow with retry
            result = await workflow_coordinator.execute_with_retry(workflow_plan, max_retries=2)
            
            assert result.status == "completed"
            assert result.retry_count == 1
```

### 3. End-to-End Testing Framework

#### User Journey Testing

```python
# tests/e2e/test_user_journeys.py
class TestUserJourneys:
    """Test complete user interaction scenarios"""
    
    async def test_market_research_query_journey(self):
        """Test complete market research query from input to output"""
        # Simulate user query
        user_query = "What is the total addressable market for AI-powered healthcare solutions in the US?"
        
        # Process through MCP server
        mcp_client = MCPTestClient()
        response = await mcp_client.send_request("research_query", {"query": user_query})
        
        # Validate response structure
        assert response["status"] == "completed"
        assert "market_size" in response["results"]
        assert "competitive_landscape" in response["results"]
        assert "growth_projections" in response["results"]
        
        # Validate data quality
        market_size = response["results"]["market_size"]
        assert market_size["value"] > 0
        assert market_size["confidence_score"] >= 0.7
        assert "methodology" in market_size
    
    async def test_real_time_monitoring_journey(self):
        """Test real-time market monitoring setup and alerts"""
        # Set up monitoring
        monitoring_request = {
            "symbols": ["AAPL", "MSFT"],
            "alert_thresholds": {
                "price_change": 0.05,  # 5% change
                "volume_spike": 2.0    # 2x average volume
            }
        }
        
        mcp_client = MCPTestClient()
        setup_response = await mcp_client.send_request("setup_monitoring", monitoring_request)
        
        assert setup_response["status"] == "monitoring_active"
        
        # Simulate market event and verify alert
        # This would require mock data injection or test market simulation
```

### 4. Performance Testing Framework

#### Load Testing

```python
# tests/performance/test_load.py
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor

class TestPerformanceLoad:
    """Test system performance under load"""
    
    async def test_concurrent_agent_execution(self):
        """Test system performance with concurrent agent requests"""
        agent_registry = AgentRegistry(redis_client)
        
        # Define test scenarios
        test_requests = [
            {"agent": "financial_markets_agent", "data": {"symbols": [f"TEST{i}"]} 
            for i in range(100)
        ]
        
        start_time = time.time()
        
        # Execute requests concurrently
        tasks = [
            agent_registry.execute_agent(req["agent"], req["data"])
            for req in test_requests
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        execution_time = time.time() - start_time
        
        # Performance assertions
        assert execution_time < 30.0  # Should complete within 30 seconds
        
        successful_requests = [r for r in results if not isinstance(r, Exception)]
        assert len(successful_requests) >= 95  # 95% success rate minimum
    
    async def test_memory_usage_stability(self):
        """Test memory usage remains stable under load"""
        import psutil
        import gc
        
        process = psutil.Process()
        initial_memory = process.memory_info().rss
        
        # Execute multiple workflows
        for i in range(50):
            workflow_result = await execute_test_workflow()
            assert workflow_result["status"] == "success"
            
            # Force garbage collection
            gc.collect()
            
            current_memory = process.memory_info().rss
            memory_increase = (current_memory - initial_memory) / initial_memory
            
            # Memory usage should not increase by more than 50%
            assert memory_increase < 0.5
    
    def test_api_rate_limit_compliance(self):
        """Test compliance with external API rate limits"""
        financial_agent = FinancialMarketsAgent("test_key", "test_key")
        
        # Test Alpha Vantage rate limiting (5 calls per minute)
        start_time = time.time()
        
        for i in range(10):
            # This should be rate limited to 5 calls per minute
            asyncio.run(financial_agent._fetch_alpha_vantage_data("AAPL"))
        
        elapsed_time = time.time() - start_time
        
        # Should take at least 1 minute due to rate limiting
        assert elapsed_time >= 60.0
```

#### Stress Testing

```python
# tests/performance/test_stress.py
class TestStressConditions:
    """Test system behavior under stress conditions"""
    
    async def test_high_volume_data_processing(self):
        """Test processing of large datasets"""
        # Generate large dataset
        large_dataset = generate_large_market_dataset(10000)  # 10K data points
        
        market_sizing_agent = MarketSizingAgent()
        
        start_time = time.time()
        result = await market_sizing_agent.process_large_dataset(large_dataset)
        processing_time = time.time() - start_time
        
        # Should process within reasonable time
        assert processing_time < 60.0  # 1 minute for 10K records
        assert result["status"] == "success"
    
    async def test_resource_exhaustion_recovery(self):
        """Test recovery from resource exhaustion"""
        # Simulate memory exhaustion
        with patch('psutil.virtual_memory') as mock_memory:
            mock_memory.return_value.percent = 95  # 95% memory usage
            
            agent = FinancialMarketsAgent("test_key", "test_key")
            result = await agent.execute_with_resource_check(test_data)
            
            # Should handle resource constraints gracefully
            assert result["status"] in ["success", "resource_limited"]
            assert "memory_warning" in result.get("warnings", [])
```

### 5. Security Testing Framework

#### Security Validation

```python
# tests/security/test_security.py
class TestSecurityValidation:
    """Test security aspects of the system"""
    
    def test_api_key_security(self):
        """Test API key handling and security"""
        agent = FinancialMarketsAgent("test_key", "test_key")
        
        # API keys should not appear in logs
        log_output = capture_log_output(agent.initialize)
        assert "test_key" not in log_output
        
        # API keys should be encrypted in storage
        stored_config = agent.get_stored_configuration()
        assert stored_config["alpha_vantage_key"] != "test_key"  # Should be encrypted
    
    def test_data_sanitization(self):
        """Test input data sanitization"""
        query_agent = QueryUnderstandingAgent()
        
        # Test SQL injection attempt
        malicious_input = "'; DROP TABLE users; --"
        result = query_agent.sanitize_input(malicious_input)
        
        assert "DROP TABLE" not in result
        assert result["is_safe"] == True
    
    def test_access_control(self):
        """Test role-based access control"""
        # Test restricted agent access
        restricted_user = UserContext(role="read_only")
        agent_registry = AgentRegistry(redis_client)
        
        # Should deny access to sensitive agents
        with pytest.raises(AccessDeniedError):
            await agent_registry.execute_agent(
                "financial_markets_agent",
                {"symbols": ["AAPL"]},
                user_context=restricted_user
            )
```

## Test Automation and CI/CD Integration

### Automated Test Execution

```yaml
# .github/workflows/test.yml
name: Comprehensive Testing
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-test.txt
      - name: Run unit tests
        run: pytest tests/unit/ --cov=agents --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v1

  integration-tests:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Run integration tests
        run: pytest tests/integration/
        env:
          REDIS_URL: redis://localhost:6379
          MONGODB_URL: mongodb://localhost:27017

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run performance tests
        run: pytest tests/performance/ --benchmark-only
```

### Test Quality Metrics

```python
# tests/quality/test_metrics.py
class TestQualityMetrics:
    """Monitor and validate test quality metrics"""
    
    def test_code_coverage_threshold(self):
        """Ensure code coverage meets minimum threshold"""
        coverage_report = get_coverage_report()
        assert coverage_report.total_coverage >= 90.0
    
    def test_test_execution_time(self):
        """Monitor test execution time for performance"""
        test_times = get_test_execution_times()
        
        # Unit tests should be fast
        assert test_times["unit"] < 300  # 5 minutes
        # Integration tests can take longer
        assert test_times["integration"] < 1800  # 30 minutes
    
    def test_flaky_test_detection(self):
        """Detect and flag flaky tests"""
        flaky_tests = detect_flaky_tests(test_history=100)
        
        # Should have minimal flaky tests
        assert len(flaky_tests) < 5
        assert all(test.flaky_rate < 0.05 for test in flaky_tests)  # <5% flaky rate
```

## Test Data Management

### Test Data Generation

```python
# tests/utils/data_generators.py
class TestDataGenerator:
    """Generate realistic test data for various scenarios"""
    
    @staticmethod
    def generate_market_data(symbol: str, days: int = 365) -> Dict[str, Any]:
        """Generate realistic market data for testing"""
        base_price = 100.0
        data_points = []
        
        for i in range(days):
            # Simulate realistic price movements
            daily_change = random.normalvariate(0, 0.02)  # 2% daily volatility
            price = base_price * (1 + daily_change)
            
            data_points.append({
                "date": (datetime.now() - timedelta(days=days-i)).strftime("%Y-%m-%d"),
                "open": price * 0.995,
                "high": price * 1.005,
                "low": price * 0.985,
                "close": price,
                "volume": random.randint(500000, 2000000)
            })
            
            base_price = price
        
        return {
            "symbol": symbol,
            "time_series": data_points
        }
    
    @staticmethod
    def generate_economic_data(series_id: str, periods: int = 120) -> Dict[str, Any]:
        """Generate realistic economic indicator data"""
        # Implementation for economic data generation
        pass
```

### Test Environment Management

```python
# tests/utils/environment.py
class TestEnvironmentManager:
    """Manage test environments and configurations"""
    
    def __init__(self):
        self.redis_client = None
        self.mongodb_client = None
        self.test_agents = {}
    
    async def setup_test_environment(self):
        """Set up clean test environment"""
        # Clear test databases
        await self.redis_client.flushdb()
        await self.mongodb_client.drop_database("test_tam_agents")
        
        # Initialize test agents with mock configurations
        self.test_agents = {
            "financial_markets": FinancialMarketsAgent("test_key", "test_key"),
            "market_sizing": MarketSizingAgent(),
            "competitive_intelligence": CompetitiveIntelligenceAgent()
        }
    
    async def cleanup_test_environment(self):
        """Clean up test environment after tests"""
        # Cleanup operations
        pass
```

This comprehensive testing framework ensures quality, reliability, and performance across all aspects of the TAM-MCP-Server agentic architecture. The framework provides LLM agents with clear testing requirements and implementation guidelines for maintaining high code quality throughout the development process.

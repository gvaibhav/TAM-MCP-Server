# MCP Prompts Guide

## Overview

The TAM MCP Server exposes 15 professional business analysis prompts through the Model Context Protocol. These prompts provide investment-grade analysis templates that can be discovered and used by any MCP client.

**💡 Perfect Partner with Default Values**: Combine these business prompts with our [intelligent default values feature](default-values-guide.md) - prompts provide the business context while default values ensure immediate tool functionality without parameter research.

## Key Benefits

- **Native Discovery**: Prompts are automatically discoverable by MCP clients
- **Professional Templates**: Investment-grade analysis frameworks
- **Parameter-Driven**: Dynamic content generation based on business context
- **Immediate Access**: No need to remember complex prompt strategies
- **Consistent Quality**: Professionally structured business analysis

## Prompt Categories

### Strategic Business Analysis (5 prompts)

#### 1. Startup Funding Analysis (`startup-funding-analysis`)
**Description**: Complete investment analysis framework for startup funding rounds

**Parameters**:
- `company_name` (required): The startup company name
- `funding_stage` (required): Current funding stage (pre-seed, seed, Series A, etc.)
- `industry` (required): Primary industry or sector
- `funding_amount` (optional): Target funding amount
- `use_of_funds` (optional): Planned use of raised capital

**Use Case**: VC investment committees, startup pitch evaluations, due diligence

#### 2. Private Equity Research (`pe-research-analysis`)
**Description**: Comprehensive PE investment analysis and due diligence framework

**Parameters**:
- `target_company` (required): Target company for PE investment
- `industry` (required): Industry sector
- `deal_size` (required): Expected transaction size
- `investment_thesis` (optional): Core investment hypothesis
- `exit_strategy` (optional): Planned exit timeline and strategy

**Use Case**: PE deal sourcing, investment committee presentations, portfolio analysis

#### 3. Corporate Strategy Analysis (`corporate-strategy-analysis`)
**Description**: Strategic planning framework for corporate decision-making

**Parameters**:
- `company_name` (required): Company name
- `strategic_initiative` (required): Strategic initiative or decision
- `market_context` (required): Current market environment
- `timeline` (optional): Strategic timeline
- `success_metrics` (optional): Key performance indicators

**Use Case**: Board presentations, strategic planning sessions, M&A evaluations

#### 4. VC Investment Thesis (`vc-investment-thesis`)
**Description**: Venture capital investment thesis development framework

**Parameters**:
- `sector_focus` (required): Investment sector or theme
- `investment_stage` (required): Target investment stage
- `geographic_focus` (required): Geographic investment focus
- `thesis_timeframe` (optional): Investment thesis timeframe
- `market_size` (optional): Target market size criteria

**Use Case**: Fund strategy development, LP presentations, investment committee guidelines

#### 5. Asset Management Strategy (`asset-management-strategy`)
**Description**: Asset management and portfolio strategy analysis

**Parameters**:
- `asset_class` (required): Primary asset class focus
- `investment_strategy` (required): Core investment approach
- `risk_profile` (required): Target risk profile
- `client_segment` (optional): Target client segment
- `performance_benchmark` (optional): Performance benchmark

**Use Case**: Portfolio management, client presentations, investment strategy reviews

### Crisis & Specialized Analysis (5 prompts)

#### 6. Crisis Management (`crisis-management-analysis`)
**Description**: Crisis response and management framework for business disruptions

**Parameters**:
- `crisis_type` (required): Type of crisis or disruption
- `affected_areas` (required): Business areas impacted
- `timeline` (required): Crisis timeline and urgency
- `stakeholders` (optional): Key stakeholders involved
- `resources_available` (optional): Available resources and constraints

**Use Case**: Crisis response teams, board emergency sessions, stakeholder communications

#### 7. Regulatory Impact Analysis (`regulatory-impact-analysis`)
**Description**: Regulatory change impact assessment framework

**Parameters**:
- `regulation_type` (required): Type of regulatory change
- `industry_impact` (required): Industry or sector affected
- `implementation_timeline` (required): Regulatory implementation timeline
- `compliance_requirements` (optional): Key compliance requirements
- `business_implications` (optional): Expected business impact

**Use Case**: Compliance assessments, regulatory strategy, risk management

#### 8. International Expansion (`international-expansion-analysis`)
**Description**: International market entry and expansion analysis

**Parameters**:
- `target_market` (required): Target country or region
- `business_model` (required): Expansion business model
- `entry_strategy` (required): Market entry approach
- `timeline` (optional): Expansion timeline
- `investment_required` (optional): Required investment capital

**Use Case**: Market entry planning, international strategy, expansion committees

#### 9. Technology Disruption Assessment (`technology-disruption-analysis`)
**Description**: Technology disruption impact and response analysis

**Parameters**:
- `technology_type` (required): Disruptive technology or trend
- `industry_context` (required): Industry being disrupted
- `disruption_timeline` (required): Timeline of disruption impact
- `competitive_response` (optional): Required competitive response
- `investment_implications` (optional): Investment and resource implications

**Use Case**: Innovation strategy, digital transformation, competitive analysis

#### 10. ESG Analysis (`esg-analysis`)
**Description**: Environmental, Social, and Governance analysis framework

**Parameters**:
- `esg_focus` (required): Primary ESG focus area
- `industry_context` (required): Industry or sector context
- `stakeholder_priorities` (required): Key stakeholder ESG priorities
- `measurement_framework` (optional): ESG measurement approach
- `implementation_timeline` (optional): ESG implementation timeline

**Use Case**: ESG reporting, sustainable investing, stakeholder engagement

### Quick Analysis & Guidance (5 prompts)

#### 11. Market Opportunity Scan (`market-opportunity-scan`)
**Description**: Rapid market opportunity identification and assessment

**Parameters**:
- `market_segment` (required): Target market segment
- `geographic_scope` (required): Geographic market scope
- `opportunity_type` (required): Type of market opportunity
- `assessment_urgency` (optional): Assessment timeline urgency
- `resource_constraints` (optional): Available resources for assessment

**Use Case**: Business development, opportunity prioritization, market research

#### 12. Competitive Intelligence (`competitive-intelligence-brief`)
**Description**: Competitive analysis and intelligence gathering framework

**Parameters**:
- `competitor_focus` (required): Primary competitor or competitive set
- `analysis_scope` (required): Scope of competitive analysis
- `intelligence_priority` (required): Priority intelligence areas
- `decision_context` (optional): Decision-making context
- `information_sources` (optional): Available information sources

**Use Case**: Competitive strategy, market positioning, strategic planning

#### 13. Investment Screening (`investment-screening-framework`)
**Description**: Investment opportunity screening and initial assessment

**Parameters**:
- `investment_type` (required): Type of investment opportunity
- `screening_criteria` (required): Primary screening criteria
- `risk_tolerance` (required): Risk tolerance parameters
- `investment_size` (optional): Target investment size range
- `timeline_constraints` (optional): Investment timeline requirements

**Use Case**: Deal flow management, investment committees, portfolio screening

#### 14. TAM Tools Guidance (`tam-tools-guidance`)
**Description**: Guidance on using TAM MCP Server tools effectively

**Parameters**:
- `analysis_objective` (required): Primary analysis objective
- `data_requirements` (required): Required data types
- `analysis_complexity` (required): Analysis complexity level
- `output_format` (optional): Preferred output format
- `stakeholder_audience` (optional): Target audience for analysis

**Use Case**: Tool selection, analysis planning, workflow optimization

#### 15. Best Practices Guide (`business-analysis-best-practices`)
**Description**: Business analysis best practices and methodologies

**Parameters**:
- `analysis_type` (required): Type of business analysis
- `organizational_context` (required): Organizational context
- `stakeholder_requirements` (required): Key stakeholder requirements
- `quality_standards` (optional): Quality and accuracy standards
- `delivery_timeline` (optional): Analysis delivery timeline

**Use Case**: Analysis quality assurance, methodology selection, training

## Using MCP Prompts

### In Claude Desktop

1. **Discover Prompts**: Type `@tam-server` to see available prompts
2. **Select Prompt**: Choose from the 15 business analysis prompts
3. **Provide Parameters**: Fill in required and optional parameters
4. **Generate Content**: Receive professional analysis template

### In Custom MCP Clients

```typescript
// List available prompts
const prompts = await client.request({
  method: "prompts/list"
});

// Get specific prompt with parameters
const prompt = await client.request({
  method: "prompts/get",
  params: {
    name: "startup-funding-analysis",
    arguments: {
      company_name: "TechCorp",
      funding_stage: "Series A",
      industry: "FinTech",
      funding_amount: "$10M"
    }
  }
});
```

### Example Output

When using the `startup-funding-analysis` prompt with parameters, you'll receive a comprehensive investment analysis template including:

- Executive Summary
- Company Overview
- Market Analysis
- Financial Assessment
- Risk Analysis
- Investment Recommendation
- Next Steps

## Best Practices

### Parameter Selection
- **Required Parameters**: Always provide all required parameters
- **Optional Parameters**: Include when available for richer analysis
- **Context Quality**: More specific parameters generate better templates

### Use Case Alignment
- **Strategic Decisions**: Use Strategic Business Analysis prompts
- **Crisis Response**: Use Crisis & Specialized Analysis prompts
- **Quick Assessments**: Use Quick Analysis & Guidance prompts

### Integration Workflow
1. **Identify Analysis Need**: Determine the type of business analysis required
2. **Select Appropriate Prompt**: Choose the most relevant prompt category
3. **Gather Parameters**: Collect required business context and parameters
4. **Generate Template**: Use MCP client to generate professional template
5. **Customize Content**: Adapt template for specific requirements

## Troubleshooting

### Common Issues
- **Missing Parameters**: Ensure all required parameters are provided
- **Invalid Prompt Names**: Use exact prompt names from the list
- **Parameter Format**: Follow parameter type requirements (string, optional)

### Error Messages
- `Prompt not found`: Check prompt name spelling
- `Missing required parameter`: Provide all required parameters
- `Invalid parameter value`: Ensure parameter values are appropriate

## Related Documentation

- [MCP Integration Guide](mcp-integration.md)
- [Tools Guide](tools-guide.md)
- [Getting Started](getting-started.md)
- [API Reference](api-reference.md)

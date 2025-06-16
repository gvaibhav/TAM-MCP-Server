// MCP Prompt Definition interface following MCP specification
export interface PromptDefinition {
  name: string;
  description: string;
  arguments?: PromptArgument[];
}

export interface PromptArgument {
  name: string;
  description: string;
  required?: boolean;
}

// Comprehensive Business Analysis Prompts Collection
export const BusinessAnalysisPrompts: Record<string, PromptDefinition> = {
  // 1. Strategic Business Case Prompts
  startup_funding_pitch: {
    name: "startup_funding_pitch",
    description:
      "🚀 Comprehensive startup funding presentation with TAM/SAM analysis. Perfect for Series A-C funding rounds, includes market validation, competitive landscape, and financial projections.",
    arguments: [
      {
        name: "company_name",
        description: "Name of the startup seeking funding",
        required: true,
      },
      {
        name: "industry_sector",
        description:
          "Primary industry sector (e.g., 'fintech', 'healthtech', 'enterprise-saas', 'e-commerce')",
        required: true,
      },
      {
        name: "funding_stage",
        description:
          "Funding stage (e.g., 'seed', 'series-a', 'series-b', 'series-c')",
        required: true,
      },
      {
        name: "target_amount",
        description: "Target funding amount in USD (e.g., '5000000' for $5M)",
        required: false,
      },
      {
        name: "geographic_focus",
        description:
          "Geographic market focus (e.g., 'US', 'Global', 'North America', 'Europe')",
        required: false,
      },
    ],
  },

  private_equity_research: {
    name: "private_equity_research",
    description:
      "📊 Investment committee package for private equity deals. Comprehensive market analysis, competitive dynamics, and value creation opportunities with risk assessment.",
    arguments: [
      {
        name: "target_company",
        description: "Name or description of target company",
        required: true,
      },
      {
        name: "industry_focus",
        description:
          "Target industry (e.g., 'manufacturing', 'software', 'healthcare', 'infrastructure')",
        required: true,
      },
      {
        name: "deal_size",
        description: "Expected deal size in USD (e.g., '50000000' for $50M)",
        required: false,
      },
      {
        name: "investment_thesis",
        description:
          "Primary investment thesis (e.g., 'market consolidation', 'digital transformation', 'operational efficiency')",
        required: false,
      },
    ],
  },

  corporate_strategy_entry: {
    name: "corporate_strategy_entry",
    description:
      "🏢 Fortune 500 market entry strategy analysis. Board-level presentation for new market opportunities, strategic partnerships, and competitive positioning.",
    arguments: [
      {
        name: "company_name",
        description: "Name of the corporation",
        required: true,
      },
      {
        name: "target_market",
        description:
          "Target market or industry to enter (e.g., 'cybersecurity', 'renewable energy', 'artificial intelligence')",
        required: true,
      },
      {
        name: "entry_strategy",
        description:
          "Preferred entry strategy (e.g., 'organic-growth', 'acquisition', 'joint-venture', 'partnership')",
        required: false,
      },
      {
        name: "timeline",
        description:
          "Strategic timeline (e.g., '6-months', '1-year', '3-years')",
        required: false,
      },
    ],
  },

  // 2. Investment Analysis Prompts
  venture_capital_thesis: {
    name: "venture_capital_thesis",
    description:
      "💰 VC investment thesis development with market trends, competitive landscape, and portfolio fit analysis. Ideal for investment committee presentations.",
    arguments: [
      {
        name: "investment_sector",
        description:
          "Investment sector focus (e.g., 'cleantech', 'enterprise-ai', 'fintech', 'biotech')",
        required: true,
      },
      {
        name: "fund_focus",
        description:
          "Fund investment focus (e.g., 'early-stage', 'growth', 'late-stage')",
        required: true,
      },
      {
        name: "geographic_scope",
        description:
          "Geographic investment scope (e.g., 'North America', 'Global', 'Europe', 'APAC')",
        required: false,
      },
      {
        name: "portfolio_theme",
        description:
          "Portfolio theme or thesis (e.g., 'digital transformation', 'sustainability', 'ai-automation')",
        required: false,
      },
    ],
  },

  asset_management_research: {
    name: "asset_management_research",
    description:
      "📈 Institutional asset management research report. Comprehensive sector analysis for portfolio managers and research teams with risk-adjusted return projections.",
    arguments: [
      {
        name: "asset_class",
        description:
          "Primary asset class (e.g., 'equities', 'fixed-income', 'alternatives', 'real-estate')",
        required: true,
      },
      {
        name: "sector_focus",
        description:
          "Sector or theme focus (e.g., 'technology', 'healthcare', 'energy', 'consumer-discretionary')",
        required: true,
      },
      {
        name: "investment_horizon",
        description:
          "Investment time horizon (e.g., '1-year', '3-years', '5-years', '10-years')",
        required: false,
      },
      {
        name: "risk_profile",
        description:
          "Risk tolerance (e.g., 'conservative', 'moderate', 'aggressive', 'high-growth')",
        required: false,
      },
    ],
  },

  // 3. Crisis Management & Scenario Analysis
  crisis_management_analysis: {
    name: "crisis_management_analysis",
    description:
      "🚨 Emergency market analysis for crisis response teams. Rapid assessment of market disruptions, supply chain impacts, and strategic response options.",
    arguments: [
      {
        name: "crisis_type",
        description:
          "Type of crisis (e.g., 'supply-chain-disruption', 'regulatory-change', 'market-shock', 'competitive-threat')",
        required: true,
      },
      {
        name: "affected_industry",
        description:
          "Primary affected industry (e.g., 'automotive', 'semiconductor', 'pharmaceutical', 'energy')",
        required: true,
      },
      {
        name: "urgency_level",
        description:
          "Response urgency (e.g., 'immediate', 'within-week', 'within-month')",
        required: false,
      },
      {
        name: "stakeholder_focus",
        description:
          "Primary stakeholder concern (e.g., 'shareholders', 'customers', 'employees', 'regulators')",
        required: false,
      },
    ],
  },

  regulatory_impact_assessment: {
    name: "regulatory_impact_assessment",
    description:
      "⚖️ Regulatory change impact analysis for compliance and strategy teams. Assessment of policy changes on market dynamics and business operations.",
    arguments: [
      {
        name: "regulatory_change",
        description:
          "Type of regulatory change (e.g., 'new-compliance-requirements', 'policy-shift', 'tax-changes', 'industry-standards')",
        required: true,
      },
      {
        name: "affected_sector",
        description:
          "Affected sector (e.g., 'financial-services', 'healthcare', 'technology', 'energy')",
        required: true,
      },
      {
        name: "implementation_timeline",
        description:
          "Implementation timeline (e.g., 'immediate', '6-months', '1-year', '2-years')",
        required: false,
      },
      {
        name: "compliance_scope",
        description:
          "Compliance scope (e.g., 'domestic', 'international', 'sector-specific', 'universal')",
        required: false,
      },
    ],
  },

  // 4. International & Expansion Analysis
  international_expansion: {
    name: "international_expansion",
    description:
      "🌍 Global market entry strategy with cultural, regulatory, and competitive analysis. Comprehensive market opportunity assessment for international expansion.",
    arguments: [
      {
        name: "target_country",
        description:
          "Target country or region (e.g., 'Germany', 'Japan', 'Brazil', 'Southeast Asia')",
        required: true,
      },
      {
        name: "business_model",
        description:
          "Business model (e.g., 'b2b-saas', 'e-commerce', 'manufacturing', 'services')",
        required: true,
      },
      {
        name: "expansion_timeline",
        description:
          "Expansion timeline (e.g., 'q1-2025', '6-months', '1-year', '18-months')",
        required: false,
      },
      {
        name: "entry_mode",
        description:
          "Preferred entry mode (e.g., 'direct-investment', 'partnership', 'acquisition', 'licensing')",
        required: false,
      },
    ],
  },

  // 5. Specialized Industry Analysis
  technology_disruption_analysis: {
    name: "technology_disruption_analysis",
    description:
      "⚡ Technology disruption impact assessment for innovation teams. Analysis of emerging technologies and their market transformation potential.",
    arguments: [
      {
        name: "technology_focus",
        description:
          "Technology area (e.g., 'artificial-intelligence', 'blockchain', 'quantum-computing', 'robotics')",
        required: true,
      },
      {
        name: "industry_application",
        description:
          "Target industry application (e.g., 'automotive', 'finance', 'healthcare', 'manufacturing')",
        required: true,
      },
      {
        name: "disruption_timeline",
        description:
          "Expected disruption timeline (e.g., '1-3-years', '3-5-years', '5-10-years')",
        required: false,
      },
      {
        name: "competitive_focus",
        description:
          "Competitive analysis focus (e.g., 'market-leaders', 'emerging-players', 'startup-ecosystem')",
        required: false,
      },
    ],
  },

  esg_sustainability_analysis: {
    name: "esg_sustainability_analysis",
    description:
      "🌱 ESG and sustainability market analysis for sustainable investing and corporate responsibility teams. Environmental, social, and governance impact assessment.",
    arguments: [
      {
        name: "esg_focus",
        description:
          "ESG focus area (e.g., 'climate-change', 'social-impact', 'governance', 'sustainable-supply-chain')",
        required: true,
      },
      {
        name: "industry_scope",
        description:
          "Industry scope (e.g., 'energy', 'consumer-goods', 'technology', 'financial-services')",
        required: true,
      },
      {
        name: "metrics_priority",
        description:
          "Priority metrics (e.g., 'carbon-footprint', 'diversity-inclusion', 'governance-scores', 'stakeholder-impact')",
        required: false,
      },
      {
        name: "reporting_framework",
        description:
          "Reporting framework (e.g., 'tcfd', 'sasb', 'gri', 'un-global-compact')",
        required: false,
      },
    ],
  },
};

// Quick analysis prompts for rapid insights
export const QuickAnalysisPrompts: Record<string, PromptDefinition> = {
  market_opportunity_scan: {
    name: "market_opportunity_scan",
    description:
      "🔍 Rapid market opportunity identification for time-sensitive decisions. Quick assessment of market size, growth trends, and competitive dynamics.",
    arguments: [
      {
        name: "industry_keyword",
        description:
          "Industry or market keyword (e.g., 'electric vehicles', 'telehealth', 'fintech')",
        required: true,
      },
      {
        name: "analysis_depth",
        description:
          "Analysis depth (e.g., 'overview', 'detailed', 'comprehensive')",
        required: false,
      },
    ],
  },

  competitive_intelligence: {
    name: "competitive_intelligence",
    description:
      "🎯 Competitive landscape analysis with market positioning and strategic insights. Focused competitor assessment for strategic planning.",
    arguments: [
      {
        name: "target_company",
        description:
          "Target company or competitor (e.g., 'Salesforce', 'Microsoft', 'Amazon')",
        required: true,
      },
      {
        name: "analysis_focus",
        description:
          "Analysis focus (e.g., 'market-share', 'pricing-strategy', 'product-portfolio', 'financial-performance')",
        required: false,
      },
    ],
  },

  investment_screening: {
    name: "investment_screening",
    description:
      "💎 Investment opportunity screening with fundamental and market analysis. Quick evaluation for investment committees and portfolio managers.",
    arguments: [
      {
        name: "company_symbol",
        description:
          "Stock symbol or company identifier (e.g., 'AAPL', 'MSFT', 'TSLA')",
        required: true,
      },
      {
        name: "screening_criteria",
        description:
          "Screening criteria (e.g., 'growth', 'value', 'dividend', 'momentum')",
        required: false,
      },
    ],
  },
};

// Resource prompts for documentation and guidance
export const ResourcePrompts: Record<string, PromptDefinition> = {
  tool_guidance: {
    name: "tool_guidance",
    description:
      "📚 Interactive guide to TAM MCP Server tools with usage examples and best practices. Perfect for new users and advanced workflows.",
    arguments: [
      {
        name: "tool_category",
        description:
          "Tool category (e.g., 'data-access', 'business-analysis', 'all')",
        required: false,
      },
      {
        name: "use_case",
        description:
          "Specific use case (e.g., 'market-research', 'investment-analysis', 'competitive-intelligence')",
        required: false,
      },
    ],
  },

  best_practices_guide: {
    name: "best_practices_guide",
    description:
      "⭐ Best practices for market analysis with the TAM MCP Server. Professional workflows, data interpretation, and strategic insights.",
    arguments: [
      {
        name: "analysis_type",
        description:
          "Analysis type (e.g., 'tam-calculation', 'market-research', 'competitive-analysis')",
        required: false,
      },
      {
        name: "experience_level",
        description:
          "User experience level (e.g., 'beginner', 'intermediate', 'advanced')",
        required: false,
      },
    ],
  },
};

// Consolidated prompt registry
export const AllPromptDefinitions = {
  ...BusinessAnalysisPrompts,
  ...QuickAnalysisPrompts,
  ...ResourcePrompts,
};

// Helper functions
export function getPromptDefinition(
  name: string,
): PromptDefinition | undefined {
  return AllPromptDefinitions[name];
}

export function getAllPromptDefinitions(): PromptDefinition[] {
  return Object.values(AllPromptDefinitions);
}

export function getPromptsByCategory(
  category: "business" | "quick" | "resource",
): PromptDefinition[] {
  switch (category) {
    case "business":
      return Object.values(BusinessAnalysisPrompts);
    case "quick":
      return Object.values(QuickAnalysisPrompts);
    case "resource":
      return Object.values(ResourcePrompts);
    default:
      return [];
  }
}

// Generate prompt content based on prompt type and arguments
export function generatePromptContent(
  promptName: string,
  args: Record<string, any>,
): string {
  // Business analysis prompt templates
  const businessPromptTemplates = {
    startup_funding_pitch: (args: Record<string, any>) => `
You are preparing a comprehensive Series ${args.funding_stage?.toUpperCase() || "A"} funding presentation for ${args.company_name}, a ${args.industry_sector} company.

**Your Mission:** Create a professional investor deck that demonstrates deep market understanding and strong growth potential.

**Required Analysis Components:**

1. **Total Addressable Market (TAM) Analysis**
   - Calculate TAM for the ${args.industry_sector} sector
   - Project 5-year market growth with detailed assumptions
   - Include geographic breakdown${args.geographic_focus ? ` (focusing on ${args.geographic_focus})` : ""}

2. **Competitive Landscape Intelligence** 
   - Identify key players and market positioning
   - Analyze competitive dynamics and barriers to entry
   - ESG factors and sustainability considerations

3. **Market Validation & Opportunity**
   - Validate market size estimates with multiple sources
   - Identify emerging opportunities and market gaps
   - Segment analysis focusing on target customer segments

4. **Financial Benchmarking**
   - Analyze comparable public companies in ${args.industry_sector}
   - Revenue multiples, growth rates, and profitability metrics
   - Industry-specific KPIs and unit economics

${args.target_amount ? `**Target Raise:** $${parseInt(args.target_amount).toLocaleString()}` : ""}

**Investor Standards:** All data must be investment-grade with clear sourcing and confidence metrics. This presentation will be scrutinized by experienced ${args.funding_stage} investors who will challenge every assumption.

Please provide comprehensive market analysis that supports our investment thesis and demonstrates the scale of opportunity for ${args.company_name}.`,

    private_equity_research: (args: Record<string, any>) => `
You are conducting investment committee due diligence for a private equity acquisition of ${args.target_company || "the target company"} in the ${args.industry_focus} sector.

**Investment Committee Context:** This analysis will inform a ${args.deal_size ? `$${parseInt(args.deal_size).toLocaleString()}` : "significant"} investment decision${args.investment_thesis ? ` based on our ${args.investment_thesis} thesis` : ""}.

**Required Due Diligence Components:**

1. **Industry Intelligence & Market Dynamics**
   - Comprehensive ${args.industry_focus} market analysis
   - Industry consolidation trends and growth drivers
   - Regulatory environment and ESG considerations

2. **Market Sizing & Growth Projections**
   - Total addressable market calculations with methodology
   - 5-year growth forecasts with scenario modeling
   - Market segment analysis and opportunity assessment

3. **Competitive Benchmarking**
   - Financial analysis of public comparables
   - Competitive positioning and market share dynamics
   - Value creation opportunities and operational improvements

4. **Investment Risk Assessment**
   - Market risks and cyclical considerations
   - Competitive threats and barriers to entry
   - Data validation and confidence scoring

**Committee Standards:** Investment committee members include former industry executives and experienced investors. All market estimates must be defensible with institutional-grade data sources and clear confidence intervals.

Please provide investment-grade market intelligence to support our acquisition evaluation.`,

    corporate_strategy_entry: (args: Record<string, any>) => `
You are developing a Fortune 500 board-level market entry strategy for ${args.company_name} entering the ${args.target_market} market.

**Board Presentation Context:** This analysis will be presented to board members including former CEOs, industry experts, and strategic advisors who will challenge every strategic assumption.

**Strategic Analysis Requirements:**

1. **Market Opportunity Assessment**
   - Comprehensive ${args.target_market} market intelligence
   - Market size, growth trends, and competitive dynamics
   - Segment analysis and customer behavior insights

2. **Entry Strategy Evaluation**
   - ${args.entry_strategy || "Multiple entry strategy"} analysis and trade-offs
   - Competitive response scenarios and market timing
   - International expansion considerations

3. **Strategic Fit & Synergies**
   - Market positioning relative to existing capabilities
   - Synergy identification and value creation potential
   - Integration complexity and execution risks

4. **Financial Validation**
   - Market size validation using authoritative sources
   - Investment requirements and ROI projections
   - Competitive benchmarking and valuation multiples

**Timeline:** ${args.timeline || "Strategic timeline to be determined based on market analysis"}

**Board Standards:** Board members will scrutinize strategic rationale, market assumptions, and competitive dynamics. All recommendations must be supported by robust market intelligence and clear strategic logic.

Please provide board-level strategic analysis for our ${args.target_market} market entry decision.`,
  };

  // Investment analysis prompts
  const investmentPromptTemplates = {
    venture_capital_thesis: (args: Record<string, any>) => `
You are developing a venture capital investment thesis for ${args.investment_sector} opportunities targeting ${args.fund_focus} companies${args.geographic_scope ? ` in ${args.geographic_scope}` : ""}.

**Investment Committee Context:** This thesis will guide ${args.fund_focus} investment decisions${args.portfolio_theme ? ` aligned with our ${args.portfolio_theme} strategy` : ""}.

**Thesis Development Requirements:**

1. **Sector Market Intelligence**
   - ${args.investment_sector} market trends and growth drivers
   - Technology disruption and innovation cycles
   - ESG considerations and sustainability factors

2. **Investment Opportunity Mapping**
   - Market segment analysis and opportunity sizing
   - Competitive landscape and player positioning
   - Emerging sub-sectors and investment themes

3. **Portfolio Fit Analysis**
   - Synergies with existing portfolio companies
   - Market timing and investment cycle considerations
   - Risk-adjusted return projections

4. **Market Validation**
   - Government economic data supporting sector growth
   - Public company benchmarking and exit opportunities
   - Data confidence and source validation

**LP Presentation Standards:** Our limited partners include institutional investors and family offices who require data-driven investment rationale with clear market validation.

Please provide venture-grade market analysis to support our ${args.investment_sector} investment thesis.`,

    asset_management_research: (args: Record<string, any>) => `
You are conducting institutional asset management research for ${args.asset_class} investments${args.sector_focus ? ` in the ${args.sector_focus} sector` : ""}.

**Portfolio Context:** This research supports ${args.investment_horizon || "long-term"} investment decisions with ${args.risk_profile || "institutional"} risk parameters.

**Research Requirements:**

1. **Sector & Market Analysis**
   - Comprehensive ${args.sector_focus || args.asset_class} market intelligence
   - Industry trends, growth drivers, and cyclical factors
   - ESG integration and sustainability considerations

2. **Investment Universe Screening**
   - Market opportunity identification and sizing
   - Competitive landscape and market positioning
   - Valuation metrics and relative attractiveness

3. **Risk-Return Assessment**
   - Historical performance analysis and volatility patterns
   - Correlation analysis and portfolio diversification benefits
   - Scenario modeling and stress testing

4. **Due Diligence Validation**
   - Market data validation and confidence scoring
   - Multiple source cross-verification
   - Institutional-grade research standards

**Client Standards:** Our institutional clients manage significant assets and require rigorous research methodology with transparent data sourcing and confidence metrics.

Please provide institutional-grade market research for ${args.asset_class} investment evaluation.`,
  };

  // Crisis management and specialized prompts
  const specializedPromptTemplates = {
    crisis_management_analysis: (args: Record<string, any>) => `
🚨 **URGENT CRISIS RESPONSE ANALYSIS** 🚨

Crisis Type: ${args.crisis_type?.toUpperCase() || "MARKET DISRUPTION"}
Affected Industry: ${args.affected_industry}
Timeline: ${args.response_timeline || "IMMEDIATE RESPONSE REQUIRED"}

**Emergency Market Intelligence Requirements:**

1. **Immediate Market Impact Assessment**
   - ${args.affected_industry} market disruption analysis
   - Supply chain and operational impact evaluation
   - Competitive landscape shifts and opportunities

2. **Response Strategy Options**
   - Market opportunity identification during crisis
   - Defensive positioning and risk mitigation
   - Strategic pivots and adaptation scenarios

3. **Economic Environment Analysis**
   - Government economic indicators and policy responses
   - International market impacts and global trends
   - Recovery timeline projections and scenarios

4. **Decision Support Intelligence**
   - Data-driven recommendations for immediate action
   - Risk assessment and confidence intervals
   - Stakeholder communication messaging support

**Executive Context:** This analysis informs critical business decisions with significant financial and strategic implications. Speed and accuracy are paramount.

Please provide emergency market intelligence for crisis response decision-making.`,

    regulatory_impact_assessment: (args: Record<string, any>) => `
You are conducting regulatory impact analysis for ${args.regulatory_change} affecting the ${args.affected_market} market.

**Regulatory Context:** ${args.regulatory_scope || "Market-wide regulatory changes"} requiring strategic response within ${args.compliance_timeline || "regulatory deadlines"}.

**Impact Assessment Requirements:**

1. **Market Implications Analysis**
   - ${args.affected_market} market size and structure impacts
   - Competitive dynamics and market share redistribution
   - Compliance costs and operational changes

2. **Strategic Response Evaluation**
   - Regulatory compliance strategy options
   - Competitive advantages and market positioning
   - Investment requirements and timeline considerations

3. **Economic Impact Modeling**
   - Government data on regulatory costs and benefits
   - Industry employment and revenue projections
   - International comparison and best practices

4. **Risk & Opportunity Assessment**
   - Regulatory compliance risks and mitigation strategies
   - Market opportunities created by regulatory changes
   - Data validation and confidence scoring

**Compliance Standards:** Regulatory teams require authoritative data sources and defensible analysis for compliance planning and strategic positioning.

Please provide regulatory-grade market analysis for compliance and strategic planning.`,

    international_expansion: (args: Record<string, any>) => `
You are developing international expansion strategy for ${args.company_type || "the company"} entering ${args.target_regions || "international markets"}.

**Expansion Context:** ${args.expansion_timeline || "Strategic expansion timeline"} for ${args.business_model || "business operations"} in ${args.target_regions || "target markets"}.

**Global Market Analysis Requirements:**

1. **International Market Intelligence**
   - Market size and growth opportunities across target regions
   - Competitive landscape and local player analysis
   - Cultural and business environment considerations

2. **Market Entry Strategy**
   - Entry mode evaluation and trade-offs
   - Local partnership and regulatory requirements
   - Investment timeline and resource allocation

3. **Economic Environment Assessment**
   - International economic indicators and trends
   - Currency, political, and regulatory risks
   - Market timing and expansion sequencing

4. **Cross-Border Validation**
   - International data sources and market validation
   - Comparative market analysis and benchmarking
   - Risk assessment and mitigation strategies

**Global Standards:** International expansion requires rigorous market intelligence with local market expertise and authoritative international data sources.

Please provide global market analysis for international expansion planning.`,

    technology_disruption_analysis: (args: Record<string, any>) => `
You are conducting technology disruption impact analysis for ${args.technology_focus} in the ${args.industry_application} industry.

**Innovation Context:** Assessing ${args.disruption_timeline || "near-term"} disruption potential with focus on ${args.competitive_focus || "market transformation"}.

**Technology Disruption Assessment:**

1. **Technology Market Intelligence**
   - ${args.technology_focus} market size and adoption trends
   - Innovation cycles and technology maturity assessment
   - Key technology players and competitive dynamics

2. **Industry Transformation Analysis**
   - ${args.industry_application} industry disruption potential
   - Use case analysis and market penetration scenarios
   - Competitive advantage and defensive positioning

3. **Market Opportunity Evaluation**
   - Technology market sizing and growth projections
   - Investment trends and funding activity analysis
   - Emerging opportunities and threat assessment

4. **Strategic Intelligence**
   - Technology adoption timeline and risk factors
   - Market validation and confidence assessment
   - Strategic recommendations for positioning

**Innovation Standards:** Technology teams require data-driven analysis with clear adoption timelines and market validation for strategic technology investments.

Please provide technology-grade market analysis for innovation planning.`,

    esg_sustainability_analysis: (args: Record<string, any>) => `
You are conducting ESG and sustainability market analysis for ${args.esg_focus} initiatives in the ${args.industry_scope} sector.

**Sustainability Context:** ${args.metrics_priority || "Comprehensive ESG assessment"} using ${args.reporting_framework || "leading ESG frameworks"} standards.

**ESG Market Analysis Requirements:**

1. **ESG Market Intelligence**
   - ${args.esg_focus} market trends and growth drivers
   - Sustainability investment flows and market sizing
   - Regulatory environment and policy developments

2. **Industry ESG Assessment**
   - ${args.industry_scope} sector ESG performance benchmarking
   - Leading practices and competitive positioning
   - ESG risk factors and opportunity identification

3. **Investment & Impact Analysis**
   - ESG investment trends and market opportunities
   - Sustainability market sizing and growth projections
   - Impact measurement and validation methodologies

4. **Reporting & Compliance**
   - ESG data validation and confidence scoring
   - Regulatory compliance and reporting requirements
   - Stakeholder engagement and materiality assessment

**ESG Standards:** Sustainability teams require authoritative ESG data with transparent methodology and alignment with recognized reporting frameworks.

Please provide ESG-grade market analysis for sustainability strategy development.`,
  };

  // Quick analysis prompts
  const quickAnalysisTemplates = {
    market_opportunity_scan: (args: Record<string, any>) => `
**RAPID MARKET OPPORTUNITY SCAN**

Industry Focus: ${args.industry_keyword}
Analysis Depth: ${args.analysis_depth || "Comprehensive overview"}

**Quick Intelligence Requirements:**

1. **Market Size & Growth**
   - Current market size for ${args.industry_keyword}
   - Growth trends and projections
   - Key market drivers and opportunities

2. **Competitive Landscape**
   - Major players and market positioning
   - Competitive dynamics and market concentration
   - Emerging threats and opportunities

3. **Investment Attractiveness**
   - Market opportunity assessment
   - Investment trends and funding activity
   - Risk factors and market challenges

Please provide rapid market intelligence for immediate decision support.`,

    competitive_intelligence: (args: Record<string, any>) => `
**COMPETITIVE INTELLIGENCE BRIEFING**

Target Companies: ${args.competitor_list || "Key market competitors"}
Analysis Focus: ${args.analysis_focus || "Comprehensive competitive assessment"}

**Intelligence Requirements:**

1. **Financial Performance Analysis**
   - Revenue, profitability, and growth metrics
   - Market capitalization and valuation trends
   - Financial strength and competitive positioning

2. **Market Position Assessment**
   - Market share and competitive advantages
   - Product/service differentiation
   - Strategic initiatives and market moves

3. **Investment Intelligence**
   - Analyst coverage and investment sentiment
   - Strategic partnerships and M&A activity
   - Market opportunity and threat assessment

Please provide actionable competitive intelligence for strategic planning.`,

    investment_screening: (args: Record<string, any>) => `
**INVESTMENT SCREENING ANALYSIS**

Investment Universe: ${args.screening_universe}
Screening Criteria: ${args.screening_criteria || "Comprehensive investment evaluation"}

**Screening Requirements:**

1. **Market Opportunity Assessment**
   - Industry trends and growth potential
   - Market size and competitive dynamics
   - ESG factors and sustainability considerations

2. **Financial Screening**
   - Valuation metrics and relative attractiveness
   - Financial performance and quality indicators
   - Risk assessment and volatility analysis

3. **Investment Decision Support**
   - Investment recommendation and rationale
   - Risk-return profile and portfolio fit
   - Data confidence and validation metrics

Please provide investment-grade screening analysis for portfolio decision-making.`,
  };

  // Resource prompts
  const resourcePromptTemplates = {
    tool_guidance: (args: Record<string, any>) => `
**TAM MCP SERVER TOOL GUIDANCE**

Tool Category: ${args.tool_category || "All tools"}
Use Case: ${args.use_case || "General market analysis"}

**Interactive Tool Guide:**

This prompt will provide comprehensive guidance on using the TAM MCP Server's 28+ market analysis tools effectively.

**Tool Categories Available:**
- Data Access Tools (AlphaVantage, BLS, Census, FRED, World Bank, OECD, IMF, NASDAQ)
- Business Analysis Tools (TAM Calculator, Market Segments, Industry Analysis)
- Market Intelligence Tools (Market Opportunities, Competitive Analysis, Forecasting)
- Validation Tools (Data Validation, Market Comparison)

**Your Request:** Please specify which tools you'd like guidance on, or describe your analysis objectives for personalized tool recommendations.

I'll provide step-by-step instructions, parameter examples, and best practices for your specific ${args.use_case || "market analysis"} needs.`,

    best_practices_guide: (args: Record<string, any>) => `
**TAM MCP SERVER BEST PRACTICES GUIDE**

Analysis Type: ${args.analysis_type || "Market analysis best practices"}
Experience Level: ${args.experience_level || "All levels"}

**Professional Market Analysis Workflow:**

This guide provides expert methodologies for conducting professional-grade market analysis using the TAM MCP Server.

**Best Practices Framework:**
1. **Data Source Selection** - Choosing authoritative sources for your analysis
2. **Methodology Design** - Structuring analysis for maximum credibility
3. **Validation Techniques** - Ensuring data quality and confidence
4. **Presentation Standards** - Professional reporting and visualization

**Quality Standards:**
- Investment-grade data sourcing
- Multiple source validation
- Confidence interval reporting
- Methodology transparency

Please specify your analysis objectives and I'll provide tailored best practices for professional market analysis success.`,
  };

  // Combine all templates
  const allTemplates = {
    ...businessPromptTemplates,
    ...investmentPromptTemplates,
    ...specializedPromptTemplates,
    ...quickAnalysisTemplates,
    ...resourcePromptTemplates,
  };

  // Generate content using the appropriate template
  const template = allTemplates[promptName as keyof typeof allTemplates];
  if (template) {
    return template(args);
  }

  // Fallback for unknown prompts
  return `Generate a comprehensive business analysis prompt for ${promptName} with the following parameters: ${JSON.stringify(args, null, 2)}

Please provide detailed market analysis guidance based on the prompt requirements and available arguments.`;
}

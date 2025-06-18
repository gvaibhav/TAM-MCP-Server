# Default Values Implementation Guide

## Overview

The TAM MCP Server now supports **default parameter values** for all tools, making it extremely easy for first-time users to get started without needing to know specific parameter values.

## 🎯 Quick Demo

**Want to see it in action?** Run the interactive demo:

```bash
# From the project root directory
node demo-default-values.mjs
```

This demo shows how you can get professional market analysis results with zero configuration!

## How It Works

### 1. **Automatic Default Application**
When a tool is called with missing parameters, the server automatically applies sensible defaults:

```typescript
// User provides minimal or no parameters
{
  "name": "alphaVantage_getCompanyOverview",
  "arguments": {} // Empty or partial arguments
}

// Server automatically applies defaults
{
  "symbol": "AAPL" // Default value applied
}
```

### 2. **Smart Default Selection**
All defaults are carefully chosen to provide meaningful, real-world examples:

- **Stock Symbols**: Popular companies (AAPL, MSFT, GOOGL)
- **Geographic Codes**: Common regions (USA, Global)
- **Time Periods**: Recent, relevant dates (2020-2024)
- **Industry Codes**: Well-known sectors (Technology, Professional Services)

## 🔧 Default Values by Tool Category

### **Data Access Tools**

#### **Alpha Vantage Tools**
```typescript
// Company Overview - defaults to Apple Inc.
alphaVantage_getCompanyOverview: {
  symbol: "AAPL" // Apple Inc.
}

// Symbol Search - defaults to Apple search
alphaVantage_searchSymbols: {
  keywords: "Apple" // Popular company search
}
```

#### **Federal Reserve (FRED) Tools**
```typescript
// Economic Series - defaults to Real GDP
fred_getSeriesObservations: {
  seriesId: "GDPC1" // Real Gross Domestic Product
}
```

#### **Bureau of Labor Statistics (BLS) Tools**
```typescript
// Series Data - defaults to Alaska unemployment
bls_getSeriesData: {
  seriesIds: ["LAUCN040010000000005"], // Alaska unemployment rate
  startYear: "2020",
  endYear: "2024",
  catalog: false,
  calculations: false,
  annualaverage: false
}
```

#### **U.S. Census Bureau Tools**
```typescript
// Industry Data - defaults to employment and payroll
census_fetchIndustryData: {
  variables: ["EMP", "PAYANN"], // Employment and Annual Payroll
  forGeography: "us:1", // United States
  year: "2021",
  datasetPath: "cbp" // County Business Patterns
}

// Market Size - defaults to Professional Services
census_fetchMarketSize: {
  naicsCode: "54" // Professional, Scientific, and Technical Services
}
```

#### **World Bank Tools**
```typescript
// Indicator Data - defaults to US GDP
worldBank_getIndicatorData: {
  countryCode: "USA", // United States
  indicator: "NY.GDP.MKTP.CD" // GDP (current US$)
}
```

#### **International Monetary Fund (IMF) Tools**
```typescript
// Dataset - defaults to US Import Price Index
imf_getDataset: {
  dataflowId: "IFS", // International Financial Statistics
  key: "M.US.PMP_IX", // US Import Price Index
  startPeriod: "2020",
  endPeriod: "2024"
}

// Latest Observation - same defaults
imf_getLatestObservation: {
  dataflowId: "IFS",
  key: "M.US.PMP_IX"
}
```

### **Business Analysis Tools**

#### **TAM Calculator**
```typescript
tam_calculator: {
  baseMarketSize: 10000000000, // $10 billion market
  annualGrowthRate: 0.15, // 15% annual growth
  projectionYears: 5, // 5-year projection
  segmentationAdjustments: {
    factor: 0.8, // 80% addressable market
    rationale: "Addressable market segment"
  }
}
```

#### **Market Size Calculator**
```typescript
market_size_calculator: {
  industryQuery: "Software as a Service", // SaaS industry
  geographyCodes: ["US"], // United States
  indicatorCodes: ["GDP", "Employment"], // Key economic indicators
  year: "2024" // Current year
}
```

#### **Company Financials Retriever**
```typescript
company_financials_retriever: {
  companySymbol: "AAPL", // Apple Inc.
  statementType: "OVERVIEW", // Company overview
  period: "annual", // Annual reporting
  limit: 1 // Latest period
}
```

#### **Industry Search**
```typescript
industry_search: {
  query: "technology", // Technology sector
  sources: ["CENSUS", "BLS"], // Census and BLS data
  limit: 10, // 10 results
  minRelevanceScore: 0.5, // 50% relevance threshold
  geographyFilter: ["US"] // United States
}
```

## 🎯 Benefits for Users

### **1. Immediate Usability**
- **No research required**: Users can test tools instantly
- **Working examples**: All defaults provide real, meaningful data
- **Learning by doing**: Users see what good parameters look like

### **2. Progressive Enhancement**
- **Start simple**: Begin with defaults, then customize
- **Parameter discovery**: Defaults show what's possible
- **Guided learning**: Descriptions explain parameter purposes

### **3. Professional Quality**
- **Real-world data**: Defaults use actual companies and indicators
- **Business relevance**: Examples are commercially meaningful
- **Industry standards**: Common symbols and codes

## 📝 Usage Examples

### **Complete Beginners** (No Parameters)
```json
{
  "name": "alphaVantage_getCompanyOverview",
  "arguments": {}
}
// Returns: Apple Inc. company overview
```

### **Partial Customization** (Some Parameters)
```json
{
  "name": "tam_calculator", 
  "arguments": {
    "baseMarketSize": 5000000000
  }
}
// Uses: $5B base + 15% growth + 5 years + 80% addressable (defaults)
```

### **Full Customization** (All Parameters)
```json
{
  "name": "company_financials_retriever",
  "arguments": {
    "companySymbol": "MSFT",
    "statementType": "INCOME_STATEMENT", 
    "period": "quarterly",
    "limit": 4
  }
}
// Uses: All custom values, no defaults applied
```

## 🔍 Implementation Details

### **Server-Side Processing**
1. **Parameter Reception**: Server receives tool call with arguments
2. **Schema Validation**: Zod schema applies defaults for missing values
3. **Processed Arguments**: Complete parameter set with defaults
4. **Tool Execution**: Tools receive fully populated arguments

### **Zod Schema Enhancement**
```typescript
// Before: Required parameter without default
symbol: z.string().describe("Stock symbol")

// After: Required parameter with helpful default
symbol: z.string().default("AAPL").describe("Stock symbol. Default: AAPL")
```

### **Validation Flow**
```typescript
// 1. Raw arguments from user
const rawArgs = request.params.arguments;

// 2. Apply defaults via Zod parsing
const processedArgs = validationSchema.parse(rawArgs || {});

// 3. Execute tool with complete parameters
const result = await toolFunction(processedArgs);
```

## Key Benefits

### **Immediate Impact**
- **Zero learning curve**: Tools work without parameter knowledge
- **Real data access**: Meaningful results from first use
- **Professional examples**: Business-relevant default values

### **User Experience**
- **Progressive disclosure**: Start simple, add complexity gradually
- **Parameter discovery**: Learn by seeing working examples
- **Confidence building**: Success from first interaction

### **Business Value**
- **Faster adoption**: Users productive immediately
- **Lower barriers**: No API documentation required upfront
- **Better retention**: Positive first experience

## 🚀 Next Steps

### **Enhanced Defaults**
- **Industry-specific**: Sector-relevant default values
- **Geographic preferences**: Region-specific defaults
- **Time-aware**: Dynamic date defaults

### **Smart Suggestions**
- **Parameter hints**: Suggest related parameter values
- **Context awareness**: Defaults based on previous usage
- **User preferences**: Personalized default values

---

**Status**: **AVAILABLE**  
**User Impact**: 🚀 **IMMEDIATE - Zero friction tool usage**  
**Business Value**: 💯 **HIGH - Dramatically improved first-time user experience**

# ChartDB CrewAI Agents

AI-powered agents for intelligent database schema management using CrewAI framework.

## Overview

This system uses multiple specialized AI agents working together to:
- Generate optimal database schemas from descriptions
- Analyze existing schemas for issues
- Provide optimization recommendations
- Validate schema design patterns

## Agents

### 1. Schema Analyzer Agent
**Role**: Database Schema Expert  
**Goal**: Analyze database schemas and identify issues, patterns, and optimization opportunities

**Capabilities**:
- Detects missing primary keys
- Identifies normalization issues
- Checks naming conventions
- Finds orphaned tables
- Suggests improvements

### 2. Diagram Generator Agent
**Role**: Database Design Specialist  
**Goal**: Generate well-structured database diagrams from natural language descriptions

**Capabilities**:
- Parses natural language descriptions
- Generates tables with appropriate fields
- Creates relationships between entities
- Optimizes visual layout
- Groups related tables into areas

### 3. Optimization Agent
**Role**: Database Performance Expert  
**Goal**: Optimize database schemas for performance, maintainability, and scalability

**Capabilities**:
- Analyzes normalization (1NF, 2NF, 3NF)
- Suggests indexes for performance
- Validates naming conventions
- Recommends relationship improvements
- Generates optimization plans

## Schema Crew

The `SchemaCrew` orchestrates multiple agents to work together on complex tasks:

### Available Operations

1. **Generate and Optimize** - Create a new diagram from scratch
2. **Analyze Diagram** - Comprehensive analysis of existing schema
3. **Optimize Diagram** - Generate optimization recommendations
4. **Validate Diagram** - Check for errors and warnings

## Installation

```bash
npm install
npm run build
```

## Usage

### Command Line

```bash
# Generate a diagram from description
npm start generate "e-commerce database with users, products, and orders" postgresql

# Analyze an example diagram
npm start analyze

# Validate an example diagram
npm start validate
```

### Programmatic Usage

```typescript
import { SchemaCrew } from '@chartdb/crewai-agents';

const crew = new SchemaCrew();

// Generate and optimize a diagram
const result = await crew.generateAndOptimize(
    'Blog platform with users, posts, comments, and tags',
    'postgresql'
);

if (result.success) {
    console.log('Diagram:', result.data.diagram);
    console.log('Analysis:', result.data.analysis);
    console.log('Optimization:', result.data.optimization);
}

// Analyze existing diagram
const analysis = await crew.analyzeDiagram(existingDiagram);
console.log('Report:', analysis.data.analysisReport);

// Validate diagram
const validation = await crew.validateDiagram(diagram);
if (validation.data.isValid) {
    console.log('✅ Schema is valid');
} else {
    console.log('❌ Issues found:', validation.data.errors);
}
```

## Integration with ChartDB

### Via MCP Server

The agents can be called through the ChartDB MCP server:

```typescript
// Use MCP prompts to trigger agents
const prompt = await mcpClient.getPrompt('generate_diagram', {
    description: 'Social network with users, posts, and friendships',
    databaseType: 'postgresql'
});
```

### Via REST API

```bash
# Generate diagram via API
curl -X POST https://api.chartdb.io/ai/generate \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "description": "Inventory management system",
    "databaseType": "mysql"
  }'

# Analyze diagram
curl -X POST https://api.chartdb.io/ai/analyze \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"diagramId": "diagram-123"}'
```

### Via Pipedream

Use in Pipedream workflows:

```javascript
// In a Pipedream workflow step
export default defineComponent({
  async run({ steps, $ }) {
    const agents = require('@chartdb/crewai-agents');
    const crew = new agents.SchemaCrew();
    
    const result = await crew.generateAndOptimize(
      steps.trigger.event.description,
      'postgresql'
    );
    
    return result.data.diagram;
  }
});
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Schema Crew (Orchestrator)         │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Schema    │ │   Diagram   │ │Optimization │
│   Analyzer  │ │  Generator  │ │    Agent    │
└─────────────┘ └─────────────┘ └─────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   ChartDB API   │
              └─────────────────┘
```

## Example Outputs

### Schema Analysis Report

```markdown
# Schema Analysis Report

## Summary
- Tables: 3
- Relationships: 2
- Normalization Score: 85.0/100

## Issues (2)

### Warnings (2)
- Table "User" does not follow lowercase naming convention
  - Recommendation: Use lowercase with underscores for table names
```

### Optimization Plan

```markdown
# Database Optimization Plan

## Overall Assessment: GOOD
Score: 82/100

## Recommendations (5)

### High Priority (2)
1. **Add index on foreign key "orders.user_id" for better join performance**
   ```sql
   CREATE INDEX idx_orders_user_id ON orders(user_id);
   ```
```

## Development

```bash
npm run dev     # Watch mode
npm test        # Run tests
npm run build   # Build for production
```

## Configuration

Set environment variables for AI features:

```bash
export OPENAI_API_KEY=your_key_here
export OPENAI_MODEL=gpt-4  # Optional, defaults to gpt-3.5-turbo
```

## Testing

```bash
# Run unit tests
npm test

# Test individual agents
npm start analyze
npm start validate
```

## Best Practices

1. **Descriptive Inputs**: Provide clear, detailed descriptions when generating schemas
2. **Iterative Refinement**: Use analysis and optimization together
3. **Review Recommendations**: Always review agent suggestions before applying
4. **Test Changes**: Validate changes in development before production
5. **Monitor Performance**: Track schema performance after optimizations

## Limitations

- Natural language parsing is best-effort and may not capture all nuances
- Optimization suggestions should be reviewed by database experts
- Generated schemas may need manual refinement for complex domains
- Some database-specific features may not be fully supported

## Future Enhancements

- [ ] Support for more database types
- [ ] Integration with database migration tools
- [ ] Real-time schema monitoring
- [ ] Advanced AI models for better understanding
- [ ] Custom agent training for domain-specific schemas

## Support

For issues or questions:
- [ChartDB Documentation](https://chartdb.io/docs)
- [GitHub Issues](https://github.com/chartdb/chartdb/issues)

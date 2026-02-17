# ChartDB Pipedream Components

This directory contains Pipedream components for integrating ChartDB with workflows.

## Components

### Actions

Actions are operations you can trigger in your workflows:

- **create-diagram** - Create a new database diagram
- **add-table** - Add a table to a diagram
- **add-relationship** - Add a relationship between tables
- **export-diagram** - Export a diagram to SQL or DBML

### Sources

Sources are event listeners that trigger workflows:

- **diagram-updated** - Triggers when a diagram is updated
- **new-diagram** - Triggers when a new diagram is created

## Installation

These components are designed to be published to the Pipedream registry. To use them:

1. Copy the components to your Pipedream workspace
2. Configure your ChartDB API credentials
3. Use the components in your workflows

## Configuration

Each component requires ChartDB API credentials:

- **Base URL**: Your ChartDB instance URL (e.g., `https://api.chartdb.io`)
- **API Key**: Your ChartDB API key for authentication

## Example Workflows

### 1. Auto-generate diagrams from database connections

```
Trigger: New database connection webhook
Action: Create ChartDB diagram
Action: Add tables from schema introspection
Action: Add relationships based on foreign keys
Action: Send notification with diagram link
```

### 2. Sync diagrams to Git repository

```
Trigger: ChartDB diagram updated
Action: Export diagram as SQL
Action: Commit to Git repository
Action: Create pull request
```

### 3. Database documentation generator

```
Trigger: Scheduled (daily)
Action: List all ChartDB diagrams
Action: Export each as DBML
Action: Generate markdown documentation
Action: Update documentation site
```

## Development

To test components locally:

```bash
npm install
# Test individual components with Pipedream CLI
```

## Publishing

To publish components to Pipedream registry:

1. Ensure all components follow Pipedream conventions
2. Test thoroughly with different configurations
3. Submit to Pipedream registry via PR

## Support

For issues or questions, please visit:
- [ChartDB Documentation](https://chartdb.io/docs)
- [Pipedream Documentation](https://pipedream.com/docs)

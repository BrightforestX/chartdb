# ChartDB MCP Server

Model Context Protocol (MCP) server for ChartDB, enabling AI assistants to interact with database diagrams.

## Features

- **Resources**: Access and manage database diagrams
- **Tools**: Create, modify, and export database schemas
- **Prompts**: Generate database diagrams from natural language descriptions

## Installation

```bash
npm install
npm run build
```

## Usage

### As a standalone server

```bash
npm start
```

### With Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "chartdb": {
      "command": "node",
      "args": ["/path/to/chartdb/mcp-server/dist/index.js"]
    }
  }
}
```

## Resources

- `diagram://{id}` - Access a specific diagram
- `diagrams://list` - List all available diagrams

## Tools

- `create_diagram` - Create a new database diagram
- `add_table` - Add a table to a diagram
- `add_relationship` - Add a relationship between tables
- `export_sql` - Export diagram as SQL DDL
- `export_dbml` - Export diagram as DBML

## Prompts

- `generate_diagram` - Generate a diagram from a description
- `optimize_schema` - Get suggestions for schema optimization
- `explain_diagram` - Explain a diagram's structure

## Development

```bash
npm run dev  # Watch mode
npm test     # Run tests
```

# Example Pipedream Workflows for ChartDB

## 1. Database Schema to Diagram Automation

**Trigger**: Webhook from database migration tool  
**Description**: Automatically create ChartDB diagrams when database schemas change

```yaml
name: Auto-generate Database Diagrams
trigger:
  type: webhook
  path: /database-schema-updated

steps:
  - name: parse-schema
    language: nodejs
    code: |
      export default defineComponent({
        async run({ steps, $ }) {
          const schema = steps.trigger.event.body;
          return {
            tables: schema.tables,
            databaseType: schema.type
          };
        }
      });

  - name: create-diagram
    app: chartdb
    action: create-diagram
    params:
      name: "{{ steps.trigger.event.body.name }}"
      databaseType: "{{ steps.parse-schema.$return_value.databaseType }}"

  - name: add-tables
    language: nodejs
    code: |
      export default defineComponent({
        async run({ steps, $ }) {
          const diagramId = steps['create-diagram'].$return_value.id;
          const tables = steps['parse-schema'].$return_value.tables;
          
          for (const table of tables) {
            await $.send.http({
              method: 'POST',
              url: `https://api.chartdb.io/diagrams/${diagramId}/tables`,
              headers: {
                'Authorization': `Bearer ${process.env.CHARTDB_API_KEY}`
              },
              body: table
            });
          }
        }
      });

  - name: notify-team
    app: slack
    action: send-message
    params:
      channel: "#engineering"
      text: "New database diagram created: {{ steps.create-diagram.$return_value.name }}"
```

## 2. Diagram Version Control

**Trigger**: ChartDB diagram updated  
**Description**: Automatically commit diagram changes to Git

```yaml
name: Version Control for Diagrams
trigger:
  app: chartdb
  event: diagram-updated

steps:
  - name: export-sql
    app: chartdb
    action: export-diagram
    params:
      diagramId: "{{ steps.trigger.event.diagramId }}"
      format: "sql"

  - name: export-dbml
    app: chartdb
    action: export-diagram
    params:
      diagramId: "{{ steps.trigger.event.diagramId }}"
      format: "dbml"

  - name: commit-to-git
    app: github
    action: create-or-update-file
    params:
      repo: "company/database-schemas"
      path: "schemas/{{ steps.trigger.event.name }}.sql"
      content: "{{ steps.export-sql.$return_value }}"
      message: "Update schema: {{ steps.trigger.event.name }}"

  - name: create-pull-request
    app: github
    action: create-pull-request
    params:
      repo: "company/database-schemas"
      title: "Schema update: {{ steps.trigger.event.name }}"
      body: "Automated schema update from ChartDB"
```

## 3. Documentation Generator

**Trigger**: Schedule (daily)  
**Description**: Generate and update database documentation

```yaml
name: Daily Database Documentation
trigger:
  type: schedule
  cron: "0 9 * * *"  # Daily at 9 AM

steps:
  - name: list-diagrams
    app: chartdb
    action: list-diagrams

  - name: generate-docs
    language: nodejs
    code: |
      export default defineComponent({
        async run({ steps, $ }) {
          const diagrams = steps['list-diagrams'].$return_value;
          let markdown = "# Database Schemas\n\n";
          
          for (const diagram of diagrams) {
            markdown += `## ${diagram.name}\n`;
            markdown += `Type: ${diagram.databaseType}\n`;
            markdown += `Tables: ${diagram.tableCount}\n\n`;
            
            // Export DBML
            const dbml = await $.send.http({
              method: 'GET',
              url: `https://api.chartdb.io/diagrams/${diagram.id}/export/dbml`,
              headers: {
                'Authorization': `Bearer ${process.env.CHARTDB_API_KEY}`
              }
            });
            
            markdown += "```dbml\n" + dbml.body + "\n```\n\n";
          }
          
          return { markdown };
        }
      });

  - name: update-docs-site
    app: github
    action: create-or-update-file
    params:
      repo: "company/documentation"
      path: "database/schemas.md"
      content: "{{ steps.generate-docs.$return_value.markdown }}"
      message: "Update database documentation"

  - name: notify-success
    app: slack
    action: send-message
    params:
      channel: "#docs"
      text: "Database documentation updated successfully"
```

## 4. Schema Validation and Alerts

**Trigger**: ChartDB table added  
**Description**: Validate new tables and alert on potential issues

```yaml
name: Schema Validation
trigger:
  app: chartdb
  event: table-added

steps:
  - name: validate-table
    language: nodejs
    code: |
      export default defineComponent({
        async run({ steps, $ }) {
          const table = steps.trigger.event.table;
          const issues = [];
          
          // Check for primary key
          if (!table.fields.some(f => f.primaryKey)) {
            issues.push("Missing primary key");
          }
          
          // Check for created_at/updated_at
          const hasTimestamps = table.fields.some(f => 
            f.name === 'created_at' || f.name === 'updated_at'
          );
          if (!hasTimestamps) {
            issues.push("Missing timestamp fields");
          }
          
          // Check naming convention
          if (table.name !== table.name.toLowerCase()) {
            issues.push("Table name should be lowercase");
          }
          
          return { issues };
        }
      });

  - name: alert-if-issues
    condition: "{{ steps.validate-table.$return_value.issues.length > 0 }}"
    app: slack
    action: send-message
    params:
      channel: "#engineering"
      text: |
        ⚠️ Schema validation issues for table {{ steps.trigger.event.table.name }}:
        {{ steps.validate-table.$return_value.issues.join('\n- ') }}
```

## 5. Multi-Database Migration

**Trigger**: Manual or API call  
**Description**: Create equivalent schemas across multiple database types

```yaml
name: Multi-Database Migration
trigger:
  type: webhook
  path: /migrate-schema

steps:
  - name: get-source-diagram
    app: chartdb
    action: get-diagram
    params:
      diagramId: "{{ steps.trigger.event.body.sourceDiagramId }}"

  - name: create-postgres-diagram
    app: chartdb
    action: create-diagram
    params:
      name: "{{ steps.get-source-diagram.$return_value.name }} (PostgreSQL)"
      databaseType: "postgresql"

  - name: create-mysql-diagram
    app: chartdb
    action: create-diagram
    params:
      name: "{{ steps.get-source-diagram.$return_value.name }} (MySQL)"
      databaseType: "mysql"

  - name: migrate-tables
    language: nodejs
    code: |
      export default defineComponent({
        async run({ steps, $ }) {
          const sourceDiagram = steps['get-source-diagram'].$return_value;
          const pgDiagramId = steps['create-postgres-diagram'].$return_value.id;
          const mysqlDiagramId = steps['create-mysql-diagram'].$return_value.id;
          
          // Migrate tables with type conversions
          for (const table of sourceDiagram.tables) {
            const pgTable = adaptTableForPostgres(table);
            const mysqlTable = adaptTableForMySQL(table);
            
            // Add to both diagrams
            await Promise.all([
              addTableToDiagram(pgDiagramId, pgTable),
              addTableToDiagram(mysqlDiagramId, mysqlTable)
            ]);
          }
          
          return { success: true };
        }
      });

  - name: export-migration-scripts
    language: nodejs
    code: |
      export default defineComponent({
        async run({ steps, $ }) {
          const pgSql = await exportDiagram(
            steps['create-postgres-diagram'].$return_value.id,
            'sql'
          );
          const mysqlSql = await exportDiagram(
            steps['create-mysql-diagram'].$return_value.id,
            'sql'
          );
          
          return { pgSql, mysqlSql };
        }
      });

  - name: save-to-storage
    app: aws-s3
    action: upload-file
    params:
      bucket: "migration-scripts"
      key: "{{ steps.trigger.event.body.name }}/postgres.sql"
      content: "{{ steps.export-migration-scripts.$return_value.pgSql }}"
```

## Usage Instructions

1. **Import workflows** into your Pipedream account
2. **Configure API keys** for ChartDB and other services
3. **Customize** event triggers and actions as needed
4. **Test** each workflow in the Pipedream dashboard
5. **Deploy** to production

## Best Practices

- Use environment variables for API keys
- Add error handling and retry logic
- Log important events for debugging
- Set up monitoring and alerts
- Document custom code steps
- Version control your workflows

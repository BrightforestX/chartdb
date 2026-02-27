/**
 * ChartDB Pipedream App Definition
 */

export default {
  type: "app",
  app: "chartdb",
  propDefinitions: {
    diagramId: {
      type: "string",
      label: "Diagram ID",
      description: "The ID of the ChartDB diagram",
      async options({ page }) {
        // In a real implementation, this would fetch from an API
        // For now, we'll return a placeholder
        return [
          { label: "Sample Diagram 1", value: "diagram-1" },
          { label: "Sample Diagram 2", value: "diagram-2" },
        ];
      },
    },
    databaseType: {
      type: "string",
      label: "Database Type",
      description: "The type of database",
      options: [
        { label: "PostgreSQL", value: "postgresql" },
        { label: "MySQL", value: "mysql" },
        { label: "SQL Server", value: "sql_server" },
        { label: "MariaDB", value: "mariadb" },
        { label: "SQLite", value: "sqlite" },
        { label: "CockroachDB", value: "cockroachdb" },
        { label: "ClickHouse", value: "clickhouse" },
      ],
    },
    tableName: {
      type: "string",
      label: "Table Name",
      description: "Name of the table",
    },
    fieldDefinitions: {
      type: "string[]",
      label: "Field Definitions",
      description: "Array of field definitions in JSON format",
    },
  },
  methods: {
    _baseUrl() {
      // In production, this would be configurable
      return this.$auth.base_url || "http://localhost:3000";
    },
    _headers() {
      return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.$auth.api_key}`,
      };
    },
    async createDiagram({ name, databaseType }) {
      return await this._makeRequest({
        method: "POST",
        path: "/api/diagrams",
        data: { name, databaseType },
      });
    },
    async getDiagram(diagramId) {
      return await this._makeRequest({
        method: "GET",
        path: `/api/diagrams/${diagramId}`,
      });
    },
    async listDiagrams() {
      return await this._makeRequest({
        method: "GET",
        path: "/api/diagrams",
      });
    },
    async addTable({ diagramId, ...tableData }) {
      return await this._makeRequest({
        method: "POST",
        path: `/api/diagrams/${diagramId}/tables`,
        data: tableData,
      });
    },
    async addRelationship({ diagramId, ...relationshipData }) {
      return await this._makeRequest({
        method: "POST",
        path: `/api/diagrams/${diagramId}/relationships`,
        data: relationshipData,
      });
    },
    async exportDiagram({ diagramId, format }) {
      return await this._makeRequest({
        method: "GET",
        path: `/api/diagrams/${diagramId}/export/${format}`,
      });
    },
    async _makeRequest({ method, path, data, params }) {
      const config = {
        method,
        url: `${this._baseUrl()}${path}`,
        headers: this._headers(),
      };
      
      if (data) {
        config.data = data;
      }
      
      if (params) {
        config.params = params;
      }

      // This would use axios or fetch in a real implementation
      // For now, we'll return a mock response
      return { success: true, data };
    },
  },
};

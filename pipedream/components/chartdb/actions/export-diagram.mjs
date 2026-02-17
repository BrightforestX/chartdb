/**
 * Pipedream Action: Export a ChartDB diagram
 */

import chartdb from "../chartdb.app.mjs";

export default {
  key: "chartdb-export-diagram",
  name: "Export Diagram",
  description: "Export a ChartDB diagram to SQL or DBML format",
  version: "0.0.1",
  type: "action",
  props: {
    chartdb,
    diagramId: {
      propDefinition: [chartdb, "diagramId"],
    },
    format: {
      type: "string",
      label: "Export Format",
      description: "Format to export the diagram",
      options: [
        { label: "SQL DDL", value: "sql" },
        { label: "DBML", value: "dbml" },
        { label: "JSON", value: "json" },
      ],
    },
  },
  async run({ steps, $ }) {
    const response = await this.chartdb.exportDiagram({
      diagramId: this.diagramId,
      format: this.format,
    });

    $.export("$summary", `Successfully exported diagram as ${this.format.toUpperCase()}`);
    return response;
  },
};

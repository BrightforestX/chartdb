/**
 * Pipedream Action: Add a table to a ChartDB diagram
 */

import chartdb from "../chartdb.app.mjs";

export default {
  key: "chartdb-add-table",
  name: "Add Table",
  description: "Add a table to a ChartDB diagram",
  version: "0.0.1",
  type: "action",
  props: {
    chartdb,
    diagramId: {
      propDefinition: [chartdb, "diagramId"],
    },
    tableName: {
      propDefinition: [chartdb, "tableName"],
    },
    schema: {
      type: "string",
      label: "Schema",
      description: "Database schema (optional)",
      optional: true,
    },
    fields: {
      type: "string",
      label: "Fields (JSON)",
      description: "Array of field definitions as JSON string. Example: [{'name':'id','type':'INTEGER','primaryKey':true}]",
    },
    x: {
      type: "integer",
      label: "X Position",
      description: "X coordinate on canvas",
      optional: true,
      default: 0,
    },
    y: {
      type: "integer",
      label: "Y Position",
      description: "Y coordinate on canvas",
      optional: true,
      default: 0,
    },
    color: {
      type: "string",
      label: "Color",
      description: "Color hex code (optional)",
      optional: true,
    },
  },
  async run({ steps, $ }) {
    const fields = JSON.parse(this.fields);
    
    const response = await this.chartdb.addTable({
      diagramId: this.diagramId,
      name: this.tableName,
      schema: this.schema,
      fields,
      x: this.x,
      y: this.y,
      color: this.color,
    });

    $.export("$summary", `Successfully added table: ${this.tableName}`);
    return response;
  },
};

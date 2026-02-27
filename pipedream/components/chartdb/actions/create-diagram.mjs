/**
 * Pipedream Action: Create a new ChartDB diagram
 */

import chartdb from "../chartdb.app.mjs";

export default {
  key: "chartdb-create-diagram",
  name: "Create Diagram",
  description: "Create a new database diagram in ChartDB",
  version: "0.0.1",
  type: "action",
  props: {
    chartdb,
    name: {
      type: "string",
      label: "Diagram Name",
      description: "Name of the diagram",
    },
    databaseType: {
      propDefinition: [chartdb, "databaseType"],
    },
  },
  async run({ steps, $ }) {
    const response = await this.chartdb.createDiagram({
      name: this.name,
      databaseType: this.databaseType,
    });

    $.export("$summary", `Successfully created diagram: ${this.name}`);
    return response;
  },
};

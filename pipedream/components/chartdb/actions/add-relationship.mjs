/**
 * Pipedream Action: Add a relationship between tables
 */

import chartdb from "../chartdb.app.mjs";

export default {
  key: "chartdb-add-relationship",
  name: "Add Relationship",
  description: "Add a relationship between two tables in a ChartDB diagram",
  version: "0.0.1",
  type: "action",
  props: {
    chartdb,
    diagramId: {
      propDefinition: [chartdb, "diagramId"],
    },
    sourceTableId: {
      type: "string",
      label: "Source Table ID",
      description: "ID of the source table",
    },
    targetTableId: {
      type: "string",
      label: "Target Table ID",
      description: "ID of the target table",
    },
    sourceFieldId: {
      type: "string",
      label: "Source Field ID",
      description: "ID of the source field",
    },
    targetFieldId: {
      type: "string",
      label: "Target Field ID",
      description: "ID of the target field",
    },
    type: {
      type: "string",
      label: "Relationship Type",
      description: "Type of relationship",
      options: [
        { label: "One to One", value: "one_to_one" },
        { label: "One to Many", value: "one_to_many" },
        { label: "Many to One", value: "many_to_one" },
        { label: "Many to Many", value: "many_to_many" },
      ],
    },
    name: {
      type: "string",
      label: "Relationship Name",
      description: "Optional name for the relationship",
      optional: true,
    },
  },
  async run({ steps, $ }) {
    const response = await this.chartdb.addRelationship({
      diagramId: this.diagramId,
      sourceTableId: this.sourceTableId,
      targetTableId: this.targetTableId,
      sourceFieldId: this.sourceFieldId,
      targetFieldId: this.targetFieldId,
      type: this.type,
      name: this.name,
    });

    $.export("$summary", `Successfully added relationship between tables`);
    return response;
  },
};

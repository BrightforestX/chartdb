/**
 * Pipedream Source: Listen for diagram updates
 */

import chartdb from "../chartdb.app.mjs";

export default {
  key: "chartdb-diagram-updated",
  name: "Diagram Updated",
  description: "Emit new events when a diagram is updated",
  version: "0.0.1",
  type: "source",
  dedupe: "unique",
  props: {
    chartdb,
    db: "$.service.db",
    timer: {
      type: "$.interface.timer",
      default: {
        intervalSeconds: 60 * 15, // Check every 15 minutes
      },
    },
    diagramId: {
      propDefinition: [chartdb, "diagramId"],
      description: "Specific diagram to monitor (optional)",
      optional: true,
    },
  },
  methods: {
    _getLastUpdated() {
      return this.db.get("lastUpdated");
    },
    _setLastUpdated(value) {
      this.db.set("lastUpdated", value);
    },
    generateMeta(diagram) {
      return {
        id: `${diagram.id}-${diagram.updatedAt}`,
        summary: `Diagram "${diagram.name}" updated`,
        ts: new Date(diagram.updatedAt).getTime(),
      };
    },
  },
  async run() {
    const lastUpdated = this._getLastUpdated();
    
    let diagrams;
    if (this.diagramId) {
      const diagram = await this.chartdb.getDiagram(this.diagramId);
      diagrams = [diagram];
    } else {
      diagrams = await this.chartdb.listDiagrams();
    }

    for (const diagram of diagrams) {
      const updatedTime = new Date(diagram.updatedAt).getTime();
      
      if (!lastUpdated || updatedTime > lastUpdated) {
        this.$emit(diagram, this.generateMeta(diagram));
      }
    }

    const now = Date.now();
    this._setLastUpdated(now);
  },
};

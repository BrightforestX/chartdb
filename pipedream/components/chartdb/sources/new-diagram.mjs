/**
 * Pipedream Source: Listen for new diagrams
 */

import chartdb from "../chartdb.app.mjs";

export default {
  key: "chartdb-new-diagram",
  name: "New Diagram Created",
  description: "Emit new events when a diagram is created",
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
  },
  methods: {
    _getLastDiagramIds() {
      return this.db.get("lastDiagramIds") || [];
    },
    _setLastDiagramIds(ids) {
      this.db.set("lastDiagramIds", ids);
    },
    generateMeta(diagram) {
      return {
        id: diagram.id,
        summary: `New diagram created: "${diagram.name}"`,
        ts: new Date(diagram.createdAt).getTime(),
      };
    },
  },
  async run() {
    const lastDiagramIds = this._getLastDiagramIds();
    const diagrams = await this.chartdb.listDiagrams();
    
    const currentIds = diagrams.map(d => d.id);
    const newDiagrams = diagrams.filter(
      diagram => !lastDiagramIds.includes(diagram.id)
    );

    for (const diagram of newDiagrams) {
      this.$emit(diagram, this.generateMeta(diagram));
    }

    this._setLastDiagramIds(currentIds);
  },
};

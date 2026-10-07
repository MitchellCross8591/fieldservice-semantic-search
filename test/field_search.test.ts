import test from "node:test";
import assert from "node:assert/strict";
import { chooseFollowUp } from "../src/field_search";

test("chooses the highest-scoring open work order", () => {
  const result = chooseFollowUp([
    { id: "closed", score: 0.99, metadata: { workOrder: "WO-1", status: "closed", followUp: "archive" } },
    { id: "open", score: 0.72, metadata: { workOrder: "WO-2", status: "dispatched", followUp: "confirm arrival" } }
  ]);
  assert.equal(result?.id, "open");
});

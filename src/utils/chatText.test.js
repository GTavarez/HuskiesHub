// Run with: node --test src/utils/chatText.test.js
import test from "node:test";
import assert from "node:assert";
import { segmentMessage, dayLabel, layoutMessages, upsertMessage, muteLabel, unreadLabel } from "./chatText.js";

test("links are split out and trailing punctuation stays outside", () => {
  const out = segmentMessage("See https://example.com/a?b=1. Thanks");
  assert.deepStrictEqual(out.map((s) => s.type), ["text", "link", "text"]);
  assert.strictEqual(out[1].value, "https://example.com/a?b=1");
  assert.strictEqual(out[2].value, ". Thanks");
});

test("only real names are highlighted as mentions, longest name first", () => {
  const names = ["Pat Coach", "Pat"];
  const out = segmentMessage("hi @Pat Coach and @Nobody", names);
  assert.deepStrictEqual(
    out.filter((s) => s.type === "mention").map((s) => s.value),
    ["@Pat Coach"]
  );
  assert.strictEqual(segmentMessage("just text").length, 1);
  assert.deepStrictEqual(segmentMessage(""), []);
});

test("regex characters in a name don't break the mention match", () => {
  const out = segmentMessage("ping @A. (Lee) now", ["A. (Lee)"]);
  assert.ok(out.some((s) => s.type === "mention" && s.value === "@A. (Lee)"));
});

test("day labels", () => {
  const now = new Date(2026, 9, 5, 12);
  assert.strictEqual(dayLabel(new Date(2026, 9, 5, 8), now), "Today");
  assert.strictEqual(dayLabel(new Date(2026, 9, 4, 23), now), "Yesterday");
  assert.match(dayLabel(new Date(2026, 8, 1), now), /Sep/);
  assert.match(dayLabel(new Date(2025, 8, 1), now), /2025/);
});

test("layout adds a day divider and groups runs from one sender", () => {
  const now = new Date(2026, 9, 5, 12);
  const at = (h, m) => new Date(2026, 9, 5, h, m).toISOString();
  const rows = layoutMessages(
    [
      { _id: "1", senderId: "a", createdAt: at(9, 0) },
      { _id: "2", senderId: "a", createdAt: at(9, 2) },
      { _id: "3", senderId: "b", createdAt: at(9, 3) },
      { _id: "4", senderId: "b", createdAt: at(10, 0) },
    ],
    now
  );
  assert.strictEqual(rows[0].type, "day");
  const messages = rows.filter((r) => r.type === "message");
  assert.deepStrictEqual(messages.map((r) => r.continues), [false, true, false, false]);
});

test("a deleted message never groups with its neighbors", () => {
  const rows = layoutMessages([
    { _id: "1", senderId: "a", createdAt: new Date(2026, 9, 5, 9, 0).toISOString() },
    { _id: "2", senderId: "a", createdAt: new Date(2026, 9, 5, 9, 1).toISOString(), deletedAt: "x" },
  ]);
  assert.strictEqual(rows.filter((r) => r.type === "message")[1].continues, false);
});

test("upsert replaces by id or appends", () => {
  const list = [{ _id: "1", text: "a" }];
  assert.deepStrictEqual(upsertMessage(list, { _id: "1", text: "b" }), [{ _id: "1", text: "b" }]);
  assert.strictEqual(upsertMessage(list, { _id: "2", text: "c" }).length, 2);
});

test("mute and unread labels", () => {
  const now = new Date();
  assert.strictEqual(muteLabel(null), "");
  assert.strictEqual(muteLabel(new Date(now - 1000)), "");
  assert.match(muteLabel(new Date(+now + 30 * 60000), now), /30 min/);
  assert.match(muteLabel(new Date(+now + 3 * 3600000), now), /3 hr/);
  assert.strictEqual(muteLabel(new Date(+now + 100 * 365 * 86400000), now), "Muted");
  assert.strictEqual(unreadLabel(3), "3");
  assert.strictEqual(unreadLabel(250), "99+");
});

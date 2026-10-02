// Run with: node --test src/utils/attendanceSummary.test.js
import test from "node:test";
import assert from "node:assert";
import { summarizeRsvps } from "./attendanceSummary.js";

// Ella has her own login plus a parent; Maya has two parents; Zoe has one.
const contacts = [
  { _id: "u1", name: "Ella", attendeeName: "Ella McHugh", role: "player" },
  { _id: "u2", name: "Shaun McHugh", attendeeName: "Ella McHugh", role: "parent" },
  { _id: "u3", name: "Pat Lee", attendeeName: "Maya Lee", role: "parent" },
  { _id: "u4", name: "Sam Lee", attendeeName: "Maya Lee", role: "parent" },
  { _id: "u5", name: "Kim Cho", attendeeName: "Zoe Cho", role: "parent" },
];

test("a player answered for by two accounts is counted once", () => {
  const out = summarizeRsvps(
    [
      { userId: "u1", status: "yes", respondedAt: "2026-10-01T10:00:00Z" },
      { userId: "u2", status: "yes", respondedAt: "2026-10-01T11:00:00Z" },
    ],
    contacts
  );
  assert.deepStrictEqual(out.yes, ["Ella McHugh"]);
  assert.strictEqual(out.respondedCount, 1);
});

test("conflicting answers for one player: the latest wins", () => {
  const out = summarizeRsvps(
    [
      { userId: "u3", status: "yes", respondedAt: "2026-10-01T10:00:00Z" },
      { userId: "u4", status: "no", respondedAt: "2026-10-01T12:00:00Z" },
    ],
    contacts
  );
  assert.deepStrictEqual(out.no, ["Maya Lee"]);
  assert.deepStrictEqual(out.yes, []);
});

test("not-yet-responded lists each player once, by player name", () => {
  const out = summarizeRsvps([{ userId: "u5", status: "maybe", respondedAt: "2026-10-01T10:00:00Z" }], contacts);
  assert.deepStrictEqual(out.notYetResponded, ["Ella McHugh", "Maya Lee"]);
  assert.deepStrictEqual(out.maybe, ["Zoe Cho"]);
});

test("a response from someone no longer on the team is ignored", () => {
  const out = summarizeRsvps([{ userId: "gone", status: "yes", respondedAt: "2026-10-01T10:00:00Z" }], contacts);
  assert.strictEqual(out.respondedCount, 0);
  assert.strictEqual(out.notYetResponded.length, 3);
});

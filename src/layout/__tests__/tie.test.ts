/**
 * @jest-environment jsdom
 */

import { Clef, Note } from "@/core/types";
import * as vi from "vitest";
import { determineNoteStyle, gapElementStyle } from "../staff-element";
import { insertTieStyles } from "../tie";

vi.test("insertTieStyles", () => {
  const clef: Clef = { type: "clef", pitch: "g" };
  const cNote: Note = { type: "note", duration: 1, pitches: [{ pitch: 0 }] };
  const gap = gapElementStyle({ width: 1, height: 1 });
  const styles = [
    gap,
    determineNoteStyle({ clef, note: { ...cNote, tie: "begin" } }),
    gap,
    determineNoteStyle({ clef, note: { ...cNote, tie: "continue" } }),
    gap,
    determineNoteStyle({ clef, note: { ...cNote, tie: "end" } }),
  ];
  const expectedTypes = [
    "gap",
    "tie",
    "note",
    "gap",
    "tie",
    "note",
    "gap",
    "note",
  ];
  const actual = insertTieStyles(styles);
  const actualTypes = actual.map((s) => s.element.type);
  vi.expect(actualTypes).toEqual(expectedTypes);
});

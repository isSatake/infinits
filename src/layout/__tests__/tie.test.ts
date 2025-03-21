/**
 * @jest-environment jsdom
 */

import * as vi from "vitest";
import { insertTieStyles } from "../tie";
import { determineNoteStyle, gapElementStyle } from "../staff-element";
import { Note } from "@/core/types";

vi.test("insertTieStyles", () => {
  const cNote: Note = { type: "note", duration: 1, pitches: [{ pitch: 0 }] };
  const gap = gapElementStyle({ width: 1, height: 1 });
  const styles = [
    gap,
    determineNoteStyle({ note: { ...cNote, tie: "begin" } }),
    gap,
    determineNoteStyle({ note: { ...cNote, tie: "continue" } }),
    gap,
    determineNoteStyle({ note: { ...cNote, tie: "end" } }),
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

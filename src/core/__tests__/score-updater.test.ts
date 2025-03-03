import * as vi from "vitest";
import { connectTie } from "../score-updater";
import { MusicalElement } from "../types";

vi.describe("connectTie", () => {
  const c: MusicalElement = {
    type: "note",
    pitches: [{ pitch: 0 }],
    duration: 1,
  };
  const csharp: MusicalElement = {
    type: "note",
    pitches: [{ pitch: 0, accidental: "sharp" }],
    duration: 1,
  };
  const d: MusicalElement = {
    type: "note",
    pitches: [{ pitch: 1 }],
    duration: 1,
  };
  const rest: MusicalElement = { type: "rest", duration: 1 };
  vi.describe("should connect", () => {
    vi.test.each([
      {
        title: "same pitch",
        elements: [c],
        newElement: c,
        expected: {
          elements: [{ ...c, tie: "begin" }],
          newElement: { ...c, tie: "end" },
        },
      },
      {
        title: "same pitch and accidental",
        elements: [csharp],
        newElement: csharp,
        expected: {
          elements: [{ ...csharp, tie: "begin" }],
          newElement: { ...csharp, tie: "end" },
        },
      },
    ])("$title", (p) => {
      const ret = connectTie(p);
      vi.expect(ret).toEqual(p.expected);
    });
  });
  vi.describe("should not connect", () => {
    vi.test.each([
      { title: "no elements", newElement: c, elements: [] },
      {
        title: "last element is not note",
        elements: [rest],
        newElement: c,
      },
      {
        title: "new element is not note",
        elements: [c],
        newElement: rest,
      },
      {
        title: "different pitch",
        elements: [d],
        newElement: c,
      },
      {
        title: "different accidental",
        elements: [csharp],
        newElement: c,
      },
    ])("$title", (p) => {
      const ret = connectTie(p);
      vi.expect(ret.elements).toEqual(p.elements);
      vi.expect(ret.newElement).toEqual(p.newElement);
    });
  });
});

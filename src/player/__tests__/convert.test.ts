import * as vi from "vitest";
import { convert } from "../convert";
import { keySignatures } from "@/core/types";

vi.describe("convert", () => {
  vi.test("basic", () => {
    const C = keySignatures.C;
    vi.expect(convert(C, { pitch: -7 })).toBe("C3");
    vi.expect(convert(C, { pitch: 0 })).toBe("C4");
    vi.expect(convert(C, { pitch: 7 })).toBe("C5");
    vi.expect(convert(C, { pitch: 0, accidental: "sharp" })).toBe("C#4");
    vi.expect(convert(C, { pitch: 0, accidental: "flat" })).toBe("Cb4");
    vi.expect(convert(C, { pitch: 0, accidental: "dSharp" })).toBe("C##4");
    vi.expect(convert(C, { pitch: 0, accidental: "dFlat" })).toBe("Cbb4");
  });
  vi.test("key", () => {
    const G = keySignatures.G;
    vi.expect(convert(G, { pitch: 3 })).toBe("F#4");
    vi.expect(convert(G, { pitch: 3, accidental: "sharp" })).toBe("F#4");
    vi.expect(convert(G, { pitch: 3, accidental: "flat" })).toBe("Fb4");
    vi.expect(convert(G, { pitch: 3, accidental: "dSharp" })).toBe("F##4");
    vi.expect(convert(G, { pitch: 3, accidental: "dFlat" })).toBe("Fbb4");
    vi.expect(convert(G, { pitch: 3, accidental: "natural" })).toBe("F4");

    const D = keySignatures.D;
    vi.expect(convert(D, { pitch: 0 })).toBe("C#4");
    vi.expect(convert(D, { pitch: 0, accidental: "sharp" })).toBe("C#4");
    vi.expect(convert(D, { pitch: 0, accidental: "flat" })).toBe("Cb4");
    vi.expect(convert(D, { pitch: 0, accidental: "dSharp" })).toBe("C##4");
    vi.expect(convert(D, { pitch: 0, accidental: "dFlat" })).toBe("Cbb4");
    vi.expect(convert(D, { pitch: 0, accidental: "natural" })).toBe("C4");
  });
});

import { Beam, MusicalElement, Note } from "./types";

export const normalizeBeams = (
  elements: MusicalElement[]
): MusicalElement[] => {
  const result: MusicalElement[] = [];
  let beamGroup: { index: number; note: Note }[] = [];

  const flushBeamGroup = () => {
    if (beamGroup.length === 1) {
      // 単音なら beam 削除
      const { note, index } = beamGroup[0];
      result[index] = { ...note, beam: undefined };
    } else if (beamGroup.length > 1) {
      beamGroup.forEach(({ note, index }, i) => {
        const beam: Beam =
          i === 0 ? "begin" : i === beamGroup.length - 1 ? "end" : "continue";
        result[index] = { ...note, beam };
      });
    }
    beamGroup = [];
  };

  elements.forEach((el) => {
    if (el.type === "note") {
      const note = el;
      if (!note.beam) {
        flushBeamGroup();
        result.push(note);
        return;
      }

      if (note.duration >= 8) {
        // 一旦 placeholder（後で上書き）を入れる
        result.push(null as any);
        beamGroup.push({ index: result.length - 1, note });
      } else {
        flushBeamGroup();
        result.push(note);
      }
    } else {
      flushBeamGroup();
      result.push(el);
    }
  });

  flushBeamGroup(); // 最後に残ったものも flush

  return result;
};

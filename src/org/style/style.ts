import { kDefaultStaffWidth } from "@/constants";
import {
  bBarlineSeparation,
  bBeamSpacing,
  bBeamThickness,
  bClefG,
  bLedgerLineThickness,
  bRepeatBarlineDotSeparation,
  bStaffHeight,
  bStaffLineWidth,
  bStemWidth,
  bThickBarlineThickness,
  bThinBarlineThickness,
  EXTENSION_LEDGER_LINE,
  repeatDotRadius,
  UNIT,
} from "../font/bravura";
import { BBox, getPathBBox, offsetBBox, Point } from "../geometry";
import {
  accidentalPathMap,
  downFlagMap,
  noteHeadByDuration,
  noteHeadWidth,
  numOfBeamsMap,
  restPathMap,
  upFlagMap,
} from "../notation/constants";
import {
  Bar,
  Clef,
  Duration,
  MusicalElement,
  Note,
  Pitch,
  PitchAcc,
  Rest,
  Staff,
} from "../notation/types";
import { kDefaultCaretWidth } from "../score-preferences";
import { StaffStyle } from "../score-states";
import {
  BarStyle,
  BeamStyle,
  CaretOption,
  CaretStyle,
  ClefStyle,
  GapStyle,
  NoteHeadElement,
  NoteStyle,
  NoteStyleElement,
  PaintElement,
  PaintElementStyle,
  Pointing,
  RestStyle,
  TieStyle,
} from "./types";

const kPointingColor = "#FF0000";

const tiePosition = (noteHeadPos: Point, noteHeadBBox: BBox): Point => {
  // TODO pos.yはnote headの中心なのでそれを考慮したい
  return {
    x: noteHeadPos.x + (noteHeadBBox.right - noteHeadBBox.left) / 2,
    y: noteHeadPos.y + (noteHeadBBox.bottom - noteHeadBBox.top),
  };
};

const determineNoteStyle = ({
  note,
  stemDirection,
  beamed = false,
  pointing,
}: {
  note: Note;
  stemDirection?: "up" | "down";
  beamed?: boolean;
  pointing?: Pointing;
}): {
  element: NoteStyle;
  width: number;
  stemOffsetLeft: number;
  bbox: BBox;
} => {
  const elements: NoteStyleElement[] = [];
  const bboxes: BBox[] = [];

  // accidentals
  const accBBoxes: BBox[] = [];
  for (const p of note.pitches) {
    if (!p.accidental) {
      continue;
    }
    const { pitch, accidental } = p;
    const y = pitchToY(0, pitch, 1);
    accBBoxes.push(getPathBBox(accidentalPathMap().get(accidental)!, UNIT));
    elements.push({
      type: "accidental",
      position: { x: 0, y },
      accidental,
    });
  }
  bboxes.push(...accBBoxes);

  // ledger lines
  let leftOfLedgerLine = 0;
  if (accBBoxes.length > 0) {
    // Accidentalが描画されていればledger line開始位置を右にずらす
    leftOfLedgerLine = accBBoxes[0].right + gapWithAccidental(1);
  }
  const pitches = note.pitches.map((p) => p.pitch);
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);
  const ledgerWidth = ledgerLineWidth(note.duration);
  const ledgerBBoxes: BBox[] = [];
  // min<=0 && max<=0 : minのみ描画
  // min>=12 && max>=12 : maxのみ描画
  // min===max && min<=0 : minのみ描画
  // min===max && min>=12 : minのみ描画
  // min<=0 && max>=12 : min, max描画
  if (minPitch <= 0) {
    // C4
    for (let p = 0; p >= minPitch; p -= 2) {
      const y = pitchToY(0, p, 1);
      elements.push({
        type: "ledger",
        width: ledgerWidth,
        position: { x: leftOfLedgerLine, y },
      });
      ledgerBBoxes.push({
        left: leftOfLedgerLine,
        right: leftOfLedgerLine + ledgerWidth,
        top: y - bLedgerLineThickness,
        bottom: y + bLedgerLineThickness,
      });
    }
  }
  if (maxPitch >= 12) {
    // A5
    for (let p = 12; p < maxPitch + 1; p += 2) {
      const y = pitchToY(0, p, 1);
      elements.push({
        type: "ledger",
        width: ledgerWidth,
        position: { x: leftOfLedgerLine, y },
      });
      ledgerBBoxes.push({
        left: leftOfLedgerLine,
        right: leftOfLedgerLine + ledgerWidth,
        top: y - bLedgerLineThickness,
        bottom: y + bLedgerLineThickness,
      });
    }
  }
  bboxes.push(...ledgerBBoxes);

  // noteheads
  let leftOfNotehead = 0;
  if (ledgerBBoxes.length > 0) {
    // Ledger lineが描画されていればnote描画位置を右にずらす
    leftOfNotehead = ledgerBBoxes[0].left + ledgerLineExtension(1);
  } else if (accBBoxes.length > 0) {
    // Accidentalが描画されていればnote描画位置を右にずらす
    leftOfNotehead = accBBoxes[0]?.right + gapWithAccidental(1) * 2; // *2とは？
  }
  // stemの左右どちらに音符を描画するか
  if (!stemDirection) {
    stemDirection = getStemDirection(pitches);
  }
  const notesLeftOfStem: PitchAcc[] = [];
  const notesRightOfStem: PitchAcc[] = [];
  const pitchAsc = sortPitch(note.pitches, "asc");
  if (stemDirection === "up") {
    // 上向きstem
    for (let i = 0; i < pitchAsc.length; i++) {
      if (i === 0) {
        // 最低音は左側
        notesLeftOfStem.push(pitchAsc[i]);
      } else if (pitchAsc[i].pitch - pitchAsc[i - 1].pitch === 1) {
        // 2度は右側
        notesRightOfStem.push(pitchAsc[i]);
        if (i + 1 < pitchAsc.length) {
          // 右側描画となった次の音は左側
          notesLeftOfStem.push(pitchAsc[++i]);
        }
      } else {
        notesLeftOfStem.push(pitchAsc[i]);
      }
    }
  } else {
    // 下向きstem
    const pitchDesc = pitchAsc.concat().reverse();
    for (let i = 0; i < pitchDesc.length; i++) {
      if (i === 0) {
        // 最低音は右側
        notesRightOfStem.push(pitchDesc[i]);
      } else if (pitchDesc[i - 1].pitch - pitchDesc[i].pitch === 1) {
        // 2度は左側
        notesLeftOfStem.push(pitchDesc[i]);
        if (i + 1 < pitchDesc.length) {
          // 左側描画となった次の音は右側
          notesRightOfStem.push(pitchDesc[++i]);
        }
      } else {
        notesRightOfStem.push(pitchDesc[i]);
      }
    }
  }
  const noteheadStemFlagBBoxes: BBox[] = [];
  for (const p of notesLeftOfStem) {
    const position = {
      x: leftOfNotehead,
      y: pitchToY(0, p.pitch, 1),
    };
    const bbox = offsetBBox(
      getPathBBox(noteHeadByDuration(note.duration), UNIT),
      position
    );
    elements.push({
      type: "head",
      position,
      duration: note.duration,
      tie: tiePosition(position, bbox),
    });
    noteheadStemFlagBBoxes.push(bbox);
  }
  let leftOfStemOrNotehead = leftOfNotehead;
  if (notesLeftOfStem.length > 0) {
    // Stem左側にnotehead描画していたらnotehead右端をstem開始位置に指定する
    leftOfStemOrNotehead = noteheadStemFlagBBoxes[0].right;
  }
  bboxes.push(...noteheadStemFlagBBoxes);
  if (!beamed) {
    // stem, flag
    const { elements: el, bboxes: stemFlagBB } = determineStemFlagStyle({
      left: leftOfStemOrNotehead,
      duration: note.duration,
      direction: stemDirection,
      lowest: pitchAsc[0],
      highest: pitchAsc[pitchAsc.length - 1],
    });
    elements.push(...el);
    bboxes.push(...stemFlagBB);
  }
  for (const p of notesRightOfStem) {
    const position = {
      x: leftOfNotehead,
      y: pitchToY(0, p.pitch, 1),
    };
    const bbox = offsetBBox(
      getPathBBox(noteHeadByDuration(note.duration), UNIT),
      position
    );
    elements.push({
      type: "head",
      position,
      duration: note.duration,
      tie: tiePosition(position, bbox),
    });
    bboxes.push(bbox);
  }
  console.log("note bboxes", bboxes);
  const bbox = mergeBBoxes(bboxes);
  return {
    element: {
      type: "note",
      note,
      elements,
      ...(pointing ? { color: kPointingColor } : undefined),
    },
    width: bbox.right - bbox.left,
    stemOffsetLeft: leftOfStemOrNotehead,
    bbox,
  };
};

const mergeBBoxes = (bboxes: BBox[]): BBox => {
  let ret: BBox | undefined;
  for (let b of bboxes) {
    if (ret) {
      if (b.left < ret.left) {
        ret.left = b.left;
      }
      if (b.top < ret.top) {
        ret.top = b.top;
      }
      if (b.right > ret.right) {
        ret.right = b.right;
      }
      if (b.bottom > ret.bottom) {
        ret.bottom = b.bottom;
      }
    } else {
      ret = b;
    }
  }
  return ret!;
};

// note headからはみ出る長さ(片方)
const ledgerLineExtension = (scale: number): number => {
  return UNIT * EXTENSION_LEDGER_LINE * scale;
};

const ledgerLineWidth = (duration: Duration): number => {
  return noteHeadWidth(duration) + ledgerLineExtension(1) * 2;
};

const getStemDirection = (pitches: Pitch[]): "up" | "down" => {
  // B4から最も遠い音程を計算する
  // B4未満 -> 上向き (楽譜の書き方p17)
  const lowestToB4 = 6 - Math.min(...pitches);
  const highestToB4 = Math.max(...pitches) - 6;
  if (lowestToB4 > highestToB4) {
    return "up";
  } else if (highestToB4 > lowestToB4) {
    return "down";
  }
  // calc direction by center of pitches if lowest and highest are same
  return centerOfNotes(pitches) < 6 ? "up" : "down";
};

const centerOfNotes = (pitches: Pitch[]): Pitch => {
  const average = pitches.reduce((prev, curr) => prev + curr) / pitches.length;
  return Math.round(average);
};
const calcStemShape = ({
  dnp,
  direction,
  lowest,
  highest,
  extension = 0,
}: {
  dnp: { topOfStaff: number; scale: number; duration: Duration };
  direction: "up" | "down";
  lowest: PitchAcc;
  highest: PitchAcc;
  extension?: number;
}): { top: number; bottom: number } => {
  const { topOfStaff, scale, duration } = dnp;
  const heightOfB4 = topOfStaff + (bStaffHeight * scale) / 2;
  let top: number;
  let bottom: number;
  if (direction === "up") {
    // 符頭の右に符幹がはみ出るのを補正
    bottom = pitchToY(topOfStaff, lowest.pitch, scale) - 5;
    if (highest.pitch < 0) {
      // C4より低い -> topはB4 (楽譜の書き方p17)
      top = heightOfB4;
    } else {
      // stemの長さは基本1オクターブ分 (楽譜の書き方p17)
      // 32分以降は1間ずつ長くする (楽譜の書き方p53)
      const index = duration < 32 ? highest.pitch + 7 : highest.pitch + 8;
      top = pitchToY(topOfStaff, index, scale);
    }
    top -= extension;
  } else {
    top = pitchToY(topOfStaff, highest.pitch, scale);
    if (lowest.pitch > 12) {
      // A5より高い -> bottomはB3
      bottom = heightOfB4;
    } else {
      const index = duration < 32 ? lowest.pitch - 7 : lowest.pitch - 8;
      bottom = pitchToY(topOfStaff, index, scale);
    }
    bottom += extension;
  }
  return { top, bottom };
};

const gapWithAccidental = (scale: number): number => {
  return (UNIT / 4) * scale; // 勘
};

const determineStemFlagStyle = ({
  left,
  duration,
  direction,
  lowest,
  highest,
  beamed,
}: {
  left: number;
  duration: Duration;
  direction: "up" | "down";
  lowest: PitchAcc;
  highest: PitchAcc;
  beamed?: {
    top?: number;
    bottom?: number;
  };
}): { elements: NoteStyleElement[]; bboxes: BBox[] } => {
  if (duration === 1) {
    return { elements: [], bboxes: [] };
  }
  const elements: NoteStyleElement[] = [];
  let { top, bottom } = calcStemShape({
    dnp: { topOfStaff: 0, scale: 1, duration },
    direction,
    lowest,
    highest,
  });
  let stemCenter: number;
  const bboxes: BBox[] = [];
  if (direction === "up") {
    stemCenter = left - bStemWidth / 2;
    if (beamed) {
      top = beamed.top!;
    } else {
      const path = upFlagMap().get(duration);
      const left = stemCenter - bStemWidth / 2;
      if (path) {
        const position = {
          x: left + UNIT * path.stemUpNW.x,
          y: top + UNIT * path.stemUpNW.y,
        };
        elements.push({
          type: "flag",
          position,
          duration, // pathも渡したほうがいいんだろうか
          direction,
        });
        bboxes.push(offsetBBox(getPathBBox(path, UNIT), position));
      }
    }
  } else {
    stemCenter = left + bStemWidth / 2;
    if (beamed) {
      bottom = beamed.bottom!;
    } else {
      const path = downFlagMap().get(duration);
      if (path) {
        const position = {
          x: stemCenter - bStemWidth / 2 + UNIT * path.stemDownSW.x,
          y: bottom + UNIT * path.stemDownSW.y,
        };
        elements.push({
          type: "flag",
          position,
          duration,
          direction,
        });
        bboxes.push(offsetBBox(getPathBBox(path, UNIT), position));
      }
    }
  }
  const stemEl: NoteStyleElement = {
    type: "stem",
    position: { x: stemCenter - bStemWidth / 2, y: top },
    width: bStemWidth,
    height: bottom - top,
  };
  elements.push(stemEl);
  bboxes.push({
    left: stemEl.position.x,
    top: stemEl.position.y,
    right: stemEl.position.x + stemEl.width,
    bottom: stemEl.position.y + stemEl.height,
  });
  return { elements, bboxes };
};

const determineRestStyle = (
  rest: Rest,
  pointing?: Pointing
): { element: RestStyle; bbox: BBox; width: number } => {
  const path = restPathMap().get(rest.duration)!;
  const y = UNIT * path.originUnits;
  const pathOrigin = { x: 0, y };
  const bbox = offsetBBox(getPathBBox(path, UNIT), { y });
  return {
    element: {
      type: "rest",
      rest,
      position: pathOrigin,
      ...(pointing ? { color: kPointingColor } : {}),
    },
    bbox,
    width: bbox.right - bbox.left,
  };
};

const determineBarStyle = (
  bar: Bar,
  pointing?: Pointing
): { element: BarStyle; bbox: BBox; width: number } => {
  const thinWidth = bThinBarlineThickness * UNIT;
  const barlineSeparation = bBarlineSeparation * UNIT;
  if (bar.subtype === "single") {
    return {
      element: {
        type: "bar",
        bar,
        ...(pointing ? { color: kPointingColor } : {}),
        elements: [
          {
            type: "line",
            position: { x: 0, y: 0 },
            height: bStaffHeight,
            lineWidth: thinWidth,
          },
        ],
      },
      width: thinWidth,
      bbox: {
        left: 0,
        top: 0,
        right: thinWidth,
        bottom: bStaffHeight,
      },
    };
  } else if (bar.subtype === "double") {
    return {
      element: {
        type: "bar",
        bar,
        ...(pointing ? { color: kPointingColor } : {}),
        elements: [
          {
            type: "line",
            position: { x: 0, y: 0 },
            height: bStaffHeight,
            lineWidth: thinWidth,
          },
          {
            type: "line",
            position: { x: thinWidth + barlineSeparation, y: 0 }, // TODO x
            height: bStaffHeight,
            lineWidth: thinWidth,
          },
        ],
      },
      width: barlineSeparation + thinWidth * 2,
      bbox: {
        left: 0,
        top: 0,
        right: barlineSeparation + thinWidth * 2,
        bottom: bStaffHeight,
      },
    };
  } else if (bar.subtype === "final") {
    const boldWidth = bThickBarlineThickness * UNIT;
    const width = thinWidth + barlineSeparation + boldWidth;
    return {
      element: {
        type: "bar",
        bar,
        ...(pointing ? { color: kPointingColor } : {}),
        elements: [
          {
            type: "line",
            position: { x: 0, y: 0 },
            height: bStaffHeight,
            lineWidth: thinWidth,
          },
          {
            type: "line",
            position: {
              x: thinWidth + barlineSeparation,
              y: 0,
            },
            height: bStaffHeight,
            lineWidth: boldWidth,
          },
        ],
      },
      width,
      bbox: {
        left: 0,
        top: 0,
        right: width,
        bottom: bStaffHeight,
      },
    };
  } else {
    // repeat
    const boldWidth = bThickBarlineThickness * UNIT;
    const dotToLineSeparation = bRepeatBarlineDotSeparation * UNIT;
    const width =
      repeatDotRadius * 2 +
      dotToLineSeparation +
      thinWidth +
      barlineSeparation +
      boldWidth;
    return {
      element: {
        type: "bar",
        bar,
        ...(pointing ? { color: kPointingColor } : {}),
        elements: [
          {
            type: "dot",
            position: { x: 0, y: UNIT + UNIT / 2 }, // 第2間
          },
          {
            type: "line",
            position: { x: repeatDotRadius * 2 + dotToLineSeparation, y: 0 },
            height: bStaffHeight,
            lineWidth: thinWidth,
          },
          {
            type: "line",
            position: {
              x:
                repeatDotRadius * 2 +
                dotToLineSeparation +
                thinWidth +
                barlineSeparation,
              y: 0,
            },
            height: bStaffHeight,
            lineWidth: boldWidth,
          },
        ],
      },
      width,
      bbox: {
        left: 0,
        top: 0,
        right: width,
        bottom: bStaffHeight,
      },
    };
  }
};

export const pitchToY = (
  topOfStaff: number,
  pitch: Pitch,
  scale: number
): number => {
  // middleC(C4)=0とする
  // y原点は符頭の中心(音程を示す高さ)
  const halfOfNoteHeadHeight = (bStaffHeight * scale) / 8;
  const c4y = topOfStaff + UNIT * 4.5 * scale + halfOfNoteHeadHeight;
  return c4y - pitch * halfOfNoteHeadHeight;
};
const getBeamLinearFunc = ({
  dnp,
  stemDirection,
  beamed,
  arr,
}: {
  dnp: { topOfStaff: number; scale: number; duration: Duration };
  stemDirection: "up" | "down";
  beamed: Note[];
  arr: { left: number; stemOffsetLeft: number }[];
}): ((x: number) => number) => {
  const firstEl = beamed[0];
  const lastEl = beamed[beamed.length - 1];
  const yDistance4th = (UNIT / 2) * 3 * dnp.scale;
  const stemDistance =
    arr[arr.length - 1].left +
    arr[arr.length - 1].stemOffsetLeft -
    (arr[0].left + arr[0].stemOffsetLeft);
  let beamAngle: number;
  let 最短stemとbeamの交点y: Point;
  if (stemDirection === "up") {
    if (beamed.length === 1) {
      beamAngle = 0;
    } else {
      const pitchFirstHi = firstEl.pitches[firstEl.pitches.length - 1].pitch;
      const pitchLastHi = lastEl.pitches[lastEl.pitches.length - 1].pitch;
      const yFirst = pitchToY(dnp.topOfStaff, pitchFirstHi, dnp.scale);
      const yLast = pitchToY(dnp.topOfStaff, pitchLastHi, dnp.scale);
      const yDistance = yLast - yFirst;
      if (pitchFirstHi > pitchLastHi) {
        // 右肩下がり
        beamAngle =
          (yDistance >= yDistance4th ? yDistance4th : yDistance) / stemDistance;
      } else {
        // 右肩上がり
        beamAngle =
          (-yDistance >= yDistance4th ? -yDistance4th : yDistance) /
          stemDistance;
      }
    }
    // calc 交点
    const beamedAndLeftOfStem = beamed.map((note, i) => ({
      note,
      leftOfStem: arr[i].left + arr[i].stemOffsetLeft,
    }));
    const highest = beamedAndLeftOfStem.sort(
      (a, b) =>
        b.note.pitches[b.note.pitches.length - 1].pitch -
        a.note.pitches[a.note.pitches.length - 1].pitch
    )[0];
    const x = highest.leftOfStem;
    const y = calcStemShape({
      dnp,
      direction: stemDirection,
      lowest: { pitch: highest.note.pitches[0].pitch },
      highest: {
        pitch: highest.note.pitches[highest.note.pitches.length - 1].pitch,
      },
    }).top;
    最短stemとbeamの交点y = { x, y };
  } else {
    if (beamed.length === 1) {
      beamAngle = 0;
    } else {
      const pitchFirstLo = firstEl.pitches[0].pitch;
      const pitchLastLo = lastEl.pitches[0].pitch;
      const yFirst = pitchToY(dnp.topOfStaff, pitchFirstLo, dnp.scale);
      const yLast = pitchToY(dnp.topOfStaff, pitchLastLo, dnp.scale);
      const yDistance = yLast - yFirst;
      if (pitchFirstLo > pitchLastLo) {
        // 右肩下がり
        beamAngle =
          (yDistance >= yDistance4th ? yDistance4th : yDistance) / stemDistance;
      } else {
        // 右肩上がり
        beamAngle =
          (-yDistance >= yDistance4th ? -yDistance4th : yDistance) /
          stemDistance;
      }
    }
    // calc 交点
    const beamedAndLeftOfStem = beamed.map((note, i) => ({
      note,
      leftOfStem: arr[i].left + arr[i].stemOffsetLeft,
    }));
    const lowest = beamedAndLeftOfStem.sort(
      (a, b) => a.note.pitches[0].pitch - b.note.pitches[0].pitch
    )[0];
    const x = lowest.leftOfStem;
    const y = calcStemShape({
      dnp,
      direction: stemDirection,
      lowest: { pitch: lowest.note.pitches[0].pitch },
      highest: {
        pitch: lowest.note.pitches[lowest.note.pitches.length - 1].pitch,
      },
    }).bottom;
    最短stemとbeamの交点y = { x, y };
  }

  const { x, y } = 最短stemとbeamの交点y;
  const 切片 = -x * beamAngle + y;
  return (stemX: number) => stemX * beamAngle + 切片;
};

const getBeamShape = ({
  scale,
  stemDirection,
  beamLeft,
  beamRight,
  stemLinearFunc,
  offsetY = 0,
}: {
  scale: number;
  stemDirection: "up" | "down";
  beamLeft: number;
  beamRight: number;
  stemLinearFunc: (stemX: number) => number;
  offsetY?: number;
}): { nw: Point; ne: Point; sw: Point; se: Point } => {
  const beamHeight = UNIT * bBeamThickness * scale;
  // first note
  const firstStemEdge =
    stemLinearFunc(beamLeft) + (stemDirection === "up" ? offsetY : -offsetY);
  const nw = {
    x: beamLeft,
    y: stemDirection === "up" ? firstStemEdge : firstStemEdge - beamHeight,
  };
  const sw = {
    x: beamLeft,
    y: stemDirection === "up" ? firstStemEdge + beamHeight : firstStemEdge,
  };
  // last note
  const lastStemEdge =
    stemLinearFunc(beamRight) + (stemDirection === "up" ? offsetY : -offsetY);
  const ne = {
    x: beamRight,
    y: stemDirection === "up" ? lastStemEdge : lastStemEdge - beamHeight,
  };
  const se = {
    x: beamRight,
    y: stemDirection === "up" ? lastStemEdge + beamHeight : lastStemEdge,
  };
  return { nw, ne, se, sw };
};

const sortPitch = (p: PitchAcc[], dir: "asc" | "dsc"): PitchAcc[] => {
  const comparator = (a: PitchAcc, b: PitchAcc) => {
    if (dir === "asc") {
      return a.pitch < b.pitch;
    } else {
      return b.pitch < a.pitch;
    }
  };
  return p.sort((a, b) => {
    if (comparator(a, b)) {
      return -1;
    } else if (a.pitch === b.pitch) {
      return 0;
    } else {
      return 1;
    }
  });
};

const determineBeamStyle = (p: {
  beamedNotes: Note[];
  notePositions: { left: number; stemOffsetLeft: number }[];
  linearFunc: (x: number) => number;
  stemDirection: "up" | "down";
  duration?: Duration;
  headOrTail?: "head" | "tail";
}): PaintElementStyle<BeamStyle>[] => {
  const {
    beamedNotes,
    notePositions,
    linearFunc,
    stemDirection,
    duration = 8,
    headOrTail,
  } = p;
  console.log("determineBeamStyle", duration);
  let shouldExt = false;
  const { beam: lastBeam } = beamedNotes[beamedNotes.length - 1];
  if (lastBeam === "continue" || lastBeam === "begin") {
    // ちょっとbeamを伸ばしてbeam modeであることを明示
    if (duration > 8) {
      shouldExt = headOrTail === "tail";
    } else {
      shouldExt = true;
    }
  }
  let beamLeft = notePositions[0].left + notePositions[0].stemOffsetLeft;
  let beamRight =
    notePositions[notePositions.length - 1].left +
    notePositions[notePositions.length - 1].stemOffsetLeft +
    (shouldExt ? UNIT : 0);
  if (duration > 8 && beamedNotes.length === 1) {
    if (headOrTail === "head") {
      beamRight = beamLeft + UNIT;
    } else if (headOrTail === "tail") {
      beamLeft = beamRight - UNIT;
    }
  }
  const beams: PaintElementStyle<BeamStyle>[] = [];
  const offsetY =
    (UNIT * bBeamThickness + UNIT * bBeamSpacing) *
    (numOfBeamsMap.get(duration)! - 1);
  const shape = getBeamShape({
    scale: 1,
    stemDirection,
    beamLeft,
    beamRight,
    stemLinearFunc: linearFunc,
    offsetY,
  });
  beams.push({
    element: {
      type: "beam",
      ...shape,
    },
    width: beamRight - beamLeft,
    bbox: {
      left: shape.sw.x,
      top: shape.ne.y,
      right: shape.ne.x,
      bottom: shape.sw.y,
    },
  });
  if (duration === 32) {
    return beams;
  }
  const shorterDuration = (duration * 2) as Duration;
  const beamChunks: {
    start: number;
    end: number;
    headOrTail?: "head" | "tail";
  }[] = [];
  let chunkIdx = 0;
  let i = 0;
  let current;
  while (i < beamedNotes.length) {
    const note = beamedNotes[i];
    if (note.duration >= shorterDuration) {
      if (!current) {
        let headOrTail: "head" | "tail" | undefined;
        if (i === 0) {
          headOrTail = "head";
        } else if (i === beamedNotes.length - 1) {
          headOrTail = "tail";
        }
        // 1音だけのbeamも考慮してendにも同じidxを格納
        current = { start: i, end: i, headOrTail };
        beamChunks.push(current);
      }
    } else if (current) {
      beamChunks[chunkIdx].end = i;
      chunkIdx++;
      current = undefined;
    }
    i++;
  }
  if (current) {
    // beamedNotes末尾がshorterDurationの場合を考慮
    beamChunks[chunkIdx].end = beamedNotes.length;
    beamChunks[chunkIdx].headOrTail = "tail";
  }
  console.log(beamChunks);
  for (const { start, end, headOrTail } of beamChunks) {
    beams.push(
      ...determineBeamStyle({
        ...p,
        beamedNotes: beamedNotes.slice(start, end),
        notePositions: notePositions.slice(start, end),
        duration: shorterDuration,
        headOrTail,
      })
    );
  }
  return beams;
};

const determineBeamedNotesStyle = (
  beamedNotes: Note[],
  duration: Duration,
  elementGap: number,
  startIdx: number,
  _pointing?: Pointing
): PaintElementStyle<NoteStyle | BeamStyle | GapStyle>[] => {
  const allBeamedPitches = beamedNotes
    .flatMap((n) => n.pitches)
    .map((p) => p.pitch);
  const stemDirection = getStemDirection(allBeamedPitches);
  const notePositions: { left: number; stemOffsetLeft: number }[] = [];
  const elements: PaintElementStyle<NoteStyle | BeamStyle | GapStyle>[] = [];
  let left = 0;
  for (const _i in beamedNotes) {
    const i = Number(_i);
    const pointing =
      _pointing?.type === "note" && _pointing.index === i + startIdx
        ? _pointing
        : undefined;
    const noteStyle = determineNoteStyle({
      note: beamedNotes[i],
      stemDirection,
      beamed: true,
      pointing,
    });
    notePositions.push({ left, stemOffsetLeft: noteStyle.stemOffsetLeft });
    const caretOption = { index: i + startIdx };
    elements.push({ caretOption, index: i + startIdx, ...noteStyle });
    left += noteStyle.width;
    elements.push(
      gapElementStyle({
        width: elementGap,
        height: bStaffHeight,
        caretOption: {
          ...caretOption,
          index: i + startIdx,
          defaultWidth: true,
        },
      })
    );
    left += elementGap;
  }
  // durationが変わろうが、始点・終点が変わろうが共通
  const linearFunc = getBeamLinearFunc({
    dnp: { topOfStaff: 0, scale: 1, duration },
    stemDirection,
    beamed: beamedNotes,
    arr: notePositions,
  });
  const beams = determineBeamStyle({
    beamedNotes,
    notePositions,
    linearFunc,
    stemDirection,
  });
  for (const i in beamedNotes) {
    const { pitches } = beamedNotes[i];
    const pitchAsc = sortPitch(pitches, "asc");
    const edge = linearFunc(
      notePositions[i].left + notePositions[i].stemOffsetLeft
    );
    let beamed;
    if (stemDirection === "up") {
      beamed = { top: edge };
    } else {
      beamed = { bottom: edge };
    }
    // TODO note側のsectionとmergeしないと正しいwidthにならない
    // beam noteだけgapが狭くなりそう。
    const stemFlag = determineStemFlagStyle({
      left: notePositions[i].stemOffsetLeft,
      duration,
      direction: stemDirection,
      lowest: pitchAsc[0],
      highest: pitchAsc[pitchAsc.length - 1],
      beamed,
    });
    // gapを考慮したindex
    const parent = elements[Number(i) * 2];
    const noteSyle = parent.element as NoteStyle;
    parent.bbox = mergeBBoxes([parent.bbox, ...stemFlag.bboxes]);
    noteSyle.elements.push(...stemFlag.elements);
  }
  return [...beams, ...elements];
};

const determineTieStyle = (
  start: PaintElementStyle<NoteStyle>,
  width: number
): PaintElementStyle<TieStyle> => {
  const startHead = start.element.elements.find(
    (e) => e.type === "head"
  ) as NoteHeadElement;
  return {
    element: {
      type: "tie",
      position: { ...startHead.tie, y: startHead.tie.y - 70 },
      cpLow: { x: width / 2, y: 120 },
      cpHigh: { x: width / 2, y: 180 },
      end: { x: width, y: 0 },
    },
    width,
    bbox: { left: 0, top: 0, right: 0, bottom: 0 },
  };
};

const gapElementStyle = ({
  width,
  height,
  caretOption,
}: {
  width: number;
  height: number;
  caretOption?: CaretOption;
}): PaintElementStyle<GapStyle> => {
  return {
    element: { type: "gap" },
    width,
    bbox: { left: 0, top: 0, right: width, bottom: height },
    caretOption,
  };
};

const determineClefStyle = (
  clef: Clef,
  index: number,
  pointing?: Pointing
): PaintElementStyle<ClefStyle> => {
  const path = getPathBBox(bClefG(), UNIT);
  const g = pitchToY(0, 4, 1);
  return {
    element: {
      type: "clef",
      clef,
      ...(pointing ? { color: kPointingColor } : {}),
    },
    width: path.right - path.left,
    bbox: offsetBBox(path, { y: g }),
    index,
  };
};

export const determinePaintElementStyle = (
  elements: MusicalElement[],
  gapWidth: number,
  staffStyle?: StaffStyle,
  pointing?: Pointing
): PaintElementStyle<PaintElement>[] => {
  const styles: PaintElementStyle<PaintElement>[] = [];
  const gapEl = gapElementStyle({
    width: gapWidth,
    height: bStaffHeight,
  });
  let left = 0;
  console.log("left", left);
  if (staffStyle) {
    styles.push(gapEl);
    left += gapWidth;
    console.log("left", left);
    const { staff } = staffStyle;
    if (staff.clef) {
      const _pointing = pointing?.index === -1 ? pointing : undefined;
      const clef = determineClefStyle(staff.clef, -1, _pointing);
      styles.push(clef);
      left += clef.width;
      console.log("left", left);
    }
  }
  styles.push({ ...gapEl, caretOption: { index: -1, defaultWidth: true } });
  left += gapWidth;
  console.log("left", left);
  let index = 0;
  while (index < elements.length) {
    const el = elements[index];
    if (el.type === "note") {
      if (el.beam === "begin") {
        // 連桁
        const beamedNotes: Note[] = [el];
        let _pointing = pointing?.index === index ? pointing : undefined;
        let nextIdx = index + 1;
        let nextEl = elements[nextIdx];
        while (
          nextEl?.type === "note" &&
          (nextEl.beam === "continue" || nextEl.beam === "end")
        ) {
          if (!_pointing) {
            _pointing = pointing?.index === nextIdx ? pointing : undefined;
          }
          beamedNotes.push(nextEl);
          nextEl = elements[++nextIdx];
        }
        const beamedStyles = determineBeamedNotesStyle(
          beamedNotes,
          el.duration,
          gapWidth,
          index,
          _pointing
        );
        styles.push(...beamedStyles);
        index += beamedNotes.length;
      } else {
        const _pointing = pointing?.index === index ? pointing : undefined;
        const note = determineNoteStyle({ note: el, pointing: _pointing });
        styles.push({ caretOption: { index }, index, ...note });
        left += note.width;
        styles.push({ ...gapEl, caretOption: { index, defaultWidth: true } });
        left += gapWidth;
        index++;
      }
    } else if (el.type === "rest") {
      const _pointing = pointing?.index === index ? pointing : undefined;
      const rest = determineRestStyle(el, _pointing);
      styles.push({ caretOption: { index }, index, ...rest });
      left += rest.width;
      styles.push({ ...gapEl, caretOption: { index, defaultWidth: true } });
      left += gapWidth;
      index++;
    } else if (el.type === "bar") {
      const _pointing = pointing?.index === index ? pointing : undefined;
      const bar = determineBarStyle(el, _pointing);
      styles.push({ caretOption: { index }, index, ...bar });
      left += bar.width;
      styles.push({ ...gapEl, caretOption: { index, defaultWidth: true } });
      left += gapWidth;
      index++;
    }
  }
  // elementにまたがるstyleを決定する
  const ties: { index: number; style: PaintElementStyle<TieStyle> }[] = [];
  for (let _i in styles) {
    const i = Number(_i);
    const style = styles[i];
    if (style.element.type === "note" && style.element.note.tie === "start") {
      let distance = style.width;
      for (let j = i + 1; j < styles.length; j++) {
        const _style = styles[j];
        if (
          _style.element.type === "note" &&
          _style.element.note.tie === "stop"
        ) {
          ties.push({
            index: i,
            style: determineTieStyle(
              style as PaintElementStyle<NoteStyle>,
              distance
            ),
          });
          distance = 0;
        } else {
          distance += _style.width;
        }
      }
    }
  }
  for (let { index, style } of ties) {
    styles.splice(index, 0, style);
  }
  if (staffStyle) {
    const width = Math.max(staffStyle.width, left);
    styles.unshift({
      element: staffStyle,
      width,
      bbox: {
        left: 0,
        top: 0,
        right: width,
        bottom: UNIT * (staffStyle.staff.lineCount - 1),
      },
    });
  }
  return styles;
};

export const determineCaretStyle = (
  option: CaretOption,
  elWidth: number,
  leftOfCaret: number
): CaretStyle => {
  const { index: elIdx, defaultWidth } = option;
  const caretWidth = defaultWidth ? kDefaultCaretWidth : elWidth;
  return {
    x: leftOfCaret + (defaultWidth ? elWidth / 2 - caretWidth / 2 : 0),
    y: 0,
    width: caretWidth,
    elIdx,
  };
};

export const genStaffStyle = (staff: Staff, position: Point): StaffStyle => {
  return {
    type: "staff",
    staff,
    position,
    width: kDefaultStaffWidth,
    lines: Array.from({ length: staff.lineCount }).map((_, i) => ({
      y: UNIT * i,
      width: bStaffLineWidth,
    })),
  };
};

// export type StaffPaintStyle = {
//   staff: StaffStyle;
//   elements: PaintElementStyle<PaintElement>[];
//   caret: CaretStyle;
// };

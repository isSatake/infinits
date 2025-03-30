import { StaffObject } from "@/object";
import {
  accidentalPathMap,
  downFlagMap,
  noteHeadByDuration,
  noteHeadWidth,
  numOfBeamsMap,
  restPathMap,
  upFlagMap,
} from "../core/constants";
import {
  Bar,
  Duration,
  MusicalElement,
  Note,
  Pitch,
  PitchAcc,
  Rest,
} from "../core/types";
import {
  bBarlineSeparation,
  bBeamSpacing,
  bBeamThickness,
  bClefG,
  bLedgerLineThickness,
  bRepeatBarlineDotSeparation,
  bStaffHeight,
  bStemWidth,
  bThickBarlineThickness,
  bThinBarlineThickness,
  EXTENSION_LEDGER_LINE,
  repeatDotRadius,
  UNIT,
} from "../font/bravura";
import {
  BBox,
  expandBBoxes,
  getPathBBox,
  offsetBBox,
  Point,
  Size,
  transformBBox,
} from "../lib/geometry";
import { kDefaultCaretWidth } from "./score-preferences";
import { insertTieStyles } from "./tie";
import {
  BeamStyle,
  CaretOption,
  CaretStyle,
  PaintNodeMap,
  Pointing,
  RestStyle,
} from "./types";

const kPointingColor = "#FF0000";

const tiePosition = (noteHeadPos: Point, noteHeadBBox: BBox): Point => {
  // TODO pos.yはnote headの中心なのでそれを考慮したい
  return {
    x: noteHeadPos.x + (noteHeadBBox.right - noteHeadBBox.left) / 2,
    y: noteHeadPos.y + (noteHeadBBox.bottom - noteHeadBBox.top),
  };
};

export const createNoteNode = ({
  note,
  stemDirection,
  beamed = false,
}: {
  note: Note;
  stemDirection?: "up" | "down";
  beamed?: boolean;
}): PaintNodeMap["note"] => {
  const elements: PaintNodeMap["note"]["children"] = [];
  const bboxes: BBox[] = [];
  const localMtx = new DOMMatrix();

  // accidentals
  const accBBoxes: BBox[] = [];
  for (const p of note.pitches) {
    if (!p.accidental) {
      continue;
    }
    const { pitch, accidental } = p;
    const y = pitchToY(0, pitch, 1);
    const bbox = getPathBBox(accidentalPathMap().get(accidental)!, UNIT);
    accBBoxes.push(bbox);
    elements.push({
      type: "accidental",
      style: { accidental },
      width: bbox.right - bbox.left,
      height: bbox.bottom - bbox.top,
      bbox,
      mtx: new DOMMatrix().translate(0, y),
      children: [],
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
      const bbox = {
        left: leftOfLedgerLine,
        right: leftOfLedgerLine + ledgerWidth,
        top: y - bLedgerLineThickness,
        bottom: y + bLedgerLineThickness,
      };
      elements.push({
        type: "ledger",
        style: { ledgerWidth },
        width: bbox.right - bbox.left,
        height: bbox.bottom - bbox.top,
        bbox,
        mtx: new DOMMatrix().translate(leftOfLedgerLine, y),
        children: [],
      });
      ledgerBBoxes.push(bbox);
    }
  }
  if (maxPitch >= 12) {
    // A5
    for (let p = 12; p < maxPitch + 1; p += 2) {
      const y = pitchToY(0, p, 1);
      const bbox = {
        left: leftOfLedgerLine,
        right: leftOfLedgerLine + ledgerWidth,
        top: y - bLedgerLineThickness,
        bottom: y + bLedgerLineThickness,
      };
      elements.push({
        type: "ledger",
        style: { ledgerWidth },
        width: bbox.right - bbox.left,
        height: bbox.bottom - bbox.top,
        bbox,
        mtx: new DOMMatrix().translate(leftOfLedgerLine, y),
        children: [],
      });
      ledgerBBoxes.push(bbox);
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
      type: "noteHead",
      style: { duration: note.duration, tie: tiePosition(position, bbox) },
      width: bbox.right - bbox.left,
      height: bbox.bottom - bbox.top,
      bbox,
      mtx: new DOMMatrix().translate(position.x, position.y),
      children: [],
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
    const { nodes: el, bboxes: stemFlagBB } = createStemFlagNodes({
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
      type: "noteHead",
      style: { duration: note.duration, tie: tiePosition(position, bbox) },
      width: bbox.right - bbox.left,
      height: bbox.bottom - bbox.top,
      bbox,
      mtx: new DOMMatrix().translate(position.x, position.y),
      children: [],
    });
    bboxes.push(bbox);
  }
  const bbox = expandBBoxes(bboxes);
  const ret: PaintNodeMap["note"] = {
    type: "note",
    style: { stemOffsetLeft: leftOfStemOrNotehead, tie: note.tie },
    width: bbox.right - bbox.left,
    height: bbox.bottom - bbox.top,
    bbox,
    mtx: new DOMMatrix(),
    children: elements,
  };
  return ret;
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

const createStemFlagNodes = ({
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
  beamed?: { top?: number; bottom?: number };
}): {
  nodes: (PaintNodeMap["stem"] | PaintNodeMap["flag"])[];
  bboxes: BBox[];
} => {
  if (duration === 1) {
    return { nodes: [], bboxes: [] };
  }
  const elements: (PaintNodeMap["stem"] | PaintNodeMap["flag"])[] = [];
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
        const bbox = getPathBBox(path, UNIT);
        elements.push({
          type: "flag",
          style: { duration, direction },
          width: bbox.right - bbox.left,
          height: bbox.bottom - bbox.top,
          bbox,
          mtx: new DOMMatrix().translate(position.x, position.y),
          children: [],
        });
        bboxes.push(offsetBBox(bbox, position));
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
        const bbox = getPathBBox(path, UNIT);
        elements.push({
          type: "flag",
          style: { duration, direction },
          width: bbox.right - bbox.left,
          height: bbox.bottom - bbox.top,
          bbox,
          mtx: new DOMMatrix().translate(position.x, position.y),
          children: [],
        });
        bboxes.push(offsetBBox(bbox, position));
      }
    }
  }
  const stemElPos = { x: stemCenter - bStemWidth / 2, y: top };
  const bbox = { left: 0, top: 0, right: bStemWidth, bottom: bottom };
  elements.push({
    type: "stem",
    style: {},
    width: bbox.right - bbox.left,
    height: bbox.bottom - bbox.top,
    bbox,
    mtx: new DOMMatrix().translate(left + stemElPos.x, stemElPos.y),
    children: [],
  });
  bboxes.push(offsetBBox(bbox, stemElPos));
  return { nodes: elements, bboxes };
};

const createRestNode = (rest: Rest): PaintNodeMap["rest"] => {
  const path = restPathMap().get(rest.duration)!;
  const y = UNIT * path.originUnits;
  const bbox = getPathBBox(path, UNIT);
  return {
    type: "rest",
    style: { rest },
    bbox,
    width: bbox.right - bbox.left,
    height: bbox.bottom - bbox.top,
    mtx: new DOMMatrix().translate(0, y),
    children: [],
  };
};

const createBarNode = (bar: Bar, position: Point): PaintNodeMap["bar"] => {
  const thinWidth = bThinBarlineThickness * UNIT;
  const barlineSeparation = bBarlineSeparation * UNIT;
  if (bar.subtype === "single") {
    const bbox = { left: 0, top: 0, right: thinWidth, bottom: bStaffHeight };
    const width = bbox.right - bbox.left;
    const height = bbox.bottom - bbox.top;
    return {
      type: "bar",
      style: { bar },
      width,
      height,
      bbox,
      mtx: new DOMMatrix().translate(position.x, position.y),
      children: [
        {
          type: "barLine",
          style: { lineWidth: thinWidth },
          width,
          height,
          bbox,
          mtx: new DOMMatrix(),
          children: [],
        },
      ],
    };
  } else if (bar.subtype === "double") {
    const bbox = {
      left: 0,
      top: 0,
      right: thinWidth * 2 + barlineSeparation,
      bottom: bStaffHeight,
    };
    return {
      type: "bar",
      style: { bar },
      width: bbox.right - bbox.left,
      height: bbox.bottom - bbox.top,
      bbox,
      mtx: new DOMMatrix().translate(position.x, position.y),
      children: [
        {
          type: "barLine",
          style: { lineWidth: thinWidth },
          width: thinWidth,
          height: bStaffHeight,
          bbox: { left: 0, top: 0, right: thinWidth, bottom: bStaffHeight },
          mtx: new DOMMatrix(),
          children: [],
        },
        {
          type: "barLine",
          style: { lineWidth: thinWidth },
          width: thinWidth,
          height: bStaffHeight,
          bbox: { left: 0, top: 0, right: thinWidth, bottom: bStaffHeight },
          mtx: new DOMMatrix().translate(thinWidth + barlineSeparation, 0),
          children: [],
        },
      ],
    };
  } else if (bar.subtype === "final") {
    const boldWidth = bThickBarlineThickness * UNIT;
    const bbox = {
      left: 0,
      top: 0,
      right: thinWidth + barlineSeparation + boldWidth,
      bottom: bStaffHeight,
    };
    return {
      type: "bar",
      style: { bar },
      width: bbox.right - bbox.left,
      height: bbox.bottom - bbox.top,
      bbox,
      mtx: new DOMMatrix(),
      children: [
        {
          type: "barLine",
          style: { lineWidth: thinWidth },
          width: thinWidth,
          height: bStaffHeight,
          bbox: { left: 0, top: 0, right: thinWidth, bottom: bStaffHeight },
          mtx: new DOMMatrix(),
          children: [],
        },
        {
          type: "barLine",
          style: { lineWidth: boldWidth },
          width: boldWidth,
          height: bStaffHeight,
          bbox: { left: 0, top: 0, right: boldWidth, bottom: bStaffHeight },
          mtx: new DOMMatrix().translate(thinWidth + barlineSeparation, 0),
          children: [],
        },
      ],
    };
  } else {
    // repeat
    const boldWidth = bThickBarlineThickness * UNIT;
    const dotToLineSeparation = bRepeatBarlineDotSeparation * UNIT;
    const bbox = {
      left: 0,
      top: 0,
      right:
        repeatDotRadius * 2 +
        dotToLineSeparation +
        thinWidth +
        barlineSeparation +
        boldWidth,
      bottom: bStaffHeight,
    };
    return {
      type: "bar",
      style: { bar },
      width: bbox.right - bbox.left,
      height: bbox.bottom - bbox.top,
      bbox,
      mtx: new DOMMatrix(),
      children: [
        {
          type: "barDot",
          style: {},
          width: repeatDotRadius * 2,
          height: repeatDotRadius * 2,
          bbox: {
            left: 0,
            top: 0,
            right: repeatDotRadius * 2,
            bottom: repeatDotRadius * 2,
          },
          mtx: new DOMMatrix().translate(0, UNIT + UNIT / 2), // 第2間
          children: [],
        },
        {
          type: "barLine",
          style: { lineWidth: thinWidth },
          width: thinWidth,
          height: bStaffHeight,
          bbox: { left: 0, top: 0, right: thinWidth, bottom: bStaffHeight },
          mtx: new DOMMatrix().translate(
            repeatDotRadius * 2 + dotToLineSeparation,
            0
          ),
          children: [],
        },
        {
          type: "barLine",
          style: { lineWidth: boldWidth },
          width: boldWidth,
          height: bStaffHeight,
          bbox: { left: 0, top: 0, right: boldWidth, bottom: bStaffHeight },
          mtx: new DOMMatrix().translate(
            repeatDotRadius * 2 +
              dotToLineSeparation +
              thinWidth +
              barlineSeparation,
            0
          ),
          children: [],
        },
      ],
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

const createBeamNode = (p: {
  beamedNotes: Note[];
  notePositions: { left: number; stemOffsetLeft: number }[];
  linearFunc: (x: number) => number;
  stemDirection: "up" | "down";
  duration?: Duration;
  headOrTail?: "head" | "tail";
}): PaintNodeMap["beam"][] => {
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
  const beams: PaintNodeMap["beam"][] = [];
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
    type: "beam",
    style: { ...shape },
    width: shape.se.x - shape.nw.x,
    height: shape.se.y - shape.nw.y,
    bbox: {
      left: shape.sw.x,
      top: shape.ne.y,
      right: shape.ne.x,
      bottom: shape.sw.y,
    },
    mtx: new DOMMatrix().translate(beamLeft),
    children: [],
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
      ...createBeamNode({
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

const createBeamedNoteNodes = (
  beamedNotes: Note[],
  duration: Duration,
  elementGap: number,
  startIdx: number,
  _pointing?: Pointing
): PaintNodeMap["note" | "beam" | "gap"][] => {
  const allBeamedPitches = beamedNotes
    .flatMap((n) => n.pitches)
    .map((p) => p.pitch);
  const stemDirection = getStemDirection(allBeamedPitches);
  const notePositions: { left: number; stemOffsetLeft: number }[] = [];
  const ret: PaintNodeMap["note" | "beam" | "gap"][] = [];
  let left = 0;
  for (const _i in beamedNotes) {
    const i = Number(_i);
    const note = createNoteNode({
      note: beamedNotes[i],
      stemDirection,
      beamed: true,
    });
    notePositions.push({ left, stemOffsetLeft: note.style.stemOffsetLeft });
    const caretOption = { index: i + startIdx };
    ret.push({ caretOption, index: i + startIdx, ...note });
    left += note.width;
    ret.push(
      createGapNode({
        size: { width: elementGap, height: bStaffHeight },
        position: { x: left, y: 0 },
        caretOption: { ...caretOption, index: i + startIdx },
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
  const beams = createBeamNode({
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
    const stemFlag = createStemFlagNodes({
      left: notePositions[i].stemOffsetLeft,
      duration,
      direction: stemDirection,
      lowest: pitchAsc[0],
      highest: pitchAsc[pitchAsc.length - 1],
      beamed,
    });
    // gapを考慮したindex
    const parent = ret[Number(i) * 2] as PaintNodeMap["note"];
    parent.bbox = expandBBoxes([parent.bbox, ...stemFlag.bboxes]);
    parent.children.push(...stemFlag.nodes);
  }
  return [...beams, ...ret];
};

export const createGapNode = ({
  size,
  position,
  caretOption,
}: {
  size: Size;
  position: Point;
  caretOption?: CaretOption;
}): PaintNodeMap["gap"] => {
  return {
    type: "gap",
    style: {},
    ...size,
    bbox: { left: 0, top: 0, right: size.width, bottom: size.height },
    mtx: new DOMMatrix().translate(position.x, position.y),
    caretOption,
    children: [],
  };
};

const createClefNode = (x: number): PaintNodeMap["clef"] => {
  const path = getPathBBox(bClefG(), UNIT);
  const g = pitchToY(0, 4, 1);
  return {
    type: "clef",
    style: {},
    width: path.right - path.left,
    height: path.bottom - path.top,
    bbox: path,
    mtx: new DOMMatrix().translate(x, g),
    index: -1,
    children: [],
  };
};

export const createStaffNode = (p: {
  elements: MusicalElement[];
  staffObj: StaffObject;
  pointing?: Pointing;
  gap?: { idx: number; width: number };
}): PaintNodeMap["staff"] => {
  const { elements, staffObj, pointing, gap } = p;
  let children: PaintNodeMap["staff"]["children"] = [];
  let staffMtx = new DOMMatrix();
  const gapSize = { width: UNIT, height: bStaffHeight };
  let cursor = 0;
  {
    const gapEl = createGapNode({ size: gapSize, position: { x: 0, y: 0 } });
    children.push(gapEl);
    cursor += gapEl.width;
  }
  // staffMtx = staffMtx.translate(gapWidth, 0);
  const clef = createClefNode(cursor);
  children.push(clef);
  cursor += clef.width;
  // staffMtx = staffMtx.translate(clef.width, 0);
  {
    const gapEl = createGapNode({
      size: gapSize,
      position: { x: cursor, y: 0 },
      caretOption: { index: -1 },
    });
    children.push(gapEl);
    cursor += gapEl.width;
  }
  // staffMtx = staffMtx.translate(gapWidth, 0);
  let index = 0;
  while (index < elements.length) {
    {
      const gapEl = createGapNode({
        size: gapSize,
        position: { x: cursor, y: 0 },
        ...(gap?.idx === index ? {} : { caretOption: { index } }),
      });
      children.push(gapEl);
      cursor += gapEl.width;
    }
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
        const beamedNodes = createBeamedNoteNodes(
          beamedNotes,
          el.duration,
          gapSize.width,
          index
        );
        children.push(...beamedNodes);
        index += beamedNotes.length;
      } else {
        const note = createNoteNode({ note: el });
        children.push({ caretOption: { index }, index, ...note });
        cursor += note.width;
        staffMtx = staffMtx.translate(note.width, 0);
        {
          const gapEl = createGapNode({
            size: gapSize,
            position: { x: cursor, y: 0 },
            caretOption: { index },
          });
          children.push(gapEl);
          cursor += gapEl.width;
        }
        index++;
      }
    } else if (el.type === "rest") {
      const rest = createRestNode(el);
      children.push({ caretOption: { index }, index, ...rest });
      cursor += rest.width;
      {
        const gapEl = createGapNode({
          size: gapSize,
          position: { x: cursor, y: 0 },
          caretOption: { index },
        });
        children.push(gapEl);
        cursor += gapEl.width;
      }
      index++;
    } else if (el.type === "bar") {
      const bar = createBarNode(el, { x: cursor, y: 0 });
      children.push({ caretOption: { index }, index, ...bar });
      cursor += bar.width;
      {
        const gapEl = createGapNode({
          size: gapSize,
          position: { x: cursor, y: 0 },
          caretOption: { index },
        });
        children.push(gapEl);
        cursor += gapEl.width;
      }
      index++;
    }
  }
  children = insertTieStyles(children) as PaintNodeMap["staff"]["children"];
  const bbox = expandBBoxes(children.map(({ bbox, mtx }) => transformBBox(bbox, mtx)));
  const ret: PaintNodeMap["staff"] = {
    type: "staff",
    style: {},
    width: bbox.right - bbox.left,
    height: bbox.bottom - bbox.top,
    bbox,
    mtx: new DOMMatrix().translate(staffObj.position.x, staffObj.position.y),
    children,
  };
  return ret;
};

export const determineCaretStyle = ({
  option,
  elWidth,
  leftOfCaret,
  height,
}: {
  option: CaretOption;
  elWidth?: number;
  height: number;
  leftOfCaret: number;
}): CaretStyle => {
  const { index: elIdx } = option;
  const caretWidth = elWidth ?? kDefaultCaretWidth;
  return {
    x: leftOfCaret + caretWidth / 2,
    y: 0,
    width: caretWidth,
    height,
    elIdx,
  };
};

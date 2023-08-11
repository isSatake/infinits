import { BBox, Point } from "./geometry";
import { Clef, MusicalElement } from "./notation/types";
import {
  CaretStyle,
  PaintElement,
  PaintElementStyle,
  Pointing,
} from "./style/types";
import { BeamModes, kAccidentalModes, TieModes } from "./input-modes";
import { DefaultMap } from "./lib/default-map";
import { getInitScale } from "./score-preferences";

const elements = new DefaultMap<number, MusicalElement[]>(() => [
  { type: "note", duration: 4, pitches: [{ pitch: 1 }], tie: "start" },
  { type: "note", duration: 4, pitches: [{ pitch: 1 }], tie: "stop" },
]);
export function getElements(id: number) {
  return elements.get(id);
}
export function setElements(id: number, v: MusicalElement[]) {
  elements.set(id, v);
}

let isNoteInputMode = true;
export function getIsNoteInputMode() {
  return isNoteInputMode;
}
export function flipIsNoteInputMode() {
  isNoteInputMode = !isNoteInputMode;
}

let beamMode: BeamModes = "nobeam";
export const getBeamMode = () => beamMode;
export const setBeamMode = (v: BeamModes) => {
  beamMode = v;
};

let tieMode: TieModes;
export const getTieMode = () => tieMode;
export const setTieMode = (v: TieModes) => {
  tieMode = v;
};

let accidentalModeIdx = 0;
export const getAccidentalMode = () => kAccidentalModes[accidentalModeIdx];
export const changeAccidentalMode = () => {
  accidentalModeIdx =
    accidentalModeIdx === kAccidentalModes.length - 1
      ? 0
      : accidentalModeIdx + 1;
};

const lastEditedIdxMap = new DefaultMap<number, number>(() => 0);
export const getLastEditedIndex = (id: number) => lastEditedIdxMap.get(id);
export const setLastEditedIndex = (id: number, idx: number) => {
  lastEditedIdxMap.set(id, idx);
};

type StaffStyle = {
  clef: Clef;
  position: Point;
};
const staffMap = new DefaultMap<number, StaffStyle>(() => ({
  clef: { type: "g" },
  position: { x: 0, y: 0 },
}));
export const getStaff = (id: number) => staffMap.get(id);
export const setStaff = (id: number, v: StaffStyle) => {
  staffMap.set(id, v);
};
export const addStaff = (v: StaffStyle): number => {
  const id = staffMap.size;
  staffMap.set(id, v);
  return id;
};
export const getAllStaffs = () => {
  return staffMap.entries();
};
export const getLastStaffId = () => {
  return staffMap.size - 1;
};

const stylesMap = new DefaultMap<number, PaintElementStyle<PaintElement>[]>(
  () => []
);
export const getStyles = (id: number) => stylesMap.get(id);
export const setStyles = (
  id: number,
  styles: PaintElementStyle<PaintElement>[]
) => {
  stylesMap.set(id, styles);
};

let elementBBoxes: { bbox: BBox; elIdx?: number }[] = [];
export const getElementBBoxes = () => elementBBoxes;
export const addElementBBoxes = (v: { bbox: BBox; elIdx?: number }) => {
  elementBBoxes.push(v);
};
export const initElementBBoxes = () => {
  elementBBoxes = [];
};

let pointing: Pointing | undefined;
export const getPointing = () => pointing;
export const setPointing = (v?: Pointing) => {
  pointing = v;
};

const caretsMap = new DefaultMap<number, CaretStyle[]>(() => []);
export const clearCaretsMap = () => {
  caretsMap.clear();
};
export const getCarets = (id: number) => caretsMap.get(id);
export const setCarets = (id: number, v: CaretStyle[]) => {
  caretsMap.set(id, v);
};
export function addCaret(id: number, v: CaretStyle) {
  getCarets(id).push(v);
}
const currentCaretIdxMap = new DefaultMap<number, number>(() => 0);
export const getCurrentCaretIdx = (id: number) => currentCaretIdxMap.get(id);
export const setCurrentCaretIdx = (id: number, idx: number) => {
  currentCaretIdxMap.set(id, idx);
};
export const getCaretByIndex = (id: number, idx: number) => getCarets(id)[idx];
export function getCurrentCaret(id: number) {
  return getCarets(id)[getCurrentCaretIdx(id)];
}

let editingStaffId: number | undefined;
export const getEditingStaffId = () => editingStaffId;
export const setEditingStaffId = (v: number | undefined) => {
  editingStaffId = v;
};

let mtx: DOMMatrixReadOnly = new DOMMatrix([
  getInitScale(),
  0,
  0,
  getInitScale(),
  0,
  0,
]);
export const getMatrix = () => mtx;
export const setMatrix = (v: DOMMatrix) => {
  mtx = v;
};

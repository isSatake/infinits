import { Staff } from "./core/types";
import { Point } from "./lib/geometry";

export type RootObj = ScoreObject | TextObject | FileObject;
export type TextObject = {
  type: "text";
  position: Point;
  text: string;
};
export type ScoreObject = {
  type: "score";
  position: Point;
  staffs: StaffObject[];
};
export type FileObject = {
  type: "file";
  position: Point;
  file: File;
  duration: number;
};

export type StaffObject = {
  type: "staff";
  position: Point; // score内の相対座標
  staff: Staff;
};
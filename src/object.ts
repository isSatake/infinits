import { Staff } from "./core/types";
import { Point } from "./lib/geometry";

export type TextObject = {
  type: "text";
  position: Point;
  text: string;
};
export type StaffObject = {
  type: "staff";
  position: Point;
  staff: Staff;
};
export type FileObject = {
  type: "file";
  position: Point;
  file: File;
  duration: number;
  fileName: string;
};

export type RootObj = StaffObject | TextObject | FileObject;

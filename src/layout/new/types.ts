import { Clef } from "@/core/types";

export type StaffLayout = {
  type: "staff";
  width: number;
  children: ClefLayout[];
};

export type ClefLayout = {
  type: "clef";
  clef: Clef;
  mtx: DOMMatrix;
} & OptionalColor;

type OptionalColor = { color?: string };

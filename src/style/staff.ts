import { UNIT } from "@/font/bravura";
import { PaintElementStyle, StaffConnectionStyle, StaffStyle } from "./types";
import { Point } from "@/lib/geometry";

export const buildConnectionStyle: (
  from: StaffStyle,
  fromPos: Point,
  fromStyle: PaintElementStyle<StaffStyle>,
  to: StaffStyle
) => PaintElementStyle<StaffConnectionStyle> = (
  from,
  fromPos,
  fromStyle,
  to
) => {
  const toPos = to.position;
  const connectionStyle: PaintElementStyle<StaffConnectionStyle> = {
    element: { type: "staffConnection", to: toPos, lines: from.lines },
    width: 0, // 現状connectionの右に何か描画することはないので0にしておく
    bbox: {
      left: 0,
      top: Math.min(0, toPos.y - fromPos.y),
      right: toPos.x - fromPos.x - fromStyle.width,
      bottom: Math.max(
        (from.lines.length - 1) * UNIT,
        toPos.y - fromPos.y + (to.lines.length - 1) * UNIT
      ),
    },
  };
  return connectionStyle;
};

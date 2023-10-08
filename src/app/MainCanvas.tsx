// import { UNIT } from "@/org/font/bravura";
import { MusicalElement } from "@/org/notation/types";
import { paintStaff, paintStyle, resetCanvas2 } from "@/org/paint";
import { StaffStyle } from "@/org/score-states";
import { determinePaintElementStyle } from "@/org/style/style";
import { PaintElement, PaintElementStyle, Pointing } from "@/org/style/types";
import { atom, useAtom, useAtomValue } from "jotai";
import { RefObject, useEffect, useRef, useState } from "react";
import { kSampleElements } from "./constants";
import { resizeCanvas } from "./util";
import { getInitScale } from "@/org/score-preferences";
import { magnitude } from "@/org/geometry";

// bravuraをimportするとサーバー上でPath2Dを使うことになりエラーになる
// とりあえずこちらに定義しておく
const UNIT = 250;

const staffMapAtom = atom<Map<number, StaffStyle>>(
  new Map([
    [0, { clef: { type: "g" as const }, position: { x: 0, y: 0 } }],
    // [0, { clef: { type: "g" as const }, position: { x: 50, y: 50 } }],
  ])
);
const elementsAtom = atom<Map<number, MusicalElement[]>>(
  new Map([
    [0, kSampleElements],
    [1, kSampleElements],
  ])
);
const pointingAtom = atom<Pointing | undefined>(undefined);
const mtxAtom = atom<DOMMatrix>(
  new DOMMatrix([getInitScale(), 0, 0, getInitScale(), 0, 0])
);
export const MainCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useResizeHandler(ref);
  const [staffMap, setStaffMap] = useAtom(staffMapAtom);
  const elements = useAtomValue(elementsAtom);
  const pointing = useAtomValue(pointingAtom);
  const [mtx, setMtx] = useAtom(mtxAtom);
  useEffect(() => {
    console.log("render", "start");
    const map = new Map<number, PaintElementStyle<PaintElement>[]>();
    for (const [id, staff] of staffMap.entries()) {
      const style = determinePaintElementStyle(
        elements.get(id) ?? [],
        UNIT,
        staff,
        pointing
      );
      map.set(id, style);
    }
    // renderStaff
    const ctx = ref.current?.getContext("2d")!;
    ctx.save();
    resetCanvas2({ ctx, fillStyle: "white" });
    const { a, b, c, d, e, f } = mtx;
    console.log("mtx", `(${e}, ${f})`);
    // pointer handlerでdpr考慮しなくて済むように
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.transform(a, b, c, d, e, f);
    for (const [id, staff] of staffMap.entries()) {
      ctx.save();
      ctx.translate(staff.position.x, staff.position.y);
      paintStaff(ctx, 0, 0, UNIT * 100, 1);
      // paintStyle
      for (const style of map.get(id) ?? []) {
        paintStyle(ctx, style);
        // paintBBox(ctx, style.bbox); // debug
        if (style.element.type !== "beam" && style.element.type !== "tie") {
          ctx.translate(style.width, 0);
        }
      }
      ctx.restore();
    }
    ctx.restore();
    console.log("render", "end");
    // renderCaret
  }, [staffMap, elements, pointing, mtx]);

  const [tmpMtx, setTmpMtx] = useState<DOMMatrix>();

  const pointerHandler = usePointerHandler({
    onDown: () => {
      setTmpMtx(mtx);
    },
    onDrag: (ev, down) => {
      if (!tmpMtx) {
        return;
      }
      const dx = (ev.clientX - down.clientX) / tmpMtx.a;
      const dy = (ev.clientY - down.clientY) / tmpMtx.a;
      setMtx(tmpMtx.translate(dx, dy));
    },
    onUp: () => {
      setTmpMtx(undefined);
    },
    onDoubleClick: (ev) => {
      console.log("double click", ev);
      setStaffMap(
        new Map([
          [
            0,
            {
              clef: { type: "g" as const },
              position: { x: 0, y: 0 },
            },
          ],
          [
            1,
            {
              clef: { type: "g" as const },
              position: mtx
                .inverse()
                .transformPoint({ x: ev.clientX, y: ev.clientY }),
            },
          ],
        ])
      );
    },
  });

  return (
    <canvas
      id="mainCanvas"
      className="absolute"
      ref={ref}
      {...pointerHandler}
    ></canvas>
  );
};

const kLongDownThresholdMs = 300;
const kDoubleClickThresholdMs = 300;
const kDragThresholdMagnitude = 10;
const usePointerHandler = ({
  onUp,
  onDown,
  onClick,
  onDoubleClick,
  onLongDown,
  onMove,
  onDrag,
}: {
  onUp?: (ev: React.PointerEvent, down: React.PointerEvent) => void;
  onDown?: (ev: React.PointerEvent) => void;
  onClick?: (ev: React.PointerEvent) => void;
  onDoubleClick?: (ev: React.PointerEvent) => void;
  onLongDown?: (ev: React.PointerEvent) => void;
  onMove?: (ev: React.PointerEvent) => void;
  onDrag?: (ev: React.PointerEvent, down: React.PointerEvent) => void;
}): {
  onPointerDown: React.PointerEventHandler;
  onPointerUp: React.PointerEventHandler;
  onPointerMove: React.PointerEventHandler;
} => {
  const [down, setDown] = useState<React.PointerEvent>();
  const [longDownTimer, setLongDownTimer] = useState<number>(-1);
  const [doubleClickTimer, setDoubleClickTimer] = useState<number>(-1);
  const [dragging, setDragging] = useState<boolean>(false);
  const onPointerDown = (ev: React.PointerEvent) => {
    setDown(ev);
    onDown?.(ev);
    setLongDownTimer(
      window.setTimeout(() => {
        onLongDown?.(ev);
        setLongDownTimer(-1);
      }, kLongDownThresholdMs)
    );
  };
  const onPointerUp = (ev: React.PointerEvent) => {
    if (!down) return;
    onUp?.(ev, down);
    if (longDownTimer !== -1) {
      window.clearTimeout(longDownTimer);
      setLongDownTimer(-1);
      onClick?.(ev);
      if (doubleClickTimer !== -1) {
        window.clearTimeout(doubleClickTimer);
        setDoubleClickTimer(-1);
        onDoubleClick?.(ev);
      }
      setDoubleClickTimer(
        window.setTimeout(() => {
          setDoubleClickTimer(-1);
        }, kDoubleClickThresholdMs)
      );
    }
    setDown(undefined);
    setDragging(false);
  };
  const onPointerMove = (ev: React.PointerEvent) => {
    onMove?.(ev);
    if (!down) return;
    if (dragging) {
      onDrag?.(ev, down);
    } else if (
      magnitude(
        {
          x: ev.clientX,
          y: ev.clientY,
        },
        {
          x: down.clientX,
          y: down.clientY,
        }
      ) > kDragThresholdMagnitude
    ) {
      setDragging(true);
    }
  };
  return { onPointerDown, onPointerUp, onPointerMove };
};

const useResizeHandler = (ref: RefObject<HTMLCanvasElement>) => {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const resize = () =>
      resizeCanvas(canvas, window.innerWidth, window.innerHeight);
    window.addEventListener("resize", resize);
    resize();
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);
};

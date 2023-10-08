import { magnitude } from "@/org/geometry";
import { RefObject, useEffect, useState } from "react";
import { resizeCanvas } from "./util";

const kLongDownThresholdMs = 300;
export const kDoubleClickThresholdMs = 300;
const kDragThresholdMagnitude = 10;

export const usePointerHandler = ({
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

export const useResizeHandler = (ref: RefObject<HTMLCanvasElement>) => {
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
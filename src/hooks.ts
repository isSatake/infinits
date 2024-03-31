import { Size, magnitude } from "@/org/geometry";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasState } from "./state-machine";

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

  const onLongDownRef = useRef(onLongDown);
  useEffect(() => {
    onLongDownRef.current = onLongDown;
  }, [onLongDown]);
  const sm = useMemo(
    () =>
      new CanvasState(
        (dx, dy) => {
          console.log("StateMachine", "pan", dx, dy);
        },
        (dz) => {
          console.log("StateMachine", "zoom", dz);
        },
        (x, y) => {
          console.log("StateMachine", "add staff", x, y);
        }
      ),
    []
  );

  const onPointerDown = (ev: React.PointerEvent) => {
    sm.onPointerDown(ev);
    setDown(ev);
    onDown?.(ev);
    setLongDownTimer(
      window.setTimeout(() => {
        onLongDownRef.current?.(ev);
        setLongDownTimer(-1);
      }, kLongDownThresholdMs)
    );
  };
  const onPointerUp = (ev: React.PointerEvent) => {
    sm.onPointerUp(ev);
    if (!down) return;
    onUp?.(ev, down);
    if (longDownTimer !== -1) {
      window.clearTimeout(longDownTimer);
      setLongDownTimer(-1);
      if (doubleClickTimer !== -1) {
        window.clearTimeout(doubleClickTimer);
        setDoubleClickTimer(-1);
        onDoubleClick?.(ev);
      } else {
        setDoubleClickTimer(
          window.setTimeout(() => {
            setDoubleClickTimer(-1);
            onClick?.(ev);
          }, kDoubleClickThresholdMs)
        );
      }
    }
    setDown(undefined);
    setDragging(false);
  };
  const onPointerMove = (ev: React.PointerEvent) => {
    sm.onPointerMove(ev);
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
      if (doubleClickTimer !== -1) {
        window.clearTimeout(doubleClickTimer);
        setDoubleClickTimer(-1);
      }
    }
  };
  return { onPointerDown, onPointerUp, onPointerMove };
};

export const useResizeHandler = (callback: (size: Size) => void) => {
  useEffect(() => {
    const fn = () =>
      callback({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    window.addEventListener("resize", fn);
    return () => {
      window.removeEventListener("resize", fn);
    };
  }, [callback]);
};

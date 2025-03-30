import {
  Point,
  isPointInBBox,
  transformBBox
} from "@/lib/geometry";
import {
  connectionAtom,
  contextMenuAtom,
  focusAtom,
  mtxAtom,
  rootObjMapAtom,
  rootPaintNodeMapAtom,
  scoreStaffMapAtom,
  staffObjMapAtom,
  uncommitedStaffConnectionAtom,
} from "@/state/atom";
import { DesktopStateMachine, DesktopStateProps } from "@/state/desktop-state";
import { PointerEventStateMachine } from "@/state/pointer-state";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { useMapAtom } from "./root-obj";

export const useMainPointerHandler = () => {
  const [mtx, setMtx] = useAtom(mtxAtom);
  const rootPaintNodeMap = useAtomValue(rootPaintNodeMapAtom);
  const setPopover = useSetAtom(contextMenuAtom);
  const setCarets = useSetAtom(focusAtom);
  const rootObjs = useMapAtom(rootObjMapAtom);
  const staffs = useMapAtom(staffObjMapAtom);
  const scoreStaffMap = useMapAtom(scoreStaffMapAtom).map;
  const [connections, setConnections] = useAtom(connectionAtom);
  const setUncommitedConnection = useSetAtom(uncommitedStaffConnectionAtom);
  const getRootObjIdOnPoint = usePointingRootObjId();
  const desktopState = useRef(new DesktopStateMachine());
  const canvasHandler = useRef(
    new PointerEventStateMachine(desktopState.current.on)
  );

  useEffect(() => {
    desktopState.current.mtx = mtx;
  }, [mtx]);

  const dndStaff = (desktopPoint: Point) => {
    const id = getRootObjIdOnPoint(desktopPoint);
    const obj = rootObjs.get(id);
    if (!obj) {
      return;
    }
    const offset = {
      x: desktopPoint.x - obj.position.x,
      y: desktopPoint.y - obj.position.y,
    };
    return { objType: obj.type, id, offset };
  };

  desktopState.current.getRootObjOnPoint = dndStaff;
  // desktopState.current.getConnectionOnPoint = (desktopPoint: Point) => {
  //   const nodeMap = new Map<number, PaintNodeMap["connection"][]>();
  //   for (const [id, nodes] of rootPaintNodeMap) {
  //     const connection = nodes.filter(
  //       (v: PaintStyle<PaintElement>): v is PaintStyle<ConnectionStyle> =>
  //         v.element.type === "connection"
  //     );
  //     if (connection.length > 0) {
  //       nodeMap.set(id, connection);
  //     }
  //   }
  //   for (const [id, v] of nodeMap) {
  //     for (const _v of v) {
  //       if (_v.element.toId === undefined) {
  //         continue;
  //       }
  //       const d = distanceToLineSegment({
  //         point: desktopPoint,
  //         start: addPoint(_v.element.position, { x: 0, y: bStaffHeight / 2 }),
  //         end: addPoint(
  //           _v.element.position,
  //           addPoint(_v.element.to, { x: 0, y: bStaffHeight / 2 })
  //         ),
  //       });
  //       if (!!d && d < bStaffHeight / 2) {
  //         return { from: id, to: _v.element.toId };
  //       }
  //     }
  //   }
  // };
  // desktopState.current.isPointingRootObjTail = (
  //   desktopPoint: Point,
  //   rootObjId: number
  // ) => {
  //   const obj = rootObjs.get(rootObjId);
  //   if (!obj) {
  //     return false;
  //   }
  //   const objWidth =
  //     rootPaintNodeMap.get(rootObjId)?.reduce((acc, style) => {
  //       return style.element.type !== "staff" &&
  //         style.element.type !== "beam" &&
  //         style.element.type !== "tie"
  //         ? (acc += style.width)
  //         : 0;
  //     }, 0) ?? 0;
  //   return desktopPoint.x > obj.position.x + objWidth * 0.7;
  // };

  const onIdle = useCallback(() => {
    setUncommitedConnection(undefined);
  }, []);

  const onMoveRootObj = useCallback(
    (args: DesktopStateProps["moveRootObj"]) => {
      const { id, point, offset } = args;
      const position = { x: point.x - offset.x, y: point.y - offset.y };
      rootObjs.update(id, (style) => ({ ...style, position }));
    },
    [rootObjs]
  );

  const onMoveConnection = (args: DesktopStateProps["moveConnection"]) => {
    const { isNew, rootObjId: from, point: position } = args;
    if (!isNew) {
      connections.delete(from);
      setConnections(connections);
    }
    setUncommitedConnection({ from, position });
  };

  const onConnectRootObj = (args: DesktopStateProps["connectRootObj"]) => {
    const { from, to } = args;
    const v: number[] = connections.get(from) ?? [];
    if (v.includes(to)) {
      return;
    }
    v.push(to);
    connections.set(from, v);
    setConnections(connections);
    setUncommitedConnection(undefined);
  };

  const onCtxMenuStaff = useCallback(
    ({ staffId, htmlPoint }: DesktopStateProps["ctxMenuStaff"]) => {
      setPopover({ type: "staff", htmlPoint, staffId });
    },
    []
  );

  const onFocusRootObj = useCallback(
    ({ rootObjId }: DesktopStateProps["focusRootObj"]) => {
      if (rootObjId > -1) {
        setCarets({ rootObjId, idx: 0 });
      }
    },
    []
  );

  const onCtxMenu = (props: DesktopStateProps["ctxMenu"]) => {
    setPopover({
      type: "canvas",
      htmlPoint: props.htmlPoint,
      desktopPoint: props.desktopPoint,
    });
  };

  const onPan = useCallback(({ translated }: DesktopStateProps["pan"]) => {
    console.log("CanvasState", "pan");
    setMtx(translated);
  }, []);

  const onZoom = useCallback(({ translated }: DesktopStateProps["zoom"]) => {
    console.log("CanvasState", "zoom");
    setMtx(translated);
  }, []);

  const onAddStaff = useCallback(
    ({ point: position }: DesktopStateProps["addStaff"]) => {
      const staffId = staffs.add({
        type: "staff",
        position: { x: 0, y: 0 },
        staff: { clef: { pitch: "g" } },
      });
      const scoreId = rootObjs.add({ type: "score", position });
      scoreStaffMap.set(scoreId, [staffId]);
    },
    [rootObjs]
  );

  desktopState.current.onState = (state) => {
    switch (state.type) {
      case "idle":
        onIdle();
        break;
      case "downCanvas":
        break;
      case "addStaff":
        onAddStaff(state);
        break;
      case "focusRootObj":
        onFocusRootObj(state);
        break;
      case "moveRootObj":
        onMoveRootObj(state);
        break;
      case "moveConnection":
        onMoveConnection(state);
        break;
      case "connectRootObj":
        onConnectRootObj(state);
        break;
      case "ctxMenu":
        onCtxMenu(state);
        break;
      case "ctxMenuStaff":
        onCtxMenuStaff(state);
        break;
      case "pan":
        onPan(state);
        break;
      case "zoom":
        onZoom(state);
        break;
    }
  };

  return {
    onTouchEnd: (ev: React.TouchEvent<HTMLCanvasElement>) => {
      // iOS Safariでダブルタップ長押し時に拡大鏡が出るのを防ぐ
      ev.preventDefault();
    },
    onPointerDown: (ev: React.PointerEvent) => {
      canvasHandler.current.on("down", ev);
    },
    onPointerMove: (ev: React.PointerEvent) => {
      canvasHandler.current.on("move", ev);
    },
    onPointerUp: (ev: React.PointerEvent) => {
      canvasHandler.current.on("up", ev);
    },
  };
};

const usePointingRootObjId = (): ((desktopPoint: Point) => number) => {
  const rootPaintNodeMap = useAtomValue(rootPaintNodeMapAtom);
  const objs = useMapAtom(rootObjMapAtom);
  return (desktopPoint: Point): number => {
    return (
      objs.map.keys().find((id) => {
        const node = rootPaintNodeMap.get(id);
        if (!node) {
          return false;
        }
        const bb = transformBBox(node.bbox, node.mtx);
        return isPointInBBox(desktopPoint, bb);
      }) ?? -1
    );
  };
};

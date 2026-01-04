import { clefPitches, clefs } from "@/core/types";
import { useChangeKeyPreviewHandlers } from "@/hooks/input";
import { useObjIdMapAtom } from "@/hooks/map-atom";
import { getAudioDurationSec } from "@/lib/file";
import { Point } from "@/lib/geometry";
import { objectAtom, uiAtom } from "@/state/atom";
import { useAtom, useSetAtom } from "jotai";
import { Input, BlobSource, ALL_FORMATS, AudioBufferSink } from "mediabunny";
import React, { FC, useCallback, useState } from "react";

export const ContextMenu = () => {
  const [popover, setPopover] = useAtom(uiAtom.contextMenu);
  const onClose = useCallback(() => setPopover(undefined), []);

  return (
    <div className={"contextMenu"}>
      {popover?.type === "staff" && (
        <StaffContextMenu staffId={popover.staffId} onClose={onClose} />
      )}
      {popover?.type === "canvas" && (
        <CanvasContextMenu
          desktopPoint={popover.desktopPoint}
          onClose={onClose}
        />
      )}
    </div>
  );
};

const CanvasContextMenu: FC<{ desktopPoint: Point; onClose: () => void }> = ({
  desktopPoint,
  onClose,
}) => {
  const rootObjs = useObjIdMapAtom(objectAtom.rootObjMap);
  const [mode, setMode] = useState<"default" | "text">("default");
  const [text, setText] = useState("");

  const onAddFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".mp3,.mp4";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      rootObjs.add({
        type: "file",
        file,
        position: desktopPoint,
        duration: await getAudioDurationSec(file),
      });
      onClose();
    };
    input.click();
  };

  const onSubmitText = (text: string) => {
    rootObjs.add({ type: "text", position: desktopPoint, text });
    setMode("default");
    onClose();
  };
  return (
    <>
      <div className="header">
        {mode === "default" && <button onClick={onClose}>Done</button>}
        {mode === "text" && (
          <>
            <button onClick={() => setMode("default")}>Cancel</button>
            <button onClick={() => onSubmitText(text)}>OK</button>
          </>
        )}
      </div>
      <div className="body">
        {mode === "default" && (
          <>
            <button onClick={() => setMode("text")}>Add Text</button>
            <button onClick={onAddFile}>Add File</button>
          </>
        )}
        {mode === "text" && (
          <TextInput
            placeholder="Add Text"
            value={text}
            onChange={setText}
            onEnter={onSubmitText}
          />
        )}
      </div>
    </>
  );
};

const TextInput: FC<{
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onEnter: (v: string) => void;
}> = ({ placeholder, value, onChange, onEnter }) => {
  return (
    <>
      <div className="inputContainer">
        <input
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (!e.nativeEvent.isComposing && e.key === "Enter") {
              onEnter(value);
            }
          }}
        />
      </div>
    </>
  );
};

const StaffContextMenu: FC<{ staffId: number; onClose: () => void }> = ({
  staffId,
  onClose,
}) => {
  const setLastClef = useSetAtom(uiAtom.lastClef);
  const rootObjs = useObjIdMapAtom(objectAtom.rootObjMap);
  const staff = rootObjs.get(staffId);
  const onClickDelete = () => {
    rootObjs.remove(staffId);
    onClose();
  };
  const onClickChangeClef = () => {
    if (staff?.type !== "staff") return;
    const { clef } = staff.staff;
    const nextClef =
      clefs[
        clefPitches[(clefPitches.indexOf(clef.pitch) + 1) % clefPitches.length]
      ];
    setLastClef(nextClef);
    rootObjs.update(staffId, (staff) => {
      if (staff.type !== "staff") return staff;
      return {
        ...staff,
        staff: { ...staff.staff, clef: nextClef },
      };
    });
  };
  const onClickExtractMelody = async () => {
    // フォーカス中fileの参照
    if (staff?.type !== "file") return;
    const { file } = staff;
    // mediabunnyでdemux
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS,
    });
    const track = await input.getPrimaryAudioTrack();
    if (!track) return;
    const chCount = track.numberOfChannels;
    const bufferSink = new AudioBufferSink(track);
    // monoralize
    const chunk: Float32Array[] = [];
    let total = 0;
    for await (const { buffer } of bufferSink.buffers()) {
      const ch0 = buffer.getChannelData(0);
      const mono: Float32Array = new Float32Array(ch0.length);
      if (chCount === 1) {
        mono.set(ch0);
      } else {
        const ch1 = buffer.getChannelData(1);
        for (let i = 0; i < ch0.length; i++) {
          mono[i] = (ch0[i] + ch1[i]) / 2;
        }
      }
      chunk.push(mono);
      total += mono.length;
    }
    const monoPCM = new Float32Array(total);
    let offset = 0;
    for (const c of chunk) {
      monoPCM.set(c, offset);
      offset += c.length;
    }
    // play for debug
    const audioCtx = new AudioContext();
    const audioBuffer = audioCtx.createBuffer(
      1,
      monoPCM.length,
      track.sampleRate
    );
    audioBuffer.getChannelData(0).set(monoPCM);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    // HPF
    const hpFilter = audioCtx.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.value = 300;
    hpFilter.Q.value = 0.707;
    source.connect(hpFilter).connect(audioCtx.destination);
    source.start();
    // BasicPitchでピッチ検出
  };
  return (
    <>
      <div className="header">
        <button onClick={onClose}>Done</button>
      </div>
      <div className="body">
        {staff?.type === "staff" && (
          <>
            <button {...useChangeKeyPreviewHandlers()}>Change Key</button>
            <button onClick={onClickChangeClef}>Change Clef</button>
          </>
        )}
        {staff?.type === "file" && (
          <button onClick={onClickExtractMelody}>Extract Melody</button>
        )}
        <button onClick={onClickDelete}>Delete</button>
      </div>
    </>
  );
};

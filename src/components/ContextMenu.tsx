import {
  clefPitches,
  clefs,
  Duration,
  keys,
  keySignatures,
  Note,
} from "@/core/types";
import { UNIT } from "@/font/bravura";
import { useChangeKeyPreviewHandlers } from "@/hooks/input";
import { useObjIdMapAtom } from "@/hooks/map-atom";
import { getAudioDurationSec } from "@/lib/file";
import { Point } from "@/lib/geometry";
import { objectAtom, uiAtom } from "@/state/atom";
import {
  addPitchBendsToNoteEvents,
  BasicPitch,
  noteFramesToTime,
  outputToNotesPoly,
} from "@spotify/basic-pitch";
import { NoteEvent, NoteEventTime } from "@spotify/basic-pitch/types/toMidi";
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
  const setElements = useSetAtom(objectAtom.elements);
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
    const audioBuffer = await to22050HzAudioBuffer(monoPCM, track.sampleRate);
    // audioBuffer.getChannelData(0).set(monoPCM);
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
    const bp = new BasicPitch("/model/model.json");
    const frames: number[][] = [];
    const onsets: number[][] = [];
    const contours: number[][] = [];
    await bp.evaluateModel(
      audioBuffer,
      (f: number[][], o: number[][], c: number[][]) => {
        frames.push(...f);
        onsets.push(...o);
        contours.push(...c);
      },
      (p: number) => console.log(`${Math.round(p * 100)}%`)
    );
    const notes = noteFramesToTime(
      addPitchBendsToNoteEvents(
        contours,
        outputToNotesPoly(frames, onsets, 0.25, 0.25, 5)
      )
    );
    console.log(notes);

    // staffオブジェクトの追加
    const staffId = rootObjs.add({
      type: "staff",
      position: { x: staff.position.x, y: staff.position.y + UNIT * 5 },
      staff: { type: "staff", clef: clefs.G, keySignature: keySignatures.C },
    });

    // staffにnote追加
    setElements((elementsMap) => {
      const elements = elementsMap.get(staffId) || [];
      for (const note of notes) {
        const noteEl = convertNoteEventToNoteEl(note);
        elements.push(noteEl);
      }
      elementsMap.set(staffId, elements);
      return elementsMap;
    });

    onClose();
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

async function to22050HzAudioBuffer(
  pcm: Float32Array<ArrayBuffer>,
  inputSampleRate: number
): Promise<AudioBuffer> {
  const duration = pcm.length / inputSampleRate;

  const offline = new OfflineAudioContext(
    1, // mono
    Math.ceil(duration * 22050),
    22050
  );

  const buffer = offline.createBuffer(1, pcm.length, inputSampleRate);
  buffer.copyToChannel(pcm, 0);

  const src = offline.createBufferSource();
  src.buffer = buffer;
  src.connect(offline.destination);
  src.start();

  const rendered = await offline.startRendering();
  return rendered; // ← sampleRate === 22050
}

const convertNoteEventToNoteEl = (ev: NoteEventTime): Note => {
  // Convert MIDI pitch to app pitch (C4 (middle C) = 0, MIDI 60 = C4)
  const pitch = ev.pitchMidi - 60;

  // Convert duration in seconds to note duration (1, 2, 4, 8, 16, 32)
  // Assuming 120 BPM (2 beats per second), where quarter note = 0.5 seconds
  // const beatDuration = 0.5; // quarter note at 120 BPM
  // 80BPMに変更
  const beatDuration = 0.75; // quarter note at 80 BPM
  const durationInBeats = ev.durationSeconds / beatDuration;

  // Find closest duration value
  // duration: 1=whole(4beats), 2=half(2beats), 4=quarter(1beat), 8=eighth(0.5beats), 16=sixteenth(0.25beats), 32=32nd(0.125beats)
  let duration: Duration;
  if (durationInBeats >= 3) {
    duration = 1; // whole note
  } else if (durationInBeats >= 1.5) {
    duration = 2; // half note
  } else if (durationInBeats >= 0.75) {
    duration = 4; // quarter note
  } else if (durationInBeats >= 0.375) {
    duration = 8; // eighth note
  } else if (durationInBeats >= 0.1875) {
    duration = 16; // sixteenth note
  } else {
    duration = 32; // 32nd note
  }

  return {
    type: "note",
    duration,
    pitches: [{ pitch }],
  };
};

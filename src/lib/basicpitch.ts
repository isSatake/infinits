import { Accidental, Note } from "@/core/types";
import * as bp from "@spotify/basic-pitch";
import { NoteEventTime } from "@spotify/basic-pitch";

export const extractNoteEvents = async (
  audioBuffer: AudioBuffer
): Promise<bp.NoteEventTime[]> => {
  const model = new bp.BasicPitch("./model/model.json");
  const frames: number[][] = [];
  const onsets: number[][] = [];
  const contours: number[][] = [];
  await model.evaluateModel(
    audioBuffer,
    (f: number[][], o: number[][], c: number[][]) => {
      frames.push(...f);
      onsets.push(...o);
      contours.push(...c);
    },
    (p: number) => console.log(`${Math.round(p * 100)}%`)
  );

  return bp
    .noteFramesToTime(
      bp.addPitchBendsToNoteEvents(
        contours,
        bp.outputToNotesPoly(frames, onsets, 0.5, 0.3, 11, true)
      )
    )
    .reverse();
};

/**
 * Convert MIDI pitch (semitones) to app pitch (whole tones) with accidental
 * MIDI: C4=60 (semitones), App: C4=0 (whole tones)
 */
const midiPitchToAppPitch = (
  midiPitch: number
): { pitch: number; accidental?: Accidental } => {
  // Relative to middle C (C4 = MIDI 60)
  const semitonesFromC4 = midiPitch - 60;

  // Calculate octave offset in semitones
  const octave = Math.floor(semitonesFromC4 / 12);

  // Semitone within the octave (0-11)
  const semitoneInOctave = ((semitonesFromC4 % 12) + 12) % 12;

  // Map semitone to whole tone pitch and accidental
  // semitone: [pitch in whole tones, accidental]
  const semitoneMap: Array<{ pitch: number; accidental?: Accidental }> = [
    { pitch: 0 }, // C
    { pitch: 0, accidental: "sharp" }, // C#
    { pitch: 1 }, // D
    { pitch: 1, accidental: "sharp" }, // D#
    { pitch: 2 }, // E
    { pitch: 3 }, // F
    { pitch: 3, accidental: "sharp" }, // F#
    { pitch: 4 }, // G
    { pitch: 4, accidental: "sharp" }, // G#
    { pitch: 5 }, // A
    { pitch: 5, accidental: "sharp" }, // A#
    { pitch: 6 }, // B
  ];

  const { pitch: pitchInOctave, accidental } = semitoneMap[semitoneInOctave];

  // Whole tones from C4 = (octave * 7) + pitch in octave
  const pitch = octave * 7 + pitchInOctave;

  return { pitch, accidental };
};
export const convertNoteEventToNoteEl = (evs: NoteEventTime[]): Note => {
  return {
    type: "note",
    duration: 8, // 仮で固定
    pitches: evs.map((ev) => midiPitchToAppPitch(ev.pitchMidi)),
  };
};

/**
 *  同じタイミングの音をグループ化 (0.05秒以内)
 */
export const groupNoteEvents = (notes: NoteEventTime[]): NoteEventTime[][] => {
  const groupedNotes: (typeof notes)[] = [];
  for (const note of notes) {
    const lastGroup = groupedNotes.at(-1);
    if (
      lastGroup &&
      Math.abs(note.startTimeSeconds - lastGroup[0].startTimeSeconds) < 0.1
    ) {
      lastGroup.push(note);
    } else {
      groupedNotes.push([note]);
    }
  }
  return groupedNotes;
};

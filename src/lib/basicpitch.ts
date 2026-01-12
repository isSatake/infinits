import { Accidental, Note, Duration } from "@/core/types";
import * as bp from "@spotify/basic-pitch";
import { NoteEventTime } from "@spotify/basic-pitch";

export const extractNoteEvents = async (
  audioBuffer: AudioBuffer
): Promise<bp.NoteEventTime[]> => {
  const model = new bp.BasicPitch("/model/model.json");
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
        bp.outputToNotesPoly(frames, onsets, 0.5, 0.3, 11, true, null, 440)
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
export const convertNoteEventToNoteEl = (ev: NoteEventTime): Note => {
  // Convert MIDI pitch to app pitch (C4 (middle C) = 0, MIDI 60 = C4)
  const { pitch, accidental } = midiPitchToAppPitch(ev.pitchMidi);

  // Convert duration in seconds to note duration (1, 2, 4, 8, 16, 32)
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
    pitches: [{ pitch, accidental }],
  };
};

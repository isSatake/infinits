/**
 * @spotify/basic-pitch
 */

declare module "@spotify/basic-pitch" {
  /**
   * ノートイベント（フレーム単位）
   */
  export type NoteEvent = {
    /** 開始フレーム */
    startFrame: number;
    /** 継続フレーム数 */
    durationFrames: number;
    /** MIDI音高（0-127） */
    pitchMidi: number;
    /** 音量（振幅） */
    amplitude: number;
    /** ピッチベンド情報の配列（オプション） */
    pitchBends?: number[];
  };

  /**
   * ノートイベント（時間単位）
   */
  export interface NoteEventTime {
    /** 開始時刻（秒） */
    startTimeSeconds: number;
    /** 継続時間（秒） */
    durationSeconds: number;
    /** MIDI音高（0-127） */
    pitchMidi: number;
    /** 音量（振幅） */
    amplitude: number;
    /** ピッチベンド情報の配列（オプション） */
    pitchBends?: number[];
  }

  /**
   * フレーム配列とオンセット配列からノートイベントを抽出する（ポリフォニック対応）
   *
   * この関数は、モデルの出力であるframes（各音高の確率）とonsets（立ち上がり）を解析し、
   * 実際の音符区間を推定してNoteEventの配列を返します。
   *
   * @param frames - 各フレームにおける音高ごとの確率を表す2次元配列 [フレーム数 × 音高数]
   * @param onsets - 各フレームにおける音の立ち上がりを表す2次元配列 [フレーム数 × 音高数]
   * @param onsetThresh - オンセット検出の閾値（デフォルト: 0.5）。この値以上でオンセットとして認識
   * @param frameThresh - フレーム確率の閾値（デフォルト: 0.3）。この値以上でノートが継続していると判定
   * @param minNoteLen - ノートとして認識する最小フレーム長（デフォルト: 11）。短すぎる音を除外
   * @param inferOnsets - オンセットを推論するかどうか（デフォルト: true）
   * @param maxFreq - 検出する最大周波数（Hz）（デフォルト: null = 制限なし）
   * @param minFreq - 検出する最小周波数（Hz）（デフォルト: null = 制限なし）
   * @param melodiaTrick - Melodiaアルゴリズムのトリックを使用するか（デフォルト: true）
   * @param energyTolerance - エネルギー許容範囲（デフォルト: 11）
   * @returns ノートイベントの配列（フレーム単位）
   *
   * @example
   * ```typescript
   * // 閾値を調整してノート検出の感度を変更
   * const notes = outputToNotesPoly(frames, onsets, 0.25, 0.25, 5);
   * ```
   */
  export function outputToNotesPoly(
    frames: number[][],
    onsets: number[][],
    onsetThresh?: number,
    frameThresh?: number,
    minNoteLen?: number,
    inferOnsets?: boolean,
    maxFreq?: number | null,
    minFreq?: number | null,
    melodiaTrick?: boolean,
    energyTolerance?: number
  ): NoteEvent[];

  /**
   * ノートイベントにピッチベンド情報を追加する
   *
   * contoursデータ（時間経過に伴う細かなピッチの揺れ）を解析し、
   * 各ノートにピッチベンド情報を付与します。これにより、ビブラートや
   * ポルタメントなどの表現を再現できます。
   *
   * @param contours - ピッチの細かな揺れを表す2次元配列 [フレーム数 × 周波数ビン数]
   * @param notes - ピッチベンドを追加するノートイベントの配列
   * @param nBinsTolerance - 周波数ビンの許容範囲（デフォルト: 25）。ノートの音高に近いビンを探す際の範囲
   * @returns ピッチベンド情報が追加されたノートイベントの配列
   *
   * @example
   * ```typescript
   * const notesWithBends = addPitchBendsToNoteEvents(contours, notes);
   * ```
   */
  export function addPitchBendsToNoteEvents(
    contours: number[][],
    notes: NoteEvent[],
    nBinsTolerance?: number
  ): NoteEvent[];

  /**
   * フレーム単位のノートイベントを時間単位（秒）に変換する
   *
   * モデルの出力はフレーム単位で表現されていますが、この関数を使うことで
   * 実際の時刻（秒）とその継続時間（秒）に変換できます。
   * MIDI出力や音楽再生に使用する際に必要な変換処理です。
   *
   * @param notes - フレーム単位のノートイベント配列
   * @returns 時間単位（秒）に変換されたノートイベント配列
   *
   * @example
   * ```typescript
   * const timingNotes = noteFramesToTime(frameNotes);
   * // timingNotes[0].startTimeSeconds => 1.25 (秒)
   * // timingNotes[0].durationSeconds => 0.5 (秒)
   * ```
   */
  export const noteFramesToTime: (notes: NoteEvent[]) => NoteEventTime[];

  /**
   * ノートイベントをMIDIファイルデータ（Buffer）に変換する
   *
   * @param notes - 時間単位のノートイベント配列
   * @returns MIDIファイルのバイナリデータ（Buffer）
   */
  export function generateFileData(notes: NoteEventTime[]): Buffer;

  /**
   * Basic Pitch モデルのクラス
   */
  export class BasicPitch {
    /**
     * @param modelPath - モデルファイル（model.json）のパス
     */
    constructor(modelPath: string);

    /**
     * オーディオバッファを解析してノート情報を取得する
     *
     * @param audioBuffer - 解析対象のオーディオバッファ
     * @param onFrames - フレーム、オンセット、コンターデータを受け取るコールバック
     * @param onProgress - 進捗状況（0.0〜1.0）を受け取るコールバック
     * @returns Promise（処理完了時にresolve）
     */
    evaluateModel(
      audioBuffer: AudioBuffer,
      onFrames: (
        frames: number[][],
        onsets: number[][],
        contours: number[][]
      ) => void,
      onProgress: (progress: number) => void
    ): Promise<void>;
  }
}

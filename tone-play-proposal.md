# File要素の再生タイミング制御の改善提案

## 現状の課題

現在、`play`関数内でFile型要素を再生する際、PPQ（Pulses Per Quarter Note）を固定値1で増加させています：

```typescript
if (el instanceof File) {
  arr.push({ time: `${currentPPQ}i`, el });
  // FIXME: fileの再生時間からPPQを計算するべきか、他の方法があるのか
  currentPPQ += 1;
}
```

この実装には以下の問題があります：

1. 音声ファイルの実際の長さが考慮されていない
2. 音楽的なタイミングと実際の音声ファイルの長さが一致しない可能性がある
3. 他の音楽要素（音符など）との同期が正確でない可能性がある

## 解決案

### 1. ファイルの再生時間からPPQを計算する方法

```typescript
const calculatePPQFromDuration = async (file: File) => {
  const audio = new Audio(URL.createObjectURL(file));
  await new Promise(resolve => {
    audio.addEventListener('loadedmetadata', resolve);
  });
  const duration = audio.duration; // 秒単位
  const quarterNoteDuration = 60 / Transport.bpm.value; // 4分音符の長さ（秒）
  return Math.round((duration / quarterNoteDuration) * Transport.PPQ);
};
```

- メリット：
  - 実際の音声長に基づいた正確なタイミング制御
  - 既存の音楽要素との自然な統合
- デメリット：
  - 音声ファイルのメタデータ読み込みが必要
  - 実行時のパフォーマンスへの影響

### 2. メタデータによる方法

```typescript
interface AudioFileMetadata {
  duration: Duration; // 音楽的な長さ（4分音符単位など）
}

interface AudioFile extends File {
  metadata?: AudioFileMetadata;
}
```

- メリット：
  - 音楽的な意図を明確に表現可能
  - パフォーマンスへの影響が少ない
- デメリット：
  - メタデータの管理が必要
  - ファイル作成時に追加の設定が必要

### 3. イベントベースの方法

```typescript
const playWithEvents = async (elements: (MusicalElement | File)[]) => {
  const playNext = (index: number) => {
    if (index >= elements.length) return;
    const el = elements[index];
    if (el instanceof File) {
      const player = new Player(URL.createObjectURL(el));
      player.onstop = () => playNext(index + 1);
      player.start();
    } else {
      // 既存の音楽要素の再生処理
      playNext(index + 1);
    }
  };
  playNext(0);
};
```

- メリット：
  - 実際の再生完了に基づく正確な同期
  - ファイル長を事前に計算する必要がない
- デメリット：
  - Transport.PPQベースの既存システムとの統合が複雑
  - 同時再生の制御が難しい

## 推奨案

メタデータによる方法（案2）を採用することを推奨します。

理由：
1. 音楽的な意図を明確に表現できる
2. パフォーマンスへの影響が最小限
3. 既存のDuration型との親和性が高い
4. 将来的な拡張性が高い（テンポ変更などにも対応しやすい）

### 実装案

```typescript
interface AudioFile extends File {
  metadata?: AudioFileMetadata;
}

const play = async (
  elements: (MusicalElement | AudioFile)[],
  defaultDuration: Duration = 4
) => {
  const arr: { time: Time; el: MusicalElement | AudioFile }[] = [];
  let currentPPQ = 0;
  
  for (const el of elements) {
    if (el instanceof File) {
      const duration = (el as AudioFile).metadata?.duration ?? defaultDuration;
      arr.push({ time: `${currentPPQ}i`, el });
      currentPPQ += (Transport.PPQ * 4) / duration;
    } else if (el.type !== "bar") {
      // 既存の処理
    }
  }
  // 以降は既存の処理
};
```

この実装により：
- 音声ファイルに意図した音楽的な長さを設定可能
- 既存の音楽要素との一貫性のある時間管理
- デフォルト値による後方互換性の確保

が実現できます。
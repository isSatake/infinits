import { Input, BlobSource, ALL_FORMATS, AudioBufferSink } from "mediabunny";

export const prepareAudioBuffer = async (
  audioFile: File
): Promise<AudioBuffer> => {
  // mediabunnyでdemux
  const input = new Input({
    source: new BlobSource(audioFile),
    formats: ALL_FORMATS,
  });
  const track = await input.getPrimaryAudioTrack();
  if (!track) {
    throw new Error("No audio track found");
  }
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
  const audioCtx = new AudioContext();
  const audioBuffer = await to22050HzAudioBuffer(monoPCM, track.sampleRate);
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;

  // HPF
  const hpFilter = audioCtx.createBiquadFilter();
  hpFilter.type = "highpass";
  hpFilter.frequency.value = 300;
  hpFilter.Q.value = 0.707;
  source.connect(hpFilter).connect(audioCtx.destination);
  source.start();

  return audioBuffer;
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

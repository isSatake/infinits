export const getAudioDurationSec = async (file: File) => {
  const audio = new Audio(URL.createObjectURL(file));
  await new Promise((resolve) => {
    audio.addEventListener("loadedmetadata", resolve);
  }).finally(() => audio.remove());
  return audio.duration;
};

import { usePlayTone } from "@/hooks/play";
import React from "react";

export const PlayButton = () => {
  const onClick = usePlayTone();
  return <button className="play" onClick={onClick}></button>;
};

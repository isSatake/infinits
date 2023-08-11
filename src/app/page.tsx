"use client";

import { useEffect } from "react";

export default function MainCanvas() {
  useResizeCanvas("mainCanvas");
  return (
    <canvas
      id="mainCanvas"
      width=""
      className="absolute w-full h-full"
    ></canvas>
  );
}

const useResizeCanvas = (id: string) => {
  useEffect(() => {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    resizeCanvas(canvas, window.innerWidth, window.innerHeight);
    const resize = () =>
      resizeCanvas(canvas, window.innerWidth, window.innerHeight);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);
};

const resizeCanvas = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) => {
  canvas.width = width;
  canvas.height = height;
};

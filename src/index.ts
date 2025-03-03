import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/app";

const main = () => {
  const el = document.getElementById("app")!;
  const root = createRoot(el);
  root.render(createElement(App));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}

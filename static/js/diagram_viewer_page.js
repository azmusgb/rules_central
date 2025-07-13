"use strict";

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("diagramSkeleton")?.classList.add("hidden");
    document.getElementById("diagramContent")?.classList.remove("hidden");
  }, 1500);

  window.zoomIn = () => alert("Zoom In!");
  window.zoomOut = () => alert("Zoom Out!");
  window.downloadDiagram = () => alert("Download!");
  window.fullscreenDiagram = () => alert("Fullscreen!");
});

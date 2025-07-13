"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const dataEl = document.getElementById("indexChartsData");
  const rulesData = dataEl ? JSON.parse(dataEl.dataset.rules || "{}") : {};

  const ctx = document.getElementById("rules-chart");
  if (ctx) {
    new Chart(ctx, {
      type: "line",
      data: rulesData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
        },
      },
    });
  }
});

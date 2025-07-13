"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const dataEl = document.getElementById("dashboardChartsData");
  const rulesData = dataEl ? JSON.parse(dataEl.dataset.rules || "{}") : {};
  const uploadsData = dataEl ? JSON.parse(dataEl.dataset.uploads || "{}") : {};

  const ctx1 = document.getElementById("chart-rules");
  if (ctx1) {
    new Chart(ctx1, {
      type: "line",
      data: rulesData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }

  const ctx2 = document.getElementById("chart-uploads");
  if (ctx2) {
    new Chart(ctx2, {
      type: "bar",
      data: uploadsData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
      },
    });
  }
});

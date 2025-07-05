// Dashboard page logic

document.addEventListener("DOMContentLoaded", function () {
  const METRICS_API_ENDPOINT = "/api/metrics";
  const METRIC_UPDATE_INTERVAL = 300000; // 5 minutes
  let metricsRefreshTimer;

  const initDashboard = () => {
    initLoader();
    initScrollAnimations();
    initRetryHandlers();
    setupMetricRefresh();
    initCharts();
    loadInitialData();
  };

  const initLoader = () => {
    const loader = document.getElementById("globalLoader");
    if (!loader) return;

    let progress = 0;
    const progressBar = loader.querySelector(".loading-progress");
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          loader.classList.add("fade-out");
          setTimeout(() => loader.remove(), 500);
        }, 300);
      }
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute("aria-valuenow", progress);
    }, 100);
  };

  const initScrollAnimations = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      const delay = el.dataset.delay || 0;
      el.style.setProperty("--animation-delay", `${delay}ms`);
      observer.observe(el);
    });
  };

  const initRetryHandlers = () => {
    document.querySelectorAll(".retry-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const metricId = btn.dataset.metric;
        const card = btn.closest(".metric-card");
        const loadingState = card?.querySelector(".metric-loading");
        const errorState = card?.querySelector(".metric-error");

        if (loadingState) loadingState.classList.remove("hidden");
        if (errorState) errorState.classList.add("hidden");

        try {
          const data = await fetchMetricsData();
          updateMetricCard(card, data);
        } catch (error) {
          console.error(`Error retrying metric ${metricId}:`, error);
          if (loadingState) loadingState.classList.add("hidden");
          if (errorState) errorState.classList.remove("hidden");
        }
      });
    });
  };

  const setupMetricRefresh = () => {
    const refreshMetrics = async () => {
      try {
        const data = await fetchMetricsData();
        updateAllMetrics(data);
      } catch (error) {
        console.error("Failed to refresh metrics:", error);
      } finally {
        metricsRefreshTimer = setTimeout(
          refreshMetrics,
          METRIC_UPDATE_INTERVAL,
        );
      }
    };
    refreshMetrics();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearTimeout(metricsRefreshTimer);
      } else {
        refreshMetrics();
      }
    });
  };

  const initCharts = () => {
    const categoryCtx = document.getElementById("rulesByCategoryChart");
    if (categoryCtx) {
      new Chart(categoryCtx, {
        type: "bar",
        data: {
          labels: ["Business", "Technical", "Compliance", "Operational"],
          datasets: [
            {
              label: "Rules Count",
              data: [120, 85, 60, 45],
              backgroundColor: [
                "rgba(59, 130, 246, 0.7)",
                "rgba(16, 185, 129, 0.7)",
                "rgba(167, 139, 250, 0.7)",
                "rgba(239, 68, 68, 0.7)",
              ],
              borderColor: [
                "rgba(59, 130, 246, 1)",
                "rgba(16, 185, 129, 1)",
                "rgba(167, 139, 250, 1)",
                "rgba(239, 68, 68, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              mode: "index",
              intersect: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(255, 255, 255, 0.1)",
              },
              ticks: {
                color: "rgba(255, 255, 255, 0.7)",
              },
            },
            x: {
              grid: {
                display: false,
              },
              ticks: {
                color: "rgba(255, 255, 255, 0.7)",
              },
            },
          },
        },
      });
    }

    const statusCtx = document.getElementById("rulesStatusChart");
    if (statusCtx) {
      new Chart(statusCtx, {
        type: "doughnut",
        data: {
          labels: ["Active", "Draft", "Deprecated", "Archived"],
          datasets: [
            {
              data: [150, 45, 30, 25],
              backgroundColor: [
                "rgba(16, 185, 129, 0.7)",
                "rgba(59, 130, 246, 0.7)",
                "rgba(245, 158, 11, 0.7)",
                "rgba(156, 163, 175, 0.7)",
              ],
              borderColor: [
                "rgba(16, 185, 129, 1)",
                "rgba(59, 130, 246, 1)",
                "rgba(245, 158, 11, 1)",
                "rgba(156, 163, 175, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "right",
              labels: {
                color: "rgba(255, 255, 255, 0.7)",
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${value} (${percentage}%)`;
                },
              },
            },
          },
          cutout: "70%",
        },
      });
    }
  };

  const fetchMetricsData = async () => {
    try {
      const response = await fetch(METRICS_API_ENDPOINT, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      throw error;
    }
  };

  const loadInitialData = () => {
    fetchMetricsData()
      .then((data) => {
        updateAllMetrics(data);
      })
      .catch((error) => {
        console.error("Initial data load failed:", error);
        document.querySelectorAll(".metric-error").forEach((el) => {
          el.classList.remove("hidden");
        });
      });
  };

  const updateAllMetrics = (data) => {
    document.querySelectorAll(".metric-card").forEach((card) => {
      updateMetricCard(card, data);
    });
  };

  const updateMetricCard = (card, data) => {
    const metricId = card.dataset.metricId;
    const valueElement = card.querySelector(".countup");
    const loadingState = card.querySelector(".metric-loading");
    const errorState = card.querySelector(".metric-error");
    const progressFill = card.querySelector(".progress-fill");

    try {
      let value;
      switch (metricId) {
        case "diagramCount":
          value = data.diagramsProcessed || 0;
          break;
        case "rulesExtractedCount":
          value = data.rulesExtracted || 0;
          break;
        case "rulesStatusChart":
          value = Object.values(data.rules_by_status || {}).reduce(
            (a, b) => a + b,
            0,
          );
          break;
        case "recentChangesCount":
          value = data.recent_changes || 0;
          break;
        default:
          value = 0;
      }

      if (valueElement) {
        const currentValue =
          parseInt(valueElement.textContent.replace(/,/g, "")) || 0;
        animateValue(valueElement, currentValue, value, 1500);
      }

      if (progressFill) {
        const currentWidth = parseFloat(progressFill.style.width) || 0;
        progressFill.style.width = card.dataset.progress + "%";
      }

      if (loadingState) loadingState.classList.add("hidden");
      if (errorState) errorState.classList.add("hidden");
    } catch (error) {
      console.error(`Error updating metric ${metricId}:`, error);
      if (loadingState) loadingState.classList.add("hidden");
      if (errorState) errorState.classList.remove("hidden");
    }
  };

  const animateValue = (element, start, end, duration) => {
    const startTime = performance.now();
    const formatNumber = (num) => num.toLocaleString();

    const updateValue = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const currentValue = Math.floor(start + (end - start) * easedProgress);
      element.textContent = formatNumber(currentValue);
      if (progress < 1) {
        requestAnimationFrame(updateValue);
      } else {
        element.textContent = formatNumber(end);
      }
    };

    requestAnimationFrame(updateValue);
  };

  initDashboard();
});

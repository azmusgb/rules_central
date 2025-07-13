"use strict";
document.addEventListener("DOMContentLoaded", () => {
  // Show animated content after a short delay
  setTimeout(() => {
    document.querySelector(".animated-content")?.classList.add("show");
  }, 100);

  // DOM Elements
  const apiForm = document.getElementById("apiForm");
  const resultSection = document.getElementById("result-section");
  const resultMessage = document.getElementById("result-message");
  const spinner = document.getElementById("spinner");
  const copyButton = document.getElementById("copyButton");
  const bodyTextarea = document.getElementById("body");
  const charCount = document.getElementById("charCount");

  if (bodyTextarea && charCount) {
    charCount.textContent = `${bodyTextarea.value.length} chars`;
    bodyTextarea.addEventListener("input", () => {
      charCount.textContent = `${bodyTextarea.value.length} chars`;
    });
  }

  document.getElementById("formatJsonBtn")?.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(bodyTextarea.value);
      bodyTextarea.value = JSON.stringify(parsed, null, 2);
      charCount.textContent = `${bodyTextarea.value.length} chars`;
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  });

  document.getElementById("clearFormBtn")?.addEventListener("click", () => {
    apiForm.reset();
    if (bodyTextarea) bodyTextarea.value = "";
    if (charCount) charCount.textContent = "0 chars";
  });

  document.getElementById("addHeaderBtn")?.addEventListener("click", () => {
    const container = document.getElementById("headersContainer");
    if (!container) return;
    const newRow = document.createElement("div");
    newRow.className = "grid grid-cols-12 gap-2 items-center mt-3";
    newRow.innerHTML = `
        <div class="col-span-5">
          <input type="text" class="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50" placeholder="Header name">
        </div>
        <div class="col-span-6">
          <input type="text" class="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50" placeholder="Header value">
        </div>
        <div class="col-span-1 flex justify-center">
          <button class="text-slate-500 hover:text-red-400 transition-colors remove-header">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>`;
    container.appendChild(newRow);
    newRow.querySelector(".remove-header")?.addEventListener("click", () => {
      container.removeChild(newRow);
    });
  });

  // Function to validate JSON
  function isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  // Handle form submission
  apiForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const endpoint = document.getElementById("endpoint").value.trim();
    const body = document.getElementById("body").value.trim();

    // Validate input
    if (!endpoint || !body || !isValidJSON(body)) {
      window.app.showToast(
        "Please check your endpoint and JSON format.",
        "error",
      );
      return;
    }

    // Show spinner and prepare result section
    spinner.classList.remove("hidden");
    spinner.classList.add("flex"); // Ensure spinner is visible and properly centered
    resultMessage.textContent = "Processing...";
    resultSection.classList.remove("hidden");
    resultSection.className = "p-6 rounded-lg shadow bg-blue-100 text-sm";

    const submitButton = apiForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = `
            <span class="inline-flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            </span>
        `;
    submitButton.classList.add("opacity-50", "cursor-not-allowed");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
      });

      console.log("Response Status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      resultMessage.textContent = JSON.stringify(data, null, 2);
      resultSection.className = "p-6 rounded-lg shadow bg-green-100 text-sm";
      window.app.showToast("Request successful!", "success");
    } catch (error) {
      console.error("API Error:", error);
      resultMessage.textContent = `Error: ${error.message}`;
      resultSection.className = "p-6 rounded-lg shadow bg-red-100 text-sm";
      window.app.showToast("Request failed.", "error");
    } finally {
      // Hide the spinner and reset button state
      spinner.classList.add("hidden");
      spinner.classList.remove("flex");
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
      submitButton.classList.remove("opacity-50", "cursor-not-allowed");
    }
  });

  // Copy response to clipboard
  copyButton.addEventListener("click", () => {
    navigator.clipboard
      .writeText(resultMessage.textContent)
      .then(() => window.app.showToast("Response copied to clipboard!", "info"))
      .catch(() => window.app.showToast("Failed to copy.", "error"));
  });
});

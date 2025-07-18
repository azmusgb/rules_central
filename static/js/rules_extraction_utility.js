"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const executeButton = document.getElementById("executeButton");
  const executionMessage = document.getElementById("execution-message");
  const outputMessage = document.getElementById("output-message");
  const spinner = document.getElementById("spinner");

  // Event listener for the execute button
  executeButton.addEventListener("click", async () => {
    executionMessage.textContent = "Processing...";
    outputMessage.classList.add("hidden"); // Hide previous output
    executeButton.disabled = true; // Disable button to prevent multiple clicks
    spinner.classList.remove("hidden"); // Show spinner

    try {
      // Make the API request
      // Replace server endpoint below with the actual extraction API
      const response = await fetch("/api/rules_extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Send an empty object or any required data
      });

      // Check for HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      // Parse the JSON response
      const data = await response.json();
      executionMessage.textContent = "Execution Success";
      outputMessage.textContent = JSON.stringify(data, null, 2); // Format JSON for display
      outputMessage.classList.remove("hidden"); // Show output message
      window.app.showToast("Rules extracted successfully!"); // Show success toast
    } catch (error) {
      executionMessage.textContent = "Execution Failed";
      outputMessage.textContent = ""; // Clear output on error
      window.app.showToast(
        "Error extracting rules. Please try again.",
        "error",
      );
      console.error("Error during execution:", error); // Log error for debugging
    } finally {
      executeButton.disabled = false; // Re-enable button
      spinner.classList.add("hidden"); // Hide spinner
    }
  });
});

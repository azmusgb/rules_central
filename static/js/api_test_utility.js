document.addEventListener('DOMContentLoaded', () => {
    // Show animated content after a short delay
    setTimeout(() => {
        document.querySelector('.animated-content')?.classList.add('show');
    }, 100);

    // DOM Elements
    const apiForm = document.getElementById('apiForm');
    const resultSection = document.getElementById('result-section');
    const resultMessage = document.getElementById('result-message');
    const spinner = document.getElementById('spinner');
    const copyButton = document.getElementById('copyButton');
    const toast = document.getElementById('toast');

    // Function to show toast notifications
    function showToast(message, color = 'bg-blue-600') {
        toast.textContent = message;
        toast.className = `${color} text-white px-4 py-2 rounded shadow fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 opacity-100 transition-opacity`;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2000);
    }

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
    apiForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const endpoint = document.getElementById('endpoint').value.trim();
        const body = document.getElementById('body').value.trim();

        // Validate input
        if (!endpoint || !body || !isValidJSON(body)) {
            showToast('Please check your endpoint and JSON format.', 'bg-red-600');
            return;
        }

        // Show spinner and prepare result section
        spinner.classList.remove('hidden');
        spinner.classList.add('flex'); // Ensure spinner is visible and properly centered
        resultMessage.textContent = 'Processing...';
        resultSection.classList.remove('hidden');
        resultSection.className = 'p-6 rounded-lg shadow bg-blue-100 text-sm';

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
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body
            });

            console.log('Response Status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);
            resultMessage.textContent = JSON.stringify(data, null, 2);
            resultSection.className = 'p-6 rounded-lg shadow bg-green-100 text-sm';
            showToast('Request successful!', 'bg-green-600');
        } catch (error) {
            console.error('API Error:', error);
            resultMessage.textContent = `Error: ${error.message}`;
            resultSection.className = 'p-6 rounded-lg shadow bg-red-100 text-sm';
            showToast('Request failed.', 'bg-red-600');
        } finally {
            // Hide the spinner and reset button state
            spinner.classList.add('hidden');
            spinner.classList.remove('flex');
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });

    // Copy response to clipboard
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(resultMessage.textContent)
            .then(() => showToast('Response copied to clipboard!', 'bg-blue-600'))
            .catch(() => showToast('Failed to copy.', 'bg-red-600'));
    });
});
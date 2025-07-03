'use strict';
/*helpers.js*/
const showLoadingSpinner = () => {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.classList.add('show');
        loadingSpinner.setAttribute('aria-busy', 'true');
    }
};

const hideLoadingSpinner = () => {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.classList.remove('show');
        loadingSpinner.removeAttribute('aria-busy');
    }
};

const waitForSvg = (container) =>
    new Promise((resolve, reject) => {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    const svgElement = container.querySelector('svg');
                    if (svgElement) {
                        observer.disconnect();
                        resolve(svgElement);
                        return;
                    }
                }
            }
        });
        observer.observe(container, { childList: true, subtree: true });
        setTimeout(() => reject(new Error('SVG load timeout')), 5000);
    });

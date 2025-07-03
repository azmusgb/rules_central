'use strict';
export function loadDiagram(diagramDefinition) {
    const container = document.getElementById('diagramContainer');
    if (container) {
        container.innerHTML = diagramDefinition;

        // Initialize Mermaid.js
        mermaid.initialize({ startOnLoad: false });
        mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    } else {
        console.error('Element with ID "diagramContainer" not found.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loadDiagrams = async (rootName) => {
        const container = document.getElementById('diagramContainer');
        if (container) {
            container.innerHTML = '';

            console.log(`Loading diagrams for: ${rootName}`);

            try {
                const response = await fetch(`/load_diagrams/${rootName}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log('Diagrams data received:', data);

                if (data.totalDiagrams) {
                    for (let i = 1; i <= data.totalDiagrams; i++) {
                        const diagramDiv = document.createElement('div');
                        diagramDiv.classList.add('diagram');
                        diagramDiv.innerHTML = `
                            <div class="diagram-controls text-center mb-4">
                                <div class="d-inline-block">
                                    <button class="zoom_in btn btn-primary" aria-label="Zoom In">Zoom In</button>
                                    <button class="zoom_out btn btn-primary" aria-label="Zoom Out">Zoom Out</button>
                                    <button class="reset_zoom btn btn-primary" aria-label="Reset Zoom">Reset Zoom</button>
                                    <button class="fit_to_screen btn btn-primary" aria-label="Fit to Screen">Fit to Screen</button>
                                    <button class="export_svg btn btn-primary" aria-label="Export SVG">Export SVG</button>
                                    <button class="export_png btn btn-primary" aria-label="Export PNG">Export PNG</button>
                                    <button class="export_pdf btn btn-primary" aria-label="Export PDF">Export PDF</button>
                                </div>
                            </div>
                            <h2 class="text-center">Diagram ${i}</h2>
                            <div class='mermaid diagram_container' id='diagram${i}'></div>
                        `;
                        container.appendChild(diagramDiv);

                        console.log(`Fetching diagram content for diagram ${i}`);

                        try {
                            const diagramResponse = await fetch(`/diagrams/${rootName}/mermaid_diagram_${i}.html`);
                            if (!diagramResponse.ok) {
                                throw new Error(`HTTP error! status: ${diagramResponse.status}`);
                            }
                            const html = await diagramResponse.text();
                            document.getElementById(`diagram${i}`).innerHTML = html;
                            console.log(`Initializing Mermaid for diagram ${i}`);

                            // Initialize Mermaid.js
                            mermaid.initialize({ startOnLoad: false });
                            mermaid.init(undefined, document.querySelectorAll(`#diagram${i} .mermaid`));

                            console.log(`Mermaid initialized for diagram ${i}`);

                            const svgElement = document.getElementById(`diagram${i}`).querySelector('svg');
                            if (svgElement) {
                                console.log(`SVG element found for diagram ${i}`);
                                if (typeof svgPanZoom !== 'undefined') {
                                    console.log(`Initializing SVG Pan Zoom for diagram ${i}`);
                                    try {
                                        svgPanZoom(svgElement, {
                                            zoomEnabled: true,
                                            controlIconsEnabled: true,
                                            fit: true,
                                            center: true
                                        });
                                    } catch (error) {
                                        console.error(`Error initializing SVG Pan Zoom for diagram ${i}:`, error);
                                    }
                                } else {
                                    console.error('svgPanZoom library is not loaded.');
                                }
                            } else {
                                console.error(`No SVG element found for diagram ${i}`);
                            }
                        } catch (error) {
                            console.error(`Error loading diagram content for diagram ${i}:`, error);
                            const errorMessage = document.getElementById('errorMessage');
                            errorMessage.innerHTML = `Error loading diagram ${i}.`;
                        }
                    }
                } else {
                    console.error("No diagrams for this JSON file");
                    const errorMessage = document.getElementById('errorMessage');
                    errorMessage.innerHTML = "No diagrams found for the uploaded JSON file.";
                }
            } catch (error) {
                console.error("Error loading diagrams:", error);
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.innerHTML = "Error loading diagrams.";
            }
        } else {
            console.error('Element with ID "diagramContainer" not found.');
        }
    };

    window.loadDiagrams = loadDiagrams;
});

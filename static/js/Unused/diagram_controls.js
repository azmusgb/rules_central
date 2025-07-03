function renderDiagram() {
    const input = document.getElementById('mermaid-input').value;
    const container = document.getElementById('diagram-container');
    container.innerHTML = '';

    if (!input.trim()) {
        logMessage('Error: Diagram input is empty');
        return;
    }

    try {
        mermaid.parse(input);
        mermaid.render('mermaid-diagram', input).then(result => {
            container.innerHTML = result.svg;
            setupZoomAndPan();
            logMessage('Diagram rendered successfully');
        }).catch(error => {
            logMessage(`Error rendering diagram: ${error.message}`);
        });
    } catch (error) {
        logMessage(`Error parsing diagram: ${error.message}`);
    }
}

function setupZoomAndPan() {
    const container = document.getElementById('diagram-container');
    const svg = container.querySelector('svg');

    if (!svg) return;

    const bbox = svg.getBBox();
    svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

    zoomBehavior = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            const { x, y, k } = event.transform;
            svg.setAttribute('transform', `translate(${x},${y}) scale(${k})`);
        });

    d3.select(container).call(zoomBehavior);

    zoomBehavior.transform(d3.select(container), d3.zoomIdentity);
}

function zoomIn() {
    const container = document.getElementById('diagram-container');
    d3.select(container).transition().call(zoomBehavior.scaleBy, 1.2);
}

function zoomOut() {
    const container = document.getElementById('diagram-container');
    d3.select(container).transition().call(zoomBehavior.scaleBy, 1 / 1.2);
}

function exportSVG() {
    try {
        const svgData = document.querySelector('#diagram-container svg').outerHTML;
        const blob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'diagram.svg';
        link.click();
        logMessage('SVG exported successfully');
    } catch (error) {
        logMessage(`Error exporting SVG: ${error.message}`);
    }
}

function exportPNG() {
    html2canvas(document.querySelector("#diagram-container")).then(canvas => {
        const link = document.createElement('a');
        link.download = 'diagram.png';
        link.href = canvas.toDataURL();
        link.click();
        logMessage('PNG exported successfully');
    }).catch(error => {
        logMessage(`Error exporting PNG: ${error.message}`);
    });
}

function exportPDF() {
    const { jsPDF } = window.jspdf;
    html2canvas(document.querySelector("#diagram-container")).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        pdf.addImage(imgData, 'PNG', 0, 0);
        pdf.save("diagram.pdf");
        logMessage('PDF exported successfully');
    }).catch(error => {
        logMessage(`Error exporting PDF: ${error.message}`);
    });
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    mermaid.initialize(isDarkMode ? { theme: 'dark' } : { theme: 'default' });
    renderDiagram();
    logMessage('Dark mode toggled');
}

// Zoom functionality for diagrams

export function enableZoom() {
    const svgContainer = document.querySelector('svg');
    const g = svgContainer.querySelector('g');

    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.setAttribute('transform', event.transform);
        });

    d3.select(svgContainer).call(zoom);
}

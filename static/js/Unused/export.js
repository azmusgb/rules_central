'use strict';
// Export functionality for diagrams

export function exportSvg() {
    const svg = document.querySelector('svg');
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);

    const a = document.createElement('a');
    a.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
    a.download = 'diagram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function exportPng() {
    const svg = document.querySelector('svg');
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);

    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);

    img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);

        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'diagram.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
}

export function exportPdf() {
    const svg = document.querySelector('svg');
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);

    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);

    img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);

        const pdf = new jsPDF('landscape', 'pt', [canvas.width, canvas.height]);
        pdf.addImage(canvas.toDataURL('image/png'), 0, 0, canvas.width, canvas.height);
        pdf.save('diagram.pdf');
    };
}

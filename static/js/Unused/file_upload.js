'use strict';
document.getElementById('file-upload').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('mermaid-input').value = e.target.result;
            renderDiagram();
            logMessage('File uploaded and rendered');
        };
        reader.readAsText(file);
    }
}

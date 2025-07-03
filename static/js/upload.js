'use strict';
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("uploadForm");
    const input = document.getElementById("fileInput");
    const dropZone = document.getElementById("dropZone");
    const filesPreview = document.getElementById("filesPreview");
    const fileList = document.getElementById("fileList");
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressStatus = document.getElementById("progressStatus");
    const progressPercent = document.getElementById("progressPercent");
    const submitBtn = document.getElementById("submitBtn");

    // Trigger file input when clicking the drop zone or button
    dropZone.addEventListener("click", (e) => {
        if (!e.target.closest('button')) {
            input.click();
        }
    });

    // Drag and drop handlers
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('active');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('active');
        });
    });

    // Accessibility: focus/blur for drop zone
    dropZone.addEventListener('focus', () => dropZone.classList.add('active'));
    dropZone.addEventListener('blur', () => dropZone.classList.remove('active'));

    dropZone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.name.toLowerCase().endsWith('.json')
        );

        if (files.length !== e.dataTransfer.files.length) {
            window.app.showToast('Only JSON files are accepted', 'red');
        }

        if (files.length > 0) {
            const dataTransfer = new DataTransfer();
            files.forEach(file => dataTransfer.items.add(file));
            input.files = dataTransfer.files;
            updateFilePreview();
        }
    });

    // File input change handler
    input.addEventListener('change', () => {
        const files = Array.from(input.files).filter(file =>
            file.name.toLowerCase().endsWith('.json')
        );

        if (files.length !== input.files.length) {
            window.app.showToast('Only JSON files are accepted', 'red');
            const dataTransfer = new DataTransfer();
            files.forEach(file => dataTransfer.items.add(file));
            input.files = dataTransfer.files;
        }

        updateFilePreview();
    });

    // Update file preview and enable submit button if files are selected
    function updateFilePreview() {
        if (input.files.length === 0) {
            filesPreview.classList.add('hidden');
            submitBtn.disabled = true;
            return;
        }

        submitBtn.disabled = false;
        filesPreview.classList.remove('hidden');
        fileList.innerHTML = '';

        Array.from(input.files).forEach((file, index) => {
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card bg-gray-50 p-3 rounded-lg flex items-center justify-between';

            const fileInfo = document.createElement('div');
            fileInfo.className = 'flex items-center';

            const icon = document.createElement('span');
            icon.className = 'material-icons text-gray-500 mr-3';
            icon.textContent = 'insert_drive_file';

            const fileName = document.createElement('span');
            fileName.className = 'text-sm font-medium text-gray-700 truncate max-w-xs';
            fileName.textContent = file.name;

            const fileSize = document.createElement('span');
            fileSize.className = 'text-xs text-gray-500 ml-2';
            fileSize.textContent = formatFileSize(file.size);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'text-gray-400 hover:text-red-500 transition';
            removeBtn.innerHTML = '<span class="material-icons">close</span>';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFile(index);
            });

            fileInfo.appendChild(icon);
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileSize);
            fileCard.appendChild(fileInfo);
            fileCard.appendChild(removeBtn);
            fileList.appendChild(fileCard);
        });
    }

    // Remove file from list
    function removeFile(index) {
        const files = Array.from(input.files);
        files.splice(index, 1);

        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));
        input.files = dataTransfer.files;

        updateFilePreview();
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (input.files.length === 0) {
            window.app.showToast('Please select at least one JSON file', 'red');
            return;
        }

        const formData = new FormData(form);
        submitBtn.disabled = true;
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        progressStatus.textContent = 'Preparing upload...';

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percent + '%';
                progressPercent.textContent = percent + '%';

                if (percent < 100) {
                    progressStatus.textContent = 'Uploading...';
                } else {
                    progressStatus.textContent = 'Processing files...';
                }
            }
        });

        xhr.addEventListener('load', () => {
            const contentType = xhr.getResponseHeader('Content-Type') || '';
            let response;
            if (contentType.includes('application/json')) {
                try {
                    response = JSON.parse(xhr.responseText);
                } catch (err) {
                    window.app.showToast('Invalid server response', 'red');
                    progressContainer.classList.add('hidden');
                    submitBtn.disabled = false;
                    return;
                }
                if (response.success) {
                    window.app.showToast('JSON files uploaded successfully!', 'green');
                    setTimeout(() => {
                        const redirectUrl = response.redirect_url ||
                            `/view_diagram?root_name=${input.files[0].name.replace(/\.[^/.]+$/, "")}&diagramName=${input.files[0].name.replace(/\.[^/.]+$/, "")}.mmd`;
                        window.location.href = redirectUrl;
                    }, 1500);
                } else {
                    window.app.showToast(response.message || 'Upload failed', 'red');
                    progressContainer.classList.add('hidden');
                    submitBtn.disabled = false;
                }
            } else {
                window.app.showToast('Unexpected server response', 'red');
                progressContainer.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });

        xhr.addEventListener('error', () => {
            window.app.showToast('Network error occurred', 'red');
            progressContainer.classList.add('hidden');
            submitBtn.disabled = false;
        });

        xhr.open('POST', form.action);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.send(formData);
    });

    // Form reset
    form.addEventListener('reset', () => {
        filesPreview.classList.add('hidden');
        progressContainer.classList.add('hidden');
        submitBtn.disabled = false;
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        progressStatus.textContent = 'Preparing upload...';
    });

});
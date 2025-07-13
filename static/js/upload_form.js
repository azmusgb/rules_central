"use strict";
document.addEventListener("alpine:init", () => {
  Alpine.data("uploadForm", () => ({
    hover: false,
    file: null,
    isLoading: false,
    progress: 0,

    handleDrop(ev) {
      this.hover = false;
      if (ev.dataTransfer.files.length) {
        this.file = ev.dataTransfer.files[0];
      }
    },

    submitForm() {
      if (!this.file || this.isLoading) return;

      this.isLoading = true;
      this.progress = 0;

      const formData = new FormData(this.$root);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", this.$root.action);

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          this.progress = Math.round((ev.loaded / ev.total) * 100);
        }
      };

      xhr.onload = () => {
        this.isLoading = false;
        if (xhr.status >= 200 && xhr.status < 300) {
          const dataEl = document.getElementById("uploadData");
          const url = dataEl ? dataEl.dataset.redirect : "/";
          window.location.href = url;
        } else {
          console.error("Upload failed");
        }
      };

      xhr.onerror = () => {
        this.isLoading = false;
        console.error("Upload error");
      };

      xhr.send(formData);
    },
  }));
});

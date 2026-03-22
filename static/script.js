document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('video-file');
    const fileName = document.getElementById('file-name');
    const form = document.getElementById('extract-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = document.getElementById('spinner');
    const errorMsg = document.getElementById('error-message');

    // Handle click on drop zone
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = files[0];
        const isVideoType = file.type.startsWith('video/');
        const isVideoExt = file.name.match(/\.(mp4|avi|mov|mkv|wmv|webm)$/i);
        
        if (files.length > 0 && (isVideoType || isVideoExt)) {
            fileInput.files = files;
            updateFileName(files[0].name);
        } else {
            showError("Por favor, selecione um arquivo de vídeo válido.");
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            updateFileName(e.target.files[0].name);
        }
    });

    function updateFileName(name) {
        fileName.textContent = name;
        fileName.classList.add('has-file');
        errorMsg.style.display = 'none';
    }

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!fileInput.files.length) {
            showError("Por favor, selecione um vídeo primeiro.");
            return;
        }
        
        const formData = new FormData(form);
        
        // UI Loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Extraindo fotos...';
        spinner.style.display = 'block';
        errorMsg.style.display = 'none';
        
        try {
            const response = await fetch('/api/extract', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao processar o vídeo');
            }
            
            // Get the ZIP file as a blob
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'frames_extraidos.zip';
            document.body.appendChild(a);
            
            // Trigger download
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            btnText.textContent = 'Sucesso! Extrair outro video?';
            
            setTimeout(() => {
                btnText.textContent = 'Extrair Fotos';
            }, 3000);
            
        } catch (error) {
            showError(error.message);
            btnText.textContent = 'Extrair Fotos';
        } finally {
            submitBtn.disabled = false;
            spinner.style.display = 'none';
        }
    });
});

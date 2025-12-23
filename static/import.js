const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');
const statusBlock = document.getElementById('status');

importBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    importBtn.disabled = true;
    importBtn.textContent = 'Importing...';
    statusBlock.style.display = 'none';
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            const result = await e621Utils.importData(e.target.result);
            
            if (result.success) {
                statusBlock.style.display = 'block';
                importBtn.style.display = 'none'
                statusBlock.className = 'status success';
                statusBlock.textContent = '✓ Import successful! Closing in 2 seconds...';
                
                setTimeout(() => {
                    window.close();
                }, 2000);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            statusBlock.className = 'status error';
            statusBlock.textContent = '✗ Error: ' + error.message;
            importBtn.disabled = false;
            importBtn.textContent = 'Choose File';
        }
    };

    reader.onerror = () => {
        statusBlock.style.display = 'block';
        statusBlock.className = 'status error';
        statusBlock.textContent = '✗ Failed to read file';
        importBtn.disabled = false;
        importBtn.textContent = 'Choose File';
    };

    reader.readAsText(file);
});
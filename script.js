document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadBtn');
    const fileList = document.getElementById('fileList');

    uploadButton.addEventListener('click', () => {
        const files = fileInput.files; // Modified
        if (files.length > 0) {
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) { // Modified
                formData.append('files', files[i]); // Modified
            }

            fetch('/upload', {
                method: 'POST',
                body: formData,
            })
            .then(response => response.text())
            .then(message => {
                alert(message);
                loadFiles();
            })
            .catch(error => {
                console.error('Error uploading file:', error);
                alert('Error uploading file.');
            });
        } else {
            alert('Please select files.');
        }
    });

    function loadFiles() {
        fetch('/files')
            .then(response => response.json())
            .then(files => {
                fileList.innerHTML = '';
                files.forEach(filename => {
                    const listItem = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = `/download/${filename}`;
                    link.textContent = filename;
                    listItem.appendChild(link);
                    fileList.appendChild(listItem);
                });
            })
            .catch(error => {
                console.error('Error loading files:', error);
                alert('Error loading files.');
            });
    }

    loadFiles(); // Initial file load
});
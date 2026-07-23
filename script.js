document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadBtn');
    const fileList = document.getElementById('fileList');
    const loginScreen = document.getElementById('loginScreen');
    const mainContent = document.getElementById('main'); // was 'mainContent'
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadProgressBar = document.getElementById('uploadProgressBar');
    const uploadProgressText = document.getElementById('uploadProgressText');

    const basePath = '';

    // Check if already logged in
    if (sessionStorage.getItem('loggedIn') === 'true') {
        showMain();
    }

    loginBtn.addEventListener('click', () => {
        const username = document.getElementById('usernameInput').value;
        const password = document.getElementById('passwordInput').value;

        fetch(`${basePath}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        })
        .then(response => {
            if (response.ok) {
                sessionStorage.setItem('loggedIn', 'true');
                loginError.style.display = 'none';
                showMain();
            } else {
                loginError.style.display = 'block';
            }
        })
        .catch(() => { loginError.style.display = 'block'; });
    });

    // Allow pressing Enter to login
    document.getElementById('passwordInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });

    function showMain() {
        loginScreen.style.display = 'none';
        mainContent.style.display = 'block';
        loadFiles();
    }

    function loadFiles() {
        fetch(`${basePath}/files`)
            .then(response => response.json())
            .then(files => {
                fileList.innerHTML = '';
                files.forEach(filename => {
                    const listItem = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = `${basePath}/download/${filename}`;
                    link.textContent = filename;
                    listItem.appendChild(link);
                    fileList.appendChild(listItem);
                });
            })
            .catch(error => {
                console.error('Error loading files:', error);
                // alert('Error loading files.');
            });
    }

    uploadButton.addEventListener('click', () => {
        const files = fileInput.files;
        if (!files || files.length === 0) {
            alert('Please select files to upload.');
            return;
        }

        const formData = new FormData();
        for (const file of files) {
            formData.append('files', file);
        }

        uploadButton.disabled = true;
        fileInput.disabled = true;
        uploadProgress.style.display = 'block';
        uploadProgressText.style.display = 'block';
        uploadProgressBar.style.width = '0%';
        uploadProgressText.textContent = 'Upload progress: 0%';

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${basePath}/upload`);

        xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) {
                uploadProgressText.textContent = 'Uploading...';
                return;
            }

            const percent = Math.round((event.loaded / event.total) * 100);
            uploadProgressBar.style.width = `${percent}%`;
            uploadProgressText.textContent = `Upload progress: ${percent}%`;
        };

        xhr.onload = () => {
            uploadButton.disabled = false;
            fileInput.disabled = false;

            if (xhr.status >= 200 && xhr.status < 300) {
                uploadProgressBar.style.width = '100%';
                uploadProgressText.textContent = 'Upload complete: 100%';
                fileInput.value = '';
                loadFiles();
                setTimeout(() => {
                    uploadProgress.style.display = 'none';
                    uploadProgressText.style.display = 'none';
                }, 800);
                return;
            }

            const errorText = xhr.responseText || 'Upload failed.';
            uploadProgress.style.display = 'none';
            uploadProgressText.style.display = 'none';
            alert(errorText);
        };

        xhr.onerror = () => {
            uploadButton.disabled = false;
            fileInput.disabled = false;
            uploadProgress.style.display = 'none';
            uploadProgressText.style.display = 'none';
            alert('Upload failed.');
        };

        xhr.send(formData);
    });

    // loadFiles();
});
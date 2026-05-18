document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadBtn');
    const fileList = document.getElementById('fileList');
    const loginScreen = document.getElementById('loginScreen');
    const mainContent = document.getElementById('main'); // was 'mainContent'
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');

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

        fetch(`${basePath}/upload`, {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (response.ok) {
                fileInput.value = '';
                loadFiles();
            } else {
                alert('Upload failed.');
            }
        })
        .catch(() => alert('Upload failed.'));
    });

    // loadFiles();
});
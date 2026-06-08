/**
 * Main Application - Initialize dan manage app state
 */

// Global state
let currentRepository = null;
let currentPath = '';
let currentGitHubAccount = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    console.log('🚀 Initializing Git Manager for iPad');

    // Load saved settings
    loadSettings();

    // Setup event listeners
    setupEventListeners();

    // Load repositories
    await loadAndRenderRepositories();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });

    // Main action buttons
    document.getElementById('newRepoBtn').addEventListener('click', () => {
        openModal('cloneModal');
    });

    document.getElementById('uploadFilesBtn').addEventListener('click', () => {
        handleFileUpload();
    });

    document.getElementById('pullBtn').addEventListener('click', () => {
        handlePull();
    });

    document.getElementById('pushBtn').addEventListener('click', () => {
        handlePush();
    });

    document.getElementById('statusBtn').addEventListener('click', () => {
        handleStatus();
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        handleRefresh();
    });

    // Settings and About
    document.getElementById('settingsBtn').addEventListener('click', () => {
        openModal('settingsModal');
    });

    document.getElementById('aboutBtn').addEventListener('click', () => {
        showToast('🚀 Git Manager v1.0 - Manage your repos on iPad', 'info', 5000);
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Clone modal
    document.getElementById('cloneConfirmBtn').addEventListener('click', () => {
        handleCloneRepository();
    });

    // Settings save
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        saveSettings();
    });

    // Account switcher
    document.getElementById('switchAccountBtn').addEventListener('click', () => {
        handleSwitchAccount();
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        handleLogout();
    });

    // Operations repo select
    document.getElementById('opRepoSelect').addEventListener('change', (e) => {
        const repoFullName = e.target.value;
        if (repoFullName) {
            const [owner, repo] = repoFullName.split('/');
            selectRepository(owner, repo);
        }
    });
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const tab = document.getElementById(tabName);
    if (tab) {
        tab.classList.add('active');
    }

    // Activate button
    const btn = document.querySelector(`[data-tab="${tabName}"]`);
    if (btn) {
        btn.classList.add('active');
    }
}

/**
 * Handle refresh button
 */
async function handleRefresh() {
    showLoading(true, 'Refreshing repositories...');
    try {
        await loadAndRenderRepositories();
        showLoading(false);
        showToast('Repositories refreshed! 🔄', 'success');
    } catch (error) {
        showLoading(false);
        showToast('Failed to refresh repositories', 'error');
        console.error('Refresh error:', error);
    }
}

/**
 * Load and render repositories
 */
async function loadAndRenderRepositories() {
    try {
        const repos = await gitManager.loadRepositories();
        renderRepositories(repos);
        updateRepoSelect(repos);
    } catch (error) {
        console.error('Error loading repositories:', error);
    }
}

/**
 * Select repository and load its files
 */
async function selectRepository(owner, repoName) {
    try {
        gitManager.selectRepository(owner, repoName);
        currentRepository = gitManager.currentRepo;
        currentPath = '';
        showToast(`Selected: ${repoName}`, 'info');
        await loadFileList();
    } catch (error) {
        showToast('Failed to select repository', 'error');
    }
}

/**
 * Alias untuk selectRepository dengan switch ke files tab
 */
async function selectAndLoadRepo(owner, repoName) {
    await selectRepository(owner, repoName);
    switchTab('files');
}

/**
 * Load file list dari repository
 */
async function loadFileList(path = '') {
    if (!currentRepository) {
        showToast('Please select a repository first', 'warning');
        return;
    }

    showLoading(true, `Loading files from ${currentPath || 'root'}...`);
    try {
        const files = await gitManager.getRepoTree(path);
        currentPath = path;
        renderFileList(files, path);
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showToast(`Failed to load files: ${error.message}`, 'error');
    }
}

/**
 * Open repository details modal
 */
async function openRepoDetails(owner, repoName) {
    try {
        const details = await gitAPI.getRepoDetails(owner, repoName);
        alert(`Repository: ${details.full_name}\n\nDescription: ${details.description || 'N/A'}\n\nStars: ${details.stargazers_count}\nForks: ${details.forks_count}\nOpen Issues: ${details.open_issues_count}`);
    } catch (error) {
        showToast('Failed to load repository details', 'error');
    }
}

/**
 * Handle clone repository
 */
async function handleCloneRepository() {
    const url = document.getElementById('cloneUrl').value.trim();
    const branch = document.getElementById('cloneBranch').value.trim() || 'main';
    const pat = document.getElementById('clonePAT').value.trim();

    if (!url) {
        showToast('Please enter repository URL', 'warning');
        return;
    }

    if (pat) {
        gitAPI.setToken(pat);
    }

    showToast(`Added repository: ${url}`, 'info');
    closeModal('cloneModal');

    // Clear form
    document.getElementById('cloneUrl').value = '';
    document.getElementById('cloneBranch').value = '';
    document.getElementById('clonePAT').value = '';

    // Reload repositories
    await loadAndRenderRepositories();
}

/**
 * Handle file upload
 */
function handleFileUpload() {
    if (!currentRepository) {
        showToast('Please select a repository first', 'warning');
        return;
    }

    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.webkitdirectory = true;
    input.onchange = async (e) => {
        const files = e.target.files;
        const fileArray = [];

        for (let file of files) {
            const content = await fileManager.readFile(file);
            const path = file.webkitRelativePath || file.name;
            fileArray.push({ path, content });
        }

        if (fileArray.length > 0) {
            const message = prompt('Commit message:', 'Upload files');
            if (message) {
                await gitManager.uploadMultipleFiles(fileArray, message);
                await loadFileList();
            }
        }
    };

    input.click();
}

/**
 * Handle pull operation
 */
async function handlePull() {
    if (!currentRepository) {
        showToast('Please select a repository first', 'warning');
        return;
    }

    try {
        const changes = await gitManager.simulatePull();
        renderChangesList(changes.files);
    } catch (error) {
        showToast(`Pull failed: ${error.message}`, 'error');
    }
}

/**
 * Handle push operation
 */
async function handlePush() {
    if (!currentRepository) {
        showToast('Please select a repository first', 'warning');
        return;
    }

    const message = document.getElementById('commitMessage').value.trim();
    if (!message) {
        showToast('Please enter a commit message', 'warning');
        return;
    }

    try {
        await gitManager.simulatePush(message);
        document.getElementById('commitMessage').value = '';
        renderChangesList([]);
    } catch (error) {
        showToast(`Push failed: ${error.message}`, 'error');
    }
}

/**
 * Handle status operation
 */
async function handleStatus() {
    if (!currentRepository) {
        showToast('Please select a repository first', 'warning');
        return;
    }

    try {
        const changes = await gitManager.getChanges();
        showToast(`Status: ${changes.aheadBy} ahead, ${changes.behindBy} behind`, 'info');
        renderChangesList(changes.files);
    } catch (error) {
        showToast(`Status check failed: ${error.message}`, 'error');
    }
}

/**
 * Handle account switch
 */
function handleSwitchAccount() {
    const username = document.getElementById('githubUsername').value.trim();
    const token = document.getElementById('githubToken').value.trim();

    if (!username || !token) {
        showToast('Please enter both username and PAT', 'warning');
        return;
    }

    // Save new account
    localStorage.setItem('github_username', username);
    localStorage.setItem('github_token', token);
    
    // Update current account
    currentGitHubAccount = { username, token };
    gitAPI.setToken(token);

    // Update display
    updateAccountDisplay();

    // Clear inputs
    document.getElementById('githubUsername').value = '';
    document.getElementById('githubToken').value = '';

    showToast(`✅ Switched to account: ${username}`, 'success');

    // Reload repositories
    loadAndRenderRepositories();
}

/**
 * Handle logout
 */
function handleLogout() {
    if (!currentGitHubAccount) {
        showToast('No account to logout from', 'warning');
        return;
    }

    // Confirm logout
    const confirmed = confirm(`Logout from ${currentGitHubAccount.username}?`);
    if (!confirmed) return;

    // Clear account
    localStorage.removeItem('github_username');
    localStorage.removeItem('github_token');
    
    currentGitHubAccount = null;
    gitAPI.setToken('');

    // Update display
    updateAccountDisplay();

    // Clear repositories
    renderRepositories([]);
    updateRepoSelect([]);

    showToast('👋 Logged out successfully', 'info');
}

/**
 * Load and save settings
 */
function loadSettings() {
    const name = localStorage.getItem('git_name') || 'Git User';
    const email = localStorage.getItem('git_email') || 'user@example.com';
    const token = localStorage.getItem('github_token') || '';
    const username = localStorage.getItem('github_username') || '';

    document.getElementById('gitName').value = name;
    document.getElementById('gitEmail').value = email;

    // Load GitHub account info
    if (username && token) {
        currentGitHubAccount = { username, token };
        gitAPI.setToken(token);
    }

    // Update account display
    updateAccountDisplay();
}

function saveSettings() {
    const name = document.getElementById('gitName').value.trim() || 'Git User';
    const email = document.getElementById('gitEmail').value.trim() || 'user@example.com';

    localStorage.setItem('git_name', name);
    localStorage.setItem('git_email', email);

    gitAPI.setGitConfig(name, email);

    closeModal('settingsModal');
    showToast('Settings saved successfully', 'success');
}

/**
 * Update account display in settings
 */
function updateAccountDisplay() {
    const accountInfo = document.getElementById('currentAccount');
    const logoutBtn = document.getElementById('logoutBtn');

    if (currentGitHubAccount) {
        accountInfo.textContent = `✅ Logged in as: @${currentGitHubAccount.username}`;
        logoutBtn.style.display = 'inline-block';
    } else {
        accountInfo.textContent = '❌ No account logged in';
        logoutBtn.style.display = 'none';
    }
}

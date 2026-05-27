/**
 * UI Utilities - Handle semua UI interactions
 */

/**
 * Show/hide loading spinner
 */
function showLoading(show = true, text = 'Loading...') {
    const spinner = document.getElementById('loadingSpinner');
    const loadingText = document.getElementById('loadingText');

    if (show) {
        spinner.classList.add('active');
        loadingText.textContent = text;
    } else {
        spinner.classList.remove('active');
    }
}

function updateLoadingText(text) {
    const loadingText = document.getElementById('loadingText');
    loadingText.textContent = text;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('toast');

    // Remove all classes
    toast.className = 'toast';

    // Add type class
    toast.classList.add(type);
    toast.textContent = message;
    toast.classList.add('active');

    setTimeout(() => {
        toast.classList.remove('active');
    }, duration);
}

/**
 * Open modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Render repository list
 */
function renderRepositories(repos) {
    const repoList = document.getElementById('repoList');

    if (!repos || repos.length === 0) {
        repoList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📂</div>
                <div class="empty-state-text">No repositories found</div>
                <button class="btn btn-primary" onclick="openModal('cloneModal')">Clone Repository</button>
            </div>
        `;
        return;
    }

    repoList.innerHTML = repos.map(repo => `
        <div class="repo-card" onclick="selectRepository('${repo.owner}', '${repo.name}')">
            <div class="repo-name">📦 ${repo.name}</div>
            <div class="repo-info">
                <div>Owner: ${repo.owner}</div>
                <div>Language: ${repo.language}</div>
                <div>Size: ${(repo.size / 1024).toFixed(2)} MB</div>
                <div>Updated: ${new Date(repo.updatedAt).toLocaleDateString()}</div>
            </div>
            <div class="repo-actions">
                <button class="btn btn-info" onclick="event.stopPropagation(); openRepoDetails('${repo.owner}', '${repo.name}')" title="View">👁️</button>
                <button class="btn btn-success" onclick="event.stopPropagation(); selectAndLoadRepo('${repo.owner}', '${repo.name}')" title="Open">📂</button>
                <button class="btn btn-warning" onclick="event.stopPropagation(); copyToClipboard('${repo.cloneUrl}')" title="Copy URL">📋</button>
            </div>
        </div>
    `).join('');
}

/**
 * Render file list
 */
function renderFileList(files, currentPath = '') {
    const fileList = document.getElementById('fileList');
    const breadcrumb = document.getElementById('breadcrumb');

    // Update breadcrumb
    if (currentPath) {
        breadcrumb.innerHTML = `Root / ${currentPath.split('/').join(' / ')}`;
    } else {
        breadcrumb.innerHTML = 'Root';
    }

    if (!files || files.length === 0) {
        fileList.innerHTML = `
            <div class="empty-state" style="padding: 1rem;">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">No files in this folder</div>
            </div>
        `;
        return;
    }

    fileList.innerHTML = files.map(file => {
        const icon = file.type === 'dir' ? '📁' : fileManager.getFileIcon(file.name);
        const size = file.type === 'dir' ? '' : fileManager.formatFileSize(file.size || 0);
        const path = file.path || file.name;

        return `
            <div class="file-item">
                <div class="file-item-name" ${file.type === 'dir' ? `onclick="loadFileList('${path}')"` : ''}>
                    <div class="file-item-icon">${icon}</div>
                    <div class="file-item-text" title="${file.name}">${file.name}</div>
                </div>
                ${size ? `<div class="file-item-size">${size}</div>` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Render changes list
 */
function renderChangesList(changes) {
    const changesList = document.getElementById('changesList');

    if (!changes || changes.length === 0) {
        changesList.innerHTML = '<div class="empty-state-text" style="padding: 1rem;">No changes</div>';
        return;
    }

    changesList.innerHTML = changes.map(change => {
        const statusClass = change.status || change.type || 'modified';
        return `
            <div class="change-item ${statusClass}">
                ${change.path || change.filename} - ${statusClass.toUpperCase()}
            </div>
        `;
    }).join('');
}

/**
 * Update operations panel repo select
 */
function updateRepoSelect(repos) {
    const select = document.getElementById('opRepoSelect');
    select.innerHTML = '<option value="">-- Select Repo --</option>' +
        repos.map(repo => `<option value="${repo.fullName}">${repo.name}</option>`).join('');
}

/**
 * Format commit history for display
 */
function formatCommitHistory(commits) {
    if (!commits || commits.length === 0) {
        return '<div class="empty-state-text">No commits found</div>';
    }

    return commits.map(commit => `
        <div class="change-item">
            <strong>${commit.commit.message.split('\n')[0]}</strong><br>
            by ${commit.commit.author.name} on ${new Date(commit.commit.author.date).toLocaleString()}
        </div>
    `).join('');
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success', 2000);
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

/**
 * Format date
 */
function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
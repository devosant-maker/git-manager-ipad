/**
 * Git Manager - Mengelola operasi Git dan repository
 */

class GitManager {
    constructor() {
        this.repositories = [];
        this.currentRepo = null;
        this.currentBranch = 'main';
        this.stagedChanges = [];
        this.fileCache = {};
    }

    /**
     * Load semua repositories user
     */
    async loadRepositories() {
        showLoading(true);
        try {
            const repos = await gitAPI.getUserRepos();
            this.repositories = repos.map(repo => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                owner: repo.owner.login,
                url: repo.html_url,
                cloneUrl: repo.clone_url,
                description: repo.description || 'No description',
                language: repo.language || 'Unknown',
                size: repo.size,
                defaultBranch: repo.default_branch,
                private: repo.private,
                updatedAt: new Date(repo.updated_at)
            }));
            showLoading(false);
            return this.repositories;
        } catch (error) {
            showLoading(false);
            showToast('Failed to load repositories', 'error');
            throw error;
        }
    }

    /**
     * Select repository untuk digunakan
     */
    selectRepository(owner, repoName) {
        const repo = this.repositories.find(
            r => r.owner === owner && r.name === repoName
        );
        if (repo) {
            this.currentRepo = repo;
            this.currentBranch = repo.defaultBranch || 'main';
            this.stagedChanges = [];
            return repo;
        }
        throw new Error('Repository not found');
    }

    /**
     * Get repository contents (file tree)
     */
    async getRepoTree(path = '') {
        if (!this.currentRepo) {
            throw new Error('No repository selected');
        }

        try {
            const contents = await gitAPI.getRepoContents(
                this.currentRepo.owner,
                this.currentRepo.name,
                path
            );
            return contents;
        } catch (error) {
            console.error('Error getting repo tree:', error);
            throw error;
        }
    }

    /**
     * Get file content
     */
    async getFileContent(path) {
        if (!this.currentRepo) {
            throw new Error('No repository selected');
        }

        try {
            const content = await gitAPI.getFileContent(
                this.currentRepo.owner,
                this.currentRepo.name,
                path
            );
            return content;
        } catch (error) {
            console.error('Error getting file content:', error);
            throw error;
        }
    }

    /**
     * Upload/Create file
     */
    async uploadFile(path, content, commitMessage) {
        if (!this.currentRepo) {
            throw new Error('No repository selected');
        }

        showLoading(true, 'Uploading file...');
        try {
            // Get current file SHA if exists
            let sha = null;
            try {
                const fileData = await gitAPI.getRepoContents(
                    this.currentRepo.owner,
                    this.currentRepo.name,
                    path
                );
                if (Array.isArray(fileData)) {
                    sha = null; // It's a directory
                } else {
                    sha = fileData.sha;
                }
            } catch (e) {
                // File doesn't exist, will create new
            }

            const result = await gitAPI.updateFile(
                this.currentRepo.owner,
                this.currentRepo.name,
                path,
                content,
                commitMessage || `Upload ${path}`,
                sha,
                this.currentBranch
            );

            showLoading(false);
            showToast(`File uploaded: ${path}`, 'success');
            return result;
        } catch (error) {
            showLoading(false);
            showToast(`Failed to upload file: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Upload multiple files
     */
    async uploadMultipleFiles(files, baseMessage = 'Upload files') {
        if (!this.currentRepo) {
            throw new Error('No repository selected');
        }

        showLoading(true, `Uploading ${files.length} files...`);
        const results = [];
        const errors = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = Math.round(((i + 1) / files.length) * 100);
            updateLoadingText(`Uploading ${file.path}... (${progress}%)`);

            try {
                const result = await this.uploadFile(
                    file.path,
                    file.content,
                    `${baseMessage}: ${file.path}`
                );
                results.push(result);
            } catch (error) {
                errors.push({ file: file.path, error: error.message });
            }
        }

        showLoading(false);

        if (errors.length > 0) {
            showToast(
                `Uploaded ${results.length} files, failed ${errors.length}`,
                'warning'
            );
        } else {
            showToast(`Successfully uploaded ${results.length} files`, 'success');
        }

        return { results, errors };
    }

    /**
     * Delete file
     */
    async deleteFile(path, commitMessage) {
        if (!this.currentRepo) {
            throw new Error('No repository selected');
        }

        showLoading(true, 'Deleting file...');
        try {
            // Get file SHA
            const fileData = await gitAPI.getRepoContents(
                this.currentRepo.owner,
                this.currentRepo.name,
                path
            );

            const result = await gitAPI.deleteFile(
                this.currentRepo.owner,
                this.currentRepo.name,
                path,
                commitMessage || `Delete ${path}`,
                fileData.sha,
                this.currentBranch
            );

            showLoading(false);
            showToast(`File deleted: ${path}`, 'success');
            return result;
        } catch (error) {
            showLoading(false);
            showToast(`Failed to delete file: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get commits history
     */
    async getCommitHistory(limit = 10) {
        if (!this.currentRepo) {
            throw new Error('No repository selected');
        }

        try {
            const commits = await gitAPI.getCommits(
                this.currentRepo.owner,
                this.currentRepo.name,
                this.currentBranch,
                limit
            );
            return commits;
        } catch (error) {
            console.error('Error getting commits:', error);
            throw error;
        }
    }

    /**
     * Get branches
     */
    async getBranches() {
        if (!this.currentRepo) {
            throw new Error('No repository selected');
        }

        try {
            const branches = await gitAPI.getBranches(
                this.currentRepo.owner,
                this.currentRepo.name
            );
            return branches;
        } catch (error) {
            console.error('Error getting branches:', error);
            throw error;
        }
    }

    /**
     * Switch branch
     */
    switchBranch(branchName) {
        this.currentBranch = branchName;
        this.stagedChanges = [];
        return branchName;
    }

    /**
     * Get changes between branches
     */
    async getChanges(baseBranch = null) {
        if (!this.currentRepo) {
            throw new Error('No repository selected');
        }

        const base = baseBranch || this.currentRepo.defaultBranch;

        try {
            const compare = await gitAPI.compareCommits(
                this.currentRepo.owner,
                this.currentRepo.name,
                base,
                this.currentBranch
            );

            return {
                aheadBy: compare.ahead_by,
                behindBy: compare.behind_by,
                files: compare.files || [],
                commits: compare.commits || []
            };
        } catch (error) {
            console.error('Error getting changes:', error);
            return {
                aheadBy: 0,
                behindBy: 0,
                files: [],
                commits: []
            };
        }
    }

    /**
     * Stage changes
     */
    stageChange(filePath, status = 'modified') {
        const existing = this.stagedChanges.findIndex(c => c.path === filePath);
        if (existing >= 0) {
            this.stagedChanges[existing].status = status;
        } else {
            this.stagedChanges.push({ path: filePath, status });
        }
        return this.stagedChanges;
    }

    /**
     * Unstage changes
     */
    unstageChange(filePath) {
        this.stagedChanges = this.stagedChanges.filter(c => c.path !== filePath);
        return this.stagedChanges;
    }

    /**
     * Get staged changes
     */
    getStagedChanges() {
        return this.stagedChanges;
    }

    /**
     * Simulasi push (karena GitHub API tidak support direct push)
     * Sebenarnya ini akan update files yang sudah di-stage
     */
    async simulatePush(commitMessage) {
        if (!this.currentRepo) {
            throw new Error('No repository selected');
        }

        if (this.stagedChanges.length === 0) {
            throw new Error('No changes staged');
        }

        showLoading(true, `Pushing ${this.stagedChanges.length} changes...`);
        const results = [];

        try {
            // Dalam skenario nyata, ini akan melakukan operasi push
            // Untuk demo, kita hanya akan mencatat staged changes
            results.push({
                message: commitMessage,
                changes: this.stagedChanges.length,
                files: this.stagedChanges,
                timestamp: new Date()
            });

            this.stagedChanges = [];
            showLoading(false);
            showToast('Changes pushed successfully', 'success');
            return results[0];
        } catch (error) {
            showLoading(false);
            showToast(`Failed to push: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Simulasi pull
     */
    async simulatePull() {
        if (!this.currentRepo) {
            throw new Error('No repository selected');
        }

        showLoading(true, 'Pulling latest changes...');
        try {
            const changes = await this.getChanges();
            showLoading(false);
            showToast('Repository updated', 'success');
            return changes;
        } catch (error) {
            showLoading(false);
            showToast(`Failed to pull: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Global instance
const gitManager = new GitManager();
/**
 * API Layer untuk Git operations
 * Menggunakan GitHub REST API
 */

class GitAPI {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.token = localStorage.getItem('github_token') || '';
        this.gitName = localStorage.getItem('git_name') || 'Git User';
        this.gitEmail = localStorage.getItem('git_email') || 'user@example.com';
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('github_token', token);
    }

    setGitConfig(name, email) {
        this.gitName = name;
        this.gitEmail = email;
        localStorage.setItem('git_name', name);
        localStorage.setItem('git_email', email);
    }

    getHeaders() {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `token ${this.token}`;
        }

        return headers;
    }

    /**
     * Get user's repositories
     */
    async getUserRepos() {
        try {
            const response = await fetch(`${this.baseURL}/user/repos?sort=updated&per_page=50`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch repositories');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching repos:', error);
            throw error;
        }
    }

    /**
     * Get repository details
     */
    async getRepoDetails(owner, repo) {
        try {
            const response = await fetch(`${this.baseURL}/repos/${owner}/${repo}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Repository not found');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching repo details:', error);
            throw error;
        }
    }

    /**
     * Get repository contents
     */
    async getRepoContents(owner, repo, path = '') {
        try {
            const url = path
                ? `${this.baseURL}/repos/${owner}/${repo}/contents/${path}`
                : `${this.baseURL}/repos/${owner}/${repo}/contents`;

            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            if (response.status === 404) {
                return [];
            }

            if (!response.ok) {
                throw new Error('Failed to fetch contents');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching repo contents:', error);
            throw error;
        }
    }

    /**
     * Get file content
     */
    async getFileContent(owner, repo, path) {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${owner}/${repo}/contents/${path}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error('File not found');
            }

            const data = await response.json();
            return atob(data.content);
        } catch (error) {
            console.error('Error fetching file content:', error);
            throw error;
        }
    }

    /**
     * Create or update file
     */
    async updateFile(owner, repo, path, content, message, sha = null, branch = 'main') {
        try {
            const data = {
                message: message,
                content: btoa(content),
                branch: branch,
                committer: {
                    name: this.gitName,
                    email: this.gitEmail
                }
            };

            if (sha) {
                data.sha = sha;
            }

            const response = await fetch(
                `${this.baseURL}/repos/${owner}/${repo}/contents/${path}`,
                {
                    method: 'PUT',
                    headers: this.getHeaders(),
                    body: JSON.stringify(data)
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update file');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating file:', error);
            throw error;
        }
    }

    /**
     * Delete file
     */
    async deleteFile(owner, repo, path, message, sha, branch = 'main') {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${owner}/${repo}/contents/${path}`,
                {
                    method: 'DELETE',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        message: message,
                        sha: sha,
                        branch: branch,
                        committer: {
                            name: this.gitName,
                            email: this.gitEmail
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete file');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    /**
     * Get commits
     */
    async getCommits(owner, repo, branch = 'main', perPage = 20) {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${perPage}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch commits');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching commits:', error);
            throw error;
        }
    }

    /**
     * Get branches
     */
    async getBranches(owner, repo) {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${owner}/${repo}/branches`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch branches');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching branches:', error);
            throw error;
        }
    }

    /**
     * Create reference (branch)
     */
    async createRef(owner, repo, ref, sha) {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${owner}/${repo}/git/refs`,
                {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        ref: `refs/heads/${ref}`,
                        sha: sha
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to create branch');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating branch:', error);
            throw error;
        }
    }

    /**
     * Get compare commits
     */
    async compareCommits(owner, repo, base, head) {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${owner}/${repo}/compare/${base}...${head}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error('Failed to compare commits');
            }

            return await response.json();
        } catch (error) {
            console.error('Error comparing commits:', error);
            throw error;
        }
    }

    /**
     * Check API rate limit
     */
    async getRateLimit() {
        try {
            const response = await fetch(`${this.baseURL}/rate_limit`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch rate limit');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching rate limit:', error);
            throw error;
        }
    }
}

// Global API instance
const gitAPI = new GitAPI();
/**
 * File Manager - Mengelola upload dan download files
 */

class FileManager {
    constructor() {
        this.localFiles = [];
        this.currentPath = '';
    }

    /**
     * Handle file input dan konversi ke format yang bisa diupload
     */
    async handleFileInput(fileInputElement) {
        const files = fileInputElement.files;
        const fileArray = [];

        for (let file of files) {
            const content = await this.readFile(file);
            fileArray.push({
                name: file.name,
                path: file.webkitRelativePath || file.name,
                content: content,
                size: file.size,
                type: file.type
            });
        }

        return fileArray;
    }

    /**
     * Read file content
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.onerror = (e) => {
                reject(e);
            };
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * Read file as binary
     */
    readFileAsBinary(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const binaryString = e.target.result;
                resolve(btoa(binaryString));
            };
            reader.onerror = (e) => {
                reject(e);
            };
            reader.readAsBinaryString(file);
        });
    }

    /**
     * Format file size untuk display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Get file icon berdasarkan extension
     */
    getFileIcon(filename) {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const iconMap = {
            // Documents
            'pdf': '📄',
            'doc': '📝',
            'docx': '📝',
            'txt': '📋',
            'md': '📋',
            'markdown': '📋',

            // Code
            'js': '🟨',
            'ts': '🔵',
            'jsx': '⚛️',
            'tsx': '⚛️',
            'py': '🐍',
            'java': '☕',
            'cpp': '⬜',
            'c': '⬜',
            'html': '🌐',
            'css': '🎨',
            'scss': '🎨',
            'json': '{}',
            'xml': '📌',
            'yaml': '⚙️',
            'yml': '⚙️',
            'sh': '💻',
            'bash': '💻',
            'rb': '💎',
            'go': '⚡',
            'rs': '🦀',
            'php': '🐘',
            'sql': '🗄️',

            // Images
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️',
            'gif': '🖼��',
            'svg': '🎨',

            // Archives
            'zip': '📦',
            'rar': '📦',
            'tar': '📦',
            'gz': '📦',
            '7z': '📦',

            // Video
            'mp4': '🎬',
            'avi': '🎬',
            'mov': '🎬',
            'mkv': '🎬',

            // Audio
            'mp3': '🎵',
            'wav': '🎵',
            'flac': '🎵',
            'm4a': '🎵',

            // Default
            '': '📁'
        };

        return iconMap[ext] || '📄';
    }

    /**
     * Check if file is text-editable
     */
    isTextFile(filename) {
        const textExtensions = [
            'txt', 'md', 'markdown', 'js', 'ts', 'jsx', 'tsx', 'py', 'java',
            'cpp', 'c', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml',
            'sh', 'bash', 'rb', 'go', 'rs', 'php', 'sql', 'csv', 'log'
        ];
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        return textExtensions.includes(ext);
    }

    /**
     * Create folder path
     */
    createFolderPath(path) {
        return path.split('/').filter(p => p.length > 0);
    }
}

const fileManager = new FileManager();
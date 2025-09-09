const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class GitHubSessionStorage {
    constructor() {
        this.githubToken = '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';
        this.repoUrl = 'https://github.com/idc-what-u-think/Firekid-MD-.git';
        this.repoName = 'Firekid-MD-';
        this.repoPath = path.join(__dirname, this.repoName);
        this.sessionsPath = path.join(this.repoPath, 'sessions');
        this.indexPath = path.join(this.sessionsPath, 'index.json');
        
        this.initializeRepo();
    }

    initializeRepo() {
        try {
            console.log('🔧 Initializing GitHub repository...');
            
            // Remove existing repo if it exists
            if (fs.existsSync(this.repoPath)) {
                console.log('🗑️ Removing existing repository...');
                fs.rmSync(this.repoPath, { recursive: true, force: true });
            }

            // Clone the repository
            console.log('📥 Cloning repository...');
            const cloneUrl = this.repoUrl.replace('https://', `https://${this.githubToken}@`);
            execSync(`git clone ${cloneUrl}`, { cwd: __dirname, stdio: 'pipe' });

            // Create sessions directory
            if (!fs.existsSync(this.sessionsPath)) {
                fs.mkdirSync(this.sessionsPath, { recursive: true });
                console.log('📁 Created sessions directory');
            }

            // Initialize index.json if it doesn't exist
            if (!fs.existsSync(this.indexPath)) {
                const initialIndex = {
                    version: "1.0.0",
                    created: new Date().toISOString(),
                    sessions: {},
                    stats: {
                        totalSessions: 0,
                        lastUpdated: new Date().toISOString()
                    }
                };
                fs.writeFileSync(this.indexPath, JSON.stringify(initialIndex, null, 2));
                console.log('📝 Created initial index.json');
            }

            // Configure git
            try {
                execSync('git config user.name "Firekid Bot"', { cwd: this.repoPath, stdio: 'pipe' });
                execSync('git config user.email "bot@firekid.com"', { cwd: this.repoPath, stdio: 'pipe' });
                console.log('⚙️ Configured git settings');
            } catch (e) {
                console.log('⚠️ Git config warning:', e.message);
            }

            console.log('✅ Repository initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize repository:', error.message);
            throw error;
        }
    }

    async saveSession(sessionId, phoneNumber, authDir, userId) {
        try {
            console.log(`💾 Saving session ${sessionId} to GitHub...`);

            // Create session directory
            const sessionDir = path.join(this.sessionsPath, sessionId);
            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
            }

            // Copy all auth files from authDir to session directory
            const authFiles = fs.readdirSync(authDir);
            const copiedFiles = [];

            for (const file of authFiles) {
                const srcPath = path.join(authDir, file);
                const destPath = path.join(sessionDir, file);
                
                if (fs.statSync(srcPath).isFile()) {
                    fs.copyFileSync(srcPath, destPath);
                    copiedFiles.push(file);
                    console.log(`📄 Copied: ${file}`);
                }
            }

            // Create session metadata
            const sessionData = {
                sessionId: sessionId,
                phoneNumber: phoneNumber,
                userId: userId,
                created: new Date().toISOString(),
                files: copiedFiles,
                status: 'active',
                lastAccessed: new Date().toISOString()
            };

            // Save session metadata
            const metadataPath = path.join(sessionDir, 'metadata.json');
            fs.writeFileSync(metadataPath, JSON.stringify(sessionData, null, 2));

            // Update main index
            const index = JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
            index.sessions[sessionId] = {
                sessionId: sessionId,
                phoneNumber: phoneNumber.replace(/(\d{3})\d*(\d{4})/, '$1****$2'), // Mask phone number
                userId: userId,
                created: sessionData.created,
                status: 'active',
                fileCount: copiedFiles.length
            };
            
            index.stats.totalSessions = Object.keys(index.sessions).length;
            index.stats.lastUpdated = new Date().toISOString();
            
            fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2));

            // Commit and push to GitHub
            await this.pushToGitHub(`Add session ${sessionId}`);

            console.log(`✅ Session ${sessionId} saved successfully!`);
            return {
                success: true,
                sessionId: sessionId,
                filesStored: copiedFiles.length,
                repoUrl: this.repoUrl
            };

        } catch (error) {
            console.error(`❌ Failed to save session ${sessionId}:`, error.message);
            throw error;
        }
    }

    async pushToGitHub(commitMessage) {
        try {
            console.log('🚀 Pushing to GitHub...');

            // Add all changes
            execSync('git add .', { cwd: this.repoPath, stdio: 'pipe' });

            // Check if there are changes to commit
            try {
                execSync('git diff --staged --quiet', { cwd: this.repoPath, stdio: 'pipe' });
                console.log('📝 No changes to commit');
                return;
            } catch (e) {
                // There are changes to commit
            }

            // Commit changes
            execSync(`git commit -m "${commitMessage}"`, { cwd: this.repoPath, stdio: 'pipe' });

            // Push to GitHub
            execSync('git push origin main', { cwd: this.repoPath, stdio: 'pipe' });

            console.log('✅ Successfully pushed to GitHub!');

        } catch (error) {
            console.error('❌ Failed to push to GitHub:', error.message);
            
            // Try to push to master branch if main fails
            try {
                console.log('🔄 Trying master branch...');
                execSync('git push origin master', { cwd: this.repoPath, stdio: 'pipe' });
                console.log('✅ Successfully pushed to master branch!');
            } catch (masterError) {
                console.error('❌ Failed to push to master branch:', masterError.message);
                throw error;
            }
        }
    }

    async loadSession(sessionId) {
        try {
            console.log(`📥 Loading session ${sessionId} from GitHub...`);

            // Pull latest changes
            execSync('git pull origin main', { cwd: this.repoPath, stdio: 'pipe' });

            const sessionDir = path.join(this.sessionsPath, sessionId);
            const metadataPath = path.join(sessionDir, 'metadata.json');

            if (!fs.existsSync(metadataPath)) {
                throw new Error(`Session ${sessionId} not found`);
            }

            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            
            // Update last accessed
            metadata.lastAccessed = new Date().toISOString();
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

            return {
                success: true,
                sessionData: metadata,
                sessionPath: sessionDir
            };

        } catch (error) {
            console.error(`❌ Failed to load session ${sessionId}:`, error.message);
            throw error;
        }
    }

    async deleteSession(sessionId) {
        try {
            console.log(`🗑️ Deleting session ${sessionId}...`);

            // Pull latest changes
            execSync('git pull origin main', { cwd: this.repoPath, stdio: 'pipe' });

            const sessionDir = path.join(this.sessionsPath, sessionId);

            if (fs.existsSync(sessionDir)) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
            }

            // Update main index
            const index = JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
            delete index.sessions[sessionId];
            index.stats.totalSessions = Object.keys(index.sessions).length;
            index.stats.lastUpdated = new Date().toISOString();
            
            fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2));

            // Commit and push
            await this.pushToGitHub(`Delete session ${sessionId}`);

            console.log(`✅ Session ${sessionId} deleted successfully!`);
            return { success: true };

        } catch (error) {
            console.error(`❌ Failed to delete session ${sessionId}:`, error.message);
            throw error;
        }
    }

    async listSessions(userId = null) {
        try {
            console.log('📋 Listing sessions...');

            // Pull latest changes
            execSync('git pull origin main', { cwd: this.repoPath, stdio: 'pipe' });

            const index = JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
            
            let sessions = Object.values(index.sessions);
            
            if (userId) {
                sessions = sessions.filter(session => session.userId === userId);
            }

            return {
                success: true,
                sessions: sessions,
                total: sessions.length,
                stats: index.stats
            };

        } catch (error) {
            console.error('❌ Failed to list sessions:', error.message);
            throw error;
        }
    }

    async getStats() {
        try {
            // Pull latest changes
            execSync('git pull origin main', { cwd: this.repoPath, stdio: 'pipe' });

            const index = JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
            
            return {
                success: true,
                stats: index.stats,
                repoInfo: {
                    url: this.repoUrl,
                    path: this.repoPath,
                    sessionsPath: this.sessionsPath
                }
            };

        } catch (error) {
            console.error('❌ Failed to get stats:', error.message);
            throw error;
        }
    }

    // Cleanup method
    cleanup() {
        try {
            if (fs.existsSync(this.repoPath)) {
                // Don't delete the repo, just clean up temporary files
                console.log('🧹 Cleaning up temporary files...');
            }
        } catch (error) {
            console.error('❌ Cleanup error:', error.message);
        }
    }
}

// Create global instance
const gitHubStorage = new GitHubSessionStorage();

// Export functions for easy integration
module.exports = {
    GitHubSessionStorage,
    gitHubStorage,
    
    // Easy-to-use functions
    saveSession: async (sessionId, phoneNumber, authDir, userId) => {
        return await gitHubStorage.saveSession(sessionId, phoneNumber, authDir, userId);
    },
    
    loadSession: async (sessionId) => {
        return await gitHubStorage.loadSession(sessionId);
    },
    
    deleteSession: async (sessionId) => {
        return await gitHubStorage.deleteSession(sessionId);
    },
    
    listUserSessions: async (userId) => {
        return await gitHubStorage.listSessions(userId);
    },
    
    getAllSessions: async () => {
        return await gitHubStorage.listSessions();
    },
    
    getStorageStats: async () => {
        return await gitHubStorage.getStats();
    },
    
    cleanup: () => {
        gitHubStorage.cleanup();
    }
};

// Example usage:
/*
const { saveSession, loadSession, listUserSessions } = require('./github-session-storage');

// Save a session
await saveSession('ABC123', '1234567890', '/path/to/auth/dir', 'user123');

// Load a session
const sessionData = await loadSession('ABC123');

// List user sessions
const userSessions = await listUserSessions('user123');

// Get stats
const stats = await getStorageStats();
*/

console.log('📚 GitHub Session Storage initialized');
console.log('🔗 Repository:', 'https://github.com/idc-what-u-think/Firekid-MD-.git');
console.log('✅ Ready to store session data!');

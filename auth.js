// Authentication helper functions for CyberFlap game
const Auth = {
    // Check if user is logged in
    isLoggedIn() {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        return !!userData && !!token;
    },
    
    // Get current user data
    getCurrentUser() {
        if (!this.isLoggedIn()) return null;
        return JSON.parse(localStorage.getItem('user'));
    },
    
    // Get auth token
    getToken() {
        return localStorage.getItem('token');
    },
    
    // Log user in and store data
    login(userData, token) {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        
        // Dispatch login event
        document.dispatchEvent(new CustomEvent('userLogin', { detail: userData }));
        return userData;
    },
    
    // Log user out
    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Dispatch logout event
        document.dispatchEvent(new CustomEvent('userLogout'));
    },
    
    // Register new user
    async register(username, email, password) {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return { success: true, message: data.message };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Login user
    async loginUser(email, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Store user data and token
            this.login(data.user, data.token);
            
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Save game progress
    async saveProgress(gameData) {
        if (!this.isLoggedIn()) return { success: false, error: "Not logged in" };
        
        try {
            const userData = this.getCurrentUser();
            
            const payload = {
                userId: userData.id,
                score: gameData.score || 0,
                chainsawCount: gameData.chainsawCount || 0
            };
            
            const response = await fetch('/api/save-progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return { success: true, message: data.message };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Load game progress
    async loadProgress() {
        if (!this.isLoggedIn()) return { success: false, error: "Not logged in" };
        
        try {
            const userData = this.getCurrentUser();
            
            const response = await fetch(`/api/get-progress?userId=${userData.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return { 
                success: true, 
                progress: {
                    score: data.score || 0,
                    chainsawCount: data.chainsawCount || 0,
                    lastUpdated: data.lastUpdated
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// Export Auth object
window.Auth = Auth; 
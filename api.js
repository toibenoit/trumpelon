// API endpoints for CyberFlap game
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = 'https://vqiadazknjvipcbmlcoo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxaWFkYXprbmp2aXBjYm1sY29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MjA2MDQsImV4cCI6MjA1NzQ5NjYwNH0.DH2QZv7TQbAzweMMoxgHHmLEobW_EytdgslK_EfnXi0';
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT secret for token generation
const JWT_SECRET = 'your-secret-key'; // In production, use environment variables

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied' });
    
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if user already exists
        const { data: existingUsers, error: queryError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);
        
        if (queryError) {
            throw queryError;
        }
        
        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                { 
                    username, 
                    email, 
                    password: hashedPassword,
                    created_at: new Date()
                }
            ])
            .select();
        
        if (insertError) {
            throw insertError;
        }
        
        // Create initial progress record
        await supabase
            .from('game_progress')
            .insert([
                {
                    user_id: newUser[0].id,
                    score: 0,
                    chainsaw_count: 0,
                    last_updated: new Date()
                }
            ]);
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Find user
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);
        
        if (error) {
            throw error;
        }
        
        if (!users || users.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        
        const user = users[0];
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        
        // Create token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Return user info and token
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Save game progress endpoint
router.post('/save-progress', authenticateToken, async (req, res) => {
    try {
        const { userId, score, chainsawCount } = req.body;
        
        // Validate input
        if (!userId || score === undefined || chainsawCount === undefined) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if progress record exists
        const { data: existingProgress, error: queryError } = await supabase
            .from('game_progress')
            .select('*')
            .eq('user_id', userId);
        
        if (queryError) {
            throw queryError;
        }
        
        if (existingProgress && existingProgress.length > 0) {
            // Update existing progress
            const { error: updateError } = await supabase
                .from('game_progress')
                .update({
                    score,
                    chainsaw_count: chainsawCount,
                    last_updated: new Date()
                })
                .eq('user_id', userId);
            
            if (updateError) {
                throw updateError;
            }
        } else {
            // Create new progress record
            const { error: insertError } = await supabase
                .from('game_progress')
                .insert([
                    {
                        user_id: userId,
                        score,
                        chainsaw_count: chainsawCount,
                        last_updated: new Date()
                    }
                ]);
            
            if (insertError) {
                throw insertError;
            }
        }
        
        res.json({ message: 'Progress saved successfully' });
    } catch (error) {
        console.error('Save progress error:', error);
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// Get game progress endpoint
router.get('/get-progress', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const { data: progress, error } = await supabase
            .from('game_progress')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error) {
            throw error;
        }
        
        if (!progress) {
            return res.status(404).json({ error: 'Progress not found' });
        }
        
        res.json({
            score: progress.score,
            chainsawCount: progress.chainsaw_count,
            lastUpdated: progress.last_updated
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Failed to get progress' });
    }
});

module.exports = router; 
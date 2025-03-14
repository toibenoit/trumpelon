// Server for CyberFlap game
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRoutes = require('./api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory

// API routes
app.use('/api', apiRoutes);

// Serve the game
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Serve the login page
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
// Game constants
const SCREEN_WIDTH = 800; // Updated to match new canvas size
const SCREEN_HEIGHT = 600;
const GRAVITY = 0.35;
const FLAP_STRENGTH = -8;
const PIPE_SPEED = 3;
const PIPE_GAP = 180;
const PIPE_FREQUENCY = 1500;
const NATIONAL_DEBT = 34000000000000; // $34 trillion starting debt
const DEBT_REDUCTION = 10000000000; // $10 billion per obstacle
const DEBUG_MODE = false; // Disable debug mode
const CHAINSAW_FREQUENCY = 800; // Increased frequency of chainsaw spawns in ms
const MIN_TOWERS_BEFORE_CHAINSAW = 3; // Minimum number of towers before a chainsaw appears
const MAX_TOWERS_BEFORE_CHAINSAW = 5; // Maximum number of towers before a chainsaw appears

// Game states
const GAME_STATE = {
    START: 0,
    PLAYING: 1,
    GAME_OVER: 2
};

// Transformation thresholds
const FIRST_TRANSFORMATION = 30;  // Cybertruck to Falcon 9
const SECOND_TRANSFORMATION = 60; // Falcon 9 to Air Force One

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load sound effects
const thrusterSound = new Audio('https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3');
thrusterSound.volume = 0.3; // Set volume to 30%
const transformSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1184/1184-preview.mp3');
transformSound.volume = 0.4; // Set volume to 40%

// Add Elon Musk "woke mind virus" sound - using local file
const elonSound = new Audio('sounds/woke-mind-virus.mp3');
elonSound.volume = 1.0; // Set volume to 100%

// Preload the sound
elonSound.load();

// Add error handling for the local audio file
elonSound.addEventListener('error', function(e) {
    console.log("Error loading local audio file:", e);
    console.log("Using speech synthesis fallback...");
    
    // Create a speech synthesis fallback if audio fails
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("woke mind virus");
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        
        // Store the utterance for later use
        window.elonUtterance = utterance;
    }
});

// Load custom fonts
const trumpFont = new FontFace('TrumpTower', 'url(https://fonts.cdnfonts.com/css/helvetica-neue-9)');
trumpFont.load().then(function(loadedFace) {
    document.fonts.add(loadedFace);
});

// For the SpaceX logo, we'll use a combination of fonts that approximate the look
// The actual SpaceX font is custom, but similar to Eurostile Bold Extended or Helvetica Neue
let spacexFontLoaded = false;

// Alternative method to load fonts using CSS - more reliable
const style = document.createElement('style');
style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@900&display=swap');
@font-face {
    font-family: 'SpaceXFont';
    src: local('Helvetica Neue'), local('Arial Black'), local('Roboto Black');
    font-weight: 900;
}
`;
document.head.appendChild(style);

// Preload Google's Roboto Black font which is a decent substitute
const link = document.createElement('link');
link.rel = 'preload';
link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@900&display=swap';
link.as = 'style';
document.head.appendChild(link);

// Helper function to draw the SpaceX logo with proper styling
function drawSpaceXLogo(ctx, x, y, scale = 1) {
    const fontSize = 10 * scale;
    
    // Use our custom font with fallbacks
    ctx.fillStyle = '#000000';
    ctx.font = `900 ${fontSize}px "SpaceXFont", "Helvetica Neue", "Roboto", "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw the logo text in all caps with slightly condensed letter spacing
    ctx.fillText('SPACEX', x, y);
}

class Cybertruck {
    constructor() {
        this.x = SCREEN_WIDTH / 3;
        this.y = SCREEN_HEIGHT / 2;
        this.velocity = 0;
        this.width = 70;
        this.height = 30;
        this.rotation = 0;
        this.thrusterFlare = 0;
        this.maxThrusterFlare = 20;
        this.lastUpdate = Date.now(); // For frame-rate independent physics
    }

    flap() {
        this.velocity = FLAP_STRENGTH;
        this.thrusterFlare = this.maxThrusterFlare;
        
        // Play thruster sound
        thrusterSound.currentTime = 0;
        thrusterSound.play().catch(e => {});
    }

    update() {
        // Frame-rate independent physics
        const now = Date.now();
        const deltaTime = Math.min((now - this.lastUpdate) / 16.67, 2); // Cap at 2x normal time step
        this.lastUpdate = now;
        
        this.velocity += GRAVITY * deltaTime;
        this.y += this.velocity * deltaTime;
        this.rotation = Math.max(-30, Math.min(30, this.velocity * 2));
        
        // Gradually reduce thruster flare
        if (this.thrusterFlare > 0) {
            this.thrusterFlare -= 0.8 * deltaTime;
            if (this.thrusterFlare < 0) this.thrusterFlare = 0;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation * Math.PI / 180);
        
        // Draw Cybertruck body - accurate angular shape
        ctx.fillStyle = '#E0E0E0'; // Lighter silver
        
        // Main body shape
        ctx.beginPath();
        // Bottom line
        ctx.moveTo(-this.width/2, this.height/2);
        // Back angled line
        ctx.lineTo(-this.width/2 + 10, -this.height/2);
        // Top line
        ctx.lineTo(this.width/2 - 15, -this.height/2);
        // Front angled line (windshield)
        ctx.lineTo(this.width/2, this.height/2 - 15);
        // Front vertical line
        ctx.lineTo(this.width/2, this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Add metallic shading
        const gradient = ctx.createLinearGradient(-this.width/2, -this.height/2, this.width/2, this.height/2);
        gradient.addColorStop(0, '#D0D0D0');
        gradient.addColorStop(0.5, '#F0F0F0');
        gradient.addColorStop(1, '#D0D0D0');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.moveTo(-this.width/2 + 2, this.height/2 - 2);
        ctx.lineTo(-this.width/2 + 12, -this.height/2 + 2);
        ctx.lineTo(this.width/2 - 17, -this.height/2 + 2);
        ctx.lineTo(this.width/2 - 2, this.height/2 - 17);
        ctx.lineTo(this.width/2 - 2, this.height/2 - 2);
        ctx.closePath();
        ctx.fill();
        
        // Windows (dark tinted)
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(-this.width/2 + 15, -this.height/2 + 3);
        ctx.lineTo(this.width/2 - 20, -this.height/2 + 3);
        ctx.lineTo(this.width/2 - 5, this.height/2 - 15);
        ctx.lineTo(-this.width/2 + 15, this.height/2 - 15);
        ctx.closePath();
        ctx.fill();
        
        // Wheel wells
        ctx.fillStyle = '#222';
        // Front wheel well
        ctx.beginPath();
        ctx.arc(this.width/2 - 15, this.height/2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Rear wheel well
        ctx.beginPath();
        ctx.arc(-this.width/2 + 20, this.height/2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Wheels
        ctx.fillStyle = '#111';
        // Front wheel
        ctx.beginPath();
        ctx.arc(this.width/2 - 15, this.height/2, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Rear wheel
        ctx.beginPath();
        ctx.arc(-this.width/2 + 20, this.height/2, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Wheel rims
        ctx.fillStyle = '#CCC';
        ctx.beginPath();
        ctx.arc(this.width/2 - 15, this.height/2, 4, 0, Math.PI * 2);
        ctx.arc(-this.width/2 + 20, this.height/2, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Headlights
        ctx.fillStyle = '#FFF9C4';
        ctx.beginPath();
        ctx.rect(this.width/2 - 3, -this.height/2 + 5, 3, 3);
        ctx.fill();
        
        // Taillights
        ctx.fillStyle = '#FF3D00';
        ctx.beginPath();
        ctx.rect(-this.width/2 + 3, -this.height/2 + 5, 3, 3);
        ctx.fill();
        
        // Add thruster effect when active
        if (this.thrusterFlare > 0) {
            // Draw thruster flames from the back of the truck
            const flameColors = ['#FF4500', '#FFA500', '#FFFF00'];
            const flameColor = flameColors[Math.floor(Date.now() / 100) % 3];
            
            // Main flame
            const flameSize = this.thrusterFlare * 1.2;
            ctx.fillStyle = flameColor;
            ctx.beginPath();
            ctx.moveTo(-this.width/2, -this.height/4);
            ctx.lineTo(-this.width/2 - flameSize, 0);
            ctx.lineTo(-this.width/2, this.height/4);
            ctx.closePath();
            ctx.fill();
            
            // Inner white flame
            const innerFlameSize = this.thrusterFlare * 0.7;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(-this.width/2, -this.height/8);
            ctx.lineTo(-this.width/2 - innerFlameSize, 0);
            ctx.lineTo(-this.width/2, this.height/8);
            ctx.closePath();
            ctx.fill();
            
            // Add glow effect
            const glow = ctx.createRadialGradient(
                -this.width/2, 0, 0,
                -this.width/2, 0, this.thrusterFlare * 1.5
            );
            glow.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
            glow.addColorStop(0.5, 'rgba(255, 150, 0, 0.5)');
            glow.addColorStop(1, 'rgba(255, 50, 0, 0)');
            
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(-this.width/2, 0, this.thrusterFlare * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class TrumpTower {
    constructor() {
        this.gap_y = Math.random() * (SCREEN_HEIGHT - 200) + 100;
        this.x = SCREEN_WIDTH;
        this.width = 80;
        this.top_height = this.gap_y - PIPE_GAP / 2;
        this.bottom_height = SCREEN_HEIGHT - (this.gap_y + PIPE_GAP / 2);
    }

    update() {
        this.x -= PIPE_SPEED;
    }

    draw() {
        // Draw top tower with pixelated effect
        const topGradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        topGradient.addColorStop(0, '#FFD700');
        topGradient.addColorStop(0.5, '#FFF8DC');
        topGradient.addColorStop(1, '#FFD700');
        
        ctx.fillStyle = topGradient;
        ctx.fillRect(this.x, 0, this.width, this.top_height);
        
        // Draw bottom tower with pixelated effect
        const bottomGradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        bottomGradient.addColorStop(0, '#FFD700');
        bottomGradient.addColorStop(0.5, '#FFF8DC');
        bottomGradient.addColorStop(1, '#FFD700');
        
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(this.x, SCREEN_HEIGHT - this.bottom_height, this.width, this.bottom_height);
        
        // Draw windows (more detailed with pixel effect)
        ctx.fillStyle = '#87CEFA';
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < Math.floor(this.top_height / 20); j++) {
                // Top tower windows
                ctx.fillRect(
                    this.x + 8 + i * 12,
                    8 + j * 20,
                    8, 12
                );
            }
            
            for (let j = 0; j < Math.floor(this.bottom_height / 20); j++) {
                // Bottom tower windows
                ctx.fillRect(
                    this.x + 8 + i * 12,
                    SCREEN_HEIGHT - this.bottom_height + 8 + j * 20,
                    8, 12
                );
            }
        }
        
        // Create vertical gold bands for TRUMP lettering
        ctx.fillStyle = '#B8860B';
        
        // Top tower band
        const topBandHeight = Math.min(40, this.top_height / 4);
        ctx.fillRect(this.x, this.top_height - topBandHeight, this.width, topBandHeight);
        
        // Bottom tower band
        const bottomBandHeight = Math.min(40, this.bottom_height / 4);
        ctx.fillRect(this.x, SCREEN_HEIGHT - this.bottom_height, this.width, bottomBandHeight);
        
        // Draw "TRUMP" text with authentic styling
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px "Helvetica Neue", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Draw text on the bands
        if (this.top_height > 50) {
            ctx.fillText('TRUMP', this.x + this.width/2, this.top_height - topBandHeight/2);
        }
        
        if (this.bottom_height > 50) {
            ctx.fillText('TRUMP', this.x + this.width/2, SCREEN_HEIGHT - this.bottom_height + bottomBandHeight/2);
        }
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw gold trim (pixelated)
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.x, 0, this.width, this.top_height);
        ctx.strokeRect(this.x, SCREEN_HEIGHT - this.bottom_height, this.width, this.bottom_height);
        
        // Add reflective highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(this.x + 2, 2, this.width - 4, 2);
        ctx.fillRect(this.x + 2, SCREEN_HEIGHT - this.bottom_height + 2, this.width - 4, 2);
    }

    getRects() {
        return [
            { x: this.x, y: 0, width: this.width, height: this.top_height },
            { x: this.x, y: SCREEN_HEIGHT - this.bottom_height, width: this.width, height: this.bottom_height }
        ];
    }
}

class EPABuilding {
    constructor() {
        this.gap_y = Math.random() * (SCREEN_HEIGHT - 200) + 100;
        this.x = SCREEN_WIDTH;
        this.width = 80;
        this.top_height = this.gap_y - PIPE_GAP / 2;
        this.bottom_height = SCREEN_HEIGHT - (this.gap_y + PIPE_GAP / 2);
    }

    update() {
        this.x -= PIPE_SPEED;
    }

    draw() {
        // Draw top building
        ctx.fillStyle = '#4CAF50'; // Green color for EPA
        ctx.fillRect(this.x, 0, this.width, this.top_height);
        
        // Draw bottom building
        ctx.fillRect(this.x, SCREEN_HEIGHT - this.bottom_height, this.width, this.bottom_height);
        
        // Draw windows
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < Math.floor(this.top_height / 20); j++) {
                // Top building windows
                ctx.fillRect(
                    this.x + 8 + i * 12,
                    8 + j * 20,
                    8, 12
                );
            }
            
            for (let j = 0; j < Math.floor(this.bottom_height / 20); j++) {
                // Bottom building windows
                ctx.fillRect(
                    this.x + 8 + i * 12,
                    SCREEN_HEIGHT - this.bottom_height + 8 + j * 20,
                    8, 12
                );
            }
        }
        
        // Draw EPA logo with enhanced prominence
        // Add a background panel for the EPA text
        ctx.fillStyle = '#FFFFFF';
        
        if (this.top_height > 50) {
            ctx.fillRect(this.x + 10, this.top_height - 50, this.width - 20, 30);
        }
        
        if (this.bottom_height > 50) {
            ctx.fillRect(this.x + 10, SCREEN_HEIGHT - this.bottom_height + 20, this.width - 20, 30);
        }
        
        // Draw EPA text with enhanced styling
        ctx.fillStyle = '#006400'; // Darker green for better contrast
        ctx.font = 'bold 24px Arial'; // Increased from 20px to 24px
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add shadow effect for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Draw text on the buildings
        if (this.top_height > 50) {
            ctx.fillText('EPA', this.x + this.width/2, this.top_height - 35);
        }
        
        if (this.bottom_height > 50) {
            ctx.fillText('EPA', this.x + this.width/2, SCREEN_HEIGHT - this.bottom_height + 35);
        }
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw building outline
        ctx.strokeStyle = '#388E3C';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.x, 0, this.width, this.top_height);
        ctx.strokeRect(this.x, SCREEN_HEIGHT - this.bottom_height, this.width, this.bottom_height);
    }

    getRects() {
        return [
            { x: this.x, y: 0, width: this.width, height: this.top_height },
            { x: this.x, y: SCREEN_HEIGHT - this.bottom_height, width: this.width, height: this.bottom_height }
        ];
    }
}

class AmericanFlag {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw() {
        // Draw flag pole
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y - this.height, 3, this.height);
        
        // Draw flag
        const stripeHeight = this.height / 13;
        
        // Red and white stripes
        for (let i = 0; i < 13; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#FF0000' : '#FFFFFF';
            ctx.fillRect(this.x + 3, this.y - this.height + i * stripeHeight, this.width, stripeHeight);
        }
        
        // Blue field
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(this.x + 3, this.y - this.height, this.width * 0.4, stripeHeight * 7);
        
        // Stars (simplified)
        ctx.fillStyle = '#FFFFFF';
        const starSize = 2;
        const starSpacingX = (this.width * 0.4) / 6;
        const starSpacingY = (stripeHeight * 7) / 5;
        
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 6; j++) {
                ctx.fillRect(
                    this.x + 3 + starSpacingX * (j + 0.5) - starSize/2,
                    this.y - this.height + starSpacingY * (i + 0.5) - starSize/2,
                    starSize, starSize
                );
            }
        }
    }
}

class WhiteHouse {
    constructor() {
        this.x = SCREEN_WIDTH;
        this.y = SCREEN_HEIGHT - 120; // Position at bottom of screen
        this.width = 150;
        this.height = 100;
        this.speed = 1; // Slower than towers for parallax effect
        this.flag = new AmericanFlag(this.x + this.width/2, this.y - 30, 25, 15);
    }

    update() {
        this.x -= this.speed;
        if (this.x < -this.width) {
            this.x = SCREEN_WIDTH + Math.random() * 300; // Random respawn distance
        }
        // Update flag position
        this.flag.x = this.x + this.width/2;
        this.flag.y = this.y - 30;
    }

    draw() {
        // Main building (white)
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Roof
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y);
        ctx.lineTo(this.x + this.width + 10, this.y);
        ctx.lineTo(this.x + this.width + 10, this.y - 10);
        ctx.lineTo(this.x + this.width/2, this.y - 30);
        ctx.lineTo(this.x - 10, this.y - 10);
        ctx.closePath();
        ctx.fill();
        
        // Columns
        ctx.fillStyle = '#FFFFFF';
        const columnWidth = 8;
        const columnSpacing = 20;
        const columnCount = 5;
        const columnStart = this.x + (this.width - (columnCount * columnWidth + (columnCount-1) * columnSpacing)) / 2;
        
        for (let i = 0; i < columnCount; i++) {
            const columnX = columnStart + i * (columnWidth + columnSpacing);
            ctx.fillRect(columnX, this.y + 20, columnWidth, this.height - 20);
        }
        
        // Windows
        ctx.fillStyle = '#87CEFA';
        // Top row
        for (let i = 0; i < 7; i++) {
            ctx.fillRect(this.x + 15 + i * 18, this.y + 10, 10, 15);
        }
        
        // Bottom row
        for (let i = 0; i < 7; i++) {
            ctx.fillRect(this.x + 15 + i * 18, this.y + 60, 10, 15);
        }
        
        // Door
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + this.width/2 - 10, this.y + 70, 20, 30);
        
        // Draw the flag
        this.flag.draw();
    }
}

class SpaceXRocket {
    constructor() {
        this.x = SCREEN_WIDTH;
        this.y = 100;
        this.width = 30;
        this.height = 100; // Increased height for better proportions
        this.speed = 1.5;
        this.flameAnimation = 0;
    }
    
    update() {
        this.x -= this.speed;
        this.y -= this.speed / 3; // Moving diagonally upward
        this.flameAnimation = (this.flameAnimation + 1) % 6; // Animate flame
        
        if (this.x < -this.width || this.y < -this.height) {
            this.x = SCREEN_WIDTH + Math.random() * 200;
            this.y = 150 + Math.random() * 100;
        }
    }
    
    draw() {
        // Save context for rotation
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(-Math.PI / 8); // Slight upward angle
        
        // Falcon 9 first stage (main body)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height * 0.8);
        
        // Interstage (black section)
        ctx.fillStyle = '#333333';
        ctx.fillRect(-this.width/2, -this.height/2 + this.height * 0.8, this.width, this.height * 0.1);
        
        // Second stage (upper section)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-this.width/2, -this.height/2 + this.height * 0.9, this.width, this.height * 0.1);
        
        // Draw SpaceX logo using our helper function
        ctx.save();
        ctx.translate(0, -this.height/4);
        drawSpaceXLogo(ctx, 0, 0, 0.8);
        ctx.restore();
        
        // Grid fins (deployed during landing)
        ctx.fillStyle = '#C0C0C0';
        // Left grid fin
        ctx.fillRect(-this.width/2 - 8, -this.height/2 + this.height * 0.2, 8, 15);
        // Right grid fin
        ctx.fillRect(this.width/2, -this.height/2 + this.height * 0.2, 8, 15);
        
        // Landing legs (deployed)
        ctx.fillStyle = '#333333';
        // Left leg
        ctx.beginPath();
        ctx.moveTo(-this.width/2, this.height/2 - 5);
        ctx.lineTo(-this.width/2 - 15, this.height/2 + 10);
        ctx.lineTo(-this.width/2 - 5, this.height/2 + 10);
        ctx.lineTo(-this.width/2, this.height/2 - 5);
        ctx.closePath();
        ctx.fill();
        
        // Right leg
        ctx.beginPath();
        ctx.moveTo(this.width/2, this.height/2 - 5);
        ctx.lineTo(this.width/2 + 15, this.height/2 + 10);
        ctx.lineTo(this.width/2 + 5, this.height/2 + 10);
        ctx.lineTo(this.width/2, this.height/2 - 5);
        ctx.closePath();
        ctx.fill();
        
        // Rocket windows/portholes
        ctx.fillStyle = '#87CEFA';
        ctx.beginPath();
        ctx.arc(0, -this.height/3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Rocket engines (Merlin engines)
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(0, this.height/2 - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Rocket flames (animated)
        const flameColors = ['#FF4500', '#FFA500', '#FFFF00'];
        const flameColor = flameColors[Math.floor(this.flameAnimation / 2)];
        ctx.fillStyle = flameColor;
        
        ctx.beginPath();
        ctx.moveTo(-5, this.height/2 - 5);
        ctx.lineTo(5, this.height/2 - 5);
        ctx.lineTo(0, this.height/2 + 20 + (this.flameAnimation * 3));
        ctx.closePath();
        ctx.fill();
        
        // Inner white flame
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(-2, this.height/2 - 5);
        ctx.lineTo(2, this.height/2 - 5);
        ctx.lineTo(0, this.height/2 + 10 + (this.flameAnimation * 2));
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

class PlayerRocket {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = 0;
        this.width = 60;
        this.height = 20;
        this.rotation = 0;
        this.flameAnimation = 0;
        this.thrusterFlare = 0;
        this.maxThrusterFlare = 20;
        this.lastUpdate = Date.now(); // For frame-rate independent physics
    }

    flap() {
        this.velocity = FLAP_STRENGTH;
        this.thrusterFlare = this.maxThrusterFlare;
        
        // Play thruster sound effect
        thrusterSound.currentTime = 0;
        thrusterSound.play().catch(e => {});
    }

    update() {
        // Frame-rate independent physics
        const now = Date.now();
        const deltaTime = Math.min((now - this.lastUpdate) / 16.67, 2); // Cap at 2x normal time step
        this.lastUpdate = now;
        
        this.velocity += GRAVITY * deltaTime;
        this.y += this.velocity * deltaTime;
        this.rotation = Math.max(-30, Math.min(30, this.velocity * 2));
        this.flameAnimation = (this.flameAnimation + 1) % 6;
        
        // Gradually reduce thruster flare
        if (this.thrusterFlare > 0) {
            this.thrusterFlare -= 0.8 * deltaTime;
            if (this.thrusterFlare < 0) this.thrusterFlare = 0;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation * Math.PI / 180);
        
        // Rocket body - white with black stripes for Falcon 9
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Black stripes for Falcon 9 look
        ctx.fillStyle = '#333333';
        // First stripe
        ctx.fillRect(-this.width/2 + 10, -this.height/2, 3, this.height);
        // Second stripe
        ctx.fillRect(-this.width/2 + 30, -this.height/2, 3, this.height);
        // Third stripe
        ctx.fillRect(-this.width/2 + 50, -this.height/2, 3, this.height);
        
        // Draw SpaceX logo using our helper function
        drawSpaceXLogo(ctx, 0, 0, 1);
        
        // Nose cone (now on the right side)
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(this.width/2, -this.height/2);
        ctx.lineTo(this.width/2 + 15, 0);
        ctx.lineTo(this.width/2, this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Rocket fins
        ctx.fillStyle = '#C0C0C0';
        // Left fin
        ctx.beginPath();
        ctx.moveTo(-this.width/2, this.height/2);
        ctx.lineTo(-this.width/2 - 10, this.height/2 + 10);
        ctx.lineTo(-this.width/2, this.height/2 - 10);
        ctx.closePath();
        ctx.fill();
        
        // Right fin
        ctx.beginPath();
        ctx.moveTo(this.width/2, this.height/2);
        ctx.lineTo(this.width/2 + 10, this.height/2 + 10);
        ctx.lineTo(this.width/2, this.height/2 - 10);
        ctx.closePath();
        ctx.fill();
        
        // Rocket windows/portholes
        ctx.fillStyle = '#87CEFA';
        ctx.beginPath();
        ctx.arc(0, -this.height/4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, this.height/4, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Add thruster effect when active
        if (this.thrusterFlare > 0) {
            // Draw thruster flames from the back of the rocket
            const flameColors = ['#FF4500', '#FFA500', '#FFFF00'];
            const flameColor = flameColors[Math.floor(Date.now() / 100) % 3];
            
            // Main flame
            const flameSize = this.thrusterFlare * 1.2;
            ctx.fillStyle = flameColor;
            ctx.beginPath();
            ctx.moveTo(-this.width/2, -this.height/4);
            ctx.lineTo(-this.width/2 - flameSize, 0);
            ctx.lineTo(-this.width/2, this.height/4);
            ctx.closePath();
            ctx.fill();
            
            // Inner white flame
            const innerFlameSize = this.thrusterFlare * 0.7;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(-this.width/2, -this.height/8);
            ctx.lineTo(-this.width/2 - innerFlameSize, 0);
            ctx.lineTo(-this.width/2, this.height/8);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
        
        // Debug visualization of thruster flare value
        if (DEBUG_MODE) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(`Thruster: ${this.thrusterFlare.toFixed(1)}`, this.x, this.y - 30);
        }
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class ElonMusk {
    constructor() {
        this.width = 80;
        this.height = 100;
    }
    
    draw(x, y) {
        ctx.save();
        ctx.translate(x, y);
        
        // Head
        ctx.fillStyle = '#FFD8B5'; // Skin tone
        ctx.beginPath();
        ctx.arc(this.width/2, 25, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Hair
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(this.width/2, 15, 18, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.width/2 - 8, 22, 5, 0, Math.PI * 2);
        ctx.arc(this.width/2 + 8, 22, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.width/2 - 8, 22, 2, 0, Math.PI * 2);
        ctx.arc(this.width/2 + 8, 22, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Smile
        ctx.beginPath();
        ctx.arc(this.width/2, 30, 10, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Body
        ctx.fillStyle = '#222';
        ctx.fillRect(this.width/2 - 15, 45, 30, 35);
        
        // SpaceX logo on shirt
        ctx.fillStyle = '#FFF';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SPACEX', this.width/2, 60);
        
        // Arms
        ctx.fillStyle = '#222';
        ctx.fillRect(this.width/2 - 25, 50, 10, 20); // Left arm
        ctx.fillRect(this.width/2 + 15, 50, 10, 20); // Right arm
        
        // Hands
        ctx.fillStyle = '#FFD8B5';
        ctx.beginPath();
        ctx.arc(this.width/2 - 20, 70, 5, 0, Math.PI * 2); // Left hand
        ctx.arc(this.width/2 + 20, 70, 5, 0, Math.PI * 2); // Right hand
        ctx.fill();
        
        ctx.restore();
    }
}

class DonaldTrump {
    constructor() {
        this.width = 80;
        this.height = 100;
    }
    
    draw(x, y) {
        ctx.save();
        ctx.translate(x, y);
        
        // Head
        ctx.fillStyle = '#FFCBA4'; // Skin tone
        ctx.beginPath();
        ctx.arc(this.width/2, 25, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Hair (iconic blonde)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.width/2, 15, 20, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Additional hair styling
        ctx.beginPath();
        ctx.moveTo(this.width/2 - 20, 15);
        ctx.lineTo(this.width/2 - 15, 5);
        ctx.lineTo(this.width/2, 10);
        ctx.lineTo(this.width/2 + 15, 5);
        ctx.lineTo(this.width/2 + 20, 15);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.width/2 - 8, 22, 5, 0, Math.PI * 2);
        ctx.arc(this.width/2 + 8, 22, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.width/2 - 8, 22, 2, 0, Math.PI * 2);
        ctx.arc(this.width/2 + 8, 22, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth (pursed lips)
        ctx.beginPath();
        ctx.arc(this.width/2, 35, 5, 0, Math.PI);
        ctx.fillStyle = '#FF6347';
        ctx.fill();
        
        // Suit
        ctx.fillStyle = '#00008B'; // Dark blue suit
        ctx.fillRect(this.width/2 - 15, 45, 30, 35);
        
        // Red tie
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(this.width/2, 45);
        ctx.lineTo(this.width/2 + 5, 55);
        ctx.lineTo(this.width/2, 80);
        ctx.lineTo(this.width/2 - 5, 55);
        ctx.closePath();
        ctx.fill();
        
        // Arms
        ctx.fillStyle = '#00008B';
        ctx.fillRect(this.width/2 - 25, 50, 10, 20); // Left arm
        ctx.fillRect(this.width/2 + 15, 50, 10, 20); // Right arm
        
        // Hands
        ctx.fillStyle = '#FFCBA4';
        ctx.beginPath();
        ctx.arc(this.width/2 - 20, 70, 5, 0, Math.PI * 2); // Left hand
        ctx.arc(this.width/2 + 20, 70, 5, 0, Math.PI * 2); // Right hand
        ctx.fill();
        
        ctx.restore();
    }
}

class AirForceOne {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = 0;
        this.width = 80; // Reduced from 100 (20% smaller)
        this.height = 32; // Reduced from 40 (20% smaller)
        this.rotation = 0;
        this.thrusterFlare = 0;
        this.maxThrusterFlare = 20;
        this.lastUpdate = Date.now();
    }

    flap() {
        this.velocity = FLAP_STRENGTH;
        this.thrusterFlare = this.maxThrusterFlare;
        
        // Play electric hum sound
        thrusterSound.currentTime = 0;
        thrusterSound.play().catch(e => {});
    }

    update() {
        // Frame-rate independent physics
        const now = Date.now();
        const deltaTime = Math.min((now - this.lastUpdate) / 16.67, 2);
        this.lastUpdate = now;
        
        this.velocity += GRAVITY * deltaTime;
        this.y += this.velocity * deltaTime;
        this.rotation = Math.max(-20, Math.min(20, this.velocity * 1.5));
        
        // Gradually reduce thruster flare
        if (this.thrusterFlare > 0) {
            this.thrusterFlare -= 0.8 * deltaTime;
            if (this.thrusterFlare < 0) this.thrusterFlare = 0;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation * Math.PI / 180);
        
        // Main body (white with exact Air Force One blue)
        // The official Air Force One colors are white (#FFFFFF) and "Air Force Blue" (#1D4289)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(-this.width/2, 0);
        ctx.lineTo(-this.width/2 + 15, -this.height/2);
        ctx.lineTo(this.width/2 - 15, -this.height/2);
        ctx.lineTo(this.width/2, 0);
        ctx.lineTo(this.width/2 - 5, this.height/2);
        ctx.lineTo(-this.width/2 + 5, this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Wings - distinctive feature of Air Force One
        // Main wings
        ctx.fillStyle = '#FFFFFF';
        // Left wing
        ctx.beginPath();
        ctx.moveTo(-this.width/4, 0);
        ctx.lineTo(-this.width/4 - 30, this.height/4);
        ctx.lineTo(-this.width/4 - 30, this.height/4 + 5);
        ctx.lineTo(-this.width/4, this.height/4 + 2);
        ctx.closePath();
        ctx.fill();
        
        // Right wing
        ctx.beginPath();
        ctx.moveTo(this.width/4, 0);
        ctx.lineTo(this.width/4 + 30, this.height/4);
        ctx.lineTo(this.width/4 + 30, this.height/4 + 5);
        ctx.lineTo(this.width/4, this.height/4 + 2);
        ctx.closePath();
        ctx.fill();
        
        // Tail wing
        ctx.beginPath();
        ctx.moveTo(-this.width/2 + 10, -this.height/2);
        ctx.lineTo(-this.width/2, -this.height/2 - 15);
        ctx.lineTo(-this.width/2 + 5, -this.height/2 - 15);
        ctx.lineTo(-this.width/2 + 15, -this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Blue stripe along the entire fuselage - using exact Air Force One blue
        ctx.fillStyle = '#1D4289'; // Official Air Force One blue
        ctx.beginPath();
        ctx.moveTo(-this.width/2 + 12, -this.height/2 + 2);
        ctx.lineTo(this.width/2 - 12, -this.height/2 + 2);
        ctx.lineTo(this.width/2 - 12, -this.height/2 + 8);
        ctx.lineTo(-this.width/2 + 12, -this.height/2 + 8);
        ctx.closePath();
        ctx.fill();
        
        // Blue stripe on wings
        // Left wing stripe
        ctx.fillStyle = '#1D4289';
        ctx.beginPath();
        ctx.moveTo(-this.width/4 - 5, this.height/4);
        ctx.lineTo(-this.width/4 - 25, this.height/4 + 2);
        ctx.lineTo(-this.width/4 - 25, this.height/4 + 4);
        ctx.lineTo(-this.width/4 - 5, this.height/4 + 2);
        ctx.closePath();
        ctx.fill();
        
        // Right wing stripe
        ctx.beginPath();
        ctx.moveTo(this.width/4 + 5, this.height/4);
        ctx.lineTo(this.width/4 + 25, this.height/4 + 2);
        ctx.lineTo(this.width/4 + 25, this.height/4 + 4);
        ctx.lineTo(this.width/4 + 5, this.height/4 + 2);
        ctx.closePath();
        ctx.fill();
        
        // Windows
        ctx.fillStyle = '#87CEFA';
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.rect(-this.width/2 + 20 + i * 10, -this.height/2 + 10, 6, 4);
            ctx.fill();
        }
        
        // American flag on tail
        ctx.fillStyle = '#0A3161'; // Blue field
        ctx.beginPath();
        ctx.rect(-this.width/2 + 5, -this.height/2 + 2, 8, 6);
        ctx.fill();
        
        // Red and white stripes (simplified)
        ctx.fillStyle = '#FF0000'; // Red stripes
        ctx.beginPath();
        ctx.rect(-this.width/2 + 5, -this.height/2 + 8, 8, 1);
        ctx.rect(-this.width/2 + 5, -this.height/2 + 10, 8, 1);
        ctx.rect(-this.width/2 + 5, -this.height/2 + 12, 8, 1);
        ctx.fill();
        
        // White stars (simplified)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.rect(-this.width/2 + 7, -this.height/2 + 4, 1, 1);
        ctx.rect(-this.width/2 + 10, -this.height/2 + 4, 1, 1);
        ctx.rect(-this.width/2 + 7, -this.height/2 + 6, 1, 1);
        ctx.rect(-this.width/2 + 10, -this.height/2 + 6, 1, 1);
        ctx.fill();
        
        // Presidential seal (simplified)
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#1D4289'; // Official Air Force One blue
        ctx.fill();
        ctx.strokeStyle = '#FFD700'; // Gold outline
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // "UNITED STATES OF AMERICA" text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("UNITED STATES OF AMERICA", 0, -8);
        
        // "AIR FORCE ONE" text - larger and more prominent
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px Arial';
        ctx.fillText("AIR FORCE ONE", 0, 8);
        
        // Engines
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.rect(-this.width/4, this.height/2 - 2, 6, 4);
        ctx.rect(this.width/4 - 6, this.height/2 - 2, 6, 4);
        ctx.fill();
        
        // Add thruster effect when active
        if (this.thrusterFlare > 0) {
            // Draw thruster flames
            const flameColors = ['#FF4500', '#FFA500', '#FFFF00'];
            const flameColor = flameColors[Math.floor(Date.now() / 100) % 3];
            
            // Main flame
            const flameSize = this.thrusterFlare * 1.2;
            ctx.fillStyle = flameColor;
            
            // Left engine flame
            ctx.beginPath();
            ctx.moveTo(-this.width/4, this.height/2 + 2);
            ctx.lineTo(-this.width/4 - flameSize/2, this.height/2 + flameSize);
            ctx.lineTo(-this.width/4 + 6, this.height/2 + 2);
            ctx.closePath();
            ctx.fill();
            
            // Right engine flame
            ctx.beginPath();
            ctx.moveTo(this.width/4 - 6, this.height/2 + 2);
            ctx.lineTo(this.width/4 - 3, this.height/2 + flameSize);
            ctx.lineTo(this.width/4, this.height/2 + 2);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class GreenlandParliament {
    constructor() {
        this.gap_y = Math.random() * (SCREEN_HEIGHT - 200) + 100;
        this.x = SCREEN_WIDTH;
        this.width = 80;
        this.top_height = this.gap_y - PIPE_GAP / 2;
        this.bottom_height = SCREEN_HEIGHT - (this.gap_y + PIPE_GAP / 2);
    }

    update() {
        this.x -= PIPE_SPEED;
    }

    draw() {
        // Draw top building
        this.drawBuilding(this.x, 0, this.width, this.top_height, true);
        
        // Draw bottom building
        this.drawBuilding(this.x, SCREEN_HEIGHT - this.bottom_height, this.width, this.bottom_height, false);
    }
    
    drawBuilding(x, y, width, height, isTop) {
        // Main building color - red and white (Greenland flag colors)
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, '#C8102E'); // Red
        gradient.addColorStop(0.5, '#FFFFFF'); // White
        gradient.addColorStop(1, '#C8102E'); // Red
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
        
        // Windows
        ctx.fillStyle = '#87CEFA';
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < Math.floor(height / 20); j++) {
                ctx.fillRect(
                    x + 8 + i * 12,
                    y + 8 + j * 20,
                    8, 12
                );
            }
        }
        
        // Greenland flag emblem
        const flagY = isTop ? y + height - 40 : y + 10;
        
        // Draw circle emblem (simplified Greenland flag)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + width/2, flagY + 15, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#C8102E';
        ctx.beginPath();
        ctx.arc(x + width/2, flagY + 15, 15, Math.PI, 0);
        ctx.fill();
        
        // Building outline
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

    getRects() {
        return [
            { x: this.x, y: 0, width: this.width, height: this.top_height },
            { x: this.x, y: SCREEN_HEIGHT - this.bottom_height, width: this.width, height: this.bottom_height }
        ];
    }
}

class Game {
    constructor() {
        this.state = GAME_STATE.START;
        this.reset();
        
        // Add background gradient with pixelated effect
        this.gradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
        this.gradient.addColorStop(0, '#87CEEB');  // Sky blue
        this.gradient.addColorStop(1, '#E0F6FF');  // Light blue
        
        // Add space background gradient for after transformation
        this.spaceGradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
        this.spaceGradient.addColorStop(0, '#000033');  // Deep space blue
        this.spaceGradient.addColorStop(0.3, '#0A0A3A');  // Dark blue
        this.spaceGradient.addColorStop(0.7, '#1A0A3A');  // Dark purple
        this.spaceGradient.addColorStop(1, '#000000');  // Black
        
        // Add Greenland sky gradient for second transformation
        this.greenlandGradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
        this.greenlandGradient.addColorStop(0, '#87CEEB');  // Sky blue
        this.greenlandGradient.addColorStop(0.5, '#B0E0E6');  // Powder blue
        this.greenlandGradient.addColorStop(1, '#FFFFFF');  // White (for snow)
        
        // Create White House
        this.whiteHouse1 = new WhiteHouse();
        this.whiteHouse2 = new WhiteHouse();
        this.whiteHouse2.x = SCREEN_WIDTH + 400; // Position second White House further away
        
        // Create SpaceX rocket
        this.rocket = new SpaceXRocket();
        
        // Create Elon Musk and Donald Trump for start screen
        this.elon = new ElonMusk();
        this.trump = new DonaldTrump();
        
        // Create debt counter
        this.nationalDebt = NATIONAL_DEBT;
        this.debtReduction = DEBT_REDUCTION;
        
        // Animation variables for start screen
        this.titleY = 150;
        this.titleDirection = 1;
        this.titleSpeed = 0.5;
        
        // Transformation thresholds
        this.firstTransformationThreshold = FIRST_TRANSFORMATION;
        this.secondTransformationThreshold = SECOND_TRANSFORMATION;
        this.transformed = false;
        this.secondTransformed = false;

        // Announcement variables
        this.announcement = "";
        this.announcementTime = 0;

        this.lastFrameTime = Date.now();
        
        // Stars for space background
        this.stars = [];
        this.generateStars();
        
        // Snowflakes for Greenland background
        this.snowflakes = [];
        this.generateSnowflakes();
    }

    // Generate stars for space background
    generateStars() {
        // Create 100 stars with random positions and sizes
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * SCREEN_WIDTH,
                y: Math.random() * SCREEN_HEIGHT,
                size: Math.random() * 2 + 1,
                brightness: Math.random()
            });
        }
    }
    
    // Generate snowflakes for Greenland background
    generateSnowflakes() {
        // Create 50 snowflakes with random positions and sizes
        for (let i = 0; i < 50; i++) {
            this.snowflakes.push({
                x: Math.random() * SCREEN_WIDTH,
                y: Math.random() * SCREEN_HEIGHT,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 1 + 0.5,
                opacity: Math.random() * 0.7 + 0.3
            });
        }
    }
    
    // Draw stars in space background
    drawStars() {
        for (let star of this.stars) {
            // Make stars twinkle by varying opacity
            const twinkle = 0.5 + Math.sin(Date.now() / 1000 + star.brightness * 10) * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + twinkle * 0.5})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Draw snowflakes in Greenland background
    drawSnowflakes() {
        for (let snowflake of this.snowflakes) {
            // Update snowflake position
            snowflake.y += snowflake.speed;
            if (snowflake.y > SCREEN_HEIGHT) {
                snowflake.y = 0;
                snowflake.x = Math.random() * SCREEN_WIDTH;
            }
            
            // Draw snowflake
            ctx.fillStyle = `rgba(255, 255, 255, ${snowflake.opacity})`;
            ctx.beginPath();
            ctx.arc(snowflake.x, snowflake.y, snowflake.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    reset() {
        this.truck = new Cybertruck();
        this.towers = [];
        this.lastTower = 0;
        this.score = 0;
        this.nationalDebt = NATIONAL_DEBT;
        this.updateScore();
        
        // Reset White House positions
        if (this.whiteHouse1) {
            this.whiteHouse1.x = SCREEN_WIDTH + 50;
            this.whiteHouse2.x = SCREEN_WIDTH + 450;
        }
        
        // Reset rocket position
        if (this.rocket) {
            this.rocket.x = SCREEN_WIDTH + 100;
            this.rocket.y = 150;
        }
        
        // Reset Elon and Trump positions for start screen
        if (this.elon) {
            this.elon.x = SCREEN_WIDTH + 200;
        }
        
        if (this.trump) {
            this.trump.x = SCREEN_WIDTH + 100;
        }
        
        this.transformed = false;
        this.secondTransformed = false;
    }

    updateScore() {
        // Remove updating the external score element
        // scoreElement.textContent = `Score: ${this.score} | Debt: $${(this.nationalDebt / 1000000000000).toFixed(2)} trillion`;
        
        // We'll now draw the score directly on the canvas in the draw method
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    update() {
        // Calculate delta time for frame-rate independent updates
        const now = Date.now();
        const deltaTime = Math.min((now - this.lastFrameTime) / 16.67, 2); // Cap at 2x normal time step
        this.lastFrameTime = now;
        
        // Update rocket in all states
        this.rocket.update();
        
        // Update title animation on start screen
        if (this.state === GAME_STATE.START) {
            this.titleY += this.titleDirection * this.titleSpeed * deltaTime;
            if (this.titleY > 160 || this.titleY < 140) {
                this.titleDirection *= -1;
            }
            return;
        }
        
        if (this.state === GAME_STATE.GAME_OVER) return;

        const currentTime = now;
        
        // Check for first transformation (Cybertruck to Falcon 9)
        if (this.score >= this.firstTransformationThreshold && !this.transformed) {
            this.transformed = true;
            
            // Play transformation sound
            transformSound.currentTime = 0;
            transformSound.play().catch(e => {});
            
            // Create player rocket at the same position as the truck
            this.playerRocket = new PlayerRocket(
                this.truck.x - 10,
                this.truck.y + (this.truck.height - 25) / 2
            );
            // Set the velocity to match the truck's velocity for smooth transition
            this.playerRocket.velocity = this.truck.velocity;
            
            // Add a tower immediately after transformation to continue gameplay
            if (this.towers.length === 0 || this.towers[this.towers.length - 1].x < SCREEN_WIDTH - 200) {
                this.towers.push(new EPABuilding());
                this.lastTower = currentTime;
            }
            
            // Show transformation announcement
            this.announcement = "Cybertruck Transformed to Falcon 9!";
            this.announcementTime = Date.now();
        }
        
        // Check for second transformation (Falcon 9 to Air Force One)
        if (this.score >= this.secondTransformationThreshold && this.transformed && !this.secondTransformed) {
            this.secondTransformed = true;
            
            // Play transformation sound
            transformSound.currentTime = 0;
            transformSound.play().catch(e => {});
            
            // Create Air Force One at the same position as the rocket
            this.airForceOne = new AirForceOne(
                this.playerRocket.x,
                this.playerRocket.y
            );
            // Set the velocity to match the rocket's velocity for smooth transition
            this.airForceOne.velocity = this.playerRocket.velocity;
            
            // Add a tower immediately after transformation to continue gameplay
            if (this.towers.length === 0 || this.towers[this.towers.length - 1].x < SCREEN_WIDTH - 200) {
                this.towers.push(new GreenlandParliament());
                this.lastTower = currentTime;
            }
            
            // Show transformation announcement with clearer Air Force One reference
            this.announcement = "Transformed to the Presidential Boeing 747 - AIR FORCE ONE!";
            this.announcementTime = Date.now();
        }
        
        // Update player based on transformation state
        if (this.secondTransformed) {
            this.airForceOne.update();
        } else if (this.transformed) {
            this.playerRocket.update();
        } else {
            this.truck.update();
        }
        
        // Update White Houses (background) - only in first phase
        if (!this.transformed) {
            this.whiteHouse1.update();
            this.whiteHouse2.update();
        }
        
        // Generate new towers
        if (currentTime - this.lastTower > PIPE_FREQUENCY) {
            if (this.secondTransformed) {
                this.towers.push(new GreenlandParliament());
            } else if (this.transformed) {
                this.towers.push(new EPABuilding());
            } else {
                this.towers.push(new TrumpTower());
            }
            this.lastTower = currentTime;
        }

        // Update towers with delta time
        for (let i = this.towers.length - 1; i >= 0; i--) {
            const tower = this.towers[i];
            tower.x -= PIPE_SPEED * deltaTime; // Apply delta time to tower movement
            
            if (tower.x < -50) {
                this.towers.splice(i, 1);
                this.score++;
                this.nationalDebt -= this.debtReduction;
                if (this.nationalDebt < 0) this.nationalDebt = 0;
                this.updateScore();
                
                // Show debt reduction animation
                this.showDebtReduction();

                // Show announcement every 5 obstacles
                if (this.score % 5 === 0) {
                    this.showAnnouncement();
                }
            }

            // Check collisions
            let playerRect;
            if (this.secondTransformed) {
                playerRect = this.airForceOne.getRect();
            } else if (this.transformed) {
                playerRect = this.playerRocket.getRect();
            } else {
                playerRect = this.truck.getRect();
            }
            
            for (const towerRect of tower.getRects()) {
                if (this.checkCollision(playerRect, towerRect)) {
                    this.state = GAME_STATE.GAME_OVER;
                    return;
                }
            }
        }

        // Check if player is off screen
        if (this.secondTransformed) {
            if (this.airForceOne.y < 0 || this.airForceOne.y > SCREEN_HEIGHT) {
                this.state = GAME_STATE.GAME_OVER;
            }
        } else if (this.transformed) {
            if (this.playerRocket.y < 0 || this.playerRocket.y > SCREEN_HEIGHT) {
                this.state = GAME_STATE.GAME_OVER;
            }
        } else {
            if (this.truck.y < 0 || this.truck.y > SCREEN_HEIGHT) {
                this.state = GAME_STATE.GAME_OVER;
            }
        }
    }
    
    showDebtReduction() {
        // This will be called when a tower is passed
        // We'll create a visual indicator that debt was reduced
        this.debtReductionTime = Date.now();
        this.showingDebtReduction = true;
    }

    showAnnouncement() {
        const announcements = [
            "EPA Gutted! Nice!",
            "Department of Education Disbanded! Success!",
            "IRS Abolished! Great Job!",
            "Federal Reserve Dismantled! Well Done!",
            "Social Security Privatized! Keep Going!",
            "SEC Regulations Slashed! Fantastic!",
            "NASA Privatized! To The Moon!",
            "FDA Deregulated! Freedom!",
            "National Parks Sold! Profit!",
            "Minimum Wage Eliminated! Efficiency!",
            "Healthcare Fully Privatized! Savings!",
            "Public Transit Eliminated! More Roads!",
            "FCC Dissolved! Free Airwaves!",
            "USPS Privatized! Better Service!",
            "Import Tariffs Removed! Free Trade!"
        ];
        this.announcement = announcements[Math.floor(Math.random() * announcements.length)];
        this.announcementTime = Date.now();
    }

    drawStartScreen() {
        // Draw sky gradient background
        ctx.fillStyle = this.gradient;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        // Draw rocket (in background)
        this.rocket.draw();
        
        // Draw ground
        ctx.fillStyle = '#8BC34A';
        ctx.fillRect(0, SCREEN_HEIGHT - 20, SCREEN_WIDTH, 20);
        
        // Draw White Houses (background)
        this.whiteHouse1.draw();
        this.whiteHouse2.draw();
        
        // Create a semi-transparent panel for the title
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(SCREEN_WIDTH/2 - 160, 80, 320, 240);
        
        // Add a border to the panel
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.strokeRect(SCREEN_WIDTH/2 - 160, 80, 320, 240);
        
        // Draw title with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Draw title
        ctx.fillStyle = '#FF3D00';
        ctx.font = 'bold 52px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CyberFlap', SCREEN_WIDTH/2, 140);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw subtitle
        ctx.fillStyle = '#333';
        ctx.font = '18px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Take your Cybertruck on an adventure", SCREEN_WIDTH/2, 180);
        ctx.fillText("to help eliminate national debt", SCREEN_WIDTH/2, 205);
        
        // Draw divider line
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(SCREEN_WIDTH/2 - 120, 225);
        ctx.lineTo(SCREEN_WIDTH/2 + 120, 225);
        ctx.stroke();
        
        // Draw current debt
        ctx.fillStyle = '#006400';
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.fillText(`National Debt:`, SCREEN_WIDTH/2, 255);
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.fillText(`$${(this.nationalDebt / 1000000000000).toFixed(2)} trillion`, SCREEN_WIDTH/2, 285);
        
        // Draw instruction
        ctx.fillStyle = '#333';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillText('Press SPACE to Start', SCREEN_WIDTH/2, 350);
        
        // Draw Elon and Trump below the "Press SPACE to Start" text
        this.elon.draw(SCREEN_WIDTH/2 - 120, 380);  // Left of center, below text
        this.trump.draw(SCREEN_WIDTH/2 + 40, 380);  // Right of center, below text
        
        // Draw sample Cybertruck
        const truck = new Cybertruck();
        truck.x = SCREEN_WIDTH/2 - 35;
        truck.y = SCREEN_HEIGHT - 150;
        truck.draw();
        
        // Draw game controls
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(SCREEN_WIDTH/2 - 100, SCREEN_HEIGHT - 80, 200, 50);
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText('Controls: SPACE to jump', SCREEN_WIDTH/2, SCREEN_HEIGHT - 55);
    }

    draw() {
        if (this.state === GAME_STATE.START) {
            this.drawStartScreen();
            return;
        }
        
        // Draw background based on transformation state
        if (this.secondTransformed) {
            // Greenland background after second transformation
            ctx.fillStyle = this.greenlandGradient;
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            
            // Draw snowflakes
            this.drawSnowflakes();
        } else if (this.transformed) {
            // Space background after first transformation
            ctx.fillStyle = this.spaceGradient;
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            
            // Draw stars
            this.drawStars();
        } else {
            // Sky gradient background before transformation
            ctx.fillStyle = this.gradient;
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        }
        
        // Draw rocket (in background) - only in first two phases
        if (!this.secondTransformed) {
            this.rocket.draw();
        }
        
        // Draw ground only if not transformed
        if (!this.transformed && !this.secondTransformed) {
            ctx.fillStyle = '#8BC34A';
            ctx.fillRect(0, SCREEN_HEIGHT - 20, SCREEN_WIDTH, 20);
            
            // Draw White Houses (background) only before transformation
            this.whiteHouse1.draw();
            this.whiteHouse2.draw();
        }
        
        // Draw game objects
        if (this.secondTransformed) {
            this.airForceOne.draw();
        } else if (this.transformed) {
            this.playerRocket.draw();
        } else {
            this.truck.draw();
        }
        
        for (const tower of this.towers) {
            tower.draw();
        }
        
        // Draw score and debt counter inside the game canvas
        this.drawScoreCounter();
        
        // Draw debt reduction animation if active
        if (this.showingDebtReduction && Date.now() - this.debtReductionTime < 1000) {
            // Apply shadow for better visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.fillStyle = 'rgba(0, 200, 0, ' + (1 - (Date.now() - this.debtReductionTime) / 1000) + ')';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('-$10 Billion', SCREEN_WIDTH/2, 100);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else {
            this.showingDebtReduction = false;
        }

        // Draw announcement if active - simplified clean style
        if (this.announcement && Date.now() - this.announcementTime < 3000) {
            // Apply shadow for better visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            // Draw text centered on screen with clean style
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.announcement, SCREEN_WIDTH/2, 60);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // Draw game over message with better styling
        if (this.state === GAME_STATE.GAME_OVER) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 70);
            
            ctx.font = '24px Arial';
            ctx.fillText(`You reduced the debt by $${(this.score * this.debtReduction / 1000000000).toFixed(1)} billion`, SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 30);
            
            ctx.fillText(`Chainsaws collected: ${this.chainsawCount}`, SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 10);
            
            ctx.font = '20px Arial';
            ctx.fillText('Press SPACE to restart', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 50);
            
            // Check if user is logged in
            const userData = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            
            if (userData && token) {
                // User is logged in, show personalized message
                const user = JSON.parse(userData);
                ctx.font = '18px Arial';
                ctx.fillStyle = '#33ccff';
                ctx.fillText(`Progress saved for ${user.username}!`, SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 100);
            } else {
                // User is not logged in, show login/signup options
                ctx.font = '18px Arial';
                ctx.fillStyle = '#ff3366';
                ctx.fillText('Want to save your progress?', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 100);
                
                // Login button
                this.drawButton('Login', SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2 + 130, 70, 30, '#ff3366');
                
                // Sign up button
                this.drawButton('Sign Up', SCREEN_WIDTH/2 + 10, SCREEN_HEIGHT/2 + 130, 70, 30, '#ff3366');
                
                // Store button positions for click handling
                this.loginButtonPos = {
                    x: SCREEN_WIDTH/2 - 80,
                    y: SCREEN_HEIGHT/2 + 130,
                    width: 70,
                    height: 30
                };
                
                this.signupButtonPos = {
                    x: SCREEN_WIDTH/2 + 10,
                    y: SCREEN_HEIGHT/2 + 130,
                    width: 70,
                    height: 30
                };
            }
        }
    }
    
    // New method to draw the score counter inside the game canvas
    drawScoreCounter() {
        // Remove background and border, just draw the text directly
        
        // Draw score text with shadow for better visibility
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        
        // Add shadow for better readability against any background
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Draw score text
        ctx.fillText(`Score: ${this.score}`, 15, 30);
        
        // Draw debt text
        ctx.textAlign = 'right';
        ctx.fillText(`Debt: $${(this.nationalDebt / 1000000000000).toFixed(2)}T`, SCREEN_WIDTH - 15, 30);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    // Helper method to get random number of towers until next chainsaw
    getRandomTowersUntilChainsaw() {
        return MIN_TOWERS_BEFORE_CHAINSAW + 
            Math.floor(Math.random() * (MAX_TOWERS_BEFORE_CHAINSAW - MIN_TOWERS_BEFORE_CHAINSAW + 1));
    }

    // Add a helper method to draw buttons on the canvas
    drawButton(text, x, y, width, height, color) {
        // Draw button background
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        
        // Draw button text
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + width/2, y + height/2);
    }
}

// Initialize game
const game = new Game();

// Game loop
function gameLoop() {
    game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
}

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        if (game.state === GAME_STATE.START) {
            game.state = GAME_STATE.PLAYING;
            
            // Play Elon Musk sound when starting the game
            try {
                if (elonSound.error) {
                    // If the audio file failed to load, use speech synthesis
                    if (window.elonUtterance) {
                        speechSynthesis.speak(window.elonUtterance);
                    }
                } else {
                    // Play the audio file
                    elonSound.currentTime = 0;
                    const playPromise = elonSound.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.log("Audio playback failed:", error);
                            // Use speech synthesis as fallback
                            if (window.elonUtterance) {
                                speechSynthesis.speak(window.elonUtterance);
                            }
                        });
                    }
                }
            } catch (e) {
                console.log("Audio error:", e);
            }
        } else if (game.state === GAME_STATE.GAME_OVER) {
            game.state = GAME_STATE.PLAYING;
            game.reset();
        } else {
            // Flap the appropriate player
            if (game.secondTransformed) {
                game.airForceOne.flap();
            } else if (game.transformed) {
                game.playerRocket.flap();
            } else {
                game.truck.flap();
            }
        }
        
        // Prevent space from scrolling the page
        event.preventDefault();
    }
});

// Add a testing function that lets you start from obstacle 29
function startFromObstacle29() {
    // Reset the game first
    game.reset();
    
    // Set the score to 29 (one away from transformation)
    game.score = 29;
    
    // Update the debt based on 29 obstacles passed
    game.nationalDebt -= (game.debtReduction * 29);
    game.updateScore();
    
    // Start the game in PLAYING state
    game.state = GAME_STATE.PLAYING;
    
    // Add a tower to make gameplay immediate
    const tower = new TrumpTower();
    // Position the tower closer to make transformation happen faster
    tower.x = SCREEN_WIDTH - 150;
    game.towers.push(tower);
    game.lastTower = Date.now();
    
    // Add a message to indicate test mode
    console.log("Test mode: Starting from obstacle 29 - Pass one more to transform into Falcon 9!");
}

// Add a function to directly test the transformed state
function testFalcon9() {
    // Reset the game first
    game.reset();
    
    // Set the score to 30 (transformation threshold)
    game.score = 30;
    
    // Update the debt
    game.nationalDebt -= (game.debtReduction * 30);
    game.updateScore();
    
    // Start the game in PLAYING state
    game.state = GAME_STATE.PLAYING;
    
    // Force transformation
    game.transformed = true;
    game.playerRocket = new PlayerRocket(SCREEN_WIDTH / 3, SCREEN_HEIGHT / 2);
    
    // Add an EPA building
    const building = new EPABuilding();
    building.x = SCREEN_WIDTH - 150;
    game.towers.push(building);
    game.lastTower = Date.now();
    
    console.log("Test mode: Starting with Falcon 9 rocket!");
}

// Add a function to test the second transformation
function testAirForceOne() {
    // Reset the game first
    game.reset();
    
    // Set the score to 59 (one away from second transformation)
    game.score = 59;
    
    // Update the debt based on 59 obstacles passed
    game.nationalDebt -= (game.debtReduction * 59);
    game.updateScore();
    
    // Start the game in PLAYING state
    game.state = GAME_STATE.PLAYING;
    
    // Force first transformation
    game.transformed = true;
    game.playerRocket = new PlayerRocket(SCREEN_WIDTH / 3, SCREEN_HEIGHT / 2);
    
    // Add an EPA building
    const building = new EPABuilding();
    building.x = SCREEN_WIDTH - 150;
    game.towers.push(building);
    game.lastTower = Date.now();
    
    console.log("Test mode: Starting at obstacle 59 - Pass one more to transform into Air Force One!");
}

// Add keyboard shortcuts to trigger these functions
document.addEventListener('keydown', (event) => {
    // Press 'T' key to start test mode (one away from transformation)
    if (event.code === 'KeyT') {
        startFromObstacle29();
    }
    // Press 'F' key to directly test Falcon 9
    else if (event.code === 'KeyF') {
        testFalcon9();
    }
    // Press 'A' key to test Air Force One transformation
    else if (event.code === 'KeyA') {
        testAirForceOne();
    }
    // Press 'D' key to toggle debug mode
    else if (event.code === 'KeyD') {
        DEBUG_MODE = !DEBUG_MODE;
        console.log("Debug mode:", DEBUG_MODE ? "ON" : "OFF");
    }
});

// Add click handler for game over buttons
document.getElementById('gameCanvas').addEventListener('click', function(event) {
    // Only handle clicks in game over state
    if (game.state !== GAME_STATE.GAME_OVER) return;
    
    // Get click coordinates relative to canvas
    const rect = this.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Check if login button was clicked
    if (game.loginButtonPos && 
        mouseX >= game.loginButtonPos.x && 
        mouseX <= game.loginButtonPos.x + game.loginButtonPos.width &&
        mouseY >= game.loginButtonPos.y && 
        mouseY <= game.loginButtonPos.y + game.loginButtonPos.height) {
        window.location.href = '/login';
    }
    
    // Check if signup button was clicked
    if (game.signupButtonPos && 
        mouseX >= game.signupButtonPos.x && 
        mouseX <= game.signupButtonPos.x + game.signupButtonPos.width &&
        mouseY >= game.signupButtonPos.y && 
        mouseY <= game.signupButtonPos.y + game.signupButtonPos.height) {
        window.location.href = '/login?signup=true';
    }
});

// Start the game
gameLoop(); 
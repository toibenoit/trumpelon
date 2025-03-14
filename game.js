// Game constants
const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 600;
const GRAVITY = 0.35;
const FLAP_STRENGTH = -8;
const PIPE_SPEED = 3;
const PIPE_GAP = 180;
const PIPE_FREQUENCY = 1500;
const NATIONAL_DEBT = 34000000000000; // $34 trillion starting debt
const DEBT_REDUCTION = 10000000000; // $10 billion per obstacle
const DEBUG_MODE = false; // Disable debug mode

// Game states
const GAME_STATE = {
    START: 0,
    PLAYING: 1,
    GAME_OVER: 2
};

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Load sound effects
const thrusterSound = new Audio('https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3');
thrusterSound.volume = 0.3; // Set volume to 30%
const transformSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1184/1184-preview.mp3');
transformSound.volume = 0.4; // Set volume to 40%

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
        this.thrusterFlare = 0; // Add thruster flare for truck
        this.maxThrusterFlare = 20; // Maximum thruster flare size
    }

    flap() {
        this.velocity = FLAP_STRENGTH;
        // Activate thruster flare when flapping
        this.thrusterFlare = this.maxThrusterFlare;
        
        // Play thruster sound (different sound for truck)
        thrusterSound.currentTime = 0;
        thrusterSound.play().catch(e => console.log("Error playing thruster sound:", e));
    }

    update() {
        this.velocity += GRAVITY;
        this.y += this.velocity;
        this.rotation = Math.max(-30, Math.min(30, this.velocity * 2));
        
        // Gradually reduce thruster flare
        if (this.thrusterFlare > 0) {
            this.thrusterFlare -= 0.8;
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
        this.height = 100; // Increased height for Falcon 9
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
        
        // Falcon 9 body - white with black stripes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Black stripes for Falcon 9 look
        ctx.fillStyle = '#333333';
        // First stripe
        ctx.fillRect(-this.width/2 + this.width/4, -this.height/2, 2, this.height);
        // Second stripe
        ctx.fillRect(0, -this.height/2, 2, this.height);
        // Third stripe
        ctx.fillRect(this.width/2 - this.width/4, -this.height/2, 2, this.height);
        
        // Draw SpaceX logo using our helper function
        drawSpaceXLogo(ctx, 0, -this.height/4, 0.8);
        
        // Rocket nose cone
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(-this.width/2, -this.height/2);
        ctx.lineTo(this.width/2, -this.height/2);
        ctx.lineTo(0, -this.height/2 - 15);
        ctx.closePath();
        ctx.fill();
        
        // Grid fins near the top
        ctx.fillStyle = '#A0A0A0';
        // Left grid fin
        ctx.fillRect(-this.width/2 - 8, -this.height/2 + 20, 8, 10);
        // Right grid fin
        ctx.fillRect(this.width/2, -this.height/2 + 20, 8, 10);
        
        // Landing legs at the bottom
        ctx.fillStyle = '#808080';
        // Left leg
        ctx.beginPath();
        ctx.moveTo(-this.width/2, this.height/2);
        ctx.lineTo(-this.width/2 - 15, this.height/2 + 15);
        ctx.lineTo(-this.width/2 - 5, this.height/2 + 15);
        ctx.lineTo(-this.width/2, this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Right leg
        ctx.beginPath();
        ctx.moveTo(this.width/2, this.height/2);
        ctx.lineTo(this.width/2 + 15, this.height/2 + 15);
        ctx.lineTo(this.width/2 + 5, this.height/2 + 15);
        ctx.lineTo(this.width/2, this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Rocket windows/portholes
        ctx.fillStyle = '#87CEFA';
        ctx.beginPath();
        ctx.arc(0, -this.height/3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Rocket engines (multiple)
        ctx.fillStyle = '#606060';
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.arc(i * (this.width/3), this.height/2, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Rocket flames (animated)
        const flameColors = ['#FF4500', '#FFA500', '#FFFF00'];
        const flameColor = flameColors[Math.floor(this.flameAnimation / 2)];
        
        // Multiple flames for multiple engines
        for (let i = -1; i <= 1; i++) {
            ctx.fillStyle = flameColor;
            ctx.beginPath();
            ctx.moveTo(i * (this.width/3) - 4, this.height/2);
            ctx.lineTo(i * (this.width/3) + 4, this.height/2);
            ctx.lineTo(i * (this.width/3), this.height/2 + 15 + (this.flameAnimation * 2));
            ctx.closePath();
            ctx.fill();
            
            // Inner white flame
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(i * (this.width/3) - 2, this.height/2);
            ctx.lineTo(i * (this.width/3) + 2, this.height/2);
            ctx.lineTo(i * (this.width/3), this.height/2 + 10 + (this.flameAnimation));
            ctx.closePath();
            ctx.fill();
        }
        
        // Mars (destination)
        if (this.x < SCREEN_WIDTH / 2) {
            ctx.fillStyle = '#FF6347'; // Red planet
            ctx.beginPath();
            ctx.arc(-100, -80, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Mars details
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(-105, -85, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-95, -75, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class PlayerRocket {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = 0;
        this.width = 60; // Reduced from 80 to 60 for smaller rocket
        this.height = 20; // Reduced from 25 to 20 for smaller rocket
        this.rotation = 0;
        this.flameAnimation = 0;
    }

    flap() {
        this.velocity = FLAP_STRENGTH;
        
        // Play thruster sound effect
        thrusterSound.currentTime = 0; // Reset sound to start
        thrusterSound.play().catch(e => console.log("Error playing thruster sound:", e));
    }

    update() {
        this.velocity += GRAVITY;
        this.y += this.velocity;
        this.rotation = Math.max(-30, Math.min(30, this.velocity * 2));
        this.flameAnimation = (this.flameAnimation + 1) % 6;
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

// Add new classes for Trump and Musk pixelated graphics
class PixelatedTrump {
    constructor(x, y, scale = 1) {
        this.x = x;
        this.y = y;
        this.scale = scale;
    }
    
    draw() {
        const s = this.scale; // Scale factor for easier sizing
        
        // Trump's face - pixelated style with more detail
        ctx.save();
        
        // Hair (blonde with more detail)
        ctx.fillStyle = '#FFD700';
        // Main hair
        ctx.fillRect(this.x, this.y, 15*s, 5*s);
        // Left side hair
        ctx.fillRect(this.x-3*s, this.y+2*s, 3*s, 8*s);
        // Right side hair
        ctx.fillRect(this.x+15*s, this.y+2*s, 3*s, 6*s);
        // Top hair detail
        ctx.fillRect(this.x+2*s, this.y-2*s, 11*s, 2*s);
        
        // Face (orange-ish with more detail)
        ctx.fillStyle = '#FFBD33';
        // Main face
        ctx.fillRect(this.x, this.y+5*s, 15*s, 15*s);
        // Cheeks
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(this.x+2*s, this.y+8*s, 3*s, 3*s);
        ctx.fillRect(this.x+10*s, this.y+8*s, 3*s, 3*s);
        
        // Eyes (blue with more detail)
        ctx.fillStyle = '#87CEFA';
        // Left eye
        ctx.fillRect(this.x+3*s, this.y+8*s, 3*s, 3*s);
        // Right eye
        ctx.fillRect(this.x+9*s, this.y+8*s, 3*s, 3*s);
        // Eye highlights
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x+4*s, this.y+9*s, 1*s, 1*s);
        ctx.fillRect(this.x+10*s, this.y+9*s, 1*s, 1*s);
        
        // Mouth (red with more detail)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x+4*s, this.y+15*s, 7*s, 2*s);
        // Lip detail
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(this.x+5*s, this.y+16*s, 5*s, 1*s);
        
        // Suit (dark blue with more detail)
        ctx.fillStyle = '#000080';
        // Main suit
        ctx.fillRect(this.x-3*s, this.y+20*s, 21*s, 12*s);
        // Lapels
        ctx.fillStyle = '#0000CC';
        ctx.fillRect(this.x+2*s, this.y+20*s, 4*s, 4*s);
        ctx.fillRect(this.x+9*s, this.y+20*s, 4*s, 4*s);
        
        // Shirt (white with more detail)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x+2*s, this.y+20*s, 11*s, 6*s);
        
        // Tie (red with more detail)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x+6*s, this.y+20*s, 3*s, 12*s);
        // Tie knot
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(this.x+5*s, this.y+20*s, 5*s, 2*s);
        
        ctx.restore();
    }
}

class PixelatedMusk {
    constructor(x, y, scale = 1) {
        this.x = x;
        this.y = y;
        this.scale = scale;
    }
    
    draw() {
        const s = this.scale; // Scale factor for easier sizing
        
        // Musk's face - pixelated style with more detail
        ctx.save();
        
        // Hair (dark brown with more detail)
        ctx.fillStyle = '#4A3C2A';
        // Main hair
        ctx.fillRect(this.x, this.y, 15*s, 4*s);
        // Side hair
        ctx.fillRect(this.x-2*s, this.y+2*s, 2*s, 8*s);
        ctx.fillRect(this.x+15*s, this.y+2*s, 2*s, 6*s);
        // Top hair detail
        ctx.fillRect(this.x+2*s, this.y-1*s, 11*s, 1*s);
        
        // Face (light skin tone with more detail)
        ctx.fillStyle = '#F5D0A9';
        // Main face
        ctx.fillRect(this.x, this.y+4*s, 15*s, 15*s);
        // Cheeks
        ctx.fillStyle = '#E6C39E';
        ctx.fillRect(this.x+2*s, this.y+8*s, 3*s, 3*s);
        ctx.fillRect(this.x+10*s, this.y+8*s, 3*s, 3*s);
        
        // Eyes (dark brown with more detail)
        ctx.fillStyle = '#3A2A1A';
        // Left eye
        ctx.fillRect(this.x+3*s, this.y+8*s, 3*s, 3*s);
        // Right eye
        ctx.fillRect(this.x+9*s, this.y+8*s, 3*s, 3*s);
        // Eye highlights
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x+4*s, this.y+9*s, 1*s, 1*s);
        ctx.fillRect(this.x+10*s, this.y+9*s, 1*s, 1*s);
        
        // Mouth (neutral with more detail)
        ctx.fillStyle = '#A52A2A';
        ctx.fillRect(this.x+5*s, this.y+15*s, 5*s, 2*s);
        // Lip detail
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x+6*s, this.y+16*s, 3*s, 1*s);
        
        // SpaceX shirt (black with more detail)
        ctx.fillStyle = '#000000';
        // Main shirt
        ctx.fillRect(this.x-3*s, this.y+20*s, 21*s, 12*s);
        // Collar
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x+2*s, this.y+20*s, 11*s, 2*s);
        
        // Stylized X logo
        ctx.fillStyle = '#FFFFFF';
        // Draw X with diagonal lines
        ctx.fillRect(this.x+4*s, this.y+22*s, 2*s, 8*s); // Left vertical line
        ctx.fillRect(this.x+9*s, this.y+22*s, 2*s, 8*s); // Right vertical line
        ctx.fillRect(this.x+4*s, this.y+25*s, 7*s, 2*s); // Top horizontal line
        ctx.fillRect(this.x+4*s, this.y+28*s, 7*s, 2*s); // Bottom horizontal line
        
        ctx.restore();
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
        
        // Create White House
        this.whiteHouse1 = new WhiteHouse();
        this.whiteHouse2 = new WhiteHouse();
        this.whiteHouse2.x = SCREEN_WIDTH + 400; // Position second White House further away
        
        // Create SpaceX rocket
        this.rocket = new SpaceXRocket();
        
        // Create debt counter
        this.nationalDebt = NATIONAL_DEBT;
        this.debtReduction = DEBT_REDUCTION;
        
        // Animation variables for start screen
        this.titleY = 150;
        this.titleDirection = 1;
        this.titleSpeed = 0.5;
        
        // Transformation threshold
        this.transformationThreshold = 30;
        this.transformed = false;

        // Announcement variables
        this.announcement = "";
        this.announcementTime = 0;

        // Add Trump and Musk characters with larger scale
        this.trump = new PixelatedTrump(SCREEN_WIDTH/2 - 150, SCREEN_HEIGHT - 280, 3);
        this.musk = new PixelatedMusk(SCREEN_WIDTH/2 + 90, SCREEN_HEIGHT - 280, 3);
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
        
        this.transformed = false;
    }

    updateScore() {
        scoreElement.textContent = `Score: ${this.score} | Debt: $${(this.nationalDebt / 1000000000000).toFixed(2)} trillion`;
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    update() {
        // Update rocket in all states
        this.rocket.update();
        
        // Update title animation on start screen
        if (this.state === GAME_STATE.START) {
            this.titleY += this.titleDirection * this.titleSpeed;
            if (this.titleY > 160 || this.titleY < 140) {
                this.titleDirection *= -1;
            }
            return;
        }
        
        if (this.state === GAME_STATE.GAME_OVER) return;

        const currentTime = Date.now();
        
        // Check for transformation
        if (this.score >= this.transformationThreshold && !this.transformed) {
            this.transformed = true;
            
            // Play transformation sound
            transformSound.currentTime = 0;
            transformSound.play().catch(e => console.log("Error playing transformation sound:", e));
            
            // Create player rocket at the same position as the truck, but adjust for the new dimensions
            this.playerRocket = new PlayerRocket(
                this.truck.x - 10, // Adjust x position to account for horizontal orientation
                this.truck.y + (this.truck.height - 25) / 2 // Center vertically
            );
            // Set the velocity to match the truck's velocity for smooth transition
            this.playerRocket.velocity = this.truck.velocity;
            
            // Add a tower immediately after transformation to continue gameplay
            if (this.towers.length === 0 || this.towers[this.towers.length - 1].x < SCREEN_WIDTH - 200) {
                this.towers.push(new EPABuilding());
                this.lastTower = currentTime;
            }
        }
        
        // Update player based on transformation state
        if (this.transformed) {
            this.playerRocket.update();
        } else {
            this.truck.update();
        }
        
        // Update White Houses (background)
        this.whiteHouse1.update();
        this.whiteHouse2.update();
        
        // Generate new towers
        if (currentTime - this.lastTower > PIPE_FREQUENCY) {
            if (this.transformed) {
                this.towers.push(new EPABuilding());
            } else {
                this.towers.push(new TrumpTower());
            }
            this.lastTower = currentTime;
        }

        // Update towers
        for (let i = this.towers.length - 1; i >= 0; i--) {
            const tower = this.towers[i];
            tower.update();
            
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
            const playerRect = this.transformed ? this.playerRocket.getRect() : this.truck.getRect();
            for (const towerRect of tower.getRects()) {
                if (this.checkCollision(playerRect, towerRect)) {
                    this.state = GAME_STATE.GAME_OVER;
                    return;
                }
            }
        }

        // Check if player is off screen
        if (this.transformed) {
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
            "Social Security Privatized! Keep Going!"
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
        
        // Create a semi-transparent panel for the title and game info
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(SCREEN_WIDTH/2 - 160, 80, 320, 200);
        
        // Add a border to the panel
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.strokeRect(SCREEN_WIDTH/2 - 160, 80, 320, 200);
        
        // Draw title with modern font and enhanced styling
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Draw title with modern font
        ctx.fillStyle = '#FF3D00';
        ctx.font = 'bold 52px "Roboto", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CyberFlap', SCREEN_WIDTH/2, 140);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw subtitle with modern font
        ctx.fillStyle = '#333';
        ctx.font = '18px "Roboto", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Take your Cybertruck on an adventure", SCREEN_WIDTH/2, 170);
        ctx.fillText("to help eliminate national debt", SCREEN_WIDTH/2, 195);
        
        // Draw divider line
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(SCREEN_WIDTH/2 - 120, 210);
        ctx.lineTo(SCREEN_WIDTH/2 + 120, 210);
        ctx.stroke();
        
        // Draw current debt
        ctx.fillStyle = '#006400';
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.fillText(`National Debt:`, SCREEN_WIDTH/2, 240);
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.fillText(`$${(this.nationalDebt / 1000000000000).toFixed(2)} trillion`, SCREEN_WIDTH/2, 270);
        
        // Draw Trump and Musk pixelated characters
        this.trump.draw();
        this.musk.draw();
        
        // Draw sample Cybertruck
        const truck = new Cybertruck();
        truck.x = SCREEN_WIDTH/2 - 35;
        truck.y = SCREEN_HEIGHT - 150;
        truck.draw();
        
        // Draw game controls panel at the bottom
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(SCREEN_WIDTH/2 - 100, SCREEN_HEIGHT - 80, 200, 50);
        
        // Draw controls text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to Start', SCREEN_WIDTH/2, SCREEN_HEIGHT - 55);
        
        // Draw controls hint
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText('Controls: SPACE to jump', SCREEN_WIDTH/2, SCREEN_HEIGHT - 35);
    }

    draw() {
        if (this.state === GAME_STATE.START) {
            this.drawStartScreen();
            return;
        }
        
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

        // Draw game objects
        if (this.transformed) {
            this.playerRocket.draw();
        } else {
            this.truck.draw();
        }
        
        for (const tower of this.towers) {
            tower.draw();
        }
        
        // Draw debt reduction animation if active
        if (this.showingDebtReduction && Date.now() - this.debtReductionTime < 1000) {
            ctx.fillStyle = 'rgba(0, 100, 0, ' + (1 - (Date.now() - this.debtReductionTime) / 1000) + ')';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('-$10 Billion', SCREEN_WIDTH/2, 100);
        } else {
            this.showingDebtReduction = false;
        }

        // Draw announcement if active - improved formatting
        if (this.announcement && Date.now() - this.announcementTime < 3000) {
            // Create a semi-transparent background panel
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            const textWidth = ctx.measureText(this.announcement).width;
            ctx.fillRect(SCREEN_WIDTH/2 - textWidth/2 - 20, 40, textWidth + 40, 40);
            
            // Add a border to the panel
            ctx.strokeStyle = '#FFD700'; // Gold border
            ctx.lineWidth = 2;
            ctx.strokeRect(SCREEN_WIDTH/2 - textWidth/2 - 20, 40, textWidth + 40, 40);
            
            // Draw the announcement text
            ctx.fillStyle = '#FFFFFF'; // White text
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.announcement, SCREEN_WIDTH/2, 60);
        }

        // Draw game over message with better styling
        if (this.state === GAME_STATE.GAME_OVER) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 50);
            
            ctx.font = '24px Arial';
            ctx.fillText(`You reduced the debt by $${(this.score * this.debtReduction / 1000000000).toFixed(1)} billion`, SCREEN_WIDTH/2, SCREEN_HEIGHT/2);
            
            ctx.font = '20px Arial';
            ctx.fillText('Press SPACE to restart', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 50);
        }
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
        } else if (game.state === GAME_STATE.GAME_OVER) {
            game.state = GAME_STATE.PLAYING;
            game.reset();
        } else {
            // Flap the appropriate player
            if (game.transformed) {
                // Ensure thruster effect is triggered
                game.playerRocket.thrusterFlare = game.playerRocket.maxThrusterFlare;
                game.playerRocket.flap();
                console.log("Rocket thruster activated!");
            } else {
                // Ensure thruster effect is triggered for truck too
                game.truck.thrusterFlare = game.truck.maxThrusterFlare;
                game.truck.flap();
                console.log("Truck thruster activated!");
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
    // Press 'D' key to toggle debug mode
    else if (event.code === 'KeyD') {
        DEBUG_MODE = !DEBUG_MODE;
        console.log("Debug mode:", DEBUG_MODE ? "ON" : "OFF");
    }
    // Press 'R' key to manually trigger thruster effect (for testing)
    else if (event.code === 'KeyR') {
        if (game.transformed && game.state === GAME_STATE.PLAYING) {
            game.playerRocket.thrusterFlare = game.playerRocket.maxThrusterFlare;
            game.playerRocket.flap();
            console.log("Manual thruster test activated!");
        } else if (game.state === GAME_STATE.PLAYING) {
            game.truck.thrusterFlare = game.truck.maxThrusterFlare;
            console.log("Manual truck thruster test activated!");
        }
    }
});

// Start the game
gameLoop(); 
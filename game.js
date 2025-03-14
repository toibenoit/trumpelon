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

// Helper function to draw pixelated numbers for chainsaw counter
function drawPixelatedNumber(ctx, number, x, y, pixelSize) {
    const digits = number.toString().split('');
    let currentX = x;
    
    // Define the pixel patterns for each digit (0-9)
    const digitPatterns = [
        // 0
        [
            [1, 1, 1],
            [1, 0, 1],
            [1, 0, 1],
            [1, 0, 1],
            [1, 1, 1]
        ],
        // 1
        [
            [0, 1, 0],
            [1, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [1, 1, 1]
        ],
        // 2
        [
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1],
            [1, 0, 0],
            [1, 1, 1]
        ],
        // 3
        [
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1]
        ],
        // 4
        [
            [1, 0, 1],
            [1, 0, 1],
            [1, 1, 1],
            [0, 0, 1],
            [0, 0, 1]
        ],
        // 5
        [
            [1, 1, 1],
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1]
        ],
        // 6
        [
            [1, 1, 1],
            [1, 0, 0],
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ],
        // 7
        [
            [1, 1, 1],
            [0, 0, 1],
            [0, 0, 1],
            [0, 0, 1],
            [0, 0, 1]
        ],
        // 8
        [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ],
        // 9
        [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1]
        ]
    ];
    
    // Draw each digit
    for (let i = 0; i < digits.length; i++) {
        const digit = parseInt(digits[i]);
        const pattern = digitPatterns[digit];
        
        // Draw the digit pattern
        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[0].length; col++) {
                if (pattern[row][col] === 1) {
                    ctx.fillRect(
                        currentX + col * pixelSize,
                        y + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
        
        // Move to the next digit position (with space between digits)
        currentX += pattern[0].length * pixelSize + pixelSize;
    }
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

    update(deltaTime = 1) {
        // The original logic for direct movement was commented out
        // We now rely on Game class to apply deltaTime-based movement
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

    update(deltaTime = 1) {
        // The original logic for direct movement was commented out
        // We now rely on Game class to apply deltaTime-based movement
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

    update(deltaTime = 1) {
        this.x -= this.speed * deltaTime;
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
    
    update(deltaTime = 1) {
        this.x -= this.speed * deltaTime;
        this.y -= (this.speed / 3) * deltaTime; // Moving diagonally upward
        this.flameAnimation = (this.flameAnimation + 0.2 * deltaTime) % 6; // Animate flame
        
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
        ctx.beginPath();
        ctx.arc(0, this.height/4, 3, 0, Math.PI * 2);
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
        this.flameAnimation = (this.flameAnimation + 1 * deltaTime) % 6;
        
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

class Chainsaw {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 90;  // Width for a longer blade
        this.height = 45;  // Height (handles only horizontal)
        this.collected = false;
        this.animationFrame = 0;  // For animation
        this.animationDirection = 1;  // 1 for up, -1 for down
        this.teethAnimation = 0;  // For animating the teeth
        this.teethAnimationSpeed = 0.2; // Fixed animation speed
    }

    update(deltaTime) {
        // Update movement with deltaTime passed from the Game class
        this.x -= PIPE_SPEED * deltaTime;
        
        // Update animations at a consistent rate
        const animationSpeed = 0.5; // Adjust as needed
        
        // Simple bobbing animation
        if (this.animationFrame > 10) this.animationDirection = -1;
        if (this.animationFrame < -10) this.animationDirection = 1;
        this.animationFrame += this.animationDirection * animationSpeed * deltaTime;
        
        // Animate the teeth (running chainsaw effect) - adjust for smoother animation
        this.teethAnimation += this.teethAnimationSpeed * deltaTime;
        if (this.teethAnimation >= 6) {
            this.teethAnimation = 0;
        }
    }

    draw() {
        if (this.collected) return;

        ctx.save();
        
        // Add a glowing effect around the chainsaw
        ctx.shadowColor = '#FF6600';
        ctx.shadowBlur = 10;
        
        // Apply bobbing animation
        const yOffset = this.animationFrame * 0.2;
        
        // Create a cleaner chainsaw design without the vertical handle
        
        // ENGINE HOUSING (Red/orange body)
        ctx.fillStyle = '#FF4400';
        // Main engine block
        ctx.fillRect(this.x + 10, this.y + 10 + yOffset, 25, 20);
        
        // ENGINE DETAILS
        // Black engine details
        ctx.fillStyle = '#222222';
        // Engine top detail
        ctx.fillRect(this.x + 15, this.y + 5 + yOffset, 15, 5);
        // Exhaust port
        ctx.fillRect(this.x + 30, this.y + 8 + yOffset, 5, 8);
        
        // HANDLE GRIP (horizontal part only)
        ctx.fillStyle = '#663300'; // Brown for wooden handle
        // Grip crossbar (horizontal part only)
        ctx.fillRect(this.x + 5, this.y + 20 + yOffset, 30, 10);
        
        // GUIDE BAR (extending from engine) - longer now
        ctx.fillStyle = '#777777';
        // Guide bar - increased length to 50
        ctx.fillRect(this.x + 35, this.y + 15 + yOffset, 50, 10);
        
        // CHAIN TEETH - more pronounced with animation
        // Base chain - increased length to 50
        ctx.fillStyle = '#444444';
        ctx.fillRect(this.x + 35, this.y + 14 + yOffset, 50, 12);
        
        // Animated teeth
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 12; i++) {  // Increased teeth count for longer blade
            // Calculate tooth position with animation
            const offset = (i + Math.floor(this.teethAnimation)) % 12;
            
            // Top teeth (bigger and more prominent)
            ctx.fillRect(
                this.x + 37 + offset * 4, 
                this.y + 12 + yOffset, 
                2, 
                3
            );
            
            // Bottom teeth
            ctx.fillRect(
                this.x + 37 + offset * 4, 
                this.y + 25 + yOffset, 
                2, 
                3
            );
            
            // Make some teeth look more like cutting teeth with diagonal shape
            if (i % 2 === 0) {
                ctx.fillRect(
                    this.x + 38 + offset * 4, 
                    this.y + 14 + yOffset, 
                    1, 
                    1
                );
                
                ctx.fillRect(
                    this.x + 38 + offset * 4, 
                    this.y + 24 + yOffset, 
                    1, 
                    1
                );
            }
        }
        
        // CONTROLS & DETAILS
        // Red power button on top of engine
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x + 12, this.y + 7 + yOffset, 5, 3);
        
        // OUTLINES to make it pop
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        
        // Engine outline
        ctx.strokeRect(this.x + 10, this.y + 10 + yOffset, 25, 20);
        
        // Guide bar outline - increased length to 50
        ctx.strokeRect(this.x + 35, this.y + 15 + yOffset, 50, 10);
        
        // Handle outline
        ctx.strokeRect(this.x + 5, this.y + 20 + yOffset, 30, 10);
        
        // Add tip of blade with curved nose - adjusted position
        ctx.fillStyle = '#777777';
        ctx.beginPath();
        ctx.arc(this.x + 85, this.y + 20 + yOffset, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

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
        
        // Transformation threshold
        this.transformationThreshold = 30;
        this.transformed = false;

        // Announcement variables
        this.announcement = "";
        this.announcementTime = 0;

        this.lastFrameTime = Date.now();
        
        // Chainsaw counter
        this.chainsawCount = 0;
        this.towersSpawned = 0;  // Add counter for towers spawned
        this.chainsaws = [];  // Array to store chainsaw objects
        
        // Stars for space background
        this.stars = [];
        this.generateStars();
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

    reset() {
        this.truck = new Cybertruck();
        this.towers = [];
        this.chainsaws = [];  // Reset chainsaws array
        this.lastTower = 0;
        this.score = 0;
        this.chainsawCount = 0;  // Reset chainsaw count
        this.towersSpawned = 0;  // Reset towers spawned counter
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
        
        // Reset stars for space background
        this.stars = [];
        this.generateStars();
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
        // Calculate delta time for frame-rate independent updates
        const now = Date.now();
        const deltaTime = Math.min((now - this.lastFrameTime) / 16.67, 2); // Cap at 2x normal time step
        this.lastFrameTime = now;
        
        // Update rocket in all states with deltaTime
        this.rocket.update(deltaTime);
        
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
        
        // Check for transformation
        if (this.score >= this.transformationThreshold && !this.transformed) {
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
        }
        
        // Update player based on transformation state
        if (this.transformed) {
            this.playerRocket.update();
        } else {
            this.truck.update();
        }
        
        // Update White Houses (background) with deltaTime
        this.whiteHouse1.update(deltaTime);
        this.whiteHouse2.update(deltaTime);
        
        // Generate new towers
        if (currentTime - this.lastTower > PIPE_FREQUENCY) {
            if (this.transformed) {
                this.towers.push(new EPABuilding());
            } else {
                this.towers.push(new TrumpTower());
            }
            this.lastTower = currentTime;
            this.towersSpawned++;
            
            // Spawn chainsaw after every 3rd tower
            if (this.towersSpawned % 3 === 0) {
                // Get the y position of the gap from the most recently spawned tower
                const latestTower = this.towers[this.towers.length - 1];
                const chainsaw = new Chainsaw(
                    SCREEN_WIDTH,
                    latestTower.gap_y  // Position in middle of gap
                );
                this.chainsaws.push(chainsaw);
                console.log("Spawned chainsaw at position:", chainsaw.x, chainsaw.y);
            }
        }

        // Update towers with delta time - FIXED MOVEMENT CODE
        for (let i = this.towers.length - 1; i >= 0; i--) {
            const tower = this.towers[i];
            tower.update(deltaTime); // Pass deltaTime to tower's update
            tower.x -= PIPE_SPEED * deltaTime; // This is the key line that actually moves towers
            
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
        
        // Update and check chainsaw collisions
        for (let i = this.chainsaws.length - 1; i >= 0; i--) {
            const chainsaw = this.chainsaws[i];
            chainsaw.update(deltaTime); // Pass deltaTime to chainsaw update
            
            // Remove chainsaw if off screen
            if (chainsaw.x + chainsaw.width < 0) {
                this.chainsaws.splice(i, 1);
                continue;
            }

            // Check for collection
            if (!chainsaw.collected) {
                const playerRect = this.transformed ? this.playerRocket.getRect() : this.truck.getRect();
                if (this.checkCollision(playerRect, chainsaw.getRect())) {
                    chainsaw.collected = true;
                    this.chainsawCount++;
                    console.log("Chainsaw collected! Count:", this.chainsawCount);
                    // Play collection sound
                    thrusterSound.currentTime = 0;
                    thrusterSound.play().catch(e => console.log("Error playing sound:", e));
                }
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
        
        // Draw stars if player has unlocked transformation
        if (this.score >= this.transformationThreshold) {
            this.drawStars();
        }
        
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

    drawChainsawCount() {
        const cornerX = 15;
        const cornerY = 35;
        
        // Draw small chainsaw icon
        ctx.save();
        
        // Add a subtle glow effect
        ctx.shadowColor = '#FF6600';
        ctx.shadowBlur = 5;
        
        const iconScale = 0.6;
        const iconX = cornerX;
        const iconY = cornerY;
        
        // Create a proper chainsaw (mini version)
        
        // ENGINE HOUSING (Red/orange body)
        ctx.fillStyle = '#FF4400';
        // Main engine block
        ctx.fillRect(iconX + 10 * iconScale, iconY + 10 * iconScale, 25 * iconScale, 20 * iconScale);
        
        // ENGINE DETAILS
        // Black engine details
        ctx.fillStyle = '#222222';
        // Engine top detail
        ctx.fillRect(iconX + 15 * iconScale, iconY + 5 * iconScale, 15 * iconScale, 5 * iconScale);
        // Exhaust port
        ctx.fillRect(iconX + 30 * iconScale, iconY + 8 * iconScale, 5 * iconScale, 8 * iconScale);
        
        // HANDLE GRIP (horizontal part only)
        ctx.fillStyle = '#663300'; // Brown for wooden handle
        // Grip crossbar (horizontal part only)
        ctx.fillRect(iconX + 5 * iconScale, iconY + 20 * iconScale, 30 * iconScale, 10 * iconScale);
        
        // GUIDE BAR (extending from engine) - longer now
        ctx.fillStyle = '#777777';
        // Guide bar - increased length
        ctx.fillRect(iconX + 35 * iconScale, iconY + 15 * iconScale, 45 * iconScale, 10 * iconScale);
        
        // CHAIN TEETH - simplified for small icon
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 10; i++) {
            // Top teeth
            ctx.fillRect(
                iconX + (38 + i * 4) * iconScale, 
                iconY + 13 * iconScale, 
                2 * iconScale, 
                2 * iconScale
            );
            
            // Bottom teeth
            ctx.fillRect(
                iconX + (38 + i * 4) * iconScale, 
                iconY + 25 * iconScale, 
                2 * iconScale, 
                2 * iconScale
            );
        }
        
        // Red power button
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(iconX + 12 * iconScale, iconY + 7 * iconScale, 5 * iconScale, 3 * iconScale);
        
        // OUTLINES to make it pop
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        
        // Engine outline
        ctx.strokeRect(iconX + 10 * iconScale, iconY + 10 * iconScale, 25 * iconScale, 20 * iconScale);
        
        // Guide bar outline - increased length
        ctx.strokeRect(iconX + 35 * iconScale, iconY + 15 * iconScale, 45 * iconScale, 10 * iconScale);
        
        // Handle outline
        ctx.strokeRect(iconX + 5 * iconScale, iconY + 20 * iconScale, 30 * iconScale, 10 * iconScale);
        
        // Add tip of blade with curved nose - adjusted position
        ctx.fillStyle = '#777777';
        ctx.beginPath();
        ctx.arc(iconX + 80 * iconScale, iconY + 20 * iconScale, 3 * iconScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Reset shadow before drawing number
        ctx.shadowBlur = 0;
        
        // Draw "x" symbol
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const xPos = iconX + 90 * iconScale;
        ctx.fillText('x', xPos, iconY + 20);
        
        // Draw pixelated number using our helper function
        ctx.fillStyle = '#FFFFFF';
        drawPixelatedNumber(ctx, this.chainsawCount, xPos + 15, iconY + 10, 2);
        
        ctx.restore();
    }

    draw() {
        if (this.state === GAME_STATE.START) {
            this.drawStartScreen();
            return;
        }
        
        // Draw sky gradient background
        ctx.fillStyle = this.gradient;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        // Draw stars in space background when transformed
        if (this.transformed) {
            this.drawStars();
        }
        
        // Draw rocket (in background)
        this.rocket.draw();
        
        // Draw ground
        ctx.fillStyle = '#8BC34A';
        ctx.fillRect(0, SCREEN_HEIGHT - 20, SCREEN_WIDTH, 20);
        
        // Draw game objects
        if (this.transformed) {
            this.playerRocket.draw();
        } else {
            this.truck.draw();
        }
        
        for (const tower of this.towers) {
            tower.draw();
        }
        
        // Draw chainsaws
        for (const chainsaw of this.chainsaws) {
            chainsaw.draw();
        }
        
        // Draw chainsaw count in corner
        this.drawChainsawCount();
        
        // Draw debt reduction animation if active
        if (this.showingDebtReduction && Date.now() - this.debtReductionTime < 1000) {
            ctx.fillStyle = 'rgba(0, 100, 0, ' + (1 - (Date.now() - this.debtReductionTime) / 1000) + ')';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('-$10 Billion', SCREEN_WIDTH/2, 100);
        } else {
            this.showingDebtReduction = false;
        }

        // Draw announcement if active
        if (this.announcement && Date.now() - this.announcementTime < 3000) {
            // Create a semi-transparent background for better readability
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            
            // Measure text width to ensure it fits
            ctx.font = 'bold 18px Arial';
            const textWidth = ctx.measureText(this.announcement).width;
            const padding = 10;
            
            // Draw background rectangle with padding
            ctx.fillRect(
                SCREEN_WIDTH/2 - textWidth/2 - padding, 
                15 - padding, 
                textWidth + padding * 2, 
                30
            );
            
            // Draw text centered on screen
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.fillText(this.announcement, SCREEN_WIDTH/2, 30);
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
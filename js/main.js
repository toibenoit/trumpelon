// Import necessary modules
import { Game } from './Game.js';
import { GAME_STATE } from './utils/Constants.js';

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

// Initialize game
const game = new Game(ctx);

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
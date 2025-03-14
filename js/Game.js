import { SCREEN_WIDTH, SCREEN_HEIGHT, PIPE_SPEED, PIPE_FREQUENCY, NATIONAL_DEBT, DEBT_REDUCTION, GAME_STATE } from './utils/Constants.js';
import { Chainsaw } from './entities/Chainsaw.js';
import { ChainsawCounter, ScoreCounter } from './ui/Counters.js';

export class Game {
    constructor(ctx) {
        this.ctx = ctx;
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
        
        // Initialize UI components
        this.scoreCounter = new ScoreCounter(this.score, this.nationalDebt);
        this.chainsawCounter = new ChainsawCounter(0);
        
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
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + twinkle * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
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
        
        // Reset UI components
        if (this.scoreCounter) {
            this.scoreCounter.update(this.score, this.nationalDebt);
        }
        
        if (this.chainsawCounter) {
            this.chainsawCounter.update(this.chainsawCount);
        }
    }

    updateScore() {
        if (this.scoreCounter) {
            this.scoreCounter.update(this.score, this.nationalDebt);
        }
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
                this.scoreCounter.showDebtReduction();

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
                    // Update the chainsaw counter UI
                    this.chainsawCounter.update(this.chainsawCount);
                    console.log("Chainsaw collected! Count:", this.chainsawCount);
                    // Play collection sound
                    thrusterSound.currentTime = 0;
                    thrusterSound.play().catch(e => console.log("Error playing sound:", e));
                }
            }
        }
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
        this.ctx.fillStyle = this.gradient;
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        // Draw stars if player has unlocked transformation
        if (this.score >= this.transformationThreshold) {
            this.drawStars();
        }
        
        // Draw rocket (in background)
        this.rocket.draw(this.ctx);
        
        // Draw ground
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(0, SCREEN_HEIGHT - 20, SCREEN_WIDTH, 20);
        
        // Draw White Houses (background)
        this.whiteHouse1.draw(this.ctx);
        this.whiteHouse2.draw(this.ctx);
        
        // Create a semi-transparent panel for the title
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.fillRect(SCREEN_WIDTH/2 - 160, 80, 320, 240);
        
        // Add a border to the panel
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(SCREEN_WIDTH/2 - 160, 80, 320, 240);
        
        // Draw title with shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;
        
        // Draw title
        this.ctx.fillStyle = '#FF3D00';
        this.ctx.font = 'bold 52px Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CyberFlap', SCREEN_WIDTH/2, 140);
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Draw subtitle
        this.ctx.fillStyle = '#333';
        this.ctx.font = '18px Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("Take your Cybertruck on an adventure", SCREEN_WIDTH/2, 180);
        this.ctx.fillText("to help eliminate national debt", SCREEN_WIDTH/2, 205);
        
        // Draw divider line
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(SCREEN_WIDTH/2 - 120, 225);
        this.ctx.lineTo(SCREEN_WIDTH/2 + 120, 225);
        this.ctx.stroke();
        
        // Draw current debt
        this.ctx.fillStyle = '#006400';
        this.ctx.font = 'bold 22px Arial, sans-serif';
        this.ctx.fillText(`National Debt:`, SCREEN_WIDTH/2, 255);
        this.ctx.font = 'bold 26px Arial, sans-serif';
        this.ctx.fillText(`$${(this.nationalDebt / 1000000000000).toFixed(2)} trillion`, SCREEN_WIDTH/2, 285);
        
        // Draw instruction
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 20px Arial, sans-serif';
        this.ctx.fillText('Press SPACE to Start', SCREEN_WIDTH/2, 350);
        
        // Draw Elon and Trump below the "Press SPACE to Start" text
        this.elon.draw(this.ctx, SCREEN_WIDTH/2 - 120, 380);  // Left of center, below text
        this.trump.draw(this.ctx, SCREEN_WIDTH/2 + 40, 380);  // Right of center, below text
        
        // Draw sample Cybertruck
        const truck = new Cybertruck();
        truck.x = SCREEN_WIDTH/2 - 35;
        truck.y = SCREEN_HEIGHT - 150;
        truck.draw(this.ctx);
        
        // Draw game controls
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(SCREEN_WIDTH/2 - 100, SCREEN_HEIGHT - 80, 200, 50);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial, sans-serif';
        this.ctx.fillText('Controls: SPACE to jump', SCREEN_WIDTH/2, SCREEN_HEIGHT - 55);
    }

    draw() {
        if (this.state === GAME_STATE.START) {
            this.drawStartScreen();
            return;
        }
        
        // Draw sky gradient background
        this.ctx.fillStyle = this.gradient;
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        // Draw stars in space background when transformed
        if (this.transformed) {
            this.drawStars();
        }
        
        // Draw rocket (in background)
        this.rocket.draw(this.ctx);
        
        // Draw ground
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(0, SCREEN_HEIGHT - 20, SCREEN_WIDTH, 20);
        
        // Draw game objects
        if (this.transformed) {
            this.playerRocket.draw(this.ctx);
        } else {
            this.truck.draw(this.ctx);
        }
        
        for (const tower of this.towers) {
            tower.draw(this.ctx);
        }
        
        // Draw chainsaws
        for (const chainsaw of this.chainsaws) {
            chainsaw.draw(this.ctx);
        }
        
        // Draw UI elements
        
        // Draw score and debt counter
        this.scoreCounter.draw(this.ctx, SCREEN_WIDTH);
        
        // Draw chainsaw count in corner
        this.chainsawCounter.draw(this.ctx);

        // Draw announcement if active
        if (this.announcement && Date.now() - this.announcementTime < 3000) {
            // Create a semi-transparent background for better readability
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            
            // Measure text width to ensure it fits
            this.ctx.font = 'bold 18px Arial';
            const textWidth = this.ctx.measureText(this.announcement).width;
            const padding = 10;
            
            // Draw background rectangle with padding
            this.ctx.fillRect(
                SCREEN_WIDTH/2 - textWidth/2 - padding, 
                15 - padding, 
                textWidth + padding * 2, 
                30
            );
            
            // Draw text centered on screen
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.announcement, SCREEN_WIDTH/2, 30);
        }

        // Draw game over message with better styling
        if (this.state === GAME_STATE.GAME_OVER) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 50);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`You reduced the debt by $${(this.score * this.debtReduction / 1000000000).toFixed(1)} billion`, SCREEN_WIDTH/2, SCREEN_HEIGHT/2);
            
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press SPACE to restart', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 50);
        }
    }
} 
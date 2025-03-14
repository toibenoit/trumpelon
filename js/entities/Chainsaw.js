import { PIPE_SPEED } from '../utils/Constants.js';

export class Chainsaw {
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

    draw(ctx) {
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
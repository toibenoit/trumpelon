import { drawPixelatedNumber } from '../utils/Helper.js';

export class ChainsawCounter {
    constructor(chainsawCount) {
        this.chainsawCount = chainsawCount;
    }

    draw(ctx) {
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

    // Update chainsaw count
    update(count) {
        this.chainsawCount = count;
    }
}

export class ScoreCounter {
    constructor(score, nationalDebt) {
        this.score = score;
        this.nationalDebt = nationalDebt;
        this.showingDebtReduction = false;
        this.debtReductionTime = 0;
    }

    update(score, nationalDebt) {
        this.score = score;
        this.nationalDebt = nationalDebt;
    }

    showDebtReduction() {
        this.debtReductionTime = Date.now();
        this.showingDebtReduction = true;
    }

    draw(ctx, screenWidth) {
        // Update external score element
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = `Score: ${this.score} | Debt: $${(this.nationalDebt / 1000000000000).toFixed(2)} trillion`;
        }

        // Draw debt reduction animation if active
        if (this.showingDebtReduction && Date.now() - this.debtReductionTime < 1000) {
            ctx.fillStyle = 'rgba(0, 100, 0, ' + (1 - (Date.now() - this.debtReductionTime) / 1000) + ')';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('-$10 Billion', screenWidth/2, 100);
        } else {
            this.showingDebtReduction = false;
        }
    }
} 
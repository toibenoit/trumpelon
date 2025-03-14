// Helper function to draw the SpaceX logo with proper styling
export function drawSpaceXLogo(ctx, x, y, scale = 1) {
    const fontSize = 10 * scale;
    
    // Use our custom font with fallbacks
    ctx.fillStyle = '#000000';
    ctx.font = `900 ${fontSize}px "SpaceXFont", "Helvetica Neue", "Roboto", "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw the logo text in all caps with slightly condensed letter spacing
    ctx.fillText('SPACEX', x, y);
}

// Helper function to draw pixelated numbers for counters
export function drawPixelatedNumber(ctx, number, x, y, pixelSize) {
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
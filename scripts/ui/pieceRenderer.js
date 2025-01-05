import { GRID } from '../config/constants.js';
import { COLORS, BLOCK_STYLE } from '../config/colors.js';

class PieceRenderer {
    static drawPiece(ctx, piece, x, y, scale = 1, alpha = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        piece.matrix.forEach((row, rowIndex) => {
            row.forEach((value, colIndex) => {
                if (value) {
                    this.drawBlock(
                        ctx,
                        colIndex * GRID,
                        rowIndex * GRID,
                        piece.type,
                        alpha
                    );
                }
            });
        });

        ctx.restore();
    }

    static drawBlock(ctx, x, y, type, alpha = 1) {
        const blockSize = GRID - 2;

        // Draw main block
        ctx.fillStyle = COLORS[type];
        ctx.globalAlpha = alpha;
        ctx.fillRect(x, y, blockSize, blockSize);

        // Draw border
        ctx.strokeStyle = alpha < 1 ? BLOCK_STYLE.ghostBorder : BLOCK_STYLE.border;
        ctx.lineWidth = BLOCK_STYLE.borderWidth;
        ctx.strokeRect(
            x + BLOCK_STYLE.borderWidth/2,
            y + BLOCK_STYLE.borderWidth/2,
            blockSize - BLOCK_STYLE.borderWidth,
            blockSize - BLOCK_STYLE.borderWidth
        );

        // Draw highlight
        ctx.fillStyle = BLOCK_STYLE.highlight;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + blockSize, y);
        ctx.lineTo(x + blockSize - 4, y + 4);
        ctx.lineTo(x + 4, y + 4);
        ctx.lineTo(x + 4, y + blockSize - 4);
        ctx.lineTo(x, y + blockSize);
        ctx.closePath();
        ctx.fill();

        // Draw shadow
        ctx.fillStyle = BLOCK_STYLE.shadow;
        ctx.beginPath();
        ctx.moveTo(x + blockSize, y);
        ctx.lineTo(x + blockSize, y + blockSize);
        ctx.lineTo(x, y + blockSize);
        ctx.lineTo(x + 4, y + blockSize - 4);
        ctx.lineTo(x + blockSize - 4, y + blockSize - 4);
        ctx.lineTo(x + blockSize - 4, y + 4);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1;
    }
}

export default PieceRenderer; 
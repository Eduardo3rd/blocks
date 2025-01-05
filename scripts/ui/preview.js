import PieceRenderer from './pieceRenderer.js';
import Piece from '../core/piece.js';

class PreviewSystem {
    constructor() {
        this.elements = {
            previewDisplay: document.getElementById('preview-display'),
            holdDisplay: document.getElementById('hold-display')
        };

        this.visible = {
            preview: true,
            hold: true
        };

        // Create canvases for preview and hold
        this.previewCanvas = document.createElement('canvas');
        this.holdCanvas = document.createElement('canvas');
        
        // Set canvas sizes
        this.previewCanvas.width = 100;
        this.previewCanvas.height = 300;
        this.holdCanvas.width = 100;
        this.holdCanvas.height = 100;
    }

    init() {
        console.log('=== Preview System Init ===');
        
        // Set up preview display
        const previewContainer = document.querySelector('.preview-piece-container');
        previewContainer.innerHTML = '';
        previewContainer.appendChild(this.previewCanvas);
        
        // Set up hold display
        const holdContainer = document.querySelector('.hold-piece-container');
        holdContainer.innerHTML = '';
        holdContainer.appendChild(this.holdCanvas);
        
        // Get contexts
        this.previewCtx = this.previewCanvas.getContext('2d');
        this.holdCtx = this.holdCanvas.getContext('2d');

        // Show displays
        this.showPreview();
        this.showHold();
        console.log('Preview system initialization complete');
    }

    updatePreviewQueue(queue) {
        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        
        const verticalSpacing = 50; // Decreased from 70 to fit more pieces
        const horizontalOffset = 30;
        
        queue.forEach((type, index) => {
            const piece = new Piece(type);
            PieceRenderer.drawPiece(
                this.previewCtx,
                piece,
                horizontalOffset,
                index * verticalSpacing + 10,
                0.8
            );
        });
    }

    updateHoldPiece(type) {
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (type) {
            const piece = new Piece(type);
            PieceRenderer.drawPiece(
                this.holdCtx,
                piece,
                20,
                20,
                0.8
            );
        }
    }

    showPreview() {
        if (this.elements.previewDisplay) {
            this.elements.previewDisplay.style.opacity = '1';
            this.visible.preview = true;
        }
    }

    hidePreview() {
        if (this.elements.previewDisplay) {
            this.elements.previewDisplay.style.opacity = '0';
            this.visible.preview = false;
        }
    }

    showHold() {
        if (this.elements.holdDisplay) {
            this.elements.holdDisplay.style.opacity = '1';
            this.visible.hold = true;
        }
    }

    hideHold() {
        if (this.elements.holdDisplay) {
            this.elements.holdDisplay.style.opacity = '0';
            this.visible.hold = false;
        }
    }

    reset() {
        // Clear canvases
        if (this.previewCtx) {
            this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        }
        if (this.holdCtx) {
            this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        }
    }

    isVisible(type) {
        return this.visible[type];
    }
}

export default new PreviewSystem();

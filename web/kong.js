// ============================================================
// Donkey Kong JS - Kong Character
// ============================================================

class Kong {
    constructor(game) {
        this.game = game;
        this.blockX = 2.5;
        this.blockY = 3;
        this.offsetX = 0;
        this.offsetY = 0;
        this.charAction = 'rollOrangeBarrel';
        this.frame = 0;
        this.frameName = 'kong-1';
        this.frameEvent = null;
        this.barrels = -1;
        this.belt = 0;
        this.switchBelt = 3;
        this.cycles = null; // for timed frames
        this.timerAccum = 0;
    }

    spawn(boardDef) {
        this.blockX = boardDef.kong.blockX;
        this.blockY = boardDef.kong.blockY;
        this.belt = (boardDef.kong.belt !== undefined) ? boardDef.kong.belt : null;
        this.switchBelt = (boardDef.kong.switchBelt !== undefined) ? boardDef.kong.switchBelt : null;
        this.offsetX = 0;
        // Initialize offsetY from floor offset like original
        const tx = Math.floor(this.blockX / 2);
        if (boardDef.map && boardDef.map[this.blockY] && boardDef.map[this.blockY][tx]) {
            this.offsetY = boardDef.map[this.blockY][tx].o - 1;
        } else {
            this.offsetY = 0;
        }
        if (boardDef.name === 'barrels') {
            this.charAction = 'rollWildBarrel';
            this.barrels = -1;
        } else {
            this.charAction = 'shakeArms';
        }
        this.frame = 0;
        this.frameName = 'kong-1';
        this.frameEvent = null;
        this.cycles = null;
        this.timerAccum = 0;
    }

    update() {
        const anims = this.game.anims.kong.sequence;

        // Cutscene animations (play once, stop on last frame)
        if (this.charAction === 'lostFloor' || this.charAction === 'kidnapLady' || this.charAction === 'kidnapConv') {
            const seq = anims[this.charAction];
            if (!seq || seq.length === 0) return;
            const step = seq[this.frame];
            this.frameName = 'kong-' + step.id;
            this.frameEvent = null;
            if (step.x !== undefined) this.offsetX += step.x;
            if (step.y !== undefined) this.offsetY += step.y;
            if (step.e !== undefined) this.frameEvent = step.e;
            if (this.frame < seq.length - 1) this.frame++;
            return;
        }

        // Conveyor belt movement
        const board = this.game.board;
        if (this.belt !== null && board &&
            getBlockType(board, this.blockX, this.blockY) === CONST.MAP_CONV_BELT) {
            const belts = this.game.belts;
            if (belts && belts[this.belt]) {
                if (belts[this.belt].direction === 'L') {
                    this.offsetX -= 2;
                } else {
                    this.offsetX += 2;
                }
                if (this.blockX > 0 && this.offsetX < 0) {
                    this.blockX--;
                    this.offsetX += CONST.BLOCK_WIDTH;
                } else if (this.offsetX > CONST.BLOCK_WIDTH) {
                    this.blockX++;
                    this.offsetX -= CONST.BLOCK_WIDTH;
                }
                if (this.blockX === 3 && this.offsetX <= 0) {
                    belts[this.belt].direction = 'R';
                    if (this.switchBelt !== null && belts[this.switchBelt]) {
                        belts[this.switchBelt].direction =
                            (belts[this.switchBelt].direction === 'R') ? 'L' : 'R';
                    }
                } else if (this.blockX === 19 && this.offsetX >= 0) {
                    belts[this.belt].direction = 'L';
                }
            }
            return;
        }

        // Normal animation (barrel rolling, shakeArms, etc.)
        const seq = anims[this.charAction];
        if (!seq || seq.length === 0) return;

        const step = seq[this.frame % seq.length];
        this.frameName = 'kong-' + step.id;
        this.frameEvent = null;

        if (step.t !== undefined) {
            // Timed frame: fire event on FIRST tick (matching original)
            if (this.cycles === null) {
                this.cycles = Math.max(1, Math.floor(step.t / this.game.speed));
                if (step.e) this.frameEvent = step.e;
            } else {
                this.cycles--;
            }
        } else {
            // Non-timed frame: advance immediately
            this.cycles = 0;
            if (step.e) this.frameEvent = step.e;
        }

        if (this.cycles === 0) {
            this.frame++;
            if (this.frame >= seq.length) this.frame = 0;
            this.cycles = null;
        }
    }

    getPixelX() {
        return (this.blockX * CONST.BLOCK_WIDTH) + this.offsetX;
    }

    getPixelY() {
        return (this.blockY * CONST.BLOCK_HEIGHT) + this.offsetY;
    }
}

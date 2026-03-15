// ============================================================
// Donkey Kong JS - Jumpman (Mario) Character
// Faithfully ported from charJumpman.brs
// ============================================================

class Jumpman {
    isHammerAction() {
        return this.charAction.startsWith('hit') ||
               this.charAction.startsWith('hor') ||
               this.charAction.startsWith('hbr');
    }

    constructor(game) {
        this.game = game;
        this.STATE_STOP = 0;
        this.STATE_MOVE = 1;
        this.STATE_JUMP = 2;
        this.STATE_FALL = 3;
        this.alive = false;
        this.immortal = false;
        this.lives = CONST.START_LIVES;
        this.score = 0;
        this.scoreLife = 0;
        this.hammer = null;
        this.platform = null;
        this.blockX = 5;
        this.blockY = 13;
        this.offsetX = 0;
        this.offsetY = 0;
        this.charAction = 'runRight';
        this.frameName = 'mario-52';
        this.frame = 0;
        this.state = this.STATE_STOP;
        this.jump = CONST.ACT_NONE;
        this.startY = 0;
        this.dying = false;
    }

    spawn(boardDef) {
        this.blockX = boardDef.jumpman.blockX;
        this.blockY = boardDef.jumpman.blockY;
        this.offsetX = 0;
        this.offsetY = getFloorOffset(this.game.board, this.blockX, this.blockY);
        this.charAction = 'runRight';
        this.frameName = 'mario-52';
        this.frame = 0;
        this.state = this.STATE_STOP;
        this.platform = null;
        this.hammer = null;
        this.jump = CONST.ACT_NONE;
        this.startY = 0;
        this.dying = false;
    }

    getPixelX() {
        return (this.blockX * CONST.BLOCK_WIDTH) + this.offsetX;
    }

    getPixelY() {
        return (this.blockY * CONST.BLOCK_HEIGHT) + this.offsetY;
    }

    getCollisionRect() {
        const px = this.getPixelX();
        const py = this.getPixelY();
        // Collision box relative to bottom-left of sprite
        return { x: px, y: py - 12, w: 16, h: 16 };
    }

    frameOffsetX() {
        let ps = '';
        if (this.isHammerAction()) {
            ps = this.hammer && this.hammer.up ? 'Up' : 'Dn';
        }
        const anims = this.game.anims.mario.sequence;
        const seq = anims[this.charAction + ps];
        if (!seq || this.frame >= seq.length) return 0;
        return seq[this.frame].x || 0;
    }

    frameOffsetY() {
        let ps = '';
        if (this.isHammerAction()) {
            ps = this.hammer && this.hammer.up ? 'Up' : 'Dn';
        }
        const anims = this.game.anims.mario.sequence;
        const seq = anims[this.charAction + ps];
        if (!seq || this.frame >= seq.length) return 0;
        return seq[this.frame].y || 0;
    }

    update() {
        if (!this.alive) return;
        const board = this.game.board;

        // Handle hammer timer
        if (this.hammer) {
            this.hammer.timer--;
            if (this.hammer.timer <= 0) {
                const wasHammer = this.charAction.startsWith('hit') ||
                                  this.charAction.startsWith('hor') ||
                                  this.charAction.startsWith('hbr');
                this.hammer = null;
                if (wasHammer) {
                    this.charAction = this.charAction.includes('Left') ? 'runLeft' : 'runRight';
                    this.frame = 0;
                }
            }
        }

        // Determine action from input
        let action = CONST.ACT_NONE;
        if (this.state > this.STATE_MOVE) {
            action = CONST.ACT_NONE;
        } else if (Keys.jump && Keys.right && !this.hammer) {
            action = CONST.ACT_JUMP_RIGHT;
        } else if (Keys.jump && Keys.left && !this.hammer) {
            action = CONST.ACT_JUMP_LEFT;
        } else if (Keys.jump && !this.hammer) {
            action = CONST.ACT_JUMP_UP;
        } else if (Keys.up && !this.hammer) {
            action = CONST.ACT_CLIMB_UP;
        } else if (Keys.down && !this.hammer) {
            action = CONST.ACT_CLIMB_DOWN;
        } else if (Keys.left) {
            action = CONST.ACT_RUN_LEFT;
        } else if (Keys.right) {
            action = CONST.ACT_RUN_RIGHT;
        }

        this.move(action);
        this.frameUpdate();
    }

    move(action) {
        const board = this.game.board;
        let upBlock = null;
        let downBlock = null;
        const curBlock = getBlockType(board, this.blockX, this.blockY);
        if (this.blockY > 0) upBlock = getBlockType(board, this.blockX, this.blockY - 1);
        if (this.blockY < CONST.BLOCKS_Y - 1) downBlock = getBlockType(board, this.blockX, this.blockY + 1);

        if (this.state < this.STATE_JUMP) this.state = this.STATE_STOP;

        if (action === CONST.ACT_CLIMB_UP) {
            const curFloor = getFloorOffset(board, this.blockX, this.blockY);
            if (this.charAction === 'climbUp' && this.frame === 11) {
                this.offsetY = getFloorOffset(board, this.blockX, this.blockY);
                this.charAction = 'stand';
                this.state = this.STATE_STOP;
            } else if (isTopLadder(curBlock) ||
                       (isBottomLadder(curBlock) && curFloor !== this.offsetY) ||
                       (isLadder(downBlock) && this.offsetY > curFloor && !isTileEmpty(curBlock)) ||
                       (curFloor === 0 && isLadder(upBlock))) {
                if (this.charAction !== 'runUpDown' && this.charAction !== 'climbUp') {
                    this.charAction = 'runUpDown';
                    this.frame = 0;
                }
                this.state = this.STATE_MOVE;
                this.offsetX = -7;
                this.offsetY -= this.frameOffsetY();
                if (this.offsetY < 0) {
                    this.blockY--;
                    this.offsetY += CONST.BLOCK_HEIGHT;
                }
                const upFloor = getFloorOffset(board, this.blockX, this.blockY - 1);
                if (this.charAction !== 'climbUp' &&
                    ((isFloorUp(upBlock) && upFloor > 0) || (isFloorUp(curBlock) && curFloor === 0))) {
                    const limitY = curFloor === 0 ? CONST.BLOCK_HEIGHT - 6 : upFloor - 6;
                    if (this.offsetY <= limitY) {
                        this.charAction = 'climbUp';
                        this.frame = 0;
                    }
                }
            }
        } else if (action === CONST.ACT_CLIMB_DOWN) {
            const curFloor = getFloorOffset(board, this.blockX, this.blockY);
            if (isLadder(downBlock) || (isLadder(curBlock) && (this.offsetY < curFloor || curFloor === -1))) {
                if (this.charAction !== 'climbDown' && this.charAction !== 'runUpDown') {
                    this.charAction = 'climbDown';
                    this.frame = 0;
                } else if (this.charAction === 'climbDown' && this.frame === 11) {
                    this.charAction = 'runUpDown';
                    this.frame = 0;
                }
                this.state = this.STATE_MOVE;
                this.offsetX = -7;
                this.offsetY += this.frameOffsetY();
                if (this.offsetY >= CONST.BLOCK_HEIGHT) {
                    this.blockY++;
                    this.offsetY -= CONST.BLOCK_HEIGHT;
                }
            } else if (this.charAction === 'runUpDown') {
                this.state = this.STATE_MOVE;
                this.charAction = 'stand';
                this.frame = 0;
            }
        } else if (action === CONST.ACT_RUN_LEFT) {
            if (this.offsetY === getFloorOffset(board, this.blockX, this.blockY)) {
                if (!this.hammer && this.charAction !== 'runLeft') {
                    this.charAction = 'runLeft';
                    this.frame = 0;
                } else if (this.hammer && this.charAction !== this.hammer.color + 'Left') {
                    this.charAction = this.hammer.color + 'Left';
                    this.frame = 0;
                }
                if (getBlockType(board, this.blockX - 1, this.blockY) !== CONST.MAP_INV_WALL || this.offsetX > 0) {
                    this.state = this.STATE_MOVE;
                    this.offsetX -= this.frameOffsetX();
                    if (this.blockX > 0 && this.offsetX <= -CONST.BLOCK_WIDTH) {
                        this.blockX--;
                        this.offsetX += CONST.BLOCK_WIDTH;
                    }
                    if (downBlock !== null) downBlock = getBlockType(board, this.blockX, this.blockY + 1);
                    if (getFloorOffset(board, this.blockX, this.blockY) === -1 || isTileEmpty(getBlockType(board, this.blockX, this.blockY))) {
                        if (isTileEmpty(downBlock)) {
                            this.startFall();
                        } else if (downBlock !== null) {
                            const newFloor = getFloorOffset(board, this.blockX, this.blockY + 1);
                            if (this.offsetY + newFloor > CONST.BLOCK_HEIGHT) {
                                this.startFall();
                            } else {
                                this.blockY++;
                                this.offsetY = newFloor;
                            }
                        }
                    } else {
                        this.offsetY = getFloorOffset(board, this.blockX, this.blockY);
                        if (this.offsetY < 0 && this.blockY > 0) {
                            this.blockY--;
                            this.offsetY = getFloorOffset(board, this.blockX, this.blockY);
                        }
                    }
                }
            }
        } else if (action === CONST.ACT_RUN_RIGHT) {
            if (this.offsetY === getFloorOffset(board, this.blockX, this.blockY)) {
                if (!this.hammer && this.charAction !== 'runRight') {
                    this.charAction = 'runRight';
                    this.frame = 0;
                } else if (this.hammer && this.charAction !== this.hammer.color + 'Right') {
                    this.charAction = this.hammer.color + 'Right';
                    this.frame = 0;
                }
                if (this.blockX < CONST.BLOCKS_X - 1 || this.offsetX < -(CONST.BLOCK_WIDTH / 4)) {
                    this.state = this.STATE_MOVE;
                    this.offsetX += this.frameOffsetX();
                    if (this.offsetX >= CONST.BLOCK_WIDTH / 4) {
                        this.blockX++;
                        this.offsetX -= CONST.BLOCK_WIDTH;
                    }
                    if (downBlock !== null) downBlock = getBlockType(board, this.blockX, this.blockY + 1);
                    if (getFloorOffset(board, this.blockX, this.blockY) === -1 || isTileEmpty(getBlockType(board, this.blockX, this.blockY))) {
                        if (isTileEmpty(downBlock)) {
                            this.startFall();
                        } else if (downBlock !== null) {
                            const newFloor = getFloorOffset(board, this.blockX, this.blockY + 1);
                            if (this.offsetY + newFloor > CONST.BLOCK_HEIGHT) {
                                this.startFall();
                            } else {
                                this.blockY++;
                                this.offsetY = newFloor;
                            }
                        }
                    } else {
                        this.offsetY = getFloorOffset(board, this.blockX, this.blockY);
                        if (this.offsetY < 0 && this.blockY > 0) {
                            this.blockY--;
                            this.offsetY = getFloorOffset(board, this.blockX, this.blockY);
                        }
                    }
                }
            }
        } else if (action === CONST.ACT_JUMP_UP) {
            if (this.offsetY === getFloorOffset(board, this.blockX, this.blockY)) {
                if (!this.charAction.startsWith('jump')) {
                    this.charAction = (this.charAction === 'runLeft') ? 'jumpLeft' : 'jumpRight';
                    this.frame = 0;
                }
                this.jump = action;
                this.state = this.STATE_JUMP;
                this.startY = (this.blockY * CONST.BLOCK_HEIGHT) + this.offsetY;
                audioManager.play('jump');
            }
        } else if (action === CONST.ACT_JUMP_LEFT) {
            if (this.offsetY === getFloorOffset(board, this.blockX, this.blockY)) {
                if (this.blockX > 0 || this.offsetX >= 0) {
                    if (!this.charAction.startsWith('jump')) {
                        this.charAction = (this.charAction === 'runLeft') ? 'jumpLeft' : 'jumpRight';
                        this.frame = 0;
                    }
                    this.jump = action;
                    this.state = this.STATE_JUMP;
                    this.startY = (this.blockY * CONST.BLOCK_HEIGHT) + this.offsetY;
                    audioManager.play('jump');
                }
            }
        } else if (action === CONST.ACT_JUMP_RIGHT) {
            if (this.offsetY === getFloorOffset(board, this.blockX, this.blockY)) {
                if (this.blockX < CONST.BLOCKS_X - 1 || this.offsetX < -(CONST.BLOCK_WIDTH / 4)) {
                    if (!this.charAction.startsWith('jump')) {
                        this.charAction = (this.charAction === 'runLeft') ? 'jumpLeft' : 'jumpRight';
                        this.frame = 0;
                    }
                    this.jump = action;
                    this.state = this.STATE_JUMP;
                    this.startY = (this.blockY * CONST.BLOCK_HEIGHT) + this.offsetY;
                    audioManager.play('jump');
                }
            }
        }

        // Update jump
        if (this.state === this.STATE_JUMP) {
            const curFloor = getFloorOffset(board, this.blockX, this.blockY);
            if (this.frame > 0 && (isFloorDown(curBlock) || (isElevator(curBlock) && curFloor >= 0)) && this.offsetY >= curFloor && this.offsetY - curFloor <= 4) {
                if (this.charAction === 'jumpLeft') {
                    this.charAction = 'runLeft';
                } else {
                    this.charAction = 'runRight';
                }
                this.frame = 2;
                this.state = this.STATE_MOVE;
                if (isElevator(curBlock)) {
                    this.platform = getPlatform(board, this.blockX, this.blockY);
                } else {
                    this.platform = null;
                }
                this.offsetY = curFloor;
                const fallHeight = ((this.blockY * CONST.BLOCK_HEIGHT) + this.offsetY) - this.startY;
                if (fallHeight >= CONST.BLOCK_HEIGHT) {
                    this.alive = this.immortal;
                }
                if (this.alive && this.hammer) {
                    this.charAction = this.hammer.color + (this.charAction.includes('Left') ? 'Left' : 'Right');
                    this.frame = 0;
                }
            } else {
                if (this.jump !== CONST.ACT_JUMP_UP) {
                    if (this.jump === CONST.ACT_JUMP_LEFT) {
                        this.offsetX -= this.frameOffsetX();
                        if (this.offsetX <= -(CONST.BLOCK_WIDTH / 4)) {
                            this.blockX--;
                            this.offsetX += CONST.BLOCK_WIDTH;
                        }
                    } else {
                        this.offsetX += this.frameOffsetX();
                        if (this.offsetX >= CONST.BLOCK_WIDTH / 4) {
                            this.blockX++;
                            this.offsetX -= CONST.BLOCK_WIDTH;
                        }
                    }
                    const actionArray = this.game.anims.mario.sequence[this.charAction];
                    if (actionArray) {
                        if (this.jump === CONST.ACT_JUMP_LEFT && getBlockType(board, this.blockX, this.blockY) === CONST.MAP_INV_WALL) {
                            this.jump = CONST.ACT_JUMP_RIGHT;
                            this.frame = (actionArray.length - 1) - this.frame;
                        } else if (this.jump === CONST.ACT_JUMP_RIGHT && getBlockType(board, this.blockX + 1, this.blockY) === CONST.MAP_INV_WALL) {
                            this.jump = CONST.ACT_JUMP_LEFT;
                            this.frame = (actionArray.length - 1) - this.frame;
                        }
                    }
                }
                this.offsetY -= this.frameOffsetY();
                if (this.offsetY < 0) {
                    this.blockY--;
                    this.offsetY += CONST.BLOCK_HEIGHT;
                } else if (this.offsetY >= CONST.BLOCK_HEIGHT) {
                    this.blockY++;
                    this.offsetY -= CONST.BLOCK_HEIGHT;
                }
            }
        } else if (this.state === this.STATE_FALL) {
            // Update fall
            const curFloor = getFloorOffset(board, this.blockX, this.blockY);
            if (isFloorDown(curBlock) && this.offsetY >= curFloor && this.offsetY - curFloor <= 4) {
                this.frame = 0;
                this.state = this.STATE_MOVE;
                this.offsetY = curFloor;
                const fallHeight = ((this.blockY * CONST.BLOCK_HEIGHT) + this.offsetY) - this.startY;
                if (fallHeight >= CONST.BLOCK_HEIGHT) {
                    this.alive = this.immortal;
                    if (this.charAction.endsWith('Left')) {
                        this.charAction = 'landLeft';
                    } else {
                        this.charAction = 'landRight';
                    }
                }
            } else {
                this.offsetX = -8;
                this.offsetY += 2;
                if (this.offsetY >= CONST.BLOCK_HEIGHT) {
                    this.blockY++;
                    this.offsetY -= CONST.BLOCK_HEIGHT;
                    if (this.offsetY < 2) this.offsetY = 0;
                }
            }
        }

        // Conveyor belt - apply after all other movement logic
        // Only apply when standing on the belt and not actively running
        if (getBlockType(board, this.blockX, this.blockY) === CONST.MAP_CONV_BELT &&
            this.offsetY === getFloorOffset(board, this.blockX, this.blockY) &&
            this.state !== this.STATE_JUMP && this.state !== this.STATE_FALL &&
            action !== CONST.ACT_RUN_LEFT && action !== CONST.ACT_RUN_RIGHT) {
            const direction = this.game.getConveyorDir(this.blockX, this.blockY);
            if (direction === 'R') {
                this.offsetX += 2;
                if (this.offsetX >= CONST.BLOCK_WIDTH / 4) {
                    this.blockX++;
                    this.offsetX -= CONST.BLOCK_WIDTH;
                }
            } else if (direction === 'L' && this.blockX > 0) {
                this.offsetX -= 2;
                if (this.offsetX <= -(CONST.BLOCK_WIDTH / 2)) {
                    this.blockX--;
                    this.offsetX += CONST.BLOCK_WIDTH;
                }
            }
        }

        // Bounds check
        if (this.blockY >= CONST.BLOCKS_Y || this.blockY < 0) {
            this.alive = this.immortal;
        }
    }

    startFall() {
        this.startY = (this.blockY * CONST.BLOCK_HEIGHT) + this.offsetY;
        this.state = this.STATE_FALL;
    }

    frameUpdate() {
        if (this.isHammerAction()) {
            const ps = (this.hammer && this.hammer.up) ? 'Up' : 'Dn';
            const anims = this.game.anims.mario.sequence;
            const actionArray = anims[this.charAction + ps];
            if (actionArray) {
                if (this.state !== this.STATE_STOP) {
                    this.frameName = 'mario-' + actionArray[this.frame % actionArray.length].id;
                } else {
                    this.frameName = 'mario-' + actionArray[2 % actionArray.length].id;
                }
                this.frame++;
                if (((this.frame + 1) % 4) === 0 && this.hammer) {
                    this.hammer.up = !this.hammer.up;
                }
                if (this.frame >= actionArray.length) this.frame = 0;
            }
        } else if (this.state !== this.STATE_STOP && this.state !== this.STATE_FALL) {
            const anims = this.game.anims.mario.sequence;
            const actionArray = anims[this.charAction];
            if (actionArray) {
                this.frameName = 'mario-' + actionArray[this.frame % actionArray.length].id;
                this.frame++;
                if (this.frame >= actionArray.length) {
                    if (this.state === this.STATE_MOVE) {
                        this.frame = 0;
                    } else {
                        this.frame = actionArray.length - 1;
                    }
                }
            }
        }
    }

    startDeath() {
        this.dying = true;
        this.charAction = this.charAction.includes('Left') ? 'dieLeft' : 'dieRight';
        this.frame = 0;
    }

    updateDeathAnim() {
        const anims = this.game.anims.mario.sequence;
        const actionArray = anims[this.charAction];
        if (!actionArray) return;
        this.frameName = 'mario-' + actionArray[this.frame % actionArray.length].id;
        if (this.frame < actionArray.length - 1) {
            this.frame++;
        }
    }

    pickupHammer(color) {
        const prefix = color || 'hit';
        this.hammer = {
            color: prefix,
            timer: CONST.HAMMER_TIME,
            up: true
        };
        this.charAction = prefix + (this.charAction.includes('Left') ? 'Left' : 'Right');
        this.frame = 0;
        audioManager.play('get-item');
    }
}

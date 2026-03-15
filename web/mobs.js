// ============================================================
// Donkey Kong JS - Enemies: Barrels, Fire Characters, Springs, Cement
// ============================================================

class Barrel {
    constructor(game, color, action) {
        this.game = game;
        this.MOVE_LEFT = 0;
        this.MOVE_RIGHT = 1;
        this.MOVE_FALL = 2;
        this.color = color;
        this.action = action;
        this.name = color + 'b-rolling';
        this.frame = 0;
        this.frameCycles = null;
        this.visible = true;
        this.collide = true;
        this.onLadder = false;
        this.lastY = 0;
        this.wild = 0;
        this.wx = null;
        this.bounce = 0;
        this._jumped = false;
        this.scoreTimer = 0;
        this.scoreValue = 0;
        this.destroyed = false;

        const board = game.board;
        const kong = game.kong;

        if (action === CONST.BARREL_ROLL) {
            this.animation = 'barrel-roll-' + color;
            this.frameName = this.name + '-1';
            this.blockX = kong.blockX + 4.5;
            this.blockY = kong.blockY;
            this.offsetX = CONST.BLOCK_WIDTH / 2;
            this.offsetY = getFloorOffset(board, Math.floor(this.blockX), this.blockY);
            this.cx = 6; this.cy = 4; this.cw = 12; this.ch = 12;
            this.move = this.MOVE_RIGHT;
            this.wild = 0;
        } else {
            this.animation = 'barrel-fall-' + color;
            this.frameName = this.name + '-5';
            this.blockX = kong.blockX + 1.5;
            this.blockY = kong.blockY;
            this.offsetX = CONST.BLOCK_WIDTH / 2 + 2;
            this.offsetY = getFloorOffset(board, Math.floor(this.blockX), this.blockY) - 11;
            this.cx = 6; this.cy = 4; this.cw = 20; this.ch = 12;
            this.move = this.MOVE_FALL;
            const diff = game.difficulty.level;
            if (kong.barrels === 0) {
                this.wx = (game.currentLevel === 1) ? 0 : 3;
                this.wild = 0;
            } else if (diff <= 2) {
                this.wild = 1;
            } else if (diff <= 4) {
                this.wild = 2;
            } else {
                this.wild = 3;
            }
        }

        this.sprite = { data: 'barrel-' + color };
    }

    getPixelX() {
        return Math.floor(this.blockX) * CONST.BLOCK_WIDTH + this.offsetX;
    }

    getPixelY() {
        return Math.floor(this.blockY) * CONST.BLOCK_HEIGHT + this.offsetY;
    }

    getCollisionRect() {
        const px = this.getPixelX();
        const py = this.getPixelY();
        return { x: px + this.cx, y: py + this.cy, w: this.cw, h: this.ch };
    }

    update(jumpmanX, jumpmanY) {
        if (this.destroyed) return;
        if (this.scoreTimer > 0) {
            this.scoreTimer--;
            if (this.scoreTimer <= 0) this.destroyed = true;
            return;
        }

        const board = this.game.board;
        const bx = Math.floor(this.blockX);
        const curBlock = getBlockType(board, bx, Math.floor(this.blockY));
        let downBlock = null;
        if (this.blockY < CONST.BLOCKS_Y - 1) {
            downBlock = getBlockType(board, bx, Math.floor(this.blockY) + 1);
        }

        if (this.move < this.MOVE_FALL) {
            const curFloor = getFloorOffset(board, bx, Math.floor(this.blockY));
            if ((isAnyLadder(curBlock) && this.offsetY < curFloor) ||
                (isAnyLadder(downBlock) && this.takeLadder(jumpmanX, jumpmanY))) {
                if (this.animation.includes('roll')) {
                    this.animation = this.animation.replace('roll', 'fall');
                    this.frameName = this.name + '-5';
                    this.cw = 20;
                    this.frame = 0;
                    this.move = (this.move === this.MOVE_LEFT) ? this.MOVE_RIGHT : this.MOVE_LEFT;
                    this.onLadder = true;
                }
                this.offsetX = -8;
                this.offsetY += 4;
                if (this.offsetY >= CONST.BLOCK_HEIGHT) {
                    this.blockY++;
                    this.offsetY -= CONST.BLOCK_HEIGHT;
                }
                const dnBlk = (this.blockY < 13) ? getBlockType(board, bx, Math.floor(this.blockY) + 1) : null;
                const nf = getFloorOffset(board, bx, Math.floor(this.blockY));
                if (!isAnyLadder(dnBlk) && this.offsetY > nf && nf >= 0) {
                    this.offsetY = nf;
                }
            } else if (this.offsetY === curFloor) {
                if (this.animation.includes('fall')) {
                    this.animation = this.animation.replace('fall', 'roll');
                    this.frameName = this.name + '-1';
                    this.cw = 12;
                    this.frame = 0;
                    this.onLadder = false;
                }
                if (this.move === this.MOVE_RIGHT) {
                    this.offsetX += 4;
                    if (this.offsetX >= CONST.BLOCK_WIDTH / 4) {
                        this.blockX++;
                        this.offsetX -= CONST.BLOCK_WIDTH;
                    }
                } else {
                    this.offsetX -= 4;
                    if (this.blockX > 0 && this.offsetX <= -CONST.BLOCK_WIDTH) {
                        this.blockX--;
                        this.offsetX += CONST.BLOCK_WIDTH;
                    }
                }
                // Re-check block after move
                const nbx = Math.floor(this.blockX);
                if (Math.floor(this.blockY) < CONST.BLOCKS_Y - 1) downBlock = getBlockType(board, nbx, Math.floor(this.blockY) + 1);
                const nFloor = getFloorOffset(board, nbx, Math.floor(this.blockY));
                if (nFloor === -1 || isTileEmpty(getBlockType(board, nbx, Math.floor(this.blockY)))) {
                    if (isTileEmpty(downBlock)) {
                        this.move = this.MOVE_FALL;
                    } else if (downBlock != null) {
                        const newFloor = getFloorOffset(board, nbx, Math.floor(this.blockY) + 1);
                        if (this.offsetY + newFloor > CONST.BLOCK_HEIGHT) {
                            this.move = this.MOVE_FALL;
                        } else {
                            this.blockY++;
                            this.offsetY = newFloor;
                        }
                    }
                } else if (this.offsetY !== nFloor && nFloor >= 0) {
                    this.offsetY = nFloor;
                }
            }
        }

        // Wild barrel falling
        if (this.action === CONST.BARREL_WILD && this.move === this.MOVE_FALL) {
            const bxf = Math.floor(this.blockX);
            const curFloor = getFloorOffset(board, bxf, Math.floor(this.blockY));
            if (this.blockY < CONST.BLOCKS_Y - 1 || this.offsetY < curFloor) {
                if (isFloorDown(getBlockType(board, bxf, Math.floor(this.blockY))) && this.offsetY >= curFloor) {
                    if (this.wild > 0 && this.blockY > this.lastY) {
                        this.setWildOffset(jumpmanX);
                        this.lastY = Math.floor(this.blockY);
                    }
                    this.offsetY += 2;
                } else {
                    this.offsetY += 6;
                }
                if (this.offsetY >= CONST.BLOCK_HEIGHT) {
                    this.blockY++;
                    this.offsetY -= CONST.BLOCK_HEIGHT;
                    if (this.offsetY < 2) this.offsetY = 0;
                }
                if (this.wx == null) this.setWildOffset(jumpmanX);
                this.offsetX += this.wx;
                if (this.offsetX >= CONST.BLOCK_WIDTH / 4) {
                    this.blockX++;
                    this.offsetX -= CONST.BLOCK_WIDTH;
                } else if (this.blockX > 0 && this.offsetX <= -CONST.BLOCK_WIDTH) {
                    this.blockX--;
                    this.offsetX += CONST.BLOCK_WIDTH;
                }
            } else {
                this.move = this.MOVE_LEFT;
                this.offsetY = curFloor;
                this.bounce = 0;
            }
        } else if (this.move === this.MOVE_FALL) {
            const bxf = Math.floor(this.blockX);
            const curFloor = getFloorOffset(board, bxf, Math.floor(this.blockY));
            const curBlk = getBlockType(board, bxf, Math.floor(this.blockY));
            if (isFloorDown(curBlk) && this.offsetY >= curFloor && this.offsetY - curFloor <= 4) {
                this.frame = 0;
                if (jumpmanY >= this.blockY - 1 || this.name.charAt(0) === 'b') {
                    this.move = (this.blockX > CONST.BLOCKS_X / 2) ? this.MOVE_LEFT : this.MOVE_RIGHT;
                } else {
                    this.move = (this.blockX > CONST.BLOCKS_X / 2) ? this.MOVE_RIGHT : this.MOVE_LEFT;
                }
                this.offsetY = curFloor;
                this.bounce = 0;
            } else {
                if (this.blockX > CONST.BLOCKS_X / 2) this.offsetX += 2; else this.offsetX -= 2;
                this.offsetY += 4;
                if (this.offsetY >= CONST.BLOCK_HEIGHT) {
                    this.blockY++;
                    this.offsetY -= CONST.BLOCK_HEIGHT;
                    if (this.offsetY < 2) this.offsetY = 0;
                }
            }
        }

        // Destroy if off-screen
        if (this.blockY >= CONST.BLOCKS_Y || this.blockX < -2 || this.blockX > CONST.BLOCKS_X + 2) {
            this.destroyed = true;
        }

        // Update animation frame
        this.updateFrame();
    }

    takeLadder(jumpmanX, jumpmanY) {
        if (this.onLadder) return true;
        if (!this.game.oilOnFire) return true;
        if (jumpmanY <= this.blockY) return false;
        const r = Math.floor(Math.random() * 256);
        const r2 = r % 3;
        if (r2 >= Math.floor(this.game.difficulty.level / 2) + 1) return false;
        if (Math.floor(this.blockX) === jumpmanX) return true;
        if ((r & 0x18) !== 0) return false;
        return true;
    }

    setWildOffset(jumpmanX) {
        if (this.wild === 1) {
            this.wx = Math.floor(Math.random() * 2) + 1;
            if (Math.floor(Math.random() * 4) === 3) this.wx *= -1;
        } else if (this.wild === 2) {
            const dif = Math.abs(jumpmanX - this.blockX);
            if (this.blockX < jumpmanX) {
                this.wx = dif > 9 ? 4 : dif > 3 ? 3 : 2;
            } else {
                this.wx = dif > 3 ? -2 : -1;
            }
        } else if (this.wild === 3) {
            if (this.blockX < jumpmanX) {
                this.wx = Math.floor(Math.random() * 2) + 1;
            } else {
                this.wx = -(Math.floor(Math.random() * 2) + 1);
            }
        }
    }

    updateFrame() {
        const anims = this.game.anims.objects.sequence;
        const seq = anims[this.animation];
        if (!seq) return;
        const step = seq[this.frame % seq.length];
        this.frameName = this.name + '-' + step.id;
        if (step.t !== undefined) {
            if (this.frameCycles === null) {
                this.frameCycles = Math.max(1, Math.floor(step.t / this.game.speed));
            }
            this.frameCycles--;
            if (this.frameCycles <= 0) {
                this.frame++;
                this.frameCycles = null;
                if (this.frame >= seq.length) this.frame = 0;
            }
        } else {
            this.frame++;
            if (this.frame >= seq.length) this.frame = 0;
        }
    }
}

// ---- Fire Character ----
class FireChar {
    constructor(game, charType, x, y, ox, oy, dir, spawn) {
        this.game = game;
        this.MOVE_STOP = 0;
        this.MOVE_LEFT = 1;
        this.MOVE_RIGHT = 2;
        this.MOVE_DOWN = 3;
        this.MOVE_UP = 4;
        this.MOVE_LSPAWN = 5;
        this.MOVE_RSPAWN = 6;

        this.type = charType;
        if (charType === CONST.FIRE_BALL) {
            this.name = 'fireball-red';
            this.cx = 10; this.cy = 16; this.cw = 12; this.ch = 12;
        } else {
            this.name = 'firefox-red';
            this.cx = 12; this.cy = 14; this.cw = 12; this.ch = 14;
        }

        if (dir === CONST.FACE_RIGHT) {
            this.move = spawn ? this.MOVE_RSPAWN : this.MOVE_RIGHT;
            this.animation = 'fireRight';
            this.frameName = this.name + '-3';
        } else {
            this.move = spawn ? this.MOVE_LSPAWN : this.MOVE_LEFT;
            this.animation = 'fireLeft';
            this.frameName = this.name + '-1';
        }

        this.frame = 0;
        this.frameCycles = null;
        this.blockX = x;
        this.blockY = y;
        this.offsetX = ox;
        this.offsetY = oy;
        this.step = 0;
        this.stepMax = 16;
        this.bounce = 0;
        this.visible = true;
        this.collide = true;
        this.takeLadder = false;
        this.destroyed = false;
        this.scoreTimer = 0;
        this._jumped = false;

        this.sprite = { data: 'fire-' + (charType === CONST.FIRE_BALL ? 'ball' : 'fox') };
    }

    getPixelX() {
        return Math.floor(this.blockX) * CONST.BLOCK_WIDTH + this.offsetX;
    }

    getPixelY() {
        return Math.floor(this.blockY) * CONST.BLOCK_HEIGHT + this.offsetY;
    }

    getCollisionRect() {
        const px = this.getPixelX();
        const py = this.getPixelY();
        return { x: px + this.cx, y: py + this.cy, w: this.cw, h: this.ch };
    }

    update(jumpmanX, jumpmanY) {
        if (this.destroyed) return;
        if (this.scoreTimer > 0) {
            this.scoreTimer--;
            if (this.scoreTimer <= 0) this.destroyed = true;
            return;
        }

        const board = this.game.board;
        const bx = Math.floor(this.blockX);
        const curBlock = getBlockType(board, bx, Math.floor(this.blockY));
        const curFloor = getFloorOffset(board, bx, Math.floor(this.blockY));

        if (this.move >= this.MOVE_LSPAWN) {
            // Spawn animation
            const stepX = [-2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2];
            const stepY = [-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-4,-4,-4, 0, 0, 0, 0, 2];
            const sx = stepX[Math.min(this.step, stepX.length - 1)];
            if (this.move === this.MOVE_LSPAWN) this.offsetX -= sx; else this.offsetX += sx;
            if (this.offsetX >= CONST.BLOCK_WIDTH / 4) {
                this.blockX++;
                this.offsetX -= CONST.BLOCK_WIDTH;
            } else if (this.blockX > 0 && this.offsetX <= -CONST.BLOCK_WIDTH) {
                this.blockX--;
                this.offsetX += CONST.BLOCK_WIDTH;
            }
            this.offsetY += stepY[Math.min(this.step, stepY.length - 1)];
            if (this.offsetY >= CONST.BLOCK_HEIGHT) {
                this.blockY++;
                this.offsetY -= CONST.BLOCK_HEIGHT;
                if (this.offsetY < 2) this.offsetY = 0;
            }
            if (this.step < stepX.length - 1) this.step++;
            const nFloor = getFloorOffset(board, Math.floor(this.blockX), Math.floor(this.blockY));
            const nBlock = getBlockType(board, Math.floor(this.blockX), Math.floor(this.blockY));
            if (isFloorDown(nBlock) && this.offsetY >= nFloor && this.offsetY - nFloor <= 4) {
                this.frame = 0;
                this.offsetY = nFloor;
                this.changePath();
            }
        } else {
            // Normal movement
            if (this.move === this.MOVE_UP) {
                this.offsetX = -7;
                this.offsetY -= 1;
                if (this.offsetY < 0) {
                    this.blockY--;
                    this.offsetY += CONST.BLOCK_HEIGHT;
                }
                const nb = getBlockType(board, Math.floor(this.blockX), Math.floor(this.blockY));
                const nf = getFloorOffset(board, Math.floor(this.blockX), Math.floor(this.blockY));
                const upBlk = this.blockY > 0 ? getBlockType(board, Math.floor(this.blockX), Math.floor(this.blockY) - 1) : null;
                if ((isFloor(nb) || !isAnyLadder(upBlk)) && this.offsetY <= nf) {
                    this.offsetY = nf;
                    this.changePath();
                }
            } else if (this.move === this.MOVE_DOWN) {
                this.offsetX = -7;
                this.offsetY += 1;
                if (this.offsetY >= CONST.BLOCK_HEIGHT) {
                    this.blockY++;
                    this.offsetY -= CONST.BLOCK_HEIGHT;
                }
                const downBlk = this.blockY < 13 ? getBlockType(board, Math.floor(this.blockX), Math.floor(this.blockY) + 1) : null;
                const floor2 = getFloorOffset(board, Math.floor(this.blockX), Math.floor(this.blockY));
                if (!isAnyLadder(downBlk) && floor2 >= 0 && this.offsetY > floor2) {
                    this.offsetY = floor2;
                    this.changePath();
                }
            } else if (this.offsetY === curFloor || Math.abs(this.offsetY - curFloor) <= 2) {
                this.offsetY = curFloor;
                // Check ladder
                const upBlk = this.blockY > 0 ? getBlockType(board, bx, Math.floor(this.blockY) - 1) : null;
                const dnBlk = this.blockY < 13 ? getBlockType(board, bx, Math.floor(this.blockY) + 1) : null;
                const canUp = isAnyTopLadder(curBlock) || (curFloor === this.offsetY && isAnyLadder(upBlk));
                const canDn = (isAnyLadder(curBlock) || isAnyLadder(dnBlk)) && jumpmanY > this.blockY;
                if (canUp && this.takeLadder && this.move !== this.MOVE_DOWN) {
                    this.move = this.MOVE_UP;
                } else if (canDn && this.takeLadder && this.move !== this.MOVE_UP) {
                    this.move = this.MOVE_DOWN;
                } else if (this.move === this.MOVE_RIGHT) {
                    const sideBlk = getBlockType(board, bx + 1, Math.floor(this.blockY));
                    const sideOff = getFloorOffset(board, bx + 1, Math.floor(this.blockY));
                    if ((bx < CONST.BLOCKS_X - 1) && sideOff !== -1 && !isTileEmpty(sideBlk)) {
                        this.offsetX += 2;
                        if (this.offsetX >= CONST.BLOCK_WIDTH / 4) {
                            this.blockX++;
                            this.offsetX -= CONST.BLOCK_WIDTH;
                        }
                    } else {
                        this.move = this.MOVE_LEFT;
                    }
                } else if (this.move === this.MOVE_LEFT) {
                    const sideBlk = getBlockType(board, bx - 1, Math.floor(this.blockY));
                    const sideOff = getFloorOffset(board, bx - 1, Math.floor(this.blockY));
                    if ((sideBlk !== CONST.MAP_INV_WALL || this.offsetX > 0) && sideOff !== -1 && !isTileEmpty(sideBlk)) {
                        this.offsetX -= 2;
                        if (this.blockX > 0 && this.offsetX <= -CONST.BLOCK_WIDTH) {
                            this.blockX--;
                            this.offsetX += CONST.BLOCK_WIDTH;
                        }
                    } else {
                        this.move = this.MOVE_RIGHT;
                    }
                }

                const nf2 = getFloorOffset(board, Math.floor(this.blockX), Math.floor(this.blockY));
                if (nf2 >= 0 && this.offsetY !== nf2) this.offsetY = nf2;

                this.step++;
                if (this.step >= this.stepMax) this.changePath();

                if (this.move === this.MOVE_RIGHT) this.animation = 'fireRight';
                else if (this.move === this.MOVE_LEFT) this.animation = 'fireLeft';
            }
        }

        if (this.blockY >= CONST.BLOCKS_Y || this.blockX < -2 || this.blockX > CONST.BLOCKS_X + 2) {
            this.destroyed = true;
        }

        this.updateFrame();
    }

    changePath() {
        const moves = [0, 1, 1, 1, 2, 2, 2];
        this.move = moves[Math.floor(Math.random() * 7)];
        this.step = 0;
        if (this.move === this.MOVE_STOP) {
            this.stepMax = 16;
            this.takeLadder = false;
        } else {
            const steps = [4, 8, 16, 32, 64, 128];
            this.stepMax = steps[Math.floor(Math.random() * 6)];
            this.takeLadder = (Math.floor(Math.random() * 4) === 3 && !this.takeLadder);
        }
    }

    updateFrame() {
        const anims = this.game.anims.objects.sequence;
        const seq = anims[this.animation];
        if (!seq) return;
        const step = seq[this.frame % seq.length];
        this.frameName = this.name + '-' + step.id;
        if (step.t !== undefined) {
            if (this.frameCycles === null) {
                this.frameCycles = Math.max(1, Math.floor(step.t / this.game.speed));
            }
            this.frameCycles--;
            if (this.frameCycles <= 0) {
                this.frame++;
                this.frameCycles = null;
                if (this.frame >= seq.length) this.frame = 0;
            }
        } else {
            this.frame++;
            if (this.frame >= seq.length) this.frame = 0;
        }
    }
}

// ---- Spring ----
class Spring {
    constructor(game, x, y, ox) {
        this.game = game;
        this.name = 'spring';
        this.animation = 'spring';
        this.frameName = 'spring-1';
        this.frame = 0;
        this.blockX = x;
        this.blockY = y;
        this.offsetX = ox || 0;
        this.offsetY = getFloorOffset(game.board, x, y);
        this.visible = true;
        this.collide = true;
        this.step = 0;
        this.bounce = { floor: y, on: true };
        this.destroyed = false;
        this.scoreTimer = 0;
        this._jumped = false;
        this.cx = 4; this.cy = 4; this.cw = 16; this.ch = 22;

        this.sprite = { data: 'spring' };
    }

    getPixelX() {
        return Math.floor(this.blockX) * CONST.BLOCK_WIDTH + this.offsetX;
    }

    getPixelY() {
        return Math.floor(this.blockY) * CONST.BLOCK_HEIGHT + this.offsetY;
    }

    getCollisionRect() {
        const px = this.getPixelX();
        const py = this.getPixelY();
        return { x: px + this.cx, y: py + this.cy, w: this.cw, h: this.ch };
    }

    update() {
        if (this.destroyed) return;
        if (this.scoreTimer > 0) {
            this.scoreTimer--;
            if (this.scoreTimer <= 0) this.destroyed = true;
            return;
        }

        if (this.bounce.on) {
            const stepX = [8, 8, 8, 8, 8, 4, 4, 8, 8, 8, 8, 8];
            const stepY = [-8,-16,-16,-8,-8,-4, 0, 4, 8, 8, 16, 8];
            this.offsetX += stepX[this.step];
            if (this.offsetX >= CONST.BLOCK_WIDTH / 4) {
                this.blockX++;
                this.offsetX -= CONST.BLOCK_WIDTH;
            }
            this.offsetY += stepY[this.step];
            if (this.offsetY >= CONST.BLOCK_HEIGHT) {
                this.blockY++;
                this.offsetY -= CONST.BLOCK_HEIGHT;
                if (this.offsetY < 2) this.offsetY = 0;
            }
            const curFloor = getFloorOffset(this.game.board, Math.floor(this.blockX), Math.floor(this.blockY));
            if (this.step < stepX.length - 1) {
                this.step++;
            } else if (Math.floor(this.blockY) === this.bounce.floor) {
                if (curFloor > 0 && Math.abs(curFloor - this.offsetY) <= 2) {
                    audioManager.play('spring');
                    this.offsetY = curFloor;
                    this.step = 0;
                } else if (curFloor === -1) {
                    this.bounce.on = false;
                    audioManager.play('fall');
                }
            }
        } else {
            this.offsetY += 8;
            if (this.offsetY >= CONST.BLOCK_HEIGHT) {
                this.blockY++;
                this.offsetY -= CONST.BLOCK_HEIGHT;
            }
        }

        if (this.blockY >= CONST.BLOCKS_Y || this.blockX > CONST.BLOCKS_X + 2) {
            this.destroyed = true;
        }

        this.updateFrame();
    }

    updateFrame() {
        const anims = this.game.anims.objects.sequence;
        const seq = anims[this.animation];
        if (!seq) return;
        const step = seq[this.frame % seq.length];
        this.frameName = 'spring-' + step.id;
        this.frame++;
        if (this.frame >= seq.length) this.frame = 0;
    }
}

// ---- Cement Tray ----
class Cement {
    constructor(game, blockX, blockY, offsetY, dir) {
        this.game = game;
        this.name = 'cement';
        this.frameName = 'cement-1';
        this.frame = 0;
        this.blockX = blockX;
        this.blockY = blockY;
        this.offsetX = 0;
        this.offsetY = offsetY || 0;
        this.direction = dir || 'R';
        this.visible = true;
        this.collide = true;
        this.destroyed = false;
        this.scoreTimer = 0;
        this._jumped = false;
        this.cx = 6; this.cy = 0; this.cw = 20; this.ch = 16;
        this.sprite = { data: 'cement' };
    }

    getPixelX() {
        return Math.floor(this.blockX) * CONST.BLOCK_WIDTH + this.offsetX;
    }

    getPixelY() {
        return Math.floor(this.blockY) * CONST.BLOCK_HEIGHT + this.offsetY;
    }

    getCollisionRect() {
        const px = this.getPixelX();
        const py = this.getPixelY();
        return { x: px + this.cx, y: py + this.cy, w: this.cw, h: this.ch };
    }

    update() {
        if (this.destroyed) return;
        if (this.scoreTimer > 0) {
            this.scoreTimer--;
            if (this.scoreTimer <= 0) this.destroyed = true;
            return;
        }

        if (this.direction === 'R') {
            this.offsetX += 2;
            if (this.offsetX >= CONST.BLOCK_WIDTH / 4) {
                this.blockX++;
                this.offsetX -= CONST.BLOCK_WIDTH;
            }
        } else {
            this.offsetX -= 2;
            if (this.blockX > 0 && this.offsetX <= -CONST.BLOCK_WIDTH) {
                this.blockX--;
                this.offsetX += CONST.BLOCK_WIDTH;
            }
        }

        if (this.blockX < 0 || this.blockX >= CONST.BLOCKS_X) {
            this.destroyed = true;
        }
    }
}

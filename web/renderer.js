// ============================================================
// Donkey Kong JS - Renderer (Canvas Drawing)
// ============================================================

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.gameWidth = 448;
        this.gameHeight = 480;
        this.scaleX = canvas.width / this.gameWidth;
        this.scaleY = canvas.height / this.gameHeight;
        this.scale = Math.min(this.scaleX, this.scaleY);
        this.offsetX = (canvas.width - this.gameWidth * this.scale) / 2;
        this.offsetY = (canvas.height - this.gameHeight * this.scale) / 2;
        this.yOff = 32; // top offset for score area (480 - 448 = 32)
        this.fontLoaded = false;
        this.font = null;
        this.loadFont();
    }

    async loadFont() {
        try {
            const f = new FontFace('Press Start 2P', "url('../assets/fonts/PressStart2P.ttf')");
            await f.load();
            document.fonts.add(f);
            this.fontLoaded = true;
        } catch (e) {
            console.warn('Font load failed, using fallback');
        }
    }

    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    save() { this.ctx.save(); }
    restore() { this.ctx.restore(); }

    applyTransform() {
        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
    }

    drawRegion(regions, name, x, y, flipH) {
        const rgn = regions[name];
        if (!rgn) return;
        this.ctx.save();
        if (flipH) {
            this.ctx.translate(x + rgn.w, y + this.yOff);
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(rgn.image, rgn.x, rgn.y, rgn.w, rgn.h, 0, 0, rgn.w, rgn.h);
        } else {
            this.ctx.drawImage(rgn.image, rgn.x, rgn.y, rgn.w, rgn.h, x, y + this.yOff, rgn.w, rgn.h);
        }
        this.ctx.restore();
    }

    drawImage(img, x, y, w, h) {
        if (!img) return;
        if (w && h) {
            this.ctx.drawImage(img, x, y + this.yOff, w, h);
        } else {
            this.ctx.drawImage(img, x, y + this.yOff);
        }
    }

    drawBoardImage(img) {
        if (!img) return;
        // Board images are 448x448, drawn below the score area
        this.ctx.drawImage(img, 0, this.yOff);
    }

    drawRect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
    }

    drawText(text, x, y, color, size) {
        size = size || 8;
        const fontName = this.fontLoaded ? 'Press Start 2P' : 'monospace';
        this.ctx.font = `${size}px ${fontName}`;
        this.ctx.fillStyle = color || '#fff';
        this.ctx.fillText(text, x, y);
    }

    drawScore(game) {
        const fontName = this.fontLoaded ? 'Press Start 2P' : 'monospace';
        this.ctx.font = `8px ${fontName}`;

        // Top bar background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.gameWidth, this.yOff);
        this.ctx.textBaseline = 'top';

        // "1UP" and score
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillText('1UP', 16, 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(zeroPad(game.jumpman.score, 6), 8, 12);

        // "HIGH SCORE"
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillText('HIGH SCORE', 120, 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(zeroPad(game.highScore, 6), 144, 12);

        // Board/Level indicator
        if (game.board) {
            const fontColors = game.board.fontColors || ['#00ffff', '#ff2155'];
            this.ctx.fillStyle = brsColorToCSS(fontColors[0]) || '#00ffff';
            const levelText = 'L=' + zeroPad(game.currentLevel, 2);
            this.ctx.fillText(levelText, 290, 12);
        }

        // Bonus
        if (game.currentBonus !== undefined) {
            this.ctx.fillStyle = '#00ffff';
            this.ctx.fillText('BONUS', 350, 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(zeroPad(game.currentBonus, 4), 358, 12);
        }

        // Lives
        if (game.jumpman && game.regions && game.regions.objects) {
            const lifeRgn = game.regions.objects['life'];
            if (lifeRgn) {
                for (let i = 0; i < Math.min(game.jumpman.lives, 5); i++) {
                    this.ctx.drawImage(lifeRgn.image, lifeRgn.x, lifeRgn.y, lifeRgn.w, lifeRgn.h,
                        this.gameWidth - 24 - (i * 16), 6, lifeRgn.w, lifeRgn.h);
                }
            }
        }
    }

    drawBoard(game) {
        if (!game.board || !game.boardImage) return;
        this.drawBoardImage(game.boardImage);
    }

    drawJumpman(game) {
        const jm = game.jumpman;
        if (!jm || (!jm.alive && !jm.dying)) return;
        const regions = game.regions.jumpman;
        const rgn = regions[jm.frameName];
        if (!rgn) return;

        const x = jm.getPixelX();
        const y = jm.getPixelY() - rgn.h;

        this.ctx.drawImage(rgn.image, rgn.x, rgn.y, rgn.w, rgn.h,
            x, y + this.yOff, rgn.w, rgn.h);
    }

    drawKong(game) {
        const kong = game.kong;
        if (!kong) return;
        const regions = game.regions.kong;
        const rgn = regions[kong.frameName];
        if (!rgn) return;

        const x = kong.getPixelX();
        const y = kong.getPixelY() - rgn.h;

        this.ctx.drawImage(rgn.image, rgn.x, rgn.y, rgn.w, rgn.h,
            x, y + this.yOff, rgn.w, rgn.h);
    }

    drawLady(game) {
        const lady = game.lady;
        if (!lady) return;
        const regions = game.regions.lady;
        const rgn = regions[lady.frameName];
        if (!rgn) return;

        const x = (lady.blockX * CONST.BLOCK_WIDTH) + lady.offsetX;
        const y = ((lady.blockY * CONST.BLOCK_HEIGHT) + lady.offsetY) - rgn.h;

        this.ctx.drawImage(rgn.image, rgn.x, rgn.y, rgn.w, rgn.h,
            x, y + this.yOff, rgn.w, rgn.h);

        // Help text - show periodically
        if (lady.frame >= 94 && lady.help) {
            // help frames: 1=left, 2=right
            const curFace = (lady.face === CONST.FACE_AUTO)
                ? ((game.jumpman && game.jumpman.blockX < 14) ? 1 : 2)
                : (lady.face === CONST.FACE_LEFT ? 1 : 2);
            const helpFrame = 'help-' + lady.help.color + '-' + curFace;
            const hrg = regions[helpFrame];
            if (hrg) {
                let hx = x, hy = y;
                if (curFace === 1) { hx -= 56; hy += 8; }
                else { hx += 30; hy += 6; }
                this.ctx.drawImage(hrg.image, hrg.x, hrg.y, hrg.w, hrg.h,
                    hx, hy + this.yOff, hrg.w, hrg.h);
            }
        }
    }

    drawObjects(game) {
        if (!game.objects) return;
        for (const obj of game.objects) {
            if (!obj || !obj.visible || obj.destroyed) continue;
            const regions = game.regions.objects;

            if (obj.scoreTimer > 0 && obj.scoreValue) {
                const scoreName = 'points-' + obj.scoreValue;
                const srgn = regions[scoreName];
                if (srgn) {
                    const sx = obj.getPixelX();
                    const sy = obj.getPixelY() - srgn.h;
                    this.ctx.drawImage(srgn.image, srgn.x, srgn.y, srgn.w, srgn.h,
                        sx, sy + this.yOff, srgn.w, srgn.h);
                }
                continue;
            }

            let frameName = obj.frameName;
            const rgn = regions[frameName];
            if (!rgn) continue;

            const x = obj.getPixelX();
            const y = obj.getPixelY() - rgn.h;

            this.ctx.drawImage(rgn.image, rgn.x, rgn.y, rgn.w, rgn.h,
                x, y + this.yOff, rgn.w, rgn.h);
        }
    }

    drawStaticObjects(game) {
        if (!game.staticObjects) return;
        for (const obj of game.staticObjects) {
            if (!obj || !obj.visible) continue;
            const regions = game.regions.objects;
            const rgn = regions[obj.frameName];
            if (!rgn) continue;

            const x = obj.x;
            const y = obj.y - rgn.h;

            this.ctx.drawImage(rgn.image, rgn.x, rgn.y, rgn.w, rgn.h,
                x, y + this.yOff, rgn.w, rgn.h);
        }
    }

    drawFlames(game) {
        if (!game.flamesObj) return;
        const regions = game.regions.objects;
        for (const flame of game.flamesObj) {
            if (!flame.visible) continue;
            const rgn = regions[flame.frameName];
            if (!rgn) continue;
            this.ctx.drawImage(rgn.image, rgn.x, rgn.y, rgn.w, rgn.h,
                flame.x, flame.y - rgn.h + this.yOff, rgn.w, rgn.h);
        }
    }

    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        const fontName = this.fontLoaded ? 'Press Start 2P' : 'monospace';
        this.ctx.font = `16px ${fontName}`;
        this.ctx.fillStyle = '#ffd800';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME PAUSED', this.gameWidth / 2, this.gameHeight / 2);
        this.ctx.font = `8px ${fontName}`;
        this.ctx.fillStyle = '#aaa';
        this.ctx.fillText('Press P to resume', this.gameWidth / 2, this.gameHeight / 2 + 24);
        this.ctx.textAlign = 'left';
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        const fontName = this.fontLoaded ? 'Press Start 2P' : 'monospace';
        this.ctx.font = `16px ${fontName}`;
        this.ctx.fillStyle = '#ff0000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.gameWidth / 2, this.gameHeight / 2);
        this.ctx.font = `8px ${fontName}`;
        this.ctx.fillStyle = '#aaa';
        this.ctx.fillText('Press SPACE to continue', this.gameWidth / 2, this.gameHeight / 2 + 30);
        this.ctx.textAlign = 'left';
    }

    drawStartupScreen(game) {
        this.clear();
        this.applyTransform();
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        this.drawScore(game);

        const fontName = this.fontLoaded ? 'Press Start 2P' : 'monospace';
        this.ctx.font = `10px ${fontName}`;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.textAlign = 'center';

        if (game.board) {
            this.ctx.fillText('BOARD ' + game.currentBoard, this.gameWidth / 2, 200);
            this.ctx.fillStyle = '#ffd800';
            this.ctx.fillText(game.board.name.toUpperCase(), this.gameWidth / 2, 230);
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = `8px ${fontName}`;
        this.ctx.fillText('GET READY!', this.gameWidth / 2, 280);
        this.ctx.textAlign = 'left';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    drawHighScores(scores, is24h = false, timeRemaining = null) {
        this.clear();
        this.applyTransform();
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        const fontName = this.fontLoaded ? 'Press Start 2P' : 'monospace';
        this.ctx.font = `12px ${fontName}`;
        this.ctx.fillStyle = '#ff0000';
        this.ctx.textAlign = 'center';
        
        if (is24h) {
            this.ctx.fillText('24H LEADERBOARD', this.gameWidth / 2, 40);
            this.ctx.font = `7px ${fontName}`;
            this.ctx.fillStyle = '#14f195';
            this.ctx.fillText('TOP PLAYER WINS 3 SOL!', this.gameWidth / 2, 55);
            
            if (timeRemaining) {
                this.ctx.fillStyle = '#9945ff';
                this.ctx.fillText(`Time: ${timeRemaining.hours}h ${timeRemaining.minutes}m`, this.gameWidth / 2, 68);
            }
        } else {
            this.ctx.fillText('HIGH SCORES', this.gameWidth / 2, 50);
        }

        this.ctx.font = `6px ${fontName}`;
        const startY = is24h ? 90 : 80;

        for (let i = 0; i < Math.min(scores.length, 10); i++) {
            const s = scores[i];
            const y = startY + i * 28;
            
            // Rank
            this.ctx.textAlign = 'left';
            if (i === 0 && is24h) {
                this.ctx.fillStyle = '#14f195';
                this.ctx.fillText('👑 ' + (i + 1), 20, y);
            } else {
                this.ctx.fillStyle = '#ffd800';
                this.ctx.fillText((i + 1) + '.', 20, y);
            }
            
            // Wallet address (shortened)
            this.ctx.fillStyle = '#9945ff';
            const wallet = s.public_key || s.name || '---';
            const shortWallet = wallet.length > 12 ? 
                wallet.substring(0, 6) + '...' + wallet.substring(wallet.length - 4) : wallet;
            this.ctx.fillText(shortWallet, 50, y);
            
            // Score
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(zeroPad(s.score, 6), this.gameWidth - 20, y);
            
            // Level indicator
            this.ctx.fillStyle = '#888';
            this.ctx.font = `5px ${fontName}`;
            this.ctx.fillText('L' + (s.level || 1), this.gameWidth - 20, y + 10);
            this.ctx.font = `6px ${fontName}`;
        }

        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#888';
        this.ctx.font = `7px ${fontName}`;
        this.ctx.fillText('Press SPACE to return', this.gameWidth / 2, this.gameHeight - 30);
        this.ctx.textAlign = 'left';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    drawAll(game) {
        this.clear();
        this.applyTransform();

        this.drawBoard(game);
        this.drawStaticObjects(game);
        this.drawFlames(game);
        this.drawObjects(game);
        this.drawKong(game);
        this.drawLady(game);
        this.drawJumpman(game);
        this.drawScore(game);

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

}

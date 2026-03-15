// ============================================================
// Donkey Kong JS - Main Game Engine
// ============================================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        this.menuOverlay = document.getElementById('menuOverlay');

        // Game state
        this.STATE_MENU = 0;
        this.STATE_PLAYING = 1;
        this.STATE_PAUSED = 2;
        this.STATE_GAMEOVER = 3;
        this.STATE_STARTUP = 4;
        this.STATE_HISCORES = 5;
        this.STATE_DEATH = 6;
        this.STATE_BOARD_COMPLETE = 7;
        this.gameState = this.STATE_MENU;

        // Assets
        this.regions = { jumpman: {}, kong: {}, objects: {}, lady: {} };
        this.anims = { mario: {}, kong: {}, objects: {}, lady: {} };
        this.mapData = null;
        this.boardImages = {};
        this.boardImage = null;

        // Game data
        this.board = null;
        this.jumpman = null;
        this.kong = null;
        this.lady = null;
        this.objects = [];
        this.staticObjects = [];
        this.flamesObj = [];
        this.oilOnFire = false;
        this.fireChars = 0;

        // Settings
        this.settings = {
            lives: 1,
            boardOrder: 0, // 0=USA, 1=Japan (EU)
            sound: true
        };

        // Score
        this.highScore = 0;
        this.highScores = [];
        this.leaderboard24h = [];
        this.leaderboardTimeRemaining = null;
        this.currentBonus = 0;
        this.bonusTimer = 0;
        this.bonusTime = 2000;

        // Level/Board tracking
        this.currentLevel = 1;
        this.currentBoard = 1;
        this.boardIndex = 0;
        this.levelBoards = [];

        // Difficulty
        this.difficulty = { level: 1, timer: 0 };

        // Timing
        this.speed = CONST.GAME_SPEED;
        this.lastTime = 0;
        this.accumulator = 0;
        this.startupTimer = 0;
        this.deathTimer = 0;
        this.gameOverTimer = 0;
        this.boardCompleteTimer = 0;

        // Barrel launching
        this.barrelTimer = 0;
        this.barrelInterval = 3000;

        this.loadAssets();
    }

    async loadAssets() {
        try {
        const basePath = '../assets';
        console.log('Loading assets...');

        // Load sprite sheet images
        console.log('Loading sprite images...');
        const cacheBust = '?v=' + Date.now();
        const [kongImg, marioImg, objectsImg, paulineImg] = await Promise.all([
            this.loadImage(basePath + '/sprites/kong.png' + cacheBust),
            this.loadImage(basePath + '/sprites/mario.png' + cacheBust),
            this.loadImage(basePath + '/sprites/objects.png' + cacheBust),
            this.loadImage(basePath + '/sprites/pauline.png' + cacheBust)
        ]);

        console.log('Sprite images loaded, loading JSON data...');

        // Load sprite JSON data
        const [kongJson, marioJson, objectsJson, paulineJson] = await Promise.all([
            this.loadJson(basePath + '/sprites/kong.json'),
            this.loadJson(basePath + '/sprites/mario.json'),
            this.loadJson(basePath + '/sprites/objects.json'),
            this.loadJson(basePath + '/sprites/pauline.json')
        ]);

        console.log('Sprite JSON loaded, loading animations...');

        // Load animation data
        const [kongAnims, marioAnims, objectsAnims, paulineAnims] = await Promise.all([
            this.loadJson(basePath + '/anims/kong.json'),
            this.loadJson(basePath + '/anims/mario.json'),
            this.loadJson(basePath + '/anims/objects.json'),
            this.loadJson(basePath + '/anims/pauline.json')
        ]);

        console.log('Animations loaded, loading map data...');

        // Load map data
        this.mapData = await this.loadJson(basePath + '/maps/arcade.json');

        console.log('Map data loaded, loading board images...');

        // Load board images
        const boardNames = ['barrels', 'conveyors', 'elevators', 'rivets'];
        const boardImgPromises = boardNames.map(n => this.loadImage(basePath + '/images/board-' + n + '.png'));
        const boardImgs = await Promise.all(boardImgPromises);
        boardNames.forEach((n, i) => { this.boardImages[n] = boardImgs[i]; });

        // Build sprite regions
        this.regions.kong = loadSpriteRegions(kongJson, kongImg);
        this.regions.jumpman = loadSpriteRegions(marioJson, marioImg);
        this.regions.objects = loadSpriteRegions(objectsJson, objectsImg);
        this.regions.lady = loadSpriteRegions(paulineJson, paulineImg);

        // Store animation data
        this.anims.kong = kongAnims;
        this.anims.mario = marioAnims;
        this.anims.objects = objectsAnims;
        this.anims.lady = paulineAnims;

        // Load audio
        await audioManager.load(basePath + '/audio');

        // Load high scores from localStorage
        this.loadHighScores();

        // Setup menu
        this.setupMenu();

        // Start game loop
        console.log('Assets loaded successfully!');
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
        } catch (e) {
            console.error('Failed to load assets:', e);
        }
    }

    loadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => { console.error('Failed to load image:', src); resolve(img); };
            img.src = src;
            // Handle images that are already cached/complete
            if (img.complete) resolve(img);
        });
    }

    loadJson(src) {
        return fetch(src).then(r => r.json());
    }

    setupMenu() {
        const menuItems = this.menuOverlay.querySelectorAll('.menu-item');
        let selectedIndex = 0;

        const updateSelection = () => {
            menuItems.forEach((item, i) => {
                item.classList.toggle('selected', i === selectedIndex);
            });
        };

        menuItems.forEach((item, i) => {
            item.addEventListener('click', () => {
                selectedIndex = i;
                updateSelection();
                this.handleMenuAction(item.dataset.action);
            });
        });

        // Order arrows
        this.menuOverlay.querySelectorAll('[data-action="order"] .arrow').forEach(arrow => {
            arrow.addEventListener('click', (e) => {
                e.stopPropagation();
                this.settings.boardOrder = this.settings.boardOrder === 0 ? 1 : 0;
                document.getElementById('orderVal').textContent = this.settings.boardOrder === 0 ? 'EU' : 'JPN';
            });
        });

        // Keyboard navigation for menu
        window.addEventListener('keydown', (e) => {
            if (this.gameState === this.STATE_MENU) {
                if (e.code === 'ArrowUp') {
                    selectedIndex = Math.max(0, selectedIndex - 1);
                    updateSelection();
                } else if (e.code === 'ArrowDown') {
                    selectedIndex = Math.min(menuItems.length - 1, selectedIndex + 1);
                    updateSelection();
                } else if (e.code === 'Enter' || e.code === 'Space') {
                    this.handleMenuAction(menuItems[selectedIndex].dataset.action);
                }
            } else if (this.gameState === this.STATE_HISCORES) {
                if (e.code === 'Space' || e.code === 'Escape') {
                    this.gameState = this.STATE_MENU;
                    this.menuOverlay.style.display = 'flex';
                }
            } else if (this.gameState === this.STATE_GAMEOVER) {
                if (e.code === 'Space') {
                    this.gameState = this.STATE_MENU;
                    this.menuOverlay.style.display = 'flex';
                    audioManager.stopAll();
                }
            }
        });
    }

    handleMenuAction(action) {
        switch (action) {
            case 'start':
                this.startGame();
                break;
            case 'hiscores':
                this.showHighScores();
                break;
            case 'transactions':
                this.showTransactions();
                break;
            case 'tutorial':
                this.showTutorial();
                break;
            case 'twitter':
                window.open('https://x.com/DonkeyTrumpGame', '_blank');
                break;
        }
    }

    async showTransactions() {
        const wallet = await WalletManager.getWallet();
        if (wallet && wallet.publicKey) {
            TransactionHistory.show(wallet.publicKey);
        }
    }

    showTutorial() {
        Tutorial.show();
    }

    async showHighScores() {
        this.gameState = this.STATE_HISCORES;
        this.menuOverlay.style.display = 'none';
        
        // Load 24h leaderboard from server
        try {
            const data = await GameAPI.getLeaderboard24h();
            this.leaderboard24h = data.leaderboard || [];
            this.leaderboardTimeRemaining = data.timeRemaining;
        } catch (e) {
            console.error('Failed to load leaderboard:', e);
            this.leaderboard24h = [];
        }
    }

    startGame() {
        this.menuOverlay.style.display = 'none';
        this.gameState = this.STATE_STARTUP;
        
        // Hide chat during gameplay
        if (typeof ChatClient !== 'undefined' && ChatClient.hide) {
            ChatClient.hide();
        }

        // Reset game state
        this.jumpman = new Jumpman(this);
        this.jumpman.lives = this.settings.lives;
        this.jumpman.score = 0;
        this.jumpman.scoreLife = 0;
        this.jumpman.alive = false;

        this.currentLevel = 1;
        this.boardIndex = 0;
        this.difficulty = { level: 1, timer: 0 };
        this.fireChars = 0;
        this.oilOnFire = false;

        // Setup level boards
        this.setupLevelBoards();

        // Load first board
        this.loadBoard();
    }

    setupLevelBoards() {
        const levelKey = 'level-' + Math.min(this.currentLevel, 5);
        const order = this.settings.boardOrder;
        const levels = this.mapData.levels[order];
        this.levelBoards = levels[levelKey] || [1, 4];
    }

    loadBoard() {
        const boardNum = this.levelBoards[this.boardIndex];
        this.currentBoard = boardNum;
        const boardKey = 'board-' + boardNum;
        const boardDef = deepClone(this.mapData.boards[boardKey]);

        this.board = boardDef;
        this.boardImage = this.boardImages[boardDef.name] || null;

        // Setup rivets tracking
        if (boardDef.name === 'rivets') {
            this.setupRivets(boardDef);
        }

        // Setup bonus
        const bonusKey = 'level-' + Math.min(this.currentLevel, 4);
        const bonusDef = this.mapData.bonus[bonusKey];
        this.currentBonus = bonusDef.value;
        this.bonusTime = bonusDef.time;
        this.bonusTimer = 0;

        // Reset difficulty timer
        this.difficulty.timer = 0;

        // Spawn characters
        this.kong = new Kong(this);
        this.kong.spawn(boardDef);

        this.jumpman.spawn(boardDef);

        // Setup lady
        const ladyFloor = getFloorOffset(boardDef, boardDef.lady.blockX, boardDef.lady.blockY);
        this.lady = {
            blockX: boardDef.lady.blockX,
            blockY: boardDef.lady.blockY,
            offsetX: 0,
            offsetY: ladyFloor >= 0 ? ladyFloor : 0,
            face: boardDef.lady.face !== undefined ? boardDef.lady.face : CONST.FACE_AUTO,
            frame: 0,
            frameName: 'pauline-1',
            help: { color: boardDef.lady.help || 'cyan' }
        };

        // Setup static objects and enemies
        this.objects = [];
        this.staticObjects = [];
        this.flamesObj = [];
        this.belts = [];
        this.oilOnFire = false;
        this.fireChars = 0;
        this.barrelTimer = 0;

        if (boardDef.objects) {
            for (const objDef of boardDef.objects) {
                const px = objDef.blockX * CONST.BLOCK_WIDTH;
                const py = (objDef.blockY * CONST.BLOCK_HEIGHT) + (objDef.offsetY || 0);

                if (objDef.name === 'flames') {
                    const flame = {
                        x: px,
                        y: py,
                        frameName: 'flames-1',
                        frame: 0,
                        visible: objDef.visible !== false,
                        animation: objDef.animation || 'flames'
                    };
                    this.flamesObj.push(flame);
                } else if (objDef.name === 'hammer') {
                    this.staticObjects.push({
                        x: px, y: py,
                        frameName: 'hammer',
                        visible: true,
                        isHammer: true,
                        blockX: objDef.blockX,
                        blockY: objDef.blockY,
                        cx: 0, cy: 0, cw: 18, ch: 20
                    });
                } else if (objDef.name === 'conveyor') {
                    // Build belt data for conveyor movement
                    const beltIdx = objDef.belt;
                    while (this.belts.length < beltIdx + 1) {
                        this.belts.push({ xl: 0, xr: 27, y: 0, direction: 'R', conveyors: [], cement: false, timer: 0, launch: 0 });
                    }
                    const belt = this.belts[beltIdx];
                    belt.y = objDef.blockY;
                    if (objDef.direction) belt.direction = objDef.direction;
                    if (objDef.cement !== undefined) belt.cement = objDef.cement;
                    if (belt.cement && belt.launch === 0) {
                        belt.launch = (Math.floor(Math.random() * 8) + 1) * 1000;
                    }
                    if (objDef.side === 'L' && objDef.blockX > belt.xl) {
                        belt.xl = Math.floor(objDef.blockX);
                    } else if (objDef.side === 'R' && objDef.blockX < belt.xr) {
                        belt.xr = Math.floor(objDef.blockX);
                    }
                } else if (objDef.name === 'elevator-1' || objDef.name === 'elevator-2') {
                    // Elevators
                    this.staticObjects.push({
                        x: px, y: py,
                        frameName: objDef.name,
                        visible: true,
                        isElevator: true,
                        up: objDef.up || false,
                        blockX: objDef.blockX,
                        blockY: objDef.blockY,
                        offsetY: objDef.offsetY
                    });
                } else if (objDef.name === 'platform') {
                    this.staticObjects.push({
                        x: px, y: py,
                        frameName: 'platform',
                        visible: true
                    });
                } else if (objDef.name === 'rivet') {
                    this.staticObjects.push({
                        x: px, y: py,
                        frameName: 'rivet',
                        visible: true,
                        isRivet: true,
                        blockX: objDef.blockX,
                        blockY: objDef.blockY,
                        cx: objDef.cx || 7, cy: objDef.cy || 0,
                        cw: objDef.cw || 2, ch: objDef.ch || 2
                    });
                } else {
                    // Items like hat, parasol, purse, oil, barrels, ladder
                    this.staticObjects.push({
                        x: px, y: py,
                        frameName: objDef.name,
                        visible: true,
                        isItem: (objDef.name === 'hat' || objDef.name === 'parasol' || objDef.name === 'purse'),
                        cx: objDef.cx, cy: objDef.cy, cw: objDef.cw, ch: objDef.ch,
                        blockX: objDef.blockX,
                        blockY: objDef.blockY
                    });
                }
            }
        }

        // Show startup screen
        this.gameState = this.STATE_STARTUP;
        this.startupTimer = 120; // ~2 seconds at 60fps
        audioManager.play('start-board');
    }

    setupRivets(boardDef) {
        this.rivetsRemaining = 0;
        for (const obj of (boardDef.objects || [])) {
            if (obj.name === 'rivet') {
                const tx = Math.floor(obj.blockX / 2);
                boardDef.map[obj.blockY][tx].rivet = true;
                this.rivetsRemaining++;
            }
        }
    }

    // ---- Main Game Loop ----
    gameLoop(timestamp) {
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        switch (this.gameState) {
            case this.STATE_MENU:
                // Menu is handled by HTML overlay
                break;

            case this.STATE_HISCORES:
                this.renderer.drawHighScores(
                    this.leaderboard24h || this.highScores, 
                    true, 
                    this.leaderboardTimeRemaining
                );
                break;

            case this.STATE_STARTUP:
                this.renderer.drawStartupScreen(this);
                this.startupTimer--;
                if (this.startupTimer <= 0) {
                    this.gameState = this.STATE_PLAYING;
                    this.jumpman.alive = true;
                    this.jumpman.lives--;
                    audioManager.stopAll();
                    if (this.board.audio) audioManager.playSong(this.board.audio, true);
                }
                break;

            case this.STATE_PLAYING:
                this.accumulator += dt;
                while (this.accumulator >= this.speed) {
                    this.updateGame();
                    this.accumulator -= this.speed;
                }
                this.renderer.drawAll(this);
                if (Keys.pause) {
                    this.gameState = this.STATE_PAUSED;
                    Keys.pause = false;
                    audioManager.pauseSong();
                }
                if (Keys.back) {
                    this.gameState = this.STATE_MENU;
                    this.menuOverlay.style.display = 'flex';
                    audioManager.stopAll();
                    Keys.back = false;
                    // Show chat when returning to menu
                    if (typeof ChatClient !== 'undefined' && ChatClient.show) {
                        ChatClient.show();
                    }
                }
                break;

            case this.STATE_PAUSED:
                this.renderer.drawAll(this);
                this.renderer.applyTransform();
                this.renderer.drawPauseScreen();
                this.renderer.ctx.setTransform(1, 0, 0, 1, 0, 0);
                if (Keys.pause) {
                    this.gameState = this.STATE_PLAYING;
                    Keys.pause = false;
                    audioManager.resumeSong();
                }
                break;

            case this.STATE_DEATH:
                if (this.jumpman) this.jumpman.updateDeathAnim();
                this.renderer.drawAll(this);
                this.deathTimer--;
                if (this.deathTimer <= 0) {
                    if (this.jumpman.lives <= 0) {
                        this.gameState = this.STATE_GAMEOVER;
                        this.gameOverTimer = 180;
                        this.checkHighScore();
                        audioManager.stopAll();
                    } else {
                        this.loadBoard();
                    }
                }
                break;

            case this.STATE_BOARD_COMPLETE:
                this.renderer.drawAll(this);
                this.boardCompleteTimer--;
                if (this.boardCompleteTimer <= 0) {
                    this.nextBoard();
                }
                break;

            case this.STATE_GAMEOVER:
                this.renderer.drawAll(this);
                this.renderer.applyTransform();
                this.renderer.drawGameOver();
                this.renderer.ctx.setTransform(1, 0, 0, 1, 0, 0);
                // Show chat on game over
                if (typeof ChatClient !== 'undefined' && ChatClient.show) {
                    ChatClient.show();
                }
                break;
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    // ---- Game Update ----
    updateGame() {
        if (!this.jumpman || !this.board) return;

        // Update jumpman
        this.jumpman.update();

        // Check if jumpman died
        if (!this.jumpman.alive && this.gameState === this.STATE_PLAYING) {
            this.handleDeath();
            return;
        }

        // Update kong
        if (this.kong) {
            this.kong.update();
            this.handleKongEvents();
        }

        // Update lady
        this.updateLady();

        // Update flames animations
        this.updateFlames();

        // Update all mobile objects
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (!obj || obj.destroyed) {
                this.objects.splice(i, 1);
                continue;
            }
            // Fire chars change color based on hammer state
            if (obj instanceof FireChar && obj.scoreTimer <= 0) {
                if (this.jumpman.hammer && obj.name.includes('-red')) {
                    obj.name = obj.name.replace('-red', '-blue');
                } else if (!this.jumpman.hammer && obj.name.includes('-blue')) {
                    obj.name = obj.name.replace('-blue', '-red');
                }
            }
            if (obj.update) {
                if (obj instanceof Barrel || obj instanceof FireChar) {
                    obj.update(this.jumpman.blockX, this.jumpman.blockY);
                } else {
                    obj.update();
                }
            }
        }

        // Jump-over scoring (at top of jump, frame 10)
        this.checkJumpScore();

        // Collision detection
        this.checkCollisions();

        // Check hammer pickup
        this.checkHammerPickup();

        // Check item pickup
        this.checkItemPickup();

        // Check board completion
        if (this.checkBoardComplete()) {
            this.gameState = this.STATE_BOARD_COMPLETE;
            this.boardCompleteTimer = 120;
            audioManager.stopAll();
            audioManager.play('finish-board');
            this.addScore(this.currentBonus);
            
            // Trigger reward payout via API
            this.triggerRoundComplete();
            return;
        }

        // Update bonus timer
        this.updateBonus();

        // Update difficulty
        this.updateDifficulty();

        // Launch barrels/enemies
        this.mobLauncher();
    }

    handleKongEvents() {
        if (!this.kong || !this.board) return;

        // Handle barrel board - rolling barrels
        if (this.kong.frameEvent === 'barrel' && this.board.name === 'barrels') {
            this.kong.barrels++;
            let color, action;
            if (this.kong.barrels === 0) {
                color = 'b';
                action = CONST.BARREL_WILD;
            } else {
                if (this.kong.barrels >= CONST.OIL_BARREL_FREQ && this.fireChars < 5) {
                    color = 'b';
                } else {
                    color = 'o';
                }
                action = CONST.BARREL_ROLL;
                if (Math.floor(Math.random() * 16) === 15) action = CONST.BARREL_WILD;
            }
            const barrel = new Barrel(this, color, action);
            this.objects.push(barrel);
            if (color === 'b') this.kong.barrels = 0;

            // Switch Kong action for next barrel
            if (this.kong.barrels === CONST.OIL_BARREL_FREQ - 1) {
                this.kong.charAction = 'rollBlueBarrel';
            } else {
                this.kong.charAction = 'rollOrangeBarrel';
            }
            this.kong.frame = 0;
            this.kong.cycles = null;
        }

        // Reset frame event after handling
        if (this.kong.frameEvent) {
            this.kong.frameEvent = null;
        }
    }

    mobLauncher() {
        if (!this.board) return;

        if (this.board.name === 'barrels') {
            // Barrels are launched by Kong animation events
        } else if (this.board.name === 'conveyors') {
            this.barrelTimer++;
            if (this.barrelTimer >= 150) {
                this.barrelTimer = 0;
                if (this.board.launchers && this.board.launchers.center) {
                    const l = this.board.launchers.center;
                    const dir = Math.random() > 0.5 ? CONST.FACE_RIGHT : CONST.FACE_LEFT;
                    if (this.fireChars < 5) {
                        const fire = new FireChar(this, CONST.FIRE_FOX,
                            l.blockX, l.blockY, 0, 0, dir, true);
                        this.objects.push(fire);
                        this.fireChars++;
                    }
                }
            }
        } else if (this.board.name === 'elevators') {
            this.barrelTimer++;
            if (this.barrelTimer >= 120) {
                this.barrelTimer = 0;
                if (this.board.launchers) {
                    if (this.board.launchers.left) {
                        const l = this.board.launchers.left;
                        const spring = new Spring(this, l.blockX, l.blockY, 0);
                        this.objects.push(spring);
                    }
                    if (this.board.launchers.right && Math.random() > 0.5) {
                        const l = this.board.launchers.right;
                        const spring = new Spring(this, l.blockX, l.blockY, 0);
                        this.objects.push(spring);
                    }
                }
            }
        } else if (this.board.name === 'rivets') {
            this.barrelTimer++;
            if (this.barrelTimer >= 100 && this.fireChars < 5) {
                this.barrelTimer = 0;
                if (this.board.launchers) {
                    const sides = ['left', 'right'];
                    const side = sides[Math.floor(Math.random() * 2)];
                    const launchers = this.board.launchers[side];
                    if (launchers && launchers.length > 0) {
                        const l = launchers[Math.floor(Math.random() * launchers.length)];
                        const dir = side === 'left' ? CONST.FACE_RIGHT : CONST.FACE_LEFT;
                        const fire = new FireChar(this, CONST.FIRE_BALL,
                            l.blockX, l.blockY, 0,
                            getFloorOffset(this.board, l.blockX, l.blockY),
                            dir, false);
                        this.objects.push(fire);
                        this.fireChars++;
                    }
                }
            }
        }
    }

    updateLady() {
        if (!this.lady) return;
        const anims = this.anims.lady.sequence;
        let curFace;
        if (this.lady.face === CONST.FACE_AUTO) {
            curFace = (this.jumpman.blockX < 14) ? CONST.FACE_LEFT : CONST.FACE_RIGHT;
        } else {
            curFace = this.lady.face;
        }
        const action = (curFace === CONST.FACE_LEFT) ? 'faceLeft' : 'faceRight';
        const seq = anims[action];
        if (!seq) return;
        this.lady.frameName = 'pauline-' + seq[this.lady.frame % seq.length].id;
        this.lady.frame++;
        if (this.lady.frame >= seq.length) this.lady.frame = 0;
    }

    updateFlames() {
        const anims = this.anims.objects.sequence;
        for (const flame of this.flamesObj) {
            if (!flame.visible) continue;
            const seq = anims[flame.animation];
            if (!seq) continue;
            const step = seq[flame.frame % seq.length];
            flame.frameName = 'flames-' + step.id;
            flame.frame++;
            if (flame.frame >= seq.length) flame.frame = 0;
        }
    }

    checkCollisions() {
        if (!this.jumpman.alive) return;
        if (this.jumpman.immortal) return;

        const jr = this.jumpman.getCollisionRect();

        for (const obj of this.objects) {
            if (!obj || !obj.collide || obj.destroyed || obj.scoreTimer > 0) continue;

            const or2 = obj.getCollisionRect();

            // Check hammer smash
            if (this.jumpman.hammer) {
                // Simplified hammer collision - wider range
                const hx = jr.x - 8;
                const hy = jr.y - 8;
                const hw = jr.w + 16;
                const hh = jr.h + 16;
                if (rectsOverlap(hx, hy, hw, hh, or2.x, or2.y, or2.w, or2.h)) {
                    this.smashMob(obj);
                    continue;
                }
            }

            if (rectsOverlap(jr.x, jr.y, jr.w, jr.h, or2.x, or2.y, or2.w, or2.h)) {
                // Hit by enemy
                if (this.jumpman.state !== this.jumpman.STATE_JUMP) {
                    this.jumpman.alive = false;
                    return;
                }
            }
        }

        // Check oil barrel collision (fire spawn)
        if (this.board.name === 'barrels') {
            for (const obj of this.objects) {
                if (!obj || obj.destroyed || !(obj instanceof Barrel)) continue;
                if (obj.color === 'b' && obj.blockY >= 12) {
                    // Blue barrel reached oil - spawn fire
                    const oilY = 12;
                    if (Math.floor(obj.blockY) >= oilY && !this.oilOnFire) {
                        this.oilOnFire = true;
                        for (const f of this.flamesObj) f.visible = true;
                    }
                    if (Math.floor(obj.blockY) >= oilY + 1) {
                        // Spawn fire character from oil
                        if (this.fireChars < 5) {
                            const dir = Math.random() > 0.5 ? CONST.FACE_RIGHT : CONST.FACE_LEFT;
                            const fire = new FireChar(this, CONST.FIRE_BALL,
                                2, 12, 0,
                                getFloorOffset(this.board, 2, 12),
                                dir, true);
                            this.objects.push(fire);
                            this.fireChars++;
                        }
                        obj.destroyed = true;
                    }
                }
            }
        }
    }

    smashMob(obj) {
        audioManager.play('smash');
        let pts;
        if (obj instanceof Barrel) {
            if (obj.color === 'o') {
                pts = 300;
            } else {
                const apt = [300, 500, 500, 800];
                pts = apt[Math.floor(Math.random() * 4)];
            }
        } else if (obj instanceof FireChar) {
            const apt = [300, 300, 300, 500, 500, 800];
            pts = apt[Math.floor(Math.random() * 6)];
            this.fireChars--;
        } else {
            pts = 300;
        }
        this.addScore(pts);
        obj.collide = false;
        obj.scoreTimer = 30;
        obj.scoreValue = pts;
    }

    checkJumpScore() {
        if (!this.jumpman.alive) return;
        if (this.jumpman.state !== this.jumpman.STATE_JUMP || this.jumpman.frame !== 10) return;

        let pts = 0;
        for (const obj of this.objects) {
            if (!obj || obj.destroyed || obj.scoreTimer > 0) continue;
            const isEnemy = (obj instanceof Barrel) || (obj instanceof FireChar) ||
                            (obj.name && obj.name === 'cement');
            if (!isEnemy) continue;

            const dx = Math.abs(this.jumpman.blockX - obj.blockX);
            const dy = obj.blockY - this.jumpman.blockY;
            if (dx <= 1 && dy >= 0 && dy <= 2) {
                if (pts === 0) pts = 100;
                else if (pts === 100) pts = 300;
                else pts = 500;
                obj._jumped = true;
            }
        }

        if (pts > 0) {
            this.addScore(pts);
            audioManager.play('get-item');
        }
    }

    checkHammerPickup() {
        if (this.jumpman.hammer) return;
        const jr = this.jumpman.getCollisionRect();

        for (let i = this.staticObjects.length - 1; i >= 0; i--) {
            const obj = this.staticObjects[i];
            if (!obj || !obj.isHammer || !obj.visible) continue;

            const ox = obj.x;
            const oy = obj.y;
            const rgn = this.regions.objects[obj.frameName];
            if (!rgn) continue;

            if (rectsOverlap(jr.x, jr.y, jr.w, jr.h,
                ox, oy - rgn.h, rgn.w, rgn.h)) {
                obj.visible = false;
                // Determine hammer type based on board
                const hammerColors = ['hit', 'hor', 'hbr'];
                const colorIdx = Math.min(this.currentLevel - 1, 2);
                this.jumpman.pickupHammer(hammerColors[colorIdx]);
            }
        }
    }

    checkItemPickup() {
        const jr = this.jumpman.getCollisionRect();

        for (const obj of this.staticObjects) {
            if (!obj || !obj.isItem || !obj.visible) continue;

            const ox = obj.x;
            const oy = obj.y;
            const rgn = this.regions.objects[obj.frameName];
            if (!rgn) continue;

            if (rectsOverlap(jr.x, jr.y, jr.w, jr.h,
                ox + (obj.cx || 0), oy - rgn.h + (obj.cy || 0),
                obj.cw || rgn.w, obj.ch || rgn.h)) {
                obj.visible = false;
                const itemPoints = { hat: 300, parasol: 300, purse: 800 };
                this.addScore(itemPoints[obj.frameName] || 300);
                audioManager.play('get-item');
            }
        }

        // Rivet pickup (walk over)
        if (this.board.name === 'rivets') {
            for (const obj of this.staticObjects) {
                if (!obj || !obj.isRivet || !obj.visible) continue;
                const ox = obj.x;
                const oy = obj.y;
                const rgn = this.regions.objects[obj.frameName];
                if (!rgn) continue;

                if (rectsOverlap(jr.x, jr.y, jr.w, jr.h,
                    ox + (obj.cx || 0), oy - rgn.h + (obj.cy || 0),
                    obj.cw || rgn.w, obj.ch || rgn.h)) {
                    obj.visible = false;
                    this.addScore(100);
                    this.rivetsRemaining--;
                    // Remove rivet from map
                    const tx = Math.floor(obj.blockX / 2);
                    this.board.map[obj.blockY][tx].rivet = false;
                }
            }
        }
    }

    checkBoardComplete() {
        if (this.board.name === 'rivets') {
            return this.rivetsRemaining <= 0;
        }
        if (this.board.complete) {
            return (this.jumpman.blockY === this.board.complete.y &&
                    this.jumpman.offsetY <= this.board.complete.o);
        }
        return false;
    }

    handleDeath() {
        this.gameState = this.STATE_DEATH;
        this.deathTimer = 120;
        this.jumpman.alive = false;
        this.jumpman.startDeath();
        audioManager.stopAll();
        audioManager.play('death');
    }

    nextBoard() {
        this.boardIndex++;
        if (this.boardIndex >= this.levelBoards.length) {
            // Next level
            this.currentLevel++;
            this.boardIndex = 0;
            this.difficulty.level = 1;
            this.setupLevelBoards();
        }
        this.loadBoard();
    }

    async triggerRoundComplete() {
        try {
            const wallet = await WalletManager.getWallet();
            if (!wallet || !wallet.publicKey) return;

            const result = await GameAPI.roundComplete(
                wallet.publicKey,
                this.board ? this.board.name : 'unknown',
                this.boardIndex + 1,
                this.currentLevel,
                this.jumpman ? this.jumpman.score : 0
            );

            console.log('Round complete recorded:', result);
        } catch (e) {
            console.error('Round complete error:', e);
        }
    }

    updateBonus() {
        this.bonusTimer += this.speed;
        if (this.currentBonus >= 100 && this.bonusTimer > this.bonusTime) {
            this.currentBonus -= 100;
            this.bonusTimer = 0;
        } else if (this.currentBonus === 0 && this.bonusTimer > 4283) {
            if (this.jumpman.state !== this.jumpman.STATE_JUMP) {
                this.jumpman.alive = this.jumpman.immortal;
            }
        }
    }

    updateDifficulty() {
        this.difficulty.timer += this.speed;
        if (this.difficulty.timer > 33333) {
            this.difficulty.timer = 0;
            if (this.difficulty.level < 5) this.difficulty.level++;
        }
    }

    addScore(pts) {
        this.jumpman.score += pts;
        this.jumpman.scoreLife += pts;
        if (this.jumpman.score > this.highScore) {
            this.highScore = this.jumpman.score;
        }
        // Extra life
        if (this.jumpman.scoreLife >= CONST.POINTS_LIFE) {
            this.jumpman.scoreLife -= CONST.POINTS_LIFE;
            this.jumpman.lives++;
        }
    }

    getConveyorDir(blockX, blockY) {
        if (!this.belts) return '';
        for (const belt of this.belts) {
            if (blockY === belt.y && blockX >= belt.xl && blockX <= belt.xr) {
                return belt.direction;
            }
        }
        return '';
    }

    // ---- High Scores ----
    loadHighScores() {
        try {
            const data = localStorage.getItem('dk_highscores');
            if (data) {
                this.highScores = JSON.parse(data);
                this.highScore = this.highScores.length > 0 ? this.highScores[0].score : 0;
            } else {
                this.highScores = [
                    { name: 'DK ', score: 10000 },
                    { name: 'MAR', score: 8000 },
                    { name: 'PAU', score: 6000 },
                    { name: 'JMP', score: 4000 },
                    { name: 'KNG', score: 2000 }
                ];
                this.highScore = 10000;
            }
        } catch (e) {
            this.highScores = [];
            this.highScore = 0;
        }
    }

    saveHighScores() {
        try {
            localStorage.setItem('dk_highscores', JSON.stringify(this.highScores));
        } catch (e) {}
    }

    async checkHighScore() {
        const score = this.jumpman.score;
        if (score <= 0) return;

        // Submit to server leaderboard
        try {
            const wallet = await WalletManager.getWallet();
            if (wallet && wallet.publicKey) {
                await GameAPI.submitHighScore(
                    wallet.publicKey, 
                    score, 
                    this.currentLevel, 
                    this.currentBoard
                );
            }
        } catch (e) {
            console.error('Failed to submit high score:', e);
        }

        // Keep local high scores for backward compatibility
        let inserted = false;
        for (let i = 0; i < this.highScores.length; i++) {
            if (score > this.highScores[i].score) {
                this.highScores.splice(i, 0, { name: 'AAA', score });
                this.highScores = this.highScores.slice(0, 10);
                inserted = true;
                break;
            }
        }
        if (!inserted && this.highScores.length < 10) {
            this.highScores.push({ name: 'AAA', score });
        }
        this.saveHighScores();
    }
}

// ---- Start the game ----
window.addEventListener('load', async () => {
    // Initialize all new modules
    TransactionHistory.init();
    Tutorial.init();
    TermsOfService.init();
    
    const walletScreen = document.getElementById('walletScreen');
    const menuOverlay = document.getElementById('menuOverlay');
    const accountBtn = document.getElementById('accountBtn');
    const keyModal = document.getElementById('keyModal');
    const pubKeyDisplay = document.getElementById('pubKeyDisplay');
    const privKeyDisplay = document.getElementById('privKeyDisplay');
    const keyModalClose = document.getElementById('keyModalClose');
    const createWalletBtn = document.getElementById('createWalletBtn');

    let currentWallet = null;

    function showAccountUI() {
        accountBtn.style.display = 'block';
    }

    function hideWalletScreen() {
        walletScreen.style.display = 'none';
    }

    function copyToClipboard(text, el) {
        navigator.clipboard.writeText(text).then(() => {
            const prev = el.textContent;
            const origColor = el.style.color;
            el.textContent = 'COPIED!';
            el.style.color = '#14f195';
            setTimeout(() => { el.textContent = prev; el.style.color = origColor; }, 1200);
        }).catch(() => {});
    }

    // Check for existing wallet
    try {
        currentWallet = await WalletManager.getWallet();
    } catch (e) {
        console.error('Failed to check wallet:', e);
    }

    if (currentWallet) {
        // Check if Terms of Service needs to be accepted
        if (TermsOfService.requiresAcceptance()) {
            hideWalletScreen();
            TermsOfService.show(() => {
                initializeGame();
            });
        } else {
            initializeGame();
        }
    } else {
        // No wallet — show creation screen, hide game menu
        walletScreen.style.display = 'flex';
        menuOverlay.style.display = 'none';
    }

    async function initializeGame() {
        hideWalletScreen();
        menuOverlay.style.display = 'flex';
        showAccountUI();
        ChatClient.init(currentWallet.publicKey);

        // Register player in database
        try {
            await GameAPI.registerPlayer(currentWallet.publicKey);
            console.log('Player registered:', currentWallet.publicKey);
        } catch (e) {
            console.error('Player registration failed:', e);
        }
        
        const game = new Game();
        
        // Initialize responsive handler
        ResponsiveHandler.init(
            document.getElementById('gameCanvas'),
            document.getElementById('gameContainer')
        );
        
        // Show tutorial for first-time users
        if (Tutorial.shouldShowTutorial()) {
            setTimeout(() => Tutorial.show(), 1000);
        }
    }

    // Create Wallet button
    createWalletBtn.addEventListener('click', async () => {
        createWalletBtn.classList.add('loading');
        createWalletBtn.textContent = 'GENERATING...';
        try {
            currentWallet = await WalletManager.createWallet();
            
            // Show Terms of Service for new wallets
            if (TermsOfService.requiresAcceptance()) {
                hideWalletScreen();
                TermsOfService.show(() => {
                    initializeGame();
                });
            } else {
                initializeGame();
            }
        } catch (e) {
            console.error('Wallet creation failed:', e);
            createWalletBtn.textContent = e.message || 'ERROR - RETRY';
            createWalletBtn.style.fontSize = '9px';
            createWalletBtn.classList.remove('loading');
        }
    });

    // Account button — open key modal
    accountBtn.addEventListener('click', () => {
        if (!currentWallet) return;
        pubKeyDisplay.textContent = currentWallet.publicKey;
        privKeyDisplay.textContent = WalletManager.getSecretKeyBase58(currentWallet.secretKey);
        keyModal.style.display = 'flex';
    });

    // Copy on click
    pubKeyDisplay.addEventListener('click', () => {
        copyToClipboard(pubKeyDisplay.textContent, pubKeyDisplay);
    });
    privKeyDisplay.addEventListener('click', () => {
        copyToClipboard(privKeyDisplay.textContent, privKeyDisplay);
    });

    // Close modal
    keyModalClose.addEventListener('click', () => {
        keyModal.style.display = 'none';
    });
    keyModal.addEventListener('click', (e) => {
        if (e.target === keyModal) keyModal.style.display = 'none';
    });
});

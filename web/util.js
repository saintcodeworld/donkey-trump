// ============================================================
// Donkey Kong JS - Utility Functions & Constants
// ============================================================

const CONST = {
    BLOCK_WIDTH: 16,
    BLOCK_HEIGHT: 32,
    BLOCKS_X: 28,
    BLOCKS_Y: 14,
    FACE_AUTO: 0,
    FACE_LEFT: 1,
    FACE_RIGHT: 2,
    GAME_SPEED: 30,
    HAMMER_TIME: 300,
    START_LIVES: 1,
    POINTS_LIFE: 7000,
    MAP_EMPTY: 0,
    MAP_ONLY_FLOOR: 1,
    MAP_TOP_LADDER: 2,
    MAP_BRKN_LADDER: 3,
    MAP_BTTM_LADDER: 4,
    MAP_FULL_LADDER: 5,
    MAP_RIVET: 6,
    MAP_ELEVATOR: 7,
    MAP_CONV_BELT: 8,
    MAP_INV_WALL: 9,
    ACT_NONE: 0,
    ACT_CLIMB_UP: 1,
    ACT_CLIMB_DOWN: 2,
    ACT_RUN_LEFT: 3,
    ACT_RUN_RIGHT: 4,
    ACT_JUMP_UP: 5,
    ACT_JUMP_LEFT: 6,
    ACT_JUMP_RIGHT: 7,
    BARREL_ROLL: 0,
    BARREL_WILD: 1,
    FIRE_BALL: 0,
    FIRE_FOX: 1,
    LADDER_AT_TOP: 0,
    LADDER_MOVE_DOWN: 1,
    LADDER_AT_BOTTOM: 2,
    LADDER_MOVE_UP: 3,
    OIL_BARREL_FREQ: 8,
    BOARD_Z: 20,
    CHARS_Z: 30,
    OBJECTS_Z: 40
};

// ---- Keyboard Input ----
const Keys = {
    up: false, down: false, left: false, right: false, jump: false,
    pause: false, back: false,
    reset() {
        this.up = false; this.down = false;
        this.left = false; this.right = false;
        this.jump = false; this.pause = false; this.back = false;
    }
};

window.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'ArrowUp': case 'KeyW': Keys.up = true; Keys.down = false; break;
        case 'ArrowDown': case 'KeyS': Keys.down = true; Keys.up = false; break;
        case 'ArrowLeft': case 'KeyA': Keys.left = true; Keys.right = false; break;
        case 'ArrowRight': case 'KeyD': Keys.right = true; Keys.left = false; break;
        case 'Space': Keys.jump = true; break;
        case 'KeyP': Keys.pause = true; break;
        case 'Escape': Keys.back = true; break;
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
});

window.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'ArrowUp': case 'KeyW': Keys.up = false; break;
        case 'ArrowDown': case 'KeyS': Keys.down = false; break;
        case 'ArrowLeft': case 'KeyA': Keys.left = false; break;
        case 'ArrowRight': case 'KeyD': Keys.right = false; break;
        case 'Space': Keys.jump = false; break;
        case 'KeyP': Keys.pause = false; break;
        case 'Escape': Keys.back = false; break;
    }
});

// ---- Map Tile Helpers ----
function getFloorOffset(board, blockX, blockY) {
    const bx = Math.floor(blockX);
    const by = Math.floor(blockY);
    if (bx < 0 || bx > 27 || by < 0 || by > 13) return -1;
    const tx = Math.floor(bx / 2);
    if (!board.map || !board.map[by] || !board.map[by][tx]) return -1;
    return board.map[by][tx].o - 1;
}

function getBlockType(board, blockX, blockY) {
    const bx = Math.floor(blockX);
    const by = Math.floor(blockY);
    if (bx < 0 || bx > 27 || by < 0 || by > 13) return CONST.MAP_INV_WALL;
    const tx = Math.floor(bx / 2);
    if (!board.map || !board.map[by] || !board.map[by][tx]) return CONST.MAP_INV_WALL;
    const mapTile = board.map[by][tx];
    let blockType = (bx % 2 !== 0) ? mapTile.r : mapTile.l;
    if (blockType === CONST.MAP_RIVET && !mapTile.rivet) {
        blockType = CONST.MAP_EMPTY;
    }
    return blockType;
}

function getPlatform(board, blockX, blockY) {
    const bx = Math.floor(blockX);
    const by = Math.floor(blockY);
    if (bx < 0 || bx > 27 || by < 0 || by > 13) return null;
    const tx = Math.floor(bx / 2);
    if (!board.map || !board.map[by] || !board.map[by][tx]) return null;
    return board.map[by][tx].p;
}

function getConveyorDirection(belts, blockX, blockY) {
    for (const belt of belts) {
        if (blockY === belt.y && blockX >= belt.xl && blockX <= belt.xr) {
            return belt.direction;
        }
    }
    return "";
}

function setBlockProperties(board, blockX, blockY, offset, platform) {
    const tx = Math.floor(blockX / 2);
    board.map[blockY][tx].o = offset;
    if (platform !== undefined) board.map[blockY][tx].p = platform;
}

function ladderState(board, blockX, blockY, allowUp) {
    const tx = Math.round(blockX / 2);
    const ty = blockY;
    const mt = allowUp ? CONST.MAP_FULL_LADDER : CONST.MAP_BRKN_LADDER;
    if (tx % 2 !== 0) {
        board.map[ty][tx].l = mt;
    } else {
        board.map[ty][tx].r = mt;
    }
    board.map[ty][tx].ml = true;
}

function isMovingLadder(board, blockX, blockY) {
    if (blockY < 0 || blockY > 13) return false;
    const tx = Math.floor(blockX / 2);
    return !!board.map[blockY][tx].ml;
}

function isTileEmpty(block) {
    return block != null && (block === CONST.MAP_EMPTY || block === CONST.MAP_BRKN_LADDER);
}

function isLadder(block) {
    return block != null && (block === CONST.MAP_TOP_LADDER || block === CONST.MAP_FULL_LADDER || block === CONST.MAP_BTTM_LADDER);
}

function isAnyLadder(block) {
    return block != null && (block === CONST.MAP_TOP_LADDER || block === CONST.MAP_FULL_LADDER || block === CONST.MAP_BTTM_LADDER || block === CONST.MAP_BRKN_LADDER);
}

function isAnyTopLadder(block) {
    return block != null && (block === CONST.MAP_TOP_LADDER || block === CONST.MAP_FULL_LADDER || block === CONST.MAP_BRKN_LADDER);
}

function isTopLadder(block) {
    return block != null && (block === CONST.MAP_TOP_LADDER || block === CONST.MAP_FULL_LADDER);
}

function isBottomLadder(block) {
    return block != null && (block === CONST.MAP_FULL_LADDER || block === CONST.MAP_BTTM_LADDER);
}

function isFloor(block) {
    return block != null && (block === CONST.MAP_ONLY_FLOOR || block === CONST.MAP_CONV_BELT || block === CONST.MAP_RIVET || block === CONST.MAP_BTTM_LADDER);
}

function isFloorDown(block) {
    return block != null && (block === CONST.MAP_ONLY_FLOOR || block === CONST.MAP_CONV_BELT || block === CONST.MAP_TOP_LADDER || block === CONST.MAP_BTTM_LADDER || block === CONST.MAP_RIVET);
}

function isFloorUp(block) {
    return block != null && (block === CONST.MAP_ONLY_FLOOR || block === CONST.MAP_CONV_BELT || block === CONST.MAP_BTTM_LADDER);
}

function isElevator(block) {
    return block != null && (block === CONST.MAP_ELEVATOR);
}

function zeroPad(num, len) {
    len = len || 2;
    let s = String(num);
    while (s.length < len) s = '0' + s;
    return s;
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// ---- Sprite Region Loading ----
function loadSpriteRegions(spriteJson, image) {
    const regions = {};
    for (const name in spriteJson.frames) {
        const f = spriteJson.frames[name].frame;
        regions[name] = { x: f.x, y: f.y, w: f.w, h: f.h, image: image };
    }
    return regions;
}

// ---- Collision detection (AABB) ----
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// Convert BrightScript color "0xRRGGBBFF" to CSS "#RRGGBB"
function brsColorToCSS(brsColor) {
    if (!brsColor) return '#ffffff';
    if (brsColor.startsWith('#')) return brsColor;
    // BrightScript format: "0xRRGGBBFF" (last 2 chars are alpha)
    const hex = brsColor.replace('0x', '').replace('0X', '');
    if (hex.length >= 6) {
        return '#' + hex.substring(0, 6);
    }
    return '#ffffff';
}

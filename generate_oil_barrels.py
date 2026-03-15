#!/usr/bin/env python3
"""
Modify the objects.png sprite sheet to replace barrel sprites with oil barrel sprites.
Only replaces the barrel-related frames, keeping everything else intact.
"""

from PIL import Image, ImageDraw

# Oil barrel colors
OIL_BLACK = (30, 30, 35)
OIL_DARK = (50, 50, 55)
OIL_GRAY = (80, 80, 85)
OIL_HIGHLIGHT = (110, 110, 120)
OIL_BAND = (60, 60, 65)
OIL_LABEL_BG = (70, 70, 75)
OIL_DRIP = (20, 20, 20)
OIL_SHEEN = (100, 110, 120)

# Blue oil barrel (for blue barrels)
BLUE_OIL_DARK = (20, 30, 60)
BLUE_OIL_MID = (40, 55, 100)
BLUE_OIL_LIGHT = (60, 80, 140)
BLUE_OIL_HIGHLIGHT = (80, 100, 160)
BLUE_OIL_BAND = (30, 40, 80)

# Text/marking color
MARK_YELLOW = (200, 180, 40)
MARK_RED = (180, 40, 30)


def draw_oil_barrel_rolling(draw, ox, oy, w, h, rotation=0, blue=False):
    """Draw a rolling oil barrel (24x20 or 32x20).
    rotation: 0-3 for different rotation angles."""
    cx = ox + w // 2
    cy = oy + h // 2

    if blue:
        body_color = BLUE_OIL_MID
        dark_color = BLUE_OIL_DARK
        light_color = BLUE_OIL_LIGHT
        band_color = BLUE_OIL_BAND
        highlight = BLUE_OIL_HIGHLIGHT
    else:
        body_color = OIL_DARK
        dark_color = OIL_BLACK
        light_color = OIL_GRAY
        band_color = OIL_BAND
        highlight = OIL_HIGHLIGHT

    # Main barrel body (cylinder seen from side while rolling)
    barrel_left = ox + 2
    barrel_right = ox + w - 2
    barrel_top = oy + 2
    barrel_bottom = oy + h - 2

    # Barrel body
    draw.rectangle([barrel_left, barrel_top, barrel_right, barrel_bottom], fill=body_color)

    # Top and bottom rims (darker bands)
    draw.rectangle([barrel_left, barrel_top, barrel_right, barrel_top + 2], fill=band_color)
    draw.rectangle([barrel_left, barrel_bottom - 2, barrel_right, barrel_bottom], fill=band_color)

    # Middle band
    mid_y = cy - 1
    draw.rectangle([barrel_left, mid_y, barrel_right, mid_y + 2], fill=band_color)

    # Highlight/sheen on one side (rotates with barrel)
    if rotation == 0:
        draw.rectangle([cx - 2, barrel_top + 3, cx + 2, barrel_bottom - 3], fill=highlight)
    elif rotation == 1:
        draw.rectangle([cx + 2, barrel_top + 3, cx + 5, barrel_bottom - 3], fill=highlight)
    elif rotation == 2:
        draw.rectangle([barrel_right - 5, barrel_top + 3, barrel_right - 2, barrel_bottom - 3], fill=highlight)
    elif rotation == 3:
        draw.rectangle([barrel_left + 2, barrel_top + 3, barrel_left + 5, barrel_bottom - 3], fill=highlight)

    # "OIL" marking or hazard stripe
    if w >= 24:
        # Small text-like marking
        mark_y = cy - 2
        if rotation in [0, 2]:
            # Show "OIL" text area
            draw.rectangle([cx - 4, mark_y, cx + 4, mark_y + 4], fill=MARK_YELLOW)
            # Tiny "OIL" approximation
            draw.point((cx - 3, mark_y + 1), fill=dark_color)
            draw.point((cx - 3, mark_y + 3), fill=dark_color)
            draw.point((cx, mark_y + 1), fill=dark_color)
            draw.point((cx, mark_y + 3), fill=dark_color)
            draw.point((cx + 3, mark_y + 1), fill=dark_color)
        else:
            # Side view - just show edge of label
            draw.rectangle([cx + 2, mark_y, cx + 6, mark_y + 4], fill=MARK_YELLOW)

    # Oil drip on top
    if rotation % 2 == 0:
        draw.rectangle([cx - 1, barrel_top - 1, cx + 1, barrel_top + 1], fill=OIL_DRIP)


def draw_oil_barrel_falling(draw, ox, oy, w, h, frame=0, blue=False):
    """Draw a falling oil barrel (front view, 32x20)."""
    cx = ox + w // 2
    cy = oy + h // 2

    if blue:
        body_color = BLUE_OIL_MID
        dark_color = BLUE_OIL_DARK
        light_color = BLUE_OIL_LIGHT
        band_color = BLUE_OIL_BAND
        rim_color = BLUE_OIL_HIGHLIGHT
    else:
        body_color = OIL_DARK
        dark_color = OIL_BLACK
        light_color = OIL_GRAY
        band_color = OIL_BAND
        rim_color = OIL_HIGHLIGHT

    # Barrel seen from top/front while falling
    barrel_left = ox + 3
    barrel_right = ox + w - 3
    barrel_top = oy + 2
    barrel_bottom = oy + h - 2

    # Main body (elliptical top view)
    draw.ellipse([barrel_left, barrel_top, barrel_right, barrel_bottom], fill=body_color)

    # Outer rim
    draw.ellipse([barrel_left, barrel_top, barrel_right, barrel_bottom], outline=band_color, width=2)

    # Inner circle (top opening)
    inner_margin = 4
    draw.ellipse([barrel_left + inner_margin, barrel_top + inner_margin,
                  barrel_right - inner_margin, barrel_bottom - inner_margin],
                 fill=dark_color)

    # Oil inside (slightly lighter)
    oil_margin = 6
    if frame == 0:
        draw.ellipse([barrel_left + oil_margin, barrel_top + oil_margin,
                      barrel_right - oil_margin, barrel_bottom - oil_margin],
                     fill=(20, 20, 25))
    else:
        draw.ellipse([barrel_left + oil_margin + 1, barrel_top + oil_margin + 1,
                      barrel_right - oil_margin - 1, barrel_bottom - oil_margin - 1],
                     fill=(25, 25, 30))

    # Highlight on rim
    draw.arc([barrel_left + 1, barrel_top + 1, barrel_right - 1, barrel_bottom - 1],
             200, 340, fill=rim_color, width=1)


def draw_static_oil_barrel(draw, ox, oy, w, h):
    """Draw the static barrel/stack sprite (20x32 'barrel' or 40x64 'barrels')."""
    cx = ox + w // 2

    if w <= 24:
        # Single small barrel (20x32)
        barrel_left = ox + 1
        barrel_right = ox + w - 1
        barrel_top = oy + 1
        barrel_bottom = oy + h - 1

        # Body
        draw.rectangle([barrel_left, barrel_top, barrel_right, barrel_bottom], fill=OIL_DARK)

        # Top/bottom rims
        draw.rectangle([barrel_left, barrel_top, barrel_right, barrel_top + 3], fill=OIL_BAND)
        draw.rectangle([barrel_left, barrel_bottom - 3, barrel_right, barrel_bottom], fill=OIL_BAND)

        # Middle band
        mid_y = oy + h // 2
        draw.rectangle([barrel_left, mid_y - 1, barrel_right, mid_y + 1], fill=OIL_BAND)

        # Highlight
        draw.rectangle([cx - 1, barrel_top + 4, cx + 1, barrel_bottom - 4], fill=OIL_HIGHLIGHT)

        # "OIL" label area
        label_y = mid_y - 4
        draw.rectangle([cx - 5, label_y, cx + 5, label_y + 6], fill=MARK_YELLOW)
        # Tiny marks
        draw.point((cx - 3, label_y + 2), fill=OIL_BLACK)
        draw.point((cx, label_y + 2), fill=OIL_BLACK)
        draw.point((cx + 3, label_y + 2), fill=OIL_BLACK)

    else:
        # Stack of barrels (40x64)
        bw = w // 2 - 1
        bh = h // 2 - 2

        # Bottom row: 2 barrels
        for i in range(2):
            bx = ox + i * (bw + 2)
            by = oy + h // 2
            draw.rectangle([bx + 1, by, bx + bw, by + bh], fill=OIL_DARK)
            draw.rectangle([bx + 1, by, bx + bw, by + 2], fill=OIL_BAND)
            draw.rectangle([bx + 1, by + bh - 2, bx + bw, by + bh], fill=OIL_BAND)
            mid = by + bh // 2
            draw.rectangle([bx + 1, mid - 1, bx + bw, mid + 1], fill=OIL_BAND)
            bcx = bx + bw // 2
            draw.rectangle([bcx - 4, mid - 3, bcx + 4, mid + 3], fill=MARK_YELLOW)
            draw.rectangle([bcx - 1, by + 3, bcx + 1, by + bh - 3], fill=OIL_HIGHLIGHT)

        # Top row: 1 barrel centered
        bx = ox + w // 4
        by = oy + 2
        draw.rectangle([bx + 1, by, bx + bw, by + bh], fill=OIL_DARK)
        draw.rectangle([bx + 1, by, bx + bw, by + 2], fill=OIL_BAND)
        draw.rectangle([bx + 1, by + bh - 2, bx + bw, by + bh], fill=OIL_BAND)
        mid = by + bh // 2
        draw.rectangle([bx + 1, mid - 1, bx + bw, mid + 1], fill=OIL_BAND)
        bcx = bx + bw // 2
        draw.rectangle([bcx - 4, mid - 3, bcx + 4, mid + 3], fill=MARK_YELLOW)
        draw.rectangle([bcx - 1, by + 3, bcx + 1, by + bh - 3], fill=OIL_HIGHLIGHT)


def draw_oil_drum(draw, ox, oy, w, h):
    """Draw the oil drum (fire container) - 32x32"""
    cx = ox + w // 2

    # Main drum body
    drum_left = ox + 4
    drum_right = ox + w - 4
    drum_top = oy + 4
    drum_bottom = oy + h - 2

    draw.rectangle([drum_left, drum_top, drum_right, drum_bottom], fill=OIL_DARK)

    # Rims
    draw.rectangle([drum_left - 1, drum_top, drum_right + 1, drum_top + 3], fill=OIL_BAND)
    draw.rectangle([drum_left - 1, drum_bottom - 3, drum_right + 1, drum_bottom], fill=OIL_BAND)

    # Middle band
    mid = oy + h // 2
    draw.rectangle([drum_left, mid - 1, drum_right, mid + 1], fill=OIL_BAND)

    # "OIL" label
    draw.rectangle([cx - 6, mid - 4, cx + 6, mid + 4], fill=MARK_YELLOW)
    # Approximate "OIL" text
    draw.rectangle([cx - 5, mid - 3, cx - 3, mid + 3], fill=OIL_BLACK)  # O
    draw.rectangle([cx - 4, mid - 2, cx - 4, mid + 2], fill=MARK_YELLOW)  # O hole
    draw.rectangle([cx - 1, mid - 3, cx + 1, mid + 3], fill=OIL_BLACK)  # I
    draw.rectangle([cx + 3, mid - 3, cx + 5, mid + 3], fill=OIL_BLACK)  # L
    draw.rectangle([cx + 4, mid + 1, cx + 6, mid + 3], fill=OIL_BLACK)  # L bottom

    # Highlight
    draw.rectangle([cx + 7, drum_top + 4, cx + 8, drum_bottom - 4], fill=OIL_HIGHLIGHT)

    # Oil drip from top
    draw.rectangle([cx - 2, drum_top - 2, cx + 2, drum_top + 1], fill=OIL_DRIP)


def generate_oil_barrels():
    """Modify the objects.png to replace barrel sprites with oil barrels."""
    # Load existing objects sheet
    img = Image.open('assets/sprites/objects.png').convert('RGBA')
    draw = ImageDraw.Draw(img)

    # Frame positions from objects.json:

    # "barrel" - single static barrel (20x32) at x:3, y:3
    # Clear and redraw
    draw.rectangle([3, 3, 22, 34], fill=(0, 0, 0, 0))
    draw_static_oil_barrel(draw, 3, 3, 20, 32)

    # "barrels" - barrel stack (40x64) at x:26, y:3
    draw.rectangle([26, 3, 65, 66], fill=(0, 0, 0, 0))
    draw_static_oil_barrel(draw, 26, 3, 40, 64)

    # Orange barrel rolling frames (ob-rolling-1 to ob-rolling-4, 24x20)
    ob_frames = [
        (78, 210, 24, 20),   # ob-rolling-1
        (105, 210, 24, 20),  # ob-rolling-2
        (132, 210, 24, 20),  # ob-rolling-3
        (159, 210, 24, 20),  # ob-rolling-4
    ]
    for i, (x, y, w, h) in enumerate(ob_frames):
        draw.rectangle([x, y, x + w - 1, y + h - 1], fill=(0, 0, 0, 0))
        draw_oil_barrel_rolling(draw, x, y, w, h, rotation=i, blue=False)

    # Orange barrel falling frames (ob-rolling-5 and ob-rolling-6, 32x20)
    ob_fall_frames = [
        (186, 210, 32, 20),  # ob-rolling-5
        (221, 210, 32, 20),  # ob-rolling-6
    ]
    for i, (x, y, w, h) in enumerate(ob_fall_frames):
        draw.rectangle([x, y, x + w - 1, y + h - 1], fill=(0, 0, 0, 0))
        draw_oil_barrel_falling(draw, x, y, w, h, frame=i, blue=False)

    # Blue barrel rolling frames (bb-rolling-1 to bb-rolling-4, 24x20)
    bb_frames = [
        (69, 3, 24, 20),   # bb-rolling-1
        (96, 3, 24, 20),   # bb-rolling-2
        (123, 3, 24, 20),  # bb-rolling-3
        (150, 3, 24, 20),  # bb-rolling-4
    ]
    for i, (x, y, w, h) in enumerate(bb_frames):
        draw.rectangle([x, y, x + w - 1, y + h - 1], fill=(0, 0, 0, 0))
        draw_oil_barrel_rolling(draw, x, y, w, h, rotation=i, blue=True)

    # Blue barrel falling frames (bb-rolling-5 and bb-rolling-6, 32x20)
    bb_fall_frames = [
        (177, 3, 32, 20),   # bb-rolling-5
        (212, 3, 32, 20),   # bb-rolling-6
    ]
    for i, (x, y, w, h) in enumerate(bb_fall_frames):
        draw.rectangle([x, y, x + w - 1, y + h - 1], fill=(0, 0, 0, 0))
        draw_oil_barrel_falling(draw, x, y, w, h, frame=i, blue=True)

    # "oil" - the oil drum/fire container (32x32) at x:256, y:210
    draw.rectangle([256, 210, 287, 241], fill=(0, 0, 0, 0))
    draw_oil_drum(draw, 256, 210, 32, 32)

    # Save
    img.save('assets/sprites/objects.png')
    print('Generated oil barrel sprites in: assets/sprites/objects.png')


if __name__ == '__main__':
    generate_oil_barrels()

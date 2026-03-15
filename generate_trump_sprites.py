#!/usr/bin/env python3
"""
Generate Donald Trump pixel art sprite sheet to replace Donkey Kong.
Matches the exact frame layout from kong.json (453x453 sheet, 23 frames).
"""

from PIL import Image, ImageDraw

# Colors
SKIN = (255, 200, 150)
SKIN_DARK = (220, 170, 120)
SKIN_SHADOW = (190, 140, 100)
HAIR_GOLD = (255, 215, 0)
HAIR_LIGHT = (255, 235, 100)
HAIR_DARK = (200, 160, 0)
SUIT_BLUE = (30, 40, 100)
SUIT_DARK = (20, 25, 70)
SUIT_LIGHT = (50, 60, 130)
TIE_RED = (220, 30, 30)
TIE_DARK = (180, 20, 20)
SHIRT_WHITE = (240, 240, 245)
EYE_WHITE = (255, 255, 255)
EYE_BLUE = (80, 130, 200)
EYE_BLACK = (30, 30, 30)
MOUTH = (200, 80, 80)
MOUTH_DARK = (160, 50, 50)
BROW = (180, 140, 60)
TRANSPARENT = (0, 0, 0, 0)
HAND_COLOR = SKIN

def draw_trump_front(draw, ox, oy, w, h):
    """Draw Trump facing front - main standing pose (96x64)"""
    cx, cy = ox + w // 2, oy + h // 2

    # Body/suit (centered, wide torso)
    suit_top = oy + h * 0.35
    suit_left = ox + w * 0.2
    suit_right = ox + w * 0.8
    suit_bottom = oy + h - 2
    draw.rectangle([suit_left, suit_top, suit_right, suit_bottom], fill=SUIT_BLUE)

    # Suit lapels - V shape
    draw.polygon([
        (cx - 2, suit_top + 4),
        (cx - 14, suit_top),
        (cx - 14, suit_top + 20),
    ], fill=SUIT_DARK)
    draw.polygon([
        (cx + 2, suit_top + 4),
        (cx + 14, suit_top),
        (cx + 14, suit_top + 20),
    ], fill=SUIT_DARK)

    # Shirt/tie area
    draw.rectangle([cx - 4, suit_top, cx + 4, suit_bottom - 10], fill=SHIRT_WHITE)
    # Red tie
    draw.polygon([
        (cx, suit_top + 2),
        (cx - 5, suit_top + 10),
        (cx, suit_bottom - 12),
        (cx + 5, suit_top + 10),
    ], fill=TIE_RED)
    draw.polygon([
        (cx - 3, suit_top + 8),
        (cx + 3, suit_top + 8),
        (cx, suit_top + 2),
    ], fill=TIE_DARK)

    # Arms
    draw.rectangle([ox + 4, suit_top + 2, suit_left + 2, suit_bottom - 8], fill=SUIT_BLUE)
    draw.rectangle([suit_right - 2, suit_top + 2, ox + w - 4, suit_bottom - 8], fill=SUIT_BLUE)
    # Hands
    draw.ellipse([ox + 2, suit_bottom - 14, ox + 14, suit_bottom - 4], fill=SKIN)
    draw.ellipse([ox + w - 14, suit_bottom - 14, ox + w - 2, suit_bottom - 4], fill=SKIN)

    # Head (large, oval)
    head_top = oy + 2
    head_bottom = suit_top + 6
    head_left = cx - 20
    head_right = cx + 20
    draw.ellipse([head_left, head_top, head_right, head_bottom], fill=SKIN)

    # Hair - golden, swept back, voluminous
    hair_top = head_top - 4
    draw.ellipse([head_left - 4, hair_top, head_right + 4, head_top + 16], fill=HAIR_GOLD)
    draw.ellipse([head_left - 2, hair_top, head_right + 2, head_top + 12], fill=HAIR_LIGHT)
    # Side hair
    draw.ellipse([head_left - 5, head_top + 4, head_left + 6, head_top + 18], fill=HAIR_GOLD)
    draw.ellipse([head_right - 6, head_top + 4, head_right + 5, head_top + 18], fill=HAIR_GOLD)
    # Hair swoop on top
    draw.arc([head_left - 2, hair_top - 2, head_right + 2, hair_top + 14], 180, 360, fill=HAIR_DARK, width=2)

    # Eyes
    eye_y = head_top + 14
    # Left eye
    draw.ellipse([cx - 14, eye_y, cx - 6, eye_y + 6], fill=EYE_WHITE)
    draw.ellipse([cx - 12, eye_y + 1, cx - 8, eye_y + 5], fill=EYE_BLUE)
    draw.point((cx - 10, eye_y + 3), fill=EYE_BLACK)
    # Right eye
    draw.ellipse([cx + 6, eye_y, cx + 14, eye_y + 6], fill=EYE_WHITE)
    draw.ellipse([cx + 8, eye_y + 1, cx + 12, eye_y + 5], fill=EYE_BLUE)
    draw.point((cx + 10, eye_y + 3), fill=EYE_BLACK)
    # Eyebrows
    draw.line([(cx - 15, eye_y - 2), (cx - 5, eye_y - 2)], fill=BROW, width=2)
    draw.line([(cx + 5, eye_y - 2), (cx + 15, eye_y - 2)], fill=BROW, width=2)

    # Mouth - slight pout/pursed lips
    mouth_y = head_top + 24
    draw.ellipse([cx - 6, mouth_y, cx + 6, mouth_y + 5], fill=MOUTH)
    draw.line([(cx - 5, mouth_y + 2), (cx + 5, mouth_y + 2)], fill=MOUTH_DARK, width=1)

    # Chin
    draw.ellipse([cx - 8, mouth_y + 2, cx + 8, mouth_y + 8], fill=SKIN_DARK)


def draw_trump_barrel_hold(draw, ox, oy, w, h):
    """Trump holding a barrel overhead (96x64)"""
    cx, cy = ox + w // 2, oy + h // 2

    # Body
    suit_top = oy + h * 0.4
    suit_left = ox + w * 0.22
    suit_right = ox + w * 0.78
    suit_bottom = oy + h - 2
    draw.rectangle([suit_left, suit_top, suit_right, suit_bottom], fill=SUIT_BLUE)

    # Tie
    draw.rectangle([cx - 3, suit_top, cx + 3, suit_bottom - 8], fill=SHIRT_WHITE)
    draw.polygon([(cx, suit_top + 2), (cx - 4, suit_top + 8), (cx, suit_bottom - 10), (cx + 4, suit_top + 8)], fill=TIE_RED)

    # Arms raised up
    draw.rectangle([ox + 6, oy + 4, suit_left + 4, suit_top + 8], fill=SUIT_BLUE)
    draw.rectangle([suit_right - 4, oy + 4, ox + w - 6, suit_top + 8], fill=SUIT_BLUE)
    # Hands up
    draw.ellipse([ox + 2, oy, ox + 14, oy + 10], fill=SKIN)
    draw.ellipse([ox + w - 14, oy, ox + w - 2, oy + 10], fill=SKIN)

    # Head
    head_top = suit_top - 18
    head_bottom = suit_top + 4
    head_left = cx - 18
    head_right = cx + 18
    draw.ellipse([head_left, head_top, head_right, head_bottom], fill=SKIN)

    # Hair
    draw.ellipse([head_left - 3, head_top - 4, head_right + 3, head_top + 12], fill=HAIR_GOLD)
    draw.ellipse([head_left - 1, head_top - 4, head_right + 1, head_top + 10], fill=HAIR_LIGHT)

    # Eyes
    eye_y = head_top + 10
    draw.ellipse([cx - 12, eye_y, cx - 5, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx - 10, eye_y + 1, cx - 7, eye_y + 4], fill=EYE_BLUE)
    draw.ellipse([cx + 5, eye_y, cx + 12, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx + 7, eye_y + 1, cx + 10, eye_y + 4], fill=EYE_BLUE)
    # Brows
    draw.line([(cx - 13, eye_y - 2), (cx - 4, eye_y - 2)], fill=BROW, width=2)
    draw.line([(cx + 4, eye_y - 2), (cx + 13, eye_y - 2)], fill=BROW, width=2)

    # Mouth
    mouth_y = head_top + 18
    draw.ellipse([cx - 5, mouth_y, cx + 5, mouth_y + 4], fill=MOUTH)


def draw_trump_arms_shake_l(draw, ox, oy, w, h):
    """Trump with left arm raised - shaking/gesturing (96x64)"""
    cx, cy = ox + w // 2, oy + h // 2

    # Body
    suit_top = oy + h * 0.38
    suit_left = ox + w * 0.2
    suit_right = ox + w * 0.8
    suit_bottom = oy + h - 2
    draw.rectangle([suit_left, suit_top, suit_right, suit_bottom], fill=SUIT_BLUE)
    draw.rectangle([cx - 3, suit_top, cx + 3, suit_bottom - 8], fill=SHIRT_WHITE)
    draw.polygon([(cx, suit_top + 2), (cx - 4, suit_top + 8), (cx, suit_bottom - 10), (cx + 4, suit_top + 8)], fill=TIE_RED)

    # Left arm raised (pointing)
    draw.rectangle([ox + 4, oy + 8, suit_left + 4, suit_top + 6], fill=SUIT_BLUE)
    draw.ellipse([ox, oy + 2, ox + 12, oy + 12], fill=SKIN)

    # Right arm down
    draw.rectangle([suit_right - 2, suit_top + 2, ox + w - 6, suit_bottom - 8], fill=SUIT_BLUE)
    draw.ellipse([ox + w - 14, suit_bottom - 14, ox + w - 2, suit_bottom - 4], fill=SKIN)

    # Head
    head_top = oy + 2
    head_bottom = suit_top + 6
    draw.ellipse([cx - 20, head_top, cx + 20, head_bottom], fill=SKIN)

    # Hair
    draw.ellipse([cx - 23, head_top - 4, cx + 23, head_top + 14], fill=HAIR_GOLD)
    draw.ellipse([cx - 21, head_top - 4, cx + 21, head_top + 10], fill=HAIR_LIGHT)

    # Eyes
    eye_y = head_top + 12
    draw.ellipse([cx - 13, eye_y, cx - 6, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx - 11, eye_y + 1, cx - 8, eye_y + 4], fill=EYE_BLUE)
    draw.ellipse([cx + 6, eye_y, cx + 13, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx + 8, eye_y + 1, cx + 11, eye_y + 4], fill=EYE_BLUE)
    draw.line([(cx - 14, eye_y - 2), (cx - 5, eye_y - 2)], fill=BROW, width=2)
    draw.line([(cx + 5, eye_y - 2), (cx + 14, eye_y - 2)], fill=BROW, width=2)

    # Mouth - open like speaking
    mouth_y = head_top + 22
    draw.ellipse([cx - 6, mouth_y, cx + 6, mouth_y + 6], fill=MOUTH)
    draw.ellipse([cx - 4, mouth_y + 1, cx + 4, mouth_y + 5], fill=MOUTH_DARK)


def draw_trump_arms_shake_r(draw, ox, oy, w, h):
    """Trump with right arm raised (96x64)"""
    cx, cy = ox + w // 2, oy + h // 2

    # Body
    suit_top = oy + h * 0.38
    suit_left = ox + w * 0.2
    suit_right = ox + w * 0.8
    suit_bottom = oy + h - 2
    draw.rectangle([suit_left, suit_top, suit_right, suit_bottom], fill=SUIT_BLUE)
    draw.rectangle([cx - 3, suit_top, cx + 3, suit_bottom - 8], fill=SHIRT_WHITE)
    draw.polygon([(cx, suit_top + 2), (cx - 4, suit_top + 8), (cx, suit_bottom - 10), (cx + 4, suit_top + 8)], fill=TIE_RED)

    # Left arm down
    draw.rectangle([ox + 6, suit_top + 2, suit_left + 4, suit_bottom - 8], fill=SUIT_BLUE)
    draw.ellipse([ox + 2, suit_bottom - 14, ox + 14, suit_bottom - 4], fill=SKIN)

    # Right arm raised (pointing)
    draw.rectangle([suit_right - 4, oy + 8, ox + w - 4, suit_top + 6], fill=SUIT_BLUE)
    draw.ellipse([ox + w - 12, oy + 2, ox + w, oy + 12], fill=SKIN)

    # Head
    head_top = oy + 2
    head_bottom = suit_top + 6
    draw.ellipse([cx - 20, head_top, cx + 20, head_bottom], fill=SKIN)

    # Hair
    draw.ellipse([cx - 23, head_top - 4, cx + 23, head_top + 14], fill=HAIR_GOLD)
    draw.ellipse([cx - 21, head_top - 4, cx + 21, head_top + 10], fill=HAIR_LIGHT)

    # Eyes
    eye_y = head_top + 12
    draw.ellipse([cx - 13, eye_y, cx - 6, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx - 11, eye_y + 1, cx - 8, eye_y + 4], fill=EYE_BLUE)
    draw.ellipse([cx + 6, eye_y, cx + 13, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx + 8, eye_y + 1, cx + 11, eye_y + 4], fill=EYE_BLUE)
    draw.line([(cx - 14, eye_y - 2), (cx - 5, eye_y - 2)], fill=BROW, width=2)
    draw.line([(cx + 5, eye_y - 2), (cx + 14, eye_y - 2)], fill=BROW, width=2)

    # Mouth
    mouth_y = head_top + 22
    draw.ellipse([cx - 6, mouth_y, cx + 6, mouth_y + 6], fill=MOUTH)
    draw.ellipse([cx - 4, mouth_y + 1, cx + 4, mouth_y + 5], fill=MOUTH_DARK)


def draw_trump_climb(draw, ox, oy, w, h):
    """Trump climbing (side view) for kidnap sequences (96x72)"""
    cx, cy = ox + w // 2, oy + h // 2

    # Body slightly sideways
    suit_top = oy + h * 0.35
    suit_left = ox + w * 0.25
    suit_right = ox + w * 0.75
    suit_bottom = oy + h - 4
    draw.rectangle([suit_left, suit_top, suit_right, suit_bottom], fill=SUIT_BLUE)
    draw.rectangle([cx - 3, suit_top, cx + 3, suit_bottom - 6], fill=SHIRT_WHITE)
    draw.polygon([(cx, suit_top), (cx - 4, suit_top + 6), (cx, suit_bottom - 8), (cx + 4, suit_top + 6)], fill=TIE_RED)

    # Arms reaching up
    draw.rectangle([suit_left - 4, oy + 2, suit_left + 8, suit_top + 4], fill=SUIT_BLUE)
    draw.rectangle([suit_right - 8, oy + 6, suit_right + 4, suit_top + 4], fill=SUIT_BLUE)
    draw.ellipse([suit_left - 6, oy - 2, suit_left + 6, oy + 8], fill=SKIN)
    draw.ellipse([suit_right - 4, oy, suit_right + 6, oy + 10], fill=SKIN)

    # Legs
    draw.rectangle([cx - 12, suit_bottom - 2, cx - 4, suit_bottom + 4], fill=SUIT_DARK)
    draw.rectangle([cx + 4, suit_bottom - 2, cx + 12, suit_bottom + 4], fill=SUIT_DARK)

    # Head
    head_top = oy + 6
    head_bottom = suit_top + 4
    draw.ellipse([cx - 18, head_top, cx + 18, head_bottom], fill=SKIN)

    # Hair
    draw.ellipse([cx - 20, head_top - 4, cx + 20, head_top + 12], fill=HAIR_GOLD)
    draw.ellipse([cx - 18, head_top - 4, cx + 18, head_top + 10], fill=HAIR_LIGHT)

    # Eyes
    eye_y = head_top + 10
    draw.ellipse([cx - 12, eye_y, cx - 5, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx - 10, eye_y + 1, cx - 7, eye_y + 4], fill=EYE_BLUE)
    draw.ellipse([cx + 5, eye_y, cx + 12, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx + 7, eye_y + 1, cx + 10, eye_y + 4], fill=EYE_BLUE)
    draw.line([(cx - 13, eye_y - 2), (cx - 4, eye_y - 2)], fill=BROW, width=2)
    draw.line([(cx + 4, eye_y - 2), (cx + 13, eye_y - 2)], fill=BROW, width=2)

    mouth_y = head_top + 18
    draw.ellipse([cx - 5, mouth_y, cx + 5, mouth_y + 4], fill=MOUTH)


def draw_trump_climb_r(draw, ox, oy, w, h):
    """Trump climbing right for kidnap sequences (96x72)"""
    cx, cy = ox + w // 2, oy + h // 2

    # Body
    suit_top = oy + h * 0.35
    suit_left = ox + w * 0.25
    suit_right = ox + w * 0.75
    suit_bottom = oy + h - 4
    draw.rectangle([suit_left, suit_top, suit_right, suit_bottom], fill=SUIT_BLUE)
    draw.rectangle([cx - 3, suit_top, cx + 3, suit_bottom - 6], fill=SHIRT_WHITE)
    draw.polygon([(cx, suit_top), (cx - 4, suit_top + 6), (cx, suit_bottom - 8), (cx + 4, suit_top + 6)], fill=TIE_RED)

    # Right arm up, left arm mid
    draw.rectangle([suit_right - 4, oy + 2, suit_right + 6, suit_top + 4], fill=SUIT_BLUE)
    draw.rectangle([suit_left - 6, suit_top - 8, suit_left + 4, suit_top + 4], fill=SUIT_BLUE)
    draw.ellipse([suit_right - 2, oy - 2, suit_right + 8, oy + 8], fill=SKIN)
    draw.ellipse([suit_left - 8, suit_top - 12, suit_left + 2, suit_top - 2], fill=SKIN)

    # Legs
    draw.rectangle([cx - 12, suit_bottom - 2, cx - 4, suit_bottom + 4], fill=SUIT_DARK)
    draw.rectangle([cx + 4, suit_bottom - 2, cx + 12, suit_bottom + 4], fill=SUIT_DARK)

    # Head
    head_top = oy + 6
    head_bottom = suit_top + 4
    draw.ellipse([cx - 18, head_top, cx + 18, head_bottom], fill=SKIN)

    # Hair
    draw.ellipse([cx - 20, head_top - 4, cx + 20, head_top + 12], fill=HAIR_GOLD)
    draw.ellipse([cx - 18, head_top - 4, cx + 18, head_top + 10], fill=HAIR_LIGHT)

    # Eyes
    eye_y = head_top + 10
    draw.ellipse([cx - 12, eye_y, cx - 5, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx - 10, eye_y + 1, cx - 7, eye_y + 4], fill=EYE_BLUE)
    draw.ellipse([cx + 5, eye_y, cx + 12, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx + 7, eye_y + 1, cx + 10, eye_y + 4], fill=EYE_BLUE)
    draw.line([(cx - 13, eye_y - 2), (cx - 4, eye_y - 2)], fill=BROW, width=2)
    draw.line([(cx + 4, eye_y - 2), (cx + 13, eye_y - 2)], fill=BROW, width=2)

    mouth_y = head_top + 18
    draw.ellipse([cx - 5, mouth_y, cx + 5, mouth_y + 4], fill=MOUTH)


def draw_trump_side(draw, ox, oy, w, h):
    """Trump side view/walking (96x64)"""
    cx, cy = ox + w // 2, oy + h // 2

    # Body
    suit_top = oy + h * 0.38
    body_left = ox + w * 0.25
    body_right = ox + w * 0.7
    suit_bottom = oy + h - 2
    draw.rectangle([body_left, suit_top, body_right, suit_bottom], fill=SUIT_BLUE)
    draw.rectangle([cx - 6, suit_top, cx - 1, suit_bottom - 8], fill=SHIRT_WHITE)
    draw.polygon([(cx - 4, suit_top + 2), (cx - 7, suit_top + 8), (cx - 4, suit_bottom - 10), (cx - 1, suit_top + 8)], fill=TIE_RED)

    # Arm in front
    draw.rectangle([body_right - 8, suit_top + 4, body_right + 4, suit_bottom - 6], fill=SUIT_BLUE)
    draw.ellipse([body_right - 2, suit_bottom - 12, body_right + 8, suit_bottom - 2], fill=SKIN)

    # Head (side view - slightly offset)
    head_top = oy + 2
    head_bottom = suit_top + 6
    head_cx = cx - 4
    draw.ellipse([head_cx - 18, head_top, head_cx + 18, head_bottom], fill=SKIN)

    # Hair from side
    draw.ellipse([head_cx - 20, head_top - 4, head_cx + 20, head_top + 14], fill=HAIR_GOLD)
    draw.ellipse([head_cx - 18, head_top - 4, head_cx + 20, head_top + 10], fill=HAIR_LIGHT)

    # Eye (side - one visible)
    eye_y = head_top + 12
    draw.ellipse([head_cx - 4, eye_y, head_cx + 6, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([head_cx - 1, eye_y + 1, head_cx + 4, eye_y + 4], fill=EYE_BLUE)
    draw.line([(head_cx - 5, eye_y - 2), (head_cx + 7, eye_y - 2)], fill=BROW, width=2)

    # Mouth
    mouth_y = head_top + 22
    draw.ellipse([head_cx - 2, mouth_y, head_cx + 6, mouth_y + 4], fill=MOUTH)


def draw_trump_falling(draw, ox, oy, w, h):
    """Trump falling/defeated (96x64)"""
    cx, cy = ox + w // 2, oy + h // 2

    # Body upside down / falling
    suit_top = oy + h * 0.1
    suit_bottom = oy + h * 0.65
    suit_left = ox + w * 0.2
    suit_right = ox + w * 0.8
    draw.rectangle([suit_left, suit_top, suit_right, suit_bottom], fill=SUIT_BLUE)
    draw.rectangle([cx - 3, suit_top + 4, cx + 3, suit_bottom], fill=SHIRT_WHITE)
    draw.polygon([(cx, suit_top + 6), (cx - 4, suit_top + 12), (cx, suit_bottom - 2), (cx + 4, suit_top + 12)], fill=TIE_RED)

    # Arms flailing out
    draw.rectangle([ox + 2, suit_top + 4, suit_left + 2, suit_top + 18], fill=SUIT_BLUE)
    draw.rectangle([suit_right - 2, suit_top + 4, ox + w - 2, suit_top + 18], fill=SUIT_BLUE)
    draw.ellipse([ox - 2, suit_top + 2, ox + 10, suit_top + 14], fill=SKIN)
    draw.ellipse([ox + w - 10, suit_top + 2, ox + w + 2, suit_top + 14], fill=SKIN)

    # Legs going up
    draw.rectangle([cx - 14, oy, cx - 6, suit_top + 4], fill=SUIT_DARK)
    draw.rectangle([cx + 6, oy, cx + 14, suit_top + 4], fill=SUIT_DARK)

    # Head at bottom
    head_top = suit_bottom - 2
    head_bottom = oy + h - 2
    draw.ellipse([cx - 18, head_top, cx + 18, head_bottom], fill=SKIN)

    # Hair (hanging down)
    draw.ellipse([cx - 20, head_bottom - 10, cx + 20, head_bottom + 4], fill=HAIR_GOLD)

    # Eyes (dizzy/X)
    eye_y = head_top + 6
    draw.line([(cx - 14, eye_y), (cx - 8, eye_y + 6)], fill=EYE_BLACK, width=2)
    draw.line([(cx - 14, eye_y + 6), (cx - 8, eye_y)], fill=EYE_BLACK, width=2)
    draw.line([(cx + 8, eye_y), (cx + 14, eye_y + 6)], fill=EYE_BLACK, width=2)
    draw.line([(cx + 8, eye_y + 6), (cx + 14, eye_y)], fill=EYE_BLACK, width=2)


def draw_trump_barrel_lift_l(draw, ox, oy, w, h):
    """Trump lifting barrel (left side) - for barrel rolling animation (96x64)"""
    cx, cy = ox + w // 2, oy + h // 2

    # Body
    suit_top = oy + h * 0.38
    suit_left = ox + w * 0.18
    suit_right = ox + w * 0.82
    suit_bottom = oy + h - 2
    draw.rectangle([suit_left, suit_top, suit_right, suit_bottom], fill=SUIT_BLUE)
    draw.rectangle([cx - 3, suit_top, cx + 3, suit_bottom - 8], fill=SHIRT_WHITE)
    draw.polygon([(cx, suit_top + 2), (cx - 4, suit_top + 8), (cx, suit_bottom - 10), (cx + 4, suit_top + 8)], fill=TIE_RED)

    # Left arm up, right arm mid
    draw.rectangle([ox + 4, suit_top - 10, suit_left + 6, suit_top + 4], fill=SUIT_BLUE)
    draw.ellipse([ox, suit_top - 14, ox + 12, suit_top - 4], fill=SKIN)
    draw.rectangle([suit_right - 2, suit_top + 4, ox + w - 4, suit_bottom - 12], fill=SUIT_BLUE)
    draw.ellipse([ox + w - 14, suit_bottom - 16, ox + w - 2, suit_bottom - 6], fill=SKIN)

    # Head
    head_top = oy + 2
    head_bottom = suit_top + 6
    draw.ellipse([cx - 20, head_top, cx + 20, head_bottom], fill=SKIN)
    draw.ellipse([cx - 23, head_top - 4, cx + 23, head_top + 14], fill=HAIR_GOLD)
    draw.ellipse([cx - 21, head_top - 4, cx + 21, head_top + 10], fill=HAIR_LIGHT)

    eye_y = head_top + 12
    draw.ellipse([cx - 13, eye_y, cx - 6, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx - 11, eye_y + 1, cx - 8, eye_y + 4], fill=EYE_BLUE)
    draw.ellipse([cx + 6, eye_y, cx + 13, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx + 8, eye_y + 1, cx + 11, eye_y + 4], fill=EYE_BLUE)
    draw.line([(cx - 14, eye_y - 2), (cx - 5, eye_y - 2)], fill=BROW, width=2)
    draw.line([(cx + 5, eye_y - 2), (cx + 14, eye_y - 2)], fill=BROW, width=2)

    mouth_y = head_top + 22
    draw.ellipse([cx - 5, mouth_y, cx + 5, mouth_y + 4], fill=MOUTH)


def draw_trump_barrel_lift_r(draw, ox, oy, w, h):
    """Trump lifting barrel (right side) (96x64)"""
    cx, cy = ox + w // 2, oy + h // 2

    # Body
    suit_top = oy + h * 0.38
    suit_left = ox + w * 0.18
    suit_right = ox + w * 0.82
    suit_bottom = oy + h - 2
    draw.rectangle([suit_left, suit_top, suit_right, suit_bottom], fill=SUIT_BLUE)
    draw.rectangle([cx - 3, suit_top, cx + 3, suit_bottom - 8], fill=SHIRT_WHITE)
    draw.polygon([(cx, suit_top + 2), (cx - 4, suit_top + 8), (cx, suit_bottom - 10), (cx + 4, suit_top + 8)], fill=TIE_RED)

    # Right arm up, left arm mid
    draw.rectangle([suit_right - 6, suit_top - 10, ox + w - 4, suit_top + 4], fill=SUIT_BLUE)
    draw.ellipse([ox + w - 12, suit_top - 14, ox + w, suit_top - 4], fill=SKIN)
    draw.rectangle([ox + 4, suit_top + 4, suit_left + 4, suit_bottom - 12], fill=SUIT_BLUE)
    draw.ellipse([ox + 2, suit_bottom - 16, ox + 14, suit_bottom - 6], fill=SKIN)

    # Head
    head_top = oy + 2
    head_bottom = suit_top + 6
    draw.ellipse([cx - 20, head_top, cx + 20, head_bottom], fill=SKIN)
    draw.ellipse([cx - 23, head_top - 4, cx + 23, head_top + 14], fill=HAIR_GOLD)
    draw.ellipse([cx - 21, head_top - 4, cx + 21, head_top + 10], fill=HAIR_LIGHT)

    eye_y = head_top + 12
    draw.ellipse([cx - 13, eye_y, cx - 6, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx - 11, eye_y + 1, cx - 8, eye_y + 4], fill=EYE_BLUE)
    draw.ellipse([cx + 6, eye_y, cx + 13, eye_y + 5], fill=EYE_WHITE)
    draw.ellipse([cx + 8, eye_y + 1, cx + 11, eye_y + 4], fill=EYE_BLUE)
    draw.line([(cx - 14, eye_y - 2), (cx - 5, eye_y - 2)], fill=BROW, width=2)
    draw.line([(cx + 5, eye_y - 2), (cx + 14, eye_y - 2)], fill=BROW, width=2)

    mouth_y = head_top + 22
    draw.ellipse([cx - 5, mouth_y, cx + 5, mouth_y + 4], fill=MOUTH)


def draw_trump_small(draw, ox, oy, w, h):
    """Smaller Trump for 80x64 frames (kong-8, kong-11)"""
    cx, cy = ox + w // 2, oy + h // 2

    # Body
    suit_top = oy + h * 0.4
    suit_left = ox + w * 0.15
    suit_right = ox + w * 0.85
    suit_bottom = oy + h - 2
    draw.rectangle([suit_left, suit_top, suit_right, suit_bottom], fill=SUIT_BLUE)
    draw.rectangle([cx - 2, suit_top, cx + 2, suit_bottom - 6], fill=SHIRT_WHITE)
    draw.polygon([(cx, suit_top + 2), (cx - 3, suit_top + 6), (cx, suit_bottom - 8), (cx + 3, suit_top + 6)], fill=TIE_RED)

    # Arms
    draw.rectangle([ox + 2, suit_top + 2, suit_left + 2, suit_bottom - 8], fill=SUIT_BLUE)
    draw.rectangle([suit_right - 2, suit_top + 2, ox + w - 2, suit_bottom - 8], fill=SUIT_BLUE)
    draw.ellipse([ox, suit_bottom - 12, ox + 10, suit_bottom - 4], fill=SKIN)
    draw.ellipse([ox + w - 10, suit_bottom - 12, ox + w, suit_bottom - 4], fill=SKIN)

    # Head
    head_top = oy + 2
    head_bottom = suit_top + 4
    draw.ellipse([cx - 16, head_top, cx + 16, head_bottom], fill=SKIN)
    draw.ellipse([cx - 18, head_top - 3, cx + 18, head_top + 12], fill=HAIR_GOLD)
    draw.ellipse([cx - 16, head_top - 3, cx + 16, head_top + 9], fill=HAIR_LIGHT)

    eye_y = head_top + 10
    draw.ellipse([cx - 10, eye_y, cx - 4, eye_y + 4], fill=EYE_WHITE)
    draw.ellipse([cx - 8, eye_y + 1, cx - 6, eye_y + 3], fill=EYE_BLUE)
    draw.ellipse([cx + 4, eye_y, cx + 10, eye_y + 4], fill=EYE_WHITE)
    draw.ellipse([cx + 6, eye_y + 1, cx + 8, eye_y + 3], fill=EYE_BLUE)
    draw.line([(cx - 11, eye_y - 2), (cx - 3, eye_y - 2)], fill=BROW, width=2)
    draw.line([(cx + 3, eye_y - 2), (cx + 11, eye_y - 2)], fill=BROW, width=2)

    mouth_y = head_top + 18
    draw.ellipse([cx - 4, mouth_y, cx + 4, mouth_y + 3], fill=MOUTH)


def draw_trump_fall_sit(draw, ox, oy, w, h):
    """Trump fallen/sitting (96x80) - for lostFloor sequence"""
    cx = ox + w // 2

    # Sitting body
    suit_top = oy + h * 0.25
    suit_left = ox + w * 0.15
    suit_right = ox + w * 0.85
    suit_bottom = oy + h - 8
    draw.rectangle([suit_left, suit_top, suit_right, suit_bottom], fill=SUIT_BLUE)
    draw.rectangle([cx - 3, suit_top, cx + 3, suit_bottom - 6], fill=SHIRT_WHITE)
    draw.polygon([(cx, suit_top + 2), (cx - 4, suit_top + 8), (cx, suit_bottom - 8), (cx + 4, suit_top + 8)], fill=TIE_RED)

    # Head
    head_top = oy + 2
    head_bottom = suit_top + 8
    draw.ellipse([cx - 22, head_top, cx + 22, head_bottom], fill=SKIN)
    draw.ellipse([cx - 24, head_top - 4, cx + 24, head_top + 14], fill=HAIR_GOLD)
    draw.ellipse([cx - 22, head_top - 4, cx + 22, head_top + 10], fill=HAIR_LIGHT)

    # Eyes - various emotions
    eye_y = head_top + 12
    draw.ellipse([cx - 14, eye_y, cx - 6, eye_y + 6], fill=EYE_WHITE)
    draw.ellipse([cx - 12, eye_y + 1, cx - 8, eye_y + 5], fill=EYE_BLUE)
    draw.ellipse([cx + 6, eye_y, cx + 14, eye_y + 6], fill=EYE_WHITE)
    draw.ellipse([cx + 8, eye_y + 1, cx + 12, eye_y + 5], fill=EYE_BLUE)
    draw.line([(cx - 15, eye_y - 2), (cx - 5, eye_y - 2)], fill=BROW, width=2)
    draw.line([(cx + 5, eye_y - 2), (cx + 15, eye_y - 2)], fill=BROW, width=2)

    mouth_y = head_top + 22
    draw.ellipse([cx - 6, mouth_y, cx + 6, mouth_y + 5], fill=MOUTH)

    # Arms spread
    draw.rectangle([ox + 2, suit_top + 8, suit_left + 4, suit_bottom - 10], fill=SUIT_BLUE)
    draw.rectangle([suit_right - 4, suit_top + 8, ox + w - 2, suit_bottom - 10], fill=SUIT_BLUE)
    draw.ellipse([ox, suit_bottom - 14, ox + 12, suit_bottom - 4], fill=SKIN)
    draw.ellipse([ox + w - 12, suit_bottom - 14, ox + w, suit_bottom - 4], fill=SKIN)

    # Legs spread out
    draw.rectangle([suit_left, suit_bottom - 2, cx - 4, oy + h - 2], fill=SUIT_DARK)
    draw.rectangle([cx + 4, suit_bottom - 2, suit_right, oy + h - 2], fill=SUIT_DARK)


def draw_trump_topple(draw, ox, oy, w, h, variant=0):
    """Trump toppling/falling various frames (96x80) - for defeat animation"""
    cx = ox + w // 2

    # Rotated body positions for defeat
    angle_offset = variant * 4
    suit_top = oy + h * 0.2 + angle_offset
    suit_left = ox + w * 0.2 - variant * 2
    suit_right = ox + w * 0.8 + variant * 2
    suit_bottom = oy + h - 6

    # Body
    draw.rectangle([suit_left, suit_top, suit_right, suit_bottom], fill=SUIT_BLUE)
    draw.rectangle([cx - 3, suit_top, cx + 3, suit_bottom - 6], fill=SHIRT_WHITE)
    draw.polygon([(cx, suit_top + 2), (cx - 4, suit_top + 8), (cx, suit_bottom - 8), (cx + 4, suit_top + 8)], fill=TIE_RED)

    # Head
    head_top = oy + 2
    head_bottom = suit_top + 6
    draw.ellipse([cx - 22, head_top, cx + 22, head_bottom], fill=SKIN)
    draw.ellipse([cx - 24, head_top - 4, cx + 24, head_top + 14], fill=HAIR_GOLD)
    draw.ellipse([cx - 22, head_top - 4, cx + 22, head_top + 10], fill=HAIR_LIGHT)

    # Dizzy eyes
    eye_y = head_top + 12
    if variant % 2 == 0:
        # Spiral eyes
        draw.arc([cx - 14, eye_y, cx - 6, eye_y + 6], 0, 270, fill=EYE_BLACK, width=2)
        draw.arc([cx + 6, eye_y, cx + 14, eye_y + 6], 0, 270, fill=EYE_BLACK, width=2)
    else:
        # X eyes
        draw.line([(cx - 14, eye_y), (cx - 6, eye_y + 6)], fill=EYE_BLACK, width=2)
        draw.line([(cx - 14, eye_y + 6), (cx - 6, eye_y)], fill=EYE_BLACK, width=2)
        draw.line([(cx + 6, eye_y), (cx + 14, eye_y + 6)], fill=EYE_BLACK, width=2)
        draw.line([(cx + 6, eye_y + 6), (cx + 14, eye_y)], fill=EYE_BLACK, width=2)

    draw.line([(cx - 15, eye_y - 2), (cx - 5, eye_y - 2)], fill=BROW, width=2)
    draw.line([(cx + 5, eye_y - 2), (cx + 15, eye_y - 2)], fill=BROW, width=2)

    # Open mouth (shock)
    mouth_y = head_top + 22
    draw.ellipse([cx - 6, mouth_y, cx + 6, mouth_y + 6], fill=MOUTH_DARK)
    draw.ellipse([cx - 4, mouth_y + 1, cx + 4, mouth_y + 5], fill=MOUTH)

    # Arms flailing
    if variant % 2 == 0:
        draw.rectangle([ox + 2, suit_top, suit_left + 4, suit_top + 14], fill=SUIT_BLUE)
        draw.rectangle([suit_right - 4, suit_top + 6, ox + w - 2, suit_top + 20], fill=SUIT_BLUE)
    else:
        draw.rectangle([ox + 2, suit_top + 6, suit_left + 4, suit_top + 20], fill=SUIT_BLUE)
        draw.rectangle([suit_right - 4, suit_top, ox + w - 2, suit_top + 14], fill=SUIT_BLUE)

    draw.ellipse([ox, suit_top + 2, ox + 10, suit_top + 12], fill=SKIN)
    draw.ellipse([ox + w - 10, suit_top + 6, ox + w, suit_top + 16], fill=SKIN)


def generate_kong_sheet():
    """Generate the full Trump sprite sheet matching kong.json layout."""
    # Sheet size: 453x453
    img = Image.new('RGBA', (453, 453), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Frame definitions from kong.json:
    # Row 1 (y=3): kong-1 to kong-4, all 96x64
    frames_row1 = [
        ("kong-1", 3, 3, 96, 64),    # Standing front
        ("kong-2", 102, 3, 96, 64),   # Holding barrel
        ("kong-3", 201, 3, 96, 64),   # Arm shake left
        ("kong-4", 300, 3, 96, 64),   # Arm shake right
    ]
    # Row 2 (y=70): kong-5 to kong-8
    frames_row2 = [
        ("kong-5", 3, 70, 96, 72),    # Climb left
        ("kong-6", 102, 70, 96, 72),  # Climb right
        ("kong-7", 201, 70, 96, 64),  # Side view
        ("kong-8", 300, 70, 80, 64),  # Small standing
    ]
    # Row 3 (y=145): kong-9 to kong-12
    frames_row3 = [
        ("kong-9", 3, 145, 96, 64),    # Barrel lift left
        ("kong-10", 102, 145, 96, 64), # Barrel lift right
        ("kong-11", 201, 145, 80, 64), # Small variant
        ("kong-12", 284, 145, 96, 64), # Barrel hold variant
    ]
    # Row 4 (y=212): kong-13 to kong-16, all 96x72
    frames_row4 = [
        ("kong-13", 3, 212, 96, 72),
        ("kong-14", 102, 212, 96, 72),
        ("kong-15", 201, 212, 96, 72),
        ("kong-16", 300, 212, 96, 72),
    ]
    # Row 5 (y=287): kong-17 96x64
    frames_row5 = [
        ("kong-17", 3, 287, 96, 64),
    ]
    # Row 5 continued & Row 6 (y=287, y=370): kong-18 to kong-23, all 96x80
    frames_row5b = [
        ("kong-18", 102, 287, 96, 80),
        ("kong-19", 201, 287, 96, 80),
        ("kong-20", 300, 287, 96, 80),
    ]
    frames_row6 = [
        ("kong-21", 3, 370, 96, 80),
        ("kong-22", 102, 370, 96, 80),
        ("kong-23", 201, 370, 96, 80),
    ]

    # Draw each frame:

    # kong-1: Standing front (main idle)
    draw_trump_front(draw, 3, 3, 96, 64)

    # kong-2: Holding barrel overhead
    draw_trump_barrel_hold(draw, 102, 3, 96, 64)

    # kong-3: Arm shake left (gesturing)
    draw_trump_arms_shake_l(draw, 201, 3, 96, 64)

    # kong-4: Arm shake right
    draw_trump_arms_shake_r(draw, 300, 3, 96, 64)

    # kong-5: Climb left (96x72)
    draw_trump_climb(draw, 3, 70, 96, 72)

    # kong-6: Climb right (96x72)
    draw_trump_climb_r(draw, 102, 70, 96, 72)

    # kong-7: Side view (96x64) - falling
    draw_trump_falling(draw, 201, 70, 96, 64)

    # kong-8: Small standing (80x64)
    draw_trump_small(draw, 300, 70, 80, 64)

    # kong-9: Barrel lift left (96x64)
    draw_trump_barrel_lift_l(draw, 3, 145, 96, 64)

    # kong-10: Barrel lift right (96x64)
    draw_trump_barrel_lift_r(draw, 102, 145, 96, 64)

    # kong-11: Small variant (80x64)
    draw_trump_small(draw, 201, 145, 80, 64)

    # kong-12: Barrel hold variant (96x64)
    draw_trump_barrel_hold(draw, 284, 145, 96, 64)

    # kong-13, 14: Climb frames for kidnap (96x72)
    draw_trump_climb(draw, 3, 212, 96, 72)
    draw_trump_climb_r(draw, 102, 212, 96, 72)

    # kong-15, 16: More climb frames (96x72)
    draw_trump_climb(draw, 201, 212, 96, 72)
    draw_trump_climb_r(draw, 300, 212, 96, 72)

    # kong-17: Side walking (96x64)
    draw_trump_side(draw, 3, 287, 96, 64)

    # kong-18 to 23: Fall/topple/defeat sequence (96x80)
    draw_trump_fall_sit(draw, 102, 287, 96, 80)
    draw_trump_topple(draw, 201, 287, 96, 80, variant=0)
    draw_trump_topple(draw, 300, 287, 96, 80, variant=1)
    draw_trump_topple(draw, 3, 370, 96, 80, variant=2)
    draw_trump_topple(draw, 102, 370, 96, 80, variant=3)
    draw_trump_topple(draw, 201, 370, 96, 80, variant=4)

    # Save
    img.save('assets/sprites/kong.png')
    print('Generated Trump sprite sheet: assets/sprites/kong.png')


if __name__ == '__main__':
    generate_kong_sheet()

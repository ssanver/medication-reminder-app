#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path
import math
from PIL import Image, ImageDraw


OUTPUT_PATH = Path(__file__).resolve().parents[1] / "assets" / "icon.png"

# Canvas and rendering settings
SIZE = 1024
SCALE = 4  # Supersampling for smooth edges
CANVAS = SIZE * SCALE

# Color palette
BACKGROUND = (200, 209, 228)  # #C8D1E4
BLUE = (34, 89, 201)          # #2259C9
YELLOW = (236, 201, 39)       # #ECC927
RED = (238, 66, 66)           # #EE4242
DIVIDER = (200, 209, 228)     # #C8D1E4


def rot(point: tuple[float, float], center: tuple[float, float], angle_deg: float) -> tuple[float, float]:
  px, py = point
  cx, cy = center
  angle = math.radians(angle_deg)
  dx, dy = px - cx, py - cy
  return (
    cx + dx * math.cos(angle) - dy * math.sin(angle),
    cy + dx * math.sin(angle) + dy * math.cos(angle),
  )


def rotated_rect(
  draw: ImageDraw.ImageDraw,
  center: tuple[float, float],
  x1: float,
  y1: float,
  x2: float,
  y2: float,
  angle_deg: float,
  fill: tuple[int, int, int],
) -> None:
  corners = [(x1, y1), (x2, y1), (x2, y2), (x1, y2)]
  rotated = [rot(point, center, angle_deg) for point in corners]
  draw.polygon(rotated, fill=fill)


def draw_icon() -> Image.Image:
  img = Image.new("RGB", (CANVAS, CANVAS), BACKGROUND)
  draw = ImageDraw.Draw(img)

  # Blue circular background
  circle_margin = int(70 * SCALE)
  draw.ellipse(
    (circle_margin, circle_margin, CANVAS - circle_margin, CANVAS - circle_margin),
    fill=BLUE,
  )

  # Capsule local coordinates before rotation
  capsule_center = (CANVAS * 0.50, CANVAS * 0.50)
  capsule_w = int(470 * SCALE)
  capsule_h = int(190 * SCALE)
  radius = capsule_h // 2
  angle = 38.0

  # Draw red/yellow split exactly at capsule center (50/50)
  left = capsule_center[0] - capsule_w // 2
  top = capsule_center[1] - capsule_h // 2
  right = capsule_center[0] + capsule_w // 2
  bottom = capsule_center[1] + capsule_h // 2
  split_x = capsule_center[0]
  draw_capsule = ImageDraw.Draw(img)

  # Left (red) half: left cap + middle-left rectangle
  left_cap_center = (left + radius, capsule_center[1])
  left_cap_center_rot = rot(left_cap_center, capsule_center, angle)
  draw_capsule.ellipse(
    (
      left_cap_center_rot[0] - radius,
      left_cap_center_rot[1] - radius,
      left_cap_center_rot[0] + radius,
      left_cap_center_rot[1] + radius,
    ),
    fill=RED,
  )
  rotated_rect(draw_capsule, capsule_center, left + radius, top, split_x, bottom, angle, RED)

  # Right (yellow) half: right cap + middle-right rectangle
  right_cap_center = (right - radius, capsule_center[1])
  right_cap_center_rot = rot(right_cap_center, capsule_center, angle)
  draw_capsule.ellipse(
    (
      right_cap_center_rot[0] - radius,
      right_cap_center_rot[1] - radius,
      right_cap_center_rot[0] + radius,
      right_cap_center_rot[1] + radius,
    ),
    fill=YELLOW,
  )
  rotated_rect(draw_capsule, capsule_center, split_x, top, right - radius, bottom, angle, YELLOW)

  # Subtle divider line on capsule
  divider_len = int(150 * SCALE)
  line_w = max(1, int(6 * SCALE))
  seam_angle = angle + 90.0
  dx = (divider_len / 2) * math.cos(math.radians(seam_angle))
  dy = (divider_len / 2) * math.sin(math.radians(seam_angle))
  p1 = (capsule_center[0] - dx, capsule_center[1] - dy)
  p2 = (capsule_center[0] + dx, capsule_center[1] + dy)
  draw.line((p1[0], p1[1], p2[0], p2[1]), fill=DIVIDER, width=line_w)

  return img.resize((SIZE, SIZE), resample=Image.Resampling.LANCZOS)


def main() -> None:
  OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
  icon = draw_icon()
  icon.save(OUTPUT_PATH, format="PNG", optimize=True)
  print(f"generated icon: {OUTPUT_PATH}")


if __name__ == "__main__":
  main()

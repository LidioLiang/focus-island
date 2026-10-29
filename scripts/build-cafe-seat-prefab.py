from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"


@dataclass(frozen=True)
class Point:
    x: int
    y: int


@dataclass(frozen=True)
class Anchor:
    x: float
    y: float


@dataclass(frozen=True)
class SeatPrefabConfig:
    seat_id: int
    seat_point: Point
    foot_point: Point
    ui_point: Point
    character_height: int
    character_hip_anchor: Anchor
    character_foot_anchor: Anchor


SEAT_01 = SeatPrefabConfig(
    seat_id=1,
    # The center of the stool seat where the character's hips should land.
    seat_point=Point(426, 362),
    # The foot ring / floor contact area. Used for debug calibration.
    foot_point=Point(410, 458),
    # Current clickable UI marker position for the seat label.
    ui_point=Point(round(1586 * 0.32), round(992 * 0.49)),
    character_height=285,
    # Relative anchors inside the tightly cropped generated character sprite.
    # These are intentionally explicit so future characters can be calibrated
    # without guessing paste_x / paste_y.
    character_hip_anchor=Anchor(0.56, 0.58),
    character_foot_anchor=Anchor(0.42, 0.92),
)


def crop_to_visible_alpha(image: Image.Image, alpha_threshold: int = 8) -> Image.Image:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > alpha_threshold else 0)
    bbox = mask.getbbox()
    if not bbox:
        raise RuntimeError("Character source has no visible alpha")
    return image.crop(bbox)


def place_by_anchor(
    canvas_size: tuple[int, int],
    sprite: Image.Image,
    target_point: Point,
    sprite_anchor: Anchor,
) -> tuple[Image.Image, tuple[int, int], Point]:
    paste_x = round(target_point.x - sprite.width * sprite_anchor.x)
    paste_y = round(target_point.y - sprite.height * sprite_anchor.y)
    canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    canvas.alpha_composite(sprite, (paste_x, paste_y))
    anchored_point = Point(
        round(paste_x + sprite.width * sprite_anchor.x),
        round(paste_y + sprite.height * sprite_anchor.y),
    )
    return canvas, (paste_x, paste_y), anchored_point


def draw_cross(draw: ImageDraw.ImageDraw, point: Point, color: tuple[int, int, int, int], label: str) -> None:
    radius = 10
    draw.line((point.x - radius, point.y, point.x + radius, point.y), fill=color, width=3)
    draw.line((point.x, point.y - radius, point.x, point.y + radius), fill=color, width=3)
    draw.ellipse((point.x - 4, point.y - 4, point.x + 4, point.y + 4), fill=color)
    draw.text((point.x + 12, point.y - 18), label, fill=color, font=ImageFont.load_default())


def main() -> None:
    background = Image.open(ASSETS / "20261013-cafe-room-no-seats.png").convert("RGBA")
    chair = Image.open(ASSETS / "20261013-cafe-seat-01-chair.webp").convert("RGBA")
    foreground = Image.open(ASSETS / "20261013-cafe-seat-01-foreground.webp").convert("RGBA")
    source = Image.open(ASSETS / "20261013-cafe-seat-01-character-source.png").convert("RGBA")

    character = crop_to_visible_alpha(source)
    character_width = round(character.width * (SEAT_01.character_height / character.height))
    character = character.resize((character_width, SEAT_01.character_height), Image.Resampling.LANCZOS)

    character_layer, paste, resolved_hip = place_by_anchor(
        background.size,
        character,
        SEAT_01.seat_point,
        SEAT_01.character_hip_anchor,
    )

    character_layer.save(ASSETS / "20261013-cafe-seat-01-character.webp", "WEBP", quality=94, method=6, exact=True)

    preview = background.copy()
    preview.alpha_composite(chair)
    preview.alpha_composite(character_layer)
    preview.alpha_composite(foreground)
    preview.save(ASSETS / "20261013-cafe-seat-01-prefab-preview.png")

    debug = preview.copy()
    debug_draw = ImageDraw.Draw(debug)
    draw_cross(debug_draw, SEAT_01.seat_point, (74, 255, 132, 255), "seatPoint / hip target")
    draw_cross(debug_draw, SEAT_01.foot_point, (98, 190, 255, 255), "footPoint")
    draw_cross(debug_draw, SEAT_01.ui_point, (255, 228, 93, 255), "uiPoint")
    draw_cross(debug_draw, resolved_hip, (255, 89, 89, 255), "resolved hip")
    debug_draw.rectangle((paste[0], paste[1], paste[0] + character.width, paste[1] + character.height), outline=(255, 89, 89, 255), width=2)
    debug.save(ASSETS / "20261013-cafe-seat-01-anchor-debug.png")

    print(f"seat={SEAT_01.seat_id}")
    print(f"source_crop={source.getchannel('A').point(lambda value: 255 if value > 8 else 0).getbbox()}")
    print(f"character_size={character.size}")
    print(f"paste={paste}")
    print(f"seat_point=({SEAT_01.seat_point.x},{SEAT_01.seat_point.y}) resolved_hip=({resolved_hip.x},{resolved_hip.y})")


if __name__ == "__main__":
    main()

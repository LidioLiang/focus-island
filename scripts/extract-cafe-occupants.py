from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
EMPTY_PATH = ASSETS / "20261011-cafe-focus-room.png"
OCCUPIED_PATH = ASSETS / "20261012-cafe-all-seats-occupied.png"

# Tight polygons isolate the six MVP seats and their immediate work surface.
# Coordinates are in the shared 1586 x 992 room-image coordinate system.
# New seat IDs map to the previous wider scene as follows:
# 1 <- old 2, 2 <- old 3, 3 <- old 6, 4 <- old 7, 5 <- old 9, 6 <- old 10.
SEAT_POLYGONS = {
    1: [(382, 268), (406, 226), (422, 184), (466, 181), (505, 224), (518, 314), (502, 414), (424, 432), (389, 365)],
    2: [(500, 251), (523, 211), (546, 170), (590, 168), (632, 214), (642, 304), (625, 414), (542, 433), (502, 360)],
    3: [(1046, 290), (1076, 249), (1102, 216), (1144, 219), (1188, 266), (1202, 351), (1187, 444), (1117, 461), (1058, 412)],
    4: [(1198, 324), (1228, 281), (1252, 246), (1300, 245), (1346, 291), (1361, 387), (1346, 492), (1272, 511), (1214, 462)],
    5: [(412, 557), (452, 512), (517, 488), (548, 447), (600, 453), (640, 506), (653, 596), (628, 682), (550, 728), (456, 704), (418, 640)],
    6: [(968, 582), (1000, 535), (1027, 484), (1075, 482), (1128, 520), (1168, 592), (1178, 674), (1152, 743), (1058, 764), (990, 718)],
}


def build_difference_alpha(empty: Image.Image, occupied: Image.Image, polygon: list[tuple[int, int]]) -> Image.Image:
    red, green, blue = ImageChops.difference(empty, occupied).split()
    difference = ImageChops.lighter(ImageChops.lighter(red, green), blue)

    # Suppress tiny global color drift, keep subject-level changes, then softly
    # close small holes around hair, clothing, hands and laptop edges.
    difference = difference.point(lambda value: max(0, min(255, (value - 18) * 11)))
    difference = difference.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.0))

    polygon_mask = Image.new("L", empty.size, 0)
    ImageDraw.Draw(polygon_mask).polygon(polygon, fill=255)
    polygon_mask = polygon_mask.filter(ImageFilter.GaussianBlur(1.0))
    return ImageChops.multiply(difference, polygon_mask)


def main() -> None:
    empty = Image.open(EMPTY_PATH).convert("RGB")
    occupied = Image.open(OCCUPIED_PATH).convert("RGB")
    if empty.size != occupied.size:
        raise SystemExit(f"Room images must match exactly: {empty.size} != {occupied.size}")

    preview = empty.convert("RGBA")
    for seat_id, polygon in SEAT_POLYGONS.items():
        alpha = build_difference_alpha(empty, occupied, polygon)
        layer = occupied.convert("RGBA")
        layer.putalpha(alpha)
        output = ASSETS / f"20261013-cafe-seat-{seat_id:02d}-occupant.webp"
        layer.save(output, "WEBP", quality=92, method=6, exact=True)
        preview = Image.alpha_composite(preview, layer)

    preview.save(ASSETS / "20261013-cafe-six-seat-occupants-preview.png")


if __name__ == "__main__":
    main()

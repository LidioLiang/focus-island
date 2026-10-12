from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
EMPTY_PATH = ASSETS / "20261011-cafe-focus-room.png"
OCCUPIED_PATH = ASSETS / "20261012-cafe-all-seats-occupied.png"

# Tight polygons isolate each seated person and their immediate work surface.
# Coordinates are in the shared 1586 x 992 room-image coordinate system.
SEAT_POLYGONS = {
    1: [(205, 264), (235, 220), (255, 183), (309, 181), (351, 225), (365, 309), (350, 389), (342, 469), (245, 478), (218, 405)],
    2: [(377, 273), (405, 226), (416, 181), (469, 178), (510, 222), (523, 315), (504, 420), (403, 435), (380, 362)],
    3: [(488, 250), (515, 209), (539, 169), (595, 165), (637, 213), (646, 307), (630, 418), (524, 437), (493, 358)],
    4: [(624, 253), (653, 207), (676, 164), (724, 168), (759, 215), (769, 307), (754, 414), (659, 425), (628, 354)],
    5: [(893, 262), (923, 215), (947, 177), (998, 181), (1045, 220), (1068, 313), (1058, 417), (984, 455), (917, 429), (892, 353)],
    6: [(1038, 291), (1071, 247), (1096, 214), (1147, 217), (1192, 264), (1210, 354), (1192, 451), (1114, 467), (1052, 414)],
    7: [(1188, 325), (1220, 278), (1246, 243), (1305, 242), (1352, 289), (1371, 390), (1355, 499), (1268, 520), (1207, 466)],
    8: [(1357, 365), (1390, 318), (1413, 282), (1466, 283), (1522, 333), (1554, 442), (1538, 553), (1438, 565), (1372, 503)],
    9: [(403, 558), (444, 510), (514, 486), (548, 443), (606, 450), (650, 504), (665, 600), (635, 700), (548, 744), (447, 713), (407, 643)],
    10: [(958, 582), (992, 531), (1019, 478), (1077, 476), (1133, 516), (1177, 592), (1190, 682), (1160, 758), (1055, 778), (981, 724)],
}


def build_difference_alpha(empty: Image.Image, occupied: Image.Image, polygon: list[tuple[int, int]]) -> Image.Image:
    red, green, blue = ImageChops.difference(empty, occupied).split()
    difference = ImageChops.lighter(ImageChops.lighter(red, green), blue)

    # Suppress tiny global color drift, keep subject-level changes, then softly
    # close small holes around hair, clothing, hands and laptop edges.
    difference = difference.point(lambda value: max(0, min(255, (value - 10) * 9)))
    difference = difference.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.0))

    polygon_mask = Image.new("L", empty.size, 0)
    ImageDraw.Draw(polygon_mask).polygon(polygon, fill=255)
    polygon_mask = polygon_mask.filter(ImageFilter.GaussianBlur(3.0))
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
        output = ASSETS / f"20261012-cafe-seat-{seat_id:02d}-occupant.webp"
        layer.save(output, "WEBP", quality=92, method=6, exact=True)
        preview = Image.alpha_composite(preview, layer)

    preview.save(ASSETS / "20261012-cafe-occupants-composite-preview.png")


if __name__ == "__main__":
    main()

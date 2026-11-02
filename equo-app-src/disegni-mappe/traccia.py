import sys, numpy as np, potrace
from PIL import Image
def traccia(src, dst, specchia=False, soglia=150):
    im = Image.open(src).convert("L")
    if specchia: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    w, h = im.size
    k = 2 if max(w, h) < 1600 else 1
    im = im.resize((w*k, h*k), Image.LANCZOS)
    a = np.array(im) < soglia
    m = 6 * k; a[:m, :] = False; a[-m:, :] = False; a[:, :m] = False; a[:, -m:] = False   # bordo dell immagine: niente cornice
    bm = potrace.Bitmap(a)
    plist = bm.trace(turdsize=6, alphamax=1.0, opticurve=True, opttolerance=0.2)
    parts = []
    for curve in plist:
        fs = curve.start_point
        d = [f"M{fs.x/k:.1f},{fs.y/k:.1f}"]
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f"L{seg.c.x/k:.1f},{seg.c.y/k:.1f}L{seg.end_point.x/k:.1f},{seg.end_point.y/k:.1f}")
            else:
                d.append(f"C{seg.c1.x/k:.1f},{seg.c1.y/k:.1f} {seg.c2.x/k:.1f},{seg.c2.y/k:.1f} {seg.end_point.x/k:.1f},{seg.end_point.y/k:.1f}")
        xs = [fs.x] + [sg.end_point.x for sg in curve.segments]; ys = [fs.y] + [sg.end_point.y for sg in curve.segments]
        if min(xs) <= 1 and min(ys) <= 1 and max(xs) >= w*k - 1 and max(ys) >= h*k - 1: continue   # cornice dell'immagine aggiunta da potrace
        parts.append("".join(d) + "Z")
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><path fill="currentColor" fill-rule="evenodd" d="{"".join(parts)}"/></svg>'
    open(dst, "w").write(svg)
    print(dst, w, h, len(svg)//1024, "KB")
traccia("1-cavallo-sinistra.png", "cavallo-sinistra.svg")
traccia("1-cavallo-sinistra.png", "cavallo-destra.svg", specchia=True)
traccia("3-cavallo-davanti.png", "cavallo-davanti.svg")
traccia("4-cavallo-dietro.png", "cavallo-dietro.svg")
traccia("5-cavallo-alto.png", "cavallo-alto.svg")

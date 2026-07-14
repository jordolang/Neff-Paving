# Source images (NOT deployed)

Full-resolution Adobe Stock originals. They live here rather than in `public/`
because everything under `public/` is copied verbatim into the build — these
seven files are ~48 MB and were shipping to production until they were moved.

Web-sized derivatives are generated from these and committed under:

- `public/images/hero/`    — the five hero carousel slides (480/768/1280/1920, AVIF + WebP + JPEG)
- `public/images/texture/` — the road backdrop (900/1440, AVIF + WebP + JPEG)

| File                      | Used as                                             |
|---------------------------|-----------------------------------------------------|
| AdobeStock_308116482.jpeg | hero slide 1 — `roller` (the LCP image)             |
| AdobeStock_422270762.jpeg | hero slide 2 — `paver-sunset`                       |
| AdobeStock_223516307.jpeg | hero slide 3 — `dozer-dusk`                         |
| AdobeStock_552367546.jpeg | hero slide 4 — `crew`                               |
| AdobeStock_474250352.jpeg | hero slide 5 — `grader-sunset`                      |
| AdobeStock_332370427.jpeg | sitewide road backdrop (double-yellow centerline)   |
| AdobeStock_487909454.jpeg | unused — dark asphalt fade, kept as a spare texture |

The road backdrop is cropped symmetric about the painted centerline (which sits at
50.67% of the source, not 50%) so the double-yellow lands exactly on the page axis.

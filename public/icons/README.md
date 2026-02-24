# PWA Icons

Add the following icon files here:

- `icon-192.png` — 192×192 px (required for PWA install prompt)
- `icon-512.png` — 512×512 px (required for splash screen)
- `apple-touch-icon.png` — 180×180 px (iOS home screen)
- `favicon.ico` — 32×32 px (browser tab)

## Quick generation (with ImageMagick)

```bash
# From a 1024x1024 source logo:
convert logo.png -resize 192x192 icon-192.png
convert logo.png -resize 512x512 icon-512.png
convert logo.png -resize 180x180 apple-touch-icon.png
convert logo.png -resize 32x32 favicon.ico
```

## Free online tools
- https://realfavicongenerator.net  (generates all sizes from one image)
- https://www.pwabuilder.com/imageGenerator

# Sinapis Dev — 30s vertical brand intro

A 1080×1920, 30 fps, 900-frame (exactly 30.000s) silent brand introduction,
built as a Remotion composition. Every audience-facing string is Brazilian
Portuguese; everything in this file and in the code comments is English.

## Deliverables

All paths are relative to `remotion/`.

| File | What it is |
| --- | --- |
| `out/deliverables/sinapis-dev-intro-silent.mp4` | the master — H.264 High, yuv420p, BT.709, faststart, no audio stream |
| `out/deliverables/sinapis-dev-intro-cover.png` | 1080×1920 thumbnail |
| `out/deliverables/sinapis-dev-intro-contactsheet.png` | 12-frame storyboard preview |

There is **no** `sinapis-dev-intro-audio.mp4`. See "Limitations".

## Running it

Every command below was run on this machine and is reproduced verbatim.
Run them from `remotion/`.

### Preview in the browser

```
npx remotion studio src/index.ts
```

Compositions: `SinapisDevIntro` (the video), `SinapisDevCover` (the thumbnail).

### Render a cheap review pass

JPEG frames at quarter scale — fast, good enough to catch layout faults.

```
npx remotion render src/index.ts SinapisDevIntro out/preview-frames \
  --sequence --image-format=jpeg --scale=0.25 --log=error
```

### Render the master

This machine runs macOS 13.7.8, so Remotion cannot mux the video itself
(see "Limitations"). The master is produced in two steps: a PNG sequence from
Remotion, then a stitch with the system ffmpeg.

```
npx remotion render src/index.ts SinapisDevIntro out/master-frames \
  --sequence --image-format=png --log=error
```

```
ffmpeg -y -loglevel error \
  -framerate 30 -i out/master-frames/element-%03d.png \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -profile:v high -level 4.0 -preset veryslow -crf 10 \
  -x264-params "keyint=60:min-keyint=60:scenecut=0:colorprim=bt709:transfer=bt709:colormatrix=bt709" \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
  -movflags +faststart -an out/deliverables/sinapis-dev-intro-silent.mp4
```

### Render the cover

```
npx remotion still src/index.ts SinapisDevCover \
  out/deliverables/sinapis-dev-intro-cover.png --log=error
```

### Verify the master

```
ffprobe -v error -show_entries format=duration,bit_rate,nb_streams \
  -show_entries stream=codec_name,profile,width,height,pix_fmt,color_space,color_transfer,color_primaries,r_frame_rate,nb_frames \
  -of default=noprint_wrappers=1 out/deliverables/sinapis-dev-intro-silent.mp4
```

Expected: `h264` / `High` / `1080` / `1920` / `yuv420p`, all three BT.709 tags,
`r_frame_rate=30/1`, `nb_frames=900`, `duration=30.000000`, `nb_streams=1`.

### Render the contact sheet

```
ffmpeg -y -loglevel error -i out/deliverables/sinapis-dev-intro-silent.mp4 \
  -vf "select='eq(n,0)+eq(n,45)+eq(n,120)+eq(n,180)+eq(n,230)+eq(n,300)+eq(n,360)+eq(n,450)+eq(n,540)+eq(n,640)+eq(n,740)+eq(n,860)',scale=324:576,tile=4x3:padding=10:margin=10:color=0xE6E6E6" \
  -frames:v 1 out/deliverables/sinapis-dev-intro-contactsheet.png
```

Toolchain actually used: Node v22.15.0, Remotion 4.0.532, ffmpeg 8.1.1 at
`/usr/local/bin/ffmpeg`, macOS 13.7.8 (22H730).

## How the code is laid out

```
src/sinapis/
  brand.ts       colours, the logo asset and its intrinsic size, profileHandle
  content.ts     every audience-facing string, with its line breaks
  timing.ts      frame constants: 900 / 30fps / 1080×1920, plus the shared beats
  theme.ts       safe area, type scale, the shared column style
  motion.ts      the one easing curve and the reveal / rise / phase helpers
  layout.ts      card geometry, the drawn connection, the blue dot's whole path
  fonts.ts       local Inter loading, gated with delayRender
  SinapisIntro.tsx   composes the layers and passes the global frame down
  Cover.tsx          the thumbnail
  components/    Cards, BlueDot, Connection, Branches, CobaltField, TextLine
  scenes/        Scene1Hook … Scene6Cta
```

Two decisions worth knowing before you edit:

**There are no `<Sequence>`s.** Every scene takes the global `frame` as a prop
and decides its own visibility. That is what lets the three cards and the blue
dot be literally the same elements from frame 0 to frame 899 — the dot's path in
`layout.ts` is one keyframe table across all six scenes, so it cannot
teleport at a scene boundary.

**The dot and the stroke it draws read from the same curve.** `connectionAt(t)`
evaluates the quadratics analytically and `CONNECTION_D` is built from the same
control points, so the dot sits on the line by construction rather than by
hand-matched timings.

To change copy, edit `content.ts` and nothing else. To retime, edit `timing.ts`
and the per-scene cue constants at the top of each scene file.

## Assets and provenance

| Asset | Where it came from | Licence |
| --- | --- | --- |
| `public/brand/sinapis-dev-azul-horizontal.png` | the approved logo supplied with the brief, copied in unmodified (2054×766) | client-owned |
| `public/fonts/inter-latin-{400,500,700,800}-normal.woff2` | `node_modules/@fontsource/inter` | SIL Open Font License 1.1 — full text in `public/fonts/Inter-LICENSE.txt` |

Both are bundled locally. Nothing is fetched over the network at render time;
`fonts.ts` holds the render open with `delayRender` until `document.fonts.ready`
resolves, so no frame can be captured in a fallback face.

The logo PNG has a **white background, not transparency**. It is therefore only
ever placed on white. On the cobalt end card the logo is omitted entirely and
the brand name appears as ordinary text — which the brief permits — so there is
no white panel floating on the blue.

## Caption (pt-BR)

> Seu negócio cresceu, mas os processos continuaram os mesmos? Informação
> espalhada, trabalho repetido, cada coisa num canto.
>
> A gente desenvolve software sob medida para a realidade do seu negócio.
>
> Aqui no perfil mostramos os bastidores: as decisões, os caminhos e como uma
> ideia vira solução na prática.
>
> Entre no perfil e siga a Sinapis Dev.

One call to action, matching the end card: visit the profile, then follow.

## Limitations

1. **No audio edition.** No licensed music or sound library was available in this
   environment, and the brief forbids buying media. The master is silent and has
   no audio stream at all (`nb_streams=1`). No `sinapis-dev-intro-audio.mp4` was
   produced. No voiceover was recorded and no SRT was written, because there is
   no narration to caption.

2. **Rendering needed a workaround.** Remotion 4.0.532's bundled compositor
   requires macOS 15+; on this machine (13.7.8) it fails with an AVFoundation
   dyld symbol error. The master is therefore a PNG sequence stitched with the
   system ffmpeg. The output is a normal H.264 MP4 — only the path to it differs.

3. **Review was by frame inspection, not playback.** I cannot watch video in this
   environment. Correctness was established by decoding frames out of the final
   MP4 and reading them: a contact sheet every 20 frames across all 900, denser
   tiles at each scene boundary, full-resolution crops of every typographic and
   vector detail, and a 360×640 pass for mobile legibility. Motion smoothness was
   reasoned from the easing functions and verified frame-adjacently, not observed
   in motion. Metadata was checked with ffprobe and the faststart layout by
   parsing the MP4 atom order (`ftyp, moov, free, mdat`). A human should still
   watch it once before publishing.

4. **Bitrate is far below the brief's 12–20 Mbps.** Delivered is ~0.65 Mbps. This
   is not under-encoding. The content is flat vector art on white, so there is
   very little for the encoder to spend bits on: at `-qp 0`, which is
   mathematically lossless H.264, the same frames produce only ~0.9 Mbps. At
   `crf 10` the result measures 43.65 dB PSNR against the source PNGs versus
   43.70 dB for lossless — a 0.06 dB difference. The 43.7 dB ceiling is imposed
   by yuv420p chroma subsampling, which the brief requires, not by the bitrate.
   Forcing `-b:v 16M` produced a file that was not measurably better.

5. **No profile handle.** `brand.profileHandle` in `brand.ts` is an empty string
   and nothing renders for it. Fill it in and it appears as a plain text line on
   the end card. It was left empty because no handle was confirmed, and the brief
   forbids inventing one.

6. **Nothing was published.** No upload, no account, no media purchase.

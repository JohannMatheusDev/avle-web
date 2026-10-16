Standalone Remotion project — separate from the Next.js app in `avle-frontend`.

```
npm install
npm run dev       # Remotion Studio
npm run master    # frames -> mp4 -> cover, into out/deliverables/
```

Compositions: `SinapisDevIntro` (the 30s vertical brand intro), `SinapisDevCover`
(its thumbnail), `AvleApresentacao` and `AvleCapa` (the AVLE 30s video for store
owners and its cover, see [`src/avle/README.md`](src/avle/README.md)),
`AvleApresentacaoV2` and `AvleCapaV2` (the V2, see
[`src/avle-v2/README.md`](src/avle-v2/README.md)), `MyComp`
(the starter scaffold).

The brand intro has its own documentation — commands, asset provenance, caption
and limitations — in [`src/sinapis/README.md`](src/sinapis/README.md).

## macOS 13/14 note

Remotion's bundled compositor (the native binary that stitches rendered frames into
an mp4) requires macOS 15 (Sequoia)+. On older macOS it fails with an `AVFoundation`
dyld symbol error (see [remotion-dev/remotion#7027](https://github.com/remotion-dev/remotion/issues/7027)).

That is why there is no single `render` script here. `npm run master` renders a PNG
sequence with Remotion and stitches it with your system `ffmpeg` (`brew install
ffmpeg` if you don't have one), which works on any macOS version.

#!/usr/bin/env bash
# Monta out/avle-apresentacao.mp4 a partir dos frames de out/avle-frames.
#
# Existe porque o compositor que vem com o Remotion 4.0.532 exige macOS 15: no
# macOS 13 desta máquina, `remotion render ... .mp4` renderiza os frames e
# morre na hora de juntar, com "Symbol not found: _AVCaptureDeviceTypeContinuityCamera".
# O ffmpeg do sistema faz essa última etapa.
#
# Como o Remotion não chega a mixar o áudio aqui, a mixagem também é feita
# pelo ffmpeg, com os mesmos números de `src/avle/timing.ts` (`audio`):
# trilha a 0.12 e fade-out nos últimos 15 frames (0,5 s). Mudou lá, mude aqui.
set -euo pipefail
cd "$(dirname "$0")/.."

FRAMES=out/avle-frames/element-%03d.jpeg
SAIDA=out/avle-apresentacao.mp4
NARRACAO=public/avle/narracao.mp3
TRILHA=public/avle/trilha.mp3
DURACAO=30
VOLUME_TRILHA=0.12
FADE=0.5

entradas=(-framerate 30 -i "$FRAMES")
filtros=()
rotulos=""
n=1
if [[ -f "$NARRACAO" ]]; then
	entradas+=(-i "$NARRACAO")
	filtros+=("[$n:a]apad,atrim=0:$DURACAO[narr]")
	rotulos+="[narr]"
	n=$((n + 1))
fi
if [[ -f "$TRILHA" ]]; then
	entradas+=(-i "$TRILHA")
	filtros+=("[$n:a]apad,atrim=0:$DURACAO,volume=$VOLUME_TRILHA,afade=t=out:st=$(echo "$DURACAO - $FADE" | bc):d=$FADE[tril]")
	rotulos+="[tril]"
	n=$((n + 1))
fi

audio=(-an)
if [[ -n "$rotulos" ]]; then
	quantos=$(( n - 1 ))
	filtros+=("${rotulos}amix=inputs=$quantos:normalize=0[a]")
	audio=(-filter_complex "$(IFS=';'; echo "${filtros[*]}")" -map 0:v -map "[a]" -c:a aac -b:a 192k)
fi

ffmpeg -y -loglevel error "${entradas[@]}" "${audio[@]}" \
	-vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
	-c:v libx264 -profile:v high -preset slow -crf 16 \
	-color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
	-movflags +faststart -t "$DURACAO" "$SAIDA"

echo "Pronto: $SAIDA ($( [[ -n "$rotulos" ]] && echo "com áudio" || echo "sem áudio: nenhum mp3 em public/avle" ))"

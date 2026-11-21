#!/bin/bash
set -e
SP=/tmp/claude-0/-home-claude/ad5a78dd-94e8-56ba-a21c-9fa21e1a13e9/scratchpad
OUT=${1:-/mnt/project-files/juegos/web}
mkdir -p $OUT/lib $OUT/tex
cp $SP/t3/package/build/three.min.js $OUT/lib/
for f in controls/OrbitControls.js objects/Water.js objects/Sky.js; do cp $SP/t3/package/examples/js/$f $OUT/lib/; done
cp $SP/pj/package/dist/peerjs.min.js $SP/t3/package/examples/js/loaders/GLTFLoader.js $OUT/lib/
mkdir -p $OUT/modelos; for m in barco-galeon brasa bruno nadia salitre lupe kai isla-bosque isla-lona isla-hierro isla-ron isla-perlas; do cp /mnt/project-files/juegos/modelos/$m.glb $OUT/modelos/; done
cp /mnt/project-files/juegos/tableros/tex/waternormals.jpg /mnt/project-files/juegos/tableros/tex/lavatile.jpg $OUT/tex/
B=$(date +%s)
cat > $OUT/index.html <<HTML
<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Archipiélago</title>
<meta name="theme-color" content="#0d0a09">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">
<style>
html,body{margin:0;height:100%;background:#050506;overflow:hidden;color:#f3e6c8;font-family:"IM Fell English",Georgia,serif;-webkit-tap-highlight-color:transparent}
canvas{display:block;touch-action:none}
[hidden]{display:none!important}
</style></head><body>
<script>window.BUILD="$B"</script>
<script src="lib/three.min.js"></script>
<script src="lib/OrbitControls.js"></script>
<script src="lib/Water.js"></script>
<script src="lib/Sky.js"></script>
<script src="lib/GLTFLoader.js"></script>
<script src="lib/peerjs.min.js"></script>
<script src="game.js?v=$B"></script>
</body></html>
HTML
cat $SP/helpers.js $SP/types.js $SP/web_lobby.js > $OUT/game.js
cat $SP/web_world_gen.js $SP/g_scene.js $SP/g_cardcss.js $SP/web_world_rest.js $SP/web_world_game.js > $OUT/world.js
python3 $SP/cards_img.py $OUT >/dev/null
mkdir -p $OUT/retratos; cp $SP/retratos/*.jpg $OUT/retratos/
touch $OUT/.nojekyll
node --check $OUT/game.js && node --check $OUT/world.js && echo OK

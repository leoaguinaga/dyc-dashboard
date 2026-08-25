#!/bin/bash
# Deploy atomico: buildea en una carpeta temporal y recien la reemplaza
# cuando el build termino OK, para que el proceso viejo nunca sirva HTML
# apuntando a chunks que ya fueron borrados por un build en curso.
set -e

cd "$(dirname "$0")"

git pull origin development
pnpm install --frozen-lockfile

rm -rf .next-new
NEXT_DIST_DIR=.next-new pnpm build

# Los chunks de _next/static tienen nombre hasheado por contenido, así que
# nunca colisionan entre builds. Los acumulamos en el build nuevo para que
# las pestañas que quedaron abiertas con el build anterior (o el anterior
# a ese) sigan encontrando su CSS/JS y no se rompan a mitad de sesión.
if [ -d .next/static ]; then
  mkdir -p .next-new/static
  cp -rn .next/static/. .next-new/static/
fi

rm -rf .next-old
[ -d .next ] && mv .next .next-old
mv .next-new .next

pm2 restart dashboard --update-env

rm -rf .next-old

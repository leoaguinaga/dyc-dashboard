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

rm -rf .next-old
[ -d .next ] && mv .next .next-old
mv .next-new .next

pm2 restart dashboard --update-env

rm -rf .next-old

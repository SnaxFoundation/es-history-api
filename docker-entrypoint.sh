#!/bin/sh

if [ $# -eq 0 ]; then
  npm run serve
else
  exec "$@"
fi

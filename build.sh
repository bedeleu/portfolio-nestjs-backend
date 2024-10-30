#!/bin/bash
# build.sh

# Creează directorul pentru uploads
mkdir -p uploads
chmod 755 uploads

# Instalează dependențele și face build
npm install -g @nestjs/cli
npm install --include=dev
npm run build
#!/bin/bash

# Ramas a sincronizar con origin/main
branches=(
  "Esteban-Branch"
  "Juan-Branch"
  "Ricardo-Branch"
  "Tomas-Branch"
  "Yahir-Branch"
)

echo " Fetching latest changes from origin..."
git fetch origin

# Iterar sobre las ramas y forzar push de origin/main a cada una
for branch in "${branches[@]}"; do
  echo " Sincronizando $branch con origin/main..."
  git push origin origin/main:$branch --force
done

echo " ¡Todas las ramas han sido sincronizadas con origin/main!"

#!/bin/bash

cd /workspace

if [ -f input.txt ]; then
    python3 main.py < input.txt
else
    python3 main.py
fi
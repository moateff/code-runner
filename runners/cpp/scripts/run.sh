#!/bin/bash

cd /workspace

# Compile
g++ -O2 -Wall -o main main.cpp

# Run
if [ -f input.txt ]; then
    ./main < input.txt
else
    ./main
fi
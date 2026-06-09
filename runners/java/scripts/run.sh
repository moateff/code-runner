#!/bin/bash

cd /workspace

# Compile
javac Main.java

# Execute
if [ -f input.txt ]; then
    java Main < input.txt
else
    java Main
fi
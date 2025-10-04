#!/bin/sh

mkdir -p ssl

OS_NAME=$(uname)

case "$OS_NAME" in
  Darwin)
    # macOS
    # https://stackoverflow.com/a/13322549
    HOST_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1')
    ;;
  Linux)
    # Linux (Untested)
    # https://stackoverflow.com/a/13322549
    HOST_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1')
    ;;
  MINGW*|CYGWIN*|MSYS*)
    # Windows under Git Bash or Cygwin (Untested)
    HOST_IP=$(ipconfig | grep 'IPv4 Address' | awk '{print $NF}')
    ;;
  *)
    echo "Unsupported OS: $OS_NAME, skipping retrieval of host IP..."
    ;;
esac

mkcert --cert-file ssl/local.pem --key-file ssl/local-key.pem localhost 127.0.0.1 ::1 $HOST_IP

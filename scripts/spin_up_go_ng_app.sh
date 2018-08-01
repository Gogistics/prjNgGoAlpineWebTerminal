#!/bin/bash
PRJ_DIR=$PWD


finish() {
  local existcode=$?
  cd $PRJ_DIR
  exit $existcode
}

trap "finish" INT TERM

# create network
# check if network exists
set +e
NETWORK_INSPECTION=$(docker network inspect "my_network")
EXITCODE_NETWORK_INSPECTION=$?
[[ $EXITCODE_NETWORK_INSPECTION -ne 0 ]] || (echo "Network, my_network, exists and will be reset" && docker network rm "my_network")

docker network create \
  --driver=bridge \
  --gateway="172.99.0.1" \
  --subnet="172.99.0.0/16" \
  "my_network"
set -e

# redis dcc
docker run -d \
  -p 4999:6379 \
  --name my_redis \
  --net=my_network \
  --ip="172.99.0.10" \
  --log-opt mode=non-blocking \
  --log-opt max-buffer-size=4m \
  --log-opt max-size=100m \
  --log-opt max-file=5 \
  --restart \
  unless-stopped \
  redis redis-server \
  --appendonly yes

# generate bundle files
commands=(
  "cd /rvbdCli && "
  "npm install &&"
  "ng build --deploy-url /ng/ --aot --prod"
)
cd $PRJ_DIR/rvbdCli &&
  docker pull johnpapa/angular-cli &&
  docker run \
    -v $PWD:/rvbdCli \
    --rm johnpapa/angular-cli \
    sh -c "${commands[*]}" &&
  [ "$(ls -A $PRJ_DIR/goAlpineApp/ng)" ] && rm -r $PRJ_DIR/goAlpineApp/ng/*

# copy bundle files to golang dir
cd $PRJ_DIR &&
  cp -r $PRJ_DIR/rvbdCli/dist/rvbdCli/ $PRJ_DIR/goAlpineApp/ng/

# build docker img and spin up the container
cd $PRJ_DIR/goAlpineApp &&
  docker build -t go-ng-app -f Dockerfile.go . &&
  docker run \
    --name my-web-app \
    --net=my_network \
    --ip="172.99.0.20" \
    --log-driver json-file \
    --log-opt mode=non-blocking \
    --log-opt max-buffer-size=4m \
    --log-opt max-size=50m \
    --log-opt max-file=5 \
    -p 3000:3000 \
    -d go-ng-app


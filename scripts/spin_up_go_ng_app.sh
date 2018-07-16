#!/bin/bash
PRJ_DIR=$PWD

# generate bundle files
cd $PRJ_DIR/rvbdCli &&
  docker pull johnpapa/angular-cli &&
  docker run -v $PWD:/rvbdCli --rm johnpapa/angular-cli sh -c "cd /rvbdCli && ng build --deploy-url /ng/ --aot --prod" &&
  [ "$(ls -A $PRJ_DIR/goAlpineApp/ng)" ] && rm -r $PRJ_DIR/goAlpineApp/ng/*

# copy bundle files to golang dir
cd $PRJ_DIR &&
  cp -r $PRJ_DIR/rvbdCli/dist/rvbdCli/ $PRJ_DIR/goAlpineApp/ng/

# build docker img and spin up the container
cd $PRJ_DIR/goAlpineApp &&
  docker build -t go-ng-app -f Dockerfile.ng . &&
  docker run --name my-web-app -p 3000:3000 -d go-ng-app

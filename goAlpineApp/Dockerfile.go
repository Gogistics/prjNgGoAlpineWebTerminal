FROM golang:alpine
ADD . ./
RUN apk add --no-cache git \
  && go get gopkg.in/redis.v3 \
  && apk del git
RUN cd ./ \
  && go build -o web_app go_ng_app.go
ENV PORT 3000
EXPOSE 3000
ENTRYPOINT ["./web_app"]
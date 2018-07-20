package main

import (
  "log"
  "flag"
  "net/http"
  "strings"
  "./websocket"
)

const prefixSlash = "/"
func FileHandler(w http.ResponseWriter, r *http.Request) {
  var path string
  var fileName string

  if strings.HasPrefix(r.URL.Path, prefixSlash) {
    path = r.URL.Path[len(prefixSlash):]
  }

  log.Println("The path is: ", path)
  if strings.HasPrefix(path, "ng") {
    fileName = "./" + path
  } else {
    fileName = "./ng/index.html"
  }
  log.Printf("Serveing files by FileHandler")
  
  http.ServeFile(w,r,fileName)
}


// msg type for websocket
type msg struct {
  Command string
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
  if r.Header.Get("Origin") != "http://" + r.Host {
    http.Error(w, "Origin not allowed", 403)
    return
  }
  conn, err := websocket.Upgrade(w, r, w.Header(), 1024, 1024)
  if err != nil {
    http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
  }

  go echo(conn)
}

func echo(conn *websocket.Conn) {
  for {
    m := msg{}

    err := conn.ReadJSON(&m)
    if err != nil {
      log.Fatal("Error reading json.", err)
    }

    log.Printf("Got message: %#v\n", m)

    if err = conn.WriteJSON(m); err != nil {
      log.Fatal(err)
    }
  }
}

// server entry
func main() {
  port := flag.String("p", "3000", "port")
  dir := flag.String("d", ".", "dir")
  flag.Parse()

  http.HandleFunc("/ws", wsHandler)
  http.HandleFunc(prefixSlash, FileHandler)
  
  log.Printf("Serving %s Http port: %s\n", *dir, *port)
  log.Fatal(http.ListenAndServe(":" + *port, nil))
}
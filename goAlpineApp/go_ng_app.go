package main

import (
  "log"
  "flag"
  "net/http"
  "strings"
  "encoding/json"
  "io/ioutil"
  "bytes"
  "./dep_modules/websocket"
  "./dep_modules/redismq"
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
// \// msg type for websocket

// api
type apiResp struct {
  Key int
  Items []string
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
  if r.Method != "POST" {
    http.Error(w, "API only handles the requests via POST", http.StatusNotFound)
    return
  }

  // Read body
  b, err := ioutil.ReadAll(r.Body)
  defer r.Body.Close()
  if err != nil {
    http.Error(w, err.Error(), 500)
    return
  }
  rbody := ioutil.NopCloser(bytes.NewBuffer(b))
  log.Printf("BODY: %q", rbody)

  // reply to the request
  res := &apiResp{
    Key: 1,
    Items: []string{"one", "two", "three"}}
  js, err := json.Marshal(res)
  if err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }
  w.Header().Set("Content-Type", "application/json")
  w.Write(js)
}
// \api

// server entry
func main() {
  // redis
  testQueue := redismq.CreateQueue("172.99.0.10", "6379", "", 9, "clicks")
  testQueue.Put("testpayload")

  // handle request
  port := flag.String("p", "3000", "port")
  dir := flag.String("d", ".", "dir")
  flag.Parse()

  // websocket
  http.HandleFunc("/ws", wsHandler)

  // REST API
  // mux := http.NewServeMux()
  http.HandleFunc("/api", apiHandler)

  // serve static files
  http.HandleFunc(prefixSlash, FileHandler)
  
  log.Printf("Serving %s Http port: %s\n", *dir, *port)
  log.Fatal(http.ListenAndServe(":" + *port, nil))
}

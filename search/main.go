package main

import (
	"log"
	"net/http"
	"os"

	"search/api"
	"search/engine"
)

func main() {
	e := engine.NewSearchEngine()
	h := api.NewHandler(e)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("[search] listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, h.Routes()))
}

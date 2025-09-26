package main

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
	"github.com/romulodm/go-portfolio/api"
	"github.com/romulodm/go-portfolio/config"
	db "github.com/romulodm/go-portfolio/database/sqlc"
	"github.com/romulodm/go-portfolio/token"
)

func main() {
	config, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Cannot load config:", err)
	}

	conn, err := sql.Open(config.DBDriver, config.GetDatabaseURL())
	if err != nil {
		log.Fatal("Error to connect DB:", err)
	}

	store := db.NewStore(conn)
	tokenManager := token.NewManager([]byte(config.JWTSecretKey))

	server, err := api.NewServer(config, store, tokenManager)
	if err != nil {
		log.Fatal("Cannot create server!")
	}

	server.Start(":9050")
}

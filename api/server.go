package api

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/romulodm/go-portfolio/config"
	db "github.com/romulodm/go-portfolio/database/sqlc"
	"github.com/romulodm/go-portfolio/token"
)

type Server struct {
	config       config.Config
	store        *db.Store
	tokenManager *token.Manager
	router       *gin.Engine
}

func NewServer(config config.Config, store *db.Store, tokenManager *token.Manager) (*Server, error) {
	server := &Server{
		config:       config,
		store:        store,
		tokenManager: tokenManager,
	}

	server.setupRouter()

	return server, nil

}

func (server *Server) setupRouter() {
	r := gin.Default()
	r.Use(cors.Default())

	r.POST("/auth/google-auth", server.googleAuth)
	r.POST("/token/renew-token", server.renewAccessToken)

	server.router = r
}

func (server *Server) Start(address string) error {
	return server.router.Run(address)
}

func errorResponse(err error) gin.H {
	return gin.H{"error": err.Error()}
}

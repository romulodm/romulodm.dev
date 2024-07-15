package api

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/romulodm/go-portfolio/database/sqlc"
)

type GoogleAuthRequest struct {
	Email         string `json:"email" binding:"required"`
	Sub           string `json:"sub" binding:"required"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name" binding:"required"`
	FullName      string `json:"full_name"`
	Picture       string `json:"picture" binding:"required"`
}

type GoogleAuthResponse struct {
	Token                 string    `json:"token"`
	AccessTokenExpiresAt  time.Time `json:"token_expires_at"`
	RefreshToken          string    `json:"refresh_token"`
	RefreshTokenExpiresAt time.Time `json:"refresh_token_expires_at"`
	User                  db.User   `json:"user"`
}

func (server *Server) googleAuth(ctx *gin.Context) {
	var req GoogleAuthRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := server.store.GetUserByEmail(ctx, req.Email)
	if err != nil && err != sql.ErrNoRows {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err == sql.ErrNoRows {
		arg := db.CreateUserParams{
			Email:         req.Email,
			Sub:           req.Sub,
			EmailVerified: req.EmailVerified,
			FullName:      req.FullName,
			Name:          req.Name,
			Picture:       req.Picture,
		}

		user, err = server.store.CreateUser(ctx, arg)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		if user.Sub != req.Sub {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid sub"})
			return
		}
	}

	accessToken, accessPayload, err := server.tokenManager.Generate(user.Sub, user.Email, user.Admin, server.config.JWTAccessTokenExpiry)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	refreshToken, refreshPayload, err := server.tokenManager.Generate(user.Sub, user.Email, user.Admin, server.config.JWTRefreshTokenExpiry)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rsp := GoogleAuthResponse{
		Token:                 accessToken,
		AccessTokenExpiresAt:  accessPayload.ExpiresAt,
		RefreshToken:          refreshToken,
		RefreshTokenExpiresAt: refreshPayload.ExpiresAt,
		User:                  user,
	}

	ctx.JSON(http.StatusOK, rsp)
}

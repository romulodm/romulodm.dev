package api

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/romulodm/go-portfolio/database/sqlc"
)

type GoogleAuthRequest struct {
	Email         string `json:"email" binding:"required,email"`
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
	User                  User      `json:"user"`
}

type User struct {
	ID            int32     `json:"id"`
	Email         string    `json:"email"`
	Sub           string    `json:"sub"`
	EmailVerified bool      `json:"email_verified"`
	Name          string    `json:"name"`
	FullName      string    `json:"full_name,omitempty"`
	Picture       string    `json:"picture"`
	Admin         bool      `json:"admin"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at,omitempty"`
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
		User: User{
			ID:            user.ID,
			Email:         user.Email,
			Sub:           user.Sub,
			EmailVerified: user.EmailVerified,
			Name:          user.Name,
			FullName:      user.FullName,
			Picture:       req.Picture,
			Admin:         user.Admin,
			CreatedAt:     user.CreatedAt,
			UpdatedAt:     user.UpdatedAt,
		},
	}

	ctx.JSON(http.StatusOK, rsp)

	if user.Picture != req.Picture {
		go func() {
			arg := db.UpdateUserPictureParams{
				ID:      user.ID,
				Picture: req.Picture,
			}

			updateCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			if err := server.store.UpdateUserPicture(updateCtx, arg); err != nil {
				fmt.Println("Failed to update user picture: ", err)
			}
		}()
	}
}

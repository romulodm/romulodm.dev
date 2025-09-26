package api

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/romulodm/go-portfolio/database/sqlc"
)

type CreateCommentRequest struct {
	PostID  int32  `json:"post_id" binding:"required"`
	UserID  int32  `json:"user_id" binding:"required"`
	Content string `json:"content" binding:"required"`
}

type CreateCommentResponse struct {
	ID           int32     `json:"id"`
	PostID       int32     `json:"post_id"`
	UserID       int32     `json:"user_id"`
	Content      string    `json:"content"`
	LikesCount   int32     `json:"likes_count"`
	RepliesCount int32     `json:"replies_count"`
	CreatedAt    time.Time `json:"created_at"`
}

func (server *Server) createComment(ctx *gin.Context) {
	var req CreateCommentRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var coment db.Comment

	coment, err := server.store.CreateComment(ctx, db.CreateCommentParams{
		PostID:  req.PostID,
		UserID:  req.UserID,
		Content: req.Content,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := CreateCommentResponse{
		ID:           coment.ID,
		PostID:       coment.PostID,
		UserID:       coment.UserID,
		Content:      coment.Content,
		LikesCount:   coment.LikesCount,
		RepliesCount: coment.RepliesCount,
		CreatedAt:    coment.CreatedAt,
	}

	ctx.JSON(http.StatusOK, resp)
}

func (server *Server) deleteComment(ctx *gin.Context) {
	commentID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	err = server.store.DeleteCommentAndRelatedEntities(ctx, int32(commentID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "comment deleted successfully"})
}

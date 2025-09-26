package api

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/romulodm/go-portfolio/database/sqlc"
)

type CreatePostRequest struct {
	Slug string `json:"slug" binding:"required"`
	Link string `json:"link" binding:"required"`
}

type CreatePostResponse struct {
	Id            int32     `json:"id"`
	Slug          string    `json:"slug"`
	Link          string    `json:"link"`
	ViewsCount    int32     `json:"views_count"`
	LikesCount    int32     `json:"likes_count"`
	CommentsCount int32     `json:"comments_count"`
	CreatedAt     time.Time `json:"created_at"`
}

func (server *Server) createPost(ctx *gin.Context) {
	var req CreatePostRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var post db.Post

	post, err := server.store.CreatePost(ctx, db.CreatePostParams{
		Slug: req.Slug,
		Link: req.Link,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := CreatePostResponse{
		Id:            post.ID,
		Slug:          post.Slug,
		Link:          post.Link,
		ViewsCount:    post.ViewsCount,
		LikesCount:    post.LikesCount,
		CommentsCount: post.CommentsCount,
		CreatedAt:     post.CreatedAt,
	}

	ctx.JSON(http.StatusOK, resp)
}

func (server *Server) getPostById(ctx *gin.Context) {
	postID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	post, err := server.store.GetPostById(ctx, int32(postID))
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, post)
}

func (server *Server) getPostBySlug(ctx *gin.Context) {
	slug := ctx.Param("slug")

	post, err := server.store.GetPostBySlug(ctx, slug)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, post)
}

func (server *Server) getAllPosts(ctx *gin.Context) {
	limit, err := strconv.Atoi(ctx.Query("limit"))
	if err != nil {
		limit = 30
	}
	offset, err := strconv.Atoi(ctx.Query("offset"))
	if err != nil {
		offset = 0
	}

	posts, err := server.store.GetAllPosts(ctx, db.GetAllPostsParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, posts)
}

func (server *Server) incrementViews(ctx *gin.Context) {
	postID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	err = server.store.IncrementPostViews(ctx, int32(postID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "views incremented"})
}

func (server *Server) incrementLikes(ctx *gin.Context) {
	postID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	err = server.store.IncrementPostLikes(ctx, int32(postID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "likes incremented"})
}

func (server *Server) incrementComments(ctx *gin.Context) {
	postID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	err = server.store.IncrementPostComments(ctx, int32(postID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "comments incremented"})
}

func (server *Server) deletePost(ctx *gin.Context) {
	postID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	err = server.store.DeletePostAndRelatedEntities(ctx, int32(postID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "post deleted successfully"})
}

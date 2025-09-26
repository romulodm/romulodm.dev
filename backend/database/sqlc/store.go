package db

import (
	"context"
	"database/sql"
	"fmt"
)

/*
	This file define all functions to execute "DB queries"
*/

type Store struct {
	*Queries
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{
		Queries: New(db),
		db:      db,
	}
}

func (store *Store) ExecTx(ctx context.Context, fn func(*Queries) error) error {
	tx, err := store.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	qtx := New(tx)

	err = fn(qtx)
	if err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("tx err: %v, rb err: %v", err, rbErr)
		}
		return err
	}

	return tx.Commit()
}

func (store *Store) DeletePostAndRelatedEntities(ctx context.Context, postID int32) error {
	return store.ExecTx(ctx, func(q *Queries) error {
		return q.DeletePost(ctx, postID)
	})
}

func (store *Store) DeleteCommentAndRelatedEntities(ctx context.Context, commentID int32) error {
	return store.ExecTx(ctx, func(q *Queries) error {
		return q.DeleteComment(ctx, commentID)
	})
}

func (store *Store) DeleteCommentReplyAndRelatedEntities(ctx context.Context, commentReplyID int32) error {
	return store.ExecTx(ctx, func(q *Queries) error {
		return q.DeleteCommentReply(ctx, commentReplyID)
	})
}

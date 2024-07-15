package db

import (
	"database/sql"
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

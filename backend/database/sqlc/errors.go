package db

import (
	"database/sql"
)

var ErrNotFound = sql.ErrNoRows
var ErrConn = sql.ErrConnDone

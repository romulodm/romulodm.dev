package token

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

var (
	UnauthorizedError = errors.New("unauthorized")
	InvalidTokenError = errors.New("invalid token")
	TokenExpiredError = errors.New("token expired")
)

type Manager struct {
	secretKey []byte
	keyFunc   func(token *jwt.Token) (interface{}, error)
}

func NewManager(secretKey []byte) *Manager {
	return &Manager{
		secretKey: secretKey,
		keyFunc: func(token *jwt.Token) (interface{}, error) {
			return secretKey, nil
		},
	}
}

func (m *Manager) Generate(sub string, email string, admin bool, duration time.Duration) (string, *Payload, error) {
	payload, err := NewPayload(sub, email, admin, duration)
	if err != nil {
		return "", nil, err
	}

	tokenJwt := jwt.NewWithClaims(jwt.SigningMethodHS256, payload)
	token, err := tokenJwt.SignedString([]byte(m.secretKey))

	return token, payload, err
}

func (m *Manager) Verify(tokenReceived string) (*Payload, error) {
	token, err := jwt.ParseWithClaims(
		tokenReceived,
		&Payload{},
		m.keyFunc,
		jwt.WithValidMethods([]string{"HS256"}),
		jwt.WithoutClaimsValidation(),
	)

	if err != nil {
		return nil, UnauthorizedError
	}

	payload, ok := token.Claims.(*Payload)
	if !ok || !token.Valid {
		return nil, InvalidTokenError
	}

	if err := payload.Valid(); err != nil {
		return nil, err
	}

	return payload, nil
}

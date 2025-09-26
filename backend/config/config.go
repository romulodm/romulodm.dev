package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	DBDriver              string        `mapstructure:"DB_DRIVER"`
	DBHost                string        `mapstructure:"DB_HOST"`
	DBPort                string        `mapstructure:"DB_PORT"`
	DBUser                string        `mapstructure:"DB_USER"`
	DBPassword            string        `mapstructure:"DB_PASSWORD"`
	DBName                string        `mapstructure:"DB_NAME"`
	JWTSecretKey          string        `mapstructure:"JWT_SECRET_KEY"`
	JWTAccessTokenExpiry  time.Duration `mapstructure:"ACCESS_JWT_DURATION"`
	JWTRefreshTokenExpiry time.Duration `mapstructure:"REFRESH_JWT_DURATION"`
}

func LoadConfig() (config Config, err error) {
	viper.SetConfigFile("./app.env")

	err = viper.ReadInConfig()
	if err != nil {
		return
	}

	err = viper.Unmarshal(&config)
	return
}

func (cfg Config) GetDatabaseURL() string {
	return fmt.Sprintf("%s://%s:%s@%s:%s/%s?sslmode=disable",
		cfg.DBDriver, cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)
}

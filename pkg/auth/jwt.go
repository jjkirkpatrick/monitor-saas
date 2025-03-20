package auth

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
)

// UserClaims represents the expected JWT claims structure from Supabase
type UserClaims struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	Role          string `json:"role"`
	EmailVerified bool   `json:"email_verified"`
	SessionID     string `json:"session_id"`
	IsAnonymous   bool   `json:"is_anonymous"`
}

// JWTMiddleware verifies the JWT from the Authorization header.
func JWTMiddleware(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header value
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			logger.Warn("authorization header missing")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header missing"})
			return
		}

		// Expect header format to be "Bearer {token}"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			logger.Warn("invalid authorization header format")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header format must be Bearer {token}"})
			return
		}

		tokenString := parts[1]

		// Parse and verify the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Ensure the token's signing method is HMAC (HS256)
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				logger.Error("unexpected JWT signing method",
					zap.String("method", fmt.Sprintf("%v", token.Header["alg"])))
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			// Replace with your actual Supabase JWT secret (consider using environment variables in production)
			return []byte(os.Getenv("SUPABASE_JWT_SECRET")), nil
		})
		if err != nil {
			logger.Error("failed to parse JWT token", zap.Error(err))
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		// Extract and validate claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Extract relevant user information
			user := UserClaims{
				Sub:           claims["sub"].(string),
				Email:         claims["email"].(string),
				Role:          claims["role"].(string),
				EmailVerified: claims["user_metadata"].(map[string]interface{})["email_verified"].(bool),
				SessionID:     claims["session_id"].(string),
				IsAnonymous:   claims["is_anonymous"].(bool),
			}

			logger.Debug("JWT token validated successfully",
				zap.String("email", user.Email))

			// Store both full claims and parsed user info in context
			c.Set("JWT_CLAIMS", claims)
			c.Set("user_id", user.Sub)
			c.Set("user_roles", user.Role)
			c.Next()
		} else {
			logger.Warn("invalid JWT token")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
	}
}

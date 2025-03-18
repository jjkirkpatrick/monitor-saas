package auth

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
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
func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header value
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header missing"})
			return
		}

		// Expect header format to be "Bearer {token}"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header format must be Bearer {token}"})
			return
		}

		tokenString := parts[1]

		// Parse and verify the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Ensure the token's signing method is HMAC (HS256)
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			// Replace with your actual Supabase JWT secret (consider using environment variables in production)
			return []byte(os.Getenv("SUPABASE_JWT_SECRET")), nil
		})
		if err != nil {
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

			// Store both full claims and parsed user info in context
			c.Set("JWT_CLAIMS", claims)
			c.Set("USER", user)
			c.Next()
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
	}
}

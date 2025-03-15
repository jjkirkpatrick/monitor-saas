package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/auth0/go-jwt-middleware/v2/jwks"
	"github.com/auth0/go-jwt-middleware/v2/validator"
)

type Auth0Middleware struct {
	validator *validator.Validator
}

// CustomClaims contains custom data we want from the token.
type CustomClaims struct {
	Scope string `json:"scope"`
}

// Validate does nothing for this example, but we need
// it to satisfy validator.CustomClaims interface.
func (c CustomClaims) Validate(ctx context.Context) error {
	return nil
}

// NewAuth0Middleware creates a new Auth0 middleware instance
func NewAuth0Middleware(domain, audience string) (*Auth0Middleware, error) {
	if domain == "" || audience == "" {
		return nil, errors.New("domain and audience are required")
	}

	issuerURL, err := url.Parse(fmt.Sprintf("https://%s/", domain))
	if err != nil {
		return nil, fmt.Errorf("failed to parse issuer URL: %v", err)
	}
	provider := jwks.NewCachingProvider(issuerURL, 5*time.Minute)

	jwtValidator, err := validator.New(
		provider.KeyFunc,
		validator.RS256,
		issuerURL.String(),
		[]string{audience},
		validator.WithCustomClaims(
			func() validator.CustomClaims {
				return &CustomClaims{}
			},
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to set up the validator: %v", err)
	}

	return &Auth0Middleware{
		validator: jwtValidator,
	}, nil
}

// Middleware returns a gin.HandlerFunc that validates JWT tokens
func (a *Auth0Middleware) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := a.getTokenFromHeader(c.Request)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, err := a.validator.ValidateToken(c.Request.Context(), token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Store the claims in the context for later use
		c.Set("claims", claims)
		c.Next()
	}
}

// getTokenFromHeader extracts the token from the Authorization header
func (a *Auth0Middleware) getTokenFromHeader(r *http.Request) (string, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", errors.New("authorization header is missing")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return "", errors.New("authorization header format must be Bearer {token}")
	}

	return parts[1], nil
}

// HasScope checks if the token has the required scope
func HasScope(scope string, c *gin.Context) bool {
	claims, exists := c.Get("claims")
	if !exists {
		return false
	}

	customClaims, ok := claims.(*validator.ValidatedClaims).CustomClaims.(*CustomClaims)
	if !ok {
		return false
	}

	scopes := strings.Split(customClaims.Scope, " ")
	for _, s := range scopes {
		if s == scope {
			return true
		}
	}

	return false
}

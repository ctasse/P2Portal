package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"regexp"
	"strconv"
	"syscall"
	"time"

	"p2portal/relay-server/server"

	"github.com/gorilla/websocket"
)

var roomCodeRegex = regexp.MustCompile(`^\d{6}$`)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for P2P relay
	},
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int64) int64 {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil {
			return n
		}
	}
	return fallback
}

func main() {
	port := getEnv("RELAY_PORT", "8080")
	maxTransferSize := getEnvInt("RELAY_MAX_TRANSFER_SIZE", 100*1024*1024) // 100MB

	hub := server.NewHub(maxTransferSize)

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		roomCode := r.URL.Query().Get("room")
		role := r.URL.Query().Get("role")

		if !roomCodeRegex.MatchString(roomCode) {
			http.Error(w, "invalid room code", http.StatusBadRequest)
			return
		}
		if role != "sender" && role != "receiver" {
			http.Error(w, "invalid role", http.StatusBadRequest)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("upgrade error: %v", err)
			return
		}

		if err := hub.Join(roomCode, role, conn); err != nil {
			log.Printf("join error: %v", err)
			conn.WriteJSON(server.NewErrorMsg(err.Error()))
			conn.Close()
			return
		}
	})

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	// Stale room cleanup goroutine
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			hub.CleanupStaleRooms(5 * time.Minute)
		}
	}()

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Println("shutting down relay server...")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		srv.Shutdown(ctx)
	}()

	log.Printf("relay server starting on :%s (max transfer size: %d bytes)", port, maxTransferSize)
	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

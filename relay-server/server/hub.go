package server

import (
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var roomCodePattern = "^\\d{6}$"

// Hub manages all active rooms.
type Hub struct {
	mu      sync.Mutex
	rooms   map[string]*Room
	maxSize int64
}

func NewHub(maxTransferSize int64) *Hub {
	return &Hub{
		rooms:   make(map[string]*Room),
		maxSize: maxTransferSize,
	}
}

// Join adds a peer to a room and starts relay.
func (h *Hub) Join(roomCode, role string, conn *websocket.Conn) error {
	h.mu.Lock()

	room, exists := h.rooms[roomCode]
	if !exists {
		room = newRoom(roomCode, h, h.maxSize)
		h.rooms[roomCode] = room
	}
	h.mu.Unlock()

	return room.Join(role, conn)
}

// Leave removes a room.
func (h *Hub) Leave(roomCode string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if room, exists := h.rooms[roomCode]; exists {
		room.mu.Lock()
		if room.sender == nil && room.receiver == nil {
			delete(h.rooms, roomCode)
			log.Printf("room %s cleaned up", roomCode)
		}
		room.mu.Unlock()
	}
}

// CleanupStaleRooms removes rooms with no activity beyond maxAge.
func (h *Hub) CleanupStaleRooms(maxAge time.Duration) {
	h.mu.Lock()
	defer h.mu.Unlock()

	for code, room := range h.rooms {
		if room.IsStale(maxAge) {
			delete(h.rooms, code)
			log.Printf("stale room %s cleaned up", code)
		}
	}
}

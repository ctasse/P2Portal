package server

import (
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Room holds two WebSocket connections (sender and receiver) for a given room code.
type Room struct {
	code         string
	sender       *websocket.Conn
	receiver     *websocket.Conn
	mu           sync.Mutex
	hub          *Hub
	lastActivity time.Time
	transfer     *TransferTracker
}

func newRoom(code string, hub *Hub, maxTransferSize int64) *Room {
	return &Room{
		code:         code,
		hub:          hub,
		lastActivity: time.Now(),
		transfer:     NewTransferTracker(maxTransferSize),
	}
}

// Join assigns a role to a WebSocket connection and begins relay.
func (r *Room) Join(role string, conn *websocket.Conn) error {
	r.mu.Lock()

	switch role {
	case "sender":
		if r.sender != nil {
			r.mu.Unlock()
			return ErrRoleAlreadyTaken
		}
		r.sender = conn
	case "receiver":
		if r.receiver != nil {
			r.mu.Unlock()
			return ErrRoleAlreadyTaken
		}
		r.receiver = conn
	default:
		r.mu.Unlock()
		return ErrInvalidRole
	}

	r.lastActivity = time.Now()

	// Send ROOM_JOINED to the joining peer
	writeMsg(conn, NewRoomJoinedMsg(r.code, role))

	// Check if both peers are present
	if r.sender != nil && r.receiver != nil {
		writeMsg(r.sender, NewPeerJoinedMsg())
		writeMsg(r.receiver, NewPeerJoinedMsg())
	}

	roleCopy := role
	r.mu.Unlock()

	// Start read loop for this connection
	r.readLoop(conn, roleCopy)

	return nil
}

func (r *Room) readLoop(conn *websocket.Conn, role string) {
	defer func() {
		r.mu.Lock()
		if role == "sender" {
			r.sender = nil
		} else {
			r.receiver = nil
		}
		// Notify the other peer
		if r.sender != nil {
			writeMsg(r.sender, NewPeerLeftMsg())
		}
		if r.receiver != nil {
			writeMsg(r.receiver, NewPeerLeftMsg())
		}
		bothGone := r.sender == nil && r.receiver == nil
		r.mu.Unlock()

		if bothGone {
			r.hub.Leave(r.code)
		}
	}()

	for {
		var msg RelayServerMessage
		err := conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("room %s %s read error: %v", r.code, role, err)
			}
			return
		}

		r.mu.Lock()
		r.lastActivity = time.Now()

		// Check transfer size limit
		if err := r.transfer.Track(msg); err != nil {
			writeMsg(conn, NewTransferLimitExceededMsg(r.transfer.maxSize, msg.TransferID))
			r.mu.Unlock()
			continue
		}

		// Forward to the other peer
		var target *websocket.Conn
		if role == "sender" {
			target = r.receiver
		} else {
			target = r.sender
		}
		r.mu.Unlock()

		if target != nil {
			writeMsg(target, msg)
		}
	}
}

func (r *Room) IsStale(maxAge time.Duration) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	return time.Since(r.lastActivity) > maxAge
}

func writeMsg(conn *websocket.Conn, msg interface{}) {
	if err := conn.WriteJSON(msg); err != nil {
		log.Printf("write error: %v", err)
	}
}

package server

import (
	"encoding/base64"
	"sync"
)

// TransferTracker tracks byte counts per transfer and enforces a soft limit.
type TransferTracker struct {
	mu        sync.Mutex
	transfers map[string]int64 // transferID -> total bytes seen
	maxSize   int64
}

func NewTransferTracker(maxSize int64) *TransferTracker {
	return &TransferTracker{
		transfers: make(map[string]int64),
		maxSize:   maxSize,
	}
}

// Track examines a message and returns an error if the transfer exceeds the limit.
func (t *TransferTracker) Track(msg RelayServerMessage) error {
	if msg.Type != "FILE_CHUNK" {
		return nil
	}

	decoded, err := base64.StdEncoding.DecodeString(msg.ChunkData)
	if err != nil {
		// If we can't decode, approximate from string length
		decoded = make([]byte, len(msg.ChunkData)*3/4)
	}

	t.mu.Lock()
	defer t.mu.Unlock()

	t.transfers[msg.TransferID] += int64(len(decoded))

	if t.transfers[msg.TransferID] > t.maxSize {
		return ErrTransferLimitExceeded
	}

	return nil
}

// Cleanup removes transfer tracking for a given ID.
func (t *TransferTracker) Cleanup(transferID string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	delete(t.transfers, transferID)
}

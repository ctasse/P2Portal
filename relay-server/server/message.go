package server

// RelayServerMessage represents a message between client and relay server.
type RelayServerMessage struct {
	Type string `json:"type"`

	// Room/role fields
	Room string `json:"room,omitempty"`
	Role string `json:"role,omitempty"`

	// Error fields
	Error string `json:"error,omitempty"`

	// Transfer limit fields
	Limit      int64  `json:"limit,omitempty"`
	TransferID string `json:"transferId,omitempty"`

	// Passthrough chunk protocol fields (FILE_INFO / FILE_CHUNK / FILE_ACK / FILE_ERROR)
	FileName    string `json:"fileName,omitempty"`
	FileType    string `json:"fileType,omitempty"`
	FileSize    int64  `json:"fileSize,omitempty"`
	TotalChunks int    `json:"totalChunks,omitempty"`
	ChunkIndex  int    `json:"chunkIndex,omitempty"`
	ChunkData   string `json:"chunkData,omitempty"`
}

func NewRoomJoinedMsg(room, role string) RelayServerMessage {
	return RelayServerMessage{Type: "ROOM_JOINED", Room: room, Role: role}
}

func NewPeerJoinedMsg() RelayServerMessage {
	return RelayServerMessage{Type: "PEER_JOINED"}
}

func NewPeerLeftMsg() RelayServerMessage {
	return RelayServerMessage{Type: "PEER_LEFT"}
}

func NewErrorMsg(err string) RelayServerMessage {
	return RelayServerMessage{Type: "ERROR", Error: err}
}

func NewTransferLimitExceededMsg(limit int64, transferID string) RelayServerMessage {
	return RelayServerMessage{Type: "TRANSFER_LIMIT_EXCEEDED", Limit: limit, TransferID: transferID}
}

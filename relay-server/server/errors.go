package server

import "errors"

var (
	ErrRoleAlreadyTaken   = errors.New("role already taken")
	ErrInvalidRoom        = errors.New("invalid room code")
	ErrInvalidRole        = errors.New("invalid role")
	ErrTransferLimitExceeded = errors.New("transfer size limit exceeded")
)

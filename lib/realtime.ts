import { io, type Socket } from 'socket.io-client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'

export function createRealtimeSocket(): Socket {
  return io(API_BASE_URL, {
    withCredentials: true,
    transports: ['websocket'],
  })
}

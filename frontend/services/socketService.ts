import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '@/constants/config';

// Strip /api suffix to get the base server URL
const SOCKET_URL = API_URL.replace(/\/api$/, '');

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  // Disconnect stale socket if any
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 10000,
  });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Socket connection timed out')), 10000);

    socket!.once('connect', () => {
      clearTimeout(timer);
      resolve(socket!);
    });

    socket!.once('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

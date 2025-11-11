import { Client } from 'colyseus.js';

let client: Client | null = null;
let room: any = null;

export const getColyseusClient = () => {
  if (!client) {
    const serverUrl = process.env.NEXT_PUBLIC_COLYSEUS_SERVER_URL || 'ws://localhost:2567';
    try {
      client = new Client(serverUrl);
    } catch (error) {
      console.warn('Colyseus client initialization failed (server may not be running):', error);
      // Return null instead of throwing - connection is optional
      return null;
    }
  }
  return client;
};

export const connectToCave = async (caveId: string = 'default', playerName: string = 'Player') => {
  try {
    const client = getColyseusClient();
    if (!client) {
      console.warn('Colyseus client not available - multiplayer features disabled');
      return null;
    }
    room = await client.joinOrCreate('cave', {
      caveId,
      name: playerName,
      x: 0,
      y: 1.6,
      z: 0,
    });
    
    room.onStateChange((state: any) => {
      console.log('Room state changed', state);
    });

    room.onMessage('chat', (message: any) => {
      console.log('Chat message:', message);
    });

    return room;
  } catch (error) {
    // Silently fail - connection is optional
    console.warn('Failed to connect to cave (server may not be running):', error);
    return null;
  }
};

export const sendPlayerMove = (x: number, y: number, z: number, rotationY: number = 0) => {
  if (room) {
    room.send('move', { x, y, z, rotationY });
  }
};

export const sendChat = (message: string) => {
  if (room) {
    room.send('chat', { message });
  }
};

export const disconnect = () => {
  if (room) {
    room.leave();
    room = null;
  }
};




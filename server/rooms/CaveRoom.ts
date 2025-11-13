import { Room, Client } from 'colyseus';
import { Schema, MapSchema, type } from '@colyseus/schema';

// Player state schema
export class Player extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 1.6;
  @type('number') z: number = 0;
  @type('number') rotationY: number = 0;
  @type('string') caveId: string = '';
}

// Cave room state
export class CaveState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type('string') caveId: string = '';
  @type('string') ownerId: string = '';
}

export class CaveRoom extends Room<CaveState> {
  maxClients = 50;

  onCreate(options: any) {
    console.log('CaveRoom created!', options);
    
    this.setState(new CaveState());
    this.state.caveId = options.caveId || 'default';
    this.state.ownerId = options.ownerId || '';

    // Handle player movement
    this.onMessage('move', (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = data.x;
        player.y = data.y;
        player.z = data.z;
        player.rotationY = data.rotationY || 0;
      }
    });

    // Handle player chat/voice
    this.onMessage('chat', (client, data) => {
      this.broadcast('chat', {
        playerId: client.sessionId,
        message: data.message,
        timestamp: Date.now(),
      }, { except: client });
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, 'joined!');
    
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || `Player ${client.sessionId.substring(0, 6)}`;
    player.x = options.x || 0;
    player.y = options.y || 1.6;
    player.z = options.z || 0;
    player.caveId = this.state.caveId;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, 'left!');
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log('CaveRoom', this.roomId, 'disposing...');
  }
}





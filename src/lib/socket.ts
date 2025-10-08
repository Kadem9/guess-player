import { Server as NetServer } from 'http';
import { NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export const io = new ServerIO({
  path: '/api/socketio',
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL 
      : 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

export default function SocketHandler(req: any, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
  } else {
    res.socket.server.io = io;
  }
  res.end();
}

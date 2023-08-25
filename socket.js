const SocketIO = require('socket.io');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cookie = require('cookie-signature');
const cors = require('cors')

module.exports = (server, app, sessionMiddleware) => {
  const io = SocketIO(server, { path: '/socket.io' });
  io.use(cors());

  app.set('io', io);
  const room = io.of('/room');
  const chat = io.of('/chat');
  
  io.use((socket, next) => {    // 이 부분의 역할은 뭐지?
    cookieParser(process.env.COOKIE_SECRET)(socket.request, socket.request.res, next);
    sessionMiddleware(socket.request, {}, next);
  });

  room.on('connection', (socket) => {
    console.log('room 네임스페이스에 접속');
    
    // const req = socket.request;
    // // console.log(req.headers);

    // console.log("Req: ", req.session);


    socket.on('disconnect', () => {
      console.log('room 네임스페이스 접속 해제');
    });
  });

  chat.on('connection', (socket) => {
    console.log('chat 네임스페이스에 접속');
    const req = socket.request;
    // console.log(req.headers);

    console.log("Req: ", req.session);

    const { headers: { referer } } = req;

    const roomId = referer    // URL 로부터 방 id 추출
      .split('/')[referer.split('/').length - 1]
      .replace(/\?.+/, '');

    // roomId 추출
    console.log('***방 id는:', roomId, '입니다.***');

    socket.join(roomId);  // 특정 방(roomId)에 들어가는 메소드
    
    // socket.to(roomId).emit('join', {
    //   user: 'system',
    //   chat: `${req.session.color}님이 입장하셨습니다.`,
    // });



    // socket.on('disconnect', () => {
    //   console.log('chat 네임스페이스 접속 해제');
    //   socket.leave(roomId); // 방에서 나감.
      
    //   const currentRoom = socket.adapter.rooms[roomId];
    //   const userCount = currentRoom ? currentRoom.length : 0;

    //   if (userCount === 0) { // 유저가 0명이면 방 삭제
    //     const signedCookie = cookie.sign( req.signedCookies['connect.sid'], process.env.COOKIE_SECRET );
    //     const connectSID = `${signedCookie}`;

    //     axios.delete(`http://localhost:8001/anonimous/room/${roomId}`, {
    //       headers: {
    //         Cookie: `connect.sid=s%3A${connectSID}`
    //       }
    //     })
    //       .then(() => {
    //         console.log('방 제거 요청 성공');
    //       })
    //       .catch((error) => {
    //         console.error(error);
    //       });
    //   } else {
    //     socket.to(roomId).emit('exit', {
    //       user: 'system',
    //       chat: `${req.session.color}님이 퇴장하셨습니다.`,
    //     });
    //   }
    // });
  });
};
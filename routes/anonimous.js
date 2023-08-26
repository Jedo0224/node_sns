const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const upload = require("../middlewares/multer.middleware");
// var requestIp = require('request-ip');
const Room = require("../schemas/room");
const Chat = require("../schemas/chat");
const logger = require("../logger");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    logger.info(`익명 채팅하기 페이지 요청 - ${res.locals.ip}`);
    const rooms = await Room.find({});
    console.log("req.session ID: ", req.session);

    res.render("chat-main", { rooms, title: "익명 채팅방" });
    logger.info(`익명 채팅하기 페이지 랜더링 완료 - ${res.locals.ip}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 채팅방을 생성하기 위해 설정을 입력받는 부분으로.
router.get("/room", (req, res) => {
  logger.info(`채팅방 생성 페이지 요청 시작 - ${res.locals.ip}`);
  res.render("chat-room", { title: "익명 채팅방 생성" });
  logger.info(`채팅방 생성 페이지 랜더링 완료 - ${res.locals.ip}`);
});

// 원하는 채팅방 설정 입력한 것을 가지고 새로운 채팅방을 생성하는 부분.
router.post("/room", async (req, res, next) => {
  try {
    logger.info(`채팅방 생성 요청 시작 - ${res.locals.ip}`);
    const newRoom = await Room.create({
      title: req.body.title,
      max: req.body.max,
      owner: req.session.color,
      password: req.body.password,
    });

    // app.set('io', io)로 웹소켓 모듈을 등록해두었기 때문에, 이 코드로 라우터에서 웹 소켓을 이용할 수 있음
    const io = req.app.get("io");

    io.of("/room").emit("newRoom", newRoom);
    logger.info(`채팅방 생성 완료 - ${res.locals.ip}`);
    res.redirect(
      `/anonimous/room/${newRoom._id}?password=${req.body.password}`
    );
  } catch (error) {
    logger.info(`채팅방 생성 실패 - ${res.locals.ip}`);
    next(error);
  }
});

// req.params.id 에 해당하는 방에 접속하는 라우터
router.get("/room/:id", async (req, res, next) => {
  try {
    logger.info(`채팅방 접속 요청 시작 - ${res.locals.ip}`);
    // 방 접속 시 기존 채팅 내역을 불러옴.
    const room = await Room.findOne({ _id: req.params.id });
    const io = req.app.get("io");

    if (!room) {
      return res.redirect("/anonimous/?error=존재하지 않는 방입니다.");
    }
    if (room.password && room.password !== req.query.password) {
      return res.redirect("/anonimous/?error=비밀번호가 틀렸습니다.");
    }

    const { rooms } = io.of("/chat").adapter; // 이 adapter 는 뭐지??
    if (
      rooms &&
      rooms[req.params.id] &&
      room.max <= rooms[req.params.id].length
    ) {
      return res.redirect("/anonimous/?error=허용 인원이 초과하였습니다.");
    }

    // 방에 접속할 때는 DB로부터 채팅 내역을 가져옴.
    const chats = await Chat.find({ room: room._id }).sort("createdAt");
    logger.info(`채팅방 접속 요청 완료 - ${res.locals.ip}`);
    return res.render("chat-chat", {
      room,
      title: room.title,
      chats, // 채팅 내역
      user: req.session.color, // user를 익명처리 했기 때문에, req.session.id 가 아니라 req.session.color 로 했음.
    });
  } catch (error) {
    logger.info(`채팅방 접속 요청 실패 - ${res.locals.ip}`);
    return next(error);
  }
});

// 채팅방 삭제
router.delete("/room/:id", async (req, res, next) => {
  try {
    await Room.remove({ _id: req.params.id });
    await Chat.remove({ room: req.params.id });
    res.send("ok");
    setTimeout(() => {
      req.app.get("io").of("/room").emit("removeRoom", req.params.id);
    }, 2000);
  } catch (error) {
    next(error);
  }
});

// 보낸 채팅을 데이터베이스에 저장 후 io.of('/chat').to(방 아이디).emit()으로 같은 방에 들어 있는 소켓들에게 메세지 데이터 전송하는 라우터.
// 채팅을 보낼 때마다 채팅 내용이 이 라우터로 전송되고, 라우터에서 다시 웹소켓으로 메세지를 보낸다.
router.post("/room/:id/chat", async (req, res, next) => {
  try {
    logger.info(
      `텍스트 채팅 전송 요청 시작 - ${res.locals.ip} ${req.body.chat}`
    );
    const chat = await Chat.create({
      // 채팅 생성
      room: req.params.id,
      user: req.session.color,
      chat: req.body.chat,
    });

    // req.app.get('io')을 통해 라우터에서 웹소켓으로 메세지를 보낼 수 있음.

    // io.of('/chat').to(방 아이디).emit() 으로 같은 방에 들어있는 소켓들에게 메세지 전송
    req.app.get("io").of("/chat").to(req.params.id).emit("chat", chat); // 보낸 채팅 메세지 내용을 웹소켓으로 전송.
    logger.info(`텍스트 채팅 전송 요청 완료 - ${res.locals.ip}`);
    res.send("ok");
  } catch {
    logger.info(`텍스트 채팅 전송 요청 실패 - ${res.locals.ip}`);
    next(error);
  }
});

// try {
//   fs.readdirSync('uploads');
// } catch (err) {
//   console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
//   fs.mkdirSync('uploads');
// }

// const upload = multer({
//   storage: multer.diskStorage({
//     destination(req, file, done) {
//       done(null, 'uploads/');
//     },
//     filename(req, file, done) {
//       const ext = path.extname(file.originalname);
//       done(null, path.basename(file.originalname, ext) + Date.now() + ext);
//     },
//   }),
//   limits: { fileSize: 5 * 1024 * 1024 },
// });

router.post("/room/:id/gif", upload.single("gif"), async (req, res, next) => {
  try {
    logger.info(`이미지 채팅 전송 요청 시작 - ${res.locals.ip}`);
    const chat = await Chat.create({
      room: req.params.id,
      user: req.session.color,
      gif: req.file.location,
    });
    req.app.get("io").of("/chat").to(req.params.id).emit("chat", chat);
    logger.info(`이미지 채팅 전송 요청 완료 - ${res.locals.ip}`);
    res.send("ok");
  } catch (error) {
    logger.info(`이미지 채팅 전송 요청 실패 - ${res.locals.ip}`);
    next(error);
  }
});

module.exports = router;

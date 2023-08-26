const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = require('../middlewares/multer.middleware');
const logger = require('../logger');

const { User, Post, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

// try {
//   fs.readdirSync('uploads');
// } catch (error) {
//   console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
//   fs.mkdirSync('uploads');
// }

// const upload = multer({
//   storage: multer.diskStorage({
//     destination(req, file, cb) {
//       cb(null, 'uploads/');
//     },
//     filename(req, file, cb) {
//       const ext = path.extname(file.originalname);
//       cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
//     },
//   }),
//   limits: { fileSize: 5 * 1024 * 1024 },
// });


// 지금 이 라우터에서는 이미지 하나를 업로드 받고, 그 이미지의 저장 경로를 클라이언트로 응답한다.
// router.post('/img', isLoggedIn, upload.single('img'), (req, res) => { // 'img' 는 html 에서 <input name="img" 에 해당함
  router.post('/img', upload.single('img'), (req, res) => { // 'img' 는 html 에서 <input name="img" 에 해당함
  try {
    logger.info(`사진 전송 - ${res.locals.ip}`);
    console.log(req.file.location);
    res.json({ url: req.file.location });  
  } catch (error) {
    console.error(error);
  }
  
});
// 이미 이 라우터에서 이미지는 저장된다.

const upload2 = multer();

// 게시글 업로드를 처리하는 라우터 이전 라우터에서 이미지를 업로드했다면 이미지 주소도 req.body.url 로 전송된다.
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    //  logger.info(`로그인 완료 - ${res.locals.ip} ${user.dataValues.age} ${user.dataValues.gender} ${user.dataValues.region}`);
    logger.info(`게시글 업로드 시작 - ${res.locals.ip}`);

    const user = await User.findOne({
      where:{
        id: req.user.id
      }
    });
    
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,  // 이전 라우터에서 업로드한 이미지 주소
      UserId: req.user.id,
    });

    const hashtags = req.body.content.match(/#[^\s#]*/g);   // 게시글에서 해시테그를 정규표현식(/#[^\s#]*/g)으로 추출하는 부분
    if(!hashtags){
      logger.info(`게시글 업로드 완료 - ${res.locals.ip} ${user.dataValues.age} ${user.dataValues.gender} ${user.dataValues.region}`);
    }

    else if (hashtags) {
      const result = await Promise.all(
        hashtags.map(tag => {
          return Hashtag.findOrCreate({
            where: { title: tag.slice(1).toLowerCase() },
          })
        }),
      );
      await post.addHashtags(result.map(r => r[0]));
      logger.info(`게시글 업로드 완료 - ${res.locals.ip} - ${res.locals.ip} ${user.dataValues.age} ${user.dataValues.gender} ${user.dataValues.region} ${hashtags}`);
    }
    
    res.redirect('/');
  } catch (error) {
    logger.info(`게시글 업로드 실패 - ${res.locals.ip}`);
    next(error);
  }
});

module.exports = router;
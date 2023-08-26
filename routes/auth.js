const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');
const logger = require('../logger');
const router = express.Router();

// 회원가입
router.post('/join', isNotLoggedIn, async (req, res, next) => {
  logger.info(`회원가입 시작 - ${res.locals.ip}`);
  const { email, nick, password } = req.body;
  try {
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      return res.redirect('/join?error=exist');
    }
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      nick,
      password: hash,
    });
    logger.info(`회원가입 완료 - ${res.locals.ip}`);
    return res.redirect('/');
  } catch (error) {
    logger.info(`회원가입 실패 - ${res.locals.ip}`);
    return next(error);
  }
});

// 로그인
router.post('/login', isNotLoggedIn, (req, res, next) => {
  try {
    logger.info(`로그인 시작 - ${res.locals.ip}`);
    passport.authenticate('local', (authError, user, info) => {
      if (authError) {
        console.error(authError);
        return next(authError);
      }
      if (!user) {
        return res.redirect(`/?loginError=${info.message}`);
      }
      console.log("유저: ", user);
      console.log("유저 닉네임: ", user.dataValues.nick);
      return req.login(user, (loginError) => {
        if (loginError) {
          console.error(loginError);
          return next(loginError);
        }
        logger.info(`로그인 완료 - ${res.locals.ip}`);
        return res.redirect('/');
      });
    })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
  } catch (error) {
    logger.info(`로그인 실패 - ${res.locals.ip}`);
  }
});

router.get('/logout', isLoggedIn, (req, res) => {
  logger.info(`로그아웃 요청 시작 - ${res.locals.ip}`);
  req.logout();
  req.session.destroy();
  logger.info(`로그아웃 요청 완료 - ${res.locals.ip}`);
  res.redirect('/');
});

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/',
}), (req, res) => {
  res.redirect('/');
});

module.exports = router;
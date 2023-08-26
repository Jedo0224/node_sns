const express = require("express");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const { Post, User, Hashtag } = require("../models");
const logger = require("../logger");
const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user
    ? req.user.Followings.map((f) => f.id)
    : [];
  next();
});

router.get("/profile", isLoggedIn, (req, res) => {
  logger.info(`내 프로필 페이지 조회 요청 시작 - ${res.locals.ip}`);
  res.render("profile", { title: "내 정보 - Elastic-SNS" });
  logger.info(`내 프로필 페이지 랜더링 완료 - ${res.locals.ip}`);
});

router.get("/join", isNotLoggedIn, (req, res) => {
  logger.info(`내 회원가입 페이지 조회 요청 시작 - ${res.locals.ip}`);
  res.render("join", { title: "회원가입 - Elastic-SNS" });
  logger.info(`내 회원가입 페이지 랜더링 조회 완료 - ${res.locals.ip}`);
});

router.get("/", async (req, res, next) => {
  try {
    logger.info(`메인 페이지 접속 요청 시작 - ${res.locals.ip}`);
    const posts = await Post.findAll({
      include: {
        model: User,
        attributes: ["id", "nick"],
      },
      order: [["createdAt", "DESC"]],
    });
    logger.info(`메인 페이지 접속 요청 완료 - ${res.locals.ip}`);
    res.render("main", {
      title: "Elastic-SNS",
      twits: posts,
    });
  } catch (err) {
    logger.info(`메인 페이지 접속 요청 실패 - ${res.locals.ip}`);
    next(err);
  }
});

router.get("/hashtag", async (req, res, next) => {
  
  logger.info(`해시 태그 검색 요청 시작 - ${res.locals.ip}`);
  const query = req.query.hashtag;
  if (!query) {
    return res.redirect("/");
  }
  try {
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    let posts = [];
    if (hashtag) {
      posts = await hashtag.getPosts({ include: [{ model: User }] });
    }

    // 나이 성별 지역
    const user = await User.findOne({
      where:{
        id: req.user.id
      }
    });

    logger.info(`해시 태그 검색 요청 완료 - ${res.locals.ip} #${query} ${user.dataValues.age} ${user.dataValues.gender} ${user.dataValues.region}`);
    return res.render("main", {
      title: `${query} | Elastic-SNS`,
      twits: posts,
    });
  } catch (error) {
    logger.info(`해시 태그 검색 요청 실패 - ${res.locals.ip}`);
    return next(error);
  }
});

module.exports = router;

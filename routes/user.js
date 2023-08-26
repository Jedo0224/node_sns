const express = require('express');
const logger = require('../logger');
const { isLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
  try {
    logger.info(`팔로우 요청 시작 - ${res.locals.ip}`);
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
      await user.addFollowing(parseInt(req.params.id, 10));
      logger.info(`팔로우 요청 완료 - ${res.locals.ip}`);
      res.send('success');
    } else {
      logger.info(`팔로우 요청 실패 - ${res.locals.ip}`);
      res.status(404).send('no user');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
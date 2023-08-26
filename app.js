const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');
const ColorHash = require('color-hash').default;
const cors = require('cors')
// Add this to the very top of the first file loaded in your app
var apm = require('elastic-apm-node').start({
  serviceName: 'my-service-name',
  secretToken: 'gKJZdNMdFf4yLIf408',
  serverUrl: 'https://129403cb556b4d73bed31ce164b3929b.apm.ap-northeast-2.aws.elastic-cloud.com:443',
  environment: 'my-environment'
});

dotenv.config();
const webSocket = require('./socket');
const connect = require('./schemas');

const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const anonimousRouter = require('./routes/anonimous');

const { sequelize } = require('./models');
const passportConfig = require('./passport');
const logger = require('./logger');

const app = express();

let corsOptions = {
  origin: '*',      // 출처 허용 옵션
  credential: true, // 사용자 인증이 필요한 리소스(쿠키 등) 접근
}

app.use(cors());

passportConfig(); // 패스포트 설정


connect();  // mongoDB connect


app.set('port', process.env.PORT || 8001);

app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
});

sequelize.sync({ force: false })
  .then(() => {
    console.log('== MySQL 연결 성공 ==');
  })
  .catch((err) => {
    console.error(err);
  });

// app.use(morgan('dev'));
if (process.env.NODE_ENV ==='production'){  // 배포용으로 설정
  app.use(morgan('combined'));
  app.use(helmet());
  app.use(hpp({contentSecurityPolicy: false}));
}else{
  app.use(morgan('dev'));
}
const sessionMiddleware = session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
});


app.use(express.static(path.join(__dirname, 'public')));
// app.use('/img', express.static(path.join(__dirname, 'uploads')));
// app.use('/gif', express.static(path.join(__dirname, 'uploads')));   // ? 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));



app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

makeNickname = () => {
  let adj = ['달달한', '행복한', '즐거운', '아름다운', '멋있는', '귀여운', '흐뭇한', '느긋한', '재빠른', '똑똑한', '따뜻한'];
  let noun = ['코코아', '고라니', '곰순이', '타잔', '곰돌이', '콩순이', '곰들이', '토끼', '기린', '호랑이', '돌고래'];

  return `${adj[Math.round(Math.round(Math.random() * 10))]} ${noun[Math.round(Math.round(Math.random() * 10))]} ${Math.round(Math.round(Math.random() * 100))}`;
}

app.use((req, res, next) => {
  if (!req.session.color) {
    // const colorHash = new ColorHash();
    // req.session.color = colorHash.hex(req.sessionID);
    req.session.color = makeNickname();
    // res.locals.nickname = "test";
  }
  next();
});


// app.use(session({
//   resave: false,
//   saveUninitialized: false,
//   secret: process.env.COOKIE_SECRET,
//   cookie: {
//     httpOnly: true,
//     secure: false,
//   },
// }));


if(process.env.NODE_ENV ==='production'){
  sessionOption.proxy =true;
}






app.use('/', pageRouter);
app.use('/anonimous', anonimousRouter);

app.use('/auth', authRouter);
app.use('/post', postRouter);
app.use('/user', userRouter);




app.use((req, res, next) => {
  const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  // logger.info('hello');
  logger.error(error.message);
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

const server = app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기중');
});

webSocket(server, app, sessionMiddleware);
// webSocket(server, app, passport.session());
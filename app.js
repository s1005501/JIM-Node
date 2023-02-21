require('dotenv').config({
  path: './dev.env'
});
const jwt = require('jsonwebtoken');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const db = require("./modules/db_connect");
const cors = require("cors");
const corsOption = {
  credential: true,
  origin: (origin, cb) => {
    cb(null, true);
  },
};
app.use(cors(corsOption));
const upload = require("./modules/upload");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const sessionStore = new MySQLStore({}, db);
const bcrypt = require('bcrypt')
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(
  session({
    secret: "狡兔三窟",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1200000,
    },
  })
);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/users', usersRouter);



app.use('/linepay',require('./modules/line'))

app.use('/getmap',(async(req,res)=>{
  gamesql = 'SELECT `gamesName`,`gamesImages`,`gamesPrice`,`storeSid` FROM `games` WHERE 1'
  const [game]= await db.query(gamesql)
  storesql ='SELECT `storeSid`,`storeName`,`storeMobile`,`storeCity`,`storeAddress`,`storelat`,`storelon`,`storeTime`,`storeRest`,`storeLogo` FROM `store` WHERE 1'
  const [store]= await db.query(storesql)

const merge = store.map((v,i)=>{
  const filters = game.filter((e,i)=>{
  if(v.storeSid === e.storeSid){
    return {...e}
  }
})
  return{...v,game:filters}
})
  res.json(merge)
}))


app.post('/post',upload.array('photos', 12),(req,res)=>{
  res.json(req.files)
})
app.post("/login", upload.none(), async (req, res) => {
  const output = {
    success: false,
    error: "帳號或密碼錯誤 !!!",
    code: 0,
    postData: req.body,
  };

  const sql = "SELECT * FROM admins WHERE account=?";
  const [rows] = await db.query(sql, [req.body.account]);
  if (!rows.length) {
    output.code = 401;
    return res.json(output);
  }
  if (!(await bcrypt.compare(req.body.password, rows[0].password_hash))) {
    output.code = 402;
  } else {
    output.token = jwt.sign({
      sid: rows[0].sid,
      account: rows[0].account,
    }, process.env.JWT_SECRET_KEY);
    output.success = true;
    output.code = 200;
    output.error = "";
    output.accountId=rows[0].sid
    output.account = rows[0].account,


    req.session.admin = {
      sid: rows[0].sid,
      account: rows[0].account,
    };
  }
  res.json(output);
});
app.get("/logout", (req, res) => {
  delete req.session.admin;
  res.json(req.session);
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

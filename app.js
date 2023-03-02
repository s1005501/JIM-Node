require("dotenv").config({
  path: "./dev.env",
});
const jwt = require("jsonwebtoken");
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

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
const bcrypt = require("bcrypt");
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

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
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

app.get("/index", async (req, res) => {
  const { litim } = req.query;

  gamesql = `SELECT * FROM games 
  JOIN gamesFeature01 on gamesFeature01 = gamesFeature01.gamesFeatureSid 
  JOIN gamesFeature02 on  gamesFeature02 = gamesFeature02.gamesFeatureSid 
  JOIN gamestime on gamesTime = gamestime.gamesTimeSid
  JOIN store on games.storeSid= store.storeSid
  WHERE 1 
  ORDER BY gamesSid ASC
  limit ${litim}`;
  const [game] = await db.query(gamesql);
  res.json(game);
});

app.get("/games", async (req, res) => {
  // const {litim} =req.query
  const {
    searchKey = "",
    city = "",
    minLimit = 100,
    difficulty = "",
    type = "",
    cash = 83727,
    time = "",
    other = "",
    order = "gamesPrice",
    searchSwitch = "ASC",
  } = req.query;

  gamesql = `SELECT * FROM games
  JOIN gamesdifficulty on gamesDifficulty = gamesdifficulty.gamesDifficultySid
  JOIN gamesfeature01 on gamesFeature01 = gamesFeature01.gamesFeatureSid
  JOIN gamesfeature02 on gamesFeature02 = gamesFeature02.gamesFeatureSid
  JOIN gamestime on gamesTime = gamestime.gamesTimeSid
  JOIN gamessort on gamesSort = gamessort.gamesSortSid
  JOIN store on games.storeSid= store.storeSid
  WHERE gamesName LIKE '%${searchKey}%' AND store.storeCity LIKE '%${city}%'
  AND gamesPeopleMin <= ${minLimit} AND gamesdifficulty.difficulty LIKE '%${difficulty}%'
  AND gamesPrice <= ${cash} AND gamesfeature01.feature01 LIKE '%${type}%'
  AND gamestime.Time LIKE '%${time}%'  AND gamessort.Sort LIKE '%${other}%' 
  ORDER BY ${order} ${searchSwitch}`;
  const [game] = await db.query(gamesql);
  res.json(game);
});

app.get("/gameSingle", async (req, res) => {
  const {sid} =req.query
  gameSingleSql = `SELECT * FROM games
  JOIN gamesdifficulty on gamesDifficulty = gamesdifficulty.gamesDifficultySid
  JOIN gamesfeature01 on gamesFeature01 = gamesFeature01.gamesFeatureSid
  JOIN gamesfeature02 on gamesFeature02 = gamesFeature02.gamesFeatureSid
  JOIN gamestime on gamesTime = gamestime.gamesTimeSid
  JOIN gamessort on gamesSort = gamessort.gamesSortSid
  JOIN store on games.storeSid= store.storeSid
  WHERE gamesSid = ${sid}
  `
  const [gameSingle] = await db.query(gameSingleSql)
  res.json(gameSingle);
});

app.get("/filterDate", async (req, res) => {
  const {sid,date} =req.query
  console.log(sid,date,6555)
  filterDateSql = `SELECT * FROM order_summary WHERE 
  gameSid = ${sid} AND orderDate LIKE '${date}'
  `
  const [filterDate] = await db.query(filterDateSql)
  res.json(filterDate);
});

app.get('/orders',async(req,res)=>{
  const {sid} = req.query
  orderSql = `SELECT * FROM games
  JOIN gamesdifficulty on gamesDifficulty = gamesdifficulty.gamesDifficultySid
  JOIN gamesfeature01 on gamesFeature01 = gamesFeature01.gamesFeatureSid
  JOIN gamesfeature02 on gamesFeature02 = gamesFeature02.gamesFeatureSid
  JOIN gamestime on gamesTime = gamestime.gamesTimeSid
  JOIN gamessort on gamesSort = gamessort.gamesSortSid
  JOIN store on games.storeSid= store.storeSid
  WHERE gamesSid = ${sid}`
  const [orderData]=await db.query(orderSql)
  res.json(orderData)
})

app.get('/discount',async(req,res)=>{
  discountSql = `SELECT * FROM discount_detail WHERE 1`
  const [discount] =await db.query(discountSql)
   res.json(discount)
})

app.get('/ordercomplete',async(req,res)=>{
  const {orderSid}=req.query
  ordercompleteSql = `SELECT * FROM order_summary WHERE orderSid = ${orderSid}`
  const [ordercomplete]=await db.query(ordercompleteSql)
  res.json(ordercomplete)
})

app.use("/linepay", require("./modules/line"));

app.use("/getmap", async (req, res) => {
  gamesql =
    `SELECT gamesSid,gamesName,gamesImages,gamesPrice,feature01,feature02,storeSid FROM games 
    JOIN gamesfeature01 on gamesFeature01 = gamesFeature01.gamesFeatureSid
    JOIN gamesfeature02 on gamesFeature02 = gamesFeature02.gamesFeatureSid
     WHERE 1`;
  const [game] = await db.query(gamesql);
  storesql =
    "SELECT `storeSid`,`storeName`,`storeMobile`,`storeCity`,`storeAddress`,`storelat`,`storelon`,`storeTime`,`storeRest`,`storeLogo` FROM `store` WHERE 1";
  const [store] = await db.query(storesql);

  const merge = store.map((v, i) => {
    const filters = game.filter((e, i) => {
      if (v.storeSid === e.storeSid) {
        return { ...e };
      }
    });
    return { ...v, game: filters };
  });
  res.json(merge);
});

app.post("/post", upload.array("photos", 12), (req, res) => {
  res.json(req.files);
});
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
    output.token = jwt.sign(
      {
        sid: rows[0].sid,
        account: rows[0].account,
      },
      process.env.JWT_SECRET_KEY
    );
    output.success = true;
    output.code = 200;
    output.error = "";
    output.accountId = rows[0].sid;
    (output.account = rows[0].account),
      (req.session.admin = {
        sid: rows[0].sid,
        account: rows[0].account,
      });
  }
  res.json(output);
});
app.get("/logout", (req, res) => {
  delete req.session.admin;
  res.json(req.session);
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;

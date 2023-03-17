require("dotenv").config({
  path: "./dev.env",
});
const jwt = require("jsonwebtoken");
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const fs = require("fs");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();

const db = require("./modules/db_connect");
const cors = require("cors");
const corsOption = {
  credentials: true,
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
app.use((req,res,next)=>{
  res.locals.bearer = {}; // 預設值
  let auth=req.get("Authorization")
  if(auth && auth.indexOf("Bearer ")===0){
      
      auth=auth.slice(7)
        try{
      res.locals.bearer=jwt.verify(auth,process.env.JWT_SECRET)
      }catch(ex){}
  }
     console.log("res.locals.bearer:", res.locals.bearer);
  next()
})
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

// app.get('/a',async(req,res)=>{
//   const totalSql = `
//   SELECT * , SUM(liked) AS likedtotal, SUM(unliked) AS unlikedtotal 
//   FROM comment 
//   JOIN comment_liked ON comment_liked.comment_id = comment.commentuser_id 
//   WHERE games_id = 1 
//   GROUP BY commentuser_id 
//   ORDER BY comment.create_at ASC
//   `
//   const [total]= await db.query(totalSql)
//   const memberSql = `
//   SELECT * FROM comment_liked 
//   JOIN comment ON comment.commentuser_id = comment_liked.comment_id 
//   WHERE user_id = 2 
//   GROUP BY comment_id
//   `
//   const [member] = await db.query(memberSql)
//   const merge = total.map((v,i)=>{
//     const filter = member.filter((k,j)=>{
//       if (k.comment_id  === v.comment_id) {
//         return { ...k };
//       }
//     })
//     return { ...v, filter: filter };
//   })
//   console.log(total)
//   res.json(merge)
// })
// app.use('/index',require('./modules/index'))
// app.use('/games',require('./modules/games'))
app.use('/order',require('./routes/order'))
app.use('/member',require('./routes/member'))

app.use('/signin',require('./modules/signin'))
app.use('/store',require('./modules/store'))
app.use('/map',require('./modules/map'))

app.use("/linepay", require("./modules/line"));
app.post("/post", upload.array("photos", 12), (req, res) => {
  console.log(1545)
  res.json(req.files);
});



const getdispalygames =async()=>{
  const sql=`SELECT * FROM games WHERE gamesSid`
  const [data] = await db.query(sql);
  console.log(data)
  return data;
}

const getsearchkey =async(search)=>{
  const sql=`SELECT * FROM games WHERE gamesName Like'%${search}%'`
  const [data] = await db.query(sql);
  return data;
}

  const getnews =async()=>{
  const sql=`SELECT member.memNickName,games.gamesName,games.gamesSid,comment.* FROM comment
JOIN member ON member.membersid=comment.commentuser_id
JOIN games ON games.gamesSid=comment.games_id
ORDER BY create_at DESC`
  const [data] = await db.query(sql);
  return data;
}

const getgamedetail=async(queryname)=>{
  const sql=`SELECT games.*,gamestime.Time,store.storeAddress FROM games 
  JOIN gamestime ON gamestime.gamesTimeSid=games.gamesTime
  JOIN store ON store.storeSid=games.storeSid
   WHERE gamesSid = '${queryname}' `
   const [data] = await db.query(sql);
  return data;
}

const averagescore=async(queryname)=>{
  const sql=`SELECT AVG(comment.rate) AS score,comment.*,games.gamesName,games.gamesSid FROM comment
  JOIN games ON games.gamesSid=comment.games_id WHERE gamesSid = ${queryname}`
   const [data] = await db.query(sql);
  return data;
}

app.get('/tryc',(req,res)=>{
  
  res.json(123)
})
const comment = async (usersid, gamesid) => {
  const sql = `SELECT comment.*,comment_liked.*,member.memHeadshot,member.memNickName FROM comment JOIN comment_liked ON comment_liked.comment_id=comment.sid JOIN member ON comment.commentuser_id=member.membersid WHERE games_id=${gamesid} GROUP BY comment_liked.comment_id ORDER BY comment.create_at DESC`;
  const [gamedata] = await db.query(sql);
  const sql2 = `SELECT * FROM comment JOIN comment_liked ON comment_liked.comment_id=comment.sid WHERE user_id=${usersid}`;
  const [userdata] = await db.query(sql2);
  const gamebelowcomment = gamedata.map((v, i) => {
    const filter = userdata.filter((k, j) => {
      if (k.comment_id === v.comment_id) {
        return { ...k };
      }
    });
    console.log(filter);
    return { ...v, filter: filter };
  });
  return gamebelowcomment;
};

// const getData = async () => {
//   const sql = `SELECT member.memNickName,games.gamesName,games.gamesLogo,gamestime.Time,games.gamesPeopleMin,games.gamesPeopleMax,games.gamesContent,store.storeAddress,comment.sid,comment.rate,comment.comment,comment.pics,comment.create_at FROM comment
//   JOIN member ON member.membersid=comment.commentuser_id
//   JOIN games ON games.gamesSid=comment.games_id
//   JOIN gamestime ON games.gamesTime=gamestime.gamesTimeSid
//   JOIN store ON games.storeSid=store.storeSid`
//   const [data] = await db.query(sql);
//   return data;
// };

// const getCData = async () => {
//     const sql = `SELECT member.memNickName,member.memAccount,games.gamesName,games.gamesLogo,gamestime.Time,games.gamesPeopleMin,games.gamesPeopleMax,games.gamesContent,store.storeAddress,comment.sid,comment.rate,comment.comment,comment.pics,comment.create_at FROM comment
//     JOIN member ON member.membersid=comment.commentuser_id
//     JOIN games ON games.gamesSid=comment.games_id
//     JOIN gamestime ON games.gamesTime=gamestime.gamesTimeSid
//     JOIN store ON games.storeSid=store.storeSid`
//     const [data] = await db.query(sql);
//     return data;
//   };

const getcommentData = async(queryname)=>{
  const sql=`SELECT member.memNickName,member.memHeadshot,games.gamesName,comment.* FROM comment
  JOIN member ON member.membersid=comment.commentuser_id
  JOIN games ON games.gamesSid=comment.games_id WHERE games_id=${queryname}`
  const [commentdata]=await db.query(sql)

 

  return commentdata;

}

const getreplyData = async()=>{
  const sql=`SELECT member.memNickName,comment_replied.*,comment.*  FROM comment_replied
  JOIN member ON member.membersid=comment_replied.replyuser_id
  JOIN comment ON comment_replied.comment_id=comment.sid`
 
  const [replydata]=await db.query(sql)
  return replydata;
}

const getrandomgames=async()=>{
const randomnumber = Math.floor(Math.random()*10)
const sql=`SELECT games.* FROM games WHERE gamesSId IN (${randomnumber},${randomnumber}+10,${randomnumber}+60,${randomnumber}+20,${randomnumber}+30)`

const [replydata]=await db.query(sql)
console.log(replydata)
return replydata;
}

const gettotalliked=async()=>{

const sql=`SELECT comment_liked.* FROM comment_liked
`

const [replydata]=await db.query(sql)
return replydata;
}
const insertcomment=async(submitdata)=>{
console.log(submitdata);

const sql=`INSERT INTO comment( commentuser_id, games_id, rate, comment, create_at) VALUES (${submitdata.usersid},${submitdata.gamessid},${submitdata.rate},'${submitdata.comment}',NOW())`

await db.query(sql)

}

const insertreplycomment = async (submitdata) => {
  const sql = `INSERT INTO comment_replied(replyuser_id, comment_id, replied_comment, replied_pics,create_at) VALUES (${submitdata.usersid},${submitdata.commentsid},'${submitdata.repliedcomment}','${submitdata.repliedpics}',NOW())`;

  await db.query(sql);
};

const getliked = async (usersid, mygamesName) => {
  const sql = `SELECT comment.games_id ,comment_liked.* FROM comment JOIN comment_liked ON comment.sid=comment_liked.comment_id WHERE user_id=${usersid} AND games_id=${mygamesName}`;

  const [replydata] = await db.query(sql);
  return replydata;
};
// app.get("/api", async (req, res) => {
//   res.json(await getData());
// });

// app.get("/api2", async (req, res) => {
//     res.json(await getCData());
//   });

// app.get('/try',async(req,res)=>{
// console.log(req.query)
// const {a}=req.query
// const trySql = `
// SELECT * FROM `comment` JOIN games ON games.gamesName LIKE '%等一個人%'  WHERE games_id = games.gamesSid LIMIT 0,1`
// `
// const [tryData]=await db.query(trySql)
//   res.json(tryData)
// })

app.get("/try/:search", async (req, res) => {
  console.log(req.params);
  const { search } = req.params;

  res.json(await getsearchkey(search));
});

app.get("/api_comment/:mygamesName", async (req, res) => {
  const { mygamesName } = req.params;
  res.json(await getcommentData(mygamesName));
});

app.get("/api_reply", async (req, res) => {
  res.json(await getreplyData());
});

app.get("/api_random", async (req, res) => {
  res.json(await getrandomgames());
});

app.get("/api_displaygames", async (req, res) => {
  res.json(await getdispalygames());
});
app.get("/api_news", async (req, res) => {
  res.json(await getnews());
});

app.get("/api_liked/:usersid/:mygamesName", async (req, res) => {
  console.log(req.params);
  const { usersid, mygamesName } = req.params;
  res.json(await getliked(usersid, mygamesName));
});
app.get("/api_gamesdetail/:mygamesName", async (req, res) => {
  console.log(req.params);
  const { mygamesName } = req.params;
  res.json(await getgamedetail(mygamesName));
});

app.get("/api_averagescore/:mygamesName", async (req, res) => {
  console.log(req.params);
  const { mygamesName } = req.params;
  res.json(await averagescore(mygamesName));
});
app.get("/api_comment/:usersid/:mygamesName", async (req, res) => {
  const { usersid, mygamesName } = req.params;
  res.json(await comment(usersid, mygamesName));
});

app.post("/insertcomment", async (req, res) => {
  const data = req.body;
  console.log(data);
  res.json(await insertcomment(data));
});

app.post("/insertreplycomment", async (req, res) => {
  const data = req.body;
  console.log(data);
  res.json(await insertreplycomment(data));
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

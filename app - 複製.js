"use strict";
const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./modules/db_connection");
const bodyParser = require("body-parser");

const corsOptions = {
  credentials: true,
  origin: function (origin, cb) {
    console.log({ origin });
    cb(null, true);
  },
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

const getdispalygames = async () => {
  const sql = `SELECT * FROM games WHERE gamesSid`;
  const [data] = await db.query(sql);
  return data;
};

const getsearchkey = async (search) => {
  const sql = `SELECT * FROM games WHERE gamesName Like'%${search}%'`;
  const [data] = await db.query(sql);
  return data;
};

const getnews = async () => {
  const sql = `SELECT member.memNickName,games.gamesName,games.gamesSid,comment.* FROM comment
  JOIN member ON member.membersid=comment.commentuser_id
  JOIN games ON games.gamesSid=comment.games_id
 ORDER BY create_at DESC`;
  const [data] = await db.query(sql);
  return data;
};

const getgamedetail = async (queryname) => {
  const sql = `SELECT games.*,gamestime.Time,store.storeAddress FROM games 
    JOIN gamestime ON gamestime.gamesTimeSid=games.gamesTime
    JOIN store ON store.storeSid=games.storeSid
     WHERE gamesSid = '${queryname}' `;
  const [data] = await db.query(sql);
  return data;
};

const averagescore = async (queryname) => {
  const sql = `SELECT AVG(comment.rate) AS score,comment.*,games.gamesName,games.gamesSid FROM comment
    JOIN games ON games.gamesSid=comment.games_id WHERE gamesSid = ${queryname}`;
  const [data] = await db.query(sql);
  return data;
};

const comment = async (usersid, gamesid) => {
  const sql = `SELECT comment.* ,member.memNickName,member.memHeadshot FROM comment 
  JOIN member ON member.membersid=comment.commentuser_id
  WHERE games_id=${gamesid}
  ORDER BY sid DESC   
 `;
  const [gamedata] = await db.query(sql);
  const sql2 = `SELECT comment_liked.* FROM comment_liked WHERE likegames_id=${gamesid} AND user_id=${usersid}`;
  const [userdata] = await db.query(sql2);
  const sql3= `SELECT comment_liked.*, SUM(liked) AS totallike FROM comment_liked GROUP BY comment_id `;

  const [replydata] = await db.query(sql3);
// const a=  gamedata.map((v, i) => {
//     const filter=userdata.filter((k,j)=>{
//           if(v.sid===k.comment_id){
//         return {...v,filter:filter}
//       }else{return {...v}}
        
      
//     })
   
// });
gamedata.forEach((gd)=>{
  for(let ud of userdata){
    // console.log(+gd.sid, +ud.comment_id, +gd.sid === +ud.comment_id)
    if(+gd.sid === +ud.comment_id){
      gd.filter = ud
    }
  }
  for(let rd of replydata){
    // console.log(+gd.sid, +ud.comment_id, +gd.sid === +ud.comment_id)
    if(+gd.sid === +rd.comment_id){
      gd.total = rd
    }
  }
})
return gamedata

}
const insertdelete=async(sid,user)=>{
  const sql = `DELETE FROM comment_liked WHERE comment_id=${sid} AND user_id=${user} `
  await db.query(sql);

}

const update=async(sid,user)=>{
  const sql = `UPDATE comment_liked SET liked=0 WHERE comment_id=${sid} AND user_id=${user}`
  await db.query(sql);

}
const update2=async(sid,user)=>{
  const sql = `UPDATE comment_liked SET liked=1 WHERE comment_id=${sid} AND user_id=${user}`
  await db.query(sql);

}
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

const getcommentData = async (queryname) => {
  const sql = `SELECT member.memNickName,member.memHeadshot,games.gamesName,comment.* FROM comment
    JOIN member ON member.membersid=comment.commentuser_id
    JOIN games ON games.gamesSid=comment.games_id  WHERE games_id=${queryname} ORDER BY comment.create_at DESC`;
  const [commentdata] = await db.query(sql);

  return commentdata;
};

const getreplyData = async () => {
  const sql = `SELECT member.memNickName,comment_replied.*,comment.*  FROM comment_replied
    JOIN member ON member.membersid=comment_replied.replyuser_id
    JOIN comment ON comment_replied.comment_id=comment.sid`;

  const [replydata] = await db.query(sql);
  return replydata;
};

const getrandomgames = async () => {
  const randomnumber = Math.floor(Math.random() * 10);
  const sql = `SELECT games.* FROM games WHERE gamesSId IN (${randomnumber},${randomnumber}+10,${randomnumber}+20,${randomnumber}+30,${randomnumber}+40,${randomnumber}+60)`;

  const [replydata] = await db.query(sql);
  return replydata;
};

const gettotalliked = async () => {
  const sql = `SELECT comment_liked.* FROM comment_liked
 `;

  const [replydata] = await db.query(sql);
  return replydata;
};
const insertcomment = async (submitdata) => {
  console.log(submitdata);

  const sql = `INSERT INTO comment( commentuser_id, games_id, rate, comment, pics, create_at) VALUES (${submitdata.usersid},${submitdata.gamessid},${submitdata.rate},'${submitdata.comment}','${submitdata.pics}',NOW())`;

  await db.query(sql);
};
const insertreplycomment = async (submitdata) => {
  const sql = `INSERT INTO comment_replied(replyuser_id, comment_id, replied_comment, replied_pics,create_at) VALUES (${submitdata.usersid},${submitdata.commentsid},'${submitdata.repliedcomment}','${submitdata.repliedpics}',NOW())`;

  await db.query(sql);
};

const insertliked = async (submitdata) => {
  const sql = `INSERT INTO comment_liked( user_id, comment_id, likegames_id, liked, create_at) VALUES (${submitdata.usersid},${submitdata.commentsid},${submitdata.likedgamesid},'${submitdata.liked}',NOW())`;

  await db.query(sql);
};

const getliked = async (usersid, mygamesName) => {
  const sql = `SELECT comment.games_id ,comment_liked.* FROM comment JOIN comment_liked ON comment.sid=comment_liked.comment_id WHERE user_id=${usersid} AND games_id=${mygamesName}`;

  const [replydata] = await db.query(sql);
  return replydata;
};
// const totalliked=async (params) => {
//   const sql = `SELECT comment_liked.*, SUM(liked) AS totallike FROM comment_liked GROUP BY comment_id`;

//   const [replydata] = await db.query(sql);
//   const sql2=`SELECT * FROM comment WHERE games_id=1`
//   const [secdata]=await db.query(sql2);
  
//   secdata.forEach((gd)=>{
//     for(let ud of replydata){
//       // console.log(+gd.sid, +ud.comment_id, +gd.sid === +ud.comment_id)
//       if(+gd.sid === +ud.comment_id){
//         gd.total = ud
//       }
//     }
//   })
//   return secdata
// };

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
app.get("/totalliked",async (req, res) => {
 
  res.json(await totalliked());
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

app.post("/insertliked", async (req, res) => {
  const data = req.body;
  console.log(data);
  res.json(await insertliked(data));
});
app.delete("/insertdelete/:sid/:user", async (req, res) => {
 const {sid,user}=req.params
 console.log(sid)
  res.json(await insertdelete(sid,user));})

  app.put("/update/:sid/:user", async (req, res) => {
    const {sid,user}=req.params
    console.log(sid)
     res.json(await update(sid,user));})

     app.put("/update2/:sid/:user", async (req, res) => {
      const {sid,user}=req.params
      console.log(sid)
       res.json(await update2(sid,user));})

app.get("/adult", (req, res) => {
  res.status(404).end();
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, (error) => {
  if (error) {
    console.log("哇喔，錯了");
  } else {
    console.log("服務器啟動：http://localhost:" + PORT);
  }
});

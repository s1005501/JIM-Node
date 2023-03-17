const express = require("express");
const days = require("dayjs");
const db = require("../modules/db_connect");
const jwt = require("jsonwebtoken");

const router = express.Router();

const output = {
  success: false,
  error: "",
};
// router.use((req, res, next) => {
//     if(!(res.locals.bearer.sid && res.locals.bearer.account)){
//         // TODO 前端接收到後判斷success與否用navigate跳轉
//         return res.json(output);
//     }
// next()
// })



// games 資料讀取 :遊戲介紹用
// 使用在OrderReserve、O_Reserve_GameInfo_、addSub

router.get("/gamesinfo/:sid", async (req, res) => {
  const output = {
    row: [],
    
  };
  const gamessql =
    "SELECT games.*,gamestime.*, store.storeAddress FROM games JOIN gamestime ON games.gamesTime=gamestime.gamesTimeSid JOIN store ON games.storeSid=store.storeSid WHERE games.gamesSid=?";

  const [result] = await db.query(gamessql, [req.params.sid]);

  // output.row = result[0];

  res.json(result);
});

// ----------修改中，步行就改回上列--------------**********
router.get("/gamesinfoCollect/:sid", async (req, res) => {
  const output = {
    row: [],
    collect:[],
  };
  const gamessql =
    "SELECT games.*,gamestime.*, store.storeAddress FROM games JOIN gamestime ON games.gamesTime=gamestime.gamesTimeSid JOIN store ON games.storeSid=store.storeSid WHERE games.gamesSid=?";

  const collectsql ="SELECT collectSid, membersid, gamesSid, storeSid, updated_at FROM collect WHERE collectSid=?";

  const [result1] = await db.query(gamessql, [req.params.sid]);
  const [result2] = await db.query(collectsql, [req.params.sid]);

  output.row = result1;
  output.collect = result2;

  res.json(output);
});




// 遊戲介紹裡的評論用
// 使用在O_Reserve_Comment

router.get("/orderComment/:sid", async (req, res) => {
  const output = {
    row: [],
  };
  // const orderCommentsql =
  //   "SELECT games.gamesSid ,comment.*, member.memNickName,member.memHeadshot FROM games JOIN comment ON games.gamesSid=comment.games_id JOIN member ON comment.user_id=member.membersid WHERE games.gamesSid=?";
  const orderCommentsql =
    "SELECT games.gamesSid ,comment.*, member.memNickName,member.memHeadshot FROM games JOIN comment ON games.gamesSid=comment.games_id JOIN member ON comment.commentuser_id=member.membersid WHERE games.gamesSid=?";

  const [result] = await db.query(orderCommentsql, [req.params.sid]);

   // 轉換時間
  // result[0].create_at = res.locals.dayFormat(result[0].create_at);

  // output.row = result[0];
  // console.log(output);
  res.json(result);
});

// -----------遊戲會員書籤用-------------還沒用到----------------
router.get("/collect/:sid", async (req, res) => {
  const output = {
    row: [],
  };

  const sql = "SELECT * FROM collect WHERE collectSid=?";

  const [result] = await db.query(sql, [req.params.sid]);

  output.row = result[0];

   console.log(output)

  res.json(output);
});



// order 資料讀取 :訂單日期-----思考要不要單獨抓日期時間--------------
// 用在O_Reserve_Calendar

router.get("/orderDate/:sid", async (req, res) => {
  const output = {
    row: [],
  };
  const sql =
    "SELECT * FROM order_summary WHERE order_summary.orderSid=?";

  const [result] = await db.query(sql, [req.params.sid]);

  // output.row = result[0];

  res.json(result);
});


// order 資料讀取 :訂單
// 用在OrderProcess、O_Reserve_Calendar、O_Process_One

router.get("/orderProcess/:sid", async (req, res) => {
  const output = {
    row: [],
  };
  const ordersql =
    `SELECT *  
    FROM order_summary 
    JOIN games ON games.gamesSid=order_summary.gameSid 
    JOIN gamestime ON games.gamesTime=gamestime.gamesTimeSid 
    JOIN store ON games.storeSid=store.storeSid 
    JOIN member ON order_summary.memberSid=member.membersid 
    WHERE order_summary.orderSid =1677779977`

  const [result] = await db.query(ordersql);

  // output.row = result[0];
console.log(req.params.sid)
  res.json(result);
});


// ----------discount 資料讀取 :優惠券--測試用，好像會有問題----------------
// 使用在O_Process_Two

router.get("/discount/:sid", async (req, res) => {
  const output = {
    row: [],
  };
  const discountsql =
    // "SELECT discount.*,discount_detail.*,member.memName FROM discount JOIN discount_detail ON discount.discountID=discount_detail.discountID JOIN member ON discount.membersid=member.membersid WHERE discount.discountSid=?";
    // "SELECT discount.*,discount_detail.*,order_summary.*,member.memName,member.memLevel FROM discount JOIN discount_detail ON discount.discountID=discount_detail.discountID JOIN member ON discount.membersid=member.membersid JOIN order_summary ON member.membersid=order_summary.memberSid WHERE order_summary.orderSid=?";
    // 上列沒成功的，暫存-----------------

    "SELECT discount.*,discount_detail.*,order_summary.*,member.memName,member.memLevel FROM discount JOIN discount_detail ON discount.discountID=discount_detail.discountID JOIN member ON discount.membersid=member.membersid JOIN order_summary ON member.membersid=order_summary.memberSid WHERE member.membersid =1 GROUP BY member.membersid=?";


  const [result] = await db.query(discountsql, [req.params.sid]);

  // output.row = result[0];

  res.json(result);
});


// 測試用
router.get("/", (req, res) => {
  res.json(" 屋 屋  ");
});

module.exports = router;



// ***************************測試沒成功的*******************************

// 測試-遊戲介紹及書籤結合-----------------*************

// router.get("/gamesinfo/:sid", async (req, res) => {
//   const output = {
//     row: [],
//     collect:[]
//   };
//   const gamessql =
//     "SELECT games.*,gamestime.*, store.storeAddress FROM games JOIN gamestime ON games.gamesTime=gamestime.gamesTimeSid JOIN store ON games.storeSid=store.storeSid WHERE games.gamesSid=?";

//     const collectsql = "SELECT * FROM collect WHERE collectSid=?";

//   const [result] = await db.query(gamessql, [req.params.sid]);
//   const [collectResult] = await db.query(collectsql, [req.params.sid]);

//   output.row = [...output.row,...result];
//   output.collect = [...output.collect,...collectResult]

//   res.json(output);
// });

// --------------------------***************


// 書籤-舊版
// router.get("/collect/:sid", async (req, res) => {
//   const output = {
//     row: {},
//   };
//   const sql = "SELECT * FROM collect WHERE collectSid=?";

//   const [result] = await db.query(sql, [req.params.sid]);
//   result.create_at = result.map((v, i) => {
//     // return v.create_at=res.locals.dayFormat(result.create_at);
//   });
//   output.row = result;
//   console.log(output.row);
//   res.json(output);
// });
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

// 登入
router.post("/login", async (req, res) => {
  const output = {
    success: false,
    error: "帳號或密碼錯誤",
    code: 0,
    postData: req.body,
    token: "",
  };

  const sql = "SELECT * FROM member WHERE memAccount=?";
  const [rows] = await db.query(sql, [req.body.account]);
  // 沒找到帳號
  if (!rows.length) {
    output.code = 401;
    output.error = "查無此帳號";
    return res.json(output);
  }
  // 比對密碼
  if (!(req.body.password === rows[0].memPassword)) {
    output.code = 402;
    output.error = "密碼錯誤";
    return res.json(output);
  } else {
    output.success = true;
    output.code = 200;
    output.error = "";
    output.memberToken = jwt.sign(
      {
        membersid: rows[0].membersid,
        memAccount: rows[0].memAccount,
      },
      process.env.JWT_SECRET
    );
    output.membersid = rows[0].membersid;
    output.memAccount = rows[0].memAccount;
  }
  console.log(req);
  res.json(output);
});


// games 資料讀取 :遊戲介紹用
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

// 遊戲介紹裡的評論用
router.get("/orderComment/:sid", async (req, res) => {
  const output = {
    row: [],
  };
  const orderCommentsql =
    "SELECT games.gamesSid ,comment.*, member.memNickName,member.memHeadshot FROM games JOIN comment ON games.gamesSid=comment.games_id JOIN member ON comment.games_id =member.membersid WHERE games.gamesSid=?";

  const [result] = await db.query(orderCommentsql, [req.params.sid]);

   // 轉換時間
  // result[0].create_at = res.locals.dayFormat(result[0].create_at);

  // output.row = result[0];
  // console.log(output);
  res.json(result);
});

// 遊戲會員書籤用-還沒用到
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

//書籤-舊版
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



// order 資料讀取 :訂單
router.get("/order/:sid", async (req, res) => {
  const output = {
    row: [],
  };
  const ordersql =
    "SELECT order_summary.*,gamestime.*,games.gamesName,games.gamesImages,games.gamesTime,store.storeName,store.storeAddress,member.memAccount,member.memLevel FROM order_summary JOIN games ON games.gamesSid=order_summary.gameSid JOIN gamestime ON games.gamesTime=gamestime.gamesTimeSid JOIN store ON games.storeSid=store.storeSid JOIN member ON order_summary.memberSid=member.membersid WHERE order_summary.orderSid=?";

  const [result] = await db.query(ordersql, [req.params.sid]);

  // output.row = result[0];

  res.json(result);
});


// discount 資料讀取 :優惠券--測試用
router.get("/discount/:sid", async (req, res) => {
  const output = {
    row: [],
  };
  const discountsql =
    // "SELECT discount.*,discount_detail.*,member.memName FROM discount JOIN discount_detail ON discount.discountID=discount_detail.discountID JOIN member ON discount.membersid=member.membersid WHERE discount.discountSid=?";
    // "SELECT discount.*,discount_detail.*,order_summary.*,member.memName,member.memLevel FROM discount JOIN discount_detail ON discount.discountID=discount_detail.discountID JOIN member ON discount.membersid=member.membersid JOIN order_summary ON member.membersid=order_summary.memberSid WHERE order_summary.orderSid=?";
    // 上列沒成功的-----------------

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

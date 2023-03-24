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
// 使用在OrderReserve、O_Reserve_GameInfo_、O_Reserve_Calendar

router.get("/gamesinfo/:sid", async (req, res) => {
  const output = {
    row: [],
  };
  const gamessql =
    "SELECT games.*,gamestime.*, store.storeAddress,store.storeName FROM games JOIN gamestime ON games.gamesTime=gamestime.gamesTimeSid JOIN store ON games.storeSid=store.storeSid WHERE games.gamesSid=?";

  const [result] = await db.query(gamessql, [req.params.sid]);

  // output.row = result[0];

  res.json(result);
});

// ------------------------會員等級用--------------------
router.get("/ordermemLevel/:sid", async (req, res) => {
  const output = {
    row: [],
  };
  const gamessql =
    "SELECT * FROM member WHERE member.membersid=?";
  const [result] = await db.query(gamessql, [req.params.sid]);

  // output.row = result[0];

  res.json(result);
});


// 遊戲介紹裡的評論用
// 使用在O_Reserve_Comment
router.get("/orderComment/:sid", async (req, res) => {
  const output = {
    row: [],
  };
  const orderCommentsql =
    "SELECT games.gamesSid ,comment.*, member.memNickName,member.memHeadshot FROM games JOIN comment ON games.gamesSid=comment.games_id JOIN member ON comment.commentuser_id=member.membersid WHERE games.gamesSid=?";

  const [result] = await db.query(orderCommentsql, [req.params.sid]);

   // 轉換時間
  // result[0].create_at = res.locals.dayFormat(result[0].create_at);

  // output.row = result[0];
  // console.log(output);
  res.json(result);
});

// -----------遊戲會員書籤加入用----------------------------
router.post("/collectAdd", async (req, res) => {
  const output = {
    success:false,
    row:{}
  };
console.log(req.body)
  const sql = "INSERT INTO `collect`( `membersid`, `gamesSid`, `storeSid`, `updated_at`) VALUES (?,?,?,NOW())";

  const [result] = await db.query(sql, [req.body.memberSid,req.body.gamesSid,req.body.storeSid]);
if(result){
  output.success=true
  output.row = result;

}

   console.log(result)
   console.log(output)

  res.json(output);
});

// 遊戲會員書先刪除
router.delete("/collectDelete/:sid?", async (req, res) => {
  const output = {
      success: false,
      row: {},
  };
  console.log(req.body)
    const sql = "DELETE FROM `collect` WHERE `collect`.`collectSid` = ?";
  
    const [result] = await db.query(sql, [req.params.sid]);
  
  if (result) {
      output.success = true;
      output.row = result;
  }
  
     console.log(result)
     console.log(output)
  
    res.json(output);
  });

// order 資料讀取 :訂單
// 用在OrderProcess

router.get("/orderProcess/:sid", async (req, res) => {
  const output = {
    row: [],
  };

  const ordersql = "SELECT * FROM order_summary WHERE order_summary.orderSid=?";
  // *******************************************************************
  const [result] = await db.query(ordersql,[req.params.sid]);

  // output.row = result[0];
  console.log(req.params.sid);
  res.json(result);
});

// ----------discount 資料讀取 :優惠券-------------
// 使用在O_Process_Two

router.get("/discount/:sid", async (req, res) => {
  const output = {
    row: [],
  };
  const discountsql =
    // 上列沒成功的，暫存-----------------
    // "SELECT discount.*,discount_detail.*,order_summary.*,member.memName,member.memLevel FROM discount JOIN discount_detail ON discount.discountID=discount_detail.discountID JOIN member ON discount.membersid=member.membersid JOIN order_summary ON member.membersid=order_summary.memberSid WHERE member.membersid =1 GROUP BY member.membersid=?";

    // 這是會員有優惠券的部分
    "SELECT discount.*,discount_detail.*,member.memName,member.memLevel FROM discount JOIN discount_detail ON discount.discountID=discount_detail.discountID JOIN member ON discount.membersid=member.membersid WHERE member.membersid=?";

  // const [result] = await db.query(discountsql, [req.params.sid]);

  // // output.row = result[0];

  // res.json(result);
  const [result] = await db.query(discountsql, [req.params.sid]);
  // output.row = result[0];
  console.log(result);

  const newResult = result.filter((v, i) => {
    return v.discountState === "未使用";
  });

  res.json(newResult);
});

// order 資料讀取 :訂單日期-----思考要不要單獨抓日期時間--------------未成功
// 用在O_Reserve_Calendar

// router.get("/orderDate/:sid", async (req, res) => {
//   const output = {
//     row: [],
//   };
//   const sql =
//   // "SELECT * FROM order_summary WHERE order_summary.gameSid=?";
//     "SELECT * FROM order_summary WHERE order_summary.orderSid=?";

//   const [result] = await db.query(sql, [req.params.sid]);

//   // output.row = result[0];

//   res.json(result);
// });
// --------------------------------------


// 測試用
router.get("/", (req, res) => {
  res.json(" 屋 屋  ");
});

module.exports = router;
const express = require("express");
const db = require("../modules/db_connect");
const router = express.Router();

// 遊戲篩選
router.get("/games", async(req,res)=>{
  const sql =
    "SELECT * FROM `games` JOIN store ON games.storeSid=store.storeSid WHERE games.gamesColse = 1";

  const result=await db.query(sql)
  
res.json(result)

})


module.exports = router;
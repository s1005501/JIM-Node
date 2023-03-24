const express = require("express");
const db = require("../modules/db_connect");
const router = express.Router();

// 遊戲篩選
router.get("/games", async (req, res) => {
  const output = {
    success: false,
    row: {},
  };

  const gameSql =
    "SELECT * FROM `games` JOIN store ON games.storeSid=store.storeSid WHERE games.gamesColse = 1";
  const gameResult = await db.query(gameSql);

  const rankSql =
    "SELECT games_id, COUNT(games_id) AS count, AVG(comment.rate) AS level FROM `comment` GROUP BY games_id";
  const rankResult = await db.query(rankSql);

  output.row.gameResult = gameResult;
  output.row.rankResult = rankResult;
  res.json(output);
});

module.exports = router;

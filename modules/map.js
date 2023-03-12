const express = require("express");
const router = express.Router();
const upload = require("./upload");
const db = require("./db_connect");
const bcrypt = require("bcrypt");
const fs = require("fs");

router.use("/", async (req, res) => {
  const gamesql = `SELECT gamesSid,gamesName,gamesImages,gamesPrice,feature01,feature02,storeSid FROM games 
       JOIN gamesfeature01 on gamesFeature01 = gamesFeature01.gamesFeatureSid
       JOIN gamesfeature02 on gamesFeature02 = gamesFeature02.gamesFeatureSid
        WHERE gamesColse = 1`;
  const [game] = await db.query(gamesql);
  const storesql =
    "SELECT `storeSid`,`storeName`,`storeMobile`,`storeCity`,`storeAddress`,`storelat`,`storelon`,`storeTime`,`storeRest`,`storeLogo` FROM `store` WHERE 1";
  const [store] = await db.query(storesql);

  const merges = store.map((v, i) => {
    if (v.storeLogo?.length > 20) {
      local_img = `./public/uploads/${v.storeLogo}`;
      let bitmap = fs.readFileSync(local_img);
      let base64str = Buffer.from(bitmap, "kai").toString("base64");
      return { ...v, storeLogo: `data:image/png;base64,${base64str}` };
    } else {
      return { ...v };
    }
  });
  const merge = merges.map((v, i) => {
    const filters = game.filter((e, i) => {
      if (v.storeSid === e.storeSid) {
        return { ...e };
      }
    });
    return { ...v, game: filters };
  });

  res.json(merge);
});

module.exports = router;

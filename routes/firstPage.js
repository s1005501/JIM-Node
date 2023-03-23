const express = require("express");
// const days = require("dayjs");
const db = require("../modules/db_connect");
const jwt = require("jsonwebtoken");
const upload = require("./../modules/upload");
const nodemailer = require("nodemailer");
const svgCaptcha = require("svg-captcha");

const router = express.Router();

// router.get("/gameover/:rand", async (req, res, next) => {
//   //params=參數
//   const { rand } = req.params;
//   console.log(rand);

//   const sql = ` INSERT INTO discount(
//     discountRand,
//     discountID,
//     discountState,
//     discountRelease)
//     VALUES('${rand}', '20', '未使用', NOW())`;

//     // const r = await db.query(sql);
//     // const [data] = r;
//   const [data] = await db.query(sql);
//     res.json(data);
// //   next();


// });


module.exports = router; //只匯出一次

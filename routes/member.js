const express = require("express");
const days = require("dayjs");
const db = require("../modules/db_connect");
const jwt = require("jsonwebtoken");
const upload = require("./../modules/upload");
const nodemailer = require("nodemailer");

const router = express.Router();

// 會員註冊
router.put("/register", async (req, res) => {
    const output = {
        success: false,
        error: "會員填寫註冊資料有誤",
        code: 0,
        postData: req.body,
        row: [],
    };
    // const sql =
    //     "INSERT INTO `member`( `memNickName`, `memHeadshot`, `memAccount`, `memPassword`, `memName`, `memGender`, `memBirth`, `memEmail`, `memMobile`, `memIdentity`, `memLevel`, `memCreatAt`, `memEditAt`) VALUES (?,?,?,?,?,?,?,?,?,?,1,NOW(),null)";
        const sql =
        "INSERT INTO `member`( `memNickName`, `memHeadshot`, `memAccount`, `memPassword`, `memName`, `memGender`, `memBirth`, `memEmail`, `memMobile`, `memIdentity`, `memLevel`, `memCreatAt`) VALUES (?,?,?,?,?,?,?,?,?,?,1,NOW())";
    let memHeadshot = "";
    if (req.body.mGender === "男") {
        memHeadshot = "male.jpg";
    } else if (req.body.mGender === "女") {
        memHeadshot = "female.jpg";
    }
    const [result] = await db.query(sql, [
        req.body.mNickname,
        memHeadshot,
        req.body.mAccount,
        req.body.mPassword,
        req.body.mName,
        req.body.mGender,
        req.body.mBirth,
        req.body.mEmail,
        req.body.mMobile,
        req.body.mIdentity,
    ]);
    if (!result) {
        output.code = 401;
        output.error = "此帳號已被使用";
        return res.json(output);
    }
    output.success = true;
    output.code = 200;
    output.error = "";
    output.row = result;
	// console.log(output);
    res.json(output);
});

// 會員一般登入
router.post("/login", async (req, res) => {
    const output = {
        success: false,
        error: "帳號或密碼錯誤",
        code: 0,
        postData: req.body,
        token: "",
    };

    const sql = "SELECT * FROM member WHERE memAccount=?";
    const [result] = await db.query(sql, [req.body.account]);
    // 沒找到帳號
    if (!result.length) {
        output.code = 401;
        output.error = "查無此帳號";
        return res.json(output);
    }
    // 比對密碼
    if (!(req.body.password === result[0].memPassword)) {
        output.code = 402;
        output.error = "密碼錯誤";
        return res.json(output);
    } else {
        output.success = true;
        output.code = 200;
        output.error = "";
        output.memberToken = jwt.sign(
            {
                membersid: result[0].membersid,
                memAccount: result[0].memAccount,
            },
            process.env.JWT_SECRET
        );
        output.membersid = result[0].membersid;
        output.memAccount = result[0].memAccount;
    }
    console.log(output);
    res.json(output);
});
// 會員google登入
router.post("/googlelogin", async (req, res) => {
	const output = {
		success: false,
		error: "帳號或密碼錯誤",
		code: 0,
		postData: req.body,
		token: "",
	};

	console.log(req.body.googleEmail);
	const sql = "SELECT * FROM member WHERE memEmail=?";
	const [result] = await db.query(sql, [req.body.googleEmail]);
	console.log(result);
	// 信箱沒比對到
	if (!result.length) {
		output.code = 401;
		output.error = "查無此帳號";
		return res.json(output);
	} else {
		// 有比對到
		output.success = true;
		output.code = 200;
		output.error = "";
		output.memberToken = jwt.sign(
			{
				membersid: result[0].membersid,
				memAccount: result[0].memAccount,
			},
			process.env.JWT_SECRET
		);
		output.membersid = result[0].membersid;
		output.memAccount = result[0].memAccount;
	}

	res.json(output);
});
// 會員profile資料讀取
router.get("/profile/:sid", async (req, res) => {
    const output = {
        success: false,
        error: "",
        code: 0,
        row: [],
    };

    const sql = "SELECT * FROM member WHERE membersid=?";
    const [result] = await db.query(sql, [req.params.sid]);
    if (result) {
        // 轉換時間
        result[0].memBirth = res.locals.dayFormat(result[0].memBirth);
        output.row = result[0];
        output.success = true;
        output.code = 200;
        output.error = "";
    }
    res.json(output);
});

// 會員order資料讀取
router.get("/order/:sid", async (req, res) => {
    const output = {
        success: false,
        error: "",
        code: 0,
        row: [],
    };
    const sql = "SELECT * FROM `order_summary` WHERE memberSid=?";
    const [result] = await db.query(sql, [req.params.sid]);
    if (result) {
        // 轉換時間
        result.create_at = result.map((v, i) => {
            return (v.create_at = res.locals.dayFormat(v.create_at));
        });

        output.success = true;
        output.code = 200;
        output.error = "";
        output.row = result;
    } else {
        output.success = false;
        output.code = 401;
        output.error = "此會員沒有訂單紀錄";
    }
    console.log(output.row);
    res.json(output);
});

// 會員like資料讀取
router.get("/like/:sid", async (req, res) => {
    const output = {
        success: false,
        error: "",
        code: 0,
        row: [],
    };
    const sql =
        "SELECT gamesName,collectSid ,storeCity , storeName FROM `collect` JOIN `store` ON store.storeSid=collect.storeSid JOIN `games`ON games.gamesSid=collect.collectSid WHERE membersid=?";
    const [result] = await db.query(sql, [req.params.sid]);
    if (result) {
        output.success = true;
        output.code = 200;
        output.error = "";
        output.row = result;
    } else {
        output.success = false;
        output.code = 401;
        output.error = "此會員沒有收藏紀錄";
    }
    console.log(output.row);
    res.json(output);
});

// 會員comment資料讀取
router.get("/comment/:sid", async (req, res) => {
    const output = {
        success: false,
        error: "",
        code: 0,
        row: [],
    };
    const sql =
        "SELECT comment_ordered.create_at,games.gamesName,comment_ordered.comment,comment_ordered.sid FROM `comment_ordered` JOIN games ON games.gamesSid=comment_ordered.game_id WHERE user_id=?";
    const [result] = await db.query(sql, [req.params.sid]);
    // 轉換時間
    if (result) {
        result.create_at = result.map((v, i) => {
            return (v.create_at = res.locals.dayFormat(v.create_at));
        });
        output.success = true;
        output.code = 200;
        output.error = "";
        output.row = result;
    } else {
        output.success = false;
        output.code = 401;
        output.error = "此會員沒有評論紀錄";
    }
    console.log(output.row);
    res.json(output);
});

// 會員level資料讀取
router.get("/level/:sid", async (req, res) => {
    const output = {
        success: false,
        error: "",
        code: 0,
        row: {},
    };
    const sql =
        "SELECT order_summary.checkPrice FROM member JOIN order_summary ON order_summary.memberSid=member.membersid WHERE member.membersid=?";
    const [result] = await db.query(sql, [req.params.sid]);

    const headshotSql = "SELECT * FROM `member` WHERE `membersid`=?";
    const [headshotResult] = await db.query(headshotSql, [req.params.sid]);

    const cardLevelName = ["銅卡會員", "銀卡會員", "金卡會員"];
    const upgradePrice = ["500", "3000"];
    try{

    if (result) {
        if (headshotResult.length) {
            output.row.memHeadshot = headshotResult[0].memHeadshot;
            output.row.memLevel = headshotResult[0].memLevel;
        } else {
            output.row.memHeadshot = headshotResult[0].memHeadshot;
            output.row.memLevel = headshotResult[0].memLevel;
        }
        // 訂單金額加總
        const sumData = (result) => {
            var sumDataPrice = 0;
            result.forEach((v, i) => {
                sumDataPrice += v.checkPrice;
            });
            return sumDataPrice;
        };
        output.row.memSumPrice = sumData(result);

        // 判斷會員是甚麼卡片等級
        //  金卡
        if (output.row.memSumPrice > 3000) {
            output.row.memCardLevel = cardLevelName[2];
            // 差額
            output.row.difference = upgradePrice[1] - output.row.memSumPrice;
        }

        //  銀卡
        if (3000 > output.row.memSumPrice && output.row.memSumPrice > 500) {
            output.row.memCardLevel = cardLevelName[1];
            // 差額
            output.row.difference = upgradePrice[1] - output.row.memSumPrice;
        }

        // 銅卡
        if (output.row.memSumPrice < 500) {
            output.row.memCardLevel = cardLevelName[0];
            // 差額
            output.row.difference = upgradePrice[0] - output.row.memSumPrice;
        }

        output.success = true;
        output.code = 200;
        output.error = "";
    } else {
        output.success = false;
        output.code = 401;
        output.error = "此會員等級有誤";
    }
}catch(ex){}

    console.log(output.row);
    res.json(output);
});

// 會員上傳大頭貼
router.post(
    "/upload/:sid",
    upload.single("profileUpload"),
    async (req, res) => {
        const output = {
            success: false,
            error: "上傳照片發生錯誤",
            row: [],
        };
        const sql = "UPDATE `member` SET `memHeadshot`=? WHERE membersid=?";
        const [result] = await db.query(sql, [
            req.file.filename,
            req.params.sid,
        ]);

        if (result) {
            output.success = true;
            output.error = "";
            output.row = result;
        }
        // console.log(req.file);

        res.json(output);
    }
);

// 會員密碼更新
router.post("/update/password/:sid", async (req, res) => {
    const output = {
        success: false,
        error: "資料更改發生錯誤",
        postData: req.body,
        row: [],
    };
    if (res.locals.bearer.membersid && res.locals.bearer.memAccount) {
        const sql = "UPDATE `member` SET `memPassword`=? WHERE membersid=?";
        const [result] = await db.query(sql, [
            req.body.mProfilePassword,
            req.params.sid,
        ]);
        if (result) {
            output.success = true;
            output.error = "";
            output.row = result;
        }

        res.json(output);
    }
});


// 會員姓名更新
router.post("/update/name/:sid", async (req, res) => {
    const output = {
        success: false,
        error: "資料更改發生錯誤",
        postData: req.body,
        row: [],
    };
    if (res.locals.bearer.membersid && res.locals.bearer.memAccount) {
        const sql = "UPDATE `member` SET `memName`=? WHERE membersid=?";
        const [result] = await db.query(sql, [
            req.body.mProfileName,
            req.params.sid,
        ]);
        if (result) {
            output.success = true;
            output.error = "";
            output.row = result;
        }
   
        res.json(output);
    }
});


// 會員信箱更新
router.post("/update/email/:sid", async (req, res) => {
    const output = {
        success: false,
        error: "資料更改發生錯誤",
        postData: req.body,
        row: [],
    };
    if (res.locals.bearer.membersid && res.locals.bearer.memAccount) {
        const sql = "UPDATE `member` SET `memEmail`=? WHERE membersid=?";
        const [result] = await db.query(sql, [
            req.body.mProfileEmail,
            req.params.sid,
        ]);
        if (result) {
            output.success = true;
            output.error = "";
            output.row = result;
        }
   
        res.json(output);
    }
});


// 會員手機更新
router.post("/update/mobile/:sid", async (req, res) => {
    const output = {
        success: false,
        error: "資料更改發生錯誤",
        postData: req.body,
        row: [],
    };
    if (res.locals.bearer.membersid && res.locals.bearer.memAccount) {
        const sql = "UPDATE `member` SET `memMobile`=? WHERE membersid=?";
        const [result] = await db.query(sql, [
            req.body.mProfileMobile,
            req.params.sid,
        ]);
        if (result) {
            output.success = true;
            output.error = "";
            output.row = result;
        }
   
        res.json(output);
    }
});

// 會員暱稱更新
router.post("/update/nickname/:sid", async (req, res) => {
    const output = {
        success: false,
        error: "資料更改發生錯誤",
        postData: req.body,
        row: [],
    };
    if (res.locals.bearer.membersid && res.locals.bearer.memAccount) {
        const sql = "UPDATE `member` SET `memNickName`=? WHERE membersid=?";
        const [result] = await db.query(sql, [
            req.body.mProfileNickName,
            req.params.sid,
        ]);
        if (result) {
            output.success = true;
            output.error = "";
            output.row = result;
        }
   
        res.json(output);
    }
});


// 會員刪除收藏
router.delete("/like/delete/:sid", async (req, res) => {
    const output = {
        success: false,
        error: "",
    };
    console.log(res.locals.bearer);
    if (res.locals.bearer.membersid && res.locals.bearer.memAccount) {
        const sql = "DELETE FROM `collect` WHERE collectSid=?";
        const [result] = await db.query(sql, [req.params.sid]);
        // 回傳給前端的資訊
        output.success = !!result.affectedRows; 
        output.error = output.success ? "" : "刪除發生錯誤";
    } else {
        output.error = "沒有權限刪除";
    }

    res.json(output);
});
module.exports = router;

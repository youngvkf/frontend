const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const { loginControl } = require("../controllers/loginController");
const user = require("../models/user");

router.get("/login", (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ ok: true, data: req.session.user });
  }
  return res.json({ ok: false, error: "로그인되지 않음" });
});

router.post("/login", async (req, res) => {
  const { loginId, password } = req.body;

  try {
    // ✅ 1) 프론트가 뭘 보내는지 확인
    console.log("LOGIN BODY:", req.body);

    // ✅ 2) 백엔드가 어떤 DB/컬렉션을 보고 있는지 확인
    const mongoose = require("mongoose");
    console.log("DB name:", mongoose.connection.name);
    console.log("Collection:", User.collection.name);

    // ✅ 3) 현재 users 컬렉션에 문서가 몇 개인지 확인
    const total = await User.countDocuments();
    console.log("User count:", total);

    // ✅ 4) 공백 제거해서 조회(공백 때문에 못 찾는 경우 방지)
    const cleanLoginId = String(loginId).trim();
    console.log("Searching loginId:", cleanLoginId);

    const found = await User.findOne({ loginId: cleanLoginId });
    console.log("Found user:", found);

    // id 검사
    if (!found) {
      return res.json({ ok: false, error: "해당하는 ID가 없습니다." });
    }

    // 비밀번호 검사
    if (!bcrypt.compareSync(password, found.password)) {
      return res.json({ ok: false, error: "비밀번호가 틀렸습니다." });
    }

    return loginControl(req, res, found);
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ ok: false, error: "서버 오류가 발생했습니다." });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ ok: false, error: "로그아웃 처리 실패" });
    }
    res.clearCookie("connect.sid");
    return res.json({ ok: true });
  });
});

module.exports = router;

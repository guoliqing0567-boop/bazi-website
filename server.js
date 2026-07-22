// ============================================================
//  八字排盘网站 · 后台服务器
//  排盘计算使用 OpenFate 开源引擎 (@openfate/bazi-engine, MIT 协议)
//  启动:npm install 然后 npm start
// ============================================================
const express = require("express");
const path = require("path");
const { calculateBaziChart, BaziInputError } = require("@openfate/bazi-engine");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 排盘接口:前端把出生信息发过来,返回完整命盘
app.post("/api/bazi", (req, res) => {
  try {
    const b = req.body || {};
    const chart = calculateBaziChart({
      year: Number(b.year),
      month: Number(b.month),
      day: Number(b.day),
      hour: Number(b.hour),
      minute: Number(b.minute) || 0,
      gender: b.gender === "male" ? "male" : "female",
      calendarType: b.calendarType === "lunar" ? "lunar" : "solar",
      isLeapMonth: !!b.isLeapMonth,
      longitude: b.longitude !== undefined ? Number(b.longitude) : undefined,
      timezone: b.timezone !== undefined ? Number(b.timezone) : undefined,
      enableTrueSolarTime: b.longitude !== undefined, // 有经度才做真太阳时校正
    });
    res.json({
      ok: true,
      chart,
      // MIT 协议要求保留来源署名
      attribution: {
        engine: "@openfate/bazi-engine (MIT)",
        source: "https://github.com/openfate-ai/bazi-mcp",
      },
    });
  } catch (e) {
    const msg = e instanceof BaziInputError ? e.message : "排盘失败,请检查输入的日期时间是否有效";
    res.status(400).json({ ok: false, error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`八字排盘已启动: http://localhost:${PORT}`);
});

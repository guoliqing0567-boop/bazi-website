// ============================================================
//  八字排盘网站 · 后台服务器
//  排盘计算使用 OpenFate 开源引擎 (@openfate/bazi-engine, MIT 协议)
//  启动:npm install 然后 npm start
// ============================================================
const express = require("express");
const path = require("path");
const { calculateBaziChart, BaziInputError } = require("@openfate/bazi-engine");
const ARTICLES = require("./articles");

const app = express();
const PORT = process.env.PORT || 3000;
const SITE = process.env.SITE_URL || "https://bazi.daimeng1129.org";

app.use(express.json());

// ============================================================
//  文章板块:列表页 /articles,详情页 /article/:slug
//  文章内容在 articles.js 里,新增文章只需改那个文件
// ============================================================

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// 文章页面通用外壳(与主站同一套宣纸+朱砂视觉)
function page({ title, desc, keywords, canonical, body }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-MNXTKQ74NJ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-MNXTKQ74NJ');
</script>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="keywords" content="${esc(keywords)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="zh_CN">
<style>
  :root { --ink:#22302C; --paper:#F5F0E4; --paper-2:#EDE6D4; --cinnabar:#B8432F; --faint:#8C8474; --line:#D8CFBB; }
  * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
  body { font-family:"Songti SC","Noto Serif SC","STSong",serif; background:var(--ink); color:var(--paper);
    min-height:100vh; max-width:680px; margin:0 auto; padding-bottom:60px; }
  header { text-align:center; padding:36px 20px 6px; }
  header a.logo { color:var(--paper); text-decoration:none; }
  h1.site { font-size:26px; letter-spacing:12px; text-indent:12px; font-weight:700; }
  .sub { color:rgba(245,240,228,.5); font-size:12px; margin-top:8px; letter-spacing:3px; }
  nav { text-align:center; margin-top:16px; font-size:14px; letter-spacing:2px; }
  nav a { color:rgba(245,240,228,.75); text-decoration:none; margin:0 12px; }
  nav a:hover, nav a.on { color:var(--cinnabar); }
  .card { background:var(--paper); color:var(--ink); border-radius:18px; margin:18px; padding:24px 22px; }
  .card h2 { font-size:21px; line-height:1.6; margin-bottom:8px; }
  .meta { color:var(--faint); font-size:12px; letter-spacing:1px; margin-bottom:16px; }
  .card h3 { font-size:15px; letter-spacing:2px; color:var(--cinnabar); margin:22px 0 8px;
    border-left:3px solid var(--cinnabar); padding-left:10px; }
  .card p { font-size:15px; line-height:2.05; }
  .list-item { display:block; text-decoration:none; color:var(--ink); background:var(--paper);
    border-radius:16px; margin:0 18px 12px; padding:18px 20px; }
  .list-item .t { font-size:17px; font-weight:700; line-height:1.5; }
  .list-item .d { color:var(--faint); font-size:13px; line-height:1.8; margin-top:8px; }
  .cta { display:block; text-align:center; background:var(--cinnabar); color:var(--paper);
    text-decoration:none; border-radius:12px; padding:14px; margin:18px; font-size:16px;
    letter-spacing:4px; text-indent:4px; }
  .ad-slot { margin:14px 18px; border-radius:14px; min-height:72px; display:flex; align-items:center;
    justify-content:center; background:rgba(245,240,228,.06); border:1px dashed rgba(245,240,228,.18); }
  .ad-slot span { color:rgba(245,240,228,.28); font-size:11px; letter-spacing:3px; }
  .foot { text-align:center; color:rgba(245,240,228,.4); font-size:11px; margin-top:26px;
    line-height:2; letter-spacing:1px; padding:0 24px; }
  .foot a { color:rgba(245,240,228,.55); }
</style>
</head>
<body>
<header>
  <a class="logo" href="/"><h1 class="site">观 命</h1></a>
  <div class="sub">八字四柱 · 真太阳时排盘</div>
  <nav><a href="/">排盘工具</a><a href="/articles">命理知识</a></nav>
</header>
${body}
<p class="foot">
  排盘计算基于 OpenFate 开源引擎(@openfate/bazi-engine,MIT 协议)<br>
  内容仅供参考与娱乐 · 人生的选择权始终在你自己手里
</p>
</body>
</html>`;
}

// 文章列表页
app.get("/articles", (req, res) => {
  const items = ARTICLES.map(a => `
    <a class="list-item" href="/article/${a.slug}">
      <div class="t">${esc(a.title)}</div>
      <div class="d">${esc(a.desc)}</div>
    </a>`).join("");
  res.send(page({
    title: "命理知识 · 观命八字",
    desc: "真太阳时、十神、五行强弱、大运流年……用大白话讲清楚八字里最常被搜索的问题。",
    keywords: "命理知识,八字入门,真太阳时,十神,五行,大运",
    canonical: `${SITE}/articles`,
    body: `
      <!-- 广告位:文章列表顶部 -->
      <div class="ad-slot"><span>广告位 · AD</span></div>
      ${items}
      <a class="cta" href="/">去 排 盘</a>`,
  }));
});

// 文章详情页
app.get("/article/:slug", (req, res, next) => {
  const a = ARTICLES.find(x => x.slug === req.params.slug);
  if (!a) return next();
  const idx = ARTICLES.indexOf(a);
  const next_ = ARTICLES[(idx + 1) % ARTICLES.length];
  const content = a.body.map(s => `<h3>${esc(s.h)}</h3><p>${esc(s.p)}</p>`).join("");
  res.send(page({
    title: `${a.title} · 观命八字`,
    desc: a.desc, keywords: a.keywords,
    canonical: `${SITE}/article/${a.slug}`,
    body: `
      <div class="card">
        <h2>${esc(a.title)}</h2>
        <div class="meta">${a.date} · 命理知识</div>
        ${content}
      </div>
      <!-- 广告位:文章末尾(读完自然位置) -->
      <div class="ad-slot"><span>广告位 · AD</span></div>
      <a class="cta" href="/">用你的生辰排一张命盘</a>
      <a class="list-item" href="/article/${next_.slug}" style="margin-top:12px">
        <div class="d">继续阅读</div>
        <div class="t">${esc(next_.title)}</div>
      </a>
      <p style="text-align:center;margin-top:14px"><a href="/articles" style="color:rgba(245,240,228,.6);font-size:13px">← 返回全部文章</a></p>`,
  }));
});

// 动态 sitemap:首页 + 列表页 + 所有文章,新增文章会自动出现
app.get("/sitemap.xml", (req, res) => {
  const urls = [
    { loc: `${SITE}/`, pri: "1.0", freq: "weekly" },
    { loc: `${SITE}/articles`, pri: "0.8", freq: "weekly" },
    ...ARTICLES.map(a => ({ loc: `${SITE}/article/${a.slug}`, pri: "0.7", freq: "monthly" })),
  ];
  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`).join("\n") +
    `\n</urlset>`);
});

// 静态文件(首页、robots.txt、谷歌验证文件等)。
// 注意:必须放在动态 sitemap 路由之后,否则会被 public 里的旧 sitemap.xml 覆盖。
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

// ---------- 命盘解读接口 ----------
// 双模式:配置了 ANTHROPIC_API_KEY 环境变量时用 Claude AI 深度解读,
// 未配置时用内置规则引擎生成解读(免费,无需任何账号)

const EL_CN = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };

// 十神归类
function godGroup(g) {
  if (["比肩", "劫财"].includes(g)) return "比劫";
  if (["正印", "偏印"].includes(g)) return "印星";
  if (["食神", "伤官"].includes(g)) return "食伤";
  if (["正财", "偏财"].includes(g)) return "财星";
  if (["正官", "七杀"].includes(g)) return "官杀";
  return null;
}

// 从命盘提取解读所需的关键特征
function chartFeatures(c) {
  const count = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const groups = { 比劫: 0, 印星: 0, 食伤: 0, 财星: 0, 官杀: 0 };
  for (const k of ["year", "month", "day", "hour"]) {
    const p = c.pillars[k];
    count[p.element]++;
    count[p.branchElement]++;
    if (k !== "day" && godGroup(p.stemTenGod)) groups[godGroup(p.stemTenGod)]++;
    (p.hiddenStems || []).forEach(h => {
      if (godGroup(h.tenGod)) groups[godGroup(h.tenGod)] += h.isMain ? 1 : 0.5;
    });
  }
  const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]);
  const strongest = sorted[0][0], weakest = sorted[sorted.length - 1][0];
  const domGroup = Object.entries(groups).sort((a, b) => b[1] - a[1])[0][0];
  const nowYear = new Date().getFullYear();
  const currentDaYun = ((c.daYun && c.daYun.cycles) || []).find(d => nowYear >= d.startYear && nowYear <= d.endYear);
  return { count, strongest, weakest, domGroup, currentDaYun, groups };
}

// ---- 规则引擎文案库 ----
const DM_TEXT = {
  wood: { yang: "甲木如参天大树,骨子里有股向上生长的劲。你做事讲原则、重情义,认定的方向不轻易回头,是天生能扛事的人。需要注意的是有时过于固执,学会弯一弯反而长得更高。", yin: "乙木如藤蔓花草,柔韧是你最大的本事。你善于借势、适应力强,在复杂环境里总能找到自己的生存之道。别小看这份柔软,能屈能伸恰恰是大智慧。" },
  fire: { yang: "丙火如太阳,热情坦荡藏不住。你天生有感染力,走到哪里都能带来能量,慷慨大方不计较。要留意的是火势太旺易急躁,大事临头先深呼吸三秒。", yin: "丁火如烛光,温暖细腻而持久。你观察力敏锐,善于照顾他人感受,是朋友圈里那个靠谱的倾听者。记得也给自己留一点光,别总燃烧自己成全别人。" },
  earth: { yang: "戊土如高山厚土,稳重是你的底色。你言出必行、值得托付,身边人对你有天然的信任感。山不转水转,偶尔主动求变,机会会更多。", yin: "己土如田园沃土,包容滋养万物。你踏实肯干、心思细腻,擅长在平凡处见真章。你的价值常被低估,该争取的时候要敢于开口。" },
  metal: { yang: "庚金如刀剑钢铁,果断刚毅是你的标签。你讲义气、有魄力,面对困难越挫越勇。刚极易折,学会给自己留余地,是你后半程的功课。", yin: "辛金如珠玉首饰,精致敏锐有品位。你追求完美,对细节和美感的把握远超常人。别让完美主义困住自己,完成比完美更重要。" },
  water: { yang: "壬水如江河奔流,聪明大气有格局。你思维活跃、适应力强,天生适合闯荡更大的世界。水能载舟亦能覆舟,聚焦一个方向,力量才不会分散。", yin: "癸水如雨露溪泉,智慧内敛而绵长。你直觉极准,善于洞察人心,是深藏不露的类型。相信你的第六感,它很少骗你。" },
};
const GROUP_CAREER = {
  比劫: "命局比劫偏旺,你适合靠自己的双手打天下,合伙创业、团队协作都能发挥所长,但涉及金钱合作要先小人后君子,把规则定清楚。",
  印星: "命局印星有力,你是学习型的人,适合文教、研究、专业技术等靠知识和资历积累的领域,大器晚成型,时间是你的朋友。",
  食伤: "命局食伤生辉,才华和表达欲是你的武器,创意、内容、艺术、口才相关的行业最能让你发光,别把才华浪费在不欣赏你的地方。",
  财星: "命局财星当道,你对机会和资源有天然的嗅觉,适合经商、销售、金融等直接和'价值'打交道的领域,记住细水长流胜过一夜暴富。",
  官杀: "命局官杀分明,你有责任心和管理潜质,适合在体系和组织中晋升,或从事规则性强的行业,压力越大你反而越出成绩。",
};
const GROUP_LOVE = {
  比劫: "感情中你重朋友义气,有时让另一半觉得排位靠后,记得把在乎说出口,仪式感不是矫情。",
  印星: "你在感情里习惯被照顾,也容易受长辈影响,学会自己拿主意,关系会更平等长久。",
  食伤: "你表达爱的方式丰富浪漫,但情绪起伏也快,吵架时先冷静十分钟,很多裂痕本可避免。",
  财星: "你务实体贴,愿意为爱付出实际行动,注意别用物质代替陪伴,在场比礼物更珍贵。",
  官杀: "你在感情中有担当讲承诺,但容易把压力憋在心里,学会示弱,亲密关系需要看见彼此的软肋。",
};
const WEAK_HEALTH = {
  wood: "五行木气偏弱,对应肝胆与筋络,少熬夜、少动怒,多亲近绿色植物和户外晨光,春天是你养生的黄金季。",
  fire: "五行火气偏弱,对应心与血脉,注意保暖和血液循环,适度运动让心跳快起来,夏天多晒晒太阳补充能量。",
  earth: "五行土气偏弱,对应脾胃,三餐规律比什么补品都强,少食生冷,黄色食物(小米、南瓜)是你的好朋友。",
  metal: "五行金气偏弱,对应肺与呼吸道,空气质量差时注意防护,练习深呼吸或有氧运动,秋天记得润肺。",
  water: "五行水气偏弱,对应肾与水液代谢,多喝温水、避免过劳,晚上十一点前入睡对你格外重要,冬天宜藏不宜露。",
};
const DAYUN_TEXT = {
  比劫: "当前大运走比劫,是积累人脉、合纵连横的阶段,朋友既是助力也可能是破财点,合作需谨慎。",
  印星: "当前大运走印星,利学习进修、考证考试、贵人提携,沉下心充电,这是为下一程蓄力的好时光。",
  食伤: "当前大运走食伤,才华外露、表达欲强,适合做内容、拓新路,但说话易得罪人,谨言慎行。",
  财星: "当前大运走财星,求财机会增多,是主动出击拼事业的窗口期,但也要防范因财生扰。",
  官杀: "当前大运走官杀,责任和压力同步上升,职位晋升有望,注意劳逸结合,别硬扛。",
};

// 规则引擎:生成结构化解读
function templateReading(c) {
  const f = chartFeatures(c);
  const dm = c.dayMaster;
  const pol = dm.polarity === "yang" ? "yang" : "yin";
  const elCounts = Object.entries(f.count).map(([e, n]) => `${EL_CN[e]}${n % 1 ? n.toFixed(1) : n}`).join(" · ");
  const sections = [
    { title: "命局总览", text: `你的日主为${dm.char}${EL_CN[dm.element]}(${pol === "yang" ? "阳" : "阴"}),生肖属${(c.calendar && c.calendar.zodiac) || "—"}。命局五行分布:${elCounts},其中${EL_CN[f.strongest]}最旺、${EL_CN[f.weakest]}偏弱,十神以${f.domGroup}为主导。四柱为${["year","month","day","hour"].map(k => c.pillars[k].ganZhi).join(" ")}。` },
    { title: "性格特质", text: DM_TEXT[dm.element][pol] },
    { title: "事业财运", text: GROUP_CAREER[f.domGroup] },
    { title: "感情人际", text: GROUP_LOVE[f.domGroup] },
  ];
  if (f.currentDaYun) {
    const g = godGroup(f.currentDaYun.stemTenGod) || "比劫";
    sections.push({ title: "当前大运", text: `你现处 ${f.currentDaYun.ganZhi} 大运(${f.currentDaYun.startYear}-${f.currentDaYun.endYear} 年,${f.currentDaYun.startAge}-${f.currentDaYun.endAge} 岁)。${DAYUN_TEXT[g]}` });
  }
  sections.push({ title: "养生建议", text: WEAK_HEALTH[f.weakest] });
  return sections;
}

// Claude AI 解读(需要环境变量 ANTHROPIC_API_KEY)
async function aiReading(c) {
  const f = chartFeatures(c);
  const summary = {
    四柱: ["year","month","day","hour"].map(k => c.pillars[k].ganZhi),
    日主: `${c.dayMaster.char}${EL_CN[c.dayMaster.element]}(${c.dayMaster.polarity === "yang" ? "阳" : "阴"})`,
    生肖: c.calendar && c.calendar.zodiac,
    五行分布: Object.fromEntries(Object.entries(f.count).map(([e, n]) => [EL_CN[e], n])),
    十神分布: f.groups,
    当前大运: f.currentDaYun ? `${f.currentDaYun.ganZhi}(${f.currentDaYun.startYear}-${f.currentDaYun.endYear})` : "未起运",
    地支互动: (c.interactions || []).map(i => (i.branches || []).join("") + (i.type || "")),
  };
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1600,
      messages: [{
        role: "user",
        content: `你是一位温和专业的命理师。请根据以下八字命盘数据,用简体中文写一份解读,语气亲切、具体、给人力量,避免宿命论和恐吓性表述。\n\n命盘数据:${JSON.stringify(summary)}\n\n请严格以 JSON 数组格式输出(不要任何其他文字、不要 markdown 代码块),每个元素形如 {"title":"标题","text":"内容"},共 6 段,标题依次为:命局总览、性格特质、事业财运、感情人际、当前大运、养生建议。每段 80-150 字。`,
      }],
    }),
  });
  if (!resp.ok) throw new Error("AI 服务暂时不可用");
  const data = await resp.json();
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  const clean = text.replace(/```json|```/g, "").trim();
  const sections = JSON.parse(clean);
  if (!Array.isArray(sections)) throw new Error("解析失败");
  return sections;
}

app.post("/api/interpret", async (req, res) => {
  const c = (req.body || {}).chart;
  if (!c || !c.pillars || !c.dayMaster) return res.status(400).json({ error: "缺少命盘数据" });
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const sections = await aiReading(c);
        return res.json({ ok: true, mode: "ai", sections });
      } catch (e) {
        // AI 失败时自动退回规则引擎,保证用户始终能拿到结果
        return res.json({ ok: true, mode: "template", sections: templateReading(c) });
      }
    }
    res.json({ ok: true, mode: "template", sections: templateReading(c) });
  } catch (e) {
    res.status(500).json({ error: "解读生成失败,请重试" });
  }
});

app.listen(PORT, () => {
  console.log(`八字排盘已启动: http://localhost:${PORT}`);
});

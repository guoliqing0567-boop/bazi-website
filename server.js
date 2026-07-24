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
function page({ title, desc, keywords, canonical, body, nav }) {
  const navItems = [
    ["/", "排盘"], ["/hehun.html", "合婚"], ["/today.html", "黄历"],
    ["/wiki", "百科"], ["/articles", "文章"],
  ].map(([h, n]) => `<a href="${h}"${nav === h ? ' class="on"' : ''}>${n}</a>`).join("");
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
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header>
  <a class="wordmark" href="/">
    <h1>观命</h1>
    <span class="stamp">命</span>
  </a>
  <div class="tagline">八字四柱 · 真太阳时排盘<span class="free-badge">完全免费</span></div>
  <hr class="rule-double">
</header>
<nav>${navItems}</nav>
<main>
${body}
</main>
<p class="foot">
  <b style="color:var(--seal);font-weight:400">全站免费 · 不收费 · 不需要注册</b><br>
  排盘计算基于 OpenFate 开源引擎(@openfate/bazi-engine,MIT 协议)<br>
  内容仅供参考与娱乐 · 人生的选择权始终在你自己手里
</p>
</body>
</html>`;
}

// 文章列表页
app.get("/articles", (req, res) => {
  const items = ARTICLES.map(a => `
    <a class="entry" href="/article/${a.slug}">
      <div class="t">${esc(a.title)}</div>
      <div class="d">${esc(a.desc)}</div>
    </a>`).join("");
  res.send(page({
    title: "命理知识 · 免费八字入门文章 | 观命",
    desc: "真太阳时、十神、五行强弱、大运流年……用大白话讲清楚八字里最常被搜索的问题。",
    keywords: "命理知识,八字入门,真太阳时,十神,五行,大运",
    canonical: `${SITE}/articles`,
    nav: "/articles",
    body: `
      <div class="ad-slot"><span>广告位 · AD</span></div>
      <div class="block">
        <div class="block-head"><h2>命理知识</h2><span class="en">${ARTICLES.length} Articles</span></div>
        ${items}
      </div>
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
    nav: "/articles",
    body: `
      <article class="prose block">
        <h2>${esc(a.title)}</h2>
        <div class="meta">${a.date} · 命理知识</div>
        ${content}
      </article>
      <div class="ad-slot"><span>广告位 · AD</span></div>
      <a class="cta" href="/">用你的生辰排一张命盘</a>
      <a class="next-link" href="/article/${next_.slug}">
        <div class="lbl">继续阅读</div>
        <div class="t">${esc(next_.title)}</div>
      </a>
      <a class="back" href="/articles">← 返回全部文章</a>`,
  }));
});

// 动态 sitemap:首页 + 列表页 + 所有文章,新增文章会自动出现
// ============================================================
//  命理百科:十天干 / 十二地支 / 十神,共 32 个条目页
// ============================================================

const WIKI = require("./wiki");
const EL_CN_W = { wood:"木", fire:"火", earth:"土", metal:"金", water:"水" };

const WIKI_CATS = {
  tiangan: {
    name: "十天干", items: WIKI.TIANGAN,
    desc: "甲乙丙丁戊己庚辛壬癸,十个天干各自的五行属性、性格象征与适合领域。",
    intro: "天干是八字的骨架之一。日柱天干代表你本人,称为「日主」,是整张命盘的原点。了解自己的日主属于哪一个天干,是读懂八字的第一步。",
    label: i => `${i.char} · ${EL_CN_W[i.element]}(${i.polarity})`,
  },
  dizhi: {
    name: "十二地支", items: WIKI.DIZHI,
    desc: "子丑寅卯辰巳午未申酉戌亥,十二地支对应的生肖、月份、时辰与藏干。",
    intro: "地支比天干复杂:它不仅有自己的五行属性,内部还「藏」着一到三个天干。地支同时用于纪年、月、日、时,是八字里信息量最大的部分。",
    label: i => `${i.char} · 属${i.zodiac} · ${EL_CN_W[i.element]}`,
  },
  shishen: {
    name: "十神", items: WIKI.SHISHEN,
    desc: "比肩、劫财、食神、伤官、正财、偏财、正官、七杀、正印、偏印详解。",
    intro: "十神是以日主为中心,衡量命局中其他干支与你之间关系的一套坐标。看懂十神,才算真正开始读一张命盘。",
    label: i => `${i.name} · ${i.group}`,
  },
};

// 百科总目录
app.get("/wiki", (req, res) => {
  const blocks = Object.entries(WIKI_CATS).map(([k, c]) => `
    <div class="block">
      <div class="block-head"><h2>${c.name}</h2><span class="en">${c.items.length} Entries</span></div>
      <p class="hint" style="margin-bottom:16px">${esc(c.desc)}</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${c.items.map(i => `<a href="/wiki/${k}/${i.key}" style="display:inline-block;
          border:1px solid var(--line-2);color:var(--ink);text-decoration:none;
          padding:9px 15px;font-size:17px;transition:background .18s"
          onmouseover="this.style.background='rgba(31,29,26,.05)'"
          onmouseout="this.style.background='transparent'">${esc(i.char || i.name)}</a>`).join("")}
      </div>
    </div>`).join("");
  res.send(page({
    title: "命理百科 · 天干地支十神详解(免费查询)| 观命",
    desc: "十天干、十二地支、十神的完整详解:五行属性、性格特质、适合领域与相互关系,一处查清。",
    keywords: "命理百科,天干地支,十神详解,甲木,乙木,正官,七杀,地支藏干",
    canonical: `${SITE}/wiki`,
    nav: "/wiki",
    body: `<div class="ad-slot"><span>广告位 · AD</span></div>${blocks}<a class="cta" href="/">去 排 盘</a>`,
  }));
});

// 分类列表页
app.get("/wiki/:cat", (req, res, next) => {
  const c = WIKI_CATS[req.params.cat];
  if (!c) return next();
  const items = c.items.map(i => `
    <a class="entry" href="/wiki/${req.params.cat}/${i.key}">
      <div class="t">${esc(c.label(i))}</div>
      <div class="d">${esc(i.brief)}</div>
    </a>`).join("");
  res.send(page({
    title: `${c.name}详解 · 观命命理百科`,
    desc: c.desc, keywords: `${c.name},${c.items.map(i => i.char || i.name).join(",")}`,
    canonical: `${SITE}/wiki/${req.params.cat}`,
    nav: "/wiki",
    body: `
      <div class="block">
        <div class="block-head"><h2>${c.name}</h2><span class="en">${c.items.length} Entries</span></div>
        <p style="font-size:15px;line-height:2.15">${esc(c.intro)}</p>
      </div>
      <div class="ad-slot"><span>广告位 · AD</span></div>
      <div class="block">${items}</div>
      <a class="cta" href="/wiki">返回百科目录</a>`,
  }));
});

// 条目详情页
app.get("/wiki/:cat/:key", (req, res, next) => {
  const c = WIKI_CATS[req.params.cat];
  if (!c) return next();
  const i = c.items.find(x => x.key === req.params.key);
  if (!i) return next();
  const idx = c.items.indexOf(i);
  const nx = c.items[(idx + 1) % c.items.length];
  const name = i.char || i.name;

  let sections = "";
  if (req.params.cat === "tiangan") {
    sections = `
      <div class="kv"><span>五行</span><span>${EL_CN_W[i.element]}</span></div>
      <div class="kv"><span>阴阳</span><span>${i.polarity}</span></div>
      <div class="kv"><span>象征</span><span>${esc(i.image)}</span></div>
      <h3>本性与象征</h3><p>${esc(i.nature)}</p>
      <h3>性格特质</h3><p>${esc(i.person)}</p>
      <h3>长处</h3><p>${esc(i.strength)}</p>
      <h3>需要留意</h3><p>${esc(i.caution)}</p>
      <h3>适合的领域</h3><p>${esc(i.fit)}</p>
      <h3>与其他干支的关系</h3><p>${esc(i.relations)}</p>`;
  } else if (req.params.cat === "dizhi") {
    sections = `
      <div class="kv"><span>生肖</span><span>${i.zodiac}</span></div>
      <div class="kv"><span>五行</span><span>${EL_CN_W[i.element]}(${i.polarity})</span></div>
      <div class="kv"><span>对应月份</span><span>${esc(i.month)}</span></div>
      <div class="kv"><span>对应时辰</span><span>${esc(i.time)}</span></div>
      <div class="kv"><span>季节方位</span><span>${esc(i.season)} · ${esc(i.direction)}</span></div>
      <div class="kv"><span>藏干</span><span>${esc(i.hidden)}</span></div>
      <h3>本性与象征</h3><p>${esc(i.nature)}</p>
      <h3>性格特质</h3><p>${esc(i.person)}</p>
      <h3>合冲刑害</h3><p>${esc(i.note)}</p>`;
  } else {
    sections = `
      <div class="kv"><span>所属类别</span><span>${esc(i.group)}</span></div>
      <div class="kv"><span>与日主关系</span><span>${esc(i.relation)}</span></div>
      <h3>含义</h3><p>${esc(i.meaning)}</p>
      <h3>性格倾向</h3><p>${esc(i.person)}</p>
      <h3>事业方向</h3><p>${esc(i.career)}</p>
      <h3>感情特点</h3><p>${esc(i.love)}</p>
      <h3>过旺时</h3><p>${esc(i.strong)}</p>
      <h3>过弱时</h3><p>${esc(i.weak)}</p>`;
  }

  res.send(page({
    title: `${name}是什么意思?${c.name}详解 · 观命`,
    desc: i.brief,
    keywords: `${name},${name}是什么意思,${name}性格,${c.name}`,
    canonical: `${SITE}/wiki/${req.params.cat}/${i.key}`,
    nav: "/wiki",
    body: `
      <article class="prose block">
        <span class="big-char">${esc(name)}</span>
        <div class="meta" style="margin-top:0">${esc(c.label(i))} · ${c.name}</div>
        <p class="hint" style="margin-top:12px;font-size:14px">${esc(i.brief)}</p>
        ${sections}
      </article>
      <div class="ad-slot"><span>广告位 · AD</span></div>
      <a class="cta" href="/">排一张自己的命盘看看</a>
      <a class="next-link" href="/wiki/${req.params.cat}/${nx.key}">
        <div class="lbl">下一个</div>
        <div class="t">${esc(c.label(nx))}</div>
      </a>
      <a class="back" href="/wiki/${req.params.cat}">← 返回${c.name}目录</a>`,
  }));
});

app.get("/sitemap.xml", (req, res) => {
  const urls = [
    { loc: `${SITE}/`, pri: "1.0", freq: "weekly" },
    { loc: `${SITE}/hehun.html`, pri: "0.9", freq: "monthly" },
    { loc: `${SITE}/today.html`, pri: "0.9", freq: "daily" },
    { loc: `${SITE}/articles`, pri: "0.8", freq: "weekly" },
    { loc: `${SITE}/wiki`, pri: "0.8", freq: "monthly" },
    ...Object.keys(WIKI_CATS).map(k => ({ loc: `${SITE}/wiki/${k}`, pri: "0.7", freq: "monthly" })),
    ...Object.entries(WIKI_CATS).flatMap(([k, c]) =>
      c.items.map(i => ({ loc: `${SITE}/wiki/${k}/${i.key}`, pri: "0.6", freq: "monthly" }))),
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

// ============================================================
//  八字合婚:两张命盘的匹配分析
// ============================================================

const BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const SIX_HE = { 子:"丑", 丑:"子", 寅:"亥", 亥:"寅", 卯:"戌", 戌:"卯", 辰:"酉", 酉:"辰", 巳:"申", 申:"巳", 午:"未", 未:"午" };
const SAN_HE = [["申","子","辰"], ["亥","卯","未"], ["寅","午","戌"], ["巳","酉","丑"]];
const CHONG = { 子:"午", 午:"子", 丑:"未", 未:"丑", 寅:"申", 申:"寅", 卯:"酉", 酉:"卯", 辰:"戌", 戌:"辰", 巳:"亥", 亥:"巳" };
const HAI = { 子:"未", 未:"子", 丑:"午", 午:"丑", 寅:"巳", 巳:"寅", 卯:"辰", 辰:"卯", 申:"亥", 亥:"申", 酉:"戌", 戌:"酉" };
const SHENG = { wood:"fire", fire:"earth", earth:"metal", metal:"water", water:"wood" };
const KE = { wood:"earth", earth:"water", water:"fire", fire:"metal", metal:"wood" };

function elementCount(c) {
  const n = { wood:0, fire:0, earth:0, metal:0, water:0 };
  for (const k of ["year","month","day","hour"]) {
    n[c.pillars[k].element]++;
    n[c.pillars[k].branchElement]++;
    (c.pillars[k].hiddenStems || []).forEach(h => { if (!h.isMain) n[h.element] += 0.5; });
  }
  return n;
}

function hehunAnalyze(a, b) {
  const ea = a.dayMaster.element, eb = b.dayMaster.element;
  const items = [];
  let score = 60;

  // 1. 日主关系(核心:代表两个人本身的相处基调)
  let dmText, dmLabel;
  if (ea === eb) {
    dmLabel = "同气相求"; score += 8;
    dmText = `双方日主同为${EL_CN[ea]},性情相近、想法容易同步,天然有默契。要留心的是优点缺点也相似,遇到问题时容易一起钻牛角尖,需要有人先退一步。`;
  } else if (SHENG[ea] === eb) {
    dmLabel = "你生对方"; score += 12;
    dmText = `你的日主${EL_CN[ea]}生对方的${EL_CN[eb]},你在这段关系里更主动、更愿意付出,对方在你身边容易被滋养、被托举。长久之道在于对方懂得回馈,否则你会觉得累。`;
  } else if (SHENG[eb] === ea) {
    dmLabel = "对方生你"; score += 12;
    dmText = `对方日主${EL_CN[eb]}生你的${EL_CN[ea]},对方是这段关系里的给予者,你会感到被照顾、被支持。记得把这份好看在眼里、说出口,关系才能持久。`;
  } else if (KE[ea] === eb) {
    dmLabel = "你克对方"; score -= 5;
    dmText = `你的日主${EL_CN[ea]}克对方的${EL_CN[eb]},相处中你比较强势、主导性强。这不必然是坏事——若对方性格柔和,反而结构稳定;但若对方也刚,就要注意别把关系变成较劲。`;
  } else {
    dmLabel = "对方克你"; score -= 5;
    dmText = `对方日主${EL_CN[eb]}克你的${EL_CN[ea]},对方在关系中话语权更重,你容易迁就。适度的迁就是包容,长期的压抑则会积怨,该表达的需求要说出来。`;
  }
  items.push({ title: `日主关系 · ${dmLabel}`, text: dmText });

  // 2. 五行互补(看彼此能否补上对方的短板)
  const na = elementCount(a), nb = elementCount(b);
  const weakA = Object.entries(na).sort((x,y) => x[1]-y[1])[0][0];
  const weakB = Object.entries(nb).sort((x,y) => x[1]-y[1])[0][0];
  const strongA = Object.entries(na).sort((x,y) => y[1]-x[1])[0][0];
  const strongB = Object.entries(nb).sort((x,y) => y[1]-x[1])[0][0];
  let buText = "";
  let buCount = 0;
  if (strongB === weakA) { buCount++; buText += `对方${EL_CN[strongB]}旺,正好补上你命局中偏弱的${EL_CN[weakA]};`; }
  if (strongA === weakB) { buCount++; buText += `你的${EL_CN[strongA]}充足,也能补对方偏弱的${EL_CN[weakB]};`; }
  if (buCount === 2) { score += 12; buText = "双向互补——" + buText + "这是很难得的配置,两个人在一起比各自单独时更完整。"; }
  else if (buCount === 1) { score += 7; buText = "单向互补——" + buText + "被补的一方会明显感到轻松,另一方需要留意别只顾着付出。"; }
  else {
    buText = `你偏弱的是${EL_CN[weakA]},对方偏弱的是${EL_CN[weakB]}` +
      (weakA === weakB ? ",两人短板相同,遇到相关问题时容易一起犯难,建议有意识地在外部寻找支持。"
                       : ",彼此的短板不同也不互补,关系更依赖后天经营而非先天契合。");
  }
  items.push({ title: "五行互补", text: buText });

  // 3. 地支关系(日支代表配偶宫,权重最高;年支代表家庭背景)
  const da = a.pillars.day.branch, db = b.pillars.day.branch;
  const ya = a.pillars.year.branch, yb = b.pillars.year.branch;
  const rels = [];
  const check = (x, y, label) => {
    if (SIX_HE[x] === y) { score += 10; rels.push(`${label}${x}${y}<b>六合</b>,亲近感强、彼此看着顺眼`); }
    else if (SAN_HE.some(g => g.includes(x) && g.includes(y))) { score += 8; rels.push(`${label}${x}${y}<b>三合</b>,合作顺畅、目标一致`); }
    else if (CHONG[x] === y) { score -= 10; rels.push(`${label}${x}${y}<b>相冲</b>,容易起摩擦、想法常对着来`); }
    else if (HAI[x] === y) { score -= 6; rels.push(`${label}${x}${y}<b>相害</b>,小事上易生嫌隙,需要多解释`); }
    else if (x === y) { score += 3; rels.push(`${label}同为${x},节奏相似、生活习惯接近`); }
  };
  check(da, db, "日支(配偶宫)");
  check(ya, yb, "年支(生肖)");
  items.push({
    title: "地支互动",
    text: rels.length ? rels.join(";") + "。" +
      (rels.some(r => r.includes("相冲")) ? "有冲不代表不能在一起,现实中很多相冲的伴侣反而互相成就,关键是把冲突转化成沟通。" : "")
      : "两人地支之间没有明显的合冲刑害,关系平淡稳定,少激烈起伏,也少剧烈摩擦——这种配置更考验用心经营。",
  });

  // 4. 生肖参考
  const za = (a.calendar && a.calendar.zodiac) || "—", zb = (b.calendar && b.calendar.zodiac) || "—";
  items.push({
    title: "生肖参考",
    text: `你属${za},对方属${zb}。生肖只看年支,是八字里最粗的一层信息,民间说的「属相不合」往往夸大了它的分量。真正决定相处质量的是日主关系和日支互动,也就是上面几项——如果那几项和谐,生肖上的说法不必挂在心上。`,
  });

  score = Math.max(35, Math.min(96, Math.round(score)));
  let verdict;
  if (score >= 85) verdict = "契合度很高。两人无论性情还是命局结构都相当合拍,是那种「相处起来不费劲」的组合。";
  else if (score >= 72) verdict = "整体和谐。有天然的默契基础,也有需要磨合的地方,属于用心经营就能越走越好的类型。";
  else if (score >= 58) verdict = "各有长短。既有相合之处也有需要让步的地方,关系走向更多取决于两个人的意愿而非先天配置。";
  else verdict = "需要多花心思。命局层面的摩擦点较多,但这从来不是判决书——现实里靠沟通和包容走得很好的组合比比皆是。";

  return { score, verdict, items };
}

app.post("/api/hehun", (req, res) => {
  try {
    const { a, b } = req.body || {};
    const build = x => calculateBaziChart({
      year: Number(x.year), month: Number(x.month), day: Number(x.day),
      hour: Number(x.hour), minute: Number(x.minute) || 0,
      gender: x.gender === "male" ? "male" : "female",
      calendarType: x.calendarType === "lunar" ? "lunar" : "solar",
      longitude: x.longitude !== undefined ? Number(x.longitude) : undefined,
      timezone: x.timezone !== undefined ? Number(x.timezone) : undefined,
      enableTrueSolarTime: x.longitude !== undefined,
    });
    const ca = build(a || {}), cb = build(b || {});
    res.json({ ok: true, a: ca, b: cb, result: hehunAnalyze(ca, cb) });
  } catch (e) {
    const msg = e instanceof BaziInputError ? e.message : "请检查双方的出生日期时间是否填写正确";
    res.status(400).json({ ok: false, error: msg });
  }
});

// ============================================================
//  今日黄历:当天干支、建除十二神、宜忌、冲煞
// ============================================================

// 建除十二神:以月支为建,日支顺次而行
const JIAN_CHU = [
  { n: "建", yi: ["外出", "求学", "面试", "开始新计划"], ji: ["动土", "搬家", "大额支出"], d: "万物生发之日,适合起头,不宜大动干戈。" },
  { n: "除", yi: ["打扫", "看病", "断舍离", "清理旧账"], ji: ["赴任", "签约", "开张"], d: "除旧布新之日,清理比开创更合时宜。" },
  { n: "满", yi: ["祈福", "聚会", "收获性的事"], ji: ["服药", "下葬"], d: "圆满丰盈之日,宜守成庆贺,不宜起争。" },
  { n: "平", yi: ["谈判", "调解", "修缮", "常规事务"], ji: ["求财冒进", "投机"], d: "平稳无奇之日,按部就班最好。" },
  { n: "定", yi: ["签约", "订婚", "定方案", "入职"], ji: ["诉讼", "远行"], d: "尘埃落定之日,适合把悬而未决的事敲定。" },
  { n: "执", yi: ["立规矩", "追讨", "整理", "执行既定计划"], ji: ["开张", "搬家"], d: "执守之日,守住已有的比追求新的更稳妥。" },
  { n: "破", yi: ["拆除", "看病", "了结旧事"], ji: ["婚嫁", "开业", "签约"], d: "破败冲克之日,宜破不宜立,重要决定改期为好。" },
  { n: "危", yi: ["安分守己", "静养"], ji: ["登高", "冒险", "远行", "重大决策"], d: "危险警示之日,收敛为上,凡事留三分余地。" },
  { n: "成", yi: ["开业", "结婚", "签约", "入学", "几乎百事可行"], ji: ["诉讼"], d: "成就之日,是一个月里最适合做大事的日子之一。" },
  { n: "收", yi: ["收账", "储蓄", "收获", "整理归档"], ji: ["出行", "开张"], d: "收敛入库之日,宜收不宜放。" },
  { n: "开", yi: ["开业", "开工", "祈福", "出行", "启动新事"], ji: ["下葬", "动土"], d: "开通启达之日,适合开始与出发。" },
  { n: "闭", yi: ["收尾", "填补", "储蓄", "闭门修养"], ji: ["开业", "手术", "求医"], d: "闭藏之日,宜守宜藏,不宜张扬。" },
];
const ZODIAC_OF_BRANCH = { 子:"鼠", 丑:"牛", 寅:"虎", 卯:"兔", 辰:"龙", 巳:"蛇", 午:"马", 未:"羊", 申:"猴", 酉:"鸡", 戌:"狗", 亥:"猪" };

function todayInfo(d = new Date()) {
  // 用当天正午排盘,取年月日干支(正午不受子时换日争议影响)
  const c = calculateBaziChart({
    year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
    hour: 12, minute: 0, gender: "male", calendarType: "solar",
  });
  const dayBranch = c.pillars.day.branch, monthBranch = c.pillars.month.branch;
  const idx = (BRANCHES.indexOf(dayBranch) - BRANCHES.indexOf(monthBranch) + 12) % 12;
  const jc = JIAN_CHU[idx];
  const chongBranch = CHONG[dayBranch];
  const lunar = (c.calendar && c.calendar.lunar) || {};
  return {
    date: `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`,
    week: "日一二三四五六"[d.getDay()],
    ganzhi: {
      year: c.pillars.year.ganZhi, month: c.pillars.month.ganZhi, day: c.pillars.day.ganZhi,
    },
    dayStem: c.pillars.day.stem, dayBranch,
    dayElement: EL_CN[c.pillars.day.element],
    naYin: c.pillars.day.naYin,
    zodiac: (c.calendar && c.calendar.zodiac) || "",
    lunar: `农历${lunar.isLeapMonth ? "闰" : ""}${lunar.month || "?"}月${lunar.day || "?"}日`,
    jianchu: jc.n, jianchuDesc: jc.d,
    yi: jc.yi, ji: jc.ji,
    chong: `${ZODIAC_OF_BRANCH[dayBranch]}日冲${ZODIAC_OF_BRANCH[chongBranch]}`,
    chongNote: `属${ZODIAC_OF_BRANCH[chongBranch]}的朋友今天诸事宜缓,重要决定可以往后放一放。`,
  };
}

app.get("/api/today", (req, res) => {
  try { res.json({ ok: true, today: todayInfo() }); }
  catch (e) { res.status(500).json({ ok: false, error: "获取失败" }); }
});

app.listen(PORT, () => {
  console.log(`八字排盘已启动: http://localhost:${PORT}`);
});

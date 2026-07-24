// ============================================================
//  分享图生成器
//  在浏览器里用 Canvas 画一张竖版长图,手机长按即可保存。
//  排盘页与合婚页共用。
// ============================================================

const SHARE = (() => {
  const W = 750, SCALE = 2;
  const C = {
    paper: "#EDE4CF", paper2: "#E4D9BE", ink: "#1F1D1A", inkSoft: "#5C554A",
    hint: "#8B8371", seal: "#B33A2B", pine: "#26362E", pine2: "#1B2822",
    line: "rgba(31,29,26,.16)",
    el: { wood: "#3D6B4A", fire: "#B33A2B", earth: "#9C7A3C", metal: "#63605A", water: "#2F5068" },
    elLight: { wood: "#86B394", fire: "#E28E76", earth: "#DCB672", metal: "#C6C1B5", water: "#85A9C9" },
  };
  const SERIF = '"Songti SC","STSong","Noto Serif SC","SimSun",serif';
  const SANS = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif';
  const EL_CN = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };

  // 预加载二维码(网址固定,只需一张)
  const qrImg = new Image();
  let qrReady = false;
  qrImg.onload = () => { qrReady = true; };
  qrImg.src = "/qr.png";

  function newCanvas(h) {
    const cv = document.createElement("canvas");
    cv.width = W * SCALE; cv.height = h * SCALE;
    const x = cv.getContext("2d");
    x.scale(SCALE, SCALE);
    return { cv, x };
  }

  // 纸底 + 细纸纹
  function paper(x, h) {
    x.fillStyle = C.paper; x.fillRect(0, 0, W, h);
    x.save();
    for (let i = 0; i < 2600; i++) {
      x.fillStyle = `rgba(31,29,26,${Math.random() * 0.035})`;
      x.fillRect(Math.random() * W, Math.random() * h, 1.4, 1.4);
    }
    x.restore();
  }

  function text(x, s, px, py, { font = SERIF, size = 16, color = C.ink, align = "left", weight = "", ls = 0 } = {}) {
    x.font = `${weight} ${size}px ${font}`.trim();
    x.fillStyle = color; x.textAlign = ls ? "left" : align; x.textBaseline = "alphabetic";
    if (!ls) { x.fillText(s, px, py); return; }
    // 手工字距
    const chars = [...s];
    const total = chars.reduce((a, c) => a + x.measureText(c).width + ls, -ls);
    let cx = align === "center" ? px - total / 2 : align === "right" ? px - total : px;
    for (const c of chars) { x.fillText(c, cx, py); cx += x.measureText(c).width + ls; }
  }

  function seal(x, cx, cy, r = 30) {
    x.save();
    x.translate(cx, cy); x.rotate(-3 * Math.PI / 180);
    x.strokeStyle = C.seal; x.lineWidth = 2.5;
    x.strokeRect(-r, -r, r * 2, r * 2);
    text(x, "觀", 0, -3, { size: 21, color: C.seal, align: "center", weight: "700" });
    text(x, "命", 0, 21, { size: 21, color: C.seal, align: "center", weight: "700" });
    x.restore();
  }

  function header(x, sub) {
    text(x, "观命", W / 2 - 26, 78, { size: 40, weight: "700", align: "center", ls: 12 });
    x.fillStyle = C.seal; x.fillRect(W / 2 + 44, 50, 34, 34);
    text(x, "命", W / 2 + 61, 74, { size: 15, color: C.paper, align: "center" });
    text(x, sub, W / 2, 112, { size: 15, color: C.hint, align: "center", font: SANS, ls: 4 });
    x.strokeStyle = "rgba(31,29,26,.3)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(80, 136); x.lineTo(W - 80, 136); x.stroke();
    x.beginPath(); x.moveTo(80, 140); x.lineTo(W - 80, 140); x.stroke();
  }

  function footer(x, h) {
    const top = h - 152;
    x.strokeStyle = C.line; x.lineWidth = 1;
    x.beginPath(); x.moveTo(60, top); x.lineTo(W - 60, top); x.stroke();
    // 左侧文案
    text(x, "扫码免费排盘", 66, top + 52, { size: 22, color: C.ink, weight: "700", ls: 2 });
    text(x, "bazi.daimeng1129.org", 66, top + 84, { size: 16, color: C.inkSoft, font: SANS, ls: 1 });
    text(x, "无需注册 · 支持真太阳时校正", 66, top + 112, { size: 13, color: C.hint, font: SANS, ls: 1 });
    // 右侧二维码
    if (qrReady) {
      const s = 96, qx = W - 66 - s, qy = top + 26;
      x.fillStyle = "#fff"; x.fillRect(qx - 5, qy - 5, s + 10, s + 10);
      x.drawImage(qrImg, qx, qy, s, s);
    }
  }

  // ---------- 命盘分享图 ----------
  function chartPoster(c) {
    const H = 1130;
    const { cv, x } = newCanvas(H);
    paper(x, H);
    header(x, "八字四柱 · 真太阳时排盘");

    // 深色命书面板
    const py = 172, ph = 430;
    const g = x.createLinearGradient(0, py, W, py + ph);
    g.addColorStop(0, C.pine); g.addColorStop(1, C.pine2);
    x.fillStyle = g; x.fillRect(40, py, W - 80, ph);
    x.strokeStyle = "rgba(237,228,207,.2)"; x.lineWidth = 1;
    x.strokeRect(50, py + 10, W - 100, ph - 20);

    // 命书头部信息
    const cal = c.calendar || {}, lunar = cal.lunar || {};
    const dm = c.dayMaster;
    text(x, `生肖属${cal.zodiac || "—"} · 日主 ${dm.char}${EL_CN[dm.element]}(${dm.polarity === "yang" ? "阳" : "阴"})`,
      W / 2, py + 46, { size: 17, color: "rgba(237,228,207,.8)", align: "center" });
    const tst = c.solarTimeInfo || {};
    text(x, `农历 ${lunar.year || ""} 年 ${lunar.month || ""} 月 ${lunar.day || ""} 日` +
      (tst.trueSolarTime ? ` · 真太阳时 ${tst.trueSolarTime}` : ""),
      W / 2, py + 74, { size: 13, color: "rgba(237,228,207,.5)", align: "center", font: SANS });
    x.strokeStyle = "rgba(237,228,207,.22)"; x.setLineDash([4, 4]);
    x.beginPath(); x.moveTo(80, py + 96); x.lineTo(W - 80, py + 96); x.stroke();
    x.setLineDash([]);

    // 四柱
    const names = { year: "年柱", month: "月柱", day: "日柱", hour: "时柱" };
    const keys = ["year", "month", "day", "hour"];
    const colW = (W - 100) / 4, x0 = 50;
    keys.forEach((k, i) => {
      const p = c.pillars[k], cx = x0 + colW * i + colW / 2;
      if (i > 0) {
        x.strokeStyle = "rgba(237,228,207,.14)"; x.lineWidth = 1;
        x.beginPath(); x.moveTo(x0 + colW * i, py + 118); x.lineTo(x0 + colW * i, py + ph - 30); x.stroke();
      }
      text(x, names[k], cx, py + 140, { size: 12, color: "rgba(237,228,207,.45)", align: "center", font: SANS, ls: 3 });
      text(x, p.stemTenGod || "", cx, py + 166, { size: 13, color: "rgba(237,228,207,.62)", align: "center", font: SANS });
      text(x, p.stem, cx, py + 224, { size: 50, color: C.elLight[p.element], align: "center", weight: "700" });
      text(x, p.branch, cx, py + 282, { size: 50, color: C.elLight[p.branchElement], align: "center", weight: "700" });
      (p.hiddenStems || []).slice(0, 3).forEach((hs, j) => {
        text(x, `${hs.stem}·${hs.tenGod}`, cx, py + 312 + j * 20,
          { size: 12, color: "rgba(237,228,207,.55)", align: "center", font: SANS });
      });
      text(x, p.naYin || "", cx, py + 392, { size: 12, color: "rgba(237,228,207,.45)", align: "center", font: SANS });
    });
    seal(x, W - 92, py + ph - 58, 28);

    // 五行分布
    let yy = py + ph + 56;
    text(x, "五行分布", 60, yy, { size: 19, weight: "700", ls: 4 });
    x.strokeStyle = "rgba(31,29,26,.3)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(60, yy + 14); x.lineTo(W - 60, yy + 14); x.stroke();
    yy += 48;
    const cnt = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    keys.forEach(k => {
      const p = c.pillars[k];
      cnt[p.element]++; cnt[p.branchElement]++;
      (p.hiddenStems || []).forEach(h => { if (!h.isMain) cnt[h.element] += 0.5; });
    });
    const max = Math.max(...Object.values(cnt), 1);
    Object.entries(cnt).forEach(([el, n], i) => {
      const ry = yy + i * 42;
      text(x, EL_CN[el], 62, ry + 6, { size: 20, color: C.el[el], weight: "700" });
      x.fillStyle = "rgba(31,29,26,.09)"; x.fillRect(100, ry - 6, W - 220, 9);
      x.fillStyle = C.el[el]; x.fillRect(100, ry - 6, (W - 220) * (n / max), 9);
      text(x, String(n % 1 ? n.toFixed(1) : n), W - 62, ry + 4, { size: 15, color: C.hint, align: "right", font: SANS });
    });

    // 当前大运
    const cyc = (c.daYun && c.daYun.cycles) || [];
    const nowY = new Date().getFullYear();
    const cur = cyc.find(d => nowY >= d.startYear && nowY <= d.endYear);
    if (cur) {
      const dy = yy + 5 * 42 + 26;
      text(x, `当前大运  ${cur.ganZhi}  ${cur.startAge}-${cur.endAge} 岁  ${cur.stemTenGod}`,
        W / 2, dy, { size: 16, color: C.inkSoft, align: "center" });
    }

    footer(x, H);
    return cv.toDataURL("image/png");
  }

  // ---------- 合婚分享图 ----------
  function hehunPoster(a, b, r) {
    const H = 1160;
    const { cv, x } = newCanvas(H);
    paper(x, H);
    header(x, "八字合婚 · 契合度测算");

    // 深色分数面板
    const py = 172, ph = 300;
    const g = x.createLinearGradient(0, py, W, py + ph);
    g.addColorStop(0, C.pine); g.addColorStop(1, C.pine2);
    x.fillStyle = g; x.fillRect(40, py, W - 80, ph);
    x.strokeStyle = "rgba(237,228,207,.2)"; x.lineWidth = 1;
    x.strokeRect(50, py + 10, W - 100, ph - 20);

    text(x, "契合度", W / 2, py + 58, { size: 14, color: "rgba(237,228,207,.55)", align: "center", font: SANS, ls: 6 });
    text(x, String(r.score), W / 2 - 14, py + 146, { size: 78, color: C.elLight.fire, align: "center", weight: "700" });
    text(x, "分", W / 2 + 62, py + 146, { size: 20, color: C.elLight.fire, align: "center" });
    // 分数条
    x.fillStyle = "rgba(237,228,207,.16)"; x.fillRect(W / 2 - 130, py + 176, 260, 4);
    x.fillStyle = C.elLight.fire; x.fillRect(W / 2 - 130, py + 176, 260 * (r.score / 100), 4);
    // 结论(两行内)
    const words = r.verdict.replace(/。$/, "").split("");
    let line = "", lines = [];
    x.font = `15px ${SERIF}`;
    for (const w of words) {
      if (x.measureText(line + w).width > W - 180) { lines.push(line); line = w; }
      else line += w;
      if (lines.length === 2) break;
    }
    if (lines.length < 2 && line) lines.push(line);
    const truncated = lines.length === 2 && line && !lines.includes(line);
    lines.slice(0, 2).forEach((l, i) => {
      const s = (i === 1 && truncated) ? l + "…" : l;
      text(x, s, W / 2, py + 214 + i * 26, { size: 15, color: "rgba(237,228,207,.82)", align: "center" });
    });

    // 双方四柱
    const yy = py + ph + 52;
    const gz = c => ["year", "month", "day", "hour"].map(k => c.pillars[k].ganZhi);
    [[a, "你", W / 4 + 10], [b, "对方", W * 3 / 4 - 10]].forEach(([c, label, cx]) => {
      text(x, label, cx, yy, { size: 14, color: C.hint, align: "center", font: SANS, ls: 4 });
      gz(c).forEach((s, i) => {
        text(x, s, cx, yy + 44 + i * 40, { size: 24, color: C.ink, align: "center" });
      });
      const cal = c.calendar || {};
      text(x, `日主 ${c.dayMaster.char}${EL_CN[c.dayMaster.element]} · 属${cal.zodiac || "—"}`,
        cx, yy + 216, { size: 13, color: C.hint, align: "center", font: SANS });
    });
    x.strokeStyle = C.line; x.lineWidth = 1;
    x.beginPath(); x.moveTo(W / 2, yy - 16); x.lineTo(W / 2, yy + 230); x.stroke();

    // 首项分析摘要
    if (r.items && r.items[0]) {
      const it = r.items[0];
      const ty = yy + 274;
      text(x, it.title.replace(/<[^>]+>/g, ""), 60, ty, { size: 16, weight: "700", color: C.seal });
      const plain = it.text.replace(/<[^>]+>/g, "");
      x.font = `14px ${SERIF}`;
      let ln = "", ls2 = [];
      for (const ch of plain) {
        if (x.measureText(ln + ch).width > W - 130) { ls2.push(ln); ln = ch; }
        else ln += ch;
        if (ls2.length === 3) break;
      }
      if (ls2.length < 3 && ln) ls2.push(ln);
      ls2.slice(0, 3).forEach((l, i) => {
        text(x, l + (i === 2 ? "…" : ""), 60, ty + 30 + i * 26, { size: 14, color: C.inkSoft });
      });
    }
    seal(x, W - 92, H - 208, 28);
    footer(x, H);
    return cv.toDataURL("image/png");
  }

  // ---------- 日主人格分享图 ----------
  function rigePoster(d) {
    const H = 1000;
    const { cv, x } = newCanvas(H);
    paper(x, H);
    header(x, "日主人格 · 你是哪一种人");

    const el = d.dayMaster.element;
    const py = 172, ph = 470;
    const g = x.createLinearGradient(0, py, W, py + ph);
    g.addColorStop(0, C.pine); g.addColorStop(1, C.pine2);
    x.fillStyle = g; x.fillRect(40, py, W - 80, ph);
    x.strokeStyle = "rgba(237,228,207,.2)"; x.lineWidth = 1;
    x.strokeRect(50, py + 10, W - 100, ph - 20);

    text(x, "你 的 日 主", W / 2, py + 60, { size: 14, color: "rgba(237,228,207,.5)", align: "center", font: SANS, ls: 6 });
    text(x, d.dayMaster.char, W / 2, py + 208, { size: 150, color: C.elLight[el], align: "center", weight: "700" });
    text(x, `${d.dayMaster.char}${EL_CN[el]} · ${d.dayMaster.polarity === "yang" ? "阳" : "阴"}`,
      W / 2, py + 254, { size: 24, color: C.paper, align: "center", ls: 4 });
    text(x, d.image || "", W / 2, py + 288, { size: 15, color: "rgba(237,228,207,.6)", align: "center", font: SANS, ls: 3 });

    // 标签
    const tags = (d.tags || []).slice(0, 4);
    x.font = `13px ${SANS}`;
    const tw = tags.map(t => x.measureText(t).width + 26);
    const totalW = tw.reduce((a, b) => a + b, 0) + (tags.length - 1) * 10;
    let tx = W / 2 - totalW / 2;
    tags.forEach((t, i) => {
      x.strokeStyle = "rgba(237,228,207,.35)"; x.lineWidth = 1;
      x.strokeRect(tx, py + 318, tw[i], 32);
      text(x, t, tx + tw[i] / 2, py + 339, { size: 13, color: "rgba(237,228,207,.85)", align: "center", font: SANS });
      tx += tw[i] + 10;
    });

    text(x, `日柱 ${d.dayPillar}　生肖属${d.zodiac || "—"}`,
      W / 2, py + 396, { size: 14, color: "rgba(237,228,207,.5)", align: "center", font: SANS });
    seal(x, W - 92, py + ph - 56, 26);

    // 性格摘要
    const plain = (d.person || "").replace(/<[^>]+>/g, "");
    x.font = `15px ${SERIF}`;
    let ln = "", lines = [];
    for (const ch of plain) {
      if (x.measureText(ln + ch).width > W - 130) { lines.push(ln); ln = ch; }
      else ln += ch;
      if (lines.length === 4) break;
    }
    if (lines.length < 4 && ln) lines.push(ln);
    lines.slice(0, 4).forEach((l, i) => {
      text(x, l, 66, py + ph + 58 + i * 30, { size: 15, color: C.inkSoft });
    });

    footer(x, H);
    return cv.toDataURL("image/png");
  }

  // ---------- 弹层:展示图片,长按保存 / 点击下载 ----------
  function show(dataUrl, filename) {
    let ov = document.getElementById("share-overlay");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "share-overlay";
      ov.innerHTML = `
        <div class="share-box">
          <p class="share-tip">长按图片即可保存到相册</p>
          <img id="share-img" alt="命盘分享图">
          <div class="share-acts">
            <a id="share-dl" class="share-btn">下载图片</a>
            <button id="share-close" class="share-btn ghost-btn">关闭</button>
          </div>
        </div>`;
      document.body.appendChild(ov);
      ov.addEventListener("click", e => { if (e.target === ov) ov.style.display = "none"; });
      ov.querySelector("#share-close").onclick = () => { ov.style.display = "none"; };
    }
    ov.querySelector("#share-img").src = dataUrl;
    const dl = ov.querySelector("#share-dl");
    dl.href = dataUrl; dl.download = filename;
    ov.style.display = "flex";
  }

  return { chartPoster, hehunPoster, rigePoster, show };
})();

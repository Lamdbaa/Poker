import React, { useState, useEffect, useRef } from "react";

/* ==================================================================
   Compteur de jetons — poker maison
   ================================================================== */

const T = {
  rail: "#2A1A12",
  feltHi: "#1C5642",
  felt: "#0E3227",
  feltLow: "#071B15",
  ink: "#04100C",
  line: "rgba(245,239,226,.15)",
  lineSoft: "rgba(245,239,226,.08)",
  ivory: "#F5EFE2",
  muted: "#93AFA2",
  brass: "#D9A441",
  brassLow: "#8A5F1E",
  clay: "#A63D33",
};

const SEATS = [
  "#E8DFCB", "#C4453B", "#3E76A8", "#4E9C6B", "#D98A32",
  "#8E6BB5", "#D9C04A", "#3F9E97", "#CE7B99", "#7E8C86",
];

const DENOMS = [
  [500, "#6B4A96"], [100, "#22221F"], [25, "#2F7A52"],
  [10, "#33628F"], [5, "#B4413A"], [1, "#E8DFCB"],
];

const DISPLAY = "'Bodoni Moda', Didot, 'Times New Roman', serif";
const UI = "'Karla', 'Avenir Next', system-ui, -apple-system, sans-serif";
const NUM = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' };

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")";

const STREETS = ["Pré-flop", "Flop", "Turn", "River"];
const KEY = "poker:table";

/* Sauvegarde locale. Utilise le stockage de l'hôte s'il existe,
   sinon celui du navigateur : la partie survit à une fermeture. */
const store = {
  async load() {
    if (typeof window === "undefined") return null;
    if (window.storage && window.storage.get) {
      try {
        const r = await window.storage.get(KEY);
        if (r && r.value) return r.value;
      } catch { /* clé absente */ }
    }
    try { return window.localStorage.getItem(KEY); } catch { return null; }
  },
  async save(value) {
    if (typeof window === "undefined") return;
    if (window.storage && window.storage.set) {
      try { await window.storage.set(KEY, value); } catch { /* on retombe en local */ }
    }
    try { window.localStorage.setItem(KEY, value); } catch { /* stockage plein ou bloqué */ }
  },
};

const seatColor = (p) => SEATS[p.id % SEATS.length];

/* ------------------------------------------------------------- styles */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,700;6..96,900&family=Karla:wght@400;500;600;700&display=swap');
* { -webkit-tap-highlight-color: transparent; }
button:focus-visible, input:focus-visible {
  outline: 2px solid ${T.brass};
  outline-offset: 2px;
}
@keyframes potflash { 0% { filter: brightness(1); } 35% { filter: brightness(1.6); } 100% { filter: brightness(1); } }
@keyframes dealin { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.seat-in { animation: dealin .26s ease both; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
`;

/* -------------------------------------------------------------- icônes */
/* Jeu d'icônes dessiné pour cette app : cartes, jetons, actions de table. */

const ICONS = {
  spade: "<path d=\"M12 2.6c0 0-7.4 6-7.4 10.6a3.9 3.9 0 0 0 6.6 2.8c-.1 2.3-1 4-2.4 4.9h6.4c-1.4-.9-2.3-2.6-2.4-4.9a3.9 3.9 0 0 0 6.6-2.8C19.4 8.6 12 2.6 12 2.6z\" fill=\"currentColor\"/>",
  heart: "<path d=\"M12 20.6 3.9 12.4a5 5 0 0 1 7.1-7.1l1 1 1-1a5 5 0 1 1 7.1 7.1z\" fill=\"currentColor\"/>",
  diamond: "<path d=\"M12 2.4 20.4 12 12 21.6 3.6 12z\" fill=\"currentColor\"/>",
  club: "<g fill=\"currentColor\"><circle cx=\"12\" cy=\"7\" r=\"3.5\"/><circle cx=\"7.4\" cy=\"13.4\" r=\"3.5\"/><circle cx=\"16.6\" cy=\"13.4\" r=\"3.5\"/><path d=\"M10.6 13.5h2.8c-.1 3.2.6 5.6 2.2 7.4H8.4c1.6-1.8 2.3-4.2 2.2-7.4z\"/></g>",
  chip: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"><circle cx=\"12\" cy=\"12\" r=\"8.6\"/><circle cx=\"12\" cy=\"12\" r=\"4.6\"/><path d=\"M12 3.4v2.1M12 18.5v2.1M3.4 12h2.1M18.5 12h2.1M6 6l1.5 1.5M16.5 16.5 18 18M18 6l-1.5 1.5M7.5 16.5 6 18\" stroke-linecap=\"round\"/></g>",
  chips: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><ellipse cx=\"12\" cy=\"17.4\" rx=\"7.4\" ry=\"3\"/><path d=\"M4.6 17.4v-3.2M19.4 17.4v-3.2\"/><ellipse cx=\"12\" cy=\"14.2\" rx=\"7.4\" ry=\"3\"/><path d=\"M4.6 14.2V11M19.4 14.2V11\"/><ellipse cx=\"12\" cy=\"11\" rx=\"7.4\" ry=\"3\"/></g>",
  raise: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><ellipse cx=\"12\" cy=\"18.5\" rx=\"6.8\" ry=\"2.7\"/><path d=\"M5.2 18.5v-2.8M18.8 18.5v-2.8\"/><ellipse cx=\"12\" cy=\"15.7\" rx=\"6.8\" ry=\"2.7\"/><path d=\"M12 11.6V3.2M12 3.2 8.9 6.4M12 3.2l3.1 3.2\"/></g>",
  allin: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><ellipse cx=\"7.6\" cy=\"16.8\" rx=\"5.2\" ry=\"2.3\"/><path d=\"M2.4 16.8v-4.6M12.8 16.8v-4.6\"/><ellipse cx=\"7.6\" cy=\"12.2\" rx=\"5.2\" ry=\"2.3\"/><path d=\"M15.4 11.2h5.4M18.2 8.4l2.8 2.8-2.8 2.8\"/></g>",
  fold: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\"><rect x=\"2.8\" y=\"5.4\" width=\"8.2\" height=\"11.6\" rx=\"1.7\"/><rect x=\"12\" y=\"8.6\" width=\"8.2\" height=\"11.6\" rx=\"1.7\" transform=\"rotate(42 16.1 14.4)\"/></g>",
  skip: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5.6 6.6 11 12l-5.4 5.4M12.4 6.6 17.8 12l-5.4 5.4\"/></g>",
  next: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4.6 12h13.2M13.6 7.4l4.6 4.6-4.6 4.6\"/></g>",
  flag: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 21V3.6\"/><path d=\"M6 4.4h11.4l-2.3 4 2.3 4H6z\"/></g>",
  undo: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4.4 8.6h6.2M4.4 8.6V2.8\"/><path d=\"M4.9 8.2a8 8 0 1 1-1.2 6.4\"/></g>",
  crown: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.4 7.6 6.6 15h10.8l3.2-7.4-5 3.2L12 4.4 8.4 10.8z\"/><path d=\"M6.6 18.4h10.8\"/></g>",
  plus: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\"><path d=\"M12 5.4v13.2M5.4 12h13.2\"/></g>",
  close: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\"><path d=\"M6.6 6.6l10.8 10.8M17.4 6.6 6.6 17.4\"/></g>",
  tune: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"><path d=\"M4.4 8h9.2M17.6 8h2M4.4 16h2.8M11.2 16h8.4\"/><circle cx=\"15.6\" cy=\"8\" r=\"2.2\"/><circle cx=\"9\" cy=\"16\" r=\"2.2\"/></g>",
  restart: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M19.6 5.4v5.2h-5.2\"/><path d=\"M19.1 10.2a7.8 7.8 0 1 0-1.4 6.8\"/></g>",
  seat: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"8.2\" r=\"3.6\"/><path d=\"M4.8 20c.9-3.7 3.7-5.6 7.2-5.6s6.3 1.9 7.2 5.6\"/></g>",
  grip: "<g fill=\"currentColor\"><circle cx=\"9\" cy=\"6\" r=\"1.55\"/><circle cx=\"15\" cy=\"6\" r=\"1.55\"/><circle cx=\"9\" cy=\"12\" r=\"1.55\"/><circle cx=\"15\" cy=\"12\" r=\"1.55\"/><circle cx=\"9\" cy=\"18\" r=\"1.55\"/><circle cx=\"15\" cy=\"18\" r=\"1.55\"/></g>",
  deal: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\"><rect x=\"2.8\" y=\"7.4\" width=\"8.6\" height=\"12.2\" rx=\"1.8\" transform=\"rotate(-14 7 13.5)\"/><rect x=\"12.4\" y=\"4.4\" width=\"8.6\" height=\"12.2\" rx=\"1.8\" transform=\"rotate(9 16.7 10.5)\"/></g>",
};

function Icon({ name, size = 18, style }) {
  const body = ICONS[name];
  if (!body) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

/* Le bouton du donneur, tel qu'il existe sur une vraie table. */
function DealerButton({ size = 21 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Donneur" style={{ display: "block", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill="#F5EFE2" />
      <circle cx="12" cy="12" r="8.8" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="1.1" />
      <text x="12" y="16.1" textAnchor="middle" fontFamily="Bodoni Moda, Didot, serif" fontSize="11" fontWeight="700" fill="#1A1208">D</text>
    </svg>
  );
}

function BlindMark({ amount, big }) {
  return (
    <span
      title={big ? "Grosse blind" : "Petite blind"}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, color: big ? T.brass : "rgba(217,164,65,.72)" }}
    >
      <Icon name="chip" size={big ? 17 : 14} />
      <span style={{ fontSize: 12, fontWeight: 700, ...NUM }}>{amount}</span>
    </span>
  );
}

function SuitRow({ size = 13, opacity = 0.5 }) {
  return (
    <span style={{ display: "inline-flex", gap: 11, opacity, color: T.ivory }}>
      <Icon name="spade" size={size} />
      <Icon name="heart" size={size} />
      <Icon name="club" size={size} />
      <Icon name="diamond" size={size} />
    </span>
  );
}

/* --------------------------------------------------------- primitives */

function Btn({ children, onClick, tone = "quiet", disabled, style, full, size = "md", icon }) {
  const pads = { sm: "9px 12px", md: "15px 16px", lg: "18px 16px" };
  const sizes = { sm: 14, md: 16, lg: 18 };
  const tones = {
    primary: {
      bg: `linear-gradient(${T.brass}, #BE8B2C)`,
      bd: "#E9C270",
      sh: "inset 0 1px 0 rgba(255,255,255,.45), 0 2px 10px rgba(0,0,0,.35)",
      col: "#241703",
    },
    solid: { bg: "rgba(245,239,226,.07)", col: T.ivory, bd: T.line, sh: "none" },
    quiet: { bg: "transparent", col: T.ivory, bd: T.lineSoft, sh: "none" },
    danger: { bg: "transparent", col: "#D98277", bd: "rgba(217,130,119,.32)", sh: "none" },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: t.bg,
        color: t.col,
        border: `1px solid ${t.bd}`,
        boxShadow: t.sh,
        borderRadius: 13,
        padding: pads[size],
        fontFamily: UI,
        fontSize: sizes[size],
        fontWeight: 600,
        letterSpacing: ".01em",
        width: full ? "100%" : undefined,
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? "default" : "pointer",
        transition: "transform .08s ease, opacity .15s ease",
        ...NUM,
        ...style,
      }}
      onPointerDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(.975)"; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = "none"; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = "none"; }}
    >
      {icon ? (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
          <Icon name={icon} size={size === "sm" ? 15 : 18} />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function Field({ value, onChange, width = 86, align = "right", big }) {
  return (
    <input
      value={value}
      inputMode="numeric"
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      style={{
        width,
        background: "rgba(0,0,0,.32)",
        color: T.ivory,
        border: `1px solid ${T.line}`,
        borderRadius: 10,
        padding: "11px 12px",
        fontFamily: big ? DISPLAY : UI,
        fontSize: big ? 22 : 16,
        fontWeight: 600,
        textAlign: align,
        boxSizing: "border-box",
        ...NUM,
      }}
    />
  );
}

function chipsFor(amount, max) {
  const out = [];
  let rest = amount;
  for (const [v, c] of DENOMS) {
    while (rest >= v && out.length < max) { out.push(c); rest -= v; }
  }
  return out;
}

/* Une pile de jetons vue de trois quarts. */
function ChipStack({ amount, w = 17, max = 6 }) {
  const list = chipsFor(amount, max);
  if (!list.length) return null;
  const h = Math.round(w * 0.44);
  return (
    <span style={{ display: "inline-flex", flexDirection: "column-reverse", alignItems: "center" }}>
      {list.map((c, i) => (
        <span
          key={i}
          style={{
            width: w,
            height: h,
            marginTop: i ? -Math.round(h * 0.62) : 0,
            borderRadius: "50%",
            background: `linear-gradient(${c}, rgba(0,0,0,.55))`,
            border: "1px solid rgba(0,0,0,.5)",
            boxShadow: `inset 0 ${Math.max(1, h * 0.18)}px 0 rgba(255,255,255,.28)`,
          }}
        />
      ))}
    </span>
  );
}

function PotPile({ amount }) {
  const list = chipsFor(amount, 18);
  const cols = [[], [], []];
  list.forEach((c, i) => cols[i % 3].push(c));
  return (
    <span style={{ display: "inline-flex", gap: 5, alignItems: "flex-end" }}>
      {cols.map((col, i) =>
        col.length ? (
          <span key={i} style={{ display: "inline-flex", flexDirection: "column-reverse" }}>
            {col.map((c, j) => (
              <span
                key={j}
                style={{
                  width: 26,
                  height: 11,
                  marginTop: j ? -7 : 0,
                  borderRadius: "50%",
                  background: `linear-gradient(${c}, rgba(0,0,0,.6))`,
                  border: "1px solid rgba(0,0,0,.55)",
                  boxShadow: "inset 0 2px 0 rgba(255,255,255,.26)",
                }}
              />
            ))}
          </span>
        ) : null
      )}
    </span>
  );
}

function useCountUp(value) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { from.current = value; setShown(value); return; }
    const t0 = performance.now();
    let raf;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 420);
      const e = 1 - Math.pow(1 - k, 3);
      const cur = Math.round(start + (value - start) * e);
      setShown(cur);
      from.current = cur;
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return shown;
}

/* -------------------------------------------------------- game helpers */

const seated = (ps) => ps.filter((p) => !p.out);
const inHand = (ps) => ps.filter((p) => !p.out && !p.folded);
const potOf = (ps) => ps.reduce((s, p) => s + p.committed, 0);
const playable = (p) => !p.out && !p.folded && !p.allIn;

/* Total engagé par le joueur à tapis, sinon null. Tant qu'il y en a un dans le
   coup, les autres ne peuvent que suivre ce montant : plus aucune relance. */
function capOf(ps) {
  const shoved = ps.filter((p) => !p.out && !p.folded && p.allIn);
  return shoved.length ? Math.max(...shoved.map((p) => p.committed)) : null;
}

function nextIdx(ps, from, ok) {
  for (let i = 1; i <= ps.length; i++) {
    const j = (from + i) % ps.length;
    if (ok(ps[j])) return j;
  }
  return -1;
}

function reorder(g, from, to) {
  const keys = ["dealer", "turn", "sb_i", "bb_i"];
  const held = {};
  keys.forEach((k) => { held[k] = g.players[g[k]] ? g.players[g[k]].id : null; });
  const ps = [...g.players];
  const [moved] = ps.splice(from, 1);
  ps.splice(to, 0, moved);
  const out = { ...g, players: ps };
  keys.forEach((k) => {
    const i = ps.findIndex((p) => p.id === held[k]);
    if (i >= 0) out[k] = i;
  });
  return out;
}

/* Un seul pot, jamais de pot secondaire : dès qu'un joueur est à tapis la mise
   est plafonnée à son montant, donc personne ne peut engager davantage. Un
   joueur trop court pour suivre met ce qu'il lui reste et reste dans le pot. */
function computePots(ps) {
  const amount = potOf(ps);
  if (amount <= 0) return [];
  const contenders = inHand(ps).map((p) => p.id);
  const eligible = contenders.length ? contenders : seated(ps).map((p) => p.id);
  return [{ amount, eligible, key: 0, winners: eligible.length === 1 ? [...eligible] : [] }];
}

function freshHand(g) {
  const ps = g.players.map((p) => ({
    ...p, bet: 0, committed: 0, folded: false, allIn: false, out: p.stack <= 0,
  }));
  const before = {};
  g.players.forEach((p) => { before[p.id] = p.stack; });

  if (seated(ps).length < 2) {
    return { ...g, players: ps, screen: "between", before, message: "Il faut au moins deux joueurs avec des jetons pour distribuer." };
  }

  const dealer = ps[g.dealer] && !ps[g.dealer].out ? g.dealer : nextIdx(ps, g.dealer || 0, (p) => !p.out);
  let sb, bb;
  if (seated(ps).length === 2) {
    sb = dealer;
    bb = nextIdx(ps, dealer, (p) => !p.out);
  } else {
    sb = nextIdx(ps, dealer, (p) => !p.out);
    bb = nextIdx(ps, sb, (p) => !p.out);
  }

  const post = (i, amt) => {
    const p = ps[i];
    const paid = Math.min(amt, p.stack);
    p.stack -= paid; p.bet = paid; p.committed = paid;
    if (p.stack === 0) p.allIn = true;
  };
  post(sb, g.sb);
  post(bb, g.bb);

  const t = nextIdx(ps, bb, playable);
  return {
    ...g,
    players: ps,
    dealer, sb_i: sb, bb_i: bb,
    street: 0,
    currentBet: Math.max(g.bb, ps[bb].bet),
    turn: t === -1 ? dealer : t,
    screen: "hand",
    pots: null,
    before,
    message: null,
  };
}

function afterAction(g) {
  const t = nextIdx(g.players, g.turn, playable);
  return { ...g, turn: t === -1 ? g.turn : t };
}

function nextStreet(g) {
  const ps = g.players.map((p) => ({ ...p, bet: 0 }));
  const t = nextIdx(ps, g.dealer, playable);
  return { ...g, players: ps, street: g.street + 1, currentBet: 0, turn: t === -1 ? g.turn : t };
}

function bet(g, turn, amount) {
  const c = g.players.map((p) => ({ ...p }));
  const p = c[turn];
  const paid = Math.max(0, Math.min(amount, p.stack));
  p.stack -= paid; p.bet += paid; p.committed += paid;
  if (p.stack === 0) p.allIn = true;
  return { ...g, players: c, currentBet: Math.max(g.currentBet, paid) };
}

function blankSetup() {
  return {
    screen: "setup",
    players: [0, 1, 2].map((i) => ({ id: i, name: `Joueur ${i + 1}`, stack: 100 })),
    dealer: 0, sb: 1, bb: 2, seed: 100,
  };
}

/* ------------------------------------------------------------------ app */

export default function App() {
  const [g, setG] = useState(null);
  const [hist, setHist] = useState([]);
  const [raising, setRaising] = useState(null);
  const [tweak, setTweak] = useState(false);
  const loaded = useRef(false);

  const latest = useRef(null);

  useEffect(() => {
    (async () => {
      const raw = await store.load();
      let saved = null;
      try { saved = raw ? JSON.parse(raw) : null; } catch { saved = null; }
      setG(saved && saved.players ? saved : blankSetup());
      loaded.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current || !g) return;
    latest.current = JSON.stringify(g);
    store.save(latest.current);
  }, [g]);

  /* Filet de sécurité : on réécrit la partie quand l'app passe en arrière-plan,
     moment où iOS peut la vider de la mémoire sans prévenir. */
  useEffect(() => {
    const flush = () => { if (latest.current) store.save(latest.current); };
    window.addEventListener("pagehide", flush);
    window.addEventListener("visibilitychange", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("visibilitychange", flush);
    };
  }, []);

  const push = (next) => {
    setHist((h) => [...h.slice(-40), g]);
    setG(next);
    setRaising(null);
  };
  const undo = () => {
    if (!hist.length) return;
    setG(hist[hist.length - 1]);
    setHist((h) => h.slice(0, -1));
    setRaising(null);
  };

  if (!g) {
    return <Shell><p style={{ color: T.muted, fontFamily: UI, padding: 30, textAlign: "center" }}>On installe la table…</p></Shell>;
  }

  return (
    <Shell>
      {g.screen === "setup" && <Setup g={g} setG={setG} />}
      {g.screen === "hand" && <Hand g={g} push={push} raising={raising} setRaising={setRaising} undo={undo} canUndo={!!hist.length} />}
      {g.screen === "showdown" && <Showdown g={g} push={push} undo={undo} canUndo={!!hist.length} />}
      {g.screen === "between" && <Between g={g} push={push} setG={setG} tweak={tweak} setTweak={setTweak} undo={undo} canUndo={!!hist.length} />}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(130% 90% at 50% 0%, #0B2620 0%, ${T.ink} 70%)`,
        fontFamily: UI,
        color: T.ivory,
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <style>{CSS}</style>
      <div style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, opacity: 0.05, pointerEvents: "none" }} />
      <div style={{ position: "relative", maxWidth: 460, margin: "0 auto", paddingBottom: 40 }}>{children}</div>
    </div>
  );
}

/* Le feutre incurvé avec son liseré de bois. */
function Felt({ children, tight }) {
  return (
    <div
      style={{
        position: "relative",
        padding: tight ? "26px 20px 24px" : "30px 20px 30px",
        borderRadius: "0 0 50% 50% / 0 0 78px 78px",
        background: `radial-gradient(120% 150% at 50% -20%, ${T.feltHi} 0%, ${T.felt} 55%, ${T.feltLow} 100%)`,
        borderBottom: `9px solid ${T.rail}`,
        boxShadow: `inset 0 -26px 50px rgba(0,0,0,.4), 0 12px 26px rgba(0,0,0,.45)`,
        textAlign: "center",
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", backgroundImage: GRAIN, opacity: 0.07, pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- setup */

function Setup({ g, setG }) {
  const set = (patch) => setG({ ...g, ...patch });
  const edit = (i, patch) => set({ players: g.players.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  const add = () => {
    if (g.players.length >= 10) return;
    const id = Math.max(...g.players.map((p) => p.id)) + 1;
    set({ players: [...g.players, { id, name: `Joueur ${g.players.length + 1}`, stack: g.seed || 100 }] });
  };
  const ready = g.players.every((p) => p.stack > 0 && p.name.trim()) && g.sb > 0 && g.bb > 0;

  return (
    <>
      <Felt tight>
        <div style={{ fontFamily: DISPLAY, fontSize: 42, fontWeight: 900, letterSpacing: "-.01em", lineHeight: 1 }}>
          La table
        </div>
        <div style={{ color: T.muted, fontSize: 14.5, marginTop: 8 }}>
          Deux à dix joueurs, chacun avec son tapis
        </div>
        <div style={{ marginTop: 16 }}><SuitRow size={15} opacity={0.42} /></div>
      </Felt>

      <div style={{ padding: "24px 16px 0" }}>
        <div style={{ display: "grid", gap: 9 }}>
          {g.players.map((p, i) => (
            <div key={p.id} className="seat-in" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 6, height: 38, borderRadius: 3, background: seatColor(p), flexShrink: 0 }} />
              <input
                value={p.name}
                onChange={(e) => edit(i, { name: e.target.value })}
                style={{
                  flex: 1, minWidth: 0, background: "rgba(245,239,226,.05)", color: T.ivory,
                  border: `1px solid ${T.lineSoft}`, borderRadius: 11, padding: "12px 13px",
                  fontFamily: UI, fontSize: 16, boxSizing: "border-box",
                }}
              />
              <Field value={String(p.stack)} onChange={(v) => edit(i, { stack: Number(v || 0) })} width={78} />
              <button
                onClick={() => g.players.length > 2 && set({ players: g.players.filter((_, j) => j !== i) })}
                disabled={g.players.length <= 2}
                aria-label={`Retirer ${p.name}`}
                style={{
                  background: "none", border: "none", color: T.muted,
                  padding: "6px 2px", display: "flex", alignItems: "center",
                  cursor: g.players.length > 2 ? "pointer" : "default",
                  opacity: g.players.length > 2 ? 1 : 0.25,
                }}
              >
                <Icon name="close" size={17} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <Btn onClick={add} disabled={g.players.length >= 10} full icon="seat">Ajouter un joueur</Btn>
        </div>

        <div style={{ height: 1, background: T.lineSoft, margin: "26px 0 20px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: T.muted, fontSize: 15, flex: 1 }}>Petite blind</span>
          <Field value={String(g.sb)} onChange={(v) => set({ sb: Number(v || 0) })} width={72} />
          <span style={{ color: T.muted, fontSize: 15 }}>Grosse</span>
          <Field value={String(g.bb)} onChange={(v) => set({ bb: Number(v || 0) })} width={72} />
        </div>

        <p style={{ color: T.muted, fontSize: 15, margin: "24px 0 10px" }}>Qui distribue la première main ?</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {g.players.map((p, i) => (
            <Btn key={p.id} size="sm" tone={g.dealer === i ? "primary" : "quiet"} onClick={() => set({ dealer: i })}>
              {p.name || "sans nom"}
            </Btn>
          ))}
        </div>

        <div style={{ marginTop: 26 }}>
          <Btn tone="primary" size="lg" full disabled={!ready} icon="deal" onClick={() => setG(freshHand(g))}>
            Distribuer
          </Btn>
        </div>
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- hand */

function Hand({ g, push, raising, setRaising, undo, canUndo }) {
  const ps = g.players;
  const me = ps[g.turn];
  const pot = potOf(ps);
  const shownPot = useCountUp(pot);
  const alive = inHand(ps);
  const canPlay = playable(me);

  /* Face à un tapis, on ne complète que jusqu'au plafond, jamais au-delà. */
  const cap = capOf(ps);
  const toCall = cap === null
    ? Math.min(g.currentBet, me.stack)
    : Math.max(0, Math.min(cap - me.committed, me.stack));
  const minRaise = g.currentBet + 1;
  const maxRaise = me.stack;

  const fold = () => {
    const c = ps.map((p) => ({ ...p }));
    c[g.turn].folded = true;
    push(afterAction({ ...g, players: c }));
  };
  const put = (amount) => push(afterAction(bet(g, g.turn, amount)));
  const call = () => put(toCall);
  const check = () => push(afterAction({ ...g }));
  const raiseTo = (amount) => put(Math.min(Math.max(minRaise, amount), maxRaise));
  const allIn = () => put(me.stack);
  const finish = () => push({ ...g, screen: "showdown", pots: computePots(ps) });

  /* --- déplacement des sièges par appui long --- */
  const listRef = useRef(null);
  const press = useRef(null);
  const startY = useRef(0);
  const dragged = useRef(false);
  const [drag, setDrag] = useState(null);

  const cancelPress = () => { clearTimeout(press.current); press.current = null; };

  const holdStart = (i) => (e) => {
    dragged.current = false;
    startY.current = e.clientY;
    cancelPress();
    press.current = setTimeout(() => {
      const rows = listRef.current ? Array.from(listRef.current.children) : [];
      const heights = rows.map((r) => r.getBoundingClientRect().height + 8);
      dragged.current = true;
      setDrag({ from: i, to: i, y0: startY.current, dy: 0, heights });
      if (navigator.vibrate) navigator.vibrate(12);
    }, 320);
  };
  const holdMove = (e) => {
    if (!drag && press.current && Math.abs(e.clientY - startY.current) > 10) cancelPress();
  };

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      e.preventDefault();
      const dy = e.clientY - drag.y0;
      const h = drag.heights;
      let to = drag.from, acc = 0;
      if (dy > 0) {
        for (let j = drag.from + 1; j < h.length; j++) {
          if (dy > acc + h[j] / 2) { to = j; acc += h[j]; } else break;
        }
      } else {
        for (let j = drag.from - 1; j >= 0; j--) {
          if (-dy > acc + h[j] / 2) { to = j; acc += h[j]; } else break;
        }
      }
      setDrag((d) => (d ? { ...d, dy, to } : d));
    };
    const onUp = () => {
      if (drag.to !== drag.from) push(reorder(g, drag.from, drag.to));
      setDrag(null);
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [drag, g]);

  const shift = (i) => {
    if (!drag) return 0;
    if (i === drag.from) return drag.dy;
    if (drag.to > drag.from && i > drag.from && i <= drag.to) return -drag.heights[drag.from];
    if (drag.to < drag.from && i >= drag.to && i < drag.from) return drag.heights[drag.from];
    return 0;
  };
  const pick = (i) => {
    if (dragged.current) { dragged.current = false; return; }
    push({ ...g, turn: i });
  };

  return (
    <>
      <Felt>
        <div style={{ color: T.muted, fontSize: 13.5, letterSpacing: ".04em" }}>
          {STREETS[g.street] || `Tour ${g.street + 1}`} · blinds {g.sb}/{g.bb}
        </div>
        <div
          key={pot}
          style={{
            fontFamily: DISPLAY, fontSize: 72, fontWeight: 900, lineHeight: 1.02,
            color: T.brass, margin: "4px 0 2px",
            textShadow: "0 2px 12px rgba(217,164,65,.28)",
            animation: "potflash .5s ease",
            ...NUM,
          }}
        >
          {shownPot}
        </div>
        <div style={{ color: T.muted, fontSize: 14 }}>
          jetons dans le pot{cap !== null
            ? ` · tapis à ${cap}`
            : g.currentBet > 0 ? ` · ${g.currentBet} pour suivre` : " · personne n'a misé"}
        </div>
        <div style={{ marginTop: 14, minHeight: 26 }}><PotPile amount={pot} /></div>
      </Felt>

      <div style={{ padding: "20px 16px 0" }}>
        <div
          ref={listRef}
          onPointerMove={holdMove}
          onPointerUp={cancelPress}
          onPointerCancel={cancelPress}
          style={{ display: "grid", gap: 8, touchAction: drag ? "none" : "auto" }}
        >
          {ps.map((p, i) => (
            <Seat
              key={p.id}
              p={p}
              i={i}
              g={g}
              active={i === g.turn}
              onPick={playable(p) ? () => pick(i) : null}
              onPointerDown={holdStart(i)}
              lifted={!!drag && drag.from === i}
              offset={shift(i)}
              settling={!drag}
            />
          ))}
        </div>

        <p style={{ color: T.muted, fontSize: 12.5, textAlign: "center", margin: "12px 0 18px", opacity: 0.75 }}>
          Appui court pour donner la parole, appui long pour déplacer un siège
        </p>

        {alive.length <= 1 ? (
          <Panel>
            <p style={{ margin: "0 0 14px", fontSize: 16, lineHeight: 1.45 }}>
              {alive.length === 1
                ? `${alive[0].name} est seul en lice. Le pot lui revient.`
                : "Tout le monde s'est couché."}
            </p>
            <Btn tone="primary" size="lg" full icon="flag" onClick={finish}>Terminer la main</Btn>
          </Panel>
        ) : !canPlay ? (
          <Panel>
            <p style={{ margin: "0 0 14px", fontSize: 16, lineHeight: 1.45, color: T.muted }}>
              {me.name} ne peut plus miser. Touche un joueur pour lui donner la parole.
            </p>
            <Btn full icon="next" onClick={() => push(nextStreet(g))}>Tour d'enchères suivant</Btn>
          </Panel>
        ) : (
          <Panel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
              <span style={{ width: 7, height: 24, borderRadius: 4, background: seatColor(me), alignSelf: "center" }} />
              <span style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 700, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {me.name}
              </span>
              <span style={{ color: T.muted, fontSize: 14.5, ...NUM }}>
                {me.bet > 0 ? `${me.bet} misés · ` : ""}{me.stack} en réserve
              </span>
            </div>

            {raising === null ? (
              <div style={{ display: "grid", gap: 9 }}>
                <Btn tone="primary" size="lg" full icon={toCall > 0 ? "chips" : "skip"} onClick={toCall > 0 ? call : check}>
                  {toCall > 0 ? `Suivre ${toCall}` : "Checker"}
                </Btn>
                {cap === null ? (
                  <div style={{ display: "flex", gap: 9 }}>
                    <Btn tone="solid" full icon="raise" disabled={maxRaise <= g.currentBet}
                      onClick={() => setRaising(String(Math.min(Math.max(minRaise, g.bb), maxRaise)))}>
                      Relancer
                    </Btn>
                    <Btn tone="solid" full icon="allin" onClick={allIn}>{maxRaise}</Btn>
                  </div>
                ) : (
                  <p style={{ margin: "2px 0", color: T.muted, fontSize: 13.5, lineHeight: 1.4, ...NUM }}>
                    Tapis à {cap} : on suit ce montant ou on se couche, plus de relance.
                  </p>
                )}
                <div style={{ display: "flex", gap: 9 }}>
                  {toCall > 0 && <Btn full icon="skip" onClick={check}>Passer</Btn>}
                  <Btn tone="danger" full icon="fold" onClick={fold}>Se coucher</Btn>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Field value={raising} onChange={setRaising} width={112} align="center" big />
                  <span style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.35, ...NUM }}>
                    la mise passe de {g.currentBet} à {Math.min(Number(raising) || 0, maxRaise)}, chacun devra suivre ce montant
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[minRaise, g.currentBet * 2, Math.min(pot, maxRaise), maxRaise]
                    .filter((v, i, a) => v >= minRaise && v <= maxRaise && a.indexOf(v) === i)
                    .map((v) => (
                      <Btn key={v} size="sm" onClick={() => setRaising(String(v))}>{v}</Btn>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 9 }}>
                  <Btn full onClick={() => setRaising(null)}>Retour</Btn>
                  <Btn tone="primary" full disabled={(Number(raising) || 0) < minRaise} onClick={() => raiseTo(Number(raising))}>
                    Relancer
                  </Btn>
                </div>
              </div>
            )}
          </Panel>
        )}

        <div style={{ display: "flex", gap: 9, marginTop: 12 }}>
          <Btn full size="sm" icon="next" onClick={() => push(nextStreet(g))}>Tour suivant</Btn>
          <Btn full size="sm" icon="flag" onClick={finish}>Terminer la main</Btn>
        </div>
        <UndoLink undo={undo} canUndo={canUndo} />
      </div>
    </>
  );
}

function Panel({ children }) {
  return (
    <div
      style={{
        background: "linear-gradient(rgba(245,239,226,.06), rgba(245,239,226,.03))",
        border: `1px solid ${T.line}`,
        borderRadius: 20,
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,.35)",
      }}
    >
      {children}
    </div>
  );
}

function UndoLink({ undo, canUndo }) {
  return (
    <button
      onClick={undo}
      disabled={!canUndo}
      style={{
        display: "block", margin: "16px auto 0", background: "none", border: "none",
        color: T.muted, fontFamily: UI, fontSize: 14,
        opacity: canUndo ? 1 : 0.3,
        cursor: canUndo ? "pointer" : "default",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
        <Icon name="undo" size={15} />
        Annuler la dernière action
      </span>
    </button>
  );
}

function Seat({ p, i, g, active, onPick, onPointerDown, lifted, offset = 0, settling }) {
  const dim = p.folded || p.out;
  const marks = [];
  if (i === g.dealer) marks.push(<DealerButton key="d" />);
  if (i === g.sb_i) marks.push(<BlindMark key="sb" amount={g.sb} />);
  if (i === g.bb_i) marks.push(<BlindMark key="bb" amount={g.bb} big />);
  return (
    <div
      onClick={onPick || undefined}
      onPointerDown={onPointerDown}
      style={{
        display: "flex", alignItems: "center", gap: 11,
        padding: "11px 13px",
        borderRadius: 15,
        background: active
          ? "linear-gradient(rgba(217,164,65,.16), rgba(217,164,65,.05))"
          : "rgba(245,239,226,.04)",
        border: `1px solid ${lifted ? T.ivory : active ? "rgba(217,164,65,.55)" : T.lineSoft}`,
        boxShadow: lifted ? "0 14px 30px rgba(0,0,0,.5)" : active ? "0 0 20px rgba(217,164,65,.1)" : "none",
        opacity: dim ? 0.4 : 1,
        transform: `translateY(${offset}px) scale(${lifted ? 1.03 : 1})`,
        transition: lifted ? "none" : settling ? "transform .2s ease, opacity .2s" : "transform .13s ease",
        position: "relative",
        zIndex: lifted ? 5 : 1,
        cursor: onPick ? "pointer" : "default",
        touchAction: "manipulation",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <Icon name="grip" size={15} style={{ color: seatColor(p), opacity: 0.75 }} />
        <span style={{ width: 5, height: 34, borderRadius: 3, background: seatColor(p), boxShadow: "0 0 8px rgba(0,0,0,.4)" }} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 16.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          textDecoration: p.folded ? "line-through" : "none",
        }}>
          {p.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, height: 21 }}>
          {marks}
          {p.allIn && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#D98277", fontSize: 12.5, fontWeight: 600 }}>
              <Icon name="allin" size={15} /> tapis
            </span>
          )}
          {p.folded && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: T.muted, fontSize: 12.5 }}>
              <Icon name="fold" size={14} /> couché
            </span>
          )}
        </div>
      </div>

      {p.bet > 0 && (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ChipStack amount={p.bet} />
          <span style={{ color: T.brass, fontSize: 14.5, fontWeight: 700, ...NUM }}>{p.bet}</span>
        </span>
      )}

      <span style={{ fontFamily: DISPLAY, fontSize: 23, fontWeight: 700, minWidth: 46, textAlign: "right", ...NUM }}>
        {p.stack}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------- showdown */

function Showdown({ g, push, undo, canUndo }) {
  const [pots, setPots] = useState(g.pots || []);
  const byId = (id) => g.players.find((p) => p.id === id);
  const total = pots.reduce((s, p) => s + p.amount, 0);

  const toggle = (key, id) =>
    setPots(pots.map((pot) =>
      pot.key !== key ? pot : {
        ...pot,
        winners: pot.winners.includes(id) ? pot.winners.filter((w) => w !== id) : [...pot.winners, id],
      }
    ));

  const ready = pots.length > 0 && pots.every((p) => p.winners.length > 0);

  const distribute = () => {
    const players = g.players.map((p) => ({ ...p, bet: 0, committed: 0 }));
    const clockwise = players.map((_, i) => players[(g.dealer + 1 + i) % players.length]);
    for (const pot of pots) {
      const winners = clockwise.filter((p) => pot.winners.includes(p.id));
      if (!winners.length) continue;
      const share = Math.floor(pot.amount / winners.length);
      let rest = pot.amount - share * winners.length;
      winners.forEach((w) => {
        const target = players.find((p) => p.id === w.id);
        target.stack += share + (rest-- > 0 ? 1 : 0);
      });
    }
    push({
      ...g,
      players,
      screen: "between",
      dealer: nextIdx(players, g.dealer, (p) => p.stack > 0),
      pots: null,
      message: null,
    });
  };

  return (
    <>
      <Felt tight>
        <div style={{ color: T.muted, fontSize: 13.5, letterSpacing: ".04em" }}>Fin des enchères</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: 900, lineHeight: 1.1, margin: "6px 0 4px" }}>
          Qui remporte le coup ?
        </div>
        <div style={{ color: T.muted, fontSize: 14 }}>
          {total} jetons à distribuer
        </div>
      </Felt>

      <div style={{ padding: "22px 16px 0" }}>
        <p style={{ color: T.muted, fontSize: 14.5, margin: "0 0 16px", lineHeight: 1.45 }}>
          Touche le gagnant. Plusieurs joueurs sélectionnés partagent le pot à parts égales.
        </p>

        {pots.length === 0 && (
          <Panel>
            <p style={{ margin: 0, fontSize: 16 }}>Personne n'a misé, il n'y a rien à distribuer.</p>
          </Panel>
        )}

        <div style={{ display: "grid", gap: 14 }}>
          {pots.map((pot) => (
            <Panel key={pot.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 14.5, color: T.muted }}>Le pot</span>
                <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <ChipStack amount={pot.amount} w={19} max={5} />
                  <span style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 900, color: T.brass, ...NUM }}>
                    {pot.amount}
                  </span>
                </span>
              </div>
              <div style={{ display: "grid", gap: 7 }}>
                {pot.eligible.map((id) => {
                  const p = byId(id);
                  const won = pot.winners.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggle(pot.key, id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%",
                        padding: "11px 12px", borderRadius: 13, cursor: "pointer",
                        fontFamily: UI, fontSize: 16, fontWeight: 600, textAlign: "left",
                        color: won ? "#241703" : T.ivory,
                        background: won ? `linear-gradient(${T.brass}, #BE8B2C)` : "rgba(245,239,226,.05)",
                        border: `1px solid ${won ? "#E9C270" : T.lineSoft}`,
                        boxShadow: won ? "inset 0 1px 0 rgba(255,255,255,.4)" : "none",
                        transition: "background .15s ease",
                      }}
                    >
                      <span style={{ width: 6, height: 22, borderRadius: 3, background: seatColor(p), flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{p.name}</span>
                      {won && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, ...NUM }}>
                          <Icon name="crown" size={16} />
                          +{Math.floor(pot.amount / pot.winners.length)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Panel>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <Btn tone="primary" size="lg" full icon="chips" disabled={!ready && pots.length > 0} onClick={distribute}>
            Distribuer les jetons
          </Btn>
        </div>
        <UndoLink undo={undo} canUndo={canUndo} />
      </div>
    </>
  );
}

/* -------------------------------------------------------------- between */

function Between({ g, push, setG, tweak, setTweak, undo, canUndo }) {
  const [armed, setArmed] = useState(false);
  const ranked = [...g.players].sort((a, b) => b.stack - a.stack);
  const delta = (p) => (g.before && g.before[p.id] !== undefined ? p.stack - g.before[p.id] : 0);
  const best = Math.max(...g.players.map((p) => p.stack), 1);

  const addPlayer = () => {
    if (g.players.length >= 10) return;
    const id = Math.max(...g.players.map((p) => p.id)) + 1;
    setG({ ...g, players: [...g.players, { id, name: `Joueur ${g.players.length + 1}`, stack: g.seed || 100 }] });
  };

  return (
    <>
      <Felt tight>
        <div style={{ color: T.muted, fontSize: 13.5, letterSpacing: ".04em" }}>Entre deux mains</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: 900, margin: "6px 0 2px" }}>
          Les tapis
        </div>
        <div style={{ color: T.muted, fontSize: 14 }}>
          {g.players.find((p) => p.stack > 0) ? `${g.players[g.dealer] ? g.players[g.dealer].name : ""} distribue la prochaine` : ""}
        </div>
      </Felt>

      <div style={{ padding: "22px 16px 0" }}>
        <div style={{ display: "grid", gap: 8 }}>
          {ranked.map((p) => {
            const d = delta(p);
            return (
              <div
                key={p.id}
                style={{
                  position: "relative", overflow: "hidden",
                  display: "flex", alignItems: "center", gap: 11,
                  padding: "12px 13px", borderRadius: 15,
                  background: "rgba(245,239,226,.04)",
                  border: `1px solid ${T.lineSoft}`,
                  opacity: p.stack === 0 ? 0.45 : 1,
                }}
              >
                <span
                  style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: `${Math.round((p.stack / best) * 100)}%`,
                    background: `linear-gradient(90deg, ${seatColor(p)}22, transparent)`,
                    pointerEvents: "none",
                  }}
                />
                <span style={{ width: 6, height: 30, borderRadius: 3, background: seatColor(p), flexShrink: 0, position: "relative" }} />
                {tweak ? (
                  <>
                    <span style={{ flex: 1, fontSize: 16, position: "relative" }}>{p.name}</span>
                    <Field
                      value={String(p.stack)}
                      onChange={(v) => setG({ ...g, players: g.players.map((q) => (q.id === p.id ? { ...q, stack: Number(v || 0) } : q)) })}
                      width={84}
                    />
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontSize: 16.5, fontWeight: 600, position: "relative", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                      {p.stack === 0 && <span style={{ color: T.muted, fontSize: 13, fontWeight: 400 }}> · à sec</span>}
                    </span>
                    {d !== 0 && (
                      <span style={{ position: "relative", color: d > 0 ? T.brass : "#D98277", fontSize: 14.5, fontWeight: 700, ...NUM }}>
                        {d > 0 ? `+${d}` : d}
                      </span>
                    )}
                    <ChipStack amount={p.stack} w={16} max={5} />
                    <span style={{ position: "relative", fontFamily: DISPLAY, fontSize: 25, fontWeight: 700, minWidth: 50, textAlign: "right", ...NUM }}>
                      {p.stack}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {g.message && (
          <p style={{ color: "#D98277", fontSize: 14.5, marginTop: 16, lineHeight: 1.45 }}>{g.message}</p>
        )}

        <div style={{ display: "grid", gap: 10, marginTop: 22 }}>
          <Btn tone="primary" size="lg" full icon="deal" onClick={() => push(freshHand(g))}>Main suivante</Btn>
          <div style={{ display: "flex", gap: 9 }}>
            <Btn full size="sm" icon="tune" onClick={() => setTweak(!tweak)}>
              {tweak ? "Terminer les ajustements" : "Ajuster un tapis"}
            </Btn>
            {tweak && <Btn full size="sm" icon="seat" onClick={addPlayer} disabled={g.players.length >= 10}>Ajouter un joueur</Btn>}
          </div>
          <Btn tone="danger" size="sm" full icon="restart" onClick={() => (armed ? setG(blankSetup()) : setArmed(true))}>
            {armed ? "Confirmer : effacer la partie" : "Nouvelle partie"}
          </Btn>
        </div>
        <UndoLink undo={undo} canUndo={canUndo} />
      </div>
    </>
  );
}

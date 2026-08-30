'use strict';

/**
 * Colour maths shared by the palette-experiment scripts.
 *
 * sRGB for contrast (that is what WCAG is defined in) and Oklch for anything
 * perceptual -- hue, chroma, and the distance between two inks. Kept in one
 * place so `npm run string` and `npm run constant` cannot disagree about what
 * "close" means.
 */

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
const hex = (r) =>
  '#' + r.map((v) => Math.round(v).toString(16).padStart(2, '0').toUpperCase()).join('');

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

const relLum = (h) => {
  const c = rgb(h).map((x) => toLinear(x / 255));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

const contrast = (a, b) => {
  const [x, y] = [relLum(a), relLum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

function oklch(h) {
  const [r, g, b] = rgb(h).map((c) => toLinear(c / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C: Math.hypot(A, B), H };
}

/** Oklch -> linear sRGB. Any channel outside [0,1] means the colour is out of gamut. */
function oklchToLinear({ L, C, H }) {
  const A = C * Math.cos((H * Math.PI) / 180);
  const B = C * Math.sin((H * Math.PI) / 180);
  const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
  const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
  const s = Math.pow(L - 0.0894841775 * A - 1.291485548 * B, 3);
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Oklch -> hex, walking chroma down until the colour fits in sRGB. */
function oklchToHex({ L, C, H }) {
  let c = C;
  for (let i = 0; i < 300; i++) {
    const v = oklchToLinear({ L, C: c, H });
    if (v.every((x) => x >= -0.0005 && x <= 1.0005)) break;
    c -= C / 300;
    if (c < 0) c = 0;
  }
  return hex(oklchToLinear({ L, C: c, H }).map((v) => toSrgb(Math.min(1, Math.max(0, v))) * 255));
}

/**
 * The same colour re-solved for a different ground: hue and chroma are kept and
 * only lightness moves, until the contrast against `bg` hits `target`.
 *
 * Lightness is scanned rather than bisected because contrast is monotone in L
 * in opposite directions on light and dark grounds -- a bisection has to know
 * which way it is going, and getting that backwards silently returns black.
 */
function forGround(ink, bg, target) {
  const { C, H } = oklch(ink);
  let best = null;
  let err = Infinity;
  for (let i = 0; i <= 1000; i++) {
    const candidate = oklchToHex({ L: i / 1000, C, H });
    const e = Math.abs(contrast(candidate, bg) - target);
    if (e < err) {
      err = e;
      best = candidate;
    }
  }
  return best;
}

/** Shortest angular distance between two hues, in degrees. */
const hueGap = (a, b) => {
  const d = Math.abs(oklch(a).H - oklch(b).H) % 360;
  return d > 180 ? 360 - d : d;
};

/**
 * Perceptual distance in Oklab. The single number worth watching: hue and
 * weight trade off against each other, and either one alone can look fine while
 * the pair is still indistinguishable on screen.
 */
const distance = (a, b) => {
  const p = (h) => {
    const o = oklch(h);
    return [o.L, o.C * Math.cos((o.H * Math.PI) / 180), o.C * Math.sin((o.H * Math.PI) / 180)];
  };
  const [x, y] = [p(a), p(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};

/** Below this, two inks read as the same colour in running code. */
const TOO_CLOSE = 0.075;

module.exports = { rgb, hex, contrast, oklch, oklchToHex, forGround, hueGap, distance, TOO_CLOSE };

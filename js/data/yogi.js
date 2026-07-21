// Parametric cartoon "yogi" — one SVG character posed per asana archetype via
// forward-kinematics joint angles. Zero dependencies, tiny, fully offline,
// covers all 525 poses by mapping each to its closest of ~40 pose shapes.
//
// Angle convention: degrees measured from the +x axis, clockwise in SVG's
// y-down space. down = 90, up = -90, right = 0, left = 180.

const DEG = Math.PI / 180;

// Skeleton segment lengths (in a 100x120 viewBox).
const LEN = { torso: 26, head: 11, upperArm: 13, foreArm: 12, thigh: 15, shin: 14 };

function pt(x, y, angleDeg, len) {
  return [x + Math.cos(angleDeg * DEG) * len, y + Math.sin(angleDeg * DEG) * len];
}

/**
 * A pose shape defines the root (hip) position and joint angles.
 * armL/armR = [shoulderAngle, elbowAngle]; legL/legR = [hipAngle, kneeAngle].
 * torso = angle from hip to shoulders (up = -90). headTilt offsets the head.
 */
const SHAPES = {
  // ---- Standing ----
  standing:      { root:[50,74], torso:-90, armL:[100,95], armR:[80,85], legL:[95,92], legR:[85,88] },
  mountain:      { root:[50,74], torso:-90, armL:[97,92], armR:[83,88], legL:[92,90], legR:[88,90] },
  tree:          { root:[50,74], torso:-90, armL:[-70,-60], armR:[-110,-120], legL:[90,90], legR:[140,60] },
  chair:         { root:[50,78], torso:-70, armL:[-55,-60], armR:[-58,-62], legL:[110,55], legR:[112,58] },
  warrior1:      { root:[50,76], torso:-88, armL:[-80,-85], armR:[-100,-95], legL:[125,150], legR:[75,80] },
  warrior2:      { root:[50,74], torso:-90, armL:[0,5], armR:[180,175], legL:[120,150], legR:[70,72] },
  warrior3:      { root:[52,64], torso:-10, armL:[10,8], armR:[10,8], legL:[95,92], legR:[185,182] },
  triangle:      { root:[50,72], torso:-45, armL:[-45,-45], armR:[135,135], legL:[110,110], legR:[72,74] },
  star:          { root:[50,72], torso:-90, armL:[-35,-30], armR:[-145,-150], legL:[115,112], legR:[65,68] },
  standingFold:  { root:[50,70], torso:45, armL:[80,90], armR:[100,90], legL:[92,90], legR:[88,90] },
  standingBack:  { root:[50,76], torso:-110, armL:[-120,-130], armR:[-60,-50], legL:[92,90], legR:[88,90] },
  sideAngle:     { root:[50,74], torso:-50, armL:[-50,-55], armR:[130,150], legL:[120,150], legR:[70,72] },
  halfMoon:      { root:[55,60], torso:5, armL:[-90,-90], armR:[90,90], legL:[5,8], legR:[95,92] },
  dancer:        { root:[50,72], torso:-70, armL:[-60,-70], armR:[-70,-80], legL:[90,90], legR:[-40,-120] },
  eagle:         { root:[50,76], torso:-85, armL:[-80,-40], armR:[-85,-45], legL:[100,80], legR:[105,120] },
  goddess:       { root:[50,78], torso:-90, armL:[-40,-90], armR:[-140,-90], legL:[120,120], legR:[60,60] },
  lunge:         { root:[50,78], torso:-80, armL:[-85,-88], armR:[-95,-92], legL:[125,160], legR:[60,70] },
  standingSplit: { root:[50,68], torso:60, armL:[85,90], armR:[95,90], legL:[95,92], legR:[-70,-70] },

  // ---- Balance / arm ----
  plank:         { root:[42,70], torso:5, armL:[95,90], armR:[95,90], legL:[5,3], legR:[5,3] },
  sidePlank:     { root:[42,70], torso:8, armL:[95,90], armR:[-90,-90], legL:[8,6], legR:[8,6] },
  boat:          { root:[50,80], torso:-40, armL:[-40,-42], armR:[-40,-42], legL:[-42,-40], legR:[-42,-40] },
  crow:          { root:[48,74], torso:20, armL:[90,88], armR:[90,88], legL:[35,120], legR:[35,120] },
  table:         { root:[45,74], torso:2, armL:[90,90], armR:[90,90], legL:[90,88], legR:[90,88] },

  // ---- Seated ----
  seated:        { root:[50,82], torso:-90, armL:[70,80], armR:[110,100], legL:[35,150], legR:[145,30] },
  butterfly:     { root:[50,84], torso:-88, armL:[60,90], armR:[120,90], legL:[25,150], legR:[155,30] },
  staff:         { root:[50,82], torso:-90, armL:[85,88], armR:[95,92], legL:[10,6], legR:[10,6] },
  seatedFold:    { root:[50,82], torso:-20, armL:[10,10], armR:[10,10], legL:[8,6], legR:[8,6] },
  seatedTwist:   { root:[50,82], torso:-88, armL:[150,160], armR:[-10,20], legL:[35,150], legR:[130,120] },
  cowFace:       { root:[50,82], torso:-90, armL:[-95,-150], armR:[70,150], legL:[30,150], legR:[150,30] },
  lotus:         { root:[50,84], torso:-90, armL:[60,70], armR:[120,110], legL:[20,150], legR:[160,30] },
  hero:          { root:[50,82], torso:-90, armL:[80,85], armR:[100,95], legL:[110,150], legR:[70,30] },
  squat:         { root:[50,84], torso:-80, armL:[-50,-70], armR:[-130,-110], legL:[120,150], legR:[60,30] },

  // ---- Prone / backbend ----
  cobra:         { root:[42,84], torso:-35, armL:[110,90], armR:[110,90], legL:[8,4], legR:[8,4] },
  sphinx:        { root:[42,84], torso:-25, armL:[120,80], armR:[120,80], legL:[6,3], legR:[6,3] },
  locust:        { root:[45,84], torso:-15, armL:[30,20], armR:[30,20], legL:[-10,-6], legR:[-10,-6] },
  bow:           { root:[46,84], torso:-30, armL:[-10,-40], armR:[-10,-40], legL:[-30,-90], legR:[-30,-90] },
  bridge:        { root:[50,78], torso:-140, armL:[100,90], armR:[100,90], legL:[110,60], legR:[110,60] },
  camel:         { root:[50,78], torso:-120, armL:[-30,-20], armR:[-30,-20], legL:[100,95], legR:[100,95] },
  wheel:         { root:[50,80], torso:-135, armL:[130,120], armR:[130,120], legL:[70,60], legR:[70,60] },
  cat:           { root:[45,76], torso:8, armL:[90,90], armR:[90,90], legL:[92,90], legR:[92,90] },
  cow:           { root:[45,78], torso:-4, armL:[90,90], armR:[90,90], legL:[88,90], legR:[88,90] },
  downDog:       { root:[52,64], torso:35, armL:[35,32], armR:[35,32], legL:[130,128], legR:[130,128] },
  dolphin:       { root:[52,66], torso:35, armL:[60,90], armR:[60,90], legL:[128,126], legR:[128,126] },
  child:         { root:[48,80], torso:20, armL:[25,20], armR:[25,20], legL:[120,150], legR:[120,150] },
  puppy:         { root:[48,74], torso:25, armL:[30,25], armR:[30,25], legL:[92,90], legR:[92,90] },

  // ---- Supine / restorative / inverted ----
  savasana:      { root:[50,84], torso:0, armL:[70,72], armR:[110,108], legL:[8,6], legR:[8,6] },
  happyBaby:     { root:[50,84], torso:-40, armL:[-40,-30], armR:[-140,-150], legL:[-50,-140], legR:[-130,-40] },
  legsUp:        { root:[50,86], torso:2, armL:[75,78], armR:[105,102], legL:[-88,-90], legR:[-92,-88] },
  recTwist:      { root:[50,84], torso:0, armL:[0,5], armR:[180,175], legL:[-60,-120], legR:[-60,-120] },
  shoulderstand: { root:[50,88], torso:-88, armL:[70,110], armR:[110,70], legL:[-90,-90], legR:[-90,-90] },
  plow:          { root:[50,86], torso:-70, armL:[80,80], armR:[100,100], legL:[-120,-150], legR:[-120,-150] },
  headstand:     { root:[50,50], torso:90, armL:[-60,-90], armR:[-120,-90], legL:[-88,-90], legR:[-92,-88] },
  handstand:     { root:[50,48], torso:90, armL:[-88,-90], armR:[-92,-90], legL:[-90,-90], legR:[-90,-90] },
  fish:          { root:[50,84], torso:-160, armL:[80,82], armR:[100,98], legL:[8,6], legR:[8,6] },
};

// Keyword → shape resolver. First explicit id/keyword match wins, else category.
const ID_SHAPE = {
  'mountain-pose':'mountain','tree-pose':'tree','chair-pose':'chair','warrior-1':'warrior1',
  'warrior-2':'warrior2','warrior-3':'warrior3','triangle-pose':'triangle','star-pose':'star',
  'downward-dog':'downDog','down-dog':'downDog','cobra-pose':'cobra','hissing-cobra':'cobra',
  'child-pose':'child','childs-pose':'child','boat-pose':'boat','bridge-pose':'bridge',
  'butterfly-pose':'butterfly','cat-pose':'cat','cow-pose':'cow','camel-pose':'camel',
  'plank-pose':'plank','side-plank':'sidePlank','dancer-pose':'dancer','eagle-pose':'eagle',
  'half-moon':'halfMoon','dolphin-pose':'dolphin','headstand':'headstand','handstand':'handstand',
  'shoulderstand':'shoulderstand','plow-pose':'plow','legs-up-the-wall':'legsUp',
  'happy-baby':'happyBaby','corpse-pose':'savasana','starfish-sleep':'savasana','fish-pose':'fish',
  'lotus-pose':'lotus','half-lotus':'lotus','hero-pose':'hero','staff-pose':'staff',
  'seated-forward-fold':'seatedFold','standing-forward-fold':'standingFold','goddess-pose':'goddess',
  'crow-pose':'crow','bow-pose':'bow','locust-pose':'locust','sphinx-pose':'sphinx',
  'garland-pose':'squat','malasana':'squat','cow-face':'cowFace','wheel-pose':'wheel',
};
const KEYWORD_SHAPE = [
  [/head\s?stand|sirsasana/i,'headstand'], [/hand\s?stand/i,'handstand'],
  [/shoulder\s?stand|sarvang/i,'shoulderstand'], [/plow|halasana/i,'plow'],
  [/legs?\s?up|viparita/i,'legsUp'], [/savasana|corpse|starfish sleep|rest|sleep|relax|cocoon|snowman/i,'savasana'],
  [/happy\s?baby/i,'happyBaby'], [/wheel|urdhva danura/i,'wheel'], [/bridge/i,'bridge'],
  [/camel|ustrasana/i,'camel'], [/bow|danurasana/i,'bow'], [/locust|salabhasana|superman|superhero/i,'locust'],
  [/cobra|bhujang|snake|seal/i,'cobra'], [/sphinx/i,'sphinx'], [/cat/i,'cat'], [/cow face|gomukh/i,'cowFace'],
  [/cow/i,'cow'], [/down.*dog|puppy|adho mukha svan/i,'downDog'], [/dolphin/i,'dolphin'],
  [/child|quiet mouse|mouse/i,'child'], [/plank/i,'plank'], [/side plank|vasisth/i,'sidePlank'],
  [/boat|navasana|see.?saw/i,'boat'], [/crow|crane|bakasana|firefly|eight.?angle/i,'crow'],
  [/table|bird.?dog/i,'table'], [/butterfly|baddha kona|bound angle/i,'butterfly'],
  [/lotus|padmasana/i,'lotus'], [/hero|virasana|thunderbolt|rock pose|drummer|storyteller/i,'hero'],
  [/staff|dandasana/i,'staff'], [/squat|garland|malasana|frog|rocket|volcano/i,'squat'],
  [/seated.*(twist)|twist.*seat|marichi|bharadvaj/i,'seatedTwist'], [/twist|revolved|washing|helicopter/i,'seatedTwist'],
  [/seated.*fold|head.?to.?knee|paschim/i,'seatedFold'], [/seated|easy pose|sukhasana|meditat|criss/i,'seated'],
  [/tree|vriksh|flamingo|stork|stand.*one/i,'tree'], [/chair|utkatasana/i,'chair'],
  [/warrior\s?1|virabhadrasana i\b|crescent|high lunge/i,'warrior1'],
  [/warrior\s?2|virabhadrasana ii/i,'warrior2'], [/warrior\s?3|airplane|jet|airplane/i,'warrior3'],
  [/triangle|trikona/i,'triangle'], [/star|jumping jack/i,'star'], [/side angle|parsvakona/i,'sideAngle'],
  [/half moon|ardha chandra/i,'halfMoon'], [/dancer|natarajasana/i,'dancer'],
  [/eagle|garudasana/i,'eagle'], [/goddess|utkata kona/i,'goddess'],
  [/lunge|anjaneyasana|runner|surfer|skier/i,'lunge'], [/split/i,'standingSplit'],
  [/forward.*fold|rag doll|touch.*toe|elephant|sleepy bear|fold/i,'standingFold'],
  [/backbend|reach for the sun|rainbow|standing back/i,'standingBack'],
  [/fish|matsyasana|jellyfish/i,'fish'], [/mountain|tadasana|tall|robot|statue|soldier/i,'mountain'],
];
const CATEGORY_SHAPE = {
  standing:'mountain', seated:'seated', balance:'tree', backbend:'cobra',
  'forward-fold':'standingFold', twist:'seatedTwist', core:'boat', inversion:'downDog',
  'animal-play':'cat', 'partner-group':'tree', restorative:'savasana', 'warmup-fun':'star',
};

export function shapeFor(pose) {
  if (pose.shape && SHAPES[pose.shape]) return pose.shape;
  if (ID_SHAPE[pose.id]) return ID_SHAPE[pose.id];
  const hay = `${pose.english} ${pose.animalName || ''}`;
  for (const [re, s] of KEYWORD_SHAPE) if (re.test(hay)) return s;
  return CATEGORY_SHAPE[pose.category] || 'standing';
}

// Cute animal accents drawn on the head for animal poses.
const ANIMAL_FACE = {
  lion:{ ears:'round', color:'#f4a261', extra:'mane' }, tiger:{ ears:'round', color:'#f4a261' },
  cat:{ ears:'point', color:'#c0a080' }, dog:{ ears:'flop', color:'#b0895f' },
  frog:{ ears:'none', color:'#95d5b2' }, bear:{ ears:'round', color:'#a0763f' },
  rabbit:{ ears:'long', color:'#e9d8c6' }, fox:{ ears:'point', color:'#e8843c' },
  monkey:{ ears:'round', color:'#b08050' }, elephant:{ ears:'big', color:'#b7b7c9' },
  penguin:{ ears:'none', color:'#3a4a5a' }, owl:{ ears:'tuft', color:'#c9a66b' },
  panda:{ ears:'round', color:'#efefef' }, cobra:{ ears:'none', color:'#8bc34a' },
  snake:{ ears:'none', color:'#8bc34a' }, butterfly:{ ears:'antenna', color:'#e08bd0' },
  eagle:{ ears:'none', color:'#c9a66b' }, flamingo:{ ears:'none', color:'#ff9ec4' },
  dolphin:{ ears:'none', color:'#7fc8e0' }, turtle:{ ears:'none', color:'#7cb342' },
  cow:{ ears:'flop', color:'#e8d5c0' }, horse:{ ears:'point', color:'#b0895f' },
  giraffe:{ ears:'point', color:'#e8c34a' }, deer:{ ears:'long', color:'#c99a6b' },
};

function animalKey(pose) {
  if (!pose.animalName) return null;
  const n = pose.animalName.toLowerCase();
  return ANIMAL_FACE[n] ? n : (Object.keys(ANIMAL_FACE).find((k) => n.includes(k)) || null);
}

/**
 * Render the yogi in a given shape as an SVG string.
 * opts: { size, skin:{body,limb}, animal }
 */
export function yogiSVG(pose, { size = 200, mono = false } = {}) {
  const shape = SHAPES[shapeFor(pose)] || SHAPES.standing;
  const aKey = animalKey(pose);
  const animal = aKey ? ANIMAL_FACE[aKey] : null;

  const bodyColor = mono ? '#ffffff' : (animal?.color || '#ffd166');
  const limbColor = mono ? '#ffffff' : shade(bodyColor, -18);
  const skinLine = mono ? '#ffffff' : shade(bodyColor, -34);

  const [hx, hy] = shape.root;
  const [sx, sy] = pt(hx, hy, shape.torso, LEN.torso);           // shoulder
  const headA = shape.torso + (shape.headTilt || 0);
  const [headX, headY] = pt(sx, sy, headA, LEN.head + 2);        // head center

  // limbs
  const arm = (spec, dir) => {
    const [shDeg, elDeg] = spec;
    const shoulderX = sx + dir * 3;
    const [ex, ey] = pt(shoulderX, sy, shDeg, LEN.upperArm);
    const [wx, wy] = pt(ex, ey, elDeg, LEN.foreArm);
    return { p: `${shoulderX},${sy} ${ex},${ey} ${wx},${wy}`, hand: [wx, wy] };
  };
  const leg = (spec, dir) => {
    const [hipDeg, knDeg] = spec;
    const hipX = hx + dir * 3;
    const [kx, ky] = pt(hipX, hy, hipDeg, LEN.thigh);
    const [fx, fy] = pt(kx, ky, knDeg, LEN.shin);
    return { p: `${hipX},${hy} ${kx},${ky} ${fx},${fy}`, foot: [fx, fy] };
  };
  const aL = arm(shape.armL, -1), aR = arm(shape.armR, 1);
  const lL = leg(shape.legL, -1), lR = leg(shape.legR, 1);

  const limb = (d, w = 6) => `<polyline points="${d}" fill="none" stroke="${limbColor}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const joint = ([x, y], r = 3.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${limbColor}"/>`;

  // ears
  let ears = '';
  if (animal) ears = earSVG(animal.ears, headX, headY, LEN.head, animal.color, skinLine);

  const face = mono ? '' : `
    <circle cx="${headX - 3.4}" cy="${headY - 1}" r="1.5" fill="#3a2a1a"/>
    <circle cx="${headX + 3.4}" cy="${headY - 1}" r="1.5" fill="#3a2a1a"/>
    <path d="M ${headX - 3} ${headY + 3.5} Q ${headX} ${headY + 6} ${headX + 3} ${headY + 3.5}" fill="none" stroke="#3a2a1a" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="${headX - 5.5}" cy="${headY + 2}" r="1.6" fill="#ff9ec4" opacity="0.7"/>
    <circle cx="${headX + 5.5}" cy="${headY + 2}" r="1.6" fill="#ff9ec4" opacity="0.7"/>`;

  return `<svg viewBox="0 0 100 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeAttr(pose.english)}">
    <g stroke-linecap="round">
      ${limb(lL.p)}${limb(lR.p)}
      <circle cx="${lL.foot[0]}" cy="${lL.foot[1]}" r="3.4" fill="${skinLine}"/>
      <circle cx="${lR.foot[0]}" cy="${lR.foot[1]}" r="3.4" fill="${skinLine}"/>
      <line x1="${hx}" y1="${hy}" x2="${sx}" y2="${sy}" stroke="${bodyColor}" stroke-width="11" stroke-linecap="round"/>
      ${limb(aL.p)}${limb(aR.p)}
      <circle cx="${aL.hand[0]}" cy="${aL.hand[1]}" r="3" fill="${skinLine}"/>
      <circle cx="${aR.hand[0]}" cy="${aR.hand[1]}" r="3" fill="${skinLine}"/>
      ${joint([sx, sy])}${joint([hx, hy])}
      ${ears}
      <circle cx="${headX}" cy="${headY}" r="${LEN.head}" fill="${bodyColor}" stroke="${skinLine}" stroke-width="1.5"/>
      ${animal && animal.extra === 'mane' ? maneSVG(headX, headY, LEN.head, shade(bodyColor,-24)) : ''}
      ${face}
    </g>
  </svg>`;
}

function earSVG(type, x, y, r, color, line) {
  const c = `fill="${color}" stroke="${line}" stroke-width="1.2"`;
  switch (type) {
    case 'round': return `<circle cx="${x-r*0.7}" cy="${y-r*0.7}" r="${r*0.5}" ${c}/><circle cx="${x+r*0.7}" cy="${y-r*0.7}" r="${r*0.5}" ${c}/>`;
    case 'point': return `<path d="M ${x-r*0.9} ${y-r*0.3} L ${x-r*0.9} ${y-r*1.5} L ${x-r*0.2} ${y-r*0.7} Z" ${c}/><path d="M ${x+r*0.9} ${y-r*0.3} L ${x+r*0.9} ${y-r*1.5} L ${x+r*0.2} ${y-r*0.7} Z" ${c}/>`;
    case 'long': return `<ellipse cx="${x-r*0.5}" cy="${y-r*1.4}" rx="${r*0.28}" ry="${r*0.9}" ${c}/><ellipse cx="${x+r*0.5}" cy="${y-r*1.4}" rx="${r*0.28}" ry="${r*0.9}" ${c}/>`;
    case 'flop': return `<ellipse cx="${x-r}" cy="${y}" rx="${r*0.35}" ry="${r*0.6}" ${c}/><ellipse cx="${x+r}" cy="${y}" rx="${r*0.35}" ry="${r*0.6}" ${c}/>`;
    case 'big': return `<ellipse cx="${x-r*1.1}" cy="${y}" rx="${r*0.7}" ry="${r*0.9}" ${c}/><ellipse cx="${x+r*1.1}" cy="${y}" rx="${r*0.7}" ry="${r*0.9}" ${c}/>`;
    case 'tuft': return `<path d="M ${x-r*0.7} ${y-r} l -2 -5 l 4 2 Z" ${c}/><path d="M ${x+r*0.7} ${y-r} l 2 -5 l -4 2 Z" ${c}/>`;
    case 'antenna': return `<line x1="${x-2}" y1="${y-r}" x2="${x-4}" y2="${y-r-5}" stroke="${line}" stroke-width="1"/><circle cx="${x-4}" cy="${y-r-5}" r="1.4" ${c}/><line x1="${x+2}" y1="${y-r}" x2="${x+4}" y2="${y-r-5}" stroke="${line}" stroke-width="1"/><circle cx="${x+4}" cy="${y-r-5}" r="1.4" ${c}/>`;
    default: return '';
  }
}
function maneSVG(x, y, r, color) {
  let spikes = '';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; spikes += `<circle cx="${x + Math.cos(a) * r * 1.15}" cy="${y + Math.sin(a) * r * 1.15}" r="${r*0.32}" fill="${color}"/>`; }
  return `<g>${spikes}</g>`;
}

function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = pct / 100;
  r = Math.round(Math.min(255, Math.max(0, r + 255 * f)));
  g = Math.round(Math.min(255, Math.max(0, g + 255 * f)));
  b = Math.round(Math.min(255, Math.max(0, b + 255 * f)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
function escapeAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

export { SHAPES };
export default { yogiSVG, shapeFor, SHAPES };

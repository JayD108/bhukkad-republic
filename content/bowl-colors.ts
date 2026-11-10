// Each dish's colour in its katori bowl. This is an illustration until real
// (openly licensed) photos arrive. [main colour, second colour, speckled?]
export const BOWL_COLORS: Record<string, [string, string, boolean?]> = {
  'bikaneri-bhujia': ['#d9a441', '#c58a2c', true], 'dal-baati-churma': ['#c98a3c', '#e2b360'],
  'ghewar': ['#e8c37a', '#f3dca6', true], 'dhokla': ['#e9c656', '#f2da7e', true],
  'khandvi': ['#ecc65a', '#f4d987', true], 'undhiyu': ['#6f8b3a', '#93a94e', true],
  'puran-poli': ['#d79a43', '#e8b866'], 'misal-pav': ['#c0522a', '#d6713c', true],
  'vada-pav': ['#c78533', '#dca553'], 'khatkhate': ['#d08a3a', '#e6a956', true],
  'goan-khaje': ['#c97d3a', '#dd9a52'], 'bebinca': ['#a8662e', '#c8873f'],
  'sarson-da-saag': ['#4f7d2f', '#6d9a3b'], 'amritsari-kulcha': ['#d4a45c', '#e8c582', true],
  'kashmiri-dum-aloo': ['#b8432a', '#cf5f34', true], 'nadru-yakhni': ['#efe6cf', '#f7f0de', true],
  'siddu': ['#e3d3ae', '#efe3c6'], 'kangri-dham': ['#e2b53a', '#efcf62', true],
  'kafuli': ['#3f6e2a', '#58893a'], 'bal-mithai': ['#6b3a1f', '#86502a', true],
  'agra-petha': ['#eef0e2', '#f8f8ee'], 'banarasi-tirangi-barfi': ['#f29a2e', '#ffffff'],
  'bedmi-puri': ['#c98f45', '#ddae64'], 'indori-poha-jalebi': ['#f0cb3c', '#f6dc72', true],
  'dal-bafla': ['#d6a04a', '#e8bd6b'], 'mysore-pak': ['#e1a93a', '#edc565', true],
  'bisi-bele-bath': ['#b85b2a', '#cc773a', true], 'dharwad-peda': ['#8a5228', '#a46a35'],
  'avial': ['#d9d08a', '#e8e2a7', true], 'puttu-kadala': ['#efe9da', '#5b3a26', true],
  'appam-veg-stew': ['#f3ecd8', '#fbf6e8'], 'idli': ['#f4f1e8', '#fbf9f2'],
  'ven-pongal': ['#ecdca6', '#f5e9c1', true], 'srivilliputtur-palkova': ['#c9935a', '#ddb07a'],
  'kovilpatti-kadalai-mittai': ['#a8662a', '#c1823b', true], 'pesarattu': ['#7e9a3e', '#9db552'],
  'bandar-laddu': ['#e2a33c', '#efc062', true], 'rasagola': ['#f6f0de', '#fffaf0'],
  'chhena-poda': ['#9b4d22', '#c27a3c'], 'dalma': ['#d8b443', '#e8cc6a', true],
  'mishti-doi': ['#c98a4e', '#ddb07c'], 'burdwan-mihidana': ['#f0a92a', '#f6c45a', true],
  'shukto': ['#d6d0a3', '#e6e1bd', true], 'litti-chokha': ['#8a5a32', '#a87445', true],
  'silao-khaja': ['#e2c27e', '#efd8a2'], 'dhuska': ['#c88a3e', '#dca65e'],
  'assam-pitha': ['#efe7d3', '#c28a48', true], 'chak-hao-kheer': ['#4b2346', '#6c3767'],
};
export const DEFAULT_BOWL: [string, string] = ['#e2c27e', '#efd8a2'];

// Dishes without a hand-picked colour get a stable one from their name, so a long list
// of bowls is not all the same beige. Same dish, same colour, every build.
const FALLBACK: [string, string][] = [
  ['#d9a441', '#c58a2c'], ['#c98a3c', '#e2b360'], ['#b8432a', '#cf5f34'], ['#6f8b3a', '#93a94e'],
  ['#e2c27e', '#efd8a2'], ['#a8662e', '#c8873f'], ['#e9c656', '#f2da7e'], ['#8a5a32', '#a87445'],
  ['#c0522a', '#d6713c'], ['#efe6cf', '#f7f0de'], ['#7e9a3e', '#9db552'], ['#6b3a1f', '#86502a'],
];
function hash(s: string) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }

export const bowlColors = (id: string): [string, string, boolean?] => {
  const known = BOWL_COLORS[id];
  if (known) return known;
  const h = hash(id);
  const [c, c2] = FALLBACK[h % FALLBACK.length];
  return [c, c2, h % 3 === 0];
};

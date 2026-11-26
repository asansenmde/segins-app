// Cifrado de la copia que se sube a Colabora (13/11/2026). El usuario pide que TODO vaya cifrado: textos, nombres de campo y
// expresiones regulares. Copiado igual en cada proyecto (incidentes, perdidas, vsa, permisos, colabora): si se mejora, copiarlo.
// © 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
import JavaScriptObfuscator from 'javascript-obfuscator';
import * as acorn from 'acorn';

// El ofuscador no cifra las /expresiones/ ni los nombres de campo de los objetos ({ ESTADO: … }): antes de ofuscar se pasan
// a new RegExp("…", "i") y a ['ESTADO'], que van a la tabla cifrada. El programa hace exactamente lo mismo.
export function textosACifrar(js) {
  const cambios = [];
  const recorrer = n => {
    if (!n || typeof n.type !== 'string') return;
    if (n.type === 'Literal' && n.regex) cambios.push({ ini: n.start, fin: n.end, txt: '(new RegExp(' + JSON.stringify(n.regex.pattern) + ', ' + JSON.stringify(n.regex.flags) + '))' });
    if (n.type === 'Property' && !n.computed && !n.shorthand && !n.method && n.kind === 'init') {
      const k = n.key, nombre = k.type === 'Identifier' ? k.name : typeof k.value === 'string' ? k.value : null;
      if (nombre !== null && nombre !== '__proto__') cambios.push({ ini: k.start, fin: k.end, txt: '[' + JSON.stringify(nombre) + ']' });
    }
    for (const c in n) { const v = n[c]; if (Array.isArray(v)) v.forEach(recorrer); else if (v && typeof v === 'object' && typeof v.type === 'string') recorrer(v); }
  };
  recorrer(acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'script' }));
  cambios.sort((a, b) => b.ini - a.ini).forEach(c => { js = js.slice(0, c.ini) + c.txt + js.slice(c.fin); });
  return js;
}

// CAUSA REAL del «código como texto» (03/11/2026): algo en la red de Defensa mete su código buscando etiquetas como </head> o
// <body>, y las encontraba también DENTRO del programa (plantillas de impresión o de Word), partiéndolo. El «<» de esas
// etiquetas se escribe \x3c (el navegador lo lee igual) y no se genera la copia si queda alguna.
const ETIQUETAS = /<(?=\/?(?:!doctype|html|head|body|meta|title|style|link|base|script)\b|!--)/gi;

// Devuelve { codigo: el programa cifrado listo para pegar en el <script>, kb }
export function cifrar(codigo, semilla = 20261027) {
  const ofuscado = JavaScriptObfuscator.obfuscate(textosACifrar(codigo), {
    compact: true,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 1,        // TODOS los textos a la tabla cifrada (antes el 75 %)
    stringArrayRotate: true,
    stringArrayShuffle: true,
    transformObjectKeys: true,
    splitStrings: false,
    controlFlowFlattening: false,   // más lento y no aporta mucho aquí
    deadCodeInjection: false,
    selfDefending: true,            // deja de funcionar si alguien lo reformatea para leerlo
    domainLock: ['.mdef.es'],       // solo funciona dentro de los dominios de Defensa (colabora.mdef.es…)
    unicodeEscapeSequence: false,
    seed: semilla
  }).getObfuscatedCode();
  const final = ofuscado.replace(ETIQUETAS, '\\x3c');
  if (/<\/script|<!--|<\/?(?:!doctype|html|head|body)\b/i.test(final)) throw new Error('El código cifrado contiene etiquetas de página («</head>», «<body>»…): no se puede pegar en la página');
  return { codigo: final, kb: Math.round(final.length / 1024) };
}

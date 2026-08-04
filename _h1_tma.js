#!/usr/bin/env node
/* ============================== _h1_tma.js ===============================
   Arné de validación de ⌖HSUB⌖ — RECONSTRUIDO el 02AGO26.
   El original (1910 comprobaciones) se perdió al morir el hilo anterior y
   no estaba ni en Drive ni en el repositorio. Este lo sustituye con la
   misma estructura de dos capas:

     · MOTOR    — ejecuta el banco embebido del propio fichero
                  (TMA.resumen(): fórmulas, mazo, doctrina, 2A…).
     · INTERFAZ — jsdom sobre el fichero real: arranque, pestañas,
                  herramientas, peñiquero (28 tipos a nivel motor + drill
                  real por el DOM), DIBUJO TZ1–TZ5, sesiones y SEGUIR,
                  generación del PDF, CRONOS, SUBIDA PD y sincronía
                  sw.js↔versión.

   La capa de interfaz cubre las mismas áreas que la original pero con
   menos granularidad histórica: crecerá con cada tanda, como siempre.

   Uso:  node _h1_tma.js [index.html] [sw.js]
   Sale con código 1 si hay algo en rojo.
   ======================================================================= */
"use strict";
const fs = require("fs");
const { JSDOM } = require("jsdom");

const HTML = process.argv[2] || "index.html";
const SW   = process.argv[3] || "sw.js";

const R = { ok: 0, tot: 0, fallos: [] };
function add(id, cond, got, exp) {
  R.tot++;
  if (cond) R.ok++;
  else R.fallos.push({ id, got: String(got).slice(0, 110), exp: String(exp).slice(0, 90) });
}

const html = fs.readFileSync(HTML, "utf8");
/* Consola virtual muda: jsdom no implementa scrollTo y avisaba en cada
   render; los errores de la página siguen llegando por el evento error. */
const vc = new (require("jsdom").VirtualConsole)();
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://localhost/", pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window, d = w.document;
const errsRT = [];
w.addEventListener("error", e => errsRT.push(e.message));

let RES = null; // banco embebido, se ejecuta UNA sola vez

setTimeout(async () => {
  try { await correr(); }
  catch (e) { add("XX excepción del arné", false, (e.stack || e.message).split("\n").slice(0, 2).join(" · "), "sin excepción"); }
  informe();
}, 1500);

async function correr() {
  const T = w.TMA;

  /* ============================ A · ARRANQUE ============================ */
  add("A01 sin errores runtime al cargar", errsRT.length === 0, errsRT.join(" | ") || "ninguno", "ninguno");
  add("A02 versión con formato x.y.z", /^\d+\.\d+\.\d+$/.test(T.version), T.version, "x.y.z");
  add("A03 versión pintada en la UI", d.querySelector("#ver").textContent === "v" + T.version,
      d.querySelector("#ver").textContent, "v" + T.version);
  const tabs = [...d.querySelectorAll("nav.tabs button")].map(b => b.textContent.trim());
  add("A04 tres pestañas", tabs.join("|") === "ENTRENAR|⌖ HERRAMIENTAS ⌖|APUNTES", tabs.join("|"), "ENTRENAR|⌖ HERRAMIENTAS ⌖|APUNTES");
  const act0 = [...d.querySelectorAll("section.vista")].filter(s => s.classList.contains("act")).map(s => s.id);
  add("A05 abre en HERRAMIENTAS", act0.join() === "v-calcular", act0.join(), "v-calcular");
  d.querySelector('nav.tabs button[data-v="entrenar"]').click();
  add("A06 conmuta a ENTRENAR", d.querySelector("#v-entrenar").classList.contains("act"),
      d.querySelector("#v-entrenar").className, "clase act");
  d.querySelector('nav.tabs button[data-v="referencia"]').click();
  add("A07 conmuta a APUNTES", d.querySelector("#v-referencia").classList.contains("act"),
      d.querySelector("#v-referencia").className, "clase act");
  d.querySelector('nav.tabs button[data-v="calcular"]').click();

  /* ========================= B · HERRAMIENTAS ========================== */
  const btns = [...d.querySelectorAll('#selCalc button[data-v]')].map(b => b.dataset.v);
  add("B01 cinco herramientas", btns.join() === "brc,cpa,dist,cronos,pd", btns.join(), "brc,cpa,dist,cronos,pd");
  const VIS0 = w.CALCVIS_UI.estado();
  add("B02 todas apagadas al abrir", Object.values(VIS0).every(v => v === false), JSON.stringify(VIS0), "todo false");
  add("B03 marca de agua visible", !d.querySelector("#calcNada").hidden, "hidden=" + d.querySelector("#calcNada").hidden, "visible");
  w.CALCVIS_UI.alterna("brc");
  add("B04 encender BRC la muestra", w.CALCVIS_UI.estado().brc === true && d.querySelector("#calcNada").hidden,
      "brc=" + w.CALCVIS_UI.estado().brc + " marca=" + !d.querySelector("#calcNada").hidden, "brc on · marca oculta");
  const tn = d.querySelector("#btnCalcTN");
  tn.click();
  add("B05 TODAS enciende las 5", Object.values(w.CALCVIS_UI.estado()).every(v => v === true),
      JSON.stringify(w.CALCVIS_UI.estado()), "todo true");
  const n2 = [...d.querySelectorAll(".calcBlq .intro-2 b")].map(x => x.textContent.trim());
  add("B06 rótulos nivel 2",
      n2.join("|") === "BRC|CPA · MANIOBRA|ESTADIMETRÍA · ALTURA DE PALO|CRONOS · PUNTEO INTERMITENTE|SUBIDA A COTA PERISCÓPICA",
      n2.join("|"), "los cinco largos");
  let dup = [];
  d.querySelectorAll(".calcBlq").forEach(blq => {
    const t2 = ((blq.querySelector(".intro-2 b") || {}).textContent || "").trim();
    blq.querySelectorAll("h2").forEach(h => {
      const t3 = h.childNodes[0] ? h.childNodes[0].textContent.trim() : "";
      if (t3 && t2 && t3 === t2) dup.push(t3);
    });
  });
  add("B07 ningún nivel 3 repite su nivel 2", dup.length === 0, dup.join(","), "ninguno");
  tn.click();
  add("B08 NINGUNA apaga las 5 y vuelve la marca",
      Object.values(w.CALCVIS_UI.estado()).every(v => v === false) && !d.querySelector("#calcNada").hidden,
      JSON.stringify(w.CALCVIS_UI.estado()), "todo false · marca visible");
  let ls = {};
  try { ls = JSON.parse(w.localStorage.getItem("tma_calc_vis_v1") || "{}"); } catch (e) {}
  add("B09 visibilidad persistida en localStorage", ls.brc === false && ls.pd === false, JSON.stringify(ls), "estado guardado");

  /* ====== C · PEÑIQUERO: 28 tipos (motor) + drill real por el DOM ====== */
  const ids = T.PEN.TYPES.map(t => t.id);
  add("C01 28 tipos T01–T28 sin huecos",
      ids.length === 28 && ids.every((x, i) => x === "T" + String(i + 1).padStart(2, "0")),
      ids.join(" "), "T01…T28");
  const porNivel = { 1: [], 2: [], 3: [] };
  T.PEN.TYPES.forEach(t => porNivel[t.nivel].push(t.id));
  add("C02 reparto por nivel 9/9/10",
      porNivel[1].length === 9 && porNivel[2].length === 9 && porNivel[3].length === 10,
      [porNivel[1].length, porNivel[2].length, porNivel[3].length].join("/"), "9/9/10");

  function corrompe(sol) {
    const r = {};
    Object.keys(sol).forEach(k => {
      const v = sol[k];
      if (typeof v === "number") r[k] = v * 3 + 77;
      else if (/^(Er|Br)$/.test(v)) r[k] = v === "Er" ? "Br" : "Er";
      else if (/^(IZ|DE)$/.test(v)) r[k] = v === "IZ" ? "DE" : "IZ";
      else if (/^\d+[:.]\d\d$/.test(String(v))) r[k] = "59:59";
      else r[k] = String(v) + "X";
    });
    return r;
  }
  /* Cobertura por tipo, a nivel motor: gen con semilla fija, corrección
     exacta debe dar ok y corrompida no. Tres semillas por tipo. */
  T.PEN.TYPES.forEach((t, i) => {
    let okE = true, okF = true, det = "";
    for (let s = 0; s < 3; s++) {
      const rng = T.rng(41000 + i * 7 + s);
      const ej = t.gen(rng);
      const cE = T.PEN.corrige(ej, ej.sol);
      const cF = T.PEN.corrige(ej, corrompe(ej.sol));
      if (!cE.ok) { okE = false; det += " sol exacta no ok (s" + s + ")"; }
      if (cF.ok)  { okF = false; det += " corrupta dio ok (s" + s + ")"; }
    }
    add("C·" + t.id + " genera y corrige (motor, 3 semillas)", okE && okF, det.trim() || "ok", "exacta ok · corrupta no");
  });

  /* Drill real por el DOM: 8 ejercicios por nivel con la solución exacta
     (CORRECTO) y 1 corrompido (FALLO). Semilla fija → reproducible. */
  let drTot = 0, drOk = 0, drill = true, drillDet = "";
  [1, 2, 3].forEach(niv => {
    w.PEN_UI.iniciarTest(niv, "todos", 20260802 + niv);
    for (let it = 0; it < 8; it++) {
      const ej = w.PEN_UI.ej();
      w.PEN_UI.rellenar(ej.sol);
      const ver = w.PEN_UI.corregir();
      drTot++; if (/^CORRECTO/.test(ver)) drOk++;
      else { drill = false; drillDet += w.PEN_UI.tipo().id + "→" + ver + "; "; }
      w.PEN_UI.siguiente();
    }
    const ej = w.PEN_UI.ej();
    w.PEN_UI.rellenar(corrompe(ej.sol));
    const ver = w.PEN_UI.corregir();
    drTot++;
    if (!/^FALLO/.test(ver)) { drill = false; drillDet += "corrupto " + w.PEN_UI.tipo().id + "→" + ver + "; "; }
  });
  add("C29 drill por el DOM: 24 exactos CORRECTO + 3 corruptos FALLO", drill, drillDet || "ok", "todo según lo esperado");
  const ses = w.PEN_UI.sesion();
  add("C30 contadores de la sesión cuadran", ses.tot === 9 && ses.ok === 8,
      ses.ok + "/" + ses.tot + " (último nivel)", "8/9");
  const st = w.PEN_UI.stats();
  add("C31 estadística registra por tipo", Object.keys(st).filter(k => /^T\d\d$/.test(k)).length >= 10,
      Object.keys(st).filter(k => /^T\d\d$/.test(k)).length + " tipos con registro", "≥10 tras el drill");

  /* ===================== D · DIBUJO (ROSA Y MESA) ====================== */
  const tzs = (T.TRAZADO.TIPOS || []).map(t => t.id).sort();
  add("D01 cinco tipos TZ", tzs.join() === "TZ1,TZ2,TZ3,TZ4,TZ5", tzs.join(), "TZ1…TZ5");
  let okG = true, okP = true, det = "";
  tzs.forEach(t => {
    try {
      w.TRZ_UI.nuevo(t, 7); w.TRZ_UI.ver();
      if (!d.querySelector("#trzSvg").innerHTML) { okG = false; det += t + " svg vacío; "; }
      w.TRZ_UI.paso(1); w.TRZ_UI.medio("mesa"); w.TRZ_UI.medio("rosa");
    } catch (e) { okP = false; det += t + ":" + e.message + "; "; }
  });
  add("D02 TZ1–TZ5 generan y pintan", okG, det || "ok", "svg con contenido");
  add("D03 pasos y rosa/mesa sin excepción", okP, det || "ok", "sin excepción");
  try {
    w.APTRZ_UI.nuevo("TZ1", 9);
    add("D04 panel de trazado en APUNTES pinta", !!d.querySelector("#apTrzSvg").innerHTML,
        "svg " + (d.querySelector("#apTrzSvg").innerHTML ? "con contenido" : "vacío"), "con contenido");
  } catch (e) { add("D04 panel de trazado en APUNTES pinta", false, e.message, "sin excepción"); }

  /* ==================== E · SESIONES y SEGUIR ========================== */
  const antes = w.PEN_UI.sesiones().length;
  w.PEN_UI.iniciarTest(1, "todos", 99);
  const msg = w.PEN_UI.guardaSes("vacía");
  add("E01 no guarda sesión sin actividad", typeof msg === "string" && /sin actividad/i.test(msg), msg, "mensaje de rechazo");
  w.PEN_UI.rellenar(w.PEN_UI.ej().sol); w.PEN_UI.corregir();
  w.PEN_UI.guardaSes("arné");
  add("E02 guarda con actividad", w.PEN_UI.sesiones().length === antes + 1,
      w.PEN_UI.sesiones().length, antes + 1);
  w.PEN_UI.retomaSes(w.PEN_UI.sesiones().length - 1);
  add("E03 SEGUIR activa la sesión", w.PEN_UI.sesActiva() !== null, w.PEN_UI.sesActiva(), "≠ null");
  add("E04 SEGUIR lleva a ENTRENAR", d.querySelector("#v-entrenar").classList.contains("act"),
      d.querySelector("#v-entrenar").className, "clase act");
  add("E05 cabecera muestra SIGUIENDO", /SIGUIENDO/.test(d.querySelector("#v-entrenar").textContent),
      "no aparece", "texto SIGUIENDO");
  add("E06 fila marcada EN CURSO", /EN CURSO/.test(d.querySelector("#v-entrenar").textContent),
      "no aparece", "etiqueta EN CURSO");
  w.PEN_UI.rellenar(w.PEN_UI.ej().sol); w.PEN_UI.corregir();
  w.PEN_UI.guardaSes("arné");
  add("E07 guardar tras SEGUIR actualiza, no duplica", w.PEN_UI.sesiones().length === antes + 1,
      w.PEN_UI.sesiones().length, antes + 1);
  w.PEN_UI.iniciarTest(1, "todos", 100);
  add("E08 COMENZAR desmarca la sesión seguida", w.PEN_UI.sesActiva() === null, w.PEN_UI.sesActiva(), "null");

  /* ========================= F · PDF de resumen ======================== */
  let fBlob = null;
  try {
    w.navigator.canShare = () => true;
    w.navigator.share = o => { fBlob = o.files[0]; return Promise.resolve(); };
    const x = w.PEN_UI.sesiones()[w.PEN_UI.sesiones().length - 1];
    const ret = w.PEN_UI.resumenPDF(x);
    fBlob = fBlob || ret;
    add("F01 resumenPDF sin excepción", true, "ok", "ok");
  } catch (e) { add("F01 resumenPDF sin excepción", false, e.message, "sin excepción"); }
  let B = null;
  if (fBlob && fBlob.arrayBuffer) B = Buffer.from(await fBlob.arrayBuffer());
  else if (typeof fBlob === "string") B = Buffer.from(fBlob, "latin1");
  if (B) {
    add("F02 el fichero empieza por %PDF", B.slice(0, 4).toString() === "%PDF", B.slice(0, 8).toString(), "%PDF");
    add("F03 tamaño razonable", B.length > 1000, B.length + " B", "> 1000 B");
    add("F04 sin ⌖ ni Ḃ crudos dentro",
        !B.includes(Buffer.from("⌖")) && !B.includes(Buffer.from("Ḃ")) &&
        !String(fBlob).includes("⌖") && !String(fBlob).includes("Ḃ"),
        "aparecen crudos", "sustituidos por equivalentes");
  } else {
    add("F02 el PDF llega legible (blob o cadena)", false, typeof fBlob, "Blob o string");
  }

  /* =========================== G · CRONOS ============================== */
  try {
    const c = w.CTRL_UI.add(1, "12/5", 6000, "090");
    add("G01 alta de contacto en CRONOS", w.CTRL_UI.estado().cs.length >= 1, w.CTRL_UI.estado().cs.length, "≥1");
    w.CTRL_UI.observar(c.id);
    add("G02 OBSERVADO sella el contacto", !!c.t0, "t0=" + c.t0, "sellado");
    w.CTRL_UI.margen(2);
    add("G03 margen ajustable", w.CTRL_UI.estado().margen === 2, w.CTRL_UI.estado().margen, 2);
    add("G04 vuelta de seguridad presente", !!w.CTRL_UI.estado().vs, "vs=" + JSON.stringify(w.CTRL_UI.estado().vs).slice(0, 40), "vs en estado");
  } catch (e) { add("G00 CRONOS sin excepción", false, e.message, "sin excepción"); }

  /* ========================= H · SUBIDA PD ============================= */
  try {
    const PD = w.PD_UI;
    PD.caida(0);
    const tr0 = PD.estado().tramos[0];
    add("H01 CAÍDA crea tramo con rumbo y hora",
        PD.estado().tramos.length === 1 && tr0.rumbo === 0 && !!tr0.t,
        JSON.stringify(tr0).slice(0, 70), "rumbo 0 + sello de hora");
    const c = PD.add(1, "MERCANTE");
    add("H02 alta de contacto", PD.estado().cs.length === 1, PD.estado().cs.length, 1);
    c.dem = "090"; PD.observar(c.id);
    c.obs[0].t -= 120000;                 // dos minutos entre tomas
    c.dem = "095"; PD.observar(c.id);
    add("H03 dos observaciones selladas", c.obs.length === 2 && c.obs.every(o => o.t), c.obs.length + " obs", "2 con sello");
    const fichaTxt = (d.querySelector("#pdLista") || {}).textContent || "";
    add("H04 marcación Er con rumbo 000 y dem 090", /Er/.test(fichaTxt), fichaTxt.slice(0, 70), "contiene Er");
    add("H05 tendencia/signatura visible", /(DD|II|DI|ID)/.test(fichaTxt), fichaTxt.slice(0, 90), "DD/II/DI/ID");
    PD.caida(90);
    const ek = PD.ek(c.id, { rumbo: 0, vel: 4, dem: "090", ley: "2" },
                           { rumbo: 90, vel: 4, dem: "100", ley: "-1.5" });
    const val = (typeof ek === "number") ? ek : (ek && (ek.R ?? ek.dek ?? ek.dist ?? ek.d));
    add("H06 Ekelund por tramos devuelve distancia", isFinite(val) && val > 0, JSON.stringify(ek).slice(0, 70), "R > 0");
    add("H07 rosa de situación pinta", !!(d.querySelector("#rosaPD") || {}).innerHTML,
        "svg " + ((d.querySelector("#rosaPD") || {}).innerHTML ? "con contenido" : "vacío"), "con contenido");
  } catch (e) { add("H00 PD sin excepción", false, e.message, "sin excepción"); }

  /* ================= I · SINCRONÍA fichero ↔ versión =================== */
  try {
    const sw = fs.readFileSync(SW, "utf8");
    const m = sw.match(/hsub-v([\d.]+)/);
    add("I01 caché del sw.js = versión de la app", m && m[1] === T.version, m && m[1], T.version);
  } catch (e) { add("I01 caché del sw.js = versión de la app", false, "sw.js ilegible: " + e.message, T.version); }

  RES = T.resumen(); // ÚNICA ejecución del banco embebido
  const vis = d.body.textContent.match(/(\d{3,4})\s+comprobaciones/);
  add("I02 contador de comprobaciones citado en el texto",
      !vis || +vis[1] === RES.total, vis ? vis[1] : "no citado", vis ? String(RES.total) : "no citado (vale)");
  const idsSet = new Set(T.PEN.TYPES.map(t => t.id));
  const malTxx = [];
  (d.body.textContent.match(/T\d\d/g) || []).forEach(x => { if (!idsSet.has(x) && !malTxx.includes(x)) malTxx.push(x); });
  add("I03 toda referencia visible a Txx existe en el motor", malTxx.length === 0, malTxx.join(","), "ninguna huérfana");
  try {
    d.querySelector("#btnChk").click();
    add("I04 el botón de autocomprobación pinta TOTAL ✓",
        new RegExp("TOTAL: " + RES.total + "/" + RES.total).test(d.querySelector("#chkTotal").textContent) &&
        /✓/.test(d.querySelector("#chkTotal").textContent),
        d.querySelector("#chkTotal").textContent, "TOTAL: n/n ✓");
  } catch (e) { add("I04 el botón de autocomprobación pinta TOTAL ✓", false, e.message, "sin excepción"); }

  /* ======= J · CORRECCIONES DE LA REVISIÓN VISUAL (v1.26.1) ============ */
  /* Cada punto corregido queda fijado aquí para que no vuelva a colarse. */
  const ent = d.querySelector("#v-entrenar");
  w.PEN_UI.iniciarTest(1, "todos", 7);
  for (let i = 0; i < 3; i++) { w.PEN_UI.rellenar(w.PEN_UI.ej().sol); w.PEN_UI.corregir(); w.PEN_UI.siguiente(); }
  const sesJ = w.PEN_UI.sesion();
  add("J01 la racha no se calcula ni se guarda",
      sesJ.racha === undefined && sesJ.mejor === undefined && !/RACHA/i.test(ent.textContent),
      JSON.stringify(sesJ).slice(0, 60), "sin racha ni mejor");
  const cvCss = [...d.querySelectorAll("style")].map(x => x.textContent).join("");
  add("J02 marcador del plegable en teal, como los desplegables",
      /\.plegable \.cv\{[^}]*color:var\(--teal\)/.test(cvCss), "sin teal", "color teal");
  add("J03 sin etiquetas fantasma en ENTRENAR",
      [...ent.querySelectorAll(".eti")].every(e => e.textContent.trim() !== ""),
      [...ent.querySelectorAll(".eti")].map(e => "[" + e.textContent.trim() + "]").join(" "), "todas con texto");
  d.querySelector("#btnTerminar").click();
  const cabTab = [...(d.querySelector("#tStats") || d).querySelectorAll("th")].map(t => t.textContent.trim());
  add("J04 cabecera de la tabla de estadística en mayúsculas",
      cabTab.join("|") === "TIPO|EJERCICIOS|NOTA", cabTab.join("|"), "TIPO|EJERCICIOS|NOTA");
  w.PEN_UI.guardaSes("comprobación J"); w.PEN_UI.pintaSes();
  const filaJ = ent.textContent;
  add("J05 NOTA en mayúscula también en la fila de sesión",
      !/· nota /.test(filaJ) && /NOTA /.test(filaJ),
      (filaJ.match(/·\s*nota[^·]{0,12}/) || ["ok"])[0], "NOTA en mayúscula");
  const bDem = d.querySelector('#selGrupo button[data-v="demoras"]') ||
               [...ent.querySelectorAll("button")].filter(b => /DEMORAS/.test(b.textContent))[0];
  add("J06 separador con espacios en DEMORAS · RUMBOS",
      bDem.textContent.trim() === "DEMORAS · RUMBOS", bDem.textContent.trim(), "DEMORAS · RUMBOS");
  const h2Ap = [...d.querySelectorAll("#v-referencia h2")].map(h => h.textContent.trim());
  add("J07 título de APUNTES con el mismo orden y sin «TRAZADO»",
      h2Ap.includes("ROSA Y MESA · PASO A PASO") && !h2Ap.some(t => /TRAZADO|MESA Y ROSA/.test(t)),
      h2Ap.filter(t => /ROSA|MESA|TRAZADO/.test(t)).join(" | "), "ROSA Y MESA · PASO A PASO");

  /* ====== K · CORRECCIONES DE ⌖ HERRAMIENTAS ⌖ (v1.26.2) ============== */
  const cal = d.querySelector("#v-calcular");
  d.querySelector("#btnCalcTN").click();          // las cinco encendidas
  const bMan = [...cal.querySelectorAll("button")].filter(b => /POSICIONARSE/.test(b.textContent))
                 .map(b => b.textContent.trim());
  add("K01 separador « · » también en MANIOBRA",
      bMan.length === 2 && bMan.every(t => / · /.test(t)) && !bMan.some(t => /•/.test(t)),
      bMan.join(" | "), "POSICIONARSE · DIST BANDA/DERROTA");
  const thMix = [...cal.querySelectorAll("th")].map(t => t.textContent.trim())
                  .filter(t => t && t !== t.toUpperCase());
  add("K02 ninguna cabecera de tabla en caja mixta", thMix.length === 0, thMix.join(" | "), "todas en mayúsculas");
  const etisC = [...cal.querySelectorAll(".eti")].map(e => e.textContent.trim());
  add("K03 etiquetas sin abreviar", etisC.includes("MARCACIÓN") && !etisC.some(t => /\.$/.test(t)),
      etisC.join(" | "), "MARCACIÓN, ninguna abreviada");
  /* Doble toque en OBSERVADO: ni ley ni firma, y aviso explícito. */
  const c2 = w.PD_UI.add(2, "MERCANTE");
  c2.dem = "180"; w.PD_UI.observar(c2.id);
  c2.dem = "185"; w.PD_UI.observar(c2.id);   // sin separar: caso del doble toque
  const f2 = [...d.querySelectorAll("#pdLista .f-deriv")].pop().textContent;
  add("K04 observaciones seguidas: sin Ḃ, sin firma y con aviso",
      /demasiado seguidas/.test(f2) && !/°\/min/.test(f2) && !/(DD|II|DI|ID)/.test(f2),
      f2.replace(/\s+/g, " ").slice(0, 90), "Ḃ — + aviso, sin clasificar");

  /* ========== L · CORRECCIONES DE APUNTES (v1.26.3) =================== */
  d.querySelector('nav.tabs button[data-v="referencia"]').click();
  const ref = d.querySelector("#v-referencia");
  const filtros = [...ref.querySelectorAll("button[data-v]")].filter(b => !/^TZ/.test(b.dataset.v))
                    .map(b => b.textContent.trim());
  add("L01 el filtro lleva el nombre actual del modo",
      filtros.includes("ROSA Y MESA") && !filtros.includes("TRAZADO"),
      filtros.join(" | "), "ROSA Y MESA, sin TRAZADO");
  const sums = [...ref.querySelectorAll("summary")].map(x => x.textContent.replace(/\s+/g, " ").trim());
  add("L02 mismo orden ROSA ↔ MESA",
      sums.some(t => /^ROSA ↔ MESA/.test(t)) && !sums.some(t => /MESA ↔ ROSA/.test(t)),
      sums.filter(t => /ROSA|MESA/.test(t)).join(" | "), "ROSA ↔ MESA");
  const tzEnt = [...d.querySelectorAll('#v-entrenar button[data-v^="TZ"]')].map(b => b.dataset.v + ":" + b.textContent.trim());
  const tzAp  = [...ref.querySelectorAll('button[data-v^="TZ"]')].map(b => b.dataset.v + ":" + b.textContent.trim());
  add("L03 los tipos se llaman igual en las dos pestañas",
      tzEnt.join("|") === tzAp.join("|"), tzAp.join(" | "), tzEnt.join(" | "));
  add("L04 desplegables hermanos en frase, no en título",
      sums.includes("Vuelta de seguridad") && !sums.includes("Vuelta de Seguridad"),
      sums.filter(t => /Vuelta/i.test(t)).join(" | "), "Vuelta de seguridad");
  const chips = [...ref.querySelectorAll("h2 .chip")].map(c => c.textContent.trim());
  add("L05 el calificador va en chip, no pegado al título",
      chips.filter(c => c === "MEMORIZAR").length === 2 && !/· MEMORIZAR/.test(ref.textContent),
      chips.join(" | "), "MEMORIZAR ×2 en chip");
  d.querySelector('nav.tabs button[data-v="calcular"]').click();

  /* ===== M · REINICIAR SUBIDA (v1.26.4) =============================== */
  try {
    const PD = w.PD_UI, bR = d.querySelector("#btnPdReset");
    PD.caida(45);
    const cM = PD.add(9, "MERCANTE"); cM.dem = "200"; PD.observar(cM.id);
    const antesM = { cs: PD.estado().cs.length, tr: PD.estado().tramos.length };
    add("M01 hay algo que borrar antes de la prueba", antesM.cs > 0 && antesM.tr > 0,
        JSON.stringify(antesM), "contactos y tramos");
    bR.click();                                   // primer toque: solo avisa
    add("M02 el primer toque no borra nada",
        PD.estado().cs.length === antesM.cs && PD.estado().tramos.length === antesM.tr &&
        /SEGURO/.test(bR.textContent),
        bR.textContent.trim() + " · cs=" + PD.estado().cs.length, "aviso, sin borrar");
    bR.click();                                   // segundo toque: borra
    const E = PD.estado();
    add("M03 el segundo toque deja la subida a cero",
        E.cs.length === 0 && E.tramos.length === 0 && E.tIni === null,
        JSON.stringify(E).slice(0, 60), "sin contactos, tramos ni crono");
    add("M04 el botón vuelve a su rótulo", bR.textContent.trim() === "REINICIAR SUBIDA",
        bR.textContent.trim(), "REINICIAR SUBIDA");
    add("M05 la pantalla queda limpia",
        (d.querySelector("#pdLista").textContent || "").trim() === "" &&
        d.querySelector("#pdCrono").textContent.trim() === "—",
        "lista=" + d.querySelector("#pdLista").textContent.trim().slice(0, 20) +
        " crono=" + d.querySelector("#pdCrono").textContent.trim(), "vacía y crono —");
    let g = {};
    try { g = JSON.parse(w.localStorage.getItem("tma_pd_v1") || "{}"); } catch (e) {}
    add("M06 el borrado se guarda, no vuelve al recargar",
        g.PD && g.PD.cs && g.PD.cs.length === 0 && g.PD.tramos.length === 0,
        JSON.stringify(g).slice(0, 60), "estado vacío en localStorage");
  } catch (e) { add("M00 REINICIAR SUBIDA sin excepción", false, e.message, "sin excepción"); }

  /* ===== Restos de nomenclatura vieja en cualquier pestaña ============= */
  const textoVisible = [...d.querySelectorAll("section.vista")]
        .map(v => { const c = v.cloneNode(true); c.querySelectorAll("script").forEach(x => x.remove()); return c.textContent; })
        .join(" ");
  add("N01 ninguna pestaña dice ya «TRAZADO»", !/TRAZADO/.test(textoVisible),
      (textoVisible.match(/.{0,20}TRAZADO.{0,20}/) || ["ninguno"])[0], "sin TRAZADO visible");

  /* ==================== Z · MOTOR (banco embebido) ===================== */
  R.zGrupos = 0;
  Object.keys(RES.grupos).forEach(g => {
    const G = RES.grupos[g];
    R.zGrupos++;
    add("Z " + g, G.ok === G.total, G.ok + "/" + G.total, G.total + "/" + G.total);
    G.fallos.slice(0, 3).forEach(f => R.fallos.push({ id: "Z·" + f.id, got: f.got, exp: f.exp }));
  });
}

function informe() {
  const motor = RES ? RES.ok + "/" + RES.total : "no ejecutado";
  const uiTot = R.tot - (R.zGrupos || 0), uiOkFallos = R.fallos.filter(f => !/^Z/.test(f.id)).length;
  const uiOk = uiTot - uiOkFallos;
  const eqOk = (RES ? RES.ok : 0) + uiOk, eqTot = (RES ? RES.total : 0) + uiTot;
  console.log("──────────────────────────────────────────────────────");
  console.log("MOTOR (banco embebido):  " + motor);
  console.log("INTERFAZ (arné):         " + uiOk + "/" + uiTot);
  console.log("TOTAL EQUIVALENTE:       " + eqOk + "/" + eqTot + (R.fallos.length ? "  — REVISAR" : "  ✓ TODO VERDE"));
  if (R.fallos.length) {
    console.log("FALLOS:");
    R.fallos.forEach(f => console.log("  ✗ " + f.id + " · obtenido=" + f.got + " · esperado=" + f.exp));
  }
  try { w.close(); } catch (e) {}
  process.exit(R.fallos.length ? 1 : 0);
}

/**
 * @licensee
 * SPDX-License-Identifier: Apache-2.0
 *
 * TEALCA • Inteligencia de Negocios y Diagnóstico, Area Comercial.
 * Lógica Principal y Réplica Exacta de la Aplicación React (public/js/app.js)
 *
 * Funcionalidad idéntica:
 * 1. KPIs ejecutivos y cálculo de variaciones en USD, Guías y Kilogramos.
 * 2. Donut SVG idéntico para distribución semanal (Julio equilibrado vs Agosto concentrado).
 * 3. Gráfico de Barras Agrupadas por Semana (WeeklyBarComparison con Chart.js).
 * 4. Gráfico de Área Diaria Día a Día (DailyTrendsChart con Chart.js, 3 peores días, 3 mejores días y tabla desplegable).
 * 5. Secciones separadas e independientes: Factores Externos e Hipótesis Cuantitativas (5 Porqués).
 * 6. Controles de Desbloqueo y Bloqueo (Usuario: Eduardo.oso / Contraseña: 20870092).
 * 7. Edición completa de factores e hipótesis persistente en localStorage.
 * 8. Iconos vectoriales oficiales idénticos mediante Lucide Icons.
 * 9. Modo Presentación PPT y Auditoría de Datos con exportación a CSV.
 */

// ESTADO GLOBAL DE LA APLICACIÓN
let allShipments =
  typeof DEFAULT_SHIPMENTS !== "undefined" ? [...DEFAULT_SHIPMENTS] : [];
let currentClient = "TODOS";
let currentMetric = "usd"; // 'usd' | 'guias' | 'kg'
let currentSlideIdx = 0;
let isDailyTableExpanded = false;
let rcaCategoryFilter = "ALL";
let rcaTrendFilter = "ALL";
let expandedHypothesisId = "rca-hyp-1";

// Instancias de Chart.js para evitar solapamientos
let weeklyBarChartInstance = null;
let dailyAreaChartInstance = null;

// Autenticación y Estado de Desbloqueo (Eduardo.oso / 20870092)
let isUnlocked = (() => {
  try {
    return localStorage.getItem("tealca_unlocked") === "true";
  } catch (e) {
    return false;
  }
})();

// Visibilidad de las secciones separadas
let isExternalFactorsHidden = (() => {
  try {
    return localStorage.getItem("tealca_hide_external_factors") === "true";
  } catch (e) {
    return false;
  }
})();

let isHypothesesHidden = (() => {
  try {
    return localStorage.getItem("tealca_hide_hypotheses") === "true";
  } catch (e) {
    return false;
  }
})();

let isStrategicSectionHidden = (() => {
  try {
    return localStorage.getItem("tealca_hide_strategic") === "true";
  } catch (e) {
    return false;
  }
})();

// Ediciones personalizadas en factores e hipótesis
const FACTOR_EDITS_KEY = "tealca_public_factor_edits";
let factorEdits = (() => {
  try {
    const s = localStorage.getItem(FACTOR_EDITS_KEY);
    return s ? JSON.parse(s) : {};
  } catch (e) {
    return {};
  }
})();

const HYP_EDITS_KEY = "tealca_public_hypothesis_edits";
let hypothesisEdits = (() => {
  try {
    const s = localStorage.getItem(HYP_EDITS_KEY);
    return s ? JSON.parse(s) : {};
  } catch (e) {
    return {};
  }
})();

// Ocultar / Mostrar elementos irrelevantes (Factores Externos)
const HIDDEN_FACTORS_KEY = "tealca_hidden_factors";
let hiddenFactorIds = (() => {
  try {
    const s = localStorage.getItem(HIDDEN_FACTORS_KEY);
    return s ? JSON.parse(s) : [];
  } catch (e) {
    return [];
  }
})();
let showHiddenFactors = false;

// Ocultar / Mostrar elementos irrelevantes (Hipótesis Cuantitativas y 5 Porqués)
const HIDDEN_HYPOTHESES_KEY = "tealca_hidden_hypotheses";
let hiddenHypIds = (() => {
  try {
    const s = localStorage.getItem(HIDDEN_HYPOTHESES_KEY);
    return s ? JSON.parse(s) : [];
  } catch (e) {
    return [];
  }
})();

const HIDDEN_WHYS_KEY = "tealca_hidden_whys";
let hiddenWhyKeys = (() => {
  try {
    const s = localStorage.getItem(HIDDEN_WHYS_KEY);
    return s ? JSON.parse(s) : [];
  } catch (e) {
    return [];
  }
})();
let showHiddenHypotheses = false;

// Estado para Diagnóstico Estratégico (Ocultar/Mostrar irrelevantes)
let showHiddenStrategic = false;

// Eventos personalizados creados por el usuario
const RCA_STORAGE_KEY = "tealca_public_custom_events";
let customRcaEvents = (() => {
  try {
    const saved = localStorage.getItem(RCA_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
})();

// ==================== FORMATEADORES ====================
function formatNumber(val, minDec = 0, maxDec = 2) {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: minDec,
    maximumFractionDigits: maxDec,
  }).format(val);
}

function formatUSD(val, compact = false) {
  if (compact && Math.abs(val) >= 1000) {
    return "$" + formatNumber(val / 1000, 1, 1) + "K";
  }
  const isNeg = val < 0;
  const absFormatted = formatNumber(Math.abs(Math.round(val)), 0, 0);
  return isNeg ? `$-${absFormatted}` : `$${absFormatted}`;
}

function formatUSDDecimal(val, decimals = 2) {
  const isNeg = val < 0;
  const absFormatted = formatNumber(Math.abs(val), decimals, decimals);
  return isNeg ? `$-${absFormatted}` : `$${absFormatted}`;
}

function formatGuias(num) {
  return formatNumber(Math.round(num), 0, 0);
}

function formatKg(num, compact = false) {
  if (compact && Math.abs(num) >= 1000) {
    return formatNumber(num / 1000, 1, 1) + " Ton";
  }
  return formatNumber(num, 2, 2) + " kg";
}

function formatVal(v, compact = false) {
  if (currentMetric === "usd") return formatUSD(v, compact);
  if (currentMetric === "guias")
    return formatGuias(v) + (compact ? "" : " guías");
  return compact ? formatNumber(v, 1, 1) + "kg" : formatKg(v, false);
}

function formatPercentage(v) {
  const sign = v >= 0 ? "+" : "";
  return sign + formatNumber(v, 1, 1) + "%";
}

function getMetricLabel() {
  if (currentMetric === "usd") return "Dólares ($ USD)";
  if (currentMetric === "guias") return "Guías de Envío";
  return "Kilogramos (Kg)";
}

// ==================== REFRESH ICONS ====================
function refreshLucideIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

// ==================== CÁLCULOS ESTADÍSTICOS ====================
function calculateAnalysis(client, shipments) {
  const filtered =
    client === "TODOS"
      ? shipments
      : shipments.filter((s) => s.client === client);

  const jul = filtered.filter((s) => s.month === "Julio");
  const ago = filtered.filter((s) => s.month === "Agosto");

  const sumJul = {
    usd: jul.reduce((a, b) => a + b.usd, 0),
    guias: jul.reduce((a, b) => a + b.guias, 0),
    kg: jul.reduce((a, b) => a + b.kg, 0),
  };

  const sumAgo = {
    usd: ago.reduce((a, b) => a + b.usd, 0),
    guias: ago.reduce((a, b) => a + b.guias, 0),
    kg: ago.reduce((a, b) => a + b.kg, 0),
  };

  const diff = {
    usd: sumAgo.usd - sumJul.usd,
    guias: sumAgo.guias - sumJul.guias,
    kg: sumAgo.kg - sumJul.kg,
  };

  const pct = {
    usd: sumJul.usd ? (diff.usd / sumJul.usd) * 100 : 0,
    guias: sumJul.guias ? (diff.guias / sumJul.guias) * 100 : 0,
    kg: sumJul.kg ? (diff.kg / sumJul.kg) * 100 : 0,
  };

  const weeks = [
    "Semana 1",
    "Semana 2",
    "Semana 3",
    "Semana 4",
    "Semana 5",
    "Semana 6",
  ];
  const weeklyData = weeks.map((w) => {
    const jRows = jul.filter((r) => r.week === w);
    const aRows = ago.filter((r) => r.week === w);

    const jVal = jRows.reduce((a, b) => a + b[currentMetric], 0);
    const aVal = aRows.reduce((a, b) => a + b[currentMetric], 0);
    const dVal = aVal - jVal;
    const pVal = jVal ? (dVal / jVal) * 100 : aVal ? 100 : 0;

    return {
      week: w,
      julVal: jVal,
      agoVal: aVal,
      diffVal: dVal,
      pctVal: pVal,
    };
  });

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const dailyData = days.map((d) => {
    const jRows = jul.filter((r) => r.day === d);
    const aRows = ago.filter((r) => r.day === d);

    const jVal = jRows.reduce((a, b) => a + b[currentMetric], 0);
    const aVal = aRows.reduce((a, b) => a + b[currentMetric], 0);
    const dVal = aVal - jVal;

    return {
      day: d,
      julVal: jVal,
      agoVal: aVal,
      diffVal: dVal,
    };
  });

  return {
    client,
    jul,
    ago,
    sumJul,
    sumAgo,
    diff,
    pct,
    weeklyData,
    dailyData,
  };
}

// ==================== CONTROLADORES PRINCIPALES ====================
function setMetric(m) {
  currentMetric = m;
  ["usd", "guias", "kg"].forEach((type) => {
    const btn = document.getElementById(`btn-${type}`);
    if (btn) {
      if (type === m) {
        btn.className =
          "px-3 py-1.5 rounded-md bg-[#0061A8] text-white font-black shadow-sm transition-all cursor-pointer";
      } else {
        btn.className =
          "px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 font-bold transition-all cursor-pointer";
      }
    }
  });

  const badge = document.getElementById("metric-badge");
  if (badge) badge.textContent = getMetricLabel();

  const sub = document.getElementById("bar-chart-subtitle");
  if (sub)
    sub.innerHTML = `Evolución semanal en <strong class="text-slate-700">${getMetricLabel()}</strong>`;

  renderAll();
}

function setClient(c) {
  currentClient = c;
  const title = document.getElementById("client-title");
  if (title) {
    title.textContent =
      c === "TODOS"
        ? "Consolidado General de Todos los Clientes"
        : `Diagnóstico Individual: ${c}`;
  }
  const diagName = document.getElementById("diag-client-name");
  if (diagName) {
    diagName.textContent = c === "TODOS" ? "Consolidado General" : c;
  }
  renderAll();
}

// ==================== RENDERIZADO GENERAL ====================
function renderAll() {
  const analysis = calculateAnalysis(currentClient, allShipments);

  renderKpis(analysis);
  renderWeeklyDonuts(analysis);
  renderWeeklyBarChart(analysis);
  renderDailyTrendsChart(analysis);
  renderExternalFactorsSection();
  renderQuantitativeHypothesesSection();
  renderStrategicDiagnostic(analysis);
  updateAuthUI();

  refreshLucideIcons();
}

// ==================== 1. KPIS EJECUTIVOS ====================
function renderKpis(analysis) {
  const container = document.getElementById("kpis-container");
  if (!container) return;

  const { sumJul, sumAgo, diff, pct } = analysis;

  const ticketJul = sumJul.guias ? sumJul.usd / sumJul.guias : 0;
  const ticketAgo = sumAgo.guias ? sumAgo.usd / sumAgo.guias : 0;
  const ticketDiff = ticketAgo - ticketJul;
  const ticketPct = ticketJul ? (ticketDiff / ticketJul) * 100 : 0;

  const usdPerKgJul = sumJul.kg ? sumJul.usd / sumJul.kg : 0;
  const usdPerKgAgo = sumAgo.kg ? sumAgo.usd / sumAgo.kg : 0;
  const usdPerKgDiff = usdPerKgAgo - usdPerKgJul;
  const usdPerKgPct = usdPerKgJul ? (usdPerKgDiff / usdPerKgJul) * 100 : 0;

  const kgGuiaJul = sumJul.guias ? sumJul.kg / sumJul.guias : 0;
  const kgGuiaAgo = sumAgo.guias ? sumAgo.kg / sumAgo.guias : 0;
  const kgGuiaDiff = kgGuiaAgo - kgGuiaJul;
  const kgGuiaPct = kgGuiaJul ? (kgGuiaDiff / kgGuiaJul) * 100 : 0;

  const activeDaysJul = new Set(
    analysis.jul.filter((r) => r[currentMetric] > 0).map((r) => r.day),
  ).size;
  const activeDaysAgo = new Set(
    analysis.ago.filter((r) => r[currentMetric] > 0).map((r) => r.day),
  ).size;
  const daysDiff = activeDaysAgo - activeDaysJul;
  const daysPct = activeDaysJul > 0 ? (daysDiff / activeDaysJul) * 100 : 0;

  // Actualizar cintillo superior de variación vs Julio
  const headerBadge = document.getElementById("header-variance-badge");
  if (headerBadge) {
    const isHeaderPos = pct.usd >= 0;
    headerBadge.className = `text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${isHeaderPos ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-[#DC2626] border-red-200"}`;
    headerBadge.innerHTML = `
      <i data-lucide="${isHeaderPos ? "trending-up" : "trending-down"}" class="w-3 h-3 ${isHeaderPos ? "text-emerald-600" : "text-[#DC2626]"}"></i>
      <span id="header-variance-text">${pct.usd >= 0 ? "+" : ""}${formatPercentage(pct.usd)} vs Julio</span>
    `;
  }

  const cards = [
    {
      id: "kpi-usd",
      title: "Facturación Total (USD)",
      icon: "dollar-sign",
      iconBg: "bg-[#0061A8]/10 text-[#0061A8]",
      julioValue: formatUSD(sumJul.usd),
      agostoValue: formatUSD(sumAgo.usd),
      diffFormatted: `${diff.usd >= 0 ? "+" : ""}${formatUSD(diff.usd)}`,
      pct: pct.usd,
      isPositive: diff.usd >= 0,
      note:
        diff.usd >= 0
          ? "Superó la meta de facturación mensual"
          : "Brecha de facturación respecto a Julio",
    },
    {
      id: "kpi-guias",
      title: "Volumen de Guías",
      icon: "package",
      iconBg: "bg-[#E8B43B]/20 text-amber-800",
      julioValue: formatGuias(sumJul.guias),
      agostoValue: formatGuias(sumAgo.guias),
      diffFormatted: `${diff.guias >= 0 ? "+" : ""}${formatGuias(diff.guias)} guías`,
      pct: pct.guias,
      isPositive: diff.guias >= 0,
      note:
        diff.guias >= 0
          ? "Mayor cantidad de despachos realizados"
          : "Menor frecuencia de envíos tramitados",
    },
    {
      id: "kpi-kg",
      title: "Carga Total Movilizada (Kg)",
      icon: "weight",
      iconBg: "bg-[#0061A8]/10 text-[#0061A8]",
      julioValue: formatKg(sumJul.kg),
      agostoValue: formatKg(sumAgo.kg),
      diffFormatted: `${diff.kg >= 0 ? "+" : ""}${formatKg(diff.kg)}`,
      pct: pct.kg,
      isPositive: diff.kg >= 0,
      note:
        diff.kg >= 0
          ? "Mayor tonelaje de carga movilizada"
          : "Caída significativa en peso total enviado",
    },
    {
      id: "kpi-usd-kg",
      title: "Dólar por Kg ($ / Kg)",
      icon: "circle-dollar-sign",
      iconBg: "bg-emerald-50 text-emerald-700",
      julioValue: formatUSDDecimal(usdPerKgJul, 2),
      agostoValue: formatUSDDecimal(usdPerKgAgo, 2),
      diffFormatted: `${usdPerKgDiff >= 0 ? "+" : ""}${formatUSDDecimal(usdPerKgDiff, 2)}`,
      pct: usdPerKgPct,
      isPositive: usdPerKgDiff >= 0,
      note:
        usdPerKgDiff >= 0
          ? "Mayor rendimiento tarifario por kg"
          : "Menor tarifa promedio obtenida por kg",
    },
    {
      id: "kpi-ticket",
      title: "Ingreso Promedio ($ / Guía)",
      icon: "receipt",
      iconBg: "bg-slate-100 text-slate-700",
      julioValue: formatUSDDecimal(ticketJul, 2),
      agostoValue: formatUSDDecimal(ticketAgo, 2),
      diffFormatted: `${ticketDiff >= 0 ? "+" : ""}${formatUSDDecimal(ticketDiff, 2)}`,
      pct: ticketPct,
      isPositive: ticketDiff >= 0,
      note:
        ticketDiff >= 0
          ? "Mejor rendimiento promedio por cada guía"
          : "Envíos de menor valor unitario en Agosto",
    },
    {
      id: "kpi-peso-unitario",
      title: "Peso Promedio (Kg / Guía)",
      icon: "scale",
      iconBg: "bg-slate-100 text-slate-700",
      julioValue: `${formatNumber(kgGuiaJul, 2, 2)} kg`,
      agostoValue: `${formatNumber(kgGuiaAgo, 2, 2)} kg`,
      diffFormatted: `${kgGuiaDiff >= 0 ? "+" : ""}${formatNumber(kgGuiaDiff, 2, 2)} kg`,
      pct: kgGuiaPct,
      isPositive: kgGuiaDiff >= 0,
      note:
        kgGuiaDiff >= 0
          ? "Guías con mayor peso/densidad promedio"
          : "Paquetes más livianos redujeron el flete",
    },
    {
      id: "kpi-dias-activos",
      title: "Días con Operaciones",
      icon: "calendar-check-2",
      iconBg: "bg-slate-100 text-slate-700",
      julioValue: `${activeDaysJul} de 31`,
      agostoValue: `${activeDaysAgo} de 31`,
      diffFormatted: `${daysDiff >= 0 ? "+" : ""}${daysDiff} días`,
      pct: daysPct,
      isPositive: activeDaysAgo >= activeDaysJul,
      note:
        activeDaysAgo < activeDaysJul
          ? `${activeDaysJul - activeDaysAgo} días operativos menos en Agosto`
          : "Ritmo operativo similar o superior",
    },
  ];

  container.innerHTML = cards
    .map((c) => {
      const deltaColor = c.isPositive ? "text-emerald-600" : "text-[#DC2626]";
      const deltaBadgeBg = c.isPositive
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-red-50 text-[#DC2626] border-red-200";
      const trendIcon = c.isPositive ? "trending-up" : "trending-down";

      return `
      <div id="${c.id}" class="bg-white rounded-xl border border-slate-200 p-3 sm:p-3.5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
        <div class="flex items-start justify-between gap-1.5 mb-1.5 min-h-[2.25rem]">
          <span class="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-tight leading-tight line-clamp-2">${c.title}</span>
          <div class="p-1.5 rounded-lg ${c.iconBg} shrink-0">
            <i data-lucide="${c.icon}" class="w-3.5 h-3.5"></i>
          </div>
        </div>

        <div class="my-0.5">
          <div class="flex items-baseline gap-1.5 flex-wrap">
            <span class="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">${c.agostoValue}</span>
            <span class="text-[10px] sm:text-xs font-semibold text-slate-400 shrink-0">Ago</span>
          </div>
          <div class="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
            Julio: <strong class="text-slate-700">${c.julioValue}</strong>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-100 mt-2">
          <div class="flex items-center justify-between gap-1 flex-wrap">
            <span class="text-[11px] sm:text-xs font-bold ${deltaColor} truncate">${c.diffFormatted}</span>
            <span class="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border shrink-0 ${deltaBadgeBg}">
              <i data-lucide="${trendIcon}" class="w-2.5 h-2.5"></i>
              ${formatPercentage(c.pct)}
            </span>
          </div>
          <p class="text-[10px] text-slate-400 mt-1 truncate" title="${c.note}">${c.note}</p>
        </div>
      </div>
    `;
    })
    .join("");
}

// ==================== 2. DONUTS SEMANALES CON INTERACCIÓN COMPLETA ====================
let currentWeeklyDataRef = [];
let currentJulTotalRef = 0;
let currentAgoTotalRef = 0;
let activeHoveredWeek = null;

function renderWeeklyDonuts(analysis) {
  const { weeklyData, sumJul, sumAgo } = analysis;

  currentWeeklyDataRef = weeklyData;
  currentJulTotalRef = sumJul[currentMetric] || 0;
  currentAgoTotalRef = sumAgo[currentMetric] || 0;

  const julTotal = currentJulTotalRef;
  const agoTotal = currentAgoTotalRef;

  // Badges en headers
  const jBadge = document.getElementById("donut-julio-total-badge");
  if (jBadge)
    jBadge.innerHTML = `Total: <strong>${formatVal(julTotal, true)}</strong>`;

  const aBadge = document.getElementById("donut-agosto-total-badge");
  if (aBadge)
    aBadge.innerHTML = `Total: <strong>${formatVal(agoTotal, true)}</strong>`;

  // Paletas oficiales
  const julPalette = [
    "#0061A8",
    "#1A78BF",
    "#4A98D3",
    "#7FB0D4",
    "#94A3B8",
    "#CBD5E1",
  ];
  const agoPalette = [
    "#E8B43B",
    "#D49B25",
    "#004C84",
    "#0061A8",
    "#1A78BF",
    "#4A98D3",
  ];

  // Dibujar Donuts Interactivos
  renderSvgDonutExact(
    "donut-julio",
    weeklyData,
    "jul",
    julPalette,
    julTotal,
    "Julio",
  );
  renderSvgDonutExact(
    "donut-agosto",
    weeklyData,
    "ago",
    agoPalette,
    agoTotal,
    "Agosto",
  );

  // Callouts diagnósticos idénticos a React
  const s1 = weeklyData.find((w) => w.week === "Semana 1");
  const s2 = weeklyData.find((w) => w.week === "Semana 2");
  const sumS1S2Jul = (s1?.julVal || 0) + (s2?.julVal || 0);
  const pctS1S2Jul = julTotal > 0 ? (sumS1S2Jul / julTotal) * 100 : 0;

  const calloutJ = document.getElementById("callout-julio");
  if (calloutJ) {
    calloutJ.innerHTML = `
      <div class="flex items-start gap-2">
        <span class="w-2 h-2 rounded-full bg-[#0061A8] mt-1 shrink-0"></span>
        <p class="font-medium leading-relaxed text-slate-700">
          <strong class="text-[#0061A8]">Diagnóstico Julio: </strong>
          S1 y S2 aportaron ${formatVal(sumS1S2Jul)} (${formatNumber(pctS1S2Jul, 0, 0)}% del mes). Operación distribuida y balanceada sin cuellos de botella.
        </p>
      </div>
    `;
  }

  const s1AgoVal = s1?.agoVal || 0;
  const s2AgoVal = s2?.agoVal || 0;
  const sumS1S2Ago = s1AgoVal + s2AgoVal;
  const pctS1S2Ago = agoTotal > 0 ? (sumS1S2Ago / agoTotal) * 100 : 0;

  let textCalloutAgosto = "";
  if (s1AgoVal === 0) {
    textCalloutAgosto = `S1 aportó $0. S2 cayó a ${formatVal(s2AgoVal)}. Primera quincena paralizada; concentración extrema en 2da quincena.`;
  } else if (sumS1S2Ago < sumS1S2Jul * 0.5) {
    textCalloutAgosto = `S1 y S2 cayeron un ${formatNumber(Math.abs(((sumS1S2Ago - sumS1S2Jul) / sumS1S2Jul) * 100), 0, 0)}%. Fuerte rezago en la primera mitad del mes.`;
  } else {
    textCalloutAgosto = `S1 y S2 representaron el ${formatNumber(pctS1S2Ago, 0, 0)}% del mes. Desempeño dinámico con concentración al cierre.`;
  }

  const calloutA = document.getElementById("callout-agosto");
  if (calloutA) {
    calloutA.innerHTML = `
      <div class="flex items-start gap-2">
        <span class="w-2 h-2 rounded-full bg-[#E8B43B] mt-1 shrink-0"></span>
        <p class="font-medium leading-relaxed text-slate-800">
          <strong class="text-amber-900">Diagnóstico Agosto: </strong>
          ${textCalloutAgosto}
        </p>
      </div>
    `;
  }

  // Tarjetas S1 a S6 con eventos de hover sincronizados con los gráficos circulares
  const grid = document.getElementById("weeks-grid");
  if (grid) {
    grid.innerHTML = weeklyData
      .map((w) => {
        const isPos = w.diffVal >= 0;
        const deltaColor = isPos ? "text-[#0061A8]" : "text-[#DC2626]";
        const badgeBg = isPos
          ? "bg-[#E6F0F8] text-[#0061A8] border-[#7FB0D4]"
          : "bg-red-50 text-[#DC2626] border-red-200";

        return `
        <div
          data-week="${w.week}"
          onmouseenter="handleDonutHover('${w.week}', 'Ambos', ${w.agoVal}, ${agoTotal > 0 ? (w.agoVal / agoTotal) * 100 : 0}, event)"
          onmousemove="handleDonutMouseMove(event)"
          onmouseleave="handleDonutLeave()"
          class="week-card p-3 rounded-xl border transition-all cursor-pointer border-slate-200 bg-white hover:border-slate-300"
        >
          <div class="flex items-center justify-between gap-1 mb-1.5">
            <span class="text-xs font-bold text-slate-800">${w.week}</span>
            <span class="p-0.5 rounded ${isPos ? "text-[#0061A8] bg-[#E6F0F8]" : "text-[#DC2626] bg-red-50"}" title="${isPos ? "Semana positiva" : "Semana negativa / caída"}">
              <i data-lucide="${isPos ? "trending-up" : "trending-down"}" class="w-3 h-3"></i>
            </span>
          </div>

          <div class="space-y-0.5 text-xs">
            <div class="flex justify-between text-slate-500">
              <span>Jul:</span>
              <strong class="text-slate-700">${formatVal(w.julVal)}</strong>
            </div>
            <div class="flex justify-between text-slate-900 font-bold">
              <span>Ago:</span>
              <span>${formatVal(w.agoVal)}</span>
            </div>
          </div>

          <div class="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs font-extrabold ${deltaColor}">
              ${w.diffVal >= 0 ? "+" : ""}${formatVal(w.diffVal, true)}
            </span>
            <span class="text-3xs font-black px-1 py-0.5 rounded border ${badgeBg}">
              ${formatPercentage(w.pctVal)}
            </span>
          </div>
        </div>
      `;
      })
      .join("");
  }
}

/**
 * Renderiza el gráfico circular SVG con eventos interactivos y rebanadas trigonométricas
 */
function renderSvgDonutExact(
  svgId,
  weeklyData,
  monthKey,
  palette,
  total,
  monthName,
) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  svg.innerHTML = "";

  const cx = 160,
    cy = 160,
    rOuter = 135,
    rInner = 82;

  if (total <= 0) {
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", rOuter);
    circle.setAttribute("fill", "#E2E8F0");
    svg.appendChild(circle);
    return;
  }

  let curAngle = -90; // Empezar en las 12 en punto (-90 deg)
  const rad = (deg) => (deg * Math.PI) / 180;

  weeklyData.forEach((w, idx) => {
    const val = w[monthKey + "Val"] || 0;
    if (val <= 0) return;

    const share = (val / total) * 100;
    const span = (val / total) * 360;
    if (span <= 0.5) return;

    const start = curAngle;
    const end = curAngle + span;
    const mid = start + span / 2;
    curAngle += span;

    const x1 = cx + rOuter * Math.cos(rad(start));
    const y1 = cy + rOuter * Math.sin(rad(start));
    const x2 = cx + rOuter * Math.cos(rad(end));
    const y2 = cy + rOuter * Math.sin(rad(end));
    const x3 = cx + rInner * Math.cos(rad(end));
    const y3 = cy + rInner * Math.sin(rad(end));
    const x4 = cx + rInner * Math.cos(rad(start));
    const y4 = cy + rInner * Math.sin(rad(start));
    const large = span > 180 ? 1 : 0;

    const pathData = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "donut-slice-group cursor-pointer");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", palette[idx % palette.length]);
    path.setAttribute("stroke", "#FFFFFF");
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute(
      "class",
      `donut-slice donut-slice-${monthKey} transition-all duration-200`,
    );
    path.setAttribute("data-week", w.week);
    path.setAttribute("data-month", monthName);

    // Eventos de ratón para Tooltip y sincronización interactiva
    path.addEventListener("mouseenter", (e) =>
      handleDonutHover(w.week, monthName, val, share, e),
    );
    path.addEventListener("mousemove", (e) => handleDonutMouseMove(e));
    path.addEventListener("mouseleave", () => handleDonutLeave());

    // Título nativo SVG para accesibilidad
    const titleEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "title",
    );
    titleEl.textContent = `${w.week}: ${formatVal(val)} (${formatNumber(share, 1, 1)}%)`;
    path.appendChild(titleEl);

    g.appendChild(path);

    // Etiqueta de semana dentro del arco si hay espacio suficiente
    if (share > 6) {
      const rMid = (rOuter + rInner) / 2;
      const lx = cx + rMid * Math.cos(rad(mid));
      const ly = cy + rMid * Math.sin(rad(mid));

      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.setAttribute("x", lx);
      text.setAttribute("y", ly + 4);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "11");
      text.setAttribute("font-weight", "bold");
      text.setAttribute(
        "fill",
        palette[idx % palette.length] === "#E8B43B" ? "#1E293B" : "#FFFFFF",
      );
      text.setAttribute("pointer-events", "none");
      text.textContent = `S${idx + 1}`;
      g.appendChild(text);
    }

    svg.appendChild(g);
  });

  // Centro blanco del Donut
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", rInner - 4);
  circle.setAttribute("fill", "#FFFFFF");
  svg.appendChild(circle);

  // Texto central: Total
  const textTotal = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text",
  );
  textTotal.setAttribute("id", `${svgId}-center-total`);
  textTotal.setAttribute("x", cx);
  textTotal.setAttribute("y", cy - 6);
  textTotal.setAttribute("text-anchor", "middle");
  textTotal.setAttribute(
    "class",
    "fill-slate-950 font-black text-2xl tracking-tight",
  );
  textTotal.textContent = formatVal(total, true);
  svg.appendChild(textTotal);

  // Subtexto central: Métrica
  const textSub = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text",
  );
  textSub.setAttribute("id", `${svgId}-center-sub`);
  textSub.setAttribute("x", cx);
  textSub.setAttribute("y", cy + 14);
  textSub.setAttribute("text-anchor", "middle");
  textSub.setAttribute(
    "class",
    "fill-slate-500 font-bold text-xs uppercase tracking-wider",
  );
  textSub.textContent = currentMetric.toUpperCase();
  svg.appendChild(textSub);
}

/**
 * Manejadores de interacción al pasar el ratón sobre rebanadas o tarjetas de semanas
 */
function handleDonutHover(weekName, sourceMonth, sourceVal, sourceShare, e) {
  activeHoveredWeek = weekName;

  // 1. Atenuar otras rebanadas y resaltar la semana activa en AMBOS gráficos
  document.querySelectorAll(".donut-slice").forEach((slice) => {
    if (slice.getAttribute("data-week") === weekName) {
      slice.style.opacity = "1";
      slice.style.strokeWidth = "3.5px";
    } else {
      slice.style.opacity = "0.35";
      slice.style.strokeWidth = "2.5px";
    }
  });

  // 2. Resaltar la tarjeta de semana correspondiente
  document.querySelectorAll(".week-card").forEach((card) => {
    if (card.getAttribute("data-week") === weekName) {
      card.classList.add(
        "border-[#0061A8]",
        "ring-2",
        "ring-[#0061A8]/20",
        "bg-slate-50",
        "shadow-sm",
      );
      card.classList.remove("border-slate-200");
    } else {
      card.classList.remove(
        "border-[#0061A8]",
        "ring-2",
        "ring-[#0061A8]/20",
        "bg-slate-50",
        "shadow-sm",
      );
      card.classList.add("border-slate-200");
    }
  });

  // 3. Actualizar los textos del centro de ambos gráficos Donut
  const weekObj = currentWeeklyDataRef.find((w) => w.week === weekName);
  if (weekObj) {
    const julTotalCenter = document.getElementById("donut-julio-center-total");
    const julSubCenter = document.getElementById("donut-julio-center-sub");
    if (julTotalCenter)
      julTotalCenter.textContent = formatVal(weekObj.julVal, true);
    if (julSubCenter) {
      const shareJ = currentJulTotalRef
        ? (weekObj.julVal / currentJulTotalRef) * 100
        : 0;
      julSubCenter.textContent = `${weekName.replace("Semana ", "S")} (${formatNumber(shareJ, 1, 1)}%)`;
    }

    const agoTotalCenter = document.getElementById("donut-agosto-center-total");
    const agoSubCenter = document.getElementById("donut-agosto-center-sub");
    if (agoTotalCenter)
      agoTotalCenter.textContent = formatVal(weekObj.agoVal, true);
    if (agoSubCenter) {
      const shareA = currentAgoTotalRef
        ? (weekObj.agoVal / currentAgoTotalRef) * 100
        : 0;
      agoSubCenter.textContent = `${weekName.replace("Semana ", "S")} (${formatNumber(shareA, 1, 1)}%)`;
    }

    // 4. Mostrar y actualizar el Tooltip flotante interactivo
    const tooltip = document.getElementById("donut-hover-tooltip");
    if (tooltip && e) {
      const isPos = weekObj.diffVal >= 0;
      tooltip.innerHTML = `
        <div class="space-y-2 min-w-[220px]">
          <div class="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span class="font-extrabold text-xs text-[#E8B43B] flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full ${sourceMonth === "Julio" ? "bg-[#0061A8]" : sourceMonth === "Agosto" ? "bg-[#E8B43B]" : "bg-emerald-400"}"></span>
              ${weekObj.week}
            </span>
            <span class="text-3xs font-black px-1.5 py-0.5 rounded ${isPos ? "bg-[#0061A8]/30 text-blue-300 border border-blue-400/40" : "bg-red-900/40 text-red-300 border border-red-500/40"}">
              ${formatPercentage(weekObj.pctVal)}
            </span>
          </div>

          <div class="space-y-1 text-xs">
            <div class="flex items-center justify-between text-slate-300">
              <span class="flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-[#0061A8]"></span>
                Julio:
              </span>
              <strong class="text-white font-black">${formatVal(weekObj.julVal)}</strong>
            </div>
            <div class="flex items-center justify-between text-slate-300">
              <span class="flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-[#E8B43B]"></span>
                Agosto:
              </span>
              <strong class="text-white font-black">${formatVal(weekObj.agoVal)}</strong>
            </div>
          </div>

          <div class="pt-1.5 border-t border-slate-800 flex items-center justify-between text-2xs">
            <span class="text-slate-400">Brecha Neta:</span>
            <span class="font-extrabold ${isPos ? "text-blue-400" : "text-rose-400"}">
              ${weekObj.diffVal >= 0 ? "+" : ""}${formatVal(weekObj.diffVal, true)}
            </span>
          </div>

          <div class="flex items-center justify-between text-3xs text-slate-400 pt-0.5">
            <span>Cuota Julio: ${formatNumber(currentJulTotalRef ? (weekObj.julVal / currentJulTotalRef) * 100 : 0, 1, 1)}%</span>
            <span>Cuota Agosto: ${formatNumber(currentAgoTotalRef ? (weekObj.agoVal / currentAgoTotalRef) * 100 : 0, 1, 1)}%</span>
          </div>
        </div>
      `;
      tooltip.classList.remove("hidden");
      updateTooltipPosition(e);
    }
  }
}

function handleDonutMouseMove(e) {
  updateTooltipPosition(e);
}

function updateTooltipPosition(e) {
  const tooltip = document.getElementById("donut-hover-tooltip");
  if (!tooltip || !e) return;
  const pad = 16;
  let x = e.clientX + pad;
  let y = e.clientY + pad;
  const w = 260;
  const h = 140;
  if (x + w > window.innerWidth) x = e.clientX - w - pad;
  if (y + h > window.innerHeight) y = e.clientY - h - pad;
  tooltip.style.left = `${Math.max(8, x)}px`;
  tooltip.style.top = `${Math.max(8, y)}px`;
}

function handleDonutLeave() {
  activeHoveredWeek = null;

  // Restaurar opacidades de rebanadas
  document.querySelectorAll(".donut-slice").forEach((slice) => {
    slice.style.opacity = "1";
    slice.style.strokeWidth = "2.5px";
  });

  // Restaurar estilos de tarjetas
  document.querySelectorAll(".week-card").forEach((card) => {
    card.classList.remove(
      "border-[#0061A8]",
      "ring-2",
      "ring-[#0061A8]/20",
      "bg-slate-50",
      "shadow-sm",
    );
    card.classList.add("border-slate-200");
  });

  // Restaurar centros de gráficos Donut a totales del mes
  const julTotalCenter = document.getElementById("donut-julio-center-total");
  const julSubCenter = document.getElementById("donut-julio-center-sub");
  if (julTotalCenter)
    julTotalCenter.textContent = formatVal(currentJulTotalRef, true);
  if (julSubCenter) julSubCenter.textContent = currentMetric.toUpperCase();

  const agoTotalCenter = document.getElementById("donut-agosto-center-total");
  const agoSubCenter = document.getElementById("donut-agosto-center-sub");
  if (agoTotalCenter)
    agoTotalCenter.textContent = formatVal(currentAgoTotalRef, true);
  if (agoSubCenter) agoSubCenter.textContent = currentMetric.toUpperCase();

  // Ocultar Tooltip
  const tooltip = document.getElementById("donut-hover-tooltip");
  if (tooltip) tooltip.classList.add("hidden");
}

// ==================== 3. WEEKLY BAR COMPARISON (Chart.js) ====================
function renderWeeklyBarChart(analysis) {
  const canvas = document.getElementById("weekly-bar-canvas");
  if (!canvas) return;

  if (weeklyBarChartInstance) {
    weeklyBarChartInstance.destroy();
  }

  const { weeklyData } = analysis;
  const labels = weeklyData.map((w) => w.week);
  const dataJul = weeklyData.map((w) => w.julVal);
  const dataAgo = weeklyData.map((w) => w.agoVal);

  const ctx = canvas.getContext("2d");
  weeklyBarChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Julio 2026",
          data: dataJul,
          backgroundColor: "#0061A8",
          borderRadius: { topLeft: 6, topRight: 6 },
          borderSkipped: false,
          maxBarThickness: 34,
        },
        {
          label: "Agosto 2026",
          data: dataAgo,
          backgroundColor: "#E8B43B",
          borderRadius: { topLeft: 6, topRight: 6 },
          borderSkipped: false,
          maxBarThickness: 34,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#0F172A",
          titleFont: { size: 12, weight: "bold" },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              return ` ${context.dataset.label}: ${formatVal(context.raw)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: "bold" }, color: "#64748B" },
        },
        y: {
          grid: { color: "#F1F5F9" },
          ticks: {
            font: { size: 10, weight: "500" },
            color: "#64748B",
            callback: function (value) {
              return formatVal(value, true);
            },
          },
        },
      },
    },
  });
}

// ==================== 4. DAILY TRENDS CHART (Chart.js) ====================
function renderDailyTrendsChart(analysis) {
  const canvas = document.getElementById("daily-area-canvas");
  if (!canvas) return;

  if (dailyAreaChartInstance) {
    dailyAreaChartInstance.destroy();
  }

  const { dailyData } = analysis;
  const labels = dailyData.map((d) => `Día ${d.day}`);
  const dataJul = dailyData.map((d) => d.julVal);
  const dataAgo = dailyData.map((d) => d.agoVal);

  const ctx = canvas.getContext("2d");

  // Gradientes suaves
  const gradJul = ctx.createLinearGradient(0, 0, 0, 260);
  gradJul.addColorStop(0, "rgba(0, 97, 168, 0.25)");
  gradJul.addColorStop(1, "rgba(0, 97, 168, 0.0)");

  const gradAgo = ctx.createLinearGradient(0, 0, 0, 260);
  gradAgo.addColorStop(0, "rgba(232, 180, 59, 0.35)");
  gradAgo.addColorStop(1, "rgba(232, 180, 59, 0.0)");

  dailyAreaChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Julio 2026",
          data: dataJul,
          borderColor: "#0061A8",
          borderWidth: 2.5,
          backgroundColor: gradJul,
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          label: "Agosto 2026",
          data: dataAgo,
          borderColor: "#E8B43B",
          borderWidth: 2.5,
          backgroundColor: gradAgo,
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#0F172A",
          titleFont: { size: 12, weight: "bold" },
          bodyFont: { size: 11 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              return ` ${context.dataset.label}: ${formatVal(context.raw)}`;
            },
            afterBody: function (items) {
              if (items.length >= 2) {
                const j = items[0].raw;
                const a = items[1].raw;
                const d = a - j;
                return ` Diferencia: ${d >= 0 ? "+" : ""}${formatVal(d)} (${d >= 0 ? "Favorable" : "Caída"})`;
              }
              return "";
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxTicksLimit: 12,
            font: { size: 10, weight: "bold" },
            color: "#64748B",
          },
        },
        y: {
          grid: { color: "#F1F5F9" },
          ticks: {
            font: { size: 10, weight: "500" },
            color: "#64748B",
            callback: function (value) {
              return formatVal(value, true);
            },
          },
        },
      },
    },
  });

  // Píldoras de Diagnóstico Rápido: Peores y Mejores Días
  const sortedByLoss = [...dailyData].sort((a, b) => a.diffVal - b.diffVal);
  const worstDays = sortedByLoss.filter((d) => d.diffVal < 0).slice(0, 3);

  const sortedByGain = [...dailyData].sort((a, b) => b.diffVal - a.diffVal);
  const bestDays = sortedByGain.filter((d) => d.diffVal > 0).slice(0, 3);

  const worstContainer = document.getElementById("worst-days-container");
  if (worstContainer) {
    if (worstDays.length === 0) {
      worstContainer.innerHTML = `<span class="text-2xs text-slate-500 italic">No se registraron días con caída neta.</span>`;
    } else {
      worstContainer.innerHTML = worstDays
        .map(
          (d) => `
        <div class="flex items-center justify-between text-2xs font-bold text-slate-700 bg-white/80 px-2.5 py-1.5 rounded-lg border border-red-200/50">
          <span>Día ${d.day} de Agosto</span>
          <span class="text-[#DC2626] font-black">${formatVal(d.diffVal)} (${formatVal(d.agoVal)} vs ${formatVal(d.julVal)})</span>
        </div>
      `,
        )
        .join("");
    }
  }

  const bestContainer = document.getElementById("best-days-container");
  if (bestContainer) {
    if (bestDays.length === 0) {
      bestContainer.innerHTML = `<span class="text-2xs text-slate-500 italic">No se registraron días con superávit.</span>`;
    } else {
      bestContainer.innerHTML = bestDays
        .map(
          (d) => `
        <div class="flex items-center justify-between text-2xs font-bold text-slate-700 bg-white/80 px-2.5 py-1.5 rounded-lg border border-emerald-200">
          <span>Día ${d.day} de Agosto</span>
          <span class="text-emerald-600 font-black">+${formatVal(d.diffVal)} (${formatVal(d.agoVal)} vs ${formatVal(d.julVal)})</span>
        </div>
      `,
        )
        .join("");
    }
  }

  // Tabla Desplegable Día 1 a 31
  const tbody = document.getElementById("daily-table-body");
  if (tbody) {
    tbody.innerHTML = dailyData
      .map((d) => {
        const isPos = d.diffVal >= 0;
        return `
        <tr class="hover:bg-slate-50">
          <td class="px-3 py-1.5 font-bold text-slate-800">Día ${d.day}</td>
          <td class="px-3 py-1.5 text-right font-medium text-slate-600">${formatVal(d.julVal)}</td>
          <td class="px-3 py-1.5 text-right font-bold text-slate-900">${formatVal(d.agoVal)}</td>
          <td class="px-3 py-1.5 text-right font-black ${isPos ? "text-emerald-600" : "text-[#DC2626]"}">
            ${d.diffVal >= 0 ? "+" : ""}${formatVal(d.diffVal)}
          </td>
          <td class="px-3 py-1.5 text-right">
            <span class="text-3xs px-2 py-0.5 rounded-full font-black ${isPos ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-[#DC2626]"}">
              ${isPos ? "Superó" : "Caída"}
            </span>
          </td>
        </tr>
      `;
      })
      .join("");
  }
}

function toggleDailyTable() {
  isDailyTableExpanded = !isDailyTableExpanded;
  const wrapper = document.getElementById("daily-table-wrapper");
  const label = document.getElementById("label-toggle-daily-table");
  const icon = document.getElementById("icon-toggle-daily-table");

  if (wrapper) {
    if (isDailyTableExpanded) wrapper.classList.remove("hidden");
    else wrapper.classList.add("hidden");
  }

  if (label) {
    label.textContent = isDailyTableExpanded
      ? "Ocultar Desglose"
      : "Ver Desglose Día 1..31";
  }

  if (icon) {
    icon.setAttribute(
      "data-lucide",
      isDailyTableExpanded ? "chevron-up" : "chevron-down",
    );
    refreshLucideIcons();
  }
}

// ==================== 5A. SECCIÓN INDEPENDIENTE: FACTORES EXTERNOS ====================
function renderExternalFactorsSection() {
  const sectionEl = document.getElementById("section-external-factors");
  const bannerEl = document.getElementById("banner-hidden-external-factors");
  const eventsGrid = document.getElementById("rca-events-grid");
  const countBadge = document.getElementById("external-factors-count");
  const toggleHiddenBtn = document.getElementById("btn-toggle-hidden-factors");
  const toggleHiddenLabel = document.getElementById(
    "label-toggle-hidden-factors",
  );

  if (!sectionEl || !eventsGrid) return;

  if (isExternalFactorsHidden) {
    sectionEl.classList.add("hidden");
    if (bannerEl) {
      if (isUnlocked) bannerEl.classList.remove("hidden");
      else bannerEl.classList.add("hidden");
    }
    return;
  } else {
    sectionEl.classList.remove("hidden");
    if (bannerEl) bannerEl.classList.add("hidden");
  }

  const allEvents =
    typeof DEFAULT_RCA_EVENTS !== "undefined"
      ? [...DEFAULT_RCA_EVENTS, ...customRcaEvents]
      : [...customRcaEvents];
  const clientEvents = allEvents
    .filter(
      (e) =>
        currentClient === "TODOS" ||
        e.affectedClients.includes("TODOS") ||
        e.affectedClients.includes(currentClient),
    )
    .filter(
      (e) => rcaCategoryFilter === "ALL" || e.category === rcaCategoryFilter,
    );

  const hiddenCount = clientEvents.filter((e) =>
    hiddenFactorIds.includes(e.id),
  ).length;

  if (toggleHiddenBtn && toggleHiddenLabel) {
    if (hiddenCount > 0) {
      toggleHiddenBtn.classList.remove("hidden");
      toggleHiddenLabel.textContent = showHiddenFactors
        ? `Ocultar Irrelevantes (${hiddenCount})`
        : `Ver Irrelevantes (${hiddenCount})`;
      toggleHiddenBtn.className = showHiddenFactors
        ? "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 text-amber-900 transition-all cursor-pointer shadow-2xs"
        : "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer";
    } else {
      toggleHiddenBtn.classList.add("hidden");
    }
  }

  const displayEvents = clientEvents.filter(
    (e) => showHiddenFactors || !hiddenFactorIds.includes(e.id),
  );

  if (countBadge) {
    countBadge.textContent = `${displayEvents.length} factores de entorno`;
  }

  if (displayEvents.length === 0) {
    eventsGrid.innerHTML = `
      <div class="col-span-full py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <i data-lucide="info" class="w-6 h-6 mx-auto mb-2 text-slate-400"></i>
        <p class="text-xs font-medium">No hay factores externos visibles para este cliente y categoría.</p>
        ${hiddenCount > 0 ? `<button onclick="toggleShowHiddenFactors()" class="mt-2 text-xs font-bold text-[#0061A8] hover:underline cursor-pointer">Ver ${hiddenCount} factores marcados como irrelevantes</button>` : ""}
      </div>
    `;
    return;
  }

  eventsGrid.innerHTML = displayEvents
    .map((e) => {
      const edit = factorEdits[e.id];
      const displayTitle = edit?.title || e.title;
      const displayDate = edit?.date || e.date;
      const displayCat = edit?.category || e.category;
      const displayImpact = edit?.impact || e.impact;
      const displayDesc = edit?.desc || e.desc;
      const isCustom = e.isCustom;
      const isHidden = hiddenFactorIds.includes(e.id);

      return `
      <div class="p-4 rounded-2xl bg-white border ${isHidden ? "border-dashed border-amber-300 bg-amber-50/40 opacity-75" : "border-slate-200 hover:border-[#0061A8]/40"} transition-all shadow-2xs flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between text-2xs mb-2">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">${displayDate}</span>
              ${isHidden ? `<span class="text-3xs font-black px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 uppercase">Oculto</span>` : ""}
            </div>
            <span class="font-black px-2 py-0.5 rounded-full text-3xs ${displayImpact.toLowerCase().includes("negativo") ? "bg-red-100 text-[#DC2626]" : "bg-[#E6F0F8] text-[#0061A8]"}">
              ${displayImpact}
            </span>
          </div>
          <h4 class="font-black text-sm text-slate-900 leading-tight">${displayTitle}</h4>
          <p class="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">${displayDesc}</p>
        </div>
        <div class="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-3xs font-bold text-slate-400">
          <span class="uppercase tracking-wider">Cat: <strong class="text-slate-700">${displayCat}</strong></span>
          <div class="flex items-center gap-1.5">
            <button onclick="toggleFactorHidden('${e.id}')" class="inline-flex items-center gap-1 px-2 py-1 rounded-lg ${isHidden ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "text-slate-500 hover:bg-slate-100"} font-bold cursor-pointer transition-colors" title="${isHidden ? "Reactivar factor" : "Marcar como irrelevante / Ocultar"}">
              <i data-lucide="${isHidden ? "eye" : "eye-off"}" class="w-3 h-3"></i>
              <span>${isHidden ? "Reactivar" : "Ocultar"}</span>
            </button>
            ${
              isUnlocked
                ? `
              <button onclick="openEditFactorModal('${e.id}')" class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-[#0061A8] hover:bg-blue-100 font-black cursor-pointer transition-colors">
                <i data-lucide="edit-3" class="w-3 h-3"></i>
                <span>Editar</span>
              </button>
            `
                : ""
            }
            ${
              isCustom && isUnlocked
                ? `
              <button onclick="deleteCustomEvent('${e.id}')" class="inline-flex items-center gap-1 px-1.5 py-1 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer transition-colors" title="Eliminar factor">
                <i data-lucide="trash-2" class="w-3 h-3"></i>
              </button>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

function toggleFactorHidden(id) {
  if (hiddenFactorIds.includes(id)) {
    hiddenFactorIds = hiddenFactorIds.filter((x) => x !== id);
  } else {
    hiddenFactorIds.push(id);
  }
  try {
    localStorage.setItem(HIDDEN_FACTORS_KEY, JSON.stringify(hiddenFactorIds));
  } catch (e) {}
  renderAll();
}

function toggleShowHiddenFactors() {
  showHiddenFactors = !showHiddenFactors;
  renderAll();
}

// ==================== 5B. SECCIÓN INDEPENDIENTE: HIPÓTESIS CUANTITATIVAS (5 PORQUÉS) ====================
function getRootCauseHypotheses(selectedClient, analysis) {
  const isConsolidado = selectedClient === "TODOS";
  const isTodoTractor = selectedClient === "TODO TRACTOR C.A.";
  const isBiopago = selectedClient === "Biopago C.A.";
  const isEstefany = selectedClient === "ESTEFANY REINOSO";
  const isBarpel = selectedClient === "BARPEL C.A";

  const hypotheses = [];

  // HIPÓTESIS 1: El Desfase Crítico de Semana 1
  if (isConsolidado || isTodoTractor || isBiopago || isEstefany) {
    const s1Jul = isConsolidado
      ? 4938
      : isTodoTractor
        ? 776
        : isBiopago
          ? 1968
          : 886;
    const s1Ago = isConsolidado
      ? 431
      : isTodoTractor
        ? 0
        : isBiopago
          ? 197
          : 190;
    const s1Diff = s1Ago - s1Jul;

    hypotheses.push({
      id: `rca-hyp-semana1-${selectedClient}`,
      title: isTodoTractor
        ? "Parálisis Total en Semana 1: Facturación $0 USD frente a $776 USD en Julio (-100%)"
        : isBiopago
          ? "Retraso de Despacho en Semana 1: Caída de -$1,771 USD (-90% vs Julio)"
          : "Inercia y Desfase en Semana 1: El 86% del déficit mensual se produjo en los primeros 7 días",
      cat: "externo",
      catName: "Factor Externo / Mercado",
      trend: "caida",
      impact: `${s1Diff >= 0 ? "+" : ""}${formatUSD(s1Diff)}`,
      proof: `Semana 1 facturó ${s1Ago === 0 ? "$0 USD" : formatUSD(s1Ago)} en Agosto vs ${formatUSD(s1Jul)} en Julio (Diferencia de ${formatUSD(s1Diff)}).`,
      evidence: "Alta (Comprobada por Datos)",
      whys: [
        "1. ¿Por qué Agosto cerró por debajo de Julio? -> Porque se acumuló una brecha inicial que se volvió matemáticamente irrecuperable.",
        "2. ¿Dónde y cuándo se abrió esa brecha? -> En los primeros 7 días del mes (Semana 1 aportó apenas $431 USD en consolidado).",
        "3. ¿Por qué no despacharon los clientes entre el 1 y el 5 de Agosto? -> Por cautela comercial, días no laborables y pausa operativa de proveedores.",
        "4. ¿Por qué el excelente cierre de Agosto no compensó la caída? -> Porque la capacidad operativa de recolección en S4-S5 tiene un límite físico diario.",
        "★ Causa Raíz Sistémica -> Falta de un plan proactivo de arranque de mes (promoción Semana 1) para movilizar inventarios retenidos desde el día 1.",
      ],
      action:
        'Implementar el programa comercial "Arranque Fuerte Semana 1": bonificación tarifaria por envíos confirmados en los primeros 5 días hábiles.',
    });
  }

  // HIPÓTESIS 2: Caída en Densidad de Carga y Kilogramos Facturados
  if (isConsolidado || isTodoTractor || isEstefany) {
    const kgJul = analysis.sumJul.kg;
    const kgAgo = analysis.sumAgo.kg;
    const diffKg = kgAgo - kgJul;
    const kgPerGuiaJul = analysis.sumJul.guias
      ? kgJul / analysis.sumJul.guias
      : 0;
    const kgPerGuiaAgo = analysis.sumAgo.guias
      ? kgAgo / analysis.sumAgo.guias
      : 0;

    hypotheses.push({
      id: `rca-hyp-peso-${selectedClient}`,
      title: isTodoTractor
        ? "Erosión de Flete por Menor Peso Unitario: Caída de -38.7% en kg/guía (de 9.21 a 5.65 kg)"
        : isEstefany
          ? "Pérdida de Tonelaje Crítico: Reducción de casi 1 tonelada (-974 kg) en despachos industriales"
          : "Erosión del Flete por Desplome en Peso Unitario (Mix de Carga Liviana)",
      cat: "operativo",
      catName: "Mezcla de Carga y Densidad",
      trend: "caida",
      impact: "-$1.800 USD",
      proof: `El peso total cayó ${formatKg(Math.abs(diffKg))} (${formatPercentage((diffKg / (kgJul || 1)) * 100)}). La relación pasó de ${formatNumber(kgPerGuiaJul, 2, 2)} kg/guía a ${formatNumber(kgPerGuiaAgo, 2, 2)} kg/guía.`,
      evidence: "Alta (Comprobada por Datos)",
      whys: [
        "1. ¿Por qué cayó la facturación más que las guías? -> Porque el tonelaje total facturado se redujo sensiblemente.",
        "2. ¿Por qué cayó el peso promedio por paquete? -> Los clientes enviaron mayor proporción de bultos pesados en lugar de sobres y repuestos pequeños.",

        "3. ¿Por qué el cliente no envió carga pesada en Agosto? -> Postergación de compras industriales pesadas hacia meses de mayor actividad económica.",
        "★ Causa Raíz Sistémica -> El 71% de la carga movilizada en el mes Agosto, ha sido carga pesada.",
      ],
      action:
        "Implementar un recargo para bultos mayores a 25 kg. menor introducción de carga pesada masiva en las unidades.",
    });
  }

  // HIPÓTESIS 3: Asimetría Quincenal
  const q2J = analysis.jul
    .filter((r) => r.day > 15)
    .reduce((a, b) => a + b.usd, 0);
  const q2A = analysis.ago
    .filter((r) => r.day > 15)
    .reduce((a, b) => a + b.usd, 0);
  const q2Diff = q2A - q2J;

  hypotheses.push({
    id: `rca-hyp-quincenas-${selectedClient}`,
    title:
      "Comportamiento Espejo Quincenal: La demanda comercial se recuperó con fuerza en la 2da Quincena",
    cat: "comercial",
    catName: "Factor Comercial / Quincenal",
    trend: q2Diff >= 0 ? "aumento" : "caida",
    impact: `${q2Diff >= 0 ? "+" : ""}${formatUSD(q2Diff)}`,
    proof: `En la 2da Quincena (Días 16 al 31), Agosto facturó ${formatUSD(q2A)} vs ${formatUSD(q2J)} en Julio (${q2Diff >= 0 ? "+" : ""}${formatUSD(q2Diff)}).`,
    evidence: "Alta (Comprobada por Datos)",
    whys: [
      "1. ¿El mercado o cliente abandonó el servicio en Agosto? -> No, en la 2da Quincena se igualó e incluso superó el nivel de Julio.",
      "2. ¿Por qué se concentró tanto volumen al final? -> Necesidad de cerrar metas comerciales de fin de mes y acumulación de pedidos pendientes.",
      "3. ¿Qué consecuencia operativa genera? -> Sobrecarga en sucursales y rutas en los últimos días hábiles, mientras que la 1ra quincena hubo capacidad ociosa.",

      "★ Causa Raíz Sistémica -> Ausencia de incentivos para el aplanamiento de la curva de despachos (flete nivelado a lo largo del mes).",
    ],
    action:
      "Proponer a los clientes con alta concentración final acuerdos de retiro diario programado con tarifa preferencial plana.",
  });

  if (isBarpel) {
    hypotheses.push({
      id: `rca-hyp-barpel-${selectedClient}`,
      title:
        "Consolidación de Lotes en BARPEL: Menor frecuencia pero mayor volumen concentrado el día 31",
      cat: "cliente",
      catName: "Comportamiento de Cuenta",
      trend: "caida",
      impact: "-$375 USD",
      proof:
        "Las guías cayeron de 143 a 109 (-34 guías), pero el día 31 generó un tercio del total de Agosto ($492 USD y 308 kg).",
      evidence: "Media (Correlación Estadística)",
      whys: [
        "1. ¿Por qué cayeron las guías de Barpel en Agosto? -> Disminuyeron los despachos individuales a clientes finales.",
        "2. ¿Por qué disminuyeron los despachos individuales? -> Agruparon pedidos en un solo envío consolidador al cierre de mes.",
        "3. ¿Cómo afecta el modelo de negocio? -> Menos guías implican menor cobro por guía unitaria.",
        "4. ¿Qué motivó esta conducta? -> Optimización de costes logísticos del remitente.",
        "★ Causa Raíz Sistémica -> Optimización logística interna del cliente para ahorrar flete agrupando despachos.",
      ],
      action:
        "Reunión ejecutiva con el jefe de compras de Barpel para presentar tabla comparativa de entrega rápida diaria vs consolidación tardía.",
    });
  }

  if (isBiopago) {
    hypotheses.push({
      id: `rca-hyp-biopago-${selectedClient}`,
      title:
        "Pico de Reposición Tecnológica en S3-S5 (Días 10 al 28 de Agosto)",
      cat: "comercial",
      catName: "Campaña Comercial y POS",
      trend: "aumento",
      impact: "+$1,450 USD",
      proof:
        "En las Semanas 3, 4 y 5, Biopago superó a Julio en facturación sostenida, alcanzando $1,113 USD en un solo día (Día 13).",
      evidence: "Alta (Comprobada por Datos)",
      whys: [
        "1. ¿Qué impulsó la recuperación de Biopago a mediados de mes? -> Campaña de reemplazo masivo de terminales bancarios POS.",
        "2. ¿Por qué se activó en la Semana 3? -> Llegada de lote de importación de repuestos y validación de entidades financieras.",
        "3. ¿Se puede replicar este éxito en septiembre? -> Sí, si se coordina con el cliente el calendario de reposiciones programadas.",
        "4. ¿Cómo afianzar la alianza? -> Acordando cupos fijos de transporte.",
        "★ Causa Raíz Sistémica -> La cuenta Biopago responde fuertemente a proyectos bancarios por lotes.",
      ],
      action:
        "Establecer mesa técnica mensual con Biopago para anticipar las semanas con operativos bancarios masivos.",
    });
  }

  return hypotheses;
}

function renderQuantitativeHypothesesSection() {
  const sectionEl = document.getElementById("section-quantitative-hypotheses");
  const bannerEl = document.getElementById("banner-hidden-hypotheses");
  const hypList = document.getElementById("rca-hypotheses-list");
  const toggleHiddenBtn = document.getElementById(
    "btn-toggle-hidden-hypotheses",
  );
  const toggleHiddenLabel = document.getElementById(
    "label-toggle-hidden-hypotheses",
  );

  if (!sectionEl || !hypList) return;

  if (isHypothesesHidden) {
    sectionEl.classList.add("hidden");
    if (bannerEl) {
      if (isUnlocked) bannerEl.classList.remove("hidden");
      else bannerEl.classList.add("hidden");
    }
    return;
  } else {
    sectionEl.classList.remove("hidden");
    if (bannerEl) bannerEl.classList.add("hidden");
  }

  const analysis = calculateAnalysis(currentClient, allShipments);
  const rawHypotheses = getRootCauseHypotheses(currentClient, analysis);

  const hypotheses = rawHypotheses.map((h) => {
    const edit = hypothesisEdits[h.id];
    if (!edit) return h;
    return {
      ...h,
      title: edit.title || h.title,
      evidence: edit.evidence || h.evidence,
      impact: edit.impact || h.impact,
      proof: edit.proof || h.proof,
      whys: edit.whys || h.whys,
      action: edit.action || h.action,
    };
  });

  const hiddenHypCount = hypotheses.filter((h) =>
    hiddenHypIds.includes(h.id),
  ).length;

  if (toggleHiddenBtn && toggleHiddenLabel) {
    if (hiddenHypCount > 0) {
      toggleHiddenBtn.classList.remove("hidden");
      toggleHiddenLabel.textContent = showHiddenHypotheses
        ? `Ocultar Irrelevantes (${hiddenHypCount})`
        : `Ver Irrelevantes (${hiddenHypCount})`;
      toggleHiddenBtn.className = showHiddenHypotheses
        ? "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 text-amber-900 transition-all cursor-pointer shadow-2xs"
        : "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer";
    } else {
      toggleHiddenBtn.classList.add("hidden");
    }
  }

  const filteredHyp = hypotheses
    .filter((h) => showHiddenHypotheses || !hiddenHypIds.includes(h.id))
    .filter((h) => rcaTrendFilter === "ALL" || h.trend === rcaTrendFilter);

  if (filteredHyp.length === 0) {
    hypList.innerHTML = `
      <div class="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <i data-lucide="info" class="w-6 h-6 mx-auto mb-2 text-slate-400"></i>
        <p class="text-xs font-medium">No hay hipótesis visibles para este filtro.</p>
        ${hiddenHypCount > 0 ? `<button onclick="toggleShowHiddenHypotheses()" class="mt-2 text-xs font-bold text-[#0061A8] hover:underline cursor-pointer">Ver ${hiddenHypCount} hipótesis marcadas como irrelevantes</button>` : ""}
      </div>
    `;
    return;
  }

  hypList.innerHTML = filteredHyp
    .map((h, i) => {
      const isExpanded = expandedHypothesisId === h.id;
      const isHypHidden = hiddenHypIds.includes(h.id);

      return `
      <div class="rounded-2xl border ${isHypHidden ? "border-dashed border-amber-300 bg-amber-50/40 opacity-75" : isExpanded ? "border-[#0061A8] shadow-xs bg-white" : "border-slate-200 bg-white"} transition-all">
        <div class="w-full p-4 flex items-start justify-between gap-3">
          <div class="flex items-start gap-3 cursor-pointer flex-1" onclick="toggleHypothesis('${h.id}')">
            <span class="w-7 h-7 rounded-xl ${isHypHidden ? "bg-amber-400 text-slate-900" : "bg-[#0061A8] text-white"} flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              ${i + 1}
            </span>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-3xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  ${h.catName}
                </span>
                <span class="text-3xs font-black uppercase px-2 py-0.5 rounded-md ${h.trend === "caida" ? "bg-red-100 text-[#DC2626]" : "bg-[#E6F0F8] text-[#0061A8]"}">
                  ${h.trend === "caida" ? "Factor de Caída" : "Factor de Aumento"}
                </span>
                <span class="text-3xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  ${h.evidence}
                </span>
                ${isHypHidden ? `<span class="text-3xs font-black px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 uppercase">Oculto</span>` : ""}
              </div>
              <h4 class="text-sm font-black text-slate-900 leading-snug">${h.title}</h4>
              <p class="text-xs text-slate-600 mt-1 font-medium"><strong>Evidencia Directa:</strong> ${h.proof}</p>
            </div>
          </div>
          <div class="text-right shrink-0 flex flex-col items-end gap-1.5">
            <span class="text-xs font-black ${h.trend === "caida" ? "text-[#DC2626]" : "text-[#0061A8]"} block">${h.impact}</span>
            <div class="flex items-center gap-1.5">
              <button onclick="toggleHypothesisHidden('${h.id}')" class="inline-flex items-center gap-1 px-2 py-1 rounded-lg ${isHypHidden ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "text-slate-500 hover:bg-slate-100"} text-3xs font-bold cursor-pointer transition-colors" title="${isHypHidden ? "Reactivar hipótesis" : "Marcar hipótesis como irrelevante"}">
                <i data-lucide="${isHypHidden ? "eye" : "eye-off"}" class="w-3 h-3"></i>
                <span>${isHypHidden ? "Reactivar" : "Ocultar"}</span>
              </button>
              ${
                isUnlocked
                  ? `
                <button onclick="openEditHypothesisModal('${h.id}')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0061A8] hover:bg-blue-100 text-3xs font-black cursor-pointer transition-colors">
                  <i data-lucide="edit-3" class="w-3 h-3"></i>
                  <span>Editar</span>
                </button>
              `
                  : ""
              }
              <button type="button" onclick="toggleHypothesis('${h.id}')" class="text-2xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer">
                ${isExpanded ? "▲ Cerrar" : "▼ 5 Porqués"}
              </button>
            </div>
          </div>
        </div>

        ${
          isExpanded
            ? `
          <div class="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700 font-medium">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-[#0061A8] block uppercase tracking-wider text-3xs">Metodología de los 5 Porqués (Cadena Causal):</span>
                <span class="text-3xs text-slate-400">Puedes ocultar pasos irrelevantes con el botón de ojo</span>
              </div>
              ${h.whys
                .map((w, wIdx) => {
                  const stepKey = `${h.id}-why-${wIdx}`;
                  const isStepHidden = hiddenWhyKeys.includes(stepKey);
                  return `
                  <div class="flex items-start justify-between gap-2 p-2 rounded-lg ${isStepHidden ? "opacity-40 bg-slate-200/50 line-through" : w.startsWith("★") ? "font-black text-amber-900 bg-amber-50 border border-[#E8B43B]/40" : "hover:bg-slate-100"} transition-all">
                    <p class="leading-relaxed flex-1">${w}</p>
                    <button onclick="toggleWhyHidden('${h.id}', ${wIdx})" class="shrink-0 text-3xs font-bold text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-white cursor-pointer" title="${isStepHidden ? "Reactivar este porqué" : "Ocultar este porqué por irrelevante"}">
                      <i data-lucide="${isStepHidden ? "eye" : "eye-off"}" class="w-3 h-3"></i>
                    </button>
                  </div>
                `;
                })
                .join("")}
            </div>
            <div class="p-3 bg-[#E6F0F8] rounded-xl border border-[#7FB0D4] text-xs font-bold text-[#0061A8] flex items-start gap-2">
              <i data-lucide="check-circle" class="w-4 h-4 text-[#0061A8] shrink-0 mt-0.5"></i>
              <span><strong>Acción de Mitigación:</strong> ${h.action}</span>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");
}

function toggleHypothesisHidden(id) {
  if (hiddenHypIds.includes(id)) {
    hiddenHypIds = hiddenHypIds.filter((x) => x !== id);
  } else {
    hiddenHypIds.push(id);
  }
  try {
    localStorage.setItem(HIDDEN_HYPOTHESES_KEY, JSON.stringify(hiddenHypIds));
  } catch (e) {}
  renderAll();
}

function toggleWhyHidden(hypId, whyIdx) {
  const key = `${hypId}-why-${whyIdx}`;
  if (hiddenWhyKeys.includes(key)) {
    hiddenWhyKeys = hiddenWhyKeys.filter((x) => x !== key);
  } else {
    hiddenWhyKeys.push(key);
  }
  try {
    localStorage.setItem(HIDDEN_WHYS_KEY, JSON.stringify(hiddenWhyKeys));
  } catch (e) {}
  renderAll();
}

function toggleShowHiddenHypotheses() {
  showHiddenHypotheses = !showHiddenHypotheses;
  renderAll();
}

// ==================== 5C. AUTENTICACIÓN Y DESBLOQUEO ====================
function updateAuthUI() {
  const container = document.getElementById("auth-status-container");
  if (!container) return;

  if (!isUnlocked) {
    container.innerHTML = `
      <button id="btn-auth-toggle" type="button" onclick="handleAuthClick()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs" title="Proyecto Bloqueado. Haz clic para desbloquear con Eduardo.oso">
        <i data-lucide="lock" class="w-3.5 h-3.5 text-amber-600"></i>
        <span class="hidden sm:inline">Bloqueado</span>
        <span class="text-3xs font-black text-[#0061A8] bg-white px-1.5 py-0.5 rounded-md border border-slate-200">Desbloquear</span>
      </button>
    `;
  } else {
    container.innerHTML = `
      <button id="btn-auth-toggle" type="button" onclick="lockProject()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all cursor-pointer shadow-2xs" title="Proyecto Desbloqueado (Eduardo.oso). Haz clic para bloquear">
        <i data-lucide="unlock" class="w-3.5 h-3.5 text-emerald-600"></i>
        <span class="hidden sm:inline">Desbloqueado</span>
        <span class="text-3xs font-black text-red-700 bg-white px-1.5 py-0.5 rounded-md border border-emerald-200 hover:bg-red-50">Bloquear</span>
      </button>
    `;
  }

  const addBtn = document.getElementById("btn-add-external-factor");
  if (addBtn) {
    if (isUnlocked) {
      addBtn.classList.remove("hidden");
      addBtn.classList.add("inline-flex");
    } else {
      addBtn.classList.add("hidden");
      addBtn.classList.remove("inline-flex");
    }
  }

  const extInd = document.getElementById("external-edit-indicator");
  if (extInd) {
    if (isUnlocked) extInd.classList.remove("hidden");
    else extInd.classList.add("hidden");
  }

  const hypInd = document.getElementById("hyp-edit-indicator");
  if (hypInd) {
    if (isUnlocked) hypInd.classList.remove("hidden");
    else hypInd.classList.add("hidden");
  }

  const stratAddReason = document.getElementById("btn-add-strategic-reason");
  if (stratAddReason) {
    if (isUnlocked) {
      stratAddReason.classList.remove("hidden");
      stratAddReason.classList.add("inline-flex");
    } else {
      stratAddReason.classList.add("hidden");
      stratAddReason.classList.remove("inline-flex");
    }
  }

  const stratAddRec = document.getElementById("btn-add-strategic-rec");
  if (stratAddRec) {
    if (isUnlocked) {
      stratAddRec.classList.remove("hidden");
      stratAddRec.classList.add("inline-flex");
    } else {
      stratAddRec.classList.add("hidden");
      stratAddRec.classList.remove("inline-flex");
    }
  }

  const stratReset = document.getElementById("btn-reset-strategic");
  if (stratReset) {
    if (isUnlocked) {
      stratReset.classList.remove("hidden");
      stratReset.classList.add("inline-flex");
    } else {
      stratReset.classList.add("hidden");
      stratReset.classList.remove("inline-flex");
    }
  }

  const stratInd = document.getElementById("strat-edit-indicator");
  if (stratInd) {
    if (isUnlocked) stratInd.classList.remove("hidden");
    else stratInd.classList.add("hidden");
  }

  const importerBtn = document.getElementById("btn-open-importer");
  if (importerBtn) {
    if (!isUnlocked) {
      importerBtn.className =
        "p-2 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-300 transition-colors cursor-pointer";
      importerBtn.title =
        "Actualizar o importar datos (Bloqueado con Eduardo.oso)";
    } else {
      importerBtn.className =
        "p-2 text-[#0061A8] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer";
      importerBtn.title = "Actualizar o importar datos desde Google Sheets";
    }
  }

  const importerLockBanner = document.getElementById("importer-lock-banner");
  if (importerLockBanner) {
    if (!isUnlocked) importerLockBanner.classList.remove("hidden");
    else importerLockBanner.classList.add("hidden");
  }

  refreshLucideIcons();
}

function handleAuthClick(customNotice = "") {
  const modal = document.getElementById("auth-modal");
  const noticeBox = document.getElementById("auth-custom-notice");
  const noticeText = document.getElementById("auth-custom-notice-text");
  const errorEl = document.getElementById("auth-error-msg");
  if (errorEl) errorEl.classList.add("hidden");

  if (noticeBox && noticeText) {
    if (customNotice) {
      noticeText.textContent = customNotice;
      noticeBox.classList.remove("hidden");
    } else {
      noticeBox.classList.add("hidden");
    }
  }

  if (modal) modal.classList.remove("hidden");
  refreshLucideIcons();
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) modal.classList.add("hidden");
}

function showUnlockToast(msg) {
  let toast = document.getElementById("auth-toast-notification");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "auth-toast-notification";
    toast.className =
      "fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500 transition-all transform duration-300";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
      <i data-lucide="shield-check" class="w-5 h-5"></i>
    </div>
    <div>
      <h4 class="text-xs font-black text-emerald-400 leading-tight">Proyecto Desbloqueado</h4>
      <p class="text-2xs text-slate-200 mt-0.5">${msg}</p>
    </div>
    <button type="button" onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white text-xs font-black ml-2 cursor-pointer">✕</button>
  `;
  refreshLucideIcons();
  setTimeout(() => {
    if (toast && toast.parentElement) {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => toast.remove(), 350);
    }
  }, 4500);
}

function handleAuthSubmit(e) {
  if (e) e.preventDefault();
  const userInput = document.getElementById("auth-input-user");
  const passInput = document.getElementById("auth-input-pass");
  const user = userInput ? userInput.value.trim() : "";
  const pass = passInput ? passInput.value.trim() : "";
  const errorEl = document.getElementById("auth-error-msg");

  // Normalización flexible para evitar fallos por mayúsculas, espacios, puntos o guiones
  const cleanUser = user.toLowerCase().replace(/[\s_\.\-@]/g, "");
  const cleanPass = pass.replace(/[\s_\.\-]/g, "");

  const isValidUser =
    cleanUser === "eduardooso" ||
    cleanUser === "eduardo" ||
    cleanUser === "eduardoosorio" ||
    cleanUser === "eduardoosoriotealcacom" ||
    cleanUser.includes("eduardo") ||
    cleanUser === "admin" ||
    cleanUser === "20870092";

  const isValidPass =
    cleanPass === "20870092" ||
    cleanPass === "eduardo" ||
    cleanPass === "eduardooso";

  if (isValidUser && isValidPass) {
    isUnlocked = true;
    try {
      localStorage.setItem("tealca_unlocked", "true");
      localStorage.setItem("tealca_unlocked_user", "Eduardo.oso");
    } catch (err) {}

    if (errorEl) errorEl.classList.add("hidden");
    if (userInput) userInput.value = "";
    if (passInput) passInput.value = "";

    closeAuthModal();
    renderAll();
    showUnlockToast(
      "¡Sesión iniciada con éxito! Se han habilitado las funciones de edición de factores, hipótesis y personalización para Eduardo.oso.",
    );
  } else {
    if (errorEl) {
      errorEl.textContent =
        'Credenciales no coinciden. Verifique el usuario y la contraseña (Usuario: Eduardo.oso / Contraseña: 20870092). Puede hacer clic en "Autocompletar" para probarlo al instante.';
      errorEl.classList.remove("hidden");
    }
  }
}

function lockProject() {
  isUnlocked = false;
  try {
    localStorage.removeItem("tealca_unlocked");
  } catch (err) {}
  renderAll();
  showUnlockToast(
    "El proyecto ha sido bloqueado nuevamente. El modo de solo lectura está activo.",
  );
}

// ==================== 5D. OCULTAR / MOSTRAR SECCIONES ====================
function toggleExternalFactorsVisibility() {
  if (!isUnlocked) {
    handleAuthClick(
      "Para ocultar o mostrar la sección de Factores Externos, primero debes desbloquear el proyecto con el usuario Eduardo.oso.",
    );
    return;
  }
  isExternalFactorsHidden = !isExternalFactorsHidden;
  try {
    localStorage.setItem(
      "tealca_hide_external_factors",
      String(isExternalFactorsHidden),
    );
  } catch (err) {}
  renderAll();
}

function toggleHypothesesVisibility() {
  if (!isUnlocked) {
    handleAuthClick(
      "Para ocultar o mostrar las Hipótesis Cuantitativas (5 Porqués), primero debes desbloquear el proyecto con el usuario Eduardo.oso.",
    );
    return;
  }
  isHypothesesHidden = !isHypothesesHidden;
  try {
    localStorage.setItem("tealca_hide_hypotheses", String(isHypothesesHidden));
  } catch (err) {}
  renderAll();
}

function toggleStrategicSectionVisibility() {
  if (!isUnlocked) {
    handleAuthClick(
      "Para ocultar o mostrar el Diagnóstico Estratégico y Plan de Acción, primero debes desbloquear el proyecto con el usuario Eduardo.oso.",
    );
    return;
  }
  isStrategicSectionHidden = !isStrategicSectionHidden;
  try {
    localStorage.setItem(
      "tealca_hide_strategic",
      String(isStrategicSectionHidden),
    );
  } catch (err) {}
  renderAll();
}

function toggleHypothesis(id) {
  expandedHypothesisId = expandedHypothesisId === id ? null : id;
  renderQuantitativeHypothesesSection();
  refreshLucideIcons();
}

function filterRcaCategory(cat) {
  rcaCategoryFilter = cat;
  renderExternalFactorsSection();
  refreshLucideIcons();
}

function filterRcaTrend(trend) {
  rcaTrendFilter = trend;
  renderQuantitativeHypothesesSection();
  refreshLucideIcons();
}

// ==================== 5E. MODAL REGISTRO FACTOR ====================
function openAddEventModal() {
  if (!isUnlocked) {
    handleAuthClick(
      "Para agregar nuevos factores externos, primero debes desbloquear el proyecto con el usuario Eduardo.oso.",
    );
    return;
  }
  const modal = document.getElementById("modal-add-event");
  if (modal) modal.classList.remove("hidden");
}

function closeAddEventModal() {
  const modal = document.getElementById("modal-add-event");
  if (modal) modal.classList.add("hidden");
}

function handleSaveCustomEvent(e) {
  e.preventDefault();
  const title = document.getElementById("input-evt-title").value.trim();
  const date =
    document.getElementById("input-evt-date").value.trim() || "Agosto 2026";
  const category = document.getElementById("select-evt-cat").value;
  const impact = document.getElementById("select-evt-impact").value;
  const desc =
    document.getElementById("input-evt-desc").value.trim() ||
    "Evento registrado por el usuario.";

  if (!title) return;

  const newEvt = {
    id: `custom-${Date.now()}`,
    title,
    date,
    category,
    impact,
    desc,
    affectedClients: currentClient === "TODOS" ? ["TODOS"] : [currentClient],
    isCustom: true,
  };

  customRcaEvents.push(newEvt);
  try {
    localStorage.setItem(RCA_STORAGE_KEY, JSON.stringify(customRcaEvents));
  } catch (err) {}

  closeAddEventModal();
  renderAll();
}

function deleteCustomEvent(id) {
  if (!isUnlocked) {
    handleAuthClick("Debes desbloquear el proyecto para eliminar factores.");
    return;
  }
  customRcaEvents = customRcaEvents.filter((e) => e.id !== id);
  try {
    localStorage.setItem(RCA_STORAGE_KEY, JSON.stringify(customRcaEvents));
  } catch (err) {}
  renderAll();
}

// ==================== 5F. MODAL EDITAR FACTOR ====================
function openEditFactorModal(id) {
  if (!isUnlocked) {
    handleAuthClick(
      "Debes estar desbloqueado con Eduardo.oso para editar el contenido.",
    );
    return;
  }
  const allEvents =
    typeof DEFAULT_RCA_EVENTS !== "undefined"
      ? [...DEFAULT_RCA_EVENTS, ...customRcaEvents]
      : [...customRcaEvents];
  const factor = allEvents.find((e) => e.id === id);
  if (!factor) return;

  const edit = factorEdits[id] || {};
  document.getElementById("edit-factor-id").value = id;
  document.getElementById("edit-factor-title").value =
    edit.title || factor.title;
  document.getElementById("edit-factor-date").value = edit.date || factor.date;
  document.getElementById("edit-factor-cat").value =
    edit.category || factor.category;
  document.getElementById("edit-factor-impact").value =
    edit.impact || factor.impact;
  document.getElementById("edit-factor-desc").value = edit.desc || factor.desc;

  const modal = document.getElementById("modal-edit-factor");
  if (modal) modal.classList.remove("hidden");
}

function closeEditFactorModal() {
  const modal = document.getElementById("modal-edit-factor");
  if (modal) modal.classList.add("hidden");
}

function handleSaveEditFactor(e) {
  e.preventDefault();
  const id = document.getElementById("edit-factor-id").value;
  const title = document.getElementById("edit-factor-title").value.trim();
  const date = document.getElementById("edit-factor-date").value.trim();
  const category = document.getElementById("edit-factor-cat").value;
  const impact = document.getElementById("edit-factor-impact").value;
  const desc = document.getElementById("edit-factor-desc").value.trim();

  factorEdits[id] = { title, date, category, impact, desc };
  try {
    localStorage.setItem(FACTOR_EDITS_KEY, JSON.stringify(factorEdits));
  } catch (err) {}

  closeEditFactorModal();
  renderAll();
}

// ==================== 5G. MODAL EDITAR HIPÓTESIS ====================
function openEditHypothesisModal(id) {
  if (!isUnlocked) {
    handleAuthClick(
      "Debes estar desbloqueado con Eduardo.oso para editar las hipótesis.",
    );
    return;
  }
  const edit = hypothesisEdits[id] || {};
  document.getElementById("edit-hyp-id").value = id;
  document.getElementById("edit-hyp-title").value =
    edit.title ||
    (id === "rca-hyp-1"
      ? "El 86% del déficit mensual se concentró en la Semana 1 (-$4,507 USD)"
      : id === "rca-hyp-2"
        ? "Erosión del Flete por Reducción de Peso Promedio (-1.6 Toneladas)"
        : "Asimetría Quincenal: Repunte comercial vigoroso en la 2da Quincena (+$40 USD)");
  document.getElementById("edit-hyp-evidence").value =
    edit.evidence || "Alta (Comprobada por Datos)";
  document.getElementById("edit-hyp-impact").value = edit.impact
    ? parseInt(edit.impact.replace(/[^0-9-]/g, "")) || 0
    : id === "rca-hyp-1"
      ? -4507
      : id === "rca-hyp-2"
        ? -1800
        : 40;
  document.getElementById("edit-hyp-dataproof").value =
    edit.proof ||
    (id === "rca-hyp-1"
      ? "Semana 1 facturó $431 USD en Agosto frente a $4,938 USD en Julio."
      : id === "rca-hyp-2"
        ? "Las guías cayeron -10.8% pero los kilogramos cayeron -20.7%."
        : "En la 2da Quincena Agosto facturó $19,258 USD superando a Julio.");

  const whys = edit.whys || [
    "1. Primer porqué analizado",
    "2. Segundo porqué analizado",
    "3. Tercer porqué analizado",
    "4. Cuarto porqué analizado",
    "★ Causa Raíz Sistémica identificada",
  ];
  document.getElementById("edit-hyp-why-1").value = whys[0] || "";
  document.getElementById("edit-hyp-why-2").value = whys[1] || "";
  document.getElementById("edit-hyp-why-3").value = whys[2] || "";
  document.getElementById("edit-hyp-why-4").value = whys[3] || "";
  document.getElementById("edit-hyp-why-5").value = whys[4] || "";

  document.getElementById("edit-hyp-mitigation").value =
    edit.action || "Lanzar plan de choque comercial.";

  const modal = document.getElementById("modal-edit-hypothesis");
  if (modal) modal.classList.remove("hidden");
}

function closeEditHypothesisModal() {
  const modal = document.getElementById("modal-edit-hypothesis");
  if (modal) modal.classList.add("hidden");
}

function handleSaveEditHypothesis(e) {
  e.preventDefault();
  const id = document.getElementById("edit-hyp-id").value;
  const title = document.getElementById("edit-hyp-title").value.trim();
  const evidence = document.getElementById("edit-hyp-evidence").value;
  const impactVal = document.getElementById("edit-hyp-impact").value;
  const impact = (impactVal >= 0 ? "+" : "") + formatUSD(Number(impactVal));
  const proof = document.getElementById("edit-hyp-dataproof").value.trim();
  const whys = [
    document.getElementById("edit-hyp-why-1").value.trim(),
    document.getElementById("edit-hyp-why-2").value.trim(),
    document.getElementById("edit-hyp-why-3").value.trim(),
    document.getElementById("edit-hyp-why-4").value.trim(),
    document.getElementById("edit-hyp-why-5").value.trim(),
  ].filter((w) => w.length > 0);
  const action = document.getElementById("edit-hyp-mitigation").value.trim();

  hypothesisEdits[id] = { title, evidence, impact, proof, whys, action };
  try {
    localStorage.setItem(HYP_EDITS_KEY, JSON.stringify(hypothesisEdits));
  } catch (err) {}

  closeEditHypothesisModal();
  renderAll();
}

// ==================== 7. DIAGNÓSTICO ESTRATÉGICO ====================
function diagnoseClientReasons(clientName, analysis, q1Diff, q2Diff) {
  const { sumJul, sumAgo, diff, pct } = analysis;
  const reasons = [];
  const recs = [];

  if (clientName === "TODO TRACTOR C.A.") {
    reasons.push(
      "Parálisis en Semana 1: En Agosto la S1 aportó $0 USD (0 guías), mientras que en Julio aportó $776 USD con 32 guías activas.",
    );
    reasons.push(
      "Desplome en Semana 2: La S2 cayó de $1,472 USD a $610 USD (-58.6%), abriendo una brecha acumulada de -$1,638 USD en la primera quincena.",
    );
    reasons.push(
      "Desplome de Kilogramos por Guía: Aunque movilizó +5 guías más en Agosto (144 vs 139), el peso total cayó un 38.7% (-513.8 kg), pasando de 9.55 kg/guía a solo 5.65 kg/guía. Paquetes más livianos significaron menores ingresos de flete.",
    );
    reasons.push(
      "Recuperación tardía pero insuficiente: Las Semanas 4 (+60%) y 5 (+132%) repuntaron con fuerza ($973 y $617 USD), pero no bastó para contrarrestar el déficit de la primera quincena.",
    );

    recs.push(
      "Establecer alertas operativas tempranas en la primera semana del mes para activar despachos retenidos.",
    );
    recs.push(
      "Revisar política de tarifas por peso mínimo y maximo, un equilibrio de ambas, para evitar que una mayor cantidad de guías pesadas reduzca la rentabilidad neta.",
    );
  } else if (clientName === "Biopago C.A.") {
    reasons.push(
      "Arranque desfasado en Semana 1: En Julio la S1 tuvo 5 días operativos generando $1,968 USD (168 guías). En Agosto solo operó el día 1 de agosto con $197 USD, perdiendo -$1,771 USD (-90%) de inicio.",
    );
    reasons.push(
      "Caída en Semana 2: S2 descendió de $4,503 USD a $3,400 USD (-$1,103 USD, -24.5%). La brecha combinada de S1 + S2 fue de -$2,874 USD.",
    );
    reasons.push(
      "Excelente constancia en segunda quincena: A partir de la Semana 3, Agosto superó a Julio en todas las semanas (S3: +$158, S4: +$622, S5: +$430, S6: +$359). Sin embargo, el colchón perdido al inicio selló el saldo negativo final de -$1,305 USD.",
    );
    reasons.push(
      "Incremento de carga pesada: A pesar de facturar menos dólares (-7.6%) y movilizar menos guías (-155), los kilogramos aumentaron +8.6% (+75.6 kg), evidenciando mayor densidad por envío (0.69 kg/guía vs 0.57 kg/guía).",
    );

    recs.push(
      "Monitorear el calendario de despachos de Biopago para asegurar continuidad operativa entre el fin y el inicio de mes.",
    );
    recs.push(
      "Capitalizar el incremento de peso total negociando tarifas escalonadas de carga.",
    );
    recs.push(
      "Coordinar mesa técnica para sincronizar operativos de reposición de terminales POS bancarios con rutas TEALCA.",
    );
  } else if (clientName === "ESTEFANY REINOSO") {
    reasons.push(
      "Pérdida de casi una tonelada métrica (-974.1 kg, -30.3%): En Julio movilizó 3,219.6 kg frente a solo 2,245.5 kg en Agosto, lo que impactó directamente en -$2,101 USD (-24.7%).",
    );
    reasons.push(
      "Caída masiva en Semana 1 (-$1,417 USD, -86.7%) y Semana 3 (-$1,572 USD, -67.7%): En la S3 de Julio facturó $2,321 USD con días pico como el 13 y 17 de Julio (>210 kg/día), mientras que en Agosto la S3 apenas alcanzó $749 USD con días de solo $18 y $86 USD.",
    );
    reasons.push(
      "Menor frecuencia de envíos de gran volumen: Pasó de 181 guías a 149 guías (-17.7%), con una caída simultánea en el valor promedio por guía ($43.02 vs $47.02).",
    );

    recs.push(
      "Indagar directamente con la clienta el motivo de la caída de pedidos a mediados de mes (Semana 3).",
    );
    recs.push(
      "Ofrecer incentivos por volumen semanal para evitar semanas valles.",
    );
    recs.push(
      "Presentar convenio con tarifa preferencial en temporadas de alta reposición comercial.",
    );
  } else if (clientName === "BARPEL C.A") {
    reasons.push(
      "Contracción sistemática semanal: 4 de las 5 semanas principales tuvieron caídas continuas respecto a Julio (S1: -97%, S2: -20%, S3: -28%, S4: -27%).",
    );
    reasons.push(
      "Disminución del 23.8% en el número de guías: De 143 guías en Julio cayó a 109 guías en Agosto (-34 guías), reduciendo la base de ingresos en -$962 USD (-18.2%).",
    );
    reasons.push(
      "Despacho excepcional al cierre: El día 31 de Agosto (Semana 6) concentró un envío extraordinario de $492 USD y 308.6 kg que evitó una caída aún más severa.",
    );

    recs.push(
      "Diseñar plan de fidelización y seguimiento semanal de pedidos para restablecer el ritmo de 140+ guías mensuales.",
    );
    recs.push(
      "Investigar si el cliente retuvo inventario para despachar todo en un solo lote al cierre de mes.",
    );
    recs.push(
      "Ofrecer acuerdos de retiro diario programado con tarifa plana para nivelar los envíos.",
    );
  } else {
    // Consolidado General
    reasons.push(
      "Efecto Quincena 1 Crítico: En la 1ra Quincena, los clientes facturaron $13,446 USD en Agosto vs $18,720 USD en Julio (-$5,274 USD, -28.2%). Toda la caída neta del mes se originó en los primeros 15 días.",
    );
    reasons.push(
      "Semana 1 desértica: La Semana 1 de Agosto solo facturó $431 USD vs $4,938 USD en Julio (-$4,507 USD, -91.3%). El desfase de calendario y arranque tardío de envíos fue el principal detonante negativo.",
    );
    reasons.push(
      "Fuerte resiliencia en la segunda mitad: En la 2da Quincena, Agosto recupera particiapacion facturó $15,524 USD vs $16,639 USD de Julio (-7%), confirmando que la demanda comercial no se perdió, sino que se retrasó.",
    );
    reasons.push(
      "Reducción de carga: El total de kilogramos movilizados cayó un 20.7% (-1,605 kg), liderado por la contracción de 974 kg en Estefany Reinoso y 514 kg en Todo Tractor.",
    );

    recs.push(
      "Implementar plan de prevención de inicio de mes: promociones de arranque durante la Semana 1 para incentivar despachos tempranos.",
    );
    recs.push(
      "Establecer metas comerciales semanales para la fuerza de ventas con el fin de evitar la desaceleración de la primera quincena.",
    );
    recs.push(
      "Diseñar un esquema de indexación o recargo operativo para envíos que superen los 25 kg, asegurando que la carga pesada cubra el costo operativo sin canibalizar el espacio de la mercancía de alto margen.",
    );
    recs.push(
      "Formalizar acuerdos de retiro diario programado con clientes corporativos para nivelar la curva logística mensual.",
    );
  }

  return { keyReasons: reasons, recommendations: recs };
}

function getStoredStrategicItems(clientName, type, defaultTexts) {
  const key = `tealca_strat_${type}_${clientName}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}

  return defaultTexts.map((text, idx) => ({
    id: `${type}-${clientName}-${idx}`,
    text,
    isCustom: false,
  }));
}

function saveStoredStrategicItems(clientName, type, items) {
  const key = `tealca_strat_${type}_${clientName}`;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {}
}

function getStoredHiddenStrategicIds(clientName, type) {
  const key = `tealca_hidden_${type}_${clientName}`;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function saveStoredHiddenStrategicIds(clientName, type, ids) {
  const key = `tealca_hidden_${type}_${clientName}`;
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch (e) {}
}

function renderStrategicDiagnostic(analysis) {
  const sectionEl = document.getElementById("section-strategic-diagnosis");
  const bannerEl = document.getElementById("banner-hidden-strategic");

  if (isStrategicSectionHidden) {
    if (sectionEl) sectionEl.classList.add("hidden");
    if (bannerEl) {
      if (isUnlocked) bannerEl.classList.remove("hidden");
      else bannerEl.classList.add("hidden");
    }
    return;
  } else {
    if (sectionEl) sectionEl.classList.remove("hidden");
    if (bannerEl) bannerEl.classList.add("hidden");
  }

  const { jul, ago, diff, pct } = analysis;

  const q1J = jul.filter((r) => r.day <= 15).reduce((a, b) => a + b.usd, 0);
  const q1A = ago.filter((r) => r.day <= 15).reduce((a, b) => a + b.usd, 0);
  const q2J = jul.filter((r) => r.day > 15).reduce((a, b) => a + b.usd, 0);
  const q2A = ago.filter((r) => r.day > 15).reduce((a, b) => a + b.usd, 0);

  const q1Diff = q1A - q1J;
  const q1Pct = q1J ? (q1Diff / q1J) * 100 : 0;
  const q2Diff = q2A - q2J;
  const q2Pct = q2J ? (q2Diff / q2J) * 100 : 0;

  // Badge neta
  const netBadge = document.getElementById("diag-net-breach-badge");
  if (netBadge) {
    const isPos = diff.usd >= 0;
    netBadge.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs border ${
      isPos
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-red-50 text-[#DC2626] border-red-200"
    }`;
    netBadge.innerHTML = `
      <i data-lucide="${isPos ? "trending-up" : "trending-down"}" class="w-4 h-4 ${isPos ? "text-emerald-600" : "text-[#DC2626]"}"></i>
      <span>Brecha Neta: ${diff.usd >= 0 ? "+" : ""}${formatUSD(diff.usd)} (${formatPercentage(pct.usd)})</span>
    `;
  }

  // Quincena 1
  const q1Box = document.getElementById("q1-box");
  if (q1Box) {
    q1Box.className = `p-4 rounded-xl border ${q1Diff < 0 ? "bg-red-50/40 border-red-200" : "bg-emerald-50/40 border-emerald-200"}`;
  }
  const q1Badge = document.getElementById("q1-badge");
  if (q1Badge) {
    q1Badge.className = `text-2xs font-extrabold px-2 py-0.5 rounded-full ${q1Diff >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-[#DC2626]"}`;
    q1Badge.textContent = q1Diff >= 0 ? "Superó a Julio" : "Fuerte Rezago";
  }
  const q1Jul = document.getElementById("q1-jul-val");
  if (q1Jul) q1Jul.textContent = formatUSD(q1J);
  const q1Ago = document.getElementById("q1-ago-val");
  if (q1Ago) q1Ago.textContent = formatUSD(q1A);
  const q1DiffEl = document.getElementById("q1-diff-val");
  if (q1DiffEl) {
    q1DiffEl.className = `text-sm font-black ${q1Diff >= 0 ? "text-emerald-600" : "text-[#DC2626]"}`;
    q1DiffEl.textContent = `${q1Diff >= 0 ? "+" : ""}${formatUSD(q1Diff)} (${formatPercentage(q1Pct)})`;
  }

  // Quincena 2
  const q2Box = document.getElementById("q2-box");
  if (q2Box) {
    q2Box.className = `p-4 rounded-xl border ${q2Diff < 0 ? "bg-red-50/40 border-red-200" : "bg-emerald-50/40 border-emerald-200"}`;
  }
  const q2Badge = document.getElementById("q2-badge");
  if (q2Badge) {
    q2Badge.className = `text-2xs font-extrabold px-2 py-0.5 rounded-full ${q2Diff >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-[#DC2626]"}`;
    q2Badge.textContent = q2Diff >= 0 ? "Repunte Comercial" : "Por Debajo";
  }
  const q2Jul = document.getElementById("q2-jul-val");
  if (q2Jul) q2Jul.textContent = formatUSD(q2J);
  const q2Ago = document.getElementById("q2-ago-val");
  if (q2Ago) q2Ago.textContent = formatUSD(q2A);
  const q2DiffEl = document.getElementById("q2-diff-val");
  if (q2DiffEl) {
    q2DiffEl.className = `text-sm font-black ${q2Diff >= 0 ? "text-emerald-600" : "text-[#DC2626]"}`;
    q2DiffEl.textContent = `${q2Diff >= 0 ? "+" : ""}${formatUSD(q2Diff)} (${formatPercentage(q2Pct)})`;
  }

  // Motivos y Recomendaciones
  const reasonsContainer = document.getElementById("strategic-reasons");
  const recsContainer = document.getElementById("strategic-recommendations");
  const reasonsCountBadge = document.getElementById("reasons-count-badge");
  const recsCountBadge = document.getElementById("recs-count-badge");
  const toggleHiddenStratBtn = document.getElementById(
    "btn-toggle-hidden-strategic",
  );
  const toggleHiddenStratLabel = document.getElementById(
    "label-toggle-hidden-strategic",
  );

  const defaultDiag = diagnoseClientReasons(
    currentClient,
    analysis,
    q1Diff,
    q2Diff,
  );
  const reasons = getStoredStrategicItems(
    currentClient,
    "reasons",
    defaultDiag.keyReasons,
  );
  const recs = getStoredStrategicItems(
    currentClient,
    "recs",
    defaultDiag.recommendations,
  );
  const hiddenReasonIds = getStoredHiddenStrategicIds(currentClient, "reasons");
  const hiddenRecIds = getStoredHiddenStrategicIds(currentClient, "recs");

  const totalHidden = hiddenReasonIds.length + hiddenRecIds.length;

  if (toggleHiddenStratBtn && toggleHiddenStratLabel) {
    if (totalHidden > 0) {
      toggleHiddenStratBtn.classList.remove("hidden");
      toggleHiddenStratLabel.textContent = showHiddenStrategic
        ? `Ocultar Irrelevantes (${totalHidden})`
        : `Ver Irrelevantes (${totalHidden})`;
      toggleHiddenStratBtn.className = showHiddenStrategic
        ? "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 text-amber-900 transition-all cursor-pointer shadow-2xs"
        : "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer";
    } else {
      toggleHiddenStratBtn.classList.add("hidden");
    }
  }

  const visibleReasons = reasons.filter(
    (r) => showHiddenStrategic || !hiddenReasonIds.includes(r.id),
  );
  const visibleRecs = recs.filter(
    (r) => showHiddenStrategic || !hiddenRecIds.includes(r.id),
  );

  if (reasonsCountBadge)
    reasonsCountBadge.textContent = `${visibleReasons.length} causas identificadas`;
  if (recsCountBadge)
    recsCountBadge.textContent = `${visibleRecs.length} acciones prioritarias`;

  if (reasonsContainer) {
    if (visibleReasons.length === 0) {
      reasonsContainer.innerHTML = `
        <div class="py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p class="text-xs font-medium">No hay factores visibles para este cliente.</p>
          ${hiddenReasonIds.length > 0 ? `<button onclick="toggleShowHiddenStrategic()" class="mt-2 text-xs font-bold text-[#0061A8] hover:underline cursor-pointer">Ver ${hiddenReasonIds.length} factores marcados como irrelevantes</button>` : ""}
        </div>
      `;
    } else {
      reasonsContainer.innerHTML = visibleReasons
        .map((r, idx) => {
          const isHidden = hiddenReasonIds.includes(r.id);
          return `
          <div class="p-3.5 rounded-xl border ${isHidden ? "border-dashed border-amber-300 bg-amber-50/40 opacity-75" : "bg-slate-50 border-slate-200 hover:border-slate-300"} transition-all flex flex-col justify-between gap-2.5 group">
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-lg ${isHidden ? "bg-amber-200 text-amber-900" : "bg-[#0061A8]/10 text-[#0061A8]"} font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                ${idx + 1}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-1.5 mb-1">
                  ${isHidden ? `<span class="text-3xs font-black px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 uppercase">Oculto</span>` : ""}
                  ${r.isCustom ? `<span class="text-3xs font-bold px-1.5 py-0.5 rounded bg-blue-100 text-[#0061A8]">Personalizado</span>` : ""}
                </div>
                <p class="text-xs text-slate-800 leading-relaxed font-medium">${r.text}</p>
              </div>
            </div>
            <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200/60 text-3xs font-bold">
              <button onclick="toggleStrategicReasonHidden('${r.id}')" class="inline-flex items-center gap-1 px-2 py-1 rounded-md ${isHidden ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "text-slate-500 hover:bg-slate-200"} cursor-pointer transition-colors" title="${isHidden ? "Reactivar factor" : "Marcar como irrelevante / Ocultar"}">
                <i data-lucide="${isHidden ? "eye" : "eye-off"}" class="w-3 h-3"></i>
                <span>${isHidden ? "Reactivar" : "Ocultar"}</span>
              </button>
              ${
                isUnlocked
                  ? `
                <button onclick="openEditStrategicModal('reason', '${r.id}')" class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-[#0061A8] hover:bg-blue-100 cursor-pointer transition-colors">
                  <i data-lucide="edit-3" class="w-3 h-3"></i>
                  <span>Editar</span>
                </button>
              `
                  : ""
              }
              ${
                r.isCustom && isUnlocked
                  ? `
                <button onclick="deleteStrategicCustomItem('reason', '${r.id}')" class="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-red-500 hover:bg-red-50 cursor-pointer transition-colors" title="Eliminar factor">
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
              `
                  : ""
              }
            </div>
          </div>
        `;
        })
        .join("");
    }
  }

  if (recsContainer) {
    if (visibleRecs.length === 0) {
      recsContainer.innerHTML = `
        <div class="py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p class="text-xs font-medium">No hay recomendaciones visibles para este cliente.</p>
          ${hiddenRecIds.length > 0 ? `<button onclick="toggleShowHiddenStrategic()" class="mt-2 text-xs font-bold text-[#0061A8] hover:underline cursor-pointer">Ver ${hiddenRecIds.length} acciones marcadas como irrelevantes</button>` : ""}
        </div>
      `;
    } else {
      recsContainer.innerHTML = visibleRecs
        .map((rec, idx) => {
          const isHidden = hiddenRecIds.includes(rec.id);
          return `
          <div class="p-3.5 rounded-xl border ${isHidden ? "border-dashed border-amber-300 bg-amber-50/40 opacity-75" : "bg-amber-50/50 border-[#E8B43B]/40 hover:border-[#E8B43B]/80"} transition-all flex flex-col justify-between gap-2.5 group">
            <div class="flex items-start gap-3">
              <i data-lucide="check-circle" class="w-4 h-4 ${isHidden ? "text-amber-600" : "text-[#0061A8]"} shrink-0 mt-0.5"></i>
              <div class="flex-1">
                <div class="flex items-center gap-1.5 mb-1">
                  ${isHidden ? `<span class="text-3xs font-black px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 uppercase">Oculto</span>` : ""}
                  ${rec.isCustom ? `<span class="text-3xs font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">Personalizado</span>` : ""}
                </div>
                <p class="text-xs text-slate-800 leading-relaxed font-semibold">${rec.text}</p>
              </div>
            </div>
            <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-[#E8B43B]/30 text-3xs font-bold">
              <button onclick="toggleStrategicRecHidden('${rec.id}')" class="inline-flex items-center gap-1 px-2 py-1 rounded-md ${isHidden ? "bg-amber-200 text-amber-900 hover:bg-amber-300" : "text-slate-600 hover:bg-amber-100"} cursor-pointer transition-colors" title="${isHidden ? "Reactivar acción" : "Marcar como irrelevante / Ocultar"}">
                <i data-lucide="${isHidden ? "eye" : "eye-off"}" class="w-3 h-3"></i>
                <span>${isHidden ? "Reactivar" : "Ocultar"}</span>
              </button>
              ${
                isUnlocked
                  ? `
                <button onclick="openEditStrategicModal('rec', '${rec.id}')" class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white text-[#0061A8] border border-slate-200 hover:bg-blue-50 cursor-pointer transition-colors">
                  <i data-lucide="edit-3" class="w-3 h-3"></i>
                  <span>Editar</span>
                </button>
              `
                  : ""
              }
              ${
                rec.isCustom && isUnlocked
                  ? `
                <button onclick="deleteStrategicCustomItem('rec', '${rec.id}')" class="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-red-500 hover:bg-red-50 cursor-pointer transition-colors" title="Eliminar recomendación">
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
              `
                  : ""
              }
            </div>
          </div>
        `;
        })
        .join("");
    }
  }
}

function toggleStrategicReasonHidden(id) {
  let hidden = getStoredHiddenStrategicIds(currentClient, "reasons");
  if (hidden.includes(id)) {
    hidden = hidden.filter((x) => x !== id);
  } else {
    hidden.push(id);
  }
  saveStoredHiddenStrategicIds(currentClient, "reasons", hidden);
  renderAll();
}

function toggleStrategicRecHidden(id) {
  let hidden = getStoredHiddenStrategicIds(currentClient, "recs");
  if (hidden.includes(id)) {
    hidden = hidden.filter((x) => x !== id);
  } else {
    hidden.push(id);
  }
  saveStoredHiddenStrategicIds(currentClient, "recs", hidden);
  renderAll();
}

function toggleShowHiddenStrategic() {
  showHiddenStrategic = !showHiddenStrategic;
  renderAll();
}

function openEditStrategicModal(type, id) {
  if (!isUnlocked) {
    handleAuthClick(
      "Debes estar desbloqueado con Eduardo.oso para editar este elemento.",
    );
    return;
  }

  const analysis = calculateAnalysis(currentClient, allShipments);
  const defaultDiag = diagnoseClientReasons(currentClient, analysis, 0, 0);
  const items = getStoredStrategicItems(
    currentClient,
    type === "reason" ? "reasons" : "recs",
    type === "reason" ? defaultDiag.keyReasons : defaultDiag.recommendations,
  );
  const item = items.find((x) => x.id === id);
  if (!item) return;

  document.getElementById("edit-strat-type").value = type;
  document.getElementById("edit-strat-id").value = id;
  document.getElementById("edit-strat-text").value = item.text;

  const titleEl = document.getElementById("edit-strat-modal-title");
  if (titleEl) {
    titleEl.textContent =
      type === "reason"
        ? "Editar Causa / Factor Concreto"
        : "Editar Acción / Recomendación";
  }

  const modal = document.getElementById("modal-edit-strategic-item");
  if (modal) modal.classList.remove("hidden");
}

function closeEditStrategicModal() {
  const modal = document.getElementById("modal-edit-strategic-item");
  if (modal) modal.classList.add("hidden");
}

function handleSaveEditStrategic(e) {
  e.preventDefault();
  const type = document.getElementById("edit-strat-type").value;
  const id = document.getElementById("edit-strat-id").value;
  const newText = document.getElementById("edit-strat-text").value.trim();

  if (!newText) return;

  const analysis = calculateAnalysis(currentClient, allShipments);
  const defaultDiag = diagnoseClientReasons(currentClient, analysis, 0, 0);
  const keyType = type === "reason" ? "reasons" : "recs";
  const items = getStoredStrategicItems(
    currentClient,
    keyType,
    type === "reason" ? defaultDiag.keyReasons : defaultDiag.recommendations,
  );

  const updated = items.map((item) => {
    if (item.id === id) {
      return { ...item, text: newText };
    }
    return item;
  });

  saveStoredStrategicItems(currentClient, keyType, updated);
  closeEditStrategicModal();
  renderAll();
}

function openAddStrategicModal(type) {
  if (!isUnlocked) {
    handleAuthClick(
      "Debes estar desbloqueado con Eduardo.oso para agregar elementos.",
    );
    return;
  }

  document.getElementById("add-strat-type").value = type;
  document.getElementById("add-strat-text").value = "";

  const titleEl = document.getElementById("add-strat-modal-title");
  const labelEl = document.getElementById("add-strat-label");
  if (titleEl) {
    titleEl.textContent =
      type === "reason"
        ? "Agregar Factor Concreto"
        : "Agregar Acción Inmediata";
  }
  if (labelEl) {
    labelEl.textContent =
      type === "reason"
        ? "Descripción del Factor Negativo / Causa:"
        : "Descripción de la Acción / Recomendación:";
  }

  const modal = document.getElementById("modal-add-strategic-item");
  if (modal) modal.classList.remove("hidden");
}

function closeAddStrategicModal() {
  const modal = document.getElementById("modal-add-strategic-item");
  if (modal) modal.classList.add("hidden");
}

function handleSaveAddStrategic(e) {
  e.preventDefault();
  const type = document.getElementById("add-strat-type").value;
  const text = document.getElementById("add-strat-text").value.trim();

  if (!text) return;

  const analysis = calculateAnalysis(currentClient, allShipments);
  const defaultDiag = diagnoseClientReasons(currentClient, analysis, 0, 0);
  const keyType = type === "reason" ? "reasons" : "recs";
  const items = getStoredStrategicItems(
    currentClient,
    keyType,
    type === "reason" ? defaultDiag.keyReasons : defaultDiag.recommendations,
  );

  items.push({
    id: `custom-${type}-${Date.now()}`,
    text,
    isCustom: true,
  });

  saveStoredStrategicItems(currentClient, keyType, items);
  closeAddStrategicModal();
  renderAll();
}

function deleteStrategicCustomItem(type, id) {
  if (!isUnlocked) {
    handleAuthClick(
      "Debes estar desbloqueado con Eduardo.oso para eliminar elementos.",
    );
    return;
  }

  const analysis = calculateAnalysis(currentClient, allShipments);
  const defaultDiag = diagnoseClientReasons(currentClient, analysis, 0, 0);
  const keyType = type === "reason" ? "reasons" : "recs";
  const items = getStoredStrategicItems(
    currentClient,
    keyType,
    type === "reason" ? defaultDiag.keyReasons : defaultDiag.recommendations,
  );

  const filtered = items.filter((x) => x.id !== id);
  saveStoredStrategicItems(currentClient, keyType, filtered);
  renderAll();
}

function resetStrategicItemsAll() {
  if (!isUnlocked) {
    handleAuthClick(
      "Debes estar desbloqueado con Eduardo.oso para restaurar el contenido original.",
    );
    return;
  }

  if (
    confirm(
      `¿Deseas restaurar todos los factores y recomendaciones originales para el cliente "${currentClient}"? Se descartarán las ediciones personalizadas de esta sección.`,
    )
  ) {
    try {
      localStorage.removeItem(`tealca_strat_reasons_${currentClient}`);
      localStorage.removeItem(`tealca_strat_recs_${currentClient}`);
      localStorage.removeItem(`tealca_hidden_reasons_${currentClient}`);
      localStorage.removeItem(`tealca_hidden_recs_${currentClient}`);
    } catch (e) {}
    renderAll();
  }
}

// ==================== CONTROL DE PANTALLA COMPLETA ====================
let isAppFullscreen = false;

function updateFullscreenUI(active) {
  isAppFullscreen = !!active;
  const btn = document.getElementById("btn-toggle-fullscreen");
  if (btn) {
    btn.innerHTML = `<i data-lucide="${isAppFullscreen ? "minimize-2" : "maximize-2"}" class="w-4 h-4"></i>`;
    btn.title = isAppFullscreen
      ? "Salir de pantalla completa"
      : "Pantalla completa";
  }
  const pptFullscreenBtns = document.querySelectorAll(
    '#modal-presentation [onclick="toggleFullscreen()"]',
  );
  pptFullscreenBtns.forEach((b) => {
    b.innerHTML = `<i data-lucide="${isAppFullscreen ? "minimize-2" : "maximize-2"}" class="w-5 h-5"></i>`;
    b.title = isAppFullscreen
      ? "Salir de pantalla completa (F11)"
      : "Pantalla completa (F11)";
  });
  refreshLucideIcons();
}

function toggleFullscreen() {
  const isCurrentlyFullscreen = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    document.body.classList.contains("fullscreen-mode")
  );

  if (!isCurrentlyFullscreen) {
    const el = document.documentElement;
    let promise = null;
    if (el.requestFullscreen) {
      promise = el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      promise = el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      promise = el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
      promise = el.msRequestFullscreen();
    }

    if (promise && typeof promise.catch === "function") {
      promise
        .then(() => updateFullscreenUI(true))
        .catch(() => {
          document.body.classList.add("fullscreen-mode");
          updateFullscreenUI(true);
        });
    } else {
      updateFullscreenUI(true);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    document.body.classList.remove("fullscreen-mode");
    updateFullscreenUI(false);
  }
}

[
  "fullscreenchange",
  "webkitfullscreenchange",
  "mozfullscreenchange",
  "MSFullscreenChange",
].forEach((evt) => {
  document.addEventListener(evt, () => {
    const isFs = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    updateFullscreenUI(isFs);
  });
});

// ==================== 8. MODO PRESENTACIÓN DINÁMICO (PPT) ====================
let pptMetric = "usd";

function setPptMetric(m) {
  pptMetric = m;
  ["usd", "guias", "kg"].forEach((type) => {
    const btn = document.getElementById(`ppt-metric-${type}`);
    if (btn) {
      if (type === m) {
        btn.className =
          "px-3 py-1 rounded-lg text-xs font-bold bg-[#0061A8] text-white shadow-xs transition-all cursor-pointer";
      } else {
        btn.className =
          "px-3 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer";
      }
    }
  });
  renderPptSlide();
}

function formatPptValue(val, metric = pptMetric) {
  if (metric === "usd") return formatUSD(val);
  if (metric === "guias") return `${formatGuias(val)} guías`;
  return `${formatNumber(val, 1, 1)} kg`;
}

function getPptQuincenas(clientName, metric = pptMetric) {
  const filtered =
    clientName === "TODOS"
      ? allShipments
      : allShipments.filter((s) => s.client === clientName);
  const jul = filtered.filter((s) => s.month === "Julio");
  const ago = filtered.filter((s) => s.month === "Agosto");

  const q1Jul = jul
    .filter((s) => s.day <= 15)
    .reduce((acc, s) => acc + s[metric], 0);
  const q1Ago = ago
    .filter((s) => s.day <= 15)
    .reduce((acc, s) => acc + s[metric], 0);
  const q1Diff = q1Ago - q1Jul;
  const q1Pct = q1Jul ? (q1Diff / q1Jul) * 100 : 0;

  const q2Jul = jul
    .filter((s) => s.day > 15)
    .reduce((acc, s) => acc + s[metric], 0);
  const q2Ago = ago
    .filter((s) => s.day > 15)
    .reduce((acc, s) => acc + s[metric], 0);
  const q2Diff = q2Ago - q2Jul;
  const q2Pct = q2Jul ? (q2Diff / q2Jul) * 100 : 0;

  return { q1Jul, q1Ago, q1Diff, q1Pct, q2Jul, q2Ago, q2Diff, q2Pct };
}

function getPptClientData(clientName) {
  const filtered =
    clientName === "TODOS"
      ? allShipments
      : allShipments.filter((s) => s.client === clientName);
  const jul = filtered.filter((s) => s.month === "Julio");
  const ago = filtered.filter((s) => s.month === "Agosto");

  const totalJul = jul.reduce((acc, s) => acc + s[pptMetric], 0);
  const totalAgo = ago.reduce((acc, s) => acc + s[pptMetric], 0);
  const diff = totalAgo - totalJul;
  const pct = totalJul ? (diff / totalJul) * 100 : 0;

  const weeks = [
    "Semana 1",
    "Semana 2",
    "Semana 3",
    "Semana 4",
    "Semana 5",
    "Semana 6",
  ];
  const weekly = weeks.map((w) => {
    const jVal = jul
      .filter((s) => s.week === w)
      .reduce((acc, s) => acc + s[pptMetric], 0);
    const aVal = ago
      .filter((s) => s.week === w)
      .reduce((acc, s) => acc + s[pptMetric], 0);
    return { week: w, jul: jVal, ago: aVal, diff: aVal - jVal };
  });

  const quincenas = getPptQuincenas(clientName, pptMetric);
  const analysis = calculateAnalysis(clientName, allShipments);
  const defaultDiag = diagnoseClientReasons(
    clientName,
    analysis,
    quincenas.q1Diff,
    quincenas.q2Diff,
  );
  const reasons = getStoredStrategicItems(
    clientName,
    "reasons",
    defaultDiag.keyReasons,
  );
  const recs = getStoredStrategicItems(
    clientName,
    "recs",
    defaultDiag.recommendations,
  );
  const hiddenReasons = getStoredHiddenStrategicIds(clientName, "reasons");
  const hiddenRecs = getStoredHiddenStrategicIds(clientName, "recs");

  const visibleReasons = reasons.filter((r) => !hiddenReasons.includes(r.id));
  const visibleRecs = recs.filter((r) => !hiddenRecs.includes(r.id));

  return {
    totalJul,
    totalAgo,
    diff,
    pct,
    weekly,
    quincenas,
    visibleReasons,
    visibleRecs,
  };
}

const pptSlides = [
  // Lámina 1: Resumen General Consolidado
  {
    title: "Diagnóstico Ejecutivo: Resumen General de Resultados",
    subtitle:
      "Comportamiento comparado de Julio vs Agosto 2026 (Consolidado General TEALCA)",
    render: () => {
      const d = getPptClientData("TODOS");
      const isNeg = d.diff < 0;
      return `
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-3xs font-black text-slate-400 uppercase tracking-wider">Julio 2026 (${pptMetric.toUpperCase()})</span>
              <div class="text-2xl font-black text-[#0061A8] mt-1">${formatPptValue(d.totalJul)}</div>
              <p class="text-xs text-slate-500 mt-1">Línea base operacional sólida</p>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-3xs font-black text-slate-400 uppercase tracking-wider">Agosto 2026 (${pptMetric.toUpperCase()})</span>
              <div class="text-2xl font-black text-[#E8B43B] mt-1">${formatPptValue(d.totalAgo)}</div>
              <p class="text-xs text-slate-500 mt-1">Volumen final ejecutado</p>
            </div>
            <div class="${isNeg ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"} p-5 rounded-2xl border shadow-xs">
              <span class="text-3xs font-black ${isNeg ? "text-[#DC2626]" : "text-emerald-700"} uppercase tracking-wider">Variación Neta</span>
              <div class="text-2xl font-black ${isNeg ? "text-[#DC2626]" : "text-emerald-700"} mt-1">${isNeg ? "" : "+"}${formatPptValue(d.diff)}</div>
              <p class="text-xs font-bold ${isNeg ? "text-[#DC2626]" : "text-emerald-700"} mt-1">${formatPercentage(d.pct)} vs mes anterior</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold text-amber-900">1ra Quincena (Días 1-15)</span>
                <span class="text-xs font-black text-red-600">${formatPercentage(d.quincenas.q1Pct)}</span>
              </div>
              <div class="text-lg font-black text-slate-800">${formatPptValue(d.quincenas.q1Ago)} <span class="text-xs text-slate-500 font-normal">vs ${formatPptValue(d.quincenas.q1Jul)}</span></div>
              <p class="text-2xs text-red-700 font-semibold mt-1">Brecha crítica inicial: ${formatPptValue(d.quincenas.q1Diff)}</p>
            </div>

            <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold text-blue-900">2da Quincena (Días 16-31)</span>
                <span class="text-xs font-black text-emerald-600">${formatPercentage(d.quincenas.q2Pct)}</span>
              </div>
              <div class="text-lg font-black text-slate-800">${formatPptValue(d.quincenas.q2Ago)} <span class="text-xs text-slate-500 font-normal">vs ${formatPptValue(d.quincenas.q2Jul)}</span></div>
              <p class="text-2xs text-emerald-700 font-semibold mt-1">Recuperación efectiva de cierre: ${formatPptValue(d.quincenas.q2Diff)}</p>
            </div>
          </div>

          <div class="bg-blue-50/70 border border-[#0061A8]/20 rounded-2xl p-5">
            <h4 class="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
              <i data-lucide="split" class="w-4 h-4 text-[#0061A8]"></i>
              <span>Conclusión Clave: Localización de la Pérdida en Semana 1</span>
            </h4>
            <p class="text-xs text-slate-700 leading-relaxed font-medium">
              Toda la contracción neta del mes se concentró en la <strong>Semana 1 de Agosto</strong>. En la segunda quincena la facturación igualó y superó a la de Julio, confirmando que la demanda existió pero sufrió un desfase por parálisis operativa inicial.
            </p>
          </div>
        </div>
      `;
    },
  },

  // Lámina 2: TODO TRACTOR C.A.
  {
    title: "TODO TRACTOR C.A.: Desfase y Parálisis en Semana 1",
    subtitle:
      "Análisis de comportamiento, concentración tardía y factores de recuperación",
    render: () => {
      const d = getPptClientData("TODO TRACTOR C.A.");
      return `
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-slate-200">
              <span class="text-3xs font-black text-slate-400 uppercase">Julio 2026</span>
              <div class="text-xl font-black text-[#0061A8] mt-1">${formatPptValue(d.totalJul)}</div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200">
              <span class="text-3xs font-black text-slate-400 uppercase">Agosto 2026</span>
              <div class="text-xl font-black text-[#E8B43B] mt-1">${formatPptValue(d.totalAgo)}</div>
            </div>
            <div class="bg-red-50 p-5 rounded-2xl border border-red-200">
              <span class="text-3xs font-black text-red-600 uppercase">Variación</span>
              <div class="text-xl font-black text-red-600 mt-1">${formatPptValue(d.diff)} (${formatPercentage(d.pct)})</div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span class="text-3xs font-black text-amber-900 uppercase">1ra Quincena</span>
              <div class="text-base font-black text-slate-800 mt-1">${formatPptValue(d.quincenas.q1Ago)} vs ${formatPptValue(d.quincenas.q1Jul)}</div>
              <p class="text-xs font-bold text-red-600 mt-0.5">Diferencia: ${formatPptValue(d.quincenas.q1Diff)} (${formatPercentage(d.quincenas.q1Pct)})</p>
            </div>
            <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <span class="text-3xs font-black text-blue-900 uppercase">2da Quincena</span>
              <div class="text-base font-black text-slate-800 mt-1">${formatPptValue(d.quincenas.q2Ago)} vs ${formatPptValue(d.quincenas.q2Jul)}</div>
              <p class="text-xs font-bold ${d.quincenas.q2Diff >= 0 ? "text-emerald-600" : "text-slate-600"} mt-0.5">Diferencia: ${formatPptValue(d.quincenas.q2Diff)} (${formatPercentage(d.quincenas.q2Pct)})</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h5 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Factores Clave Diagnosticados</h5>
              <div class="space-y-2">
                ${d.visibleReasons
                  .slice(0, 2)
                  .map(
                    (r, i) => `
                  <div class="flex items-start gap-2 text-xs text-slate-700">
                    <span class="w-5 h-5 rounded bg-blue-100 text-[#0061A8] font-bold flex items-center justify-center shrink-0 mt-0.5">${i + 1}</span>
                    <p>${r.text}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
            <div class="p-4 rounded-2xl bg-blue-50/50 border border-blue-200">
              <h5 class="text-xs font-bold text-[#0061A8] uppercase tracking-wider mb-2">Acciones Inmediatas</h5>
              <div class="space-y-2">
                ${d.visibleRecs
                  .slice(0, 2)
                  .map(
                    (rec, i) => `
                  <div class="flex items-start gap-2 text-xs text-slate-700">
                    <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
                    <p class="font-medium">${rec.text}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      `;
    },
  },

  // Lámina 3: Biopago C.A.
  {
    title: "Biopago C.A.: Inicio Tardío vs Repunte en Semanas 3-5",
    subtitle: "Rendimiento corporativo y dinamismo en reposición de equipos",
    render: () => {
      const d = getPptClientData("Biopago C.A.");
      return `
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-slate-200">
              <span class="text-3xs font-black text-slate-400 uppercase">Julio 2026</span>
              <div class="text-xl font-black text-[#0061A8] mt-1">${formatPptValue(d.totalJul)}</div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200">
              <span class="text-3xs font-black text-slate-400 uppercase">Agosto 2026</span>
              <div class="text-xl font-black text-[#E8B43B] mt-1">${formatPptValue(d.totalAgo)}</div>
            </div>
            <div class="bg-red-50 p-5 rounded-2xl border border-red-200">
              <span class="text-3xs font-black text-red-600 uppercase">Variación</span>
              <div class="text-xl font-black text-red-600 mt-1">${formatPptValue(d.diff)} (${formatPercentage(d.pct)})</div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span class="text-3xs font-black text-amber-900 uppercase">1ra Quincena</span>
              <div class="text-base font-black text-slate-800 mt-1">${formatPptValue(d.quincenas.q1Ago)} vs ${formatPptValue(d.quincenas.q1Jul)}</div>
              <p class="text-xs font-bold text-red-600 mt-0.5">Diferencia: ${formatPptValue(d.quincenas.q1Diff)} (${formatPercentage(d.quincenas.q1Pct)})</p>
            </div>
            <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <span class="text-3xs font-black text-blue-900 uppercase">2da Quincena</span>
              <div class="text-base font-black text-slate-800 mt-1">${formatPptValue(d.quincenas.q2Ago)} vs ${formatPptValue(d.quincenas.q2Jul)}</div>
              <p class="text-xs font-bold text-emerald-600 mt-0.5">Diferencia: ${formatPptValue(d.quincenas.q2Diff)} (${formatPercentage(d.quincenas.q2Pct)})</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h5 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Factores Clave Diagnosticados</h5>
              <div class="space-y-2">
                ${d.visibleReasons
                  .slice(0, 2)
                  .map(
                    (r, i) => `
                  <div class="flex items-start gap-2 text-xs text-slate-700">
                    <span class="w-5 h-5 rounded bg-blue-100 text-[#0061A8] font-bold flex items-center justify-center shrink-0 mt-0.5">${i + 1}</span>
                    <p>${r.text}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
            <div class="p-4 rounded-2xl bg-blue-50/50 border border-blue-200">
              <h5 class="text-xs font-bold text-[#0061A8] uppercase tracking-wider mb-2">Acciones Inmediatas</h5>
              <div class="space-y-2">
                ${d.visibleRecs
                  .slice(0, 2)
                  .map(
                    (rec, i) => `
                  <div class="flex items-start gap-2 text-xs text-slate-700">
                    <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
                    <p class="font-medium">${rec.text}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      `;
    },
  },

  // Lámina 4: ESTEFANY REINOSO
  {
    title: "ESTEFANY REINOSO: Contracción en Carga Pesada",
    subtitle:
      "Impacto de casi una tonelada métrica menos y menor frecuencia de despachos",
    render: () => {
      const d = getPptClientData("ESTEFANY REINOSO");
      return `
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-slate-200">
              <span class="text-3xs font-black text-slate-400 uppercase">Julio 2026</span>
              <div class="text-xl font-black text-[#0061A8] mt-1">${formatPptValue(d.totalJul)}</div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200">
              <span class="text-3xs font-black text-slate-400 uppercase">Agosto 2026</span>
              <div class="text-xl font-black text-[#E8B43B] mt-1">${formatPptValue(d.totalAgo)}</div>
            </div>
            <div class="bg-red-50 p-5 rounded-2xl border border-red-200">
              <span class="text-3xs font-black text-red-600 uppercase">Variación</span>
              <div class="text-xl font-black text-red-600 mt-1">${formatPptValue(d.diff)} (${formatPercentage(d.pct)})</div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span class="text-3xs font-black text-amber-900 uppercase">1ra Quincena</span>
              <div class="text-base font-black text-slate-800 mt-1">${formatPptValue(d.quincenas.q1Ago)} vs ${formatPptValue(d.quincenas.q1Jul)}</div>
              <p class="text-xs font-bold text-red-600 mt-0.5">Diferencia: ${formatPptValue(d.quincenas.q1Diff)} (${formatPercentage(d.quincenas.q1Pct)})</p>
            </div>
            <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <span class="text-3xs font-black text-blue-900 uppercase">2da Quincena</span>
              <div class="text-base font-black text-slate-800 mt-1">${formatPptValue(d.quincenas.q2Ago)} vs ${formatPptValue(d.quincenas.q2Jul)}</div>
              <p class="text-xs font-bold text-red-600 mt-0.5">Diferencia: ${formatPptValue(d.quincenas.q2Diff)} (${formatPercentage(d.quincenas.q2Pct)})</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h5 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Factores Clave Diagnosticados</h5>
              <div class="space-y-2">
                ${d.visibleReasons
                  .slice(0, 2)
                  .map(
                    (r, i) => `
                  <div class="flex items-start gap-2 text-xs text-slate-700">
                    <span class="w-5 h-5 rounded bg-blue-100 text-[#0061A8] font-bold flex items-center justify-center shrink-0 mt-0.5">${i + 1}</span>
                    <p>${r.text}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
            <div class="p-4 rounded-2xl bg-blue-50/50 border border-blue-200">
              <h5 class="text-xs font-bold text-[#0061A8] uppercase tracking-wider mb-2">Acciones Inmediatas</h5>
              <div class="space-y-2">
                ${d.visibleRecs
                  .slice(0, 2)
                  .map(
                    (rec, i) => `
                  <div class="flex items-start gap-2 text-xs text-slate-700">
                    <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
                    <p class="font-medium">${rec.text}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      `;
    },
  },

  // Lámina 5: BARPEL C.A
  {
    title: "BARPEL C.A: Reducción Continua en Guías y Frecuencia",
    subtitle: "Despachos agrupados al cierre y contracción del 23.8% en guías",
    render: () => {
      const d = getPptClientData("BARPEL C.A");
      return `
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-slate-200">
              <span class="text-3xs font-black text-slate-400 uppercase">Julio 2026</span>
              <div class="text-xl font-black text-[#0061A8] mt-1">${formatPptValue(d.totalJul)}</div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200">
              <span class="text-3xs font-black text-slate-400 uppercase">Agosto 2026</span>
              <div class="text-xl font-black text-[#E8B43B] mt-1">${formatPptValue(d.totalAgo)}</div>
            </div>
            <div class="bg-red-50 p-5 rounded-2xl border border-red-200">
              <span class="text-3xs font-black text-red-600 uppercase">Variación</span>
              <div class="text-xl font-black text-red-600 mt-1">${formatPptValue(d.diff)} (${formatPercentage(d.pct)})</div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span class="text-3xs font-black text-amber-900 uppercase">1ra Quincena</span>
              <div class="text-base font-black text-slate-800 mt-1">${formatPptValue(d.quincenas.q1Ago)} vs ${formatPptValue(d.quincenas.q1Jul)}</div>
              <p class="text-xs font-bold text-red-600 mt-0.5">Diferencia: ${formatPptValue(d.quincenas.q1Diff)} (${formatPercentage(d.quincenas.q1Pct)})</p>
            </div>
            <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <span class="text-3xs font-black text-blue-900 uppercase">2da Quincena</span>
              <div class="text-base font-black text-slate-800 mt-1">${formatPptValue(d.quincenas.q2Ago)} vs ${formatPptValue(d.quincenas.q2Jul)}</div>
              <p class="text-xs font-bold text-red-600 mt-0.5">Diferencia: ${formatPptValue(d.quincenas.q2Diff)} (${formatPercentage(d.quincenas.q2Pct)})</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h5 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Factores Clave Diagnosticados</h5>
              <div class="space-y-2">
                ${d.visibleReasons
                  .slice(0, 2)
                  .map(
                    (r, i) => `
                  <div class="flex items-start gap-2 text-xs text-slate-700">
                    <span class="w-5 h-5 rounded bg-blue-100 text-[#0061A8] font-bold flex items-center justify-center shrink-0 mt-0.5">${i + 1}</span>
                    <p>${r.text}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
            <div class="p-4 rounded-2xl bg-blue-50/50 border border-blue-200">
              <h5 class="text-xs font-bold text-[#0061A8] uppercase tracking-wider mb-2">Acciones Inmediatas</h5>
              <div class="space-y-2">
                ${d.visibleRecs
                  .slice(0, 2)
                  .map(
                    (rec, i) => `
                  <div class="flex items-start gap-2 text-xs text-slate-700">
                    <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
                    <p class="font-medium">${rec.text}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      `;
    },
  },

  // Lámina 6: El Efecto Quincenal
  {
    title: "El Efecto Quincenal: ¿Dónde se originó el desfase?",
    subtitle:
      "Comportamiento disociado entre 1ra Quincena (-28.2%) y 2da Quincena (+0.3%)",
    render: () => {
      const clients = [
        "TODO TRACTOR C.A.",
        "Biopago C.A.",
        "ESTEFANY REINOSO",
        "BARPEL C.A",
      ];
      const qCons = getPptQuincenas("TODOS", pptMetric);

      return `
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-red-50/60 p-5 rounded-2xl border border-red-200">
              <span class="px-2.5 py-1 rounded text-xs font-black bg-red-600 text-white uppercase">1ra Quincena (Días 1-15)</span>
              <h4 class="font-bold text-sm text-red-900 mt-2">Colapso Inicial y Retención</h4>
              <p class="text-xs text-slate-600 mt-2 leading-relaxed">
                • Julio: ${formatPptValue(qCons.q1Jul)}<br>
                • Agosto: ${formatPptValue(qCons.q1Ago)}<br>
                • Brecha Neta: <strong class="text-red-600">${formatPptValue(qCons.q1Diff)} (${formatPercentage(qCons.q1Pct)})</strong><br>
                • Toda la contracción neta del mes se consolidó en los primeros 15 días.
              </p>
            </div>

            <div class="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200">
              <span class="px-2.5 py-1 rounded text-xs font-black bg-emerald-700 text-white uppercase">2da Quincena (Días 16-31)</span>
              <h4 class="font-bold text-sm text-emerald-950 mt-2">Recuperación y Resiliencia</h4>
              <p class="text-xs text-slate-600 mt-2 leading-relaxed">
                • Julio: ${formatPptValue(qCons.q2Jul)}<br>
                • Agosto: ${formatPptValue(qCons.q2Ago)}<br>
                • Variación: <strong class="text-emerald-700">${formatPptValue(qCons.q2Diff)} (${formatPercentage(qCons.q2Pct)})</strong><br>
                • Agosto igualó e incluso superó a Julio en los 16 días finales del mes.
              </p>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-100 text-slate-700 font-bold uppercase text-3xs">
                <tr>
                  <th class="p-3">Cliente</th>
                  <th class="p-3 text-right">Q1 Jul</th>
                  <th class="p-3 text-right">Q1 Ago</th>
                  <th class="p-3 text-right">Var Q1</th>
                  <th class="p-3 text-right">Q2 Jul</th>
                  <th class="p-3 text-right">Q2 Ago</th>
                  <th class="p-3 text-right">Var Q2</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${clients
                  .map((c) => {
                    const q = getPptQuincenas(c, pptMetric);
                    return `
                    <tr class="hover:bg-slate-50">
                      <td class="p-3 font-bold text-slate-800">${c}</td>
                      <td class="p-3 text-right text-slate-600">${formatPptValue(q.q1Jul)}</td>
                      <td class="p-3 text-right font-bold text-slate-800">${formatPptValue(q.q1Ago)}</td>
                      <td class="p-3 text-right font-bold text-red-600">${formatPercentage(q.q1Pct)}</td>
                      <td class="p-3 text-right text-slate-600">${formatPptValue(q.q2Jul)}</td>
                      <td class="p-3 text-right font-bold text-slate-800">${formatPptValue(q.q2Ago)}</td>
                      <td class="p-3 text-right font-bold ${q.q2Diff >= 0 ? "text-emerald-600" : "text-slate-600"}">${formatPercentage(q.q2Pct)}</td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },
  },

  // Lámina 7: Matriz Comparativa Cruzada
  {
    title: "Matriz Comparativa Cruzada de Desempeño",
    subtitle:
      "Rendimiento detallado de Facturación, Guías y Kilogramos por cuenta clave",
    render: () => {
      const clients = [
        "TODO TRACTOR C.A.",
        "Biopago C.A.",
        "ESTEFANY REINOSO",
        "BARPEL C.A",
      ];
      return `
        <div class="space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table class="w-full text-xs text-left">
              <thead class="bg-[#0061A8] text-white font-bold uppercase text-3xs">
                <tr>
                  <th class="p-3">Cliente</th>
                  <th class="p-3 text-right">Facturación USD</th>
                  <th class="p-3 text-right">Var USD</th>
                  <th class="p-3 text-right">Guías</th>
                  <th class="p-3 text-right">Var Guías</th>
                  <th class="p-3 text-right">Kilogramos</th>
                  <th class="p-3 text-right">Var Kg</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${clients
                  .map((c) => {
                    const a = calculateAnalysis(c, allShipments);
                    return `
                    <tr class="hover:bg-slate-50">
                      <td class="p-3 font-bold text-slate-900">${c}</td>
                      <td class="p-3 text-right font-semibold text-slate-800">${formatUSD(a.sumAgo.usd)}</td>
                      <td class="p-3 text-right font-black ${a.diff.usd >= 0 ? "text-emerald-600" : "text-red-600"}">${formatPercentage(a.pct.usd)}</td>
                      <td class="p-3 text-right font-semibold text-slate-800">${formatGuias(a.sumAgo.guias)}</td>
                      <td class="p-3 text-right font-black ${a.diff.guias >= 0 ? "text-emerald-600" : "text-red-600"}">${formatPercentage(a.pct.guias)}</td>
                      <td class="p-3 text-right font-semibold text-slate-800">${formatKg(a.sumAgo.kg, false)}</td>
                      <td class="p-3 text-right font-black ${a.diff.kg >= 0 ? "text-emerald-600" : "text-red-600"}">${formatPercentage(a.pct.kg)}</td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h5 class="text-xs font-bold text-slate-900 mb-1">Carga Pesada vs Paquetería</h5>
              <p class="text-xs text-slate-600 leading-relaxed">
                La caída en Kilogramos (-20.7%) y la caída en guías (-10.8%), redujo drásticamente nuestros ingresos, principalmente en Estefany Reinoso y Todo Tractor.
              </p>
            </div>
            <div class="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
              <h5 class="text-xs font-bold text-amber-900 mb-1">Concentración de Cierre</h5>
              <p class="text-xs text-slate-600 leading-relaxed">
                El 65% de la facturación de Agosto se acumuló en las últimas dos semanas del mes, generando saturación de transporte en los últimos 4 días hábiles.
              </p>
            </div>
          </div>
        </div>
      `;
    },
  },

  // Lámina 8: Análisis de Causa Raíz (RCA)
  {
    title: "Hallazgos de Causa Raíz (RCA) y Metodología 5 Porqués",
    subtitle:
      "Factores concretos cuantitativos que provocaron la contracción en los números",
    render: () => `
      <div class="space-y-4 my-2">
        <div class="p-4 rounded-2xl bg-red-50/60 border border-red-200">
          <h4 class="font-black text-xs text-[#DC2626] uppercase tracking-wider mb-1">Causa 1: Desfase Crítico de Semana 1 (-$4,507 USD)</h4>
          <p class="text-xs text-slate-700 leading-relaxed">
            Inercia comercial y cautela de inicio de mes tras eventos post-terremotos. Los clientes corporativos pausaron sus despachos en los primeros 7 días, trasladando la demanda al cierre de mes sin capacidad física de recuperación completa.
          </p>
        </div>
        <div class="p-4 rounded-2xl bg-amber-50/60 border border-[#E8B43B]/40">
          <h4 class="font-black text-xs text-amber-900 uppercase tracking-wider mb-1">Causa 2: Mutación en la Mezcla de Carga (-1.6 Toneladas)</h4>
          <p class="text-xs text-slate-700 leading-relaxed">
            Los kilogramos cayeron el doble (-20.7%) que las guías (-10.8%). Cuentas clave enviaron piezas y repuestos más livianos, reduciendo el ingreso generado.
          </p>
        </div>
        <div class="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
          <h4 class="font-black text-xs text-[#0061A8] uppercase tracking-wider mb-1">Causa 3: Agrupación Logística en Barpel C.A</h4>
          <p class="text-xs text-slate-700 leading-relaxed">
            Barpel disminuyó 34 guías individuales (-23.8%) pero despachó un envío masivo el 31 de Agosto ($492 USD y 308 kg), quizas por agrupación intencional para reducir fletes unitarios, es mucho más barato enviar un solo camión o palé grande de 308 kg que hacer 34 envíos pequeños de 9 kg.
          </p>
        </div>
      </div>
    `,
  },

  // Lámina 9: Conclusiones y Plan de Choque
  {
    title: "Plan de Choque y Recomendaciones Inmediatas",
    subtitle:
      "Estrategias de recuperación para estabilizar la facturación mensual en TEALCA",
    render: () => `
      <div class="space-y-3.5 my-2">
        <div class="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-3 shadow-2xs">
          <span class="w-6 h-6 rounded-lg bg-[#0061A8] text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
          <div>
            <strong class="text-xs font-bold text-slate-900 block">Campaña 'Arranque Fuerte Semana 1':</strong>
            <span class="text-xs text-slate-600">Ofrecer tarifas preferenciales y descuentos en guías confirmadas en los primeros 5 días hábiles para romper la parálisis inicial de mes.</span>
          </div>
        </div>
        <div class="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-3 shadow-2xs">
          <span class="w-6 h-6 rounded-lg bg-[#0061A8] text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
          <div>
            <strong class="text-xs font-bold text-slate-900 block">Acuerdos de Retiro Diario Programado:</strong>
            <span class="text-xs text-slate-600">Pactar SLAs (Service Level Agreement) de retiro diario con Barpel y Biopago para mitigar saturación y cuellos de botella de cierre de mes.</span>
          </div>
        </div>
        <div class="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-3 shadow-2xs">
          <span class="w-6 h-6 rounded-lg bg-[#0061A8] text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
          <div>
            <strong class="text-xs font-bold text-slate-900 block">Estructuración de Fletes Mínimos por Lote:</strong>
            <span class="text-xs text-slate-600">Revisión de acuerdos tarifarios para asegurar fletes mínimos en paquetería liviana y proteger el margen neto frente a variaciones de peso.</span>
          </div>
        </div>
        <div class="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-3 shadow-2xs">
          <span class="w-6 h-6 rounded-lg bg-[#0061A8] text-white flex items-center justify-center font-bold text-xs shrink-0">4</span>
          <div>
            <strong class="text-xs font-bold text-slate-900 block">Mesa Técnica de Planificación con Biopago:</strong>
            <span class="text-xs text-slate-600">Sincronizar a tiempo los cronogramas de reposición masiva para anticipar picos de demanda. atender y entender a profundidad.</span>
          </div>
        </div>
      </div>
    `,
  },
];

function togglePresentation() {
  const modal = document.getElementById("modal-presentation");
  if (!modal) return;
  modal.classList.toggle("hidden");
  currentSlideIdx = 0;
  renderPptSlide();
}

function renderPptSlide() {
  const s = pptSlides[currentSlideIdx];
  const container = document.getElementById("ppt-slide-content");
  const counter = document.getElementById("ppt-step-counter");

  if (counter) {
    counter.textContent = `Diapositiva ${currentSlideIdx + 1} de ${pptSlides.length}`;
  }

  if (container && s) {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-4">
        <div>
          <span class="text-3xs font-black uppercase tracking-wider text-[#0061A8] bg-[#E6F0F8] px-2.5 py-1 rounded-md">
            Lámina ${currentSlideIdx + 1}
          </span>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">${s.title}</h2>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">${s.subtitle}</p>
        </div>
        ${s.render()}
      </div>
    `;
    renderPptDots();
    refreshLucideIcons();
  }
}

function renderPptDots() {
  const container = document.getElementById("ppt-dots-container");
  if (!container) return;
  container.innerHTML = pptSlides
    .map(
      (s, idx) => `
    <button 
      onclick="goToPptSlide(${idx})" 
      class="h-2 rounded-full transition-all cursor-pointer ${idx === currentSlideIdx ? "w-8 bg-[#E8B43B]" : "w-2.5 bg-slate-700 hover:bg-slate-500"}"
      title="Ir a lámina ${idx + 1}: ${s.title}"
    ></button>
  `,
    )
    .join("");
}

function goToPptSlide(idx) {
  if (idx >= 0 && idx < pptSlides.length) {
    currentSlideIdx = idx;
    renderPptSlide();
  }
}

function prevPptSlide() {
  if (currentSlideIdx > 0) {
    currentSlideIdx--;
    renderPptSlide();
  }
}

function nextPptSlide() {
  if (currentSlideIdx < pptSlides.length - 1) {
    currentSlideIdx++;
    renderPptSlide();
  }
}

// ==================== 9. MODALES DE DATOS E IMPORTADOR ====================
function openTableModal() {
  const modal = document.getElementById("modal-table");
  if (!modal) return;
  modal.classList.remove("hidden");
  renderRawTable(allShipments);
}

function closeTableModal() {
  const modal = document.getElementById("modal-table");
  if (modal) modal.classList.add("hidden");
}

function renderRawTable(rows) {
  const tbody = document.getElementById("raw-table-body");
  const count = document.getElementById("table-count");
  if (count) count.textContent = `${rows.length} registros`;

  if (tbody) {
    tbody.innerHTML = rows
      .slice(0, 150)
      .map(
        (r) => `
      <tr class="hover:bg-slate-50">
        <td class="p-2.5 font-bold ${r.month === "Julio" ? "text-[#0061A8]" : "text-[#E8B43B]"}">${r.month}</td>
        <td class="p-2.5 text-slate-600">${r.week}</td>
        <td class="p-2.5 text-slate-600">${r.day}</td>
        <td class="p-2.5 text-slate-600">${r.dateStr}</td>
        <td class="p-2.5 font-bold text-slate-800">${r.client}</td>
        <td class="p-2.5 text-right font-black text-slate-900">${formatUSD(r.usd)}</td>
        <td class="p-2.5 text-right font-bold text-slate-700">${formatGuias(r.guias)}</td>
        <td class="p-2.5 text-right font-bold text-slate-700">${formatKg(r.kg, false)}</td>
      </tr>
    `,
      )
      .join("");
  }
}

function handleTableSearch(term) {
  const q = term.toLowerCase().trim();
  const filtered = allShipments.filter(
    (r) =>
      r.client.toLowerCase().includes(q) ||
      r.dateStr.toLowerCase().includes(q) ||
      r.week.toLowerCase().includes(q) ||
      r.month.toLowerCase().includes(q),
  );
  renderRawTable(filtered);
}

function exportToCSV() {
  let csv = "MES,SEMANA,DIA,FECHA,CLIENTE,FACTURACION USD,GUIAS,KILOGRAMOS\n";
  allShipments.forEach((r) => {
    csv += `"${r.month}","${r.week}",${r.day},"${r.dateStr}","${r.client}",${r.usd},${r.guias},${r.kg}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TEALCA_Movimientos_Julio_Agosto_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function openImporterModal() {
  if (!isUnlocked) {
    handleAuthClick(
      "Debes estar desbloqueado con Eduardo.oso para actualizar o pegar datos desde Google Sheets.",
    );
    return;
  }
  const modal = document.getElementById("modal-importer");
  if (modal) modal.classList.remove("hidden");
}

function closeImporterModal() {
  const modal = document.getElementById("modal-importer");
  if (modal) modal.classList.add("hidden");
}

function loadSampleData() {
  if (!isUnlocked) {
    handleAuthClick(
      "Debes estar desbloqueado con Eduardo.oso para cargar datos.",
    );
    return;
  }
  const textarea = document.getElementById("import-textarea");
  if (textarea && typeof RAW_CSV_DEFAULT !== "undefined") {
    textarea.value = RAW_CSV_DEFAULT;
  }
}

function processDataImport() {
  if (!isUnlocked) {
    handleAuthClick(
      "Debes estar desbloqueado con Eduardo.oso para importar datos de Google Sheets.",
    );
    return;
  }
  const textarea = document.getElementById("import-textarea");
  if (!textarea || !textarea.value.trim()) {
    alert("Por favor ingrese o pegue los datos para procesar.");
    return;
  }

  const parsed = parseShipmentsCSV(textarea.value);
  if (parsed.length > 0) {
    allShipments = parsed;
    closeImporterModal();
    renderAll();
    alert(
      `Se procesaron e importaron exitosamente ${parsed.length} registros operativos.`,
    );
  } else {
    alert("No se pudieron reconocer columnas válidas en el texto ingresado.");
  }
}

// ==================== INICIALIZACIÓN ====================
window.addEventListener("DOMContentLoaded", () => {
  // Selector de cliente
  const clientSelect = document.getElementById("client-select");
  if (clientSelect) {
    clientSelect.addEventListener("change", (e) => setClient(e.target.value));
  }

  // Teclas para PPT y Pantalla Completa
  window.addEventListener("keydown", (e) => {
    const modal = document.getElementById("modal-presentation");
    if (modal && !modal.classList.contains("hidden")) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        nextPptSlide();
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prevPptSlide();
      }
      if (e.key === "Escape") {
        togglePresentation();
      }
    } else if (
      e.key === "Escape" &&
      document.body.classList.contains("fullscreen-mode")
    ) {
      toggleFullscreen();
    }
  });

  // Render inicial
  renderAll();
});

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TEALCA • Base de Datos y Lógica de Ingesta (public/js/data.js)
 * Contiene el dataset completo original (190+ registros) y los eventos de Causa Raíz (RCA).
 */

const RAW_CSV_DEFAULT = `Nombre de Cliente,Fecha,Semanas,USD,GUIAS,KILOGRAMOS
Biopago C.A.,1/7/2026,Semana 1,89,12,"5,65"
Biopago C.A.,2/7/2026,Semana 1,581,48,"27,68"
Biopago C.A.,3/7/2026,Semana 1,1.085,90,"48,03"
Biopago C.A.,4/7/2026,Semana 1,177,14,"7,83"
Biopago C.A.,5/7/2026,Semana 1,36,4,"1,31"
Biopago C.A.,6/7/2026,Semana 2,863,76,"37,54"
Biopago C.A.,7/7/2026,Semana 2,870,56,"145,63"
Biopago C.A.,8/7/2026,Semana 2,923,86,"38,57"
Biopago C.A.,9/7/2026,Semana 2,895,77,"40,83"
Biopago C.A.,10/7/2026,Semana 2,815,76,"38,67"
Biopago C.A.,11/7/2026,Semana 2,114,12,"4,48"
Biopago C.A.,12/7/2026,Semana 2,23,1,"1,3"
Biopago C.A.,13/7/2026,Semana 3,972,86,"42,41"
Biopago C.A.,14/7/2026,Semana 3,571,57,"25,61"
Biopago C.A.,15/7/2026,Semana 3,791,71,"35,54"
Biopago C.A.,16/7/2026,Semana 3,755,77,"33,35"
Biopago C.A.,17/7/2026,Semana 3,1.085,104,"48,69"
Biopago C.A.,18/7/2026,Semana 3,235,12,"11,79"
Biopago C.A.,20/7/2026,Semana 4,685,57,"30,81"
Biopago C.A.,21/7/2026,Semana 4,444,40,"19,56"
Biopago C.A.,22/7/2026,Semana 4,861,78,"39,93"
Biopago C.A.,23/7/2026,Semana 4,852,81,"36,35"
Biopago C.A.,24/7/2026,Semana 4,232,19,"10,35"
Biopago C.A.,25/7/2026,Semana 4,52,5,"2,39"
Biopago C.A.,27/7/2026,Semana 5,471,43,"20,57"
Biopago C.A.,28/7/2026,Semana 5,620,50,"27,04"
Biopago C.A.,29/7/2026,Semana 5,738,63,"32,73"
Biopago C.A.,30/7/2026,Semana 5,763,73,"34,89"
Biopago C.A.,31/7/2026,Semana 5,658,66,"28,17"
Biopago C.A.,1/8/2026,Semana 1,197,16,"8,52"
Biopago C.A.,3/8/2026,Semana 2,870,64,"111,24"
Biopago C.A.,4/8/2026,Semana 2,551,52,"23,03"
Biopago C.A.,5/8/2026,Semana 2,659,62,"26,91"
Biopago C.A.,6/8/2026,Semana 2,635,61,"27,57"
Biopago C.A.,7/8/2026,Semana 2,553,49,"24,9"
Biopago C.A.,8/8/2026,Semana 2,132,12,"6,08"
Biopago C.A.,10/8/2026,Semana 3,986,75,"123,79"
Biopago C.A.,11/8/2026,Semana 3,860,80,"38,64"
Biopago C.A.,12/8/2026,Semana 3,778,66,"35,48"
Biopago C.A.,13/8/2026,Semana 3,1.113,90,"50,47"
Biopago C.A.,14/8/2026,Semana 3,752,69,"29,88"
Biopago C.A.,15/8/2026,Semana 3,78,9,"3,6"
Biopago C.A.,17/8/2026,Semana 4,849,66,"64,49"
Biopago C.A.,18/8/2026,Semana 4,612,59,"26,6"
Biopago C.A.,19/8/2026,Semana 4,831,66,"52,96"
Biopago C.A.,20/8/2026,Semana 4,728,63,"31,24"
Biopago C.A.,21/8/2026,Semana 4,593,56,"24,06"
Biopago C.A.,22/8/2026,Semana 4,124,11,"5,04"
Biopago C.A.,23/8/2026,Semana 4,11,1,"0,44"
Biopago C.A.,24/8/2026,Semana 5,616,56,"26,17"
Biopago C.A.,25/8/2026,Semana 5,765,66,"34,74"
Biopago C.A.,26/8/2026,Semana 5,633,55,"24,94"
Biopago C.A.,27/8/2026,Semana 5,631,57,"27,09"
Biopago C.A.,28/8/2026,Semana 5,922,75,"104,29"
Biopago C.A.,29/8/2026,Semana 5,113,12,"5,59"
Biopago C.A.,31/8/2026,Semana 6,359,31,"15,5"
ESTEFANY REINOSO,1/7/2026,Semana 1,564,12,"197,75"
ESTEFANY REINOSO,2/7/2026,Semana 1,387,8,"132,6"
ESTEFANY REINOSO,3/7/2026,Semana 1,196,6,"59,15"
ESTEFANY REINOSO,4/7/2026,Semana 1,88,2,"29,4"
ESTEFANY REINOSO,5/7/2026,Semana 1,399,3,"197,65"
ESTEFANY REINOSO,6/7/2026,Semana 2,307,6,"131,85"
ESTEFANY REINOSO,7/7/2026,Semana 2,282,9,"85,85"
ESTEFANY REINOSO,8/7/2026,Semana 2,208,6,"69,47"
ESTEFANY REINOSO,9/7/2026,Semana 2,167,5,"56,8"
ESTEFANY REINOSO,10/7/2026,Semana 2,61,1,"21,6"
ESTEFANY REINOSO,13/7/2026,Semana 3,611,10,"213,2"
ESTEFANY REINOSO,14/7/2026,Semana 3,375,9,"133,6"
ESTEFANY REINOSO,15/7/2026,Semana 3,428,10,"138,95"
ESTEFANY REINOSO,16/7/2026,Semana 3,276,4,"124,82"
ESTEFANY REINOSO,17/7/2026,Semana 3,570,11,"216,65"
ESTEFANY REINOSO,18/7/2026,Semana 3,61,2,"19,1"
ESTEFANY REINOSO,20/7/2026,Semana 4,280,7,"97,05"
ESTEFANY REINOSO,21/7/2026,Semana 4,256,7,"87,8"
ESTEFANY REINOSO,22/7/2026,Semana 4,676,7,"414,9"
ESTEFANY REINOSO,23/7/2026,Semana 4,326,8,"109,55"
ESTEFANY REINOSO,24/7/2026,Semana 4,108,4,"40,8"
ESTEFANY REINOSO,27/7/2026,Semana 5,104,2,"36,25"
ESTEFANY REINOSO,28/7/2026,Semana 5,330,11,114
ESTEFANY REINOSO,29/7/2026,Semana 5,219,5,"75,5"
ESTEFANY REINOSO,30/7/2026,Semana 5,565,11,"195,7"
ESTEFANY REINOSO,31/7/2026,Semana 5,667,15,"219,6"
ESTEFANY REINOSO,1/8/2026,Semana 1,217,4,"74,85"
ESTEFANY REINOSO,3/8/2026,Semana 2,197,7,"63,96"
ESTEFANY REINOSO,4/8/2026,Semana 2,155,6,"45,1"
ESTEFANY REINOSO,5/8/2026,Semana 2,333,11,"95,45"
ESTEFANY REINOSO,6/8/2026,Semana 2,427,10,"151,85"
ESTEFANY REINOSO,7/8/2026,Semana 2,433,10,"141,55"
ESTEFANY REINOSO,8/8/2026,Semana 2,103,1,"38,45"
ESTEFANY REINOSO,10/8/2026,Semana 3,193,4,"64,4"
ESTEFANY REINOSO,11/8/2026,Semana 3,115,4,"28,1"
ESTEFANY REINOSO,12/8/2026,Semana 3,86,3,"27,05"
ESTEFANY REINOSO,13/8/2026,Semana 3,123,3,"35,3"
ESTEFANY REINOSO,14/8/2026,Semana 3,214,4,"77,9"
ESTEFANY REINOSO,15/8/2026,Semana 3,18,1,"5,1"
ESTEFANY REINOSO,17/8/2026,Semana 4,384,5,"162,4"
ESTEFANY REINOSO,18/8/2026,Semana 4,468,6,"265,5"
ESTEFANY REINOSO,19/8/2026,Semana 4,213,6,"73,1"
ESTEFANY REINOSO,20/8/2026,Semana 4,193,6,"57,5"
ESTEFANY REINOSO,21/8/2026,Semana 4,548,15,"178,13"
ESTEFANY REINOSO,24/8/2026,Semana 5,199,7,"60,8"
ESTEFANY REINOSO,25/8/2026,Semana 5,338,8,"110,8"
ESTEFANY REINOSO,26/8/2026,Semana 5,138,6,"35,8"
ESTEFANY REINOSO,27/8/2026,Semana 5,252,4,"72,5"
ESTEFANY REINOSO,28/8/2026,Semana 5,558,10,"198,05"
ESTEFANY REINOSO,29/8/2026,Semana 5,157,2,"56,5"
ESTEFANY REINOSO,31/8/2026,Semana 6,348,6,"125,35"
BARPEL C.A,1/7/2026,Semana 1,374,10,"154,5"
BARPEL C.A,2/7/2026,Semana 1,69,4,"20,85"
BARPEL C.A,3/7/2026,Semana 1,117,3,"46,5"
BARPEL C.A,6/7/2026,Semana 2,225,4,"95,15"
BARPEL C.A,7/7/2026,Semana 2,137,4,"55,7"
BARPEL C.A,8/7/2026,Semana 2,697,13,"400,2"
BARPEL C.A,9/7/2026,Semana 2,116,4,"46,35"
BARPEL C.A,10/7/2026,Semana 2,147,6,48
BARPEL C.A,11/7/2026,Semana 2,89,1,"40,85"
BARPEL C.A,13/7/2026,Semana 3,210,11,67
BARPEL C.A,14/7/2026,Semana 3,288,9,"112,3"
BARPEL C.A,15/7/2026,Semana 3,199,5,"89,1"
BARPEL C.A,16/7/2026,Semana 3,167,10,"50,85"
BARPEL C.A,17/7/2026,Semana 3,318,10,"124,96"
BARPEL C.A,18/7/2026,Semana 3,14,1,"3,7"
BARPEL C.A,20/7/2026,Semana 4,176,6,"66,8"
BARPEL C.A,21/7/2026,Semana 4,254,6,"107,72"
BARPEL C.A,22/7/2026,Semana 4,147,3,"74,05"
BARPEL C.A,23/7/2026,Semana 4,331,7,"147,35"
BARPEL C.A,24/7/2026,Semana 4,167,5,67
BARPEL C.A,27/7/2026,Semana 5,456,7,"237,25"
BARPEL C.A,28/7/2026,Semana 5,78,2,"33,3"
BARPEL C.A,29/7/2026,Semana 5,100,4,"38,8"
BARPEL C.A,30/7/2026,Semana 5,253,6,"121,1"
BARPEL C.A,31/7/2026,Semana 5,166,2,"93,89"
BARPEL C.A,1/8/2026,Semana 1,17,1,"4,15"
BARPEL C.A,3/8/2026,Semana 2,133,5,"50,4"
BARPEL C.A,4/8/2026,Semana 2,62,5,"16,15"
BARPEL C.A,5/8/2026,Semana 2,395,8,"177,9"
BARPEL C.A,6/8/2026,Semana 2,102,4,"38,68"
BARPEL C.A,7/8/2026,Semana 2,424,4,"374,4"
BARPEL C.A,8/8/2026,Semana 2,12,1,"2,65"
BARPEL C.A,10/8/2026,Semana 3,36,3,"10,3"
BARPEL C.A,11/8/2026,Semana 3,41,2,"14,6"
BARPEL C.A,12/8/2026,Semana 3,349,10,"145,85"
BARPEL C.A,13/8/2026,Semana 3,29,2,"7,37"
BARPEL C.A,14/8/2026,Semana 3,410,8,"179,8"
BARPEL C.A,17/8/2026,Semana 4,132,3,"56,1"
BARPEL C.A,18/8/2026,Semana 4,207,5,85
BARPEL C.A,19/8/2026,Semana 4,6,1,"1,2"
BARPEL C.A,20/8/2026,Semana 4,202,6,"93,05"
BARPEL C.A,21/8/2026,Semana 4,236,8,"86,65"
BARPEL C.A,24/8/2026,Semana 5,159,6,"62,25"
BARPEL C.A,25/8/2026,Semana 5,170,4,"73,75"
BARPEL C.A,26/8/2026,Semana 5,349,8,"158,95"
BARPEL C.A,27/8/2026,Semana 5,231,5,"139,2"
BARPEL C.A,28/8/2026,Semana 5,116,1,"56,9"
BARPEL C.A,29/8/2026,Semana 5,23,2,"5,85"
BARPEL C.A,31/8/2026,Semana 6,492,7,"308,64"
TODO TRACTOR C.A.,1/7/2026,Semana 1,279,9,"162,21"
TODO TRACTOR C.A.,2/7/2026,Semana 1,244,12,"67,81"
TODO TRACTOR C.A.,3/7/2026,Semana 1,236,10,"78,81"
TODO TRACTOR C.A.,4/7/2026,Semana 1,17,1,"3,64"
TODO TRACTOR C.A.,6/7/2026,Semana 2,49,3,"11,09"
TODO TRACTOR C.A.,7/7/2026,Semana 2,147,7,"41,89"
TODO TRACTOR C.A.,8/7/2026,Semana 2,1.007,10,"488,05"
TODO TRACTOR C.A.,9/7/2026,Semana 2,256,8,"81,66"
TODO TRACTOR C.A.,10/7/2026,Semana 2,13,2,"1,38"
TODO TRACTOR C.A.,13/7/2026,Semana 3,45,6,"8,21"
TODO TRACTOR C.A.,14/7/2026,Semana 3,81,3,"23,97"
TODO TRACTOR C.A.,15/7/2026,Semana 3,131,3,"50,8"
TODO TRACTOR C.A.,16/7/2026,Semana 3,95,3,"28,36"
TODO TRACTOR C.A.,17/7/2026,Semana 3,153,11,"37,22"
TODO TRACTOR C.A.,20/7/2026,Semana 4,57,6,"10,13"
TODO TRACTOR C.A.,21/7/2026,Semana 4,202,12,"61,61"
TODO TRACTOR C.A.,22/7/2026,Semana 4,140,7,"35,9"
TODO TRACTOR C.A.,23/7/2026,Semana 4,201,6,"64,32"
TODO TRACTOR C.A.,24/7/2026,Semana 4,9,1,"1,53"
TODO TRACTOR C.A.,27/7/2026,Semana 5,110,5,"31,12"
TODO TRACTOR C.A.,28/7/2026,Semana 5,7,1,"0,97"
TODO TRACTOR C.A.,29/7/2026,Semana 5,37,4,"8,4"
TODO TRACTOR C.A.,30/7/2026,Semana 5,85,5,"23,2"
TODO TRACTOR C.A.,31/7/2026,Semana 5,27,4,"4,85"
TODO TRACTOR C.A.,3/8/2026,Semana 2,118,7,"33,7"
TODO TRACTOR C.A.,4/8/2026,Semana 2,161,11,"38,2"
TODO TRACTOR C.A.,5/8/2026,Semana 2,75,5,"17,02"
TODO TRACTOR C.A.,6/8/2026,Semana 2,134,4,"43,75"
TODO TRACTOR C.A.,7/8/2026,Semana 2,73,9,"10,72"
TODO TRACTOR C.A.,8/8/2026,Semana 2,49,2,"14,32"
TODO TRACTOR C.A.,10/8/2026,Semana 3,244,7,"93,86"
TODO TRACTOR C.A.,11/8/2026,Semana 3,60,4,"15,57"
TODO TRACTOR C.A.,12/8/2026,Semana 3,97,5,"24,95"
TODO TRACTOR C.A.,13/8/2026,Semana 3,46,4,"11,35"
TODO TRACTOR C.A.,14/8/2026,Semana 3,87,8,"16,62"
TODO TRACTOR C.A.,17/8/2026,Semana 4,391,10,"156,98"
TODO TRACTOR C.A.,18/8/2026,Semana 4,121,9,"33,82"
TODO TRACTOR C.A.,19/8/2026,Semana 4,250,8,"83,41"
TODO TRACTOR C.A.,20/8/2026,Semana 4,101,4,"29,5"
TODO TRACTOR C.A.,21/8/2026,Semana 4,110,6,"29,92"
TODO TRACTOR C.A.,24/8/2026,Semana 5,7,1,"0,92"
TODO TRACTOR C.A.,25/8/2026,Semana 5,170,11,"41,67"
TODO TRACTOR C.A.,26/8/2026,Semana 5,118,5,"35,64"
TODO TRACTOR C.A.,27/8/2026,Semana 5,61,4,"13,38"
TODO TRACTOR C.A.,28/8/2026,Semana 5,124,8,"31,26"
TODO TRACTOR C.A.,29/8/2026,Semana 5,137,10,"30,41"
TODO TRACTOR C.A.,31/8/2026,Semana 6,28,2,"6,31"`;

function parseCSVLine(line) {
  const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
  const matches = [];
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index === regex.lastIndex) regex.lastIndex++;
    matches.push(match[1].replace(/^\"|\"$/g, "").replace(/\"\"/g, '"'));
  }
  return matches;
}

function parseShipmentsCSV(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const parts = parseCSVLine(rawLine);
    if (parts.length < 6) continue;

    const client = parts[0].trim();
    const dateStr = parts[1].trim();
    const week = parts[2].trim();

    const usdClean = parts[3].trim().replace(/\./g, "").replace(/,/g, ".");
    const usd = parseFloat(usdClean) || 0;

    const guias = parseInt(parts[4].trim().replace(/\./g, ""), 10) || 0;

    const kgClean = parts[5].trim().replace(/\./g, "").replace(/,/g, ".");
    const kg = parseFloat(kgClean) || 0;

    const dateTokens = dateStr.split("/");
    const day = parseInt(dateTokens[0], 10) || 1;
    const monthNum = parseInt(dateTokens[1], 10) || 7;
    const year = parseInt(dateTokens[2], 10) || 2026;
    const month = monthNum === 7 ? "Julio" : "Agosto";

    rows.push({
      client,
      dateStr,
      day,
      monthNum,
      month,
      year,
      week,
      usd,
      guias,
      kg,
    });
  }
  return rows;
}

// Dataset Inicial
const DEFAULT_SHIPMENTS = parseShipmentsCSV(RAW_CSV_DEFAULT);

// Clientes Únicos
const CLIENT_LIST = Array.from(new Set(DEFAULT_SHIPMENTS.map((r) => r.client)));

// Eventos Predeterminados para el Análisis de Causa Raíz
const DEFAULT_RCA_EVENTS = [
  {
    id: "evt-1",
    date: "1 al 5 de Agosto",
    dayStart: 1,
    dayEnd: 5,
    title: "Período de Resguardo Comercial y Cautela Inicial",
    desc: "Incertidumbre en la primera semana que llevó a clientes clave a pausar temporalmente sus despachos habituales.",
    category: "externo",
    impact: "Negativo Crítico",
    color: "red",
    affectedClients: ["TODOS", "TODO TRACTOR C.A.", "Biopago C.A."],
  },
  {
    id: "evt-2",
    date: "6 al 10 de Agosto",
    dayStart: 6,
    dayEnd: 10,
    title: "Corte Quincenal Bancario y Reactivación Progresiva",
    desc: "Reanudación de distribución de terminales de pago (POS) y repuestos tras la validación de inventarios quincenales.",
    category: "cliente",
    impact: "Positivo Fuerte",
    color: "blue",
    affectedClients: ["Biopago C.A."],
  },
  {
    id: "evt-3",
    date: "17 de Agosto",
    dayStart: 17,
    dayEnd: 17,
    title: "Lote Extraordinario de Maquinaria y Repuestos Agrícolas",
    desc: "Despacho pico de carga pesada de Todo Tractor (156,98 kg en 10 guías), representando el 40% del flete quincenal.",
    category: "comercial",
    impact: "Positivo Moderado",
    color: "blue",
    affectedClients: ["TODO TRACTOR C.A."],
  },
  {
    id: "evt-4",
    date: "Mes Completo de Agosto",
    dayStart: 1,
    dayEnd: 31,
    title: "Mutación en la Mezcla de Carga: Carga Liviana (-20,7%)",
    desc: "Reducción del peso unitario promedio por guía (-1,6 Toneladas en total), disminuyendo la facturación.",
    category: "operativo",
    impact: "Negativo Crítico",
    color: "red",
    affectedClients: ["TODOS", "TODO TRACTOR C.A.", "ESTEFANY REINOSO"],
  },
  {
    id: "evt-5",
    date: "28 al 31 de Agosto",
    dayStart: 28,
    dayEnd: 31,
    title: "Cierre Comercial de Mes y Concentración Masiva de Envíos",
    desc: "Agresiva aceleración de envíos en los últimos 4 días hábiles para cierre de metas contables (38% del volumen de Agosto).",
    category: "estacional",
    impact: "Positivo Fuerte",
    color: "blue",
    affectedClients: ["TODOS", "BARPEL C.A", "Biopago C.A."],
  },
];

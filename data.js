// Aquí puedes editar fácilmente las categorías y productos.
const DATA = {
  "Proteínas": ["Muslo encuentro", "Muslo", "Pechuga", "Alitas", "Carne", "Puerco", "Pescado", "Huevos"],
  "Verduras": ["Tomate", "Cebolla", "Ajo", "Lechuga", "Zanahoria", "Pepino", "Habichuelas", "Ají", "Gengibre", "Ñame", "Yuca", "Papas"],
  "Frutas": ["Manzana", "Guineo", "Naranja", "Papaya", "Uvas", "Piña", "Plátano verde"],
  "Lácteos": ["Leche", "Yogurt", "Queso Amarillo", "Queso Blanco", "Mantequilla"],
  "Embutidos": ["Jamón", "Salchichas", "Chorizos", "Mortadela"],
  "Enlatados": ["Tuna", "Sardina", "Campbels", "Vegetales", "Hongos", "Maíz dulce"],
  "Secos": ["Arroz", "Pasta", "Frijoles", "Lentejas", "Porotos", "Habas", "Arbejas", "Sal", "Harina", "Azúcar", "Café"],
  "Condimentos": ["Aceite", "Vinagre", "Salsa de Tomate", "Pimienta", "Especias", "Curry", "Caldo Rika", "Laurel", "Ajo Molido", "Sazonador"],
  "Snacks": ["Papas fritas", "Chocolates", "Galletas", "Cheetos"],
  "Aseo Personal": ["Pasta dental", "Jabón de Baño", "Jabón de Manos", "Enjuague Bucal", "Shampoo", "Desodorante", "Gel", "Crema Corporal", "Papel higiénico", "Toallas Sanitarias"],
  "Limpieza Hogar": ["Lava platos", "Desinfectante", "Aromatizante", "Bolsas Negras", "Bolsas blancas", "Papel Toalla"],
  "Herramientas": ["Escoba", "Trapeador", "Recogedor", "Esponja de Fregar"],
  "Lavandería": ["Detergente", "Cloro", "Suavizante", "Quitamanchas"],
  "Bebés": ["Pañales", "Toallitas", "Fórmula", "Jabón", "Shampoo"],
  "Mascotas": ["Alimento", "Shampoo", "Carne Molida", "Huesos", "Sobres Blandos"],
  "Bebidas": ["Jugos", "Sodas", "Agua", "Cervezas", "Licor"]
};

let favoritos = JSON.parse(localStorage.getItem("favoritos")) || {};
let modoFavoritos = false;

const STORAGE_KEY = "mymarket_checklist_v3print";
const THEME_KEY = "mymarket_tema";
const COLLAPSE_KEY = "mymarket_colapsadas";
let clickSound = null;

function injectCompactTableCSS() {
  if (document.getElementById("mm-compact-css")) return;

  const style = document.createElement("style");
  style.id = "mm-compact-css";
  style.textContent = `
    table { width: 100%; table-layout: fixed; }
    th, td { padding: 4px 4px; vertical-align: middle; }
    .mm-col-stock { width: 56px; }
    .mm-col-check { width: 42px; }
    .mm-col-price { width: 96px; }

    td.mm-stock-cell { padding-left: 0; }
    input.stock-input { width: 44px; text-align: center; }

    td.mm-prod-cell {
      width: 1%,
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-left: 2px;
      padding-right: 2px;
    }
td, th {
  overflow: hidden;
  text-overflow: ellipsis;
}
.mm-dot {
  color: #999 !important;
  opacity: 0.25;
}

.mm-dot.zero {
  color: #e53935 !important;
  opacity: 1;
}


    .mm-star { margin-right: 4px; cursor: pointer; }
    td.mm-dot-cell { text-align: center; }
  `;
  document.head.appendChild(style);

  // Si tu tabla NO tiene colgroup, lo creamos aquí para fijar columnas.
  const table = document.querySelector("table");
  if (table && !table.querySelector("colgroup")) {
    const cg = document.createElement("colgroup");

    const c1 = document.createElement("col"); c1.className = "mm-col-stock";
    const c2 = document.createElement("col"); // producto (auto)
    const c3 = document.createElement("col"); c3.className = "mm-col-dot";
    const c4 = document.createElement("col"); c4.className = "mm-col-check";
    const c5 = document.createElement("col"); c5.className = "mm-col-price";

    cg.appendChild(c1);
    cg.appendChild(c2);
    cg.appendChild(c3);
    cg.appendChild(c4);
    cg.appendChild(c5);

    table.insertBefore(cg, table.firstChild);
  }
}

function applyThemeFromStorage() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark") {
    document.body.classList.add("dark");
    const icon = document.getElementById("darkIcon");
    if (icon) icon.textContent = "☀️";
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  const icon = document.getElementById("darkIcon");
  if (icon) icon.textContent = isDark ? "☀️" : "🌙";
}

function loadCollapseState() {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveCollapseState(state) {
  localStorage.setItem(COLLAPSE_KEY, JSON.stringify(state));
}

function buildTable() {
  const tbody = document.getElementById("tablaItems");
  tbody.innerHTML = "";

  const saved = loadData();
  const collapsedState = loadCollapseState();

  Object.keys(DATA).forEach(categoria => {
    const catRow = document.createElement("tr");
    catRow.className = "category-row";
    catRow.dataset.category = categoria;

    const catCell = document.createElement("td");
    catCell.colSpan = 5; // Stock | Producto | ● | ✓ | Precio

    const titleDiv = document.createElement("div");
    titleDiv.className = "category-title";

    const chev = document.createElement("span");
    chev.className = "chevron";
    const isCollapsed = !!collapsedState[categoria];
    chev.textContent = isCollapsed ? "▶" : "▼";

    const textSpan = document.createElement("span");
    textSpan.textContent = categoria;

    const indicator = document.createElement("span");
    indicator.className = "collapsed-indicator";
    indicator.textContent = isCollapsed ? "(plegado)" : "";

    titleDiv.appendChild(chev);
    titleDiv.appendChild(textSpan);
    titleDiv.appendChild(indicator);

    catCell.appendChild(titleDiv);
    catRow.appendChild(catCell);
    tbody.appendChild(catRow);

    DATA[categoria].forEach((producto, idx) => {
      if (modoFavoritos && !favoritos[producto]) return;

      const id = categoria + "-" + idx;

      const row = document.createElement("tr");
      row.className = "item-row";
      row.dataset.id = id;
      row.dataset.category = categoria;
      row.dataset.producto = producto;

      // 📦 STOCK
      const tdStock = document.createElement("td");
      tdStock.className = "mm-stock-cell";
      tdStock.style.textAlign = "left";

      const stockInput = document.createElement("input");
      stockInput.type = "number";
      stockInput.min = "0";
      stockInput.step = "1";
      stockInput.className = "stock-input";

      // cargar stock guardado
      if (saved.items && saved.items[id] && saved.items[id].stock !== undefined) {
        stockInput.value = String(saved.items[id].stock);
      } else {
        stockInput.value = "0";
      }

      stockInput.addEventListener("change", saveData);
      tdStock.appendChild(stockInput);

      // 🛒 PRODUCTO (⭐ + texto)
      const tdProd = document.createElement("td");
      tdProd.className = "mm-prod-cell";

      const star = document.createElement("span");
      star.className = "mm-star";
      star.textContent = favoritos[producto] ? "⭐" : "☆";

      star.addEventListener("click", (e) => {
        e.stopPropagation();
        if (favoritos[producto]) delete favoritos[producto];
        else favoritos[producto] = true;
        localStorage.setItem("favoritos", JSON.stringify(favoritos));
        buildTable();
      });

      tdProd.appendChild(star);
      tdProd.appendChild(document.createTextNode(producto));

      // ● INDICADOR (columna propia para que quede ALINEADO verticalmente)
      const tdDot = document.createElement("td");
      tdDot.className = "mm-dot-cell";

      const dot = document.createElement("span");
      dot.textContent = "●";
      tdDot.appendChild(dot);
function updateDot() {
  const val = Number(stockInput.value || 0);
if (val === 0) {
  dot.style.color = "#e53935"; // rojo
  dot.style.opacity = "1";
} else {
  dot.style.color = "#999";    // gris
  dot.style.opacity = "0.25";
}
}

updateDot();
stockInput.addEventListener("input", updateDot);


      // ✓ CHECK
      const tdCheck = document.createElement("td");
      tdCheck.style.textAlign = "center";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.className = "chk-item";
      chk.addEventListener("change", saveData);
      chk.addEventListener("change", hapticTap);

      tdCheck.appendChild(chk);

      // 💲 PRECIO
      const tdPrecio = document.createElement("td");

      const inp = document.createElement("input");
      inp.type = "number";
      inp.min = "0";
      inp.step = "0.01";
      inp.placeholder = "0.00";
      inp.className = "precio-item";
      inp.addEventListener("change", saveData);

      tdPrecio.appendChild(inp);

      // cargar estado guardado
      if (saved.items && saved.items[id]) {
        chk.checked = !!saved.items[id].checked;
        if (saved.items[id].price !== "") inp.value = saved.items[id].price;
      }

      chk.addEventListener("change", () => {
        row.classList.toggle("done", chk.checked);
        if (chk.checked) {
          row.classList.add("anim");
          setTimeout(() => row.classList.remove("anim"), 250);
          if (clickSound) {
            try { clickSound.currentTime = 0; clickSound.play(); } catch (e) {}
          }
        }
        updateTotals();
      });

      inp.addEventListener("input", updateTotals);

      if (chk.checked) row.classList.add("done");

      // ORDEN FINAL DE COLUMNAS:
      row.appendChild(tdStock);
      row.appendChild(tdProd);
      row.appendChild(tdDot);
      row.appendChild(tdCheck);
      row.appendChild(tdPrecio);

      if (isCollapsed) row.style.display = "none";
      tbody.appendChild(row);
    });

    catRow.addEventListener("click", () => {
      const cs = loadCollapseState();
      const currentlyCollapsed = !!cs[categoria];
      const newState = !currentlyCollapsed;
      cs[categoria] = newState;
      saveCollapseState(cs);

      const rows = tbody.querySelectorAll('tr.item-row[data-category="' + categoria + '"]');
      rows.forEach(r => r.style.display = newState ? "none" : "");

      const chevron = catRow.querySelector(".chevron");
      const indicator = catRow.querySelector(".collapsed-indicator");
      if (chevron) chevron.textContent = newState ? "▶" : "▼";
      if (indicator) indicator.textContent = newState ? "(plegado)" : "";
    });
  });

  const fechaInput = document.getElementById("fecha");
  if (saved.fecha) fechaInput.value = saved.fecha;
  else fechaInput.value = new Date().toISOString().slice(0, 10);

  updateTotals();
}

function updateTotals() {
  const rows = document.querySelectorAll(".item-row");
  const totals = {};

  rows.forEach(row => {
    const categoria = row.dataset.category;
    const chk = row.querySelector(".chk-item");
    const precioInput = row.querySelector(".precio-item");
    if (!precioInput) return;

    const val = parseFloat(String(precioInput.value).replace(",", "."));
    if (chk.checked && !isNaN(val)) {
      totals[categoria] = (totals[categoria] || 0) + val;
    }
  });

  const resumen = document.getElementById("resumenCategorias");
  const categorias = Object.keys(totals);

  if (categorias.length === 0) {
    resumen.textContent = "Totales por categoría: aún no hay productos marcados.";
    return;
  }

  const parts = categorias.map(cat => cat + ": $" + totals[cat].toFixed(2));
  resumen.innerHTML = "<strong>Totales por categoría</strong>: " + parts.join(" &nbsp;•&nbsp; ");
}

function saveData() {
  const rows = document.querySelectorAll(".item-row");
  const itemsData = {};

  rows.forEach(row => {
    const id = row.dataset.id;
    const chk = row.querySelector(".chk-item");
    const precio = row.querySelector(".precio-item");
    const stock = row.querySelector(".stock-input");

    itemsData[id] = {
      checked: chk ? chk.checked : false,
      price: precio ? precio.value : "",
      stock: stock ? Number(stock.value || 0) : 0
    };
  });

  const fechaEl = document.getElementById("fecha");
  const fecha = fechaEl ? fechaEl.value : "";

  const payload = { fecha, items: itemsData };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function clearData() {
  if (!confirm("¿Borrar todo el checklist y precios guardados?")) return;
  localStorage.removeItem(STORAGE_KEY);
  buildTable();
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { fecha: "", items: {} };
    return JSON.parse(raw);
  } catch (e) {
    return { fecha: "", items: {} };
  }
}

function applySearchFilter() {
  const searchEl = document.getElementById("buscar");
  if (!searchEl) return;

  const q = searchEl.value.toLowerCase().trim();
  const tbody = document.getElementById("tablaItems");
  const catRows = tbody.querySelectorAll(".category-row");
  const itemRows = tbody.querySelectorAll(".item-row");

  if (q === "") {
    const collapsedState = loadCollapseState();
    catRows.forEach(cr => cr.style.display = "");
    itemRows.forEach(ir => {
      const cat = ir.dataset.category;
      const isCollapsed = !!collapsedState[cat];
      ir.style.display = isCollapsed ? "none" : "";
    });
    return;
  }

  const visibleCategories = {};
  itemRows.forEach(row => {
    const prod = (row.dataset.producto || "").toLowerCase();
    if (prod.includes(q)) {
      row.style.display = "";
      visibleCategories[row.dataset.category] = true;
    } else {
      row.style.display = "none";
    }
  });

  catRows.forEach(cr => {
    const cat = cr.dataset.category;
    cr.style.display = visibleCategories[cat] ? "" : "none";
  });
}

function exportPDF() {
  const fechaInput = document.getElementById("fecha");
  const fecha = fechaInput.value || new Date().toISOString().slice(0, 10);

  const rows = document.querySelectorAll(".item-row");
  const dataPorCategoria = {};
  const totalesPorCategoria = {};
  let totalGeneral = 0;

  rows.forEach(row => {
    const chk = row.querySelector(".chk-item");
    if (!chk.checked) return;

    const categoria = row.dataset.category;
    const producto = row.dataset.producto;
    const precioVal = parseFloat(row.querySelector(".precio-item").value.replace(",", ".") || "0") || 0;

    if (!dataPorCategoria[categoria]) dataPorCategoria[categoria] = [];
    dataPorCategoria[categoria].push({ producto, precio: precioVal });

    totalesPorCategoria[categoria] = (totalesPorCategoria[categoria] || 0) + precioVal;
    totalGeneral += precioVal;
  });

  if (Object.keys(dataPorCategoria).length === 0) {
    alert("No hay productos marcados para exportar.");
    return;
  }

  const lines = [];
  lines.push("MyMarket - Lista de compra");
  lines.push("Fecha: " + fecha);
  lines.push("");

  const maxProdLen = 28;

  function formatLinea(prod, precio) {
    let nombre = prod;
    if (nombre.length > maxProdLen) nombre = nombre.slice(0, maxProdLen - 1) + "…";
    const precioTxt = "$" + precio.toFixed(2);
    const totalWidth = 40;
    const dots = ".".repeat(Math.max(2, totalWidth - nombre.length - precioTxt.length));
    return nombre + " " + dots + " " + precioTxt;
  }

  Object.keys(dataPorCategoria).forEach(categoria => {
    const items = dataPorCategoria[categoria];
    if (!items || items.length === 0) return;

    lines.push(categoria.toUpperCase());
    lines.push("-".repeat(categoria.length));
    items.forEach(({ producto, precio }) => lines.push(formatLinea(producto, precio)));
    lines.push("Subtotal " + categoria + ": $" + totalesPorCategoria[categoria].toFixed(2));
    lines.push("");
  });

  lines.push("TOTAL GENERAL: $" + totalGeneral.toFixed(2));
  lines.push("");
  lines.push("Generado con MyMarket ✔");

  const printArea = document.getElementById("printArea");
  printArea.textContent = lines.join("\n");

  document.body.classList.add("print-mode");
  window.print();
  setTimeout(() => document.body.classList.remove("print-mode"), 500);
}

document.addEventListener("DOMContentLoaded", () => {
  injectCompactTableCSS();
  applyThemeFromStorage();

  if (window.Audio) clickSound = new Audio("click.wav");

  document.getElementById("btnDark").addEventListener("click", toggleTheme);
  document.getElementById("btnGuardar").addEventListener("click", saveData);
  document.getElementById("btnLimpiar").addEventListener("click", clearData);
  document.getElementById("btnPDF").addEventListener("click", exportPDF);

  const btnFav = document.getElementById("btnFavoritos");
  btnFav.addEventListener("click", () => {
    modoFavoritos = !modoFavoritos;
    btnFav.classList.toggle("activo", modoFavoritos);
    buildTable();
  });

  document.getElementById("buscar").addEventListener("input", applySearchFilter);

  buildTable();

  const splash = document.getElementById("splash");
  setTimeout(() => {
    splash.classList.add("hidden");
    setTimeout(() => { splash.style.display = "none"; }, 400);
  }, 800);
});

// Service Worker DESACTIVADO TEMPORALMENTE

function hapticTap() {
  if ("vibrate" in navigator) navigator.vibrate(18);
}

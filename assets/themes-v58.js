"use strict";
/* TecnologíaInsti V58 · 18 temas públicos, seleccionados en GitHub desde el administrador.
   No se guardan tokens en esta configuración ni se altera ningún CMS anterior. */
(() => {
  const themes = [
  {
    "id": "original",
    "number": 1,
    "name": "TecnologíaInsti original",
    "description": "Azul noche · Turquesa · Melocotón",
    "nav": "#152749",
    "accent": "#43DFC3",
    "extra": "#FFDCAF",
    "page": "#F4F7F9",
    "navInk": "#FFFFFF",
    "navSub": "#D7E7F3",
    "onAccent": "#152749"
  },
  {
    "id": "ocean",
    "number": 2,
    "name": "Océano STEAM",
    "description": "Petróleo · Menta · Dorado",
    "nav": "#103E50",
    "accent": "#64E3C1",
    "extra": "#F4BA60",
    "page": "#F1FAF7",
    "navInk": "#FFFFFF",
    "navSub": "#DBF3EF",
    "onAccent": "#12343B"
  },
  {
    "id": "innovation",
    "number": 3,
    "name": "Innovación creativa",
    "description": "Índigo · Lavanda · Naranja",
    "nav": "#29285C",
    "accent": "#B5B0FF",
    "extra": "#FF9B78",
    "page": "#F5F3FF",
    "navInk": "#FFFFFF",
    "navSub": "#E2E0FA",
    "onAccent": "#24204D"
  },
  {
    "id": "tech",
    "number": 4,
    "name": "Tech moderno",
    "description": "Grafito · Cian · Lima",
    "nav": "#182430",
    "accent": "#42D6E9",
    "extra": "#C9E97F",
    "page": "#F0F5F5",
    "navInk": "#FFFFFF",
    "navSub": "#DBE6EB",
    "onAccent": "#14252B"
  },
  {
    "id": "editorial",
    "number": 5,
    "name": "Editorial claro",
    "description": "Blanco hielo · Azul · Ámbar",
    "nav": "#F4F8FD",
    "accent": "#225FA9",
    "extra": "#EFB855",
    "page": "#EAF1F8",
    "navInk": "#132F50",
    "navSub": "#42617F",
    "onAccent": "#FFFFFF"
  },
  {
    "id": "lab",
    "number": 6,
    "name": "Laboratorio creativo",
    "description": "Azul profundo · Coral · Aqua",
    "nav": "#233A4C",
    "accent": "#FFAB8C",
    "extra": "#55DCCF",
    "page": "#FBF5F0",
    "navInk": "#FFFFFF",
    "navSub": "#DFEBED",
    "onAccent": "#392B2C"
  },
  {
    "id": "electric",
    "number": 7,
    "name": "Azul eléctrico",
    "description": "Azul intenso · Celeste · Naranja",
    "nav": "#102A58",
    "accent": "#56B8FF",
    "extra": "#FFB46A",
    "page": "#EEF5FD",
    "navInk": "#FFFFFF",
    "navSub": "#D7E5F6",
    "onAccent": "#102A58"
  },
  {
    "id": "cobalt",
    "number": 8,
    "name": "Cobalto y naranja",
    "description": "Cobalto · Naranja · Turquesa",
    "nav": "#163B91",
    "accent": "#FFAA56",
    "extra": "#64E1DE",
    "page": "#F2F6FE",
    "navInk": "#FFFFFF",
    "navSub": "#E1E9FF",
    "onAccent": "#1A315C"
  },
  {
    "id": "green",
    "number": 9,
    "name": "Verde digital",
    "description": "Verde bosque · Menta · Ámbar",
    "nav": "#123F3B",
    "accent": "#75E0AD",
    "extra": "#FFC37B",
    "page": "#EDF8F2",
    "navInk": "#FFFFFF",
    "navSub": "#D9F0E6",
    "onAccent": "#123C31"
  },
  {
    "id": "violet",
    "number": 10,
    "name": "Violeta futurista",
    "description": "Violeta · Lavanda · Cian",
    "nav": "#211747",
    "accent": "#CC9DFF",
    "extra": "#5DE1EB",
    "page": "#F5F0FF",
    "navInk": "#FFFFFF",
    "navSub": "#E9DEFF",
    "onAccent": "#291846"
  },
  {
    "id": "med",
    "number": 11,
    "name": "Azul mediterráneo",
    "description": "Azul marino · Aqua · Arena",
    "nav": "#12618B",
    "accent": "#7DE8E4",
    "extra": "#FFE0A3",
    "page": "#EFFAFF",
    "navInk": "#FFFFFF",
    "navSub": "#DEF2FB",
    "onAccent": "#134057"
  },
  {
    "id": "forest",
    "number": 12,
    "name": "Bosque tecnológico",
    "description": "Verde pizarra · Lima · Melocotón",
    "nav": "#203A36",
    "accent": "#B8DB83",
    "extra": "#EDAC80",
    "page": "#F3F6EC",
    "navInk": "#FFFFFF",
    "navSub": "#DBE8DE",
    "onAccent": "#243E35"
  },
  {
    "id": "burgundy",
    "number": 13,
    "name": "Burdeos académico",
    "description": "Burdeos · Crema · Agua",
    "nav": "#512B42",
    "accent": "#FFD0A8",
    "extra": "#A9D6D2",
    "page": "#FBF3F4",
    "navInk": "#FFFFFF",
    "navSub": "#F0DDE7",
    "onAccent": "#49243B"
  },
  {
    "id": "sunrise",
    "number": 14,
    "name": "Amanecer creativo",
    "description": "Ciruela · Vainilla · Rosa",
    "nav": "#423B73",
    "accent": "#FFCF91",
    "extra": "#FF8195",
    "page": "#FFF8F3",
    "navInk": "#FFFFFF",
    "navSub": "#EDE6FF",
    "onAccent": "#382950"
  },
  {
    "id": "graphite",
    "number": 15,
    "name": "Grafito y coral",
    "description": "Grafito · Coral · Aqua",
    "nav": "#252F3E",
    "accent": "#FF9581",
    "extra": "#89DDDA",
    "page": "#F4F5F7",
    "navInk": "#FFFFFF",
    "navSub": "#E1E6EF",
    "onAccent": "#273142"
  },
  {
    "id": "cream",
    "number": 16,
    "name": "Crema y azul tinta",
    "description": "Crema · Azul tinta · Coral",
    "nav": "#FFF8EB",
    "accent": "#194F92",
    "extra": "#EA8768",
    "page": "#F4EFE4",
    "navInk": "#182F4E",
    "navSub": "#52667D",
    "onAccent": "#FFFFFF"
  },
  {
    "id": "sky",
    "number": 17,
    "name": "Cielo tecnológico",
    "description": "Celeste · Azul · Melocotón",
    "nav": "#E6F4FA",
    "accent": "#1769A4",
    "extra": "#E99C6B",
    "page": "#F7FBFD",
    "navInk": "#12334D",
    "navSub": "#4B6B80",
    "onAccent": "#FFFFFF"
  },
  {
    "id": "night",
    "number": 18,
    "name": "Azul noche y oro",
    "description": "Azul noche · Oro · Aqua",
    "nav": "#111E37",
    "accent": "#F3C66E",
    "extra": "#72D2D4",
    "page": "#F4F5F8",
    "navInk": "#FFFFFF",
    "navSub": "#D7DEEA",
    "onAccent": "#202B3A"
  }
];
  const byId = new Map(themes.map(t => [t.id,t]));
  const original = themes[0];
  const safe = id => byId.get(id) || original;
  const isAdmin = /\/admin\/?(?:index\.html)?$/i.test(location.pathname);
  let current = original.id;
  function apply(id) {
    const theme = safe(id), root = document.documentElement;
    current = theme.id;
    if(theme.id === "original") {
      root.removeAttribute("data-ti-theme-active");
      root.dataset.tiTheme = "original";
      for (const v of ["--ti-nav", "--ti-accent", "--ti-extra", "--ti-page", "--ti-nav-ink", "--ti-nav-sub", "--ti-on-accent"]) root.style.removeProperty(v);
    } else {
      root.dataset.tiTheme = theme.id;
      root.dataset.tiThemeActive = "1";
      for(const [variable,value] of Object.entries({
        "--ti-nav":theme.nav,"--ti-accent":theme.accent,"--ti-extra":theme.extra,"--ti-page":theme.page,
        "--ti-nav-ink":theme.navInk,"--ti-nav-sub":theme.navSub,"--ti-on-accent":theme.onAccent
      })) root.style.setProperty(variable,value);
    }
    window.dispatchEvent(new CustomEvent("ti-theme-change",{detail:{id:current}}));
    return theme;
  }
  function parseDocument(doc) {
    return doc && typeof doc === "object" && typeof doc.themeId === "string" ? safe(doc.themeId).id : "original";
  }
  async function loadPublic() {
    try {
      const response = await fetch("./assets/cms-theme.json",{cache:"no-store"});
      if(!response.ok) { apply("original"); return original; }
      return apply(parseDocument(await response.json()));
    } catch(err) {
      console.warn("TecnologíaInsti: tema original disponible; no se pudo cargar el tema personalizado.",err);
      return apply("original");
    }
  }
  window.TI_THEMES = {list:themes,original:original.id,resolve:safe,apply,parseDocument,get selected(){return current},ready:Promise.resolve(original)};
  if (!isAdmin) window.TI_THEMES.ready = loadPublic();
})();
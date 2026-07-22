// Shared flavor taxonomy + canvas wheel renderer used by both the main app
// (src/pages/index.jsx) and the public profile page (src/pages/u/index.js).
// NOTE: the interactive <FlavorWheel> React component is intentionally NOT shared -
// the two pages need different touch behaviour (main app: scroll-friendly wheel;
// profile: pinch-zoom/pan), so each keeps its own component.

// Resolve a flavor mapping's top-level category and display label from either the
// current schema (m.path array) or the legacy schema (m.top/m.mid/m.specific).
// Used by every flavor-chip render site so the two shapes can never render blank.
export function flavorTopKey(m) {
  if (!m) return undefined;
  return m.path && m.path.length ? m.path[0] : m.top;
}
export function flavorLabel(m) {
  if (!m) return "";
  if (m.path && m.path.length) return m.path[m.path.length - 1];
  return m.specific || m.mid || m.top || "";
}

export const FLAVOR_TAXONOMY = {
  Fruity: {
    color: "#e8784a",
    children: {
      Berry: {
        color: "#d94f6e",
        children: {
          Blackberry: { color: "#7b2d8b", children: { "Wild Blackberry": { color: "#6a2070" }, "Jam-like": { color: "#8b3a9e" }, "Bramble": { color: "#5c1a6a" } } },
          Raspberry: { color: "#e8365d", children: { "Fresh Raspberry": { color: "#f04070" }, "Raspberry Jam": { color: "#c0254a" }, "Tart Berry": { color: "#d43060" } } },
          Blueberry: { color: "#4a6ee0", children: { "Fresh Blueberry": { color: "#5578f0" }, "Blueberry Compote": { color: "#3a5cc0" }, "Dark Berry": { color: "#2a4aa0" } } },
          Strawberry: { color: "#f0504a", children: { "Fresh Strawberry": { color: "#f86060" }, "Strawberry Jam": { color: "#d83838" }, "Candied Berry": { color: "#f07070" } } },
          Cranberry: { color: "#c0304a", children: { "Tart Cranberry": { color: "#d83858" }, "Dried Cranberry": { color: "#a02838" } } },
        }
      },
      "Stone Fruit": {
        color: "#f0803a",
        children: {
          Peach: { color: "#f0a060", children: { "White Peach": { color: "#f8c090" }, "Yellow Peach": { color: "#f0a850" }, "Peach Nectar": { color: "#e89040" }, "Dried Peach": { color: "#c87030" } } },
          Apricot: { color: "#e88030", children: { "Fresh Apricot": { color: "#f09040" }, "Dried Apricot": { color: "#c86820" }, "Apricot Jam": { color: "#d87828" } } },
          Plum: { color: "#a04080", children: { "Red Plum": { color: "#c05080" }, "Black Plum": { color: "#703060" }, "Plum Wine": { color: "#904070" } } },
          Cherry: { color: "#d03050", children: { "Red Cherry": { color: "#e84060" }, "Dark Cherry": { color: "#a02040" }, "Maraschino": { color: "#f05070" }, "Cherry Blossom": { color: "#f080a0" } } },
          Nectarine: { color: "#f09050", children: { "Fresh Nectarine": { color: "#f8a060" }, "Nectarine Skin": { color: "#e08040" } } },
        }
      },
      Citrus: {
        color: "#f0c030",
        children: {
          Lemon: { color: "#f0e040", children: { "Lemon Zest": { color: "#f8e850" }, "Lemon Curd": { color: "#e8d030" }, "Lemon Verbena": { color: "#d8e860" } } },
          Lime: { color: "#78c840", children: { "Lime Zest": { color: "#88d850" }, "Lime Juice": { color: "#68b830" }, "Key Lime": { color: "#90d860" } } },
          Orange: { color: "#f08020", children: { "Blood Orange": { color: "#e05030" }, "Navel Orange": { color: "#f09030" }, "Orange Zest": { color: "#f0a040" }, "Mandarin": { color: "#f0b030" } } },
          Grapefruit: { color: "#f0c050", children: { "Pink Grapefruit": { color: "#f0a080" }, "Grapefruit Pith": { color: "#e8d070" } } },
          Bergamot: { color: "#a8d860", children: { "Earl Grey": { color: "#90c050" }, "Floral Citrus": { color: "#c0e070" } } },
        }
      },
      Tropical: {
        color: "#e8a020",
        children: {
          Mango: { color: "#f0b030", children: { "Ripe Mango": { color: "#f8c040" }, "Green Mango": { color: "#98c840" }, "Mango Skin": { color: "#d8a020" } } },
          Pineapple: { color: "#f0d040", children: { "Fresh Pineapple": { color: "#f8e050" }, "Pineapple Juice": { color: "#e8c830" } } },
          "Passion Fruit": { color: "#d87030", children: { "Tart Passion Fruit": { color: "#e88040" }, "Passion Fruit Pulp": { color: "#c86020" } } },
          Papaya: { color: "#f09060", children: { "Ripe Papaya": { color: "#f8a070" }, "Green Papaya": { color: "#98c060" } } },
          Guava: { color: "#f0a080", children: { "Pink Guava": { color: "#f8b090" }, "White Guava": { color: "#e8d0a0" } } },
          Lychee: { color: "#f8c0d0", children: { "Fresh Lychee": { color: "#f8d0e0" }, "Floral Lychee": { color: "#e8a0c0" } } },
        }
      },
      "Dried Fruit": {
        color: "#b06030",
        children: {
          Raisin: { color: "#804828", children: { "Golden Raisin": { color: "#c09040" }, "Dark Raisin": { color: "#603820" } } },
          Prune: { color: "#703060", children: { "Dried Plum": { color: "#804070" }, "Prune Juice": { color: "#602858" } } },
          Date: { color: "#a07030", children: { "Medjool Date": { color: "#b08040" }, "Date Syrup": { color: "#906020" } } },
          Fig: { color: "#906868", children: { "Dried Fig": { color: "#a07878" }, "Fig Jam": { color: "#804848" } } },
        }
      },
    }
  },
  Sweet: {
    color: "#d4a030",
    children: {
      Caramel: {
        color: "#c88020",
        children: {
          Caramel: { color: "#d49030", children: { "Soft Caramel": { color: "#e0a040" }, "Burnt Caramel": { color: "#a05018" }, "Salted Caramel": { color: "#c89040" } } },
          Butterscotch: { color: "#e0b050", children: { "Buttery Toffee": { color: "#e8c060" }, "Scotch Candy": { color: "#c89030" } } },
          Toffee: { color: "#b07020", children: { "English Toffee": { color: "#c08030" }, "Nut Toffee": { color: "#a06018" } } },
          "Brown Sugar": { color: "#c07828", children: { "Muscovado": { color: "#a06020" }, "Demerara": { color: "#d08830" }, "Molasses Sugar": { color: "#804010" } } },
        }
      },
      Chocolate: {
        color: "#7a4020",
        children: {
          "Dark Chocolate": { color: "#5a2810", children: { "Bittersweet": { color: "#4a2008" }, "70% Cacao": { color: "#6a3018" }, "Cacao Nib": { color: "#7a3820" } } },
          "Milk Chocolate": { color: "#a06030", children: { "Creamy Chocolate": { color: "#b07040" }, "Cocoa Powder": { color: "#806020" } } },
          Mocha: { color: "#8a5030", children: { "Coffee Chocolate": { color: "#9a6040" }, "Espresso Chocolate": { color: "#7a4020" } } },
        }
      },
      Vanilla: {
        color: "#e8d090",
        children: {
          Vanilla: { color: "#f0d8a0", children: { "Vanilla Bean": { color: "#f8e0b0" }, "Vanilla Extract": { color: "#e0c880" }, "Vanilla Cream": { color: "#f0e0b8" } } },
          Custard: { color: "#e8c878", children: { "Egg Custard": { color: "#f0d088" }, "Creme Brulee": { color: "#e0b860" } } },
          Cream: { color: "#f0e8c8", children: { "Heavy Cream": { color: "#f8f0d8" }, "Whipped Cream": { color: "#f8f4e0" } } },
        }
      },
      Honey: {
        color: "#e8a820",
        children: {
          Honey: { color: "#f0b030", children: { "Wildflower Honey": { color: "#f8c040" }, "Clover Honey": { color: "#f0c850" }, "Raw Honey": { color: "#e0a020" } } },
          Maple: { color: "#c07820", children: { "Maple Syrup": { color: "#d08830" }, "Dark Maple": { color: "#a06010" } } },
          Molasses: { color: "#603010", children: { "Blackstrap": { color: "#502008" }, "Light Molasses": { color: "#784018" } } },
        }
      },
    }
  },
  Nutty: {
    color: "#b08040",
    children: {
      "Tree Nut": {
        color: "#c09050",
        children: {
          Almond: { color: "#d0a060", children: { "Raw Almond": { color: "#e0b878" }, "Roasted Almond": { color: "#b08040" }, "Marzipan": { color: "#e8c888" } } },
          Hazelnut: { color: "#b07830", children: { "Roasted Hazelnut": { color: "#c08838" }, "Hazelnut Praline": { color: "#d09848" } } },
          Walnut: { color: "#906028", children: { "Walnut Skin": { color: "#784820" }, "Toasted Walnut": { color: "#a07030" } } },
          Pecan: { color: "#a07030", children: { "Candied Pecan": { color: "#c08840" }, "Pecan Pie": { color: "#b07828" } } },
          Cashew: { color: "#d0b070", children: { "Buttery Cashew": { color: "#e0c080" }, "Cashew Cream": { color: "#e8c888" } } },
        }
      },
      Roasted: {
        color: "#806030",
        children: {
          Peanut: { color: "#b08040", children: { "Roasted Peanut": { color: "#c09050" }, "Peanut Butter": { color: "#c8a058" } } },
          Sesame: { color: "#d0b060", children: { "Toasted Sesame": { color: "#e0c070" }, "Tahini": { color: "#d0b868" } } },
          Grain: { color: "#c0a050", children: { "Toasted Grain": { color: "#d0b060" }, "Malted Barley": { color: "#b09040" }, "Biscuit": { color: "#e0c888" } } },
        }
      },
    }
  },
  Floral: {
    color: "#c080d0",
    children: {
      Jasmine: { color: "#e8d8f0", children: { "White Jasmine": { color: "#f0e8f8" }, "Jasmine Tea": { color: "#d8c8e8" } } },
      Rose: { color: "#f080a0", children: { "Rose Water": { color: "#f8a0b8" }, "Rose Hip": { color: "#e06880" }, "Dried Rose": { color: "#c85878" } } },
      Lavender: { color: "#9878c8", children: { "Fresh Lavender": { color: "#a888d8" }, "Dried Lavender": { color: "#8868b8" } } },
      Hibiscus: { color: "#d04080", children: { "Dried Hibiscus": { color: "#c03070" }, "Hibiscus Tea": { color: "#e05090" } } },
      Violet: { color: "#7848a8", children: { "Violet Candy": { color: "#9060c0" }, "Fresh Violet": { color: "#6840a0" } } },
      Elderflower: { color: "#d8e8a0", children: { "Elderflower Cordial": { color: "#e8f0b0" }, "Fresh Elderflower": { color: "#c8d888" } } },
      Chamomile: { color: "#e0d078", children: { "Chamomile Tea": { color: "#e8d888" }, "Dried Chamomile": { color: "#d0c060" } } },
      Mint: { color: "#50c880", children: { "Peppermint": { color: "#40d870" }, "Spearmint": { color: "#60c890" }, "Fresh Mint": { color: "#70e0a0" } } },
    }
  },
  Spicy: {
    color: "#d05848",
    children: {
      "Warm Spice": {
        color: "#c84828",
        children: {
          Cinnamon: { color: "#c06030", children: { "Ceylon Cinnamon": { color: "#d07040" }, "Cassia": { color: "#b05020" }, "Cinnamon Toast": { color: "#e09060" } } },
          Clove: { color: "#703018", children: { "Whole Clove": { color: "#602810" }, "Clove Oil": { color: "#804020" } } },
          Nutmeg: { color: "#b07840", children: { "Freshly Grated": { color: "#c08850" }, "Nutmeg Mace": { color: "#a06830" } } },
          Cardamom: { color: "#88a840", children: { "Green Cardamom": { color: "#98b850" }, "Black Cardamom": { color: "#607828" } } },
          Anise: { color: "#7888c0", children: { "Star Anise": { color: "#8898d0" }, "Fennel": { color: "#90a8c0" }, "Licorice": { color: "#484878" } } },
        }
      },
      Pepper: {
        color: "#505050",
        children: {
          "Black Pepper": { color: "#383838", children: { "Cracked Pepper": { color: "#282828" }, "White Pepper": { color: "#909090" } } },
          Chili: { color: "#c03020", children: { "Mild Chili": { color: "#d04030" }, "Chipotle": { color: "#903018" } } },
        }
      },
    }
  },
  Earthy: {
    color: "#80a060",
    children: {
      Soil: { color: "#807060", children: { "Forest Floor": { color: "#706050" }, "Wet Earth": { color: "#907870" }, "Clay": { color: "#b09080" } } },
      Mushroom: { color: "#a09070", children: { "Dried Mushroom": { color: "#908060" }, "Truffle": { color: "#605048" }, "Porcini": { color: "#a89878" } } },
      Cedar: { color: "#a08060", children: { "Cedar Wood": { color: "#b09070" }, "Fresh Cedar": { color: "#90a060" } } },
      Tobacco: { color: "#907050", children: { "Pipe Tobacco": { color: "#a08060" }, "Aged Tobacco": { color: "#786040" } } },
      Smoke: { color: "#606060", children: { "Campfire": { color: "#504040" }, "Peaty": { color: "#708070" }, "Charcoal": { color: "#383838" } } },
      Leather: { color: "#907060", children: { "Aged Leather": { color: "#806050" }, "Suede": { color: "#b09080" } } },
      Grain: { color: "#c0b080", children: { "Wheat": { color: "#d0c090" }, "Oat": { color: "#c8b878" }, "Rye": { color: "#a89060" } } },
    }
  },
  Acidic: {
    color: "#60a8c0",
    children: {
      Crisp: { color: "#a8d888", children: { "Green Apple": { color: "#88c860" }, "Granny Smith": { color: "#78b850" }, "Snappy": { color: "#a0d870" } } },
      Tangy: { color: "#e8a040", children: { "Tart Cherry": { color: "#d05060" }, "Sour Plum": { color: "#c06878" } } },
      Juicy: { color: "#60c898", children: { "Mouth-watering": { color: "#50d888" }, "Lively": { color: "#78d8a8" } } },
      "Wine-like": { color: "#a05068", children: { "Red Wine": { color: "#803048" }, "White Wine": { color: "#d0b878" }, "Pinot Noir": { color: "#904060" } } },
      Kombucha: { color: "#90a858", children: { "Funky Kombucha": { color: "#a0b860" }, "Light Ferment": { color: "#b8c878" } } },
      Vinegar: { color: "#c0a060", children: { "Apple Cider Vinegar": { color: "#d0b070" }, "Balsamic": { color: "#503018" } } },
    }
  },
};

export function drawFlavorWheel(ctx, cx, cy, mappings, accent, dark) {
  const r0 = 34, r1 = 93, r2 = 149, r3 = 205;
  const bg = dark ? "#0a0a0a" : "#f5ead0";

  const topGroups = {};
  for (const m of mappings) {
    const top = m.path ? m.path[0] : m.top;
    const mid = m.path ? m.path[1] : m.mid;
    const specific = m.path ? m.path[m.path.length - 1] : m.specific;
    if (!top) continue;
    if (!topGroups[top]) topGroups[top] = { weight: 0, mids: {} };
    topGroups[top].weight += (m.weight || 1);
    if (mid && mid !== top) {
      if (!topGroups[top].mids[mid]) topGroups[top].mids[mid] = { weight: 0, specifics: {} };
      topGroups[top].mids[mid].weight += (m.weight || 1);
      if (specific && specific !== mid)
        topGroups[top].mids[mid].specifics[specific] = (topGroups[top].mids[mid].specifics[specific] || 0) + (m.weight || 1);
    }
  }

  const totalW = Object.values(topGroups).reduce((s, g) => s + g.weight, 0);
  const hexAlpha = (hex, a) => {
    const n = parseInt(hex.replace("#",""), 16);
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
  };
  const drawArc = (r1i, r2i, a1, a2, fill) => {
    const G = (a2-a1) > 0.1 ? 0.012 : 0;
    ctx.beginPath();
    ctx.arc(cx, cy, r2i, a1+G, a2-G);
    ctx.arc(cx, cy, r1i, a2-G, a1+G, true);
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = bg; ctx.lineWidth = 1.2; ctx.stroke();
  };

  // Draw arc label with shadow halo for readability
  const arcLabel = (text, r, midAngle, fontSize, ringSpan) => {
    if (!text || text.length === 0) return;
    // Only draw if arc is wide enough
    const arcLen = ringSpan * r;
    const textLen = text.length * fontSize * 0.62;
    if (arcLen < textLen * 1.1) return;

    const label = text.length > 14 ? text.slice(0, 13) + "…" : text;
    const charAngle = (fontSize * 0.65) / r;
    const totalAngle = charAngle * label.length;
    let startAngle = midAngle - totalAngle / 2;

    ctx.save();
    ctx.font = `600 ${fontSize}px Jost, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < label.length; i++) {
      const a = startAngle + charAngle * i + charAngle / 2;
      const lx = cx + r * Math.cos(a);
      const ly = cy + r * Math.sin(a);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(a + Math.PI / 2);
      // Shadow halo
      ctx.shadowColor = dark ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)";
      ctx.shadowBlur = 4;
      ctx.fillStyle = dark ? "#fff" : "#111";
      ctx.fillText(label[i], 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    ctx.restore();
  };

  let angle = -Math.PI / 2;
  for (const [topName, topData] of Object.entries(topGroups)) {
    const color = FLAVOR_TAXONOMY[topName]?.color || "#888";
    const span = (topData.weight / totalW) * 2 * Math.PI;
    const topEnd = angle + span;

    drawArc(r0, r1, angle, topEnd, color);
    arcLabel(topName, (r0 + r1) / 2, angle + span / 2, 11, span);

    let midA = angle;
    for (const [midName, midData] of Object.entries(topData.mids)) {
      const mSpan = (midData.weight / topData.weight) * span;
      const midEnd = midA + mSpan;
      drawArc(r1, r2, midA, midEnd, hexAlpha(color, 0.72));
      arcLabel(midName, (r1 + r2) / 2, midA + mSpan / 2, 10, mSpan);

      let specA = midA;
      for (const [specName, specW] of Object.entries(midData.specifics)) {
        const sSpan = (specW / midData.weight) * mSpan;
        drawArc(r2, r3, specA, specA + sSpan, hexAlpha(color, 0.45));
        arcLabel(specName, (r2 + r3) / 2, specA + sSpan / 2, 10, sSpan);
        specA += sSpan;
      }
      if (Object.keys(midData.specifics).length === 0) drawArc(r2, r3, midA, midEnd, hexAlpha(color, 0.32));
      midA = midEnd;
    }
    if (Object.keys(topData.mids).length === 0) {
      drawArc(r1, r2, angle, topEnd, hexAlpha(color, 0.6));
      drawArc(r2, r3, angle, topEnd, hexAlpha(color, 0.32));
    }
    angle = topEnd;
  }

  // Center circle
  ctx.beginPath(); ctx.arc(cx, cy, r0, 0, Math.PI * 2);
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = accent + "66"; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.font = "600 8px Jost, Arial"; ctx.fillStyle = accent;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("FLAVOR", cx, cy - 5);
  ctx.fillText("WHEEL", cx, cy + 6);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
}

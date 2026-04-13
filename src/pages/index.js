import { supabase } from '../lib/supabase'
import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";

const ThemeContext = createContext("system");

function useThemeColor(color) {
  const theme = useContext(ThemeContext);
  const isLight = theme === "light" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches);
  if (!isLight || !color) return color;
  // Darken the color for light mode by reducing brightness
  const hex = color.replace("#", "");
  if (hex.length !== 6) return color;
  const r = Math.round(parseInt(hex.slice(0,2),16) * 0.55);
  const g = Math.round(parseInt(hex.slice(2,4),16) * 0.55);
  const b = Math.round(parseInt(hex.slice(4,6),16) * 0.55);
  return `rgb(${r},${g},${b})`;
}

// --- Flavor Taxonomy (deep tree with per-node colors) ------------------------
const FLAVOR_TAXONOMY = {
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

// --- Brew Method Configs ----------------------------------------------------
const BREW_CONFIGS = {
  "Pour Over / V60": {
    icon: "▽",
    defaultRatio: 16,
    ratioMin: 13,
    ratioMax: 18,
    defaultDose: 20,
    tempC: 93,
    tempF: 200,
    grindSize: "Medium-Fine",
    grindDesc: "Smooth but with texture, finer than drip, coarser than espresso. If the drawdown is too fast, go finer. Too slow, go coarser.",
    bloomTime: "30-45s",
    brewTime: "2:30-3:30",
    cupVolume: 250,
    notes: "Bloom with 2× coffee weight in water first. Pour in slow, steady spirals.",
    params: ["dose", "water", "cups", "ratio", "temp"],
    timerStages: [
      { name: "Bloom", duration: 45, instruction: "Pour 2× coffee weight in water. Let it bloom." },
      { name: "Pour 1", duration: 40, instruction: "Pour in slow spirals to ~50% of total water." },
      { name: "Pour 2", duration: 40, instruction: "Continue pouring in circles to ~80% of total water." },
      { name: "Pour 3", duration: 45, instruction: "Final pour to full water weight. Let it drain." },
      { name: "Done", duration: 0, instruction: "Drawdown complete. Enjoy." },
    ],
  },
  Chemex: {
    icon: "⌗",
    defaultRatio: 15,
    ratioMin: 13,
    ratioMax: 17,
    defaultDose: 42,
    tempC: 94,
    tempF: 201,
    grindSize: "Medium-Coarse",
    grindDesc: "One step coarser than V60. The Chemex filter is much thicker and slows drainage significantly, so a finer grind will choke it and over-extract.",
    bloomTime: "45s",
    brewTime: "4:00-5:00",
    cupVolume: 300,
    notes: "Chemex filters are thicker so use a coarser grind than V60. Pre-rinse the filter.",
    params: ["dose", "water", "cups", "ratio", "temp"],
    timerStages: [
      { name: "Bloom", duration: 45, instruction: "Pour 2× coffee weight in water. Let it bloom fully." },
      { name: "Pour 1", duration: 60, instruction: "Pour slowly to ~60% of total water." },
      { name: "Pour 2", duration: 60, instruction: "Final pour to full water weight." },
      { name: "Drawdown", duration: 75, instruction: "Let it drain completely through the filter." },
      { name: "Done", duration: 0, instruction: "Remove filter. Serve immediately." },
    ],
  },
  Espresso: {
    icon: "◉",
    defaultRatio: 2,
    ratioMin: 1.5,
    ratioMax: 3,
    defaultDose: 18,
    tempC: 93,
    tempF: 200,
    grindSize: "Fine",
    grindDesc: "Dense and fine. The grind is your main dial-in tool. Finer = slower shot, more body. Coarser = faster shot, lighter. Adjust in small increments.",
    brewTime: "25-30s",
    cupVolume: null,
    notes: "Target 25-30s extraction. Adjust grind finer if under-extracted (sour), coarser if over-extracted (bitter).",
    params: ["dose", "yield", "ratio", "temp"],
    yieldLabel: "Yield (g out)",
    isEspresso: true,
    timerTarget: { min: 25, max: 30 },
  },
  "Cold Brew": {
    icon: "❄",
    defaultRatio: 5,
    ratioMin: 4,
    ratioMax: 8,
    defaultDose: 100,
    tempC: null,
    tempF: null,
    grindSize: "Coarse",
    grindDesc: "Very coarse. The long steep does the work, so you need an open grind to avoid over-extraction. Finer than French Press will make it bitter.",
    steepHours: "12-24",
    cupVolume: 250,
    notes: "Cold or room temp water only. Steep 12-16h for concentrate, 18-24h for a fuller extraction.",
    params: ["dose", "water", "cups", "ratio"],
    isColdBrew: true,
  },
  "French Press": {
    icon: "⊟",
    defaultRatio: 15,
    ratioMin: 12,
    ratioMax: 18,
    defaultDose: 30,
    tempC: 94,
    tempF: 201,
    grindSize: "Coarse",
    grindDesc: "Coarse and consistent. Too fine and grounds slip through the mesh filter, making the cup muddy and bitter. Err on the coarser side.",
    brewTime: "4:00",
    cupVolume: 300,
    notes: "Plunge slowly and steadily to prevent sediment. Pour immediately after pressing.",
    params: ["dose", "water", "cups", "ratio", "temp"],
    timerStages: [
      { name: "Bloom", duration: 30, instruction: "Pour a small amount of hot water to wet the grounds. Stir gently." },
      { name: "Fill & Steep", duration: 210, instruction: "Pour remaining water. Place lid on (don't plunge). Let it steep." },
      { name: "Plunge", duration: 30, instruction: "Press the plunger down slowly and steadily. Take your time." },
      { name: "Done", duration: 0, instruction: "Pour immediately. Leaving it in the press will over-extract." },
    ],
  },
  AeroPress: {
    icon: "⦾",
    defaultRatio: 12,
    ratioMin: 8,
    ratioMax: 16,
    defaultDose: 17,
    tempC: 85,
    tempF: 185,
    grindSize: "Medium-Fine",
    grindDesc: "Medium-fine is a good starting point, but AeroPress is forgiving. Go coarser for a longer, gentler steep. Go finer for a shorter, more concentrated brew.",
    brewTime: "1:30-2:00",
    cupVolume: 200,
    notes: "Uses lower water temperature than most methods, which reduces bitterness. Works both standard and inverted.",
    params: ["dose", "water", "cups", "ratio", "temp"],
    timerStages: [
      { name: "Bloom", duration: 30, instruction: "Add grounds, pour 2× weight in water. Stir and let bloom." },
      { name: "Fill", duration: 30, instruction: "Pour remaining water to target. Stir once more." },
      { name: "Steep", duration: 60, instruction: "Place plunger gently on top to create a seal. Let it steep." },
      { name: "Press", duration: 30, instruction: "Press slowly and steadily, about 20-30 seconds. Stop at the hiss." },
      { name: "Done", duration: 0, instruction: "Dilute to taste if needed. Rinse the AeroPress immediately." },
    ],
  },
  "Moka Pot": {
    icon: "⬡",
    defaultRatio: 7,
    ratioMin: 6,
    ratioMax: 9,
    defaultDose: 20,
    tempC: null,
    tempF: null,
    grindSize: "Fine",
    grindDesc: "Fine but not espresso-fine. If you grind too fine it'll clog the filter plate and cause dangerous pressure buildup. A notch coarser than espresso is the sweet spot.",
    brewTime: "4:00-5:00",
    cupVolume: 60,
    notes: "Use pre-boiled water in the bottom chamber to avoid scorching. Medium-low heat only.",
    params: ["dose", "water", "cups", "ratio"],
    isMokaPot: true,
    timerStages: [
      { name: "Heat Up", duration: 120, instruction: "Place on medium-low heat with lid open. Watch for coffee to start rising." },
      { name: "Extract", duration: 90, instruction: "Coffee is flowing. Keep the heat steady and resist the urge to rush it." },
      { name: "Finish", duration: 30, instruction: "Listen for a gurgling or hissing sound and remove from heat immediately." },
      { name: "Done", duration: 0, instruction: "Run the base under cold water to stop extraction. Serve right away." },
    ],
  },
  "Drip Machine": {
    icon: "⊡",
    defaultRatio: 17,
    ratioMin: 14,
    ratioMax: 20,
    defaultDose: 60,
    tempC: 93,
    tempF: 200,
    grindSize: "Medium",
    grindDesc: "Medium and consistent. Drip machines are calibrated for this grind size, so going finer makes it bitter, coarser makes it weak and flat.",
    brewTime: "5:00-8:00",
    cupVolume: 237,
    notes: "Use filtered water and keep your machine clean. A clean machine is the single biggest upgrade for drip coffee.",
    params: ["dose", "water", "cups", "ratio", "temp"],
    isDrip: true,
    timerStages: [
      { name: "Brew", duration: 360, instruction: "Machine is brewing. Don't open the lid mid-brew." },
      { name: "Bloom Rest", duration: 60, instruction: "Let coffee rest on the burner plate for a minute before pouring." },
      { name: "Done", duration: 0, instruction: "Pour and enjoy. Transfer to a thermal carafe if not drinking immediately." },
    ],
  },
};

const GRIND_SIZES = ["Extra Coarse", "Coarse", "Medium-Coarse", "Medium", "Medium-Fine", "Fine", "Extra Fine"];
const GRIND_COLORS = { "Extra Coarse": "#c8a878", Coarse: "#b89060", "Medium-Coarse": "#c09858", Medium: "#b88848", "Medium-Fine": "#c09040", Fine: "#a87838", "Extra Fine": "#906030" };

// --- AI Flavor Mapper -------------------------------------------------------
async function mapFlavorsWithAI(rawText) {
  const buildTaxonomyTree = (node, prefix = []) => {
    const lines = [];
    for (const [key, val] of Object.entries(node)) {
      if (key === "color") continue;
      const path = [...prefix, key];
      lines.push(path.join(" → "));
      if (val?.children) lines.push(...buildTaxonomyTree(val.children, path));
    }
    return lines;
  };
  const taxonomyLines = buildTaxonomyTree(FLAVOR_TAXONOMY).join("\n");

  const prompt = `You are a professional coffee taster and Q-grader. Map the user's tasting notes to this hierarchical flavor taxonomy and return a JSON object.

TAXONOMY (format: Category → Family → Specific → Variant):
${taxonomyLines}

USER NOTES: "${rawText}"

Return ONLY valid JSON (no markdown, no preamble):
{
  "mappings": [
    { "path": ["Fruity", "Stone Fruit", "Peach", "White Peach"], "weight": 3 },
    { "path": ["Floral", "Jasmine"], "weight": 2 }
  ],
  "summary": "One poetic sentence capturing the overall flavor character."
}

Rules:
- path: array from most general to most specific, following the taxonomy hierarchy exactly
- Go as deep as the notes support — if someone says "white peach" use all 4 levels, if they just say "fruity" use 1 level
- weight: 1=subtle, 2=moderate, 3=prominent
- Only map flavors genuinely present in the notes
- Every level in the path must exactly match a key in the taxonomy
- Include multiple mappings if multiple flavors detected`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  const text = data.content.map((b) => b.text || "").join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
// --- Flavor Wheel (dynamic rings) -------------------------------------------
function FlavorWheelTooltip({ tooltip }) {
  if (!tooltip) return null;
  return (
    <div style={{
      position: "fixed", left: tooltip.x + 2, top: tooltip.y - 28,
      background: "var(--bg2)", border: "1px solid var(--border2)",
      color: "var(--text)", padding: "6px 12px",
      fontFamily: "'Cormorant Garamond', serif", fontSize: 13,
      pointerEvents: "none", zIndex: 9999,
      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      whiteSpace: "nowrap",
    }}>
      {tooltip.label}
    </div>
  );
}

function FlavorWheel({ mappings }) {
  const coreR = 32;
  const [tooltip, setTooltip] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const lastDist = useRef(null);
  const lastMid = useRef(null);
  const lastTouch = useRef(null);
  const containerRef = useRef(null);
  const isTouchDevice = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx*dx + dy*dy);
  };

  const getTouchMid = (touches) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      lastDist.current = getTouchDist(e.touches);
      lastMid.current = getTouchMid(e.touches);
    } else if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && lastDist.current) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const mid = getTouchMid(e.touches);
      const ratio = dist / lastDist.current;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const ox = mid.x - rect.left;
        const oy = mid.y - rect.top;
        setTransform(t => {
          const newScale = Math.min(5, Math.max(0.5, t.scale * ratio));
          const scaleDiff = newScale - t.scale;
          return {
            scale: newScale,
            x: t.x - ox * scaleDiff / t.scale,
            y: t.y - oy * scaleDiff / t.scale,
          };
        });
      }
      lastDist.current = dist;
      lastMid.current = mid;
    } else if (e.touches.length === 1 && lastTouch.current && !isPinching) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      lastDist.current = null;
      lastMid.current = null;
      setIsPinching(false);
    }
    if (e.touches.length === 0) lastTouch.current = null;
  };

  const handleDoubleTap = () => setTransform({ scale: 1, x: 0, y: 0 });

  const hexAlpha = (hex, a) => {
    const n = parseInt(hex.replace("#",""), 16);
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
  };

  if (!mappings || mappings.length === 0) {
    const vs = 400, vcx = 200, vcy = 200;
    return (
      <svg width="100%" viewBox={`0 0 ${vs} ${vs}`} style={{ maxWidth: vs, display: "block", margin: "0 auto" }}>
        {[3,2,1].map(i => <circle key={i} cx={vcx} cy={vcy} r={coreR + i*ringWidth} fill="none" stroke="#252525" strokeWidth="1" strokeDasharray="3 5" />)}
        <circle cx={vcx} cy={vcy} r={coreR} fill="#161616" />
        <text x={vcx} y={vcy-5} textAnchor="middle" fill="#3a3a3a" fontSize="9" fontFamily="'Cormorant Garamond', serif">flavor</text>
        <text x={vcx} y={vcy+8} textAnchor="middle" fill="#3a3a3a" fontSize="9" fontFamily="'Cormorant Garamond', serif">wheel</text>
      </svg>
    );
  }

  // Build weighted tree from mappings
  const tree = {};
  let maxDepth = 0;
  for (const m of mappings) {
    const path = m.path || [m.top, m.mid, m.specific].filter(Boolean);
    if (path.length > maxDepth) maxDepth = path.length;
    let node = tree;
    for (const key of path) {
      if (!node[key]) node[key] = { weight: 0, children: {} };
      node[key].weight += m.weight || 1;
      node = node[key].children;
    }
  }

  const numRings = Math.max(maxDepth, 1);
  // Ring width shrinks slightly as more rings are added so wheel stays compact
  const ringWidth = Math.max(36, 64 - numRings * 4);
  const totalRadius = coreR + numRings * ringWidth;
  const vs = Math.max(400, totalRadius * 2 + 80);
  const vcx = vs / 2, vcy = vs / 2;

  const ringPath = (r1, r2, startA, endA) => {
    const x1=vcx+r1*Math.cos(startA), y1=vcy+r1*Math.sin(startA);
    const x2=vcx+r2*Math.cos(startA), y2=vcy+r2*Math.sin(startA);
    const x3=vcx+r2*Math.cos(endA),   y3=vcy+r2*Math.sin(endA);
    const x4=vcx+r1*Math.cos(endA),   y4=vcy+r1*Math.sin(endA);
    const lg = endA - startA > Math.PI ? 1 : 0;
    return `M${x1} ${y1} L${x2} ${y2} A${r2} ${r2} 0 ${lg} 1 ${x3} ${y3} L${x4} ${y4} A${r1} ${r1} 0 ${lg} 0 ${x1} ${y1}Z`;
  };

  const slices = [];

  // Helper to look up a node's color from the taxonomy given a path
  const getNodeColor = (path) => {
    let node = FLAVOR_TAXONOMY;
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      if (i === 0) {
        node = FLAVOR_TAXONOMY[key];
      } else {
        node = node?.children?.[key];
      }
      if (!node) return null;
    }
    return node?.color || null;
  };

  const buildSlices = (node, depth, startAngle, spanAngle, parentColor, currentPath) => {
    const entries = Object.entries(node);
    const nodeTotal = entries.reduce((s, [, n]) => s + n.weight, 0);
    let angle = startAngle;
    for (const [name, data] of entries) {
      const span = (data.weight / nodeTotal) * spanAngle;
      const GAP = span > 0.08 ? 0.008 : 0;
      const innerR = coreR + depth * ringWidth;
      const outerR = innerR + ringWidth;
      const nodePath = [...currentPath, name];
      const taxonomyColor = getNodeColor(nodePath);
      const color = taxonomyColor || parentColor;
      const midA = angle + span / 2;
      const labelR = innerR + ringWidth / 2;
      const lx = vcx + labelR * Math.cos(midA);
      const ly = vcy + labelR * Math.sin(midA);
      const deg = (midA * 180) / Math.PI;
      const flip = deg > 90 && deg < 270;
      const fs = Math.max(6.5, 10 - depth * 0.7);
      slices.push({
        path: ringPath(innerR, outerR, angle + GAP, angle + span - GAP),
        fill: color,
        label: name,
        lx, ly, deg, flip, fs, span, innerR, outerR,
      });
      if (Object.keys(data.children).length > 0) buildSlices(data.children, depth + 1, angle, span, color, nodePath);
      angle += span;
    }
  };
  buildSlices(tree, 0, -Math.PI / 2, 2 * Math.PI, "#888", []);

  return (
    <div style={{ position: "relative" }}>
    <div ref={containerRef} style={{ position: "relative", touchAction: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleTap}
    >
      <div style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: "center center", transition: isPinching ? "none" : "transform 0.15s ease" }}>
    <svg width="100%" viewBox={`0 0 ${vs} ${vs}`} preserveAspectRatio="xMidYMid meet" className="flavor-wheel-svg" style={{ display: "block", margin: "0 auto" }}>
      {slices.map((s, i) => (
        <g key={i}
          onMouseEnter={(e) => { if (isTouchDevice) return; setHoveredIdx(i); setTooltip({ label: s.label, x: e.clientX, y: e.clientY }); }}
          onMouseMove={(e) => { if (isTouchDevice) return; setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null); }}
          onMouseLeave={() => { if (isTouchDevice) return; setHoveredIdx(null); setTooltip(null); }}
          style={{ cursor: "default" }}
        >
          <path d={s.path}
            fill={s.fill}
            stroke="#0e0e0e" strokeWidth="0.7"
            opacity={hoveredIdx !== null && hoveredIdx !== i ? 0.75 : 1}
            style={{ transition: "opacity 0.15s" }}
          />
          {s.label && s.span > 0.12 && (() => {
            const hex = s.fill.replace("#","");
            const r2 = parseInt(hex.slice(0,2),16), g2 = parseInt(hex.slice(2,4),16), b2 = parseInt(hex.slice(4,6),16);
            const brightness = (r2*299 + g2*587 + b2*114) / 1000;
            const labelColor = isNaN(brightness) || brightness > 155 ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.95)";
            const midR = s.innerR + (s.outerR - s.innerR) / 2;
            const arcWidth = midR * s.span;
            const maxChars = Math.max(4, Math.floor(arcWidth * 0.16 * (10 / s.fs)));
            const displayLabel = s.label.length > maxChars ? s.label.slice(0, maxChars - 1) + "…" : s.label;
            return (
              <text x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle"
                fill={labelColor} fontSize={s.fs}
                fontFamily="'Cormorant Garamond', serif" fontWeight="600"
                transform={`rotate(${s.flip ? s.deg+180 : s.deg},${s.lx},${s.ly})`}
                style={{ pointerEvents: "none" }}>
                {displayLabel}
              </text>
            );
          })()}
        </g>
      ))}
      <circle cx={vcx} cy={vcy} r={coreR} fill="#0e0e0e" stroke="#2a2a2a" strokeWidth="1" />
      <text x={vcx} y={vcy-6} textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="'Cormorant Garamond', serif" letterSpacing="1.5">FLAVOR</text>
      <text x={vcx} y={vcy+7} textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="'Cormorant Garamond', serif" letterSpacing="1.5">WHEEL</text>
    </svg>
    </div>
    {isTouchDevice && transform.scale !== 1 && (
      <div style={{ textAlign: "center", fontSize: 10, color: "var(--muted4)", marginTop: 6, letterSpacing: 1 }}>
        Double-tap to reset zoom
      </div>
    )}
    <FlavorWheelTooltip tooltip={tooltip} />
    </div>
    </div>
  );
}

function BrewTimer({ cfg }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);       // total seconds since start
  const [stageIdx, setStageIdx] = useState(0);     // current stage index
  const [stageElapsed, setStageElapsed] = useState(0); // seconds into current stage
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  const stages = cfg.timerStages || [];
  const isEspresso = !!cfg.isEspresso;
  const espTarget = cfg.timerTarget;

  // Reset whenever method changes
  useEffect(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    setStageIdx(0);
    setStageElapsed(0);
    setDone(false);
  }, [cfg]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
      setStageElapsed((se) => {
        if (isEspresso) return se + 1;
        const newSe = se + 1;
        setStageIdx((si) => {
          const stage = stages[si];
          if (!stage || stage.duration === 0) return si;
          if (newSe >= stage.duration) {
            const nextIdx = si + 1;
            if (nextIdx >= stages.length) {
              clearInterval(intervalRef.current);
              setRunning(false);
              setDone(true);
              return si;
            }
            setStageElapsed(0);
            return nextIdx;
          }
          return si;
        });
        return newSe;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, isEspresso, stages]);

  // For staged timers, stageElapsed resets each stage track it properly
  // We need to not use stageElapsed directly since the setState is async
  // Instead derive from elapsed + stage start times
  const stageStarts = [];
  let acc = 0;
  for (const s of stages) { stageStarts.push(acc); acc += s.duration; }

  const currentStageStart = stageStarts[stageIdx] || 0;
  const currentStageElapsed = elapsed - currentStageStart;
  const currentStage = stages[stageIdx];
  const stageRemaining = currentStage && currentStage.duration > 0
    ? Math.max(0, currentStage.duration - currentStageElapsed)
    : 0;

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}s`;
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    setStageIdx(0);
    setStageElapsed(0);
    setDone(false);
  };

  const totalDuration = stages.reduce((s, st) => s + st.duration, 0);
  const progressPct = totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 0;

  // Espresso zone color
  const espZone = isEspresso
    ? elapsed < espTarget?.min ? "early"
      : elapsed <= espTarget?.max ? "good"
      : "late"
    : null;

  const espColor = { early: "#c9a84c", good: "#7a8c5c", late: "#c05a50" };
  const espLabel = { early: "Extracting...", good: "In the zone ✦", late: "Stop over-extracting" };

  if (cfg.isColdBrew) return (
    <div className="timer-cold">
      <span className="timer-cold-icon">❄</span>
      <div>
        <div className="timer-cold-head">No active timer needed</div>
        <div className="timer-cold-sub">Set a reminder for {cfg.steepHours} hours from now when you start your steep.</div>
      </div>
    </div>
  );

  if (cfg.isDrip) return (
    <div className="timer-cold">
      <span className="timer-cold-icon">⊡</span>
      <div>
        <div className="timer-cold-head">Machine handles the timing</div>
        <div className="timer-cold-sub">Your drip machine controls brew time automatically. Focus on ratio, grind, and fresh beans.</div>
      </div>
    </div>
  );

  return (
    <div className="timer-wrap">
      <div className="timer-header">
        <span className="timer-title">Brew Timer</span>
        {!isEspresso && (
          <span className="timer-total">{fmt(elapsed)} total</span>
        )}
      </div>

      {/* Main clock */}
      <div className="timer-clock-area">
        {isEspresso ? (
          <div className="timer-clock-espresso" style={{ color: espColor[espZone] }}>
            <div className="timer-big">{elapsed}s</div>
            <div className="timer-esp-label" style={{ color: espColor[espZone] }}>
              {running || elapsed > 0 ? espLabel[espZone] : "Ready to pull"}
            </div>
            <div className="timer-esp-target">Target: {espTarget.min}-{espTarget.max}s</div>
            {/* Target zone bar */}
            <div className="timer-esp-bar-wrap">
              <div className="timer-esp-bar-track">
                <div className="timer-esp-zone" style={{
                  left: `${(espTarget.min / 40) * 100}%`,
                  width: `${((espTarget.max - espTarget.min) / 40) * 100}%`,
                }} />
                <div className="timer-esp-cursor" style={{
                  left: `${Math.min(100, (elapsed / 40) * 100)}%`,
                  background: espColor[espZone],
                }} />
              </div>
              <div className="timer-esp-bar-labels">
                <span>0s</span><span>10s</span><span>20s</span><span>30s</span><span>40s</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stage countdown */}
            <div className="timer-stage-area">
              {done ? (
                <div className="timer-done">
                  <div className="timer-done-icon">✦</div>
                  <div className="timer-done-text">Brew complete</div>
                  <div className="timer-done-sub">Total: {fmt(elapsed)}</div>
                </div>
              ) : (
                <>
                  <div className="timer-stage-name">{currentStage?.name}</div>
                  <div className="timer-stage-countdown">
                    {currentStage?.duration === 0 ? "-" : fmt(stageRemaining)}
                  </div>
                  <div className="timer-stage-instruction">{currentStage?.instruction}</div>
                </>
              )}
            </div>
            {/* Stage progress dots */}
            <div className="timer-stage-dots">
              {stages.map((s, i) => (
                <div key={i} className="timer-stage-dot-wrap">
                  <div className={`timer-stage-dot ${i < stageIdx ? "past" : i === stageIdx ? "current" : "future"}`} />
                  <div className="timer-stage-dot-label">{s.name}</div>
                </div>
              ))}
            </div>
            {/* Overall progress bar */}
            {!done && (
              <div className="timer-progress-track">
                <div className="timer-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="timer-controls">
        {!running && !done && (
          <button className="timer-btn-start" onClick={() => setRunning(true)}>
            {elapsed === 0 ? (isEspresso ? "▶  Start Shot" : "▶  Start Brew") : "▶  Resume"}
          </button>
        )}
        {running && (
          <button className="timer-btn-pause" onClick={() => { clearInterval(intervalRef.current); setRunning(false); }}>
            ⏸  Pause
          </button>
        )}
        {(elapsed > 0) && (
          <button className="timer-btn-reset" onClick={reset}>↺  Reset</button>
        )}
      </div>
    </div>
  );
}

// --- Milk Drinks -------------------------------------------------------------
const MILK_DRINKS = [
  {
    name: "Latte",
    icon: "☕",
    espressoRatio: 1,
    milkRatio: 4.5,
    foamRatio: 0.5,
    temp: "65°C / 150°F",
    desc: "The most popular milk drink. Silky steamed milk with a thin layer of microfoam. Mild and creamy.",
    tip: "Stretch the milk first (aerate), then swirl to integrate before pouring.",
  },
  {
    name: "Flat White",
    icon: "◎",
    espressoRatio: 1,
    milkRatio: 2.5,
    foamRatio: 0,
    temp: "65°C / 150°F",
    desc: "Stronger than a latte, velvety microfoam poured directly in. Originated in Australia/New Zealand.",
    tip: "All microfoam, no dry foam. The milk should be glossy and pourable like wet paint.",
  },
  {
    name: "Cappuccino",
    icon: "⊙",
    espressoRatio: 1,
    milkRatio: 1,
    foamRatio: 1,
    temp: "65°C / 150°F",
    desc: "Classic thirds: espresso, steamed milk, dry foam. Bold and textured.",
    tip: "The dry foam should be thick enough to hold a spoon of sugar on top briefly.",
  },
  {
    name: "Cortado",
    icon: "◑",
    espressoRatio: 1,
    milkRatio: 1,
    foamRatio: 0,
    temp: "60°C / 140°F",
    desc: "Equal parts espresso and warm milk. Cuts the acidity without diluting flavour much.",
    tip: "Served in a small glass, no foam. Milk is warmed not fully steamed.",
  },
  {
    name: "Macchiato",
    icon: "◐",
    espressoRatio: 1,
    milkRatio: 0.25,
    foamRatio: 0.25,
    temp: "65°C / 150°F",
    desc: "Just a stain of milk foam on top of espresso. 'Macchiato' means marked in Italian.",
    tip: "Only a dollop the espresso should still dominate completely.",
  },
  {
    name: "Americano",
    icon: "▢",
    espressoRatio: 1,
    milkRatio: 0,
    foamRatio: 0,
    waterRatio: 3,
    temp: "-",
    desc: "Espresso diluted with hot water. Similar strength to drip but with espresso character.",
    tip: "Add water to the cup first, then espresso this preserves the crema on top.",
  },
];

function MilkDrinks({ yieldGrams }) {
  const [selected, setSelected] = useState("Latte");
  const drink = MILK_DRINKS.find((d) => d.name === selected);
  const base = yieldGrams || 36;

  const milkMl = Math.round(drink.milkRatio * base);
  const foamMl = Math.round(drink.foamRatio * base);
  const waterMl = drink.waterRatio ? Math.round(drink.waterRatio * base) : 0;
  const totalMl = Math.round(base + milkMl + foamMl + waterMl);
  const espPct = Math.round((base / totalMl) * 100);
  const milkPct = Math.round((milkMl / totalMl) * 100);
  const foamPct = Math.round((foamMl / totalMl) * 100);
  const waterPct = Math.round((waterMl / totalMl) * 100);

  return (
    <div className="milk-wrap">
      <div className="milk-header">
        <span className="milk-title">Milk Drinks</span>
        <span className="milk-sub">Based on {Math.round(base)}g espresso yield</span>
      </div>

      {/* Drink selector */}
      <div className="milk-tabs">
        {MILK_DRINKS.map((d) => (
          <button
            key={d.name}
            className={`milk-tab ${selected === d.name ? "active" : ""}`}
            onClick={() => setSelected(d.name)}
          >
            <span className="milk-tab-icon">{d.icon}</span>
            <span className="milk-tab-name">{d.name}</span>
          </button>
        ))}
      </div>

      {/* Detail */}
      <div className="milk-detail">
        <div className="milk-desc">{drink.desc}</div>

        {/* Composition bar */}
        <div className="milk-bar-wrap">
          <div className="milk-bar">
            <div className="milk-bar-seg esp" style={{ width: `${espPct}%` }} title={`Espresso ${Math.round(base)}g`} />
            {milkPct > 0 && <div className="milk-bar-seg milk" style={{ width: `${milkPct}%` }} title={`Steamed milk ${milkMl}ml`} />}
            {foamPct > 0 && <div className="milk-bar-seg foam" style={{ width: `${foamPct}%` }} title={`Foam ${foamMl}ml`} />}
            {waterPct > 0 && <div className="milk-bar-seg water" style={{ width: `${waterPct}%` }} title={`Water ${waterMl}ml`} />}
          </div>
          <div className="milk-bar-legend">
            <span className="mbl esp">Espresso {Math.round(base)}g</span>
            {milkMl > 0 && <span className="mbl milk">Steamed milk {milkMl}ml</span>}
            {foamMl > 0 && <span className="mbl foam">Foam {foamMl}ml</span>}
            {waterMl > 0 && <span className="mbl water">Water {waterMl}ml</span>}
          </div>
        </div>

        {/* Stats row */}
        <div className="milk-stats">
          <div className="milk-stat">
            <div className="milk-stat-val">{totalMl}ml</div>
            <div className="milk-stat-label">Total Volume</div>
          </div>
          {milkMl > 0 && (
            <div className="milk-stat">
              <div className="milk-stat-val">{milkMl}ml</div>
              <div className="milk-stat-label">Steamed Milk</div>
            </div>
          )}
          {foamMl > 0 && (
            <div className="milk-stat">
              <div className="milk-stat-val">{foamMl}ml</div>
              <div className="milk-stat-label">Foam</div>
            </div>
          )}
          {waterMl > 0 && (
            <div className="milk-stat">
              <div className="milk-stat-val">{waterMl}ml</div>
              <div className="milk-stat-label">Hot Water</div>
            </div>
          )}
          <div className="milk-stat">
            <div className="milk-stat-val">{drink.temp}</div>
            <div className="milk-stat-label">Milk Temp</div>
          </div>
        </div>

        <div className="milk-tip">
          <span className="milk-tip-icon">✦</span>
          {drink.tip}
        </div>
      </div>
    </div>
  );
}

// --- Brew Calculator --------------------------------------------------------
const RECIPES_KEY = "craft_and_cup_recipes_v1";
const SHOT_PRESETS = [
  { label: "Single", shots: 1, dose: 9,  ratio: 2 },
  { label: "Double", shots: 2, dose: 18, ratio: 2 },
  { label: "Triple", shots: 3, dose: 27, ratio: 2 },
];

function BrewCalculator({ initialMethod }) {
  const [method, setMethod] = useState(initialMethod || "Pour Over / V60");
  const [unit, setUnit] = useState("metric");
  const cfg = BREW_CONFIGS[method];

  const [dose, setDose] = useState(cfg.defaultDose);
  const [ratio, setRatio] = useState(cfg.defaultRatio);
  const [cups, setCups] = useState(1);
  const [lastEdited, setLastEdited] = useState("dose");

  // Saved recipes
  const [recipes, setRecipes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECIPES_KEY)) || []; } catch { return []; }
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  // Sync if parent sends a new initialMethod
  useEffect(() => {
    if (initialMethod && BREW_CONFIGS[initialMethod]) {
      handleMethodChange(initialMethod);
    }
  }, [initialMethod]);

  useEffect(() => {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
  }, [recipes]);

  const water = dose * ratio;
  const waterDisplay = unit === "imperial" ? (water * 0.033814).toFixed(1) + " fl oz" : Math.round(water) + " ml";
  const doseDisplay = unit === "imperial" ? (dose * 0.035274).toFixed(1) + " oz" : dose + " g";
  const cupsFromDose = cfg.cupVolume ? Math.round((dose * ratio) / cfg.cupVolume * 10) / 10 : null;
  const grindIdx = GRIND_SIZES.indexOf(cfg.grindSize);

  const handleMethodChange = (m) => {
    const newCfg = BREW_CONFIGS[m];
    setMethod(m);
    setRatio(newCfg.defaultRatio);
    setDose(newCfg.defaultDose);
    setCups(1);
    setLastEdited("dose");
  };

  const handleDose = (val) => {
    const d = parseFloat(val) || 0;
    setDose(d);
    if (cfg.cupVolume) setCups(Math.round((d * ratio) / cfg.cupVolume * 10) / 10);
    setLastEdited("dose");
  };

  const handleWater = (val) => {
    const w = parseFloat(val) || 0;
    const d = Math.round((w / ratio) * 10) / 10;
    setDose(d);
    if (cfg.cupVolume) setCups(Math.round(w / cfg.cupVolume * 10) / 10);
    setLastEdited("water");
  };

  const handleCups = (val) => {
    const c = parseFloat(val) || 1;
    setCups(c);
    if (cfg.cupVolume) setDose(Math.round((c * cfg.cupVolume / ratio) * 10) / 10);
    setLastEdited("cups");
  };

  const handleRatio = (val) => {
    const r = parseFloat(val) || cfg.defaultRatio;
    setRatio(r);
    if (lastEdited === "cups" && cfg.cupVolume) setDose(Math.round((cups * cfg.cupVolume / r) * 10) / 10);
  };

  const loadShotPreset = (preset) => {
    setDose(preset.dose);
    setRatio(preset.ratio);
  };

  const saveRecipe = () => {
    if (!recipeName.trim()) { setSaveMsg("Please enter a name."); return; }
    const recipe = {
      id: Date.now(),
      name: recipeName.trim(),
      method,
      dose,
      ratio,
      cups,
      unit,
      savedAt: new Date().toISOString(),
    };
    setRecipes((prev) => [recipe, ...prev]);
    setRecipeName("");
    setShowSaveModal(false);
    setSaveMsg("");
  };

  const loadRecipe = (r) => {
    if (!BREW_CONFIGS[r.method]) return;
    handleMethodChange(r.method);
    setTimeout(() => {
      setDose(r.dose);
      setRatio(r.ratio);
      setCups(r.cups || 1);
      setUnit(r.unit || "metric");
    }, 0);
    setShowRecipes(false);
  };

  const deleteRecipe = (id) => setRecipes((prev) => prev.filter((r) => r.id !== id));

  const tempDisplay = cfg.tempC
    ? unit === "imperial" ? `${cfg.tempF}°F` : `${cfg.tempC}°C`
    : "Cold / Room Temp";

  return (
    <div className="calc-wrap">
      {/* Method selector — wrapping on desktop, scrollable on mobile */}
      <div className="method-tabs">
        {Object.keys(BREW_CONFIGS).sort().map((m) => (
          <button key={m} className={`method-tab ${method === m ? "active" : ""}`} onClick={() => handleMethodChange(m)}>
            <span className="method-icon">{BREW_CONFIGS[m].icon}</span>
            <span className="method-label">{m}</span>
          </button>
        ))}
      </div>
      <div className="method-tabs-wrap">
        <div className="method-tabs-scroll">
          {Object.keys(BREW_CONFIGS).sort().map((m) => (
            <button key={m} className={`method-tab ${method === m ? "active" : ""}`} onClick={() => handleMethodChange(m)}>
              <span className="method-icon">{BREW_CONFIGS[m].icon}</span>
              <span className="method-label">{m}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Espresso shot presets */}
      {cfg.isEspresso && (
        <div className="shot-presets">
          <span className="shot-presets-label">Shot target</span>
          <div className="shot-preset-btns">
            {SHOT_PRESETS.map((p) => (
              <button
                key={p.label}
                className={`shot-preset-btn ${dose === p.dose && ratio === p.ratio ? "active" : ""}`}
                onClick={() => loadShotPreset(p)}
              >
                {p.label}
                <span className="shot-preset-sub">{p.dose}g in / {p.dose * p.ratio}g out</span>
              </button>
            ))}
            <button className={`shot-preset-btn ${!SHOT_PRESETS.some(p => p.dose === dose && p.ratio === ratio) ? "active" : ""}`}
              onClick={() => {}}>
              Custom
              <span className="shot-preset-sub">adjust below</span>
            </button>
          </div>
        </div>
      )}

      <div className="calc-body">
        {/* Left: inputs */}
        <div className="calc-inputs">
          <div className="calc-section-head">
            <span>Parameters</span>
            <div className="unit-toggle">
              <button className={unit === "metric" ? "utog active" : "utog"} onClick={() => setUnit("metric")}>metric</button>
              <button className={unit === "imperial" ? "utog active" : "utog"} onClick={() => setUnit("imperial")}>imperial</button>
            </div>
          </div>

          <div className="input-group">
            <label>Coffee Dose <span className="input-unit">{unit === "imperial" ? "oz" : "grams"}</span></label>
            <input type="number" min="1" step="0.5" value={unit === "imperial" ? (dose * 0.035274).toFixed(1) : dose} onChange={(e) => handleDose(unit === "imperial" ? e.target.value / 0.035274 : e.target.value)} />
          </div>

          {!cfg.isEspresso ? (
            <>
              <div className="input-group">
                <label>{cfg.isColdBrew ? "Water (concentrate)" : "Water"} <span className="input-unit">{unit === "imperial" ? "fl oz" : "ml"}</span></label>
                <input type="number" min="1" step="5" value={unit === "imperial" ? ((dose * ratio) * 0.033814).toFixed(1) : Math.round(dose * ratio)} onChange={(e) => handleWater(unit === "imperial" ? e.target.value / 0.033814 : e.target.value)} />
              </div>
              {cfg.cupVolume && (
                <div className="input-group">
                  <label>Target Cups <span className="input-unit">{unit === "imperial" ? `${(cfg.cupVolume * 0.033814).toFixed(0)}fl oz each` : `${cfg.cupVolume}ml each`}</span></label>
                  <input type="number" min="0.5" step="0.5" value={cups} onChange={(e) => handleCups(e.target.value)} />
                </div>
              )}
            </>
          ) : (
            <div className="input-group">
              <label>Yield (espresso out) <span className="input-unit">{unit === "imperial" ? "oz" : "grams"}</span></label>
              <input type="number" min="1" step="1" value={unit === "imperial" ? ((dose * ratio) * 0.035274).toFixed(1) : Math.round(dose * ratio)} onChange={(e) => handleWater(unit === "imperial" ? e.target.value / 0.035274 : e.target.value)} />
            </div>
          )}

          <div className="ratio-group">
            <div className="ratio-header">
              <label>Ratio</label>
              <span className="ratio-display">1 : {ratio.toFixed(1)}</span>
            </div>
            <input
              type="range" min={cfg.ratioMin} max={cfg.ratioMax}
              step={cfg.isEspresso ? 0.1 : 0.5} value={ratio}
              onChange={(e) => { handleRatio(e.target.value); }}
              className="ratio-slider"
            />
            <div className="ratio-ends">
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 18, color: "var(--gold)", opacity: 0.8 }}>◂</span>
                Strong ({cfg.ratioMin}:1)
              </span>
              {<span style={{ fontSize: 10, color: "var(--muted4)", fontStyle: "italic" }}>drag to adjust</span>}
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                Light ({cfg.ratioMax}:1)
                <span style={{ fontSize: 18, color: "var(--gold)", opacity: 0.8 }}>▸</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: outputs */}
        <div className="calc-outputs">
          <div className="output-card primary">
            <div className="output-label">{cfg.isEspresso ? "Dose In" : "Coffee"}</div>
            <div className="output-value">{doseDisplay}</div>
          </div>
          <div className="output-card primary">
            <div className="output-label">{cfg.isEspresso ? "Yield Out" : cfg.isColdBrew ? "Water" : "Water"}</div>
            <div className="output-value">{waterDisplay}</div>
          </div>
          {!cfg.isEspresso && cfg.cupVolume && (
            <div className="output-card">
              <div className="output-label">Cups</div>
              <div className="output-value">{cupsFromDose}×</div>
            </div>
          )}
          <div className="output-card">
            <div className="output-label">Ratio</div>
            <div className="output-value">1:{ratio.toFixed(1)}</div>
          </div>
          <div className="output-card">
            <div className="output-label">Temperature</div>
            <div className="output-value">{tempDisplay}</div>
          </div>
          {cfg.brewTime && (
            <div className="output-card">
              <div className="output-label">{cfg.isColdBrew ? "Steep" : "Brew Time"}</div>
              <div className="output-value">{cfg.isColdBrew ? cfg.steepHours + "h" : cfg.brewTime}</div>
            </div>
          )}
        </div>
      </div>

      {/* Save / Load recipe bar */}
      <div className="recipe-bar">
        <button className="recipe-btn-save" onClick={() => { setShowSaveModal(true); setSaveMsg(""); }}>
          ✦ Save Recipe
        </button>
        {recipes.length > 0 && (
          <button className="recipe-btn-load" onClick={() => setShowRecipes(!showRecipes)}>
            {showRecipes ? "Hide Recipes" : `My Recipes (${recipes.length})`}
          </button>
        )}
      </div>

      {showSaveModal && (
        <div className="recipe-modal">
          <div className="recipe-modal-title">Save this recipe</div>
          <div className="recipe-modal-meta">{method} · {dose}g · 1:{ratio.toFixed(1)}</div>
          <input
            className="recipe-modal-input"
            placeholder="e.g. Morning V60, My Espresso Dial-in..."
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveRecipe()}
            autoFocus
          />
          {saveMsg && <div className="recipe-modal-err">{saveMsg}</div>}
          <div className="recipe-modal-actions">
            <button className="btn-primary" onClick={saveRecipe}>Save</button>
            <button className="btn-ghost" onClick={() => setShowSaveModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showRecipes && recipes.length > 0 && (
        <div className="recipe-list">
          {recipes.map((r) => (
            <div key={r.id} className="recipe-item">
              <div className="recipe-item-left" onClick={() => loadRecipe(r)}>
                <div className="recipe-item-name">{r.name}</div>
                <div className="recipe-item-meta">{BREW_CONFIGS[r.method]?.icon} {r.method} · {r.dose}g · 1:{parseFloat(r.ratio).toFixed(1)}</div>
              </div>
              <button className="recipe-item-delete" onClick={() => deleteRecipe(r.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Grind guide */}
      <div className="grind-section">
        <div className="grind-header">
          <span className="grind-title">Grind Size</span>
          <span className="grind-name" style={{ color: GRIND_COLORS[cfg.grindSize] || "var(--gold)" }}>{cfg.grindSize}</span>
        </div>
        <div className="grind-bar-wrap">
          {GRIND_SIZES.map((g, i) => (
            <div key={g} className="grind-segment" title={g}>
              <div className="grind-dot" style={{
                background: i === grindIdx ? GRIND_COLORS[g] : "var(--border2)",
                border: i === grindIdx ? `2px solid ${GRIND_COLORS[g]}` : "2px solid var(--border3)",
                transform: i === grindIdx ? "scale(1.5)" : "scale(1)",
              }} />
              {i === grindIdx && <div className="grind-tick-label">{g}</div>}
            </div>
          ))}
        </div>
        <div className="grind-desc">{cfg.grindDesc}</div>
      </div>

      <div className="brew-note">
        <span className="brew-note-icon">✦</span>
        {cfg.notes}
      </div>

      <BrewTimer cfg={cfg} />
      {cfg.isEspresso && <MilkDrinks yieldGrams={Math.round(dose * ratio)} />}
    </div>
  );
}

// --- Tasting Scores ----------------------------------------------------------
const SCORE_ATTRIBUTES = [
  { key: "aroma",     label: "Aroma",     description: "Fragrance and smell" },
  { key: "acidity",   label: "Acidity",   description: "Brightness, liveliness" },
  { key: "body",      label: "Body",      description: "Weight and texture on the palate" },
  { key: "sweetness", label: "Sweetness", description: "Natural sweetness perceived" },
  { key: "finish",    label: "Finish",    description: "Aftertaste length and quality" },
  { key: "balance",   label: "Balance",   description: "Harmony between all elements" },
  { key: "bitterness", label: "Bitterness", description: "Bitterness quality pleasant roast notes vs harsh" },
];

const DEFAULT_SCORES = Object.fromEntries(SCORE_ATTRIBUTES.map((a) => [a.key, 5]));

function TastingScores({ scores, onChange }) {
  const overall = Math.round(
    (Object.values(scores).reduce((s, v) => s + v, 0) / SCORE_ATTRIBUTES.length) * 10
  ) / 10;

  const scoreColor = (v) => {
    if (v >= 8) return "var(--score-green)";
    if (v >= 6) return "var(--score-amber)";
    if (v >= 4) return "var(--score-orange)";
    return "var(--score-red)";
  };

  return (
    <div className="scores-wrap">
      <div className="scores-header">
        <div className="scores-title-row">
          <span className="detail-block-label">Tasting Scores</span>
          <div className="scores-overall">
            <span className="scores-overall-num" style={{ color: scoreColor(overall) }}>{overall}</span>
            <span className="scores-overall-denom">/10</span>
          </div>
        </div>
      </div>
      <div className="scores-list">
        {SCORE_ATTRIBUTES.map((attr) => {
          const val = scores[attr.key] ?? 5;
          const pct = (val / 10) * 100;
          return (
            <div className="score-row" key={attr.key}>
              <div className="score-row-top">
                <div className="score-attr-info">
                  <span className="score-attr-label">{attr.label}</span>
                  <span className="score-attr-desc">{attr.description}</span>
                </div>
                <span className="score-val" style={{ color: scoreColor(val) }}>{val}</span>
              </div>
              <div className="score-slider-wrap">
                <input
                  type="range" min="1" max="10" step="1"
                  value={val}
                  onChange={(e) => onChange({ ...scores, [attr.key]: Number(e.target.value) })}
                  className="score-slider"
                  style={{ "--fill": scoreColor(val), "--pct": `${pct}%` }}
                />
                <div className="score-track-labels">
                  <span>1</span><span>5</span><span>10</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Share Sheet -------------------------------------------------------------
function encodeBean(bean) {
  const payload = {
    brand: bean.brand,
    name: bean.name,
    origin: bean.origin,
    roast: bean.roast,
    brewMethod: bean.brewMethod,
    notes: bean.notes,
    flavorText: bean.flavorText,
    flavorData: bean.flavorData,
    scores: bean.scores,
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodeBean(code) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  } catch { return null; }
}

function ShareSheet({ bean, onClose, onImportCode, importOnly = false }) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [importMode, setImportMode] = useState(importOnly || !bean);
  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState("");
  const cardRef = useRef(null);

  const code = encodeBean(bean);
  const shortCode = code.slice(0, 12) + "..." + code.slice(-6);

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    });
  };

  const overall = bean.scores
    ? Math.round((Object.values(bean.scores).reduce((s, v) => s + v, 0) / SCORE_ATTRIBUTES.length) * 10) / 10
    : null;

  const scoreColor = (v) => v >= 8 ? "#8aaa6a" : v >= 6 ? "#d4b05a" : v >= 4 ? "#c09040" : "#d06860";

  const downloadCard = async () => {
    setGenerating(true);
    const W = 640, H = 900;
    const PAD = 44;
    const canvas = document.createElement("canvas");
    canvas.width = W * 2; canvas.height = H * 2;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);

    const drawWrappedText = (text, x, y, maxW, lineH) => {
      const words = text.split(" ");
      let line = "", ly = y;
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line.trim(), x, ly);
          ly += lineH; line = word + " ";
        } else { line = test; }
      }
      if (line) ctx.fillText(line.trim(), x, ly);
      return ly + lineH;
    };

    const scoreColor = v => v >= 8 ? "#4a7a28" : v >= 6 ? "#a07010" : v >= 4 ? "#b05a10" : "#a02010";

    // Background
    ctx.fillStyle = "#0e0e0e";
    ctx.fillRect(0, 0, W, H);

    // Left gold sidebar
    ctx.fillStyle = "#d4b05a";
    ctx.fillRect(0, 0, 3, H);

    // Top section background
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, W, 200);

    // Brand
    ctx.fillStyle = "#d4b05a";
    ctx.font = "500 10px 'Arial', sans-serif";
    ctx.letterSpacing = "3px";
    ctx.fillText("CRAFT & CUP", PAD, 36);
    ctx.letterSpacing = "0px";

    // Roaster
    ctx.fillStyle = "#786050";
    ctx.font = "300 11px 'Arial', sans-serif";
    ctx.fillText((bean.brand || "Unknown Roaster").toUpperCase(), PAD, 64);

    // Bean name
    const nameSize = (bean.name || "").length > 22 ? 28 : (bean.name || "").length > 16 ? 34 : 40;
    ctx.fillStyle = "#ede5d8";
    ctx.font = `400 ${nameSize}px 'Georgia', serif`;
    ctx.fillText(bean.name || bean.origin || "Unnamed Bean", PAD, 108);

    // Tags
    const tags = [bean.roast && `${bean.roast} Roast`, bean.origin, bean.brewMethod].filter(Boolean);
    ctx.fillStyle = "#786050";
    ctx.font = "300 11px 'Arial', sans-serif";
    ctx.fillText(tags.join("  ·  "), PAD, 138);

    // Divider
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, 162); ctx.lineTo(W - PAD, 162); ctx.stroke();

    // Overall score — top right
    if (overall !== null) {
      ctx.font = `400 52px 'Georgia', serif`;
      ctx.fillStyle = "#d4b05a";
      const scoreStr = `${overall}`;
      const scoreW = ctx.measureText(scoreStr).width;
      ctx.fillText(scoreStr, W - PAD - scoreW - 24, 108);
      ctx.font = "300 14px 'Georgia', serif";
      ctx.fillStyle = "#786050";
      ctx.fillText("/10", W - PAD - 22, 108);
      ctx.font = "300 9px 'Arial', sans-serif";
      ctx.fillStyle = "#605040";
      ctx.fillText("OVERALL", W - PAD - scoreW - 24, 80);
    }

    let y = 184;

    // Flavor summary
    if (bean.flavorData?.summary) {
      ctx.fillStyle = "#a89880";
      ctx.font = `italic 400 13px 'Georgia', serif`;
      y = drawWrappedText(bean.flavorData.summary, PAD, y, W - PAD * 2, 20);
      y += 8;
    }

    // Flavor chips
    if (bean.flavorData?.mappings?.length > 0) {
      ctx.font = "300 11px 'Arial', sans-serif";
      let fx = PAD, fy = y;
      for (const m of bean.flavorData.mappings.slice(0, 8)) {
        const label = m.path ? m.path[m.path.length-1] : (m.specific || m.mid || m.top);
        const color = FLAVOR_TAXONOMY[m.path ? m.path[0] : m.top]?.color || "#888";
        const tw = ctx.measureText(label).width + 20;
        if (fx + tw > W - PAD) { fx = PAD; fy += 26; }
        ctx.fillStyle = color + "22";
        ctx.fillRect(fx, fy - 13, tw, 20);
        ctx.strokeStyle = color + "66";
        ctx.lineWidth = 1;
        ctx.strokeRect(fx, fy - 13, tw, 20);
        ctx.fillStyle = color;
        ctx.fillText(label, fx + 10, fy + 2);
        fx += tw + 8;
      }
      y = fy + 24;
    }

    // Divider
    ctx.strokeStyle = "#1e1e1e";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
    y += 22;

    // Scores section label
    ctx.font = "300 9px 'Arial', sans-serif";
    ctx.fillStyle = "#605040";
    ctx.letterSpacing = "2px";
    ctx.fillText("TASTING SCORES", PAD, y);
    ctx.letterSpacing = "0px";
    y += 18;

    // Score bars — full width, stacked
    const barW = W - PAD * 2 - 40;
    if (bean.scores) {
      SCORE_ATTRIBUTES.forEach((attr) => {
        const val = bean.scores[attr.key] ?? 5;
        const sc = scoreColor(val);

        ctx.font = "300 10px 'Arial', sans-serif";
        ctx.fillStyle = "#786050";
        ctx.fillText(attr.label.toUpperCase(), PAD, y);

        // Value
        ctx.font = `400 14px 'Georgia', serif`;
        ctx.fillStyle = sc;
        ctx.fillText(`${val}`, W - PAD - 18, y);

        // Track
        ctx.fillStyle = "#1e1e1e";
        ctx.fillRect(PAD, y + 5, barW, 3);

        // Fill
        ctx.fillStyle = sc;
        ctx.fillRect(PAD, y + 5, (barW * val) / 10, 3);

        y += 26;
      });
    }

    y += 6;

    // Divider
    ctx.strokeStyle = "#1e1e1e";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
    y += 18;

    // Raw tasting notes
    if (bean.flavorText) {
      ctx.font = `italic 300 11px 'Georgia', serif`;
      ctx.fillStyle = "#4a3828";
      const maxY = H - 28;
      const words = `"${bean.flavorText}"`.split(" ");
      let line = "";
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > W - PAD * 2 && line) {
          if (y + 16 > maxY) break;
          ctx.fillText(line.trim(), PAD, y);
          y += 16; line = word + " ";
        } else { line = test; }
      }
      if (line && y <= maxY) ctx.fillText(line.trim(), PAD, y);
    }

    // Bottom gold bar
    ctx.fillStyle = "#d4b05a";
    ctx.fillRect(0, H - 3, W, 3);

    const link = document.createElement("a");
    link.download = `${(bean.name || bean.brand || "bean").replace(/\s+/g, "-").toLowerCase()}-craft-and-cup.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setGenerating(false);
  };

  const handleImport = () => {
    const parsed = decodeBean(importCode);
    if (!parsed) { setImportError("That code doesn't look right. Make sure you copied the full thing."); return; }
    onImportCode(parsed);
    onClose();
  };

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="share-sheet-header">
          <div className="share-sheet-title">{importOnly ? "Import a Bean" : "Share Bean"}</div>
          <button className="share-sheet-close" onClick={onClose}>✕</button>
        </div>

        {!importMode ? (
          <>
            <div className="share-bean-preview">
              <div className="share-bean-brand">{bean.brand || "Unknown Roaster"}</div>
              <div className="share-bean-name">{bean.name || bean.origin || "Unnamed Bean"}</div>
            </div>

            <div className="share-options">
              {/* Image card */}
              <div className="share-option" onClick={!generating ? downloadCard : undefined}>
                <div className="share-option-icon">◻</div>
                <div className="share-option-text">
                  <div className="share-option-label">{generating ? "Generating..." : "Download Image Card"}</div>
                  <div className="share-option-desc">A rich visual card with the flavor wheel, scores, and tasting notes. Screenshot and share anywhere.</div>
                </div>
                {!generating && <div className="share-option-arrow">↓</div>}
                {generating && <div className="spin" style={{ width: 14, height: 14, borderColor: "var(--gold-dim)", borderTopColor: "var(--gold)" }} />}
              </div>

              {/* Shareable code */}
              <div className="share-option" onClick={copyCode}>
                <div className="share-option-icon">◈</div>
                <div className="share-option-text">
                  <div className="share-option-label">{copied ? "Copied!" : "Copy Share Code"}</div>
                  <div className="share-option-desc">Share this code with a friend so they can import this exact bean into their Craft & Cup.</div>
                  <div className="share-code-preview">{shortCode}</div>
                </div>
                <div className="share-option-arrow" style={{ color: copied ? "var(--green)" : "var(--gold)" }}>
                  {copied ? "✓" : "⎘"}
                </div>
              </div>
            </div>

            <button className="share-import-toggle" onClick={() => setImportMode(true)}>
              Import a bean from a friend instead
            </button>
          </>
        ) : (
          <div className="share-import">
            <div className="share-import-label">Paste a share code from a friend</div>
            <textarea
              className="share-import-input"
              placeholder="Paste the full share code here..."
              value={importCode}
              onChange={(e) => { setImportCode(e.target.value); setImportError(""); }}
              rows={4}
            />
            {importError && <div className="share-import-error">{importError}</div>}
            <div className="share-import-actions">
              <button className="btn-primary" onClick={handleImport}>Import Bean</button>
              <button className="btn-ghost" onClick={() => { setImportMode(false); setImportError(""); setImportCode(""); }}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Bean Journal ------------------------------------------------------------
const STORAGE_KEY = "craft_and_cup_beans_v1";
const ROAST_LEVELS = ["Light", "Light-Medium", "Medium", "Medium-Dark", "Dark", "Extra Dark"];

const emptyBean = () => ({
  id: Date.now(),
  brand: "", name: "", origin: "",
  roast: "Medium",
  brewMethod: "Pour Over / V60",
  notes: "", flavorText: "",
  flavorData: null,
  scores: { ...DEFAULT_SCORES },
  createdAt: new Date().toISOString(),
});

const EXAMPLE_BEAN = {
  id: 1,
  brand: "Onyx Coffee Lab",
  name: "Southern Weather",
  origin: "Ethiopia Yirgacheffe",
  roast: "Light",
  brewMethod: "Pour Over / V60",
  notes: "Picked this up at the roastery in Bentonville. Incredibly fresh roasted just four days before I brewed it. The bloom was wild, really active CO2 off-gassing. Brewed at 93°C with a 1:15.5 ratio, 30s bloom then four pours.",
  flavorText: "Opens with an intensely bright wild blackberry note — jammy but with that raw bramble edge you get from a really fresh natural process. Underneath that there's a distinct blood orange citrus that's almost like biting into the pith, not just the juice. As it cools a white peach emerges, really delicate and floral. The aroma is all white jasmine and dried rose, almost perfume-like. Mid-palate there's a brown sugar sweetness that reminds me of demerara more than anything refined. The finish is long with a dark bittersweet chocolate note — like a 70% cacao bar — and just a whisper of pipe tobacco earthiness that grounds the whole thing. Really remarkable complexity.",
  flavorData: {
    summary: "A kaleidoscopic cup of wild blackberry and blood orange that unfolds into white peach and jasmine, anchored by demerara sweetness and a long bittersweet cacao finish.",
    mappings: [
      { path: ["Fruity", "Berry", "Blackberry", "Wild Blackberry"], weight: 3 },
      { path: ["Fruity", "Citrus", "Orange", "Blood Orange"], weight: 3 },
      { path: ["Fruity", "Stone Fruit", "Peach", "White Peach"], weight: 2 },
      { path: ["Floral", "Jasmine"], weight: 2 },
      { path: ["Floral", "Rose", "Dried Rose"], weight: 1 },
      { path: ["Sweet", "Caramel", "Brown Sugar", "Demerara"], weight: 2 },
      { path: ["Sweet", "Chocolate", "Dark Chocolate"], weight: 2 },
      { path: ["Earthy", "Tobacco"], weight: 1 },
      { path: ["Acidic", "Crisp"], weight: 1 },
    ],
  },
  scores: { aroma: 9, acidity: 8, body: 5, sweetness: 7, finish: 8, balance: 7, bitterness: 6 },
  createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  isExample: true,
};

// --- Bean Card Export ---------------------------------------------------------
function BeanCardExport({ bean, onClose }) {
  const canvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [rendering, setRendering] = useState(true);

  const overall = bean.scores
    ? Math.round((Object.values(bean.scores).reduce((s, v) => s + v, 0) / SCORE_ATTRIBUTES.length) * 10) / 10
    : null;

  const scoreColor = (v) => v >= 8 ? "#8aaa6a" : v >= 6 ? "#d4b05a" : v >= 4 ? "#a89880" : "#d06860";

  const accent = bean.flavorData?.mappings?.[0]
    ? FLAVOR_TAXONOMY[bean.flavorData.mappings[0].top]?.color || "#d4b05a"
    : "#d4b05a";

  // Draw the card onto a canvas and convert to image
  useEffect(() => {
    const W = 900, H = 600;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W * 2;   // 2x for retina
    canvas.height = H * 2;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);

    const bg = "#0a0a0a", fg = "#ede5d8", muted = "#888", faint = "#333";

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Accent bar
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, accent + "44");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 4, H);

    // Subtle color splash in top right
    const splash = ctx.createRadialGradient(W * 0.75, 80, 0, W * 0.75, 80, 280);
    splash.addColorStop(0, accent + "12");
    splash.addColorStop(1, "transparent");
    ctx.fillStyle = splash;
    ctx.fillRect(0, 0, W, H);

    // -- Header --
    let y = 44;
    ctx.font = "300 11px 'Arial'";
    ctx.fillStyle = "#666";
    ctx.fillText((bean.brand || "Unknown Roaster").toUpperCase(), 28, y);

    y += 38;
    // Bean name — large
    const name = bean.name || bean.origin || "Unnamed Bean";
    ctx.font = `600 ${name.length > 18 ? 36 : 44}px Georgia`;
    ctx.fillStyle = fg;
    ctx.fillText(name, 28, y);

    y += 8;
    // Divider
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, y + 14); ctx.lineTo(W - 28, y + 14); ctx.stroke();
    y += 28;

    // Summary
    if (bean.flavorData?.summary) {
      ctx.font = `italic 13px Georgia`;
      ctx.fillStyle = muted;
      const words = `"${bean.flavorData.summary}"`.split(" ");
      let line = "", lineY = y;
      const maxW = 520;
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, 28, lineY);
          line = word + " ";
          lineY += 18;
        } else { line = test; }
      }
      ctx.fillText(line, 28, lineY);
      y = lineY + 28;
    }

    // -- Left column: details + scores --
    const colX = 28, colW = 340;

    // Details
    ctx.font = "300 9px Arial";
    ctx.fillStyle = "#d4b05a";
    ctx.fillText("DETAILS", colX, y);
    y += 14;

    const details = [
      bean.roast && ["ROAST", bean.roast],
      bean.origin && ["ORIGIN", bean.origin],
      bean.brewMethod && ["BREW", bean.brewMethod],
    ].filter(Boolean);

    for (const [label, val] of details) {
      ctx.font = "300 9px Arial";
      ctx.fillStyle = "#555";
      ctx.fillText(label, colX, y);
      ctx.font = "300 13px Arial";
      ctx.fillStyle = "#c8bfaf";
      ctx.fillText(val, colX + 50, y);
      y += 18;
    }
    y += 8;

    // Flavor chips (text only)
    if (bean.flavorData?.mappings?.length > 0) {
      ctx.font = "300 9px Arial";
      ctx.fillStyle = "#d4b05a";
      ctx.fillText("DETECTED FLAVORS", colX, y);
      y += 14;

      let chipX = colX;
      const chips = bean.flavorData.mappings.slice(0, 6);
      for (const m of chips) {
        const color = FLAVOR_TAXONOMY[m.top]?.color || "#888";
        const label = m.specific || m.mid || m.top;
        ctx.font = "300 10px Arial";
        const tw = ctx.measureText(label).width;
        const pw = tw + 14, ph = 18;
        if (chipX + pw > colX + colW) { chipX = colX; y += 22; }
        ctx.strokeStyle = color + "88";
        ctx.lineWidth = 1;
        ctx.strokeRect(chipX, y - 13, pw, ph);
        ctx.fillStyle = color;
        ctx.fillText(label, chipX + 7, y);
        chipX += pw + 6;
      }
      y += 24;
    }

    // Scores
    if (bean.scores && overall !== null) {
      ctx.font = "300 9px Arial";
      ctx.fillStyle = "#d4b05a";
      ctx.fillText("TASTING SCORES", colX, y);
      y += 10;

      ctx.font = `600 32px Georgia`;
      ctx.fillStyle = scoreColor(overall);
      ctx.fillText(overall.toString(), colX, y + 28);
      ctx.font = "300 11px Arial";
      ctx.fillStyle = "#555";
      ctx.fillText("/10 overall", colX + 42, y + 24);
      y += 42;

      for (const attr of SCORE_ATTRIBUTES) {
        const val = bean.scores[attr.key] ?? 5;
        const barW = 160;
        ctx.font = "300 9px Arial";
        ctx.fillStyle = "#555";
        ctx.fillText(attr.label.toUpperCase(), colX, y);
        ctx.fillStyle = "#1e1e1e";
        ctx.fillRect(colX + 68, y - 8, barW, 3);
        ctx.fillStyle = scoreColor(val);
        ctx.fillRect(colX + 68, y - 8, (val / 10) * barW, 3);
        ctx.font = "300 10px Arial";
        ctx.fillStyle = scoreColor(val);
        ctx.fillText(val.toString(), colX + 68 + barW + 6, y);
        y += 16;
      }
    }

    // -- Right column: flavor wheel (SVG → image) --
    const wheelX = 490, wheelY = 110, wheelSize = 340;

    // Draw wheel segments from mappings
    const mappings = bean.flavorData?.mappings || [];
    if (mappings.length > 0) {
      ctx.font = "300 9px Arial";
      ctx.fillStyle = "#d4b05a";
      ctx.fillText("FLAVOR WHEEL", wheelX + wheelSize / 2 - 36, 100);

      const cx = wheelX + wheelSize / 2, cy = wheelY + wheelSize / 2;
      const r0 = 28, r1 = 72, r2 = 115, r3 = 155;

      const topGroups = {};
      for (const m of mappings) {
        const top = m.top || (m.path && m.path[0]);
        const mid = m.mid || (m.path && m.path[1]);
        const specific = m.specific || (m.path && m.path[m.path.length - 1]);
        if (!top) continue;
        if (!topGroups[top]) topGroups[top] = { weight: 0, mids: {} };
        topGroups[top].weight += m.weight;
        if (mid) {
          if (!topGroups[top].mids[mid]) topGroups[top].mids[mid] = { weight: 0, specifics: {} };
          topGroups[top].mids[mid].weight += m.weight;
          if (specific) topGroups[top].mids[mid].specifics[specific] = (topGroups[top].mids[mid].specifics[specific] || 0) + m.weight;
        }
      }

      const totalW = Object.values(topGroups).reduce((s, g) => s + g.weight, 0);
      const hexAlpha = (hex, a) => {
        const n = parseInt(hex.replace("#", ""), 16);
        const r = (n >> 16) & 255, g2 = (n >> 8) & 255, b2 = n & 255;
        return `rgba(${r},${g2},${b2},${a})`;
      };

      const drawRing = (r1i, r2i, startA, endA, fill) => {
        const GAP = (endA - startA) > 0.1 ? 0.01 : 0;
        ctx.beginPath();
        ctx.arc(cx, cy, r2i, startA + GAP, endA - GAP);
        ctx.arc(cx, cy, r1i, endA - GAP, startA + GAP, true);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = "#0a0a0a";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      };

      let angle = -Math.PI / 2;
      for (const [topName, topData] of Object.entries(topGroups)) {
        const tax = FLAVOR_TAXONOMY[topName];
        const color = tax?.color || "#888";
        const span = (topData.weight / totalW) * 2 * Math.PI;
        const topEnd = angle + span;

        drawRing(r0, r1, angle, topEnd, color);

        let midA = angle;
        for (const [, midData] of Object.entries(topData.mids)) {
          const mSpan = (midData.weight / topData.weight) * span;
          const midEnd = midA + mSpan;
          drawRing(r1, r2, midA, midEnd, hexAlpha(color, 0.7));
          let specA = midA;
          for (const [, specW] of Object.entries(midData.specifics)) {
            const sSpan = (specW / midData.weight) * mSpan;
            drawRing(r2, r3, specA, specA + sSpan, hexAlpha(color, 0.4));
            specA += sSpan;
          }
          if (Object.keys(midData.specifics).length === 0) drawRing(r2, r3, midA, midEnd, hexAlpha(color, 0.3));
          midA = midEnd;
        }
        if (Object.keys(topData.mids).length === 0) {
          drawRing(r1, r2, angle, topEnd, hexAlpha(color, 0.6));
          drawRing(r2, r3, angle, topEnd, hexAlpha(color, 0.3));
        }
        angle = topEnd;
      }

      // Center circle
      ctx.beginPath();
      ctx.arc(cx, cy, r0, 0, Math.PI * 2);
      ctx.fillStyle = "#0a0a0a";
      ctx.fill();
      ctx.font = "300 8px Arial";
      ctx.fillStyle = "#d4b05a";
      ctx.textAlign = "center";
      ctx.fillText("FLAVOR", cx, cy - 3);
      ctx.fillText("WHEEL", cx, cy + 8);
      ctx.textAlign = "left";
    }

    // -- Footer --
    const footY = H - 20;
    ctx.strokeStyle = "#1e1e1e";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, footY - 12); ctx.lineTo(W - 28, footY - 12); ctx.stroke();

    ctx.font = `600 12px Georgia`;
    ctx.fillStyle = "#d4b05a";
    ctx.fillText("Craft & Cup", 28, footY);

    ctx.font = "300 10px Arial";
    ctx.fillStyle = "#444";
    const dateStr = new Date(bean.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const dateW = ctx.measureText(dateStr).width;
    ctx.fillText(dateStr, W - 28 - dateW, footY);

    // Convert to image
    setImgSrc(canvas.toDataURL("image/png"));
    setRendering(false);
  }, [bean]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = imgSrc;
    a.download = `${(bean.name || bean.brand || "bean").replace(/\s+/g, "-").toLowerCase()}-craft-and-cup.png`;
    a.click();
  };

  return (
    <div className="export-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="export-modal">
        <div className="export-modal-header">
          <span className="export-modal-title">Bean Card</span>
          <div className="export-modal-actions">
            {!rendering && (
              <button className="btn-primary" style={{ padding: "8px 16px", fontSize: 12 }} onClick={handleDownload}>
                ↓ Download PNG
              </button>
            )}
            <button className="btn-ghost" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="export-hint">
          <strong>iPhone:</strong> Long press the image below and tap "Save to Photos" — or use the Download button to save to Files.
        </div>

        {/* Hidden canvas for rendering */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Rendered image — long press to save on iPhone */}
        <div className="export-img-wrap">
          {rendering ? (
            <div className="export-rendering">
              <div className="spin" />
              <span>Rendering card...</span>
            </div>
          ) : (
            <img
              src={imgSrc}
              alt="Bean card"
              className="export-img"
              style={{ width: "100%", display: "block", userSelect: "none" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// --- Compare View -------------------------------------------------------------
function CompareView({ beanA, beanB, onBack, onViewBean }) {
  const overallScore = (bean) => bean.scores
    ? Math.round((Object.values(bean.scores).reduce((s, v) => s + v, 0) / SCORE_ATTRIBUTES.length) * 10) / 10
    : null;

  const scoreColor = (v) => v >= 8 ? "var(--green)" : v >= 6 ? "var(--gold)" : v >= 4 ? "var(--muted)" : "var(--red)";

  const BeanCol = ({ bean }) => {
    const score = overallScore(bean);
    const accent = bean.flavorData?.mappings?.[0]
      ? FLAVOR_TAXONOMY[bean.flavorData.mappings[0].top]?.color || "var(--gold)"
      : "var(--gold)";
    return (
      <div className="cmp-col">
        <div className="cmp-col-accent" style={{ background: accent }} />
        <div className="cmp-brand">{bean.brand || "Unknown"}</div>
        <div className="cmp-name">{bean.name || bean.origin || "Unnamed"}</div>
        <div className="cmp-tags">
          {[bean.roast, bean.origin, bean.brewMethod].filter(Boolean).map((t) => (
            <span className="cmp-tag" key={t}>{t}</span>
          ))}
        </div>
        {score !== null && (
          <div className="cmp-overall" style={{ color: scoreColor(score) }}>
            {score}<span className="cmp-overall-denom">/10</span>
          </div>
        )}
        <div className="cmp-wheel-wrap">
          <FlavorWheel mappings={bean.flavorData?.mappings || []} size={280} />
        </div>
        {bean.flavorData?.summary && (
          <div className="cmp-summary">"{bean.flavorData.summary}"</div>
        )}
        {bean.scores && (
          <div className="cmp-scores">
            {SCORE_ATTRIBUTES.map((attr) => {
              const val = bean.scores[attr.key] ?? 5;
              return (
                <div className="cmp-score-row" key={attr.key}>
                  <span className="cmp-score-label">{attr.label}</span>
                  <div className="cmp-score-bar-track">
                    <div className="cmp-score-bar-fill" style={{ width: `${(val / 10) * 100}%`, background: scoreColor(val) }} />
                  </div>
                  <span className="cmp-score-val" style={{ color: scoreColor(val) }}>{val}</span>
                </div>
              );
            })}
          </div>
        )}
        {bean.flavorData?.mappings?.length > 0 && (
          <div className="cmp-flavor-section">
            <div className="cmp-section-label">Detected Flavors</div>
            <div className="cmp-flavor-chips">
              {bean.flavorData.mappings.map((m, i) => {
                const color = FLAVOR_TAXONOMY[m.top]?.color || "#888";
                return (
                  <span key={i} className="cmp-fchip" style={{ background: color + "20", borderColor: color + "55", color }}>
                    {m.specific || m.mid || m.top}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {bean.flavorText && (
          <div className="cmp-notes-section">
            <div className="cmp-section-label">Tasting Notes</div>
            <div className="cmp-notes">"{bean.flavorText}"</div>
          </div>
        )}
        <button className="btn-ghost" style={{ marginTop: 16, width: "100%" }} onClick={() => onViewBean(bean)}>
          View Full Profile →
        </button>
      </div>
    );
  };

  return (
    <div className="page">
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 28 }}>← Back to Collection</button>
      <div className="cmp-header">
        <div className="cmp-title">Comparison</div>
        <div className="cmp-subtitle">{beanA.name || beanA.brand || "Bean A"} vs {beanB.name || beanB.brand || "Bean B"}</div>
      </div>
      <div className="cmp-layout">
        <BeanCol bean={beanA} />
        <div className="cmp-divider">
          <div className="cmp-vs">vs</div>
        </div>
        <BeanCol bean={beanB} />
      </div>
    </div>
  );
}

// --- Bean Journal -------------------------------------------------------------
function BeanJournal({ onBrewCalc, onBeansChange, addTrigger, showToast }) {
  const [beans, setBeans] = useState([]);
  const [view, setView] = useState("list");
  const [activeBean, setActiveBean] = useState(null);
  const [compareBean, setCompareBean] = useState(null); // bean to compare against
  const [comparePick, setComparePick] = useState(false); // picking mode active
  const [showExportCard, setShowExportCard] = useState(false);
  const [form, setForm] = useState(emptyBean());
  const [analyzing, setAnalyzing] = useState(false);
  const [debounced, setDebounced] = useState(false);
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState(false);
  const analysisLog = useRef([]);

  // Search / filter / sort
  const [search, setSearch] = useState("");
  const [filterRoast, setFilterRoast] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [showFilters, setShowFilters] = useState(false);
  const scoresRef = useRef(null);

  const SORT_OPTIONS = [
    { value: "date",  label: "Date logged" },
    { value: "score", label: "Score (highest)" },
    { value: "roast", label: "Roast level" },
    { value: "alpha", label: "Alphabetical" },
  ];

  const ROAST_ORDER = ["Light", "Light-Medium", "Medium", "Medium-Dark", "Dark", "Extra Dark"];

  const updateBeans = (newBeans) => {
    setBeans(newBeans);
    onBeansChange?.(newBeans);
  };

  const filteredBeans = beans
    .filter((b) => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        (b.name || "").toLowerCase().includes(q) ||
        (b.brand || "").toLowerCase().includes(q) ||
        (b.origin || "").toLowerCase().includes(q);
      const matchesRoast = !filterRoast || b.roast === filterRoast;
      const matchesMethod = !filterMethod || b.brewMethod === filterMethod;
      return matchesSearch && matchesRoast && matchesMethod;
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "score") {
        const scoreA = a.scores ? Object.values(a.scores).reduce((s, v) => s + v, 0) / SCORE_ATTRIBUTES.length : 0;
        const scoreB = b.scores ? Object.values(b.scores).reduce((s, v) => s + v, 0) / SCORE_ATTRIBUTES.length : 0;
        return scoreB - scoreA;
      }
      if (sortBy === "roast") return ROAST_ORDER.indexOf(a.roast) - ROAST_ORDER.indexOf(b.roast);
      if (sortBy === "alpha") return (a.name || a.brand || "").localeCompare(b.name || b.brand || "");
      return 0;
    });

  const activeFilters = [filterRoast, filterMethod].filter(Boolean).length;

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        // Always replace the example bean with the latest version
        const withFresh = parsed.map(b => b.isExample ? EXAMPLE_BEAN : b);
        setBeans(withFresh); onBeansChange?.(withFresh);
      } else {
        setBeans([EXAMPLE_BEAN]);
        onBeansChange?.([EXAMPLE_BEAN]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(beans));
  }, [beans]);

  const saveBean = async () => {
    if (debounced) return;
    setDebounced(true);
    setTimeout(() => setDebounced(false), 3000);

    // Rate limit: max 10 API calls per hour per session
    const now = Date.now();
    analysisLog.current = analysisLog.current.filter(t => now - t < 60 * 60 * 1000);
    if (analysisLog.current.length >= 10) {
      setError("You've analyzed 10 beans this hour. Take a sip and try again later.");
      setDebounced(false);
      return;
    }

    if (!form.brand && !form.name) { setError("Add at least a brand or bean name."); return; }
    if (!form.flavorText.trim()) { setError("Describe the flavor notes first."); return; }
    if (form.flavorText.trim().length < 30) { setError("Add a bit more detail to your flavor notes — at least 30 characters."); return; }
    const sanitizedText = form.flavorText.trim().slice(0, 500).replace(/[^\w\s.,!?'"()-]/g, " ");
    setError(""); setApiError(false); setAnalyzing(true);
    try {
      const cached = beans.find(
        (b) => b.flavorData && b.flavorText?.trim() === form.flavorText.trim() && b.id !== form.id
      );
      if (!cached) analysisLog.current.push(Date.now());
      const result = cached ? cached.flavorData : await mapFlavorsWithAI(sanitizedText);
      const bean = { ...form, id: form.id || Date.now(), flavorData: result, createdAt: new Date().toISOString() };
      updateBeans((() => {
        const exists = beans.find((b) => b.id === bean.id);
        return exists ? beans.map((b) => b.id === bean.id ? bean : b) : [bean, ...beans];
      })());
      setActiveBean(bean); setView("detail");
      showToast?.("Bean saved!");
    } catch { setError("Couldn't analyze flavors. Check your connection and try again."); setApiError(true); }
    setAnalyzing(false);
  };

  const deleteBean = (id) => { updateBeans(beans.filter((b) => b.id !== id)); setView("list"); };
  const startEdit = (bean) => { setForm({ ...bean }); setError(""); setView("add"); };
  const startAdd = () => { setForm(emptyBean()); setError(""); setView("add"); };

  useEffect(() => { if (addTrigger > 0) startAdd(); }, [addTrigger]);

  const [showShare, setShowShare] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleImportCode = (parsed) => {
    const bean = { ...emptyBean(), ...parsed, id: Date.now(), createdAt: new Date().toISOString() };
    updateBeans([bean, ...beans]);
    setActiveBean(bean);
    setShowShare(false);
    setView("detail");
  };

  const updateScores = (beanId, newScores) => {
    const next = beans.map((b) => b.id === beanId ? { ...b, scores: newScores } : b);
    updateBeans(next);
    setActiveBean((prev) => prev?.id === beanId ? { ...prev, scores: newScores } : prev);
  };

  if (view === "add") return (
    <div className="page">
      <div className="form-header">
        <button className="btn-ghost" onClick={() => setView("list")}>← Back</button>
        <h2 className="form-title">{form.flavorData ? "Edit Bean" : "Log a Bean"}</h2>
      </div>
      <div className="form-grid">
        {[
          { label: "Brand / Roaster", key: "brand", placeholder: "e.g. Onyx Coffee Lab" },
          { label: "Bean / Blend Name", key: "name", placeholder: "e.g. Southern Weather" },
          { label: "Origin", key: "origin", placeholder: "e.g. Ethiopia Yirgacheffe" },
        ].map(({ label, key, placeholder }) => (
          <div className="form-group" key={key}>
            <label>{label}</label>
            <input placeholder={placeholder} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}
        <div className="form-group">
          <label>Roast Level</label>
          <select value={form.roast} onChange={(e) => setForm({ ...form, roast: e.target.value })}>
            {ROAST_LEVELS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-group full">
          <label>Brew Method</label>
          <select value={form.brewMethod} onChange={(e) => setForm({ ...form, brewMethod: e.target.value })}>
            {Object.keys(BREW_CONFIGS).sort().map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="form-group full">
          <label>Personal Notes</label>
          <textarea rows="3" placeholder="Where did you get it? Any context about the roast or farm..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="form-group full">
          <label>Flavor Notes <span style={{ color: "#c9a84c" }}>✦ AI-mapped</span></label>
          <textarea rows="4" placeholder={'Write naturally "Tastes jammy, like blackberry and dark plum, with a long chocolate finish and a hint of orange peel."'}
            value={form.flavorText} onChange={(e) => setForm({ ...form, flavorText: e.target.value.slice(0, 500) })} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <div className="hint">Describe what you taste in plain language. The wheel builds itself.</div>
            <div style={{ fontSize: 10, color: form.flavorText.length < 30 ? "var(--muted3)" : form.flavorText.length > 450 ? "var(--red)" : "var(--muted4)", flexShrink: 0, marginLeft: 8 }}>
              {form.flavorText.length}/500{form.flavorText.length < 30 ? ` (${30 - form.flavorText.length} more to go)` : ""}
            </div>
          </div>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        {analyzing
          ? <div className="analyzing"><div className="spin" />Mapping your flavors...</div>
          : apiError
            ? <><button className="btn-primary" onClick={saveBean}>↺ Retry</button><button className="btn-ghost" onClick={() => setView("list")}>Cancel</button></>
            : <><button className="btn-primary" onClick={saveBean} disabled={debounced} style={{ opacity: debounced ? 0.5 : 1 }}>Build Flavor Wheel →</button><button className="btn-ghost" onClick={() => setView("list")}>Cancel</button></>}
      </div>
    </div>
  );

  if (view === "detail" && activeBean) {
    const bean = activeBean;
    return (
      <div className="page">
        <button className="btn-ghost" onClick={() => setView("list")} style={{ marginBottom: 28 }}>← Collection</button>
        <div className="detail-layout">
          <div className="detail-left">
            <div className="detail-brand">{bean.brand || "Unknown Roaster"}</div>
            <div className="detail-name">{bean.name || bean.origin || "Unnamed Bean"}</div>
            <div className="detail-tags">
              {[bean.roast && `${bean.roast} Roast`, bean.origin, bean.brewMethod].filter(Boolean).map((t) => (
                <span className="dtag" key={t}>{t}</span>
              ))}
            </div>
            {bean.flavorData?.summary && (
              <div className="detail-block">
                <div className="detail-block-label">Profile</div>
                <div className="detail-summary">{bean.flavorData.summary}</div>
              </div>
            )}
            {bean.flavorData?.mappings?.length > 0 && (
              <div className="detail-block">
                <div className="detail-block-label">Detected Flavors</div>
                <div className="flavor-chips">
                  {bean.flavorData.mappings.map((m, i) => (
                    <span key={i} className="fchip" style={{
                      background: (FLAVOR_TAXONOMY[m.path ? m.path[0] : m.top]?.color || "#888") + "20",
                      borderColor: (FLAVOR_TAXONOMY[m.path ? m.path[0] : m.top]?.color || "#888") + "55",
                      color: FLAVOR_TAXONOMY[m.path ? m.path[0] : m.top]?.color || "#888",
                    }}>
                      {m.path ? m.path[m.path.length-1] : (m.specific || m.mid || m.top)}
                      <span style={{ opacity: 0.5, marginLeft: 4 }}>{"•".repeat(m.weight)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {bean.flavorText && (
              <div className="detail-block">
                <div className="detail-block-label">Raw Tasting Notes</div>
                <div className="detail-notes">"{bean.flavorText}"</div>
              </div>
            )}
            {bean.notes && (
              <div className="detail-block">
                <div className="detail-block-label">Notes</div>
                <div className="detail-notes">{bean.notes}</div>
              </div>
            )}
            <div className="detail-actions">
              {bean.brewMethod && BREW_CONFIGS[bean.brewMethod] && (
                <button className="btn-brew-primary" onClick={() => onBrewCalc && onBrewCalc(bean.brewMethod)}>
                  <span className="btn-brew-icon">{BREW_CONFIGS[bean.brewMethod].icon}</span>
                  Brew This →
                </button>
              )}
            </div>
            <div className="detail-actions-secondary">
              <button className="btn-ghost" onClick={() => setShowShare(true)}>Share</button>
              <button className="btn-ghost" onClick={() => startEdit(bean)}>Edit</button>
              <button className="btn-ghost" onClick={() => {
                setActiveBean(bean);
                setComparePick(true);
                setView("list");
              }}>Compare</button>
              <button className="btn-ghost" onClick={() => setShowExportCard(true)}>Export Card</button>
              <button className="btn-ghost" onClick={() => scoresRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                Update Scores
              </button>
              {confirmDelete === bean.id ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--muted2)" }}>Are you sure?</span>
                  <button className="btn-danger" onClick={() => { deleteBean(bean.id); setConfirmDelete(null); }}>Yes, delete</button>
                  <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                </div>
              ) : (
                <button className="btn-danger" onClick={() => setConfirmDelete(bean.id)}>Delete</button>
              )}
            </div>
          </div>
          <div className="wheel-col">
            <div className="wheel-label">Flavor Wheel</div>
            <div className="wheel-svg-wrap">
              <FlavorWheel mappings={bean.flavorData?.mappings || []} />
            </div>
            <div style={{ marginTop: 14, marginBottom: 4 }}>
              <div style={{ fontSize: 9, color: "var(--muted4)", letterSpacing: "2px", textTransform: "uppercase", textAlign: "center", marginBottom: 10 }}>How to read this wheel</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  { ring: "Inner", desc: "Broad category", example: "Fruity, Sweet, Floral", size: 10 },
                  { ring: "Middle", desc: "Flavour group", example: "Berry, Citrus, Caramel", size: 8 },
                  { ring: "Outer", desc: "Specific note", example: "Blackberry, Bergamot", size: 6 },
                ].map(({ ring, desc, example, size }) => (
                  <div key={ring} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: size * 2, height: size * 2, borderRadius: "50%", background: "var(--border3)", flexShrink: 0, border: "1px solid var(--border3)" }} />
                    <div>
                      <span style={{ fontSize: 10, color: "var(--muted2)" }}>{ring} ring</span>
                      <span style={{ fontSize: 10, color: "var(--muted4)" }}> — {desc}</span>
                      <div style={{ fontSize: 9, color: "var(--muted5)", fontStyle: "italic" }}>{example}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 9, color: "var(--muted5)", fontStyle: "italic", textAlign: "center", lineHeight: 1.6 }}>
                Larger segments = more prominent in your notes
              </div>
            </div>
            <div ref={scoresRef}>
              <TastingScores
                scores={bean.scores || { ...DEFAULT_SCORES }}
                onChange={(newScores) => updateScores(bean.id, newScores)}
              />
            </div>
          </div>
        </div>
        {showShare && (
          <ShareSheet
            bean={bean}
            onClose={() => setShowShare(false)}
            onImportCode={handleImportCode}
          />
        )}
        {showExportCard && (
          <BeanCardExport bean={bean} onClose={() => setShowExportCard(false)} />
        )}
      </div>
    );
  }

  if (view === "compare" && activeBean && compareBean) {
    return <CompareView
      beanA={activeBean}
      beanB={compareBean}
      onBack={() => { setView("list"); setCompareBean(null); setActiveBean(null); }}
      onViewBean={(b) => { setActiveBean(b); setCompareBean(null); setView("detail"); }}
    />;
  }

  return (
    <div className="page">
      {beans.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">☕</div>
          <div className="empty-head">No beans logged yet</div>
          <div className="empty-sub">Add your first bean to start building your flavor library.</div>
          <button className="btn-primary" onClick={startAdd}>+ Log Your First Bean</button>
        </div>
      ) : (
        <>
          <div className="list-header">
            <div>
              <div className="list-title">Your Collection</div>
              <div className="list-sub">
                {filteredBeans.length === beans.length
                  ? `${beans.length} bean${beans.length !== 1 ? "s" : ""}`
                  : `${filteredBeans.length} of ${beans.length} beans`}
              </div>
            </div>
            <button className="btn-ghost" onClick={() => setShowShare(true)}>Import a Bean</button>
          </div>

          {/* Compare pick mode banner */}
          {comparePick && activeBean && (
            <div className="compare-banner">
              <div className="compare-banner-text">
                <span className="compare-banner-icon">⇄</span>
                Comparing <strong>{activeBean.name || activeBean.brand || "bean"}</strong> - pick a second bean
              </div>
              <button className="compare-banner-cancel" onClick={() => { setComparePick(false); setActiveBean(null); }}>Cancel</button>
            </div>
          )}

          {/* Search + filter toolbar */}
          <div className="journal-toolbar">
            <div className="journal-search-wrap">
              <span className="journal-search-icon">⌕</span>
              <input
                className="journal-search"
                placeholder="Search by name, brand, or origin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="journal-search-clear" onClick={() => setSearch("")}>✕</button>
              )}
            </div>
            <div className="journal-toolbar-right">
              <button
                className={`journal-filter-btn ${showFilters || activeFilters > 0 ? "active" : ""}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filter {activeFilters > 0 && <span className="filter-badge">{activeFilters}</span>}
              </button>
              <select
                className="journal-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="filter-panel">
              <div className="filter-group">
                <div className="filter-group-label">Roast Level</div>
                <div className="filter-pills">
                  {ROAST_LEVELS.map((r) => (
                    <button
                      key={r}
                      className={`filter-pill ${filterRoast === r ? "active" : ""}`}
                      onClick={() => setFilterRoast(filterRoast === r ? "" : r)}
                    >{r}</button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <div className="filter-group-label">Brew Method</div>
                <div className="filter-pills">
                  {Object.keys(BREW_CONFIGS).sort().map((m) => (
                    <button
                      key={m}
                      className={`filter-pill ${filterMethod === m ? "active" : ""}`}
                      onClick={() => setFilterMethod(filterMethod === m ? "" : m)}
                    >
                      {BREW_CONFIGS[m].icon} {m}
                    </button>
                  ))}
                </div>
              </div>
              {activeFilters > 0 && (
                <button className="filter-clear" onClick={() => { setFilterRoast(""); setFilterMethod(""); }}>
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {filteredBeans.length === 0 ? (
            <div className="empty" style={{ padding: "48px 0" }}>
              <div className="empty-head">No matches found</div>
              <div className="empty-sub">Try adjusting your search or filters.</div>
              <button className="btn-ghost" onClick={() => { setSearch(""); setFilterRoast(""); setFilterMethod(""); }}>Clear all</button>
            </div>
          ) : (
            <div className="bean-grid">
              {filteredBeans.map((bean) => {
                const accent = bean.flavorData?.mappings?.[0]
                  ? FLAVOR_TAXONOMY[bean.flavorData.mappings[0].path?.[0] || bean.flavorData.mappings[0].top]?.color || "var(--gold)"
                  : "var(--gold)";
                return (
                  <div key={bean.id} className={`bean-card ${comparePick && activeBean?.id === bean.id ? "compare-self" : ""}`} style={{ "--acc": accent }}
                    onClick={() => {
                      if (comparePick && activeBean) {
                        if (bean.id === activeBean.id) return;
                        setCompareBean(bean);
                        setComparePick(false);
                        setView("compare");
                      } else {
                        setActiveBean(bean); setView("detail");
                      }
                    }}>
                    {comparePick && activeBean?.id !== bean.id && (
                      <div className="compare-card-hint">Tap to compare</div>
                    )}
                    {comparePick && activeBean?.id === bean.id && (
                      <div className="compare-card-hint self">Comparing this bean</div>
                    )}
                    {bean.isExample && <div className="bean-example-badge">Example</div>}
                    <div className="bc-brand">{bean.brand || "Unknown"}</div>
                    <div className="bc-name">{bean.name || bean.origin || "Unnamed"}</div>
                    <div className="bc-tags">
                      {[bean.roast, bean.origin, bean.brewMethod].filter(Boolean).map((t) => <span className="bctag" key={t}>{t}</span>)}
                    </div>
                    {bean.flavorData?.mappings?.length > 0 && (
                      <div className="bc-flavor-chips">
                        {bean.flavorData.mappings.slice(0, 3).map((m, i) => {
                          const color = FLAVOR_TAXONOMY[m.path ? m.path[0] : m.top]?.color || "#888";
                          return (
                            <span key={i} className="bc-flavor-chip" style={{ background: color + "18", borderColor: color + "55", color }}>
                              {m.path ? m.path[m.path.length-1] : (m.specific || m.mid || m.top)}
                            </span>
                          );
                        })}
                        {bean.flavorData.mappings.length > 3 && (
                          <span className="bc-flavor-chip" style={{ background: "var(--bg3)", borderColor: "var(--border2)", color: "var(--muted3)" }}>
                            +{bean.flavorData.mappings.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    {bean.scores && (
                      <div className="bc-score">
                        <span className="bc-score-num">
                          {Math.round((Object.values(bean.scores).reduce((s, v) => s + v, 0) / SCORE_ATTRIBUTES.length) * 10) / 10}
                        </span>
                        <span className="bc-score-denom">/10</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {showShare && (
        <ShareSheet
          bean={null}
          importOnly={true}
          onClose={() => setShowShare(false)}
          onImportCode={handleImportCode}
        />
      )}
    </div>
  );
}

// --- Guide / Tips Page -------------------------------------------------------

const GRIND_GUIDE = [
  { size: "Extra Coarse", color: "#c8a878", desc: "Visibly chunky, like cracked peppercorns or coarse sea salt. Almost no resistance when you rub it between your fingers. Used exclusively for cold brew — the 12-24 hour steep compensates for the open grind, and going finer would make the concentrate bitter and astringent.", methods: ["Cold Brew"] },
  { size: "Coarse",       color: "#b89060", desc: "Like rough kosher salt — distinct, irregular particles with plenty of space between them. Ideal for French Press because the full-immersion brew method needs a coarse grind to avoid over-extraction during the 4-minute steep. Also works well for cold brew concentrate.", methods: ["French Press", "Cold Brew"] },
  { size: "Medium-Coarse",color: "#c09858", desc: "Slightly finer than French Press but still quite open — closer to coarse beach sand. The Chemex uses a much thicker paper filter than a V60, which dramatically slows the flow rate. A coarser grind compensates for this, keeping brew time in range and preventing a bitter, over-extracted cup.", methods: ["Chemex"] },
  { size: "Medium",       color: "#b88848", desc: "The workhorse grind — consistent, uniform particles about the size of fine breadcrumbs. Drip machines are designed around this grind size, and it's the safest starting point for any new brew method. Not too fast, not too slow, extracts evenly with moderate heat and contact time.", methods: ["Drip Machine"] },
  { size: "Medium-Fine",  color: "#c09040", desc: "Finer than drip but not as dense as espresso — smooth to the touch with just a hint of texture. This is the sweet spot for pour over and AeroPress, where you want enough resistance to slow the flow and extend contact time, but not so much that it chokes the drawdown or over-extracts.", methods: ["Pour Over / V60", "AeroPress"] },
  { size: "Fine",         color: "#a87838", desc: "Dense and powdery-smooth, like fine table salt or granulated sugar. At this size, water has to work hard to push through the bed of grounds, which is exactly what espresso machines and Moka Pots need. That resistance is what creates pressure and forces fast, concentrated extraction in under 30 seconds.", methods: ["Espresso", "Moka Pot"] },
  { size: "Extra Fine",   color: "#906030", desc: "Almost a powder — finer than espresso, closer to flour or powdered sugar. The only common use is Turkish coffee, where grounds are simmered directly in water in a cezve and never filtered out. The ultra-fine grind is intentional: it settles to the bottom of the cup and becomes part of the drinking experience.", methods: ["Turkish Coffee"] },
];

const FAQ_SECTIONS = [
  {
    category: "The Basics",
    icon: "◎",
    items: [
      { q: "What is a brew ratio?", a: "The brew ratio is simply how much coffee you use relative to water, expressed as 1:X. A 1:15 ratio means 1 gram of coffee per 15 grams of water. A lower number (1:12) makes stronger coffee, a higher number (1:18) makes it lighter. Most pour overs sit around 1:15-1:16. Espresso is much more concentrated, typically 1:2." },
      { q: "Why do people weigh coffee instead of using scoops?", a: "Coffee beans vary wildly in density depending on roast level and origin. A scoop of light roast beans weighs noticeably more than a scoop of dark roast. Grams are consistent. Using a kitchen scale is the single biggest upgrade most beginners can make cheap ones work fine." },
      { q: "What does 'bloom' mean?", a: "When hot water first hits fresh coffee grounds, trapped CO₂ gases escape in a process called degassing. If you don't let this happen first, those gases can repel water and cause uneven extraction. Blooming means pouring a small amount of water (usually 2× the coffee weight) over the grounds and waiting 30-45 seconds before the main pour. You'll see it bubble and rise that's fresh coffee doing its thing." },
      { q: "Does water temperature actually matter?", a: "Yes, significantly. Water that's too hot (above 96°C/205°F) over-extracts and tastes bitter. Water that's too cool under-extracts and tastes sour or flat. Most brew methods aim for 90-95°C (194-203°F). A simple trick: boil water and let it sit off heat for 30-60 seconds. AeroPress intentionally uses cooler water (~85°C) to reduce bitterness." },
      { q: "What causes bitter coffee?", a: "Bitterness is almost always over-extraction too much of the bad compounds got pulled out. Common causes: grind too fine, water too hot, brew time too long, or too much coffee. Try grinding coarser first before adjusting anything else. Bitterness can also come from old or stale beans, or poor water quality." },
      { q: "What causes sour or flat coffee?", a: "Sourness means under-extraction not enough dissolved. Common causes: grind too coarse, water not hot enough, brew time too short, or too little coffee. Try grinding finer. Some acidity is desirable (especially in light roasts), but sharp sourness is a sign something's off." },
      { q: "What is the difference between light, medium, and dark roast?", a: "Roast level affects flavor more than origin. Light roasts are roasted less they retain more of the bean's original character: fruity, floral, complex, and higher in perceived acidity. Dark roasts develop more roasty, chocolatey, smoky flavors from the roasting process itself and have lower acidity. Medium roasts are the balance point. Neither is objectively better it depends what you enjoy." },
      { q: "Does grind freshness matter?", a: "A lot. Coffee starts going stale within minutes of being ground because the increased surface area rapidly oxidizes. Pre-ground coffee from a bag is significantly less vibrant than freshly ground beans. If you want noticeably better coffee without changing anything else, grind fresh right before brewing. Even a cheap hand grinder makes a real difference." },
    ],
  },
  {
    category: "Brew Method Guides",
    icon: "▽",
    items: [
      { q: "How do I brew Pour Over / V60?", a: "1. Heat water to 93°C (200°F). Rinse your paper filter with hot water and discard it.\n2. Add medium-fine ground coffee (1:15-1:16 ratio).\n3. Bloom: pour 2× coffee weight in water (e.g. 40g water for 20g coffee), wait 30-45s.\n4. Pour in slow, steady spirals from center outward. Aim for 3-4 pours total.\n5. Total brew time should be 2:30-3:30. If it drains faster, grind finer. If slower, grind coarser." },
      { q: "How do I brew with a Chemex?", a: "1. The Chemex uses a thicker filter than V60 pre-rinse it and place the 3-layer side toward the spout.\n2. Use a medium-coarse grind at ~1:15 ratio. Chemex needs a coarser grind than V60 because the filter slows drainage significantly.\n3. Bloom for 45 seconds with 2× coffee weight in water.\n4. Pour in two or three slow additions. Total brew time: 4-5 minutes.\n5. Remove the filter before serving don't let it sit in the Chemex or it'll continue extracting." },
      { q: "How do I brew Espresso?", a: "1. Grind fine (like table salt) and dose 18-20g into your portafilter.\n2. Distribute evenly and tamp with firm, level pressure inconsistent tamping causes channeling.\n3. Pull your shot. Target: 25-30 seconds to yield ~36-40g of espresso (roughly 1:2 ratio).\n4. Under 25s = grind finer or tamp harder. Over 30s = grind coarser or tamp lighter.\n5. Taste is the final guide. Sour = under-extracted, bitter = over-extracted." },
      { q: "How do I make Cold Brew?", a: "1. Use a coarse grind like rough sea salt at a 1:4 or 1:5 ratio (it's a concentrate).\n2. Combine coffee and cold or room-temperature water. Stir to ensure all grounds are saturated.\n3. Cover and steep in the fridge for 12-24 hours. Longer = stronger.\n4. Strain through a paper filter or fine mesh to remove grounds. This step matters pour slowly.\n5. Dilute with water or milk to taste before drinking. Cold brew concentrate is usually 2x strength." },
      { q: "How do I use a French Press?", a: "1. Heat water to 94°C (201°F). Use a coarse grind at 1:15 ratio.\n2. Add grounds, then pour all the water at once. Stir gently to saturate.\n3. Place the lid on (plunger up) and steep for 4 minutes. Don't skimp on this.\n4. Press the plunger down slowly and steadily rushing causes fine grounds to sneak through.\n5. Pour immediately. Leaving coffee in the French Press after pressing continues extraction and turns it bitter." },
      { q: "How do I use an AeroPress?", a: "1. Heat water to 85°C (185°F) lower than most methods, which reduces bitterness.\n2. Use medium-fine grounds at 1:12 ratio. Place a paper filter in the cap and pre-rinse it.\n3. Bloom with a small amount of water for 30 seconds, then fill to your target weight.\n4. Stir once, place the plunger gently on top to create a seal, steep for 60 seconds.\n5. Press slowly and steadily aim for 20-30 seconds of pressing. Stop when you hear a hiss.\n6. AeroPress is very forgiving experiment with inverted method, different temps, and ratios." },
      { q: "How do I use a Moka Pot?", a: "1. Use pre-boiled water in the bottom chamber this prevents scorching the grounds from heating cold water.\n2. Fill the basket with fine-ground coffee (not espresso-fine) and level it off. Don't tamp.\n3. Assemble and place on medium-low heat with the lid open.\n4. When you hear coffee start gurgling into the top chamber, reduce heat slightly.\n5. As soon as you hear a hissing/sputtering sound, remove from heat immediately this means the water is running out.\n6. Run the base under cold water to stop extraction instantly. Serve right away." },
      { q: "How do I use a Drip Machine well?", a: "1. Use fresh, filtered water drip coffee is ~98% water, so quality matters enormously.\n2. Medium grind at 1:17 ratio (drip benefits from slightly more water).\n3. Use a paper filter and rinse it before brewing to remove papery taste.\n4. Keep your machine clean coffee oils go rancid and ruin flavor. Run a descaling cycle monthly.\n5. If your machine doesn't reach 90-95°C, consider upgrading temperature is the biggest variable in drip quality." },
    ],
  },
  {
    category: "Beans and Buying",
    icon: "◎",
    items: [
      { q: "What is specialty coffee and how is it different from supermarket coffee?", a: "Specialty coffee refers to beans that score 80 or above on a 100-point scale assessed by trained tasters called Q Graders. The scoring covers things like flavor clarity, sweetness, acidity, and the absence of defects. Practically speaking, specialty coffee is traceable to a specific farm or region, roasted recently, and handled carefully at every step. Supermarket coffee is typically commodity-grade, roasted months before you buy it, blended from many low-cost sources, and often stored in conditions that accelerate staleness. The difference in the cup is real and significant." },
      { q: "How do I know if my beans are fresh?", a: "Fresh beans will have a roast date printed on the bag, ideally within the last two to four weeks. Avoid anything labelled only with a best-before date, as that tells you nothing about when it was roasted. When you open a fresh bag, you should smell an intense and complex aroma immediately. If it smells flat, cardboard-like, or faintly rancid, it is already stale. When you bloom fresh coffee during brewing, you will see active CO2 bubbling and rising. Flat or sluggish bloom is a sign the beans are old." },
      { q: "How should I store my coffee beans?", a: "Store beans in an airtight container away from light, heat, and moisture. A ceramic or opaque container with a one-way valve is ideal. Keep it at room temperature, away from your stove or a sunny windowsill. Do not store coffee in the fridge as it absorbs moisture and fridge odours through its porous surface. Freezing is acceptable for long-term storage if you seal beans in airtight portions and only thaw once, but for beans you are actively using, room temperature and airtight is the right approach. Buy in smaller quantities more frequently rather than a large bag you work through slowly." },
      { q: "What does single origin mean versus a blend?", a: "Single origin means the coffee comes from one specific country, region, or even farm. This allows the unique character of that place to come through clearly in the cup. Ethiopian beans taste like Ethiopia. Kenyan beans taste like Kenya. A blend combines beans from multiple origins, usually to create a consistent flavour profile that is more balanced and predictable than any single origin alone. Blends are the backbone of most commercial espresso because consistency matters more at scale. Neither is objectively better. Single origins are great for exploring and tasting differences. Blends are great for everyday reliability." },
      { q: "What is a coffee processing method?", a: "Processing refers to how the coffee cherry is turned into a green bean ready for roasting. The three main methods are washed, natural, and honey. Washed coffees have the fruit removed before drying, which produces clean, bright, and clear-tasting cups where the origin character shines through. Natural coffees are dried with the fruit still on, which adds intense sweetness and jammy berry notes but can taste fermented or wild. Honey processed coffees are a middle ground where some fruit is left on during drying, producing a sweet, rounded, and complex cup. You will see these terms on specialty bags and they significantly affect what the coffee tastes like." },
      { q: "What grinder should I buy as a beginner?", a: "A burr grinder is essential. Blade grinders chop coffee unevenly and produce a mix of fine dust and large chunks that extracts inconsistently and ruins flavour. For hand grinders, the 1Zpresso Q2 and Timemore Chestnut C2 are excellent value and produce very consistent grinds. For electric grinders, the Baratza Encore is the most recommended entry-level option and will serve you well for years. Avoid anything marketed as a spice grinder or a combo grinder with blades. The single biggest upgrade most beginners can make is moving from a blade grinder or pre-ground coffee to a decent burr grinder." },
      { q: "Does the type of water I use actually matter?", a: "Yes, significantly. Coffee is 98 to 99 percent water, so its mineral content and taste directly affect the final cup. Distilled or completely soft water extracts poorly and produces flat, lifeless coffee. Very hard water over-extracts and can taste bitter or chalky. The ideal water has a moderate mineral content, specifically magnesium which enhances sweetness and extraction. A simple approach is to use filtered tap water if your tap water tastes good, or Third Wave Water mineral packets added to distilled water if you want to go further. In most places, good filtered tap water is sufficient." },
    ],
  },
  {
    category: "Milk and Drinks",
    icon: "◉",
    items: [
      { q: "What is the difference between a latte, flat white, and cappuccino?", a: "All three are espresso with steamed milk but the ratios and textures differ. A latte is the largest and milkiest of the three, typically 200 to 250ml with a thin layer of microfoam on top. The espresso flavour is gentle and milk-forward. A flat white is smaller, usually 150 to 180ml, with a higher ratio of espresso to milk and a very thin, velvety microfoam that blends fully into the drink. The coffee flavour is more pronounced. A cappuccino is traditionally equal thirds of espresso, steamed milk, and foam, producing a drier and lighter texture with a thick foam cap. In practice many cafes make cappuccinos closer to lattes, so it is worth asking." },
      { q: "What is a cortado?", a: "A cortado is a small drink of equal parts espresso and steamed milk, usually 60 to 90ml total. The name comes from the Spanish word for cut, as in the milk cuts the intensity of the espresso. It is similar to a small flat white but with even less milk and no attempt at latte art or a thick foam layer. It is served in a small glass and meant to be drunk quickly while still hot. If you find lattes too milky but straight espresso too intense, a cortado is often the perfect middle ground." },
      { q: "Can I use any milk in an espresso drink or does it matter?", a: "It matters more than most people expect. Different milks steam differently and taste very different in hot versus cold drinks. Whole milk is the easiest to steam and tastes the richest and most naturally sweet. Oat milk is the best plant-based option for steaming and is famously good iced. Almond and coconut milk are better cold than hot. Soy milk steams well but has a strong flavour. Skim milk produces lots of foam but tastes thin and watery. For hot drinks, always buy barista edition plant milks as standard grocery versions separate and taste grainy when steamed. The milk guide in the Guide tab covers every option in detail." },
      { q: "What is cold foam and how do I make it at home?", a: "Cold foam is frothed cold milk, thicker and more stable than a simple milk pour, served on top of iced drinks. Unlike steamed foam it is cold throughout, which makes it perfect for iced lattes, cold brews, and iced teas. To make it at home, use cold low-fat milk or skim milk, as lower fat content foams more easily when cold. Froth with a handheld milk frother for 20 to 30 seconds until thick and stable. You can also use a French Press by adding cold milk and pumping the plunger rapidly for about 30 seconds. Flavoured cold foams are made by blending syrup, cream cheese, or vanilla into the milk before frothing." },
      { q: "What is the difference between steamed milk and frothed milk?", a: "Steamed milk is heated using the steam wand on an espresso machine while air is incorporated slowly and deliberately, producing a smooth and velvety texture called microfoam. Done well, the bubbles are so fine you cannot see them and the milk pours like silk. Frothed milk is made with a handheld frother, French Press, or standalone frother and tends to produce larger, airier bubbles with a lighter and less stable texture. Steamed milk is what you get in a latte or flat white at a good cafe. Frothed milk is what most home setups produce. Both work but microfoam is richer and integrates with espresso more completely." },
      { q: "What is a syrup pump and how much should I use?", a: "Syrup pumps are the standard dispensers used in coffee shops. One pump is typically 7 to 10ml of syrup. Most coffee shop lattes use two to four pumps depending on the size, which adds a significant amount of sugar. At home, starting with one pump and adjusting to taste is a good approach. Flavoured syrups like vanilla, caramel, and hazelnut are all broadly interchangeable in terms of how much to use. Brown sugar syrup, cinnamon dolce, and lavender syrups tend to be stronger and usually need less. Monin and Torani are the most widely available brands and both work well." },
      { q: "How do I make a simple syrup at home?", a: "Simple syrup is just equal parts sugar and water by weight, heated until the sugar dissolves. Combine 200g sugar and 200ml water in a saucepan over medium heat, stir until fully dissolved, then cool and store in a sealed bottle in the fridge for up to two weeks. To make flavoured syrups, add aromatics while heating. For brown sugar syrup, use brown sugar instead of white. For vanilla syrup, add a split vanilla pod or a teaspoon of vanilla extract. For lavender syrup, steep dried culinary lavender in the hot syrup for 15 minutes then strain. Homemade syrups are fresher and less sweet than commercial versions and you can control exactly what goes in them." },
    ],
  },
  {
    category: "Using This App",
    icon: "✦",
    items: [
      { q: "What is the flavor wheel and how does it work?", a: "The flavor wheel in the Bean Journal is a visual map of coffee flavors organized into tiers. The outer ring is the most specific (e.g. Blackberry), the middle ring groups related flavors together (e.g. Berry), and the inner ring shows the broad category (e.g. Fruity). When you log a bean, you describe what you taste in plain language and the AI reads your description and maps your words onto the wheel automatically. The size of each segment reflects how prominent that flavor was in your notes. You do not need to know any coffee terminology. Just write what you taste as if you were describing it to a friend." },
      { q: "How do I share a bean with a friend?", a: "Open any bean in your Journal and tap the Share button. You have two options. Download Image Card generates a rich visual card with the flavor wheel, scores, and tasting notes that you can screenshot and share anywhere. Copy Share Code encodes the entire bean into a text string you can send via message, email, or any platform. Your friend can paste that code into their Craft and Cup app using the Import option in the Share sheet on any bean detail page." },
      { q: "Will my data be saved if I close the app?", a: "Yes. Everything in Craft and Cup is saved to your browser's local storage, which persists between sessions as long as you use the same browser and device. This includes your bean journal, drink recipes, saved brew recipes, and your theme preference. Nothing is stored on a server, which means your data is private and only on your device. The trade-off is that if you clear your browser data or switch devices, your data will not transfer automatically. The share and import feature is the current way to move individual beans between devices." },
      { q: "Can I use the app offline?", a: "Most of the app works without an internet connection. The brew calculator, grind and roast guides, milk guide, origins guide, FAQ, and your saved journal and recipes all work fully offline. The one feature that requires an internet connection is the AI flavor wheel mapping in the Bean Journal, which calls the Anthropic API to read your tasting notes and build the wheel. If you are offline when you log a bean, the flavor wheel will not generate but everything else about the entry will save normally." },
    ],
  },
];

const ROAST_GUIDE = [
  {
    level: "White / Blonde",
    color: "#e8d8a0",
    temp: "160-175°C",
    icon: "○",
    tagline: "Barely roasted, raw-adjacent",
    characteristics: ["Very high acidity", "Very light tan colour", "Grassy, raw character", "Extremely dense bean", "Highest caffeine content"],
    flavors: ["Grass", "Hay", "Raw grain", "Bread dough", "Sour", "Green apple"],
    body: 1, acidity: 5, sweetness: 1, bitterness: 1,
    desc: "White and blonde roasts are stopped before or just at the first crack. These are rarely used by specialty roasters intentionally the bean hasn't developed enough to taste like 'coffee.' You'll get grassy, raw, cereal-like flavors. Starbucks' 'Blonde Roast' is a notable exception, using it to mean a milder light roast rather than this extreme.",
    bestFor: "Rarely used as-is. Some experimental brewers use it for cold brew blending.",
    tip: "If you encounter this and it tastes off, that's normal the bean simply hasn't developed yet.",
  },
  {
    level: "Cinnamon",
    color: "#ddb870",
    temp: "175-195°C",
    icon: "◌",
    tagline: "Just before first crack",
    characteristics: ["Very sharp acidity", "Thin body", "Light tan-brown", "Grainy sweetness", "Subtle complexity"],
    flavors: ["Cinnamon", "Lemon", "Green tea", "Grain", "Sour apple", "Hay"],
    body: 1, acidity: 5, sweetness: 2, bitterness: 1,
    desc: "Named for its colour rather than its flavour, cinnamon roast sits just before the first crack completes. The bean is still largely undeveloped but starts showing hints of coffee character. Very niche mainly used by home roasters experimenting with light-end profiles. Expect thin body and sharp, almost abrasive acidity.",
    bestFor: "Cold brew, experimental pour over at high doses.",
    tip: "Very forgiving on dose use a higher ratio (1:13) to compensate for the thin body.",
  },
  {
    level: "Half City",
    color: "#d4a060",
    temp: "190-200°C",
    icon: "◍",
    tagline: "Halfway developed, still very raw",
    characteristics: ["Very high acidity", "Very light body", "Pale tan-brown", "Cereal-like", "Underdeveloped sweetness"],
    flavors: ["Grain", "Hay", "Lemon", "Unripe apple", "Bread", "Mild floral"],
    body: 1, acidity: 5, sweetness: 2, bitterness: 1,
    desc: "Half City is a term used mainly by home roasters to describe a roast stopped halfway through the first crack. The bean is noticeably underdeveloped think raw and cereal-like rather than coffee-like. You will not see this on commercial bags very often. It exists mainly as a reference point for people learning to roast at home.",
    bestFor: "Not recommended for most brewing. Mainly a reference point for home roasters.",
    tip: "If you roast at home and accidentally land here, try cold brew it is the most forgiving method for underdeveloped beans.",
  },
  {
    level: "New England",
    color: "#d0a858",
    temp: "195-205°C",
    icon: "◎",
    tagline: "First crack complete, origin character shining",
    characteristics: ["High acidity", "Light body", "Light-medium brown", "Floral and fruity", "No surface oil"],
    flavors: ["Floral", "Citrus zest", "Berry", "White peach", "Honey", "Jasmine"],
    body: 2, acidity: 5, sweetness: 3, bitterness: 1,
    desc: "New England roast sits right at the end of first crack the point where specialty roasters often pull their highest-quality beans. The bean has developed just enough to express its full origin character without any roast influence. Ethiopian naturals at this level can taste almost like fruit juice. This is a favorite among third-wave specialty roasters.",
    bestFor: "Pour Over, V60, Chemex, AeroPress. The cleaner the brew method, the better.",
    tip: "Use water around 94-96°C light roasts need hotter water to extract properly.",
  },
  {
    level: "American",
    color: "#c8a050",
    temp: "205-215°C",
    icon: "◑",
    tagline: "The classic diner coffee roast",
    characteristics: ["Bright acidity", "Light-medium body", "Medium-light brown", "Clean and approachable", "No surface oil"],
    flavors: ["Toast", "Mild citrus", "Caramel hint", "Grain", "Light fruit", "Nuts"],
    body: 2, acidity: 4, sweetness: 3, bitterness: 1,
    desc: "American roast is where a lot of traditional American drip coffee sits. It is light enough to taste clean and bright but developed enough to be recognisably coffee-like rather than raw or grassy. This is the roast style you grew up with if you drank diner coffee or classic filter coffee. Not flashy, just solid and approachable.",
    bestFor: "Drip machines, pour over, and any filter method. Great as an everyday drinker.",
    tip: "This is a great starting point if you find lighter specialty roasts too acidic but do not want the bitterness of dark roast.",
  },
  {
    level: "Light",
    color: "#c89848",
    temp: "200-210°C",
    icon: "◔",
    tagline: "Origin-forward, complex, bright",
    characteristics: ["High acidity", "No visible oil", "Light brown", "Dense bean", "High caffeine"],
    flavors: ["Floral", "Citrus", "Berry", "Stone fruit", "Tea-like", "Herbal"],
    body: 2, acidity: 5, sweetness: 4, bitterness: 1,
    desc: "Light roast is the most common term for specialty coffee at the lighter end. The roast is stopped shortly after first crack, preserving most of the bean's origin character. This is why light roasts taste so different from each other an Ethiopian and a Colombian at the same roast level will taste completely different because you're tasting the bean, not the roast.",
    bestFor: "Pour Over, V60, Chemex, AeroPress.",
    tip: "If it tastes sour or flat, try hotter water (94-96°C) and a finer grind than you'd expect.",
  },
  {
    level: "Breakfast Roast",
    color: "#c09050",
    temp: "205-218°C",
    icon: "◒",
    tagline: "The approachable morning crowd-pleaser",
    characteristics: ["Moderate acidity", "Light-medium body", "Medium-light brown", "Mild and smooth", "No surface oil"],
    flavors: ["Toast", "Mild caramel", "Light nut", "Gentle citrus", "Grain", "Brown sugar"],
    body: 2, acidity: 3, sweetness: 3, bitterness: 2,
    desc: "Breakfast Roast is less of a precise temperature and more of a commercial style term. You will see it on supermarket bags and coffee shop menus to mean something smooth, mild, and easy to drink in quantity first thing in the morning. It usually sits in the light-to-medium range. Nothing too challenging, nothing too bold just pleasant and drinkable.",
    bestFor: "Drip machines, French Press, and everyday brewing. Great for people who drink multiple cups a day.",
    tip: "If someone tells you they hate specialty coffee because it tastes sour, hand them a good Breakfast Roast. It is a much gentler introduction.",
  },
  {
    level: "City",
    color: "#b88840",
    temp: "210-218°C",
    icon: "◑",
    tagline: "Light-medium, sweet and approachable",
    characteristics: ["Moderate-high acidity", "Developing body", "Medium-light brown", "Roast sweetness emerging", "No oil"],
    flavors: ["Citrus", "Apple", "Caramel hints", "Nougat", "Dried fruit", "Milk chocolate"],
    body: 3, acidity: 4, sweetness: 4, bitterness: 2,
    desc: "City roast is a classic specialty term sitting between light and medium. Named after New York City, it was historically considered the benchmark 'standard' roast. The first crack is fully complete and the bean has had a moment to develop sweetness without yet taking on roast character. This is where many specialty roasters work for naturally-processed beans.",
    bestFor: "Pour Over, Chemex, Drip, AeroPress.",
    tip: "A great entry point if light roast feels too acidic it bridges both worlds well.",
  },
  {
    level: "Full City",
    color: "#c09050",
    temp: "218-225°C",
    icon: "◕",
    tagline: "The specialty sweet spot",
    characteristics: ["Balanced acidity", "Full body", "Medium-dark brown", "Roast sweetness prominent", "Traces of oil possible"],
    flavors: ["Caramel", "Chocolate", "Brown sugar", "Dried cherry", "Toasted nuts", "Mild spice"],
    body: 4, acidity: 3, sweetness: 4, bitterness: 2,
    desc: "Full City is one of the most common terms in specialty coffee and considered by many roasters as the sweet spot for washed Central American and South American beans. It sits at the start of second crack just before the roast takes over completely. You get the best of both worlds: the bean's sweetness and the roast's developed complexity.",
    bestFor: "Espresso, Pour Over, French Press, Drip. Very versatile.",
    tip: "Full City is an excellent espresso roast for those who want complexity without excessive bitterness.",
  },
  {
    level: "Full City+",
    color: "#b07840",
    temp: "225-232°C",
    icon: "◉",
    tagline: "Into second crack, rich and bold",
    characteristics: ["Low-moderate acidity", "Heavy body", "Dark brown", "Slight oil sheen", "Bittersweet"],
    flavors: ["Dark chocolate", "Roasted nuts", "Molasses", "Dried fruit", "Spice", "Smoke hints"],
    body: 4, acidity: 2, sweetness: 3, bitterness: 3,
    desc: "Full City+ pushes just into the second crack. The oil is beginning to surface and the roast is becoming the dominant flavor character. Origin nuance is fading but the bean's sugars have caramelized into a rich, complex sweetness. This is the preferred roast level for many traditional espresso blends in Northern Italy.",
    bestFor: "Espresso, French Press, Moka Pot, Cold Brew. Excellent as a base for milk drinks.",
    tip: "The heavier body holds up through milk great roast level for lattes and cappuccinos.",
  },
  {
    level: "Medium",
    color: "#a86e38",
    temp: "220-228°C",
    icon: "●",
    tagline: "Familiar, balanced, crowd-pleasing",
    characteristics: ["Balanced acidity", "Full body", "Medium brown", "Roast sweetness prominent", "Minimal oil"],
    flavors: ["Caramel", "Chocolate", "Nuts", "Mild fruit", "Brown sugar", "Toast"],
    body: 3, acidity: 3, sweetness: 4, bitterness: 2,
    desc: "Medium roast is the most widely consumed roast globally and what most people picture when they think 'coffee.' This is roughly what you'll get from most commercial blends and everyday specialty bags labeled 'medium.' Roast sweetness is prominent and the body is satisfying, while retaining just enough origin character to be interesting.",
    bestFor: "Drip machines, French Press, Pour Over, AeroPress. Extremely versatile.",
    tip: "Medium roast is very forgiving it works well across most brew methods and a wide range of ratios.",
  },
  {
    level: "Vienna",
    color: "#c87840",
    temp: "230-240°C",
    icon: "⬤",
    tagline: "Dark and bittersweet, European style",
    characteristics: ["Low acidity", "Very full body", "Dark brown", "Oily surface", "Pronounced roast character"],
    flavors: ["Bittersweet chocolate", "Smoky caramel", "Toasted bread", "Dried fruit", "Spice", "Smoke"],
    body: 5, acidity: 2, sweetness: 2, bitterness: 3,
    desc: "Vienna roast is named for the traditional cafe culture of Vienna, Austria. It sits well into second crack significantly darker than Full City+. The surface is oily and origin character is almost entirely replaced by roast-derived flavors. This is what most traditional European espresso blends target. Bold, bittersweet, and heavy-bodied.",
    bestFor: "Espresso, Moka Pot, French Press. Works well in milk drinks.",
    tip: "Use slightly lower water temperature (90°C) to avoid amplifying the already-present bitterness.",
  },
  {
    level: "Continental",
    color: "#c88040",
    temp: "235-242°C",
    icon: "◾",
    tagline: "European dark, rich and roasty",
    characteristics: ["Low acidity", "Full body", "Very dark brown", "Oily sheen developing", "Pronounced roast character"],
    flavors: ["Bittersweet chocolate", "Roasted grain", "Dark caramel", "Smoke hints", "Dried fruit", "Spice"],
    body: 5, acidity: 1, sweetness: 2, bitterness: 3,
    desc: "Continental roast sits between Vienna and French darker than what most American roasters consider ideal but lighter than the truly extreme dark end. It is a common roast level in traditional European espresso blends and is sometimes used interchangeably with Vienna by commercial roasters. Rich, bold, and roasty without crossing into harsh smoke territory.",
    bestFor: "Espresso, Moka Pot, French Press. Excellent in milk drinks.",
    tip: "A good middle ground if you enjoy dark coffee but find French roast too smoky and bitter.",
  },
  {
    level: "Dark",
    color: "#d08848",
    temp: "240-248°C",
    icon: "◼",
    tagline: "Smoky, intense, low acidity",
    characteristics: ["Very low acidity", "Very full body", "Near-black", "Very oily surface", "Sharp bitterness"],
    flavors: ["Smoke", "Ash", "Dark chocolate", "Tobacco", "Charred sugar", "Rubber"],
    body: 5, acidity: 1, sweetness: 2, bitterness: 4,
    desc: "Dark roast has pushed well past second crack. At this stage, origin character is essentially gone you're tasting the roast process itself. The oils are heavy on the surface, acidity is minimal, and the dominant notes are smoky, bitter, and intense. This is what supermarket 'dark roast' blends typically aim for, and the traditional espresso style in much of Southern Europe.",
    bestFor: "Espresso, Moka Pot, French Press. For strong milk drinks where intensity is needed.",
    tip: "Use 88-90°C water to soften the bitterness. Lower temp makes a significant difference at this roast level.",
  },
  {
    level: "Espresso Roast",
    color: "#c06828",
    temp: "Various",
    icon: "◉",
    tagline: "A style, not a temperature",
    characteristics: ["Variable by roaster", "Usually medium-dark to dark", "Designed for espresso machines", "Heavy body", "Low to moderate acidity"],
    flavors: ["Dark chocolate", "Caramel", "Toasted nuts", "Smoke hints", "Molasses", "Spice"],
    body: 4, acidity: 2, sweetness: 3, bitterness: 3,
    desc: "Espresso Roast is one of the most misunderstood terms in coffee because it does not refer to a specific temperature. It is a marketing and style term that roasters use to mean the coffee is intended for espresso machines. In practice this usually means a medium-dark to dark roast with a heavy body and low acidity that will taste balanced when brewed under pressure. You can technically make espresso with any roast level and many specialty cafes now pull light roast espresso but Espresso Roast on a bag tells you the roaster designed it with an espresso machine in mind.",
    bestFor: "Espresso machines primarily, but also Moka Pot and French Press.",
    tip: "Do not assume Espresso Roast means it can only be used in an espresso machine. It will work fine in a French Press or Moka Pot too.",
  },
  {
    level: "Light French",
    color: "#c06030",
    temp: "238-245°C",
    icon: "◭",
    tagline: "Dark and smoky but still drinkable",
    characteristics: ["Very low acidity", "Full body", "Very dark brown", "Oily surface", "Bold roast character with less harshness than full French"],
    flavors: ["Smoke", "Dark chocolate", "Bittersweet caramel", "Toasted grain", "Dried fruit hints", "Light ash"],
    body: 5, acidity: 1, sweetness: 2, bitterness: 4,
    desc: "Light French sits between Espresso Roast and full French roast. It has that bold, smoky European dark roast character but stops before the beans become fully carbonized. For people who love dark coffee but find French roast too harsh and one-dimensional, this is the sweet spot. You still get some bittersweet complexity rather than just ash and rubber. Some roasters label this as Half French or Dark French depending on their house style.",
    bestFor: "Espresso, Moka Pot, French Press. Works in milk drinks where you want a strong coffee flavour to cut through.",
    tip: "A good bridge roast if you enjoy dark coffee and want to explore beyond Vienna without committing to the full intensity of French roast.",
  },
  {
    level: "French",
    color: "#c87030",
    temp: "240-250°C",
    icon: "▪",
    tagline: "Extreme dark, carbonized edges",
    characteristics: ["Almost no acidity", "Maximum body", "Near-black beans", "Heavy oily surface", "Very sharp bitterness"],
    flavors: ["Charcoal", "Bitter chocolate", "Tar", "Heavy smoke", "Carbon", "Rubber"],
    body: 5, acidity: 1, sweetness: 1, bitterness: 5,
    desc: "French roast is one of the darkest widely-used commercial roast levels. Named for the traditional dark roasting style of French cafe culture. At this point the bean's cellulose structure is beginning to break down and carbonize. Specialty roasters rarely go this dark intentionally the flavors are primarily from combustion products rather than the coffee's inherent character. Best reserved for heavily milked drinks.",
    bestFor: "Moka Pot, Espresso for milk drinks only. Not recommended for filter methods.",
    tip: "If you find this too harsh, try cold brew the cold water and long steep extracts less bitterness than hot methods.",
  },
  {
    level: "Italian",
    color: "#b05820",
    temp: "250°C+",
    icon: "■",
    tagline: "The extreme edge of roasting",
    characteristics: ["No detectable acidity", "Maximum body", "Black beans", "Extremely oily", "Predominantly bitter and ashy"],
    flavors: ["Ash", "Charcoal", "Carbon", "Bitter espresso", "Rubber", "Burnt sugar"],
    body: 5, acidity: 1, sweetness: 1, bitterness: 5,
    desc: "Italian roast is the darkest commercially available roast and sits at the very edge of what's usable before the bean fully combusts. Almost entirely carbonized, the flavors are dominated by ash and carbon rather than anything from the original bean. Historically associated with old-world Southern Italian espresso culture. Modern specialty coffee has largely moved away from roasts this dark.",
    bestFor: "Traditional espresso only, always with milk. Not recommended for any filter method.",
    tip: "This roast is an acquired taste. If you're new to coffee, start much lighter and work your way here if you're curious.",
  },
  {
    level: "Spanish",
    color: "#903010",
    temp: "255°C+",
    icon: "▰",
    tagline: "Beyond Italian almost entirely carbonized",
    characteristics: ["No acidity at all", "Maximum body", "Near-black to black beans", "Extremely oily surface", "Intensely bitter and ashy"],
    flavors: ["Pure carbon", "Ash", "Rubber", "Tar", "Char", "Acrid smoke"],
    body: 5, acidity: 1, sweetness: 1, bitterness: 5,
    desc: "Spanish roast is the darkest roast level with a recognised name. The beans are essentially carbonized pushed so far that you are tasting almost nothing of the original coffee bean at all. This roast is extremely rare and not used by any serious specialty roaster. It exists mainly as a historical curiosity from an era before coffee quality and roasting science were well understood. You are very unlikely to encounter this unless you roast at home and simply go too far.",
    bestFor: "Not recommended for any brewing method.",
    tip: "If you encounter beans this dark, they are almost certainly past the point of being enjoyable. This is included here for completeness and education rather than as a recommendation.",
  },
];

function RoastGuide() {
  const tc = useThemeColor;
  const [active, setActive] = useState(null);

  const barVal = (v, max = 5) => `${(v / max) * 100}%`;

  return (
    <div className="guide-grind-section">
      <div className="guide-section-header" style={{ marginBottom: 8 }}>
        <span className="guide-section-icon">◑</span>
        <span className="guide-section-label">Interactive Roast Guide</span>
      </div>
      <p className="guide-grind-intro">Click a roast level to explore its characteristics, flavor tendencies, and brewing tips.</p>

      {/* Roast selector strip */}
      <div className="roast-track">
        {ROAST_GUIDE.map((r) => (
          <button
            key={r.level}
            className={`roast-btn ${active?.level === r.level ? "active" : ""}`}
            style={{ "--rc": tc(r.color) }}
            onClick={() => setActive(active?.level === r.level ? null : r)}
          >
            <div className="roast-bean-icon" style={{ color: tc(r.color) }}>{r.icon}</div>
            <span className="roast-btn-label">{r.level}</span>
          </button>
        ))}
      </div>

      {/* Detail panel */}
      {active && (
        <div className="roast-detail" style={{ borderTopColor: tc(active.color) }}>
          <div className="roast-detail-top">
            <div>
              <div className="roast-detail-level" style={{ color: tc(active.color) }}>{active.level} Roast</div>
              <div className="roast-detail-tagline">{active.tagline}</div>
              <div className="roast-detail-temp">Roast temp: {active.temp}</div>
            </div>
          </div>
          <div className="roast-detail-desc">{active.desc}</div>
          <div className="roast-bars">
            {[
              { label: "Body",       val: active.body },
              { label: "Acidity",    val: active.acidity },
              { label: "Sweetness",  val: active.sweetness },
              { label: "Bitterness", val: active.bitterness },
            ].map(({ label, val }) => (
              <div className="roast-bar-row" key={label}>
                <span className="roast-bar-label">{label}</span>
                <div className="roast-bar-track">
                  <div className="roast-bar-fill" style={{ width: barVal(val), background: tc(active.color) }} />
                </div>
                <span className="roast-bar-val">{val}/5</span>
              </div>
            ))}
          </div>
          <div className="roast-flavors">
            <div className="roast-flavors-label">Common flavors</div>
            <div className="roast-flavor-tags">
              {active.flavors.map((f) => (
                <span key={f} className="roast-flavor-tag" style={{ borderColor: tc(active.color) + "88", color: tc(active.color) }}>{f}</span>
              ))}
            </div>
          </div>
          <div className="roast-chars">
            {active.characteristics.map((c) => (
              <div key={c} className="roast-char"><span className="roast-char-dot" style={{ background: tc(active.color) }} />{c}</div>
            ))}
          </div>
          <div className="roast-bestfor">
            <span className="roast-bestfor-label">Best for: </span>{active.bestFor}
          </div>
          <div className="roast-tip">
            <span className="roast-tip-icon">✦</span>{active.tip}
          </div>
        </div>
      )}
    </div>
  );
}

const MILK_GUIDE = [
  {
    name: "Whole Milk",
    color: "#e8d8b0",
    icon: "◉",
    tagline: "The gold standard",
    hotFlavors: ["Rich", "Creamy", "Naturally sweet", "Buttery", "Smooth"],
    icedFlavors: ["Creamy", "Clean", "Slightly sweet", "Fresh", "Neutral"],
    steamability: 5,
    icedPerformance: 5,
    body: 5,
    sweetness: 4,
    hotDesc: "Whole milk is what every barista trains on because it steams better than anything else. The fat content creates a thick, glossy microfoam that is both stable and silky. Hot, it tastes rich and naturally sweet with a buttery quality that rounds off espresso perfectly.",
    icedDesc: "Iced, whole milk is clean and creamy without being heavy. It blends seamlessly with espresso and does not separate or water down. The classic choice for an iced latte.",
    bestDrinks: ["Latte", "Cappuccino", "Flat White", "Cortado"],
    steamTip: "Stretch early and quickly, then swirl to integrate. Whole milk is very forgiving and recovers from mistakes easily.",
    icedTip: "Pour over ice immediately after combining with espresso the fat content means it stays mixed without stirring.",
  },
  {
    name: "2% Milk",
    color: "#e0d0a0",
    icon: "◎",
    tagline: "Lighter but still works well",
    hotFlavors: ["Mild cream", "Slightly sweet", "Clean", "Light body", "Neutral"],
    icedFlavors: ["Light", "Clean", "Refreshing", "Mild", "Slightly watery"],
    steamability: 4,
    icedPerformance: 4,
    body: 3,
    sweetness: 3,
    hotDesc: "2% milk steams well and produces decent microfoam, though it is less stable and glossy than whole milk. The lower fat content means the foam is a bit airier and the drink feels lighter overall. Still a solid everyday choice for most milk drinks.",
    icedDesc: "Iced, 2% is refreshing and light. It has less of the creamy richness of whole milk but is a good option for people who want something a bit lighter without going fully to a plant milk.",
    bestDrinks: ["Latte", "Cappuccino", "Iced Latte", "Americano with milk"],
    steamTip: "Works best with slightly more aeration time than whole milk. The foam will be a little less stable so work quickly.",
    icedTip: "Shake or stir well if making ahead 2% milk separates a bit faster than whole milk over ice.",
  },
  {
    name: "Skim Milk",
    color: "#d8ccc0",
    icon: "◌",
    tagline: "Lots of foam, very little richness",
    hotFlavors: ["Very light", "Watery", "Slightly sweet", "Clean", "Thin"],
    icedFlavors: ["Watery", "Light", "Neutral", "Thin", "Refreshing"],
    steamability: 3,
    icedPerformance: 2,
    body: 1,
    sweetness: 2,
    hotDesc: "Skim milk produces the most foam volume of any dairy milk because the lack of fat allows more air to be incorporated. The result is light, airy, and voluminous but not very stable or flavourful. It tastes thin and watery compared to whole or 2% milk. Cappuccinos made with skim milk will have a large foam cap but lack the richness of a classic version.",
    icedDesc: "Iced, skim milk is quite watery and does not add much to the drink. The espresso flavour dominates completely. Not a great choice for iced drinks if you want any creaminess.",
    bestDrinks: ["Cappuccino (for volume)", "Americano with milk"],
    steamTip: "Aerate more than you think you need to skim milk needs lots of air to produce a usable texture. Work fast before it collapses.",
    icedTip: "Not recommended for iced drinks unless you specifically want a very light, low-calorie option.",
  },
  {
    name: "Oat Milk",
    color: "#d4a85a",
    icon: "◔",
    tagline: "The barista favourite alt milk",
    hotFlavors: ["Mild oat sweetness", "Creamy", "Slightly grainy", "Neutral", "Smooth"],
    icedFlavors: ["Sweet", "Creamy", "Oat-forward", "Rich", "Almost dessert-like"],
    steamability: 4,
    icedPerformance: 5,
    body: 4,
    sweetness: 4,
    hotDesc: "Oat milk is the most popular alternative milk in specialty coffee for good reason. It steams well, produces a stable and creamy foam, and has a mild oat sweetness that complements espresso without fighting it. Barista-edition oat milks (like Oatly Barista) are specifically formulated to steam well and are significantly better than standard grocery store varieties.",
    icedDesc: "Iced oat milk is where it really shines. It is thick, naturally sweet, and incredibly creamy cold. An iced oat latte tastes almost dessert-like without any added sugar. This is why oat milk took over coffee shops.",
    bestDrinks: ["Iced Latte", "Latte", "Flat White", "Cortado", "Matcha Latte"],
    steamTip: "Always buy barista edition if you can. Standard oat milk will split and taste grainy when steamed. Keep it cold right up until you steam it.",
    icedTip: "Oat milk is arguably better iced than hot. Shake it well before using as it settles in the carton.",
  },
  {
    name: "Almond Milk",
    color: "#c8a870",
    icon: "◑",
    tagline: "Nutty, light, and tricky to steam",
    hotFlavors: ["Nutty", "Light", "Slightly sweet", "Thin", "Almond extract hint"],
    icedFlavors: ["Nutty", "Light", "Refreshing", "Clean", "Mildly sweet"],
    steamability: 2,
    icedPerformance: 4,
    body: 2,
    sweetness: 3,
    hotDesc: "Almond milk is notoriously difficult to steam. It separates easily, the foam is thin and collapses quickly, and it can taste slightly chalky or grainy when hot. The almond flavour competes with espresso rather than complementing it. That said, barista editions have improved significantly and are much more manageable than standard grocery varieties.",
    icedDesc: "Iced is where almond milk performs much better. Cold, it has a pleasant nutty lightness that works well in iced lattes and cold brew drinks. The flavour is refreshing rather than heavy.",
    bestDrinks: ["Iced Latte", "Cold Brew with milk", "Iced Americano with milk"],
    steamTip: "Use barista edition only. Keep it very cold, steam quickly, and do not over-aerate. Serve immediately before the foam separates.",
    icedTip: "Almond milk is much better iced than hot. Stir or shake well before using as it separates in the carton.",
  },
  {
    name: "Soy Milk",
    color: "#c0b878",
    icon: "◕",
    tagline: "The original alt milk polarising flavour",
    hotFlavors: ["Beany", "Slightly savoury", "Creamy", "Distinct", "Sometimes chalky"],
    icedFlavors: ["Beany", "Creamy", "Cool", "Distinct", "Thick"],
    steamability: 4,
    icedPerformance: 3,
    body: 4,
    sweetness: 2,
    hotDesc: "Soy milk was the first widely available alternative milk in coffee shops and it steams surprisingly well producing a stable, creamy foam similar to whole milk in texture. The issue is the flavour. Soy has a distinct beany, slightly savoury quality that many people love but others find off-putting in coffee. It also curdles in very acidic espresso, so with light roasts you may see the milk split.",
    icedDesc: "Iced soy milk is creamy and thick but the beany flavour is more pronounced cold. It works well in cold brew drinks where the coffee is less acidic. Less popular iced than oat or almond due to the stronger flavour.",
    bestDrinks: ["Latte", "Cappuccino", "Cold Brew Latte"],
    steamTip: "Avoid pairing with very light, acidic espresso roasts as soy curdles at low pH. Medium roasts work best.",
    icedTip: "Shake well before using. Soy milk can taste quite beany cold so sweeter syrups pair well if the flavour is too strong.",
  },
  {
    name: "Coconut Milk",
    color: "#d0c890",
    icon: "●",
    tagline: "Sweet and tropical a flavour addition not just a base",
    hotFlavors: ["Distinct coconut", "Sweet", "Creamy", "Tropical", "Rich"],
    icedFlavors: ["Coconut-forward", "Sweet", "Refreshing", "Creamy", "Tropical"],
    steamability: 2,
    icedPerformance: 4,
    body: 3,
    sweetness: 5,
    hotDesc: "Coconut milk adds a very distinct tropical sweetness to hot drinks. It steams inconsistently carton coconut milk behaves differently from canned, and neither produces great microfoam. The coconut flavour dominates, so this works best in drinks where you actually want coconut as part of the flavour profile rather than a neutral base.",
    icedDesc: "Iced is where coconut milk makes much more sense. Cold coconut drinks feel tropical and refreshing, and the sweetness works naturally without feeling cloying. Iced coconut lattes with a touch of vanilla are genuinely excellent.",
    bestDrinks: ["Iced Latte", "Iced Americano", "Cold Brew Latte", "Specialty seasonal drinks"],
    steamTip: "Use carton coconut milk rather than canned for steaming canned is too thick and fatty. Accept that the foam will be loose and serve quickly.",
    icedTip: "Coconut milk is significantly better iced than hot. Shake the carton very well as it separates aggressively.",
  },
  {
    name: "Macadamia Milk",
    color: "#c8b880",
    icon: "◈",
    tagline: "Creamy and buttery an underrated option",
    hotFlavors: ["Buttery", "Mild nut", "Creamy", "Slightly sweet", "Smooth"],
    icedFlavors: ["Rich", "Buttery", "Mild", "Creamy", "Clean"],
    steamability: 3,
    icedPerformance: 5,
    body: 3,
    sweetness: 3,
    hotDesc: "Macadamia milk is underrated in the coffee world. It has a buttery, mild nuttiness that does not compete aggressively with espresso. Steaming is decent though not as reliable as oat or whole milk. The flavour is subtle enough to work as a neutral base while still adding a pleasant creaminess.",
    icedDesc: "Iced macadamia milk is excellent. Cold, the buttery richness comes through beautifully and it pairs especially well with medium roast espresso. Smoother and more neutral than almond or coconut iced.",
    bestDrinks: ["Iced Latte", "Latte", "Flat White", "Cold Brew Latte"],
    steamTip: "A relatively new option so barista editions are still limited. Standard macadamia milk steams adequately but watch for separation.",
    icedTip: "One of the best alt milks for iced drinks. The buttery quality holds up beautifully cold without being too heavy.",
  },
  {
    name: "Cashew Milk",
    color: "#c0a860",
    icon: "◇",
    tagline: "Ultra creamy and very neutral",
    hotFlavors: ["Very creamy", "Mild", "Slightly sweet", "Neutral", "Smooth"],
    icedFlavors: ["Creamy", "Clean", "Neutral", "Rich", "Smooth"],
    steamability: 3,
    icedPerformance: 4,
    body: 4,
    sweetness: 3,
    hotDesc: "Cashew milk is one of the creamiest and most neutral of all the nut milks. The flavour is very mild much less distinct than almond or coconut which makes it an excellent neutral base. It does not steam as well as oat milk but the result is creamy enough for most drinks.",
    icedDesc: "Iced cashew milk is creamy and smooth with very little of its own flavour getting in the way. It lets the espresso or coffee shine through while adding a pleasant richness. A great choice for people who want something creamy but do not want oat milk.",
    bestDrinks: ["Iced Latte", "Latte", "Cold Brew Latte", "Cortado"],
    steamTip: "Steams reasonably well for a nut milk. Barista editions are worth finding if available in your area.",
    icedTip: "Very solid iced option. The creaminess holds up well cold and the neutral flavour makes it versatile.",
  },
  {
    name: "Pea Milk",
    color: "#a8c870",
    icon: "◆",
    tagline: "Surprisingly good do not judge by the name",
    hotFlavors: ["Creamy", "Neutral", "Slightly earthy", "Clean", "Mild"],
    icedFlavors: ["Creamy", "Clean", "Very neutral", "Refreshing", "Smooth"],
    steamability: 4,
    icedPerformance: 4,
    body: 4,
    sweetness: 2,
    hotDesc: "Pea milk (made from yellow split peas, not green peas) is one of the best kept secrets in alternative milks. It steams surprisingly well, produces a stable foam, and has a very neutral flavour that does not interfere with the coffee. The name puts people off but the taste does not taste like peas at all. Ripple is the most well-known brand.",
    icedDesc: "Iced pea milk is clean, creamy, and very neutral. It performs comparably to oat milk cold without the oat sweetness, making it a great option for people who find oat milk too sweet.",
    bestDrinks: ["Latte", "Flat White", "Iced Latte", "Cappuccino"],
    steamTip: "Ripple Barista Edition steams very close to whole milk in texture. Genuinely impressive for an alt milk.",
    icedTip: "A great alternative if you want oat-milk-level performance without the sweetness. Very underrated iced.",
  },
  {
    name: "Rice Milk",
    color: "#d8d0a8",
    icon: "○",
    tagline: "Very light and watery best for allergies",
    hotFlavors: ["Very thin", "Mildly sweet", "Rice-like", "Watery", "Neutral"],
    icedFlavors: ["Thin", "Light", "Watery", "Mildly sweet", "Very neutral"],
    steamability: 1,
    icedPerformance: 2,
    body: 1,
    sweetness: 2,
    hotDesc: "Rice milk is the most watery of all common milk alternatives. It has very little fat or protein which means it steams poorly producing almost no foam and a very thin texture. The flavour is mildly sweet with a slight rice character but mostly just tastes like thin water. It is primarily used by people with nut, soy, and oat allergies who have limited options.",
    icedDesc: "Iced, rice milk is very thin and watery. It adds almost no creaminess and the coffee flavour dominates completely. Not a great choice for lattes but works passably in iced Americanos where you just want a touch of lightness.",
    bestDrinks: ["Iced Americano with milk", "Cold brew lightly", "Allergy-friendly drinks"],
    steamTip: "Rice milk is genuinely very difficult to steam well. Manage expectations you will not get good microfoam. Use it only if allergies require it.",
    icedTip: "Add a small amount to iced drinks for lightness rather than using it as a full milk replacement. A dash goes a long way.",
  },
];

function MilkGuide() {
  const tc = useThemeColor;
  const [active, setActive] = useState(null);
  const barVal = (v) => `${(v / 5) * 100}%`;

  return (
    <div className="guide-grind-section">
      <div className="guide-section-header" style={{ marginBottom: 8 }}>
        <span className="guide-section-icon">◉</span>
        <span className="guide-section-label">Interactive Milk Guide</span>
      </div>
      <p className="guide-grind-intro">Click any milk to see its hot and iced flavor profile, how well it steams, and which drinks it works best in.</p>

      <div className="milk-guide-track">
        {MILK_GUIDE.map((m) => (
          <button
            key={m.name}
            className={`milk-guide-btn ${active?.name === m.name ? "active" : ""}`}
            style={{ "--mc": tc(m.color) }}
            onClick={() => setActive(active?.name === m.name ? null : m)}
          >
            <span className="milk-guide-icon" style={{ color: tc(m.color) }}>{m.icon}</span>
            <span className="milk-guide-label">{m.name}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="milk-guide-detail" style={{ borderTopColor: tc(active.color) }}>
          <div className="milk-guide-detail-header">
            <div className="milk-guide-detail-name" style={{ color: tc(active.color) }}>{active.name}</div>
            <div className="milk-guide-detail-tagline">{active.tagline}</div>
          </div>
          <div className="roast-bars" style={{ marginBottom: 20 }}>
            {[
              { label: "Steamability", val: active.steamability },
              { label: "Iced",         val: active.icedPerformance },
              { label: "Body",         val: active.body },
              { label: "Sweetness",    val: active.sweetness },
            ].map(({ label, val }) => (
              <div className="roast-bar-row" key={label}>
                <span className="roast-bar-label">{label}</span>
                <div className="roast-bar-track">
                  <div className="roast-bar-fill" style={{ width: barVal(val), background: tc(active.color) }} />
                </div>
                <span className="roast-bar-val">{val}/5</span>
              </div>
            ))}
          </div>
          <div className="milk-guide-split">
            <div className="milk-guide-half">
              <div className="milk-guide-half-label">Hot</div>
              <div className="milk-guide-half-desc">{active.hotDesc}</div>
              <div className="milk-guide-flavors">
                {active.hotFlavors.map((f) => (
                  <span key={f} className="roast-flavor-tag" style={{ borderColor: tc(active.color) + "88", color: tc(active.color) }}>{f}</span>
                ))}
              </div>
              <div className="roast-tip" style={{ marginTop: 12 }}>
                <span className="roast-tip-icon">✦</span>{active.steamTip}
              </div>
            </div>
            <div className="milk-guide-half">
              <div className="milk-guide-half-label">Iced</div>
              <div className="milk-guide-half-desc">{active.icedDesc}</div>
              <div className="milk-guide-flavors">
                {active.icedFlavors.map((f) => (
                  <span key={f} className="roast-flavor-tag" style={{ borderColor: tc(active.color) + "88", color: tc(active.color) }}>{f}</span>
                ))}
              </div>
              <div className="roast-tip" style={{ marginTop: 12 }}>
                <span className="roast-tip-icon">✦</span>{active.icedTip}
              </div>
            </div>
          </div>
          <div className="roast-bestfor" style={{ marginTop: 16 }}>
            <span className="roast-bestfor-label">Best for: </span>{active.bestDrinks.join(", ")}
          </div>
        </div>
      )}
    </div>
  );
}

const ORIGINS_GUIDE = [
  {
    country: "Ethiopia",
    region: "Africa",
    color: "#e8906a",
    icon: "◆",
    tagline: "The birthplace of coffee",
    flavors: ["Blueberry", "Jasmine", "Bergamot", "Peach", "Lemon", "Dark chocolate"],
    body: 2, acidity: 5, sweetness: 4, complexity: 5,
    desc: "Ethiopia is where coffee comes from, and it still produces some of the most distinctive and complex cups in the world. Ethiopian beans tend to be intensely fruity and floral in a way that surprises people who are used to darker roasts. A well-prepared Ethiopian pour over can taste almost like fruit juice. The two main processing styles are washed, which is clean and floral, and natural, which is wilder and jammier with more berry character.",
    roastRec: "Light to Light-Medium. Dark roasting destroys what makes Ethiopian beans special.",
    brewRec: "Pour Over, V60, AeroPress",
    tip: "If you want to understand what all the fuss about specialty coffee is, start with an Ethiopian natural processed bean on a pour over. It will change what you think coffee can taste like.",
  },
  {
    country: "Kenya",
    region: "Africa",
    color: "#d4703a",
    icon: "◆",
    tagline: "Bold, bright, and complex",
    flavors: ["Blackcurrant", "Tomato", "Grapefruit", "Brown sugar", "Wine-like", "Berry"],
    body: 3, acidity: 5, sweetness: 3, complexity: 5,
    desc: "Kenyan coffee has a bold and distinctive character unlike almost anywhere else. The acidity is bright and sometimes wine-like, with a savory edge that can include unexpected notes like tomato or blackcurrant. This is not a beginner cup in the sense that the flavors are polarising. People who love Kenyan coffee become obsessed with it. The AA and AB grading refers to bean size, not quality, though AA tends to be more consistent.",
    roastRec: "Light to Medium. Preserves the complex acidity and fruit character.",
    brewRec: "Pour Over, V60, French Press",
    tip: "Kenyan coffee can taste almost like red wine or berry juice at lighter roasts. Do not be put off by how different it is from what you expect coffee to taste like.",
  },
  {
    country: "Colombia",
    region: "South America",
    color: "#c8a030",
    icon: "◈",
    tagline: "Balanced, approachable, and reliable",
    flavors: ["Caramel", "Red apple", "Mild citrus", "Brown sugar", "Hazelnut", "Chocolate"],
    body: 3, acidity: 3, sweetness: 4, complexity: 3,
    desc: "Colombia is the origin most people recommend for beginners and there is a good reason for that. Colombian coffee is balanced, clean, and approachable without being boring. It has enough acidity to be interesting, enough sweetness to be pleasant, and a mild nuttiness that most people find immediately enjoyable. Colombia also has incredible growing diversity because of its mountain ranges, so you will find everything from soft and sweet to bright and complex depending on the region.",
    roastRec: "Medium to Medium-Dark. Works well across a wide range of roast levels.",
    brewRec: "Drip, Pour Over, French Press, Espresso",
    tip: "A great everyday bean. Colombian coffee is hard to mess up and works well in almost any brew method, which makes it perfect for dialing in your technique.",
  },
  {
    country: "Brazil",
    region: "South America",
    color: "#b88828",
    icon: "◈",
    tagline: "Low acid, nutty, and chocolate-forward",
    flavors: ["Dark chocolate", "Almond", "Brown sugar", "Peanut", "Mild fruit", "Vanilla"],
    body: 5, acidity: 1, sweetness: 3, complexity: 2,
    desc: "Brazil is the largest coffee producer in the world and its beans have a very recognisable character. Low acidity, heavy body, and strong nutty chocolate notes. Brazilian beans are not flashy or complex but they are incredibly consistent and satisfying. They are the backbone of most espresso blends because the heavy body and chocolate notes pull the shot together. Natural processing is very common in Brazil which adds sweetness and depth.",
    roastRec: "Medium to Dark. Brazilian beans shine at medium-dark where the chocolate and nut notes develop fully.",
    brewRec: "Espresso, French Press, Moka Pot, Cold Brew",
    tip: "If you find light roast specialty coffee too acidic or fruit-forward, Brazilian beans are your friend. Rich, chocolatey, and very easy to drink.",
  },
  {
    country: "Peru",
    region: "South America",
    color: "#c09030",
    icon: "◈",
    tagline: "Gentle, sweet, and underrated",
    flavors: ["Milk chocolate", "Caramel", "Apple", "Walnut", "Floral hints", "Honey"],
    body: 3, acidity: 2, sweetness: 4, complexity: 2,
    desc: "Peru is one of the most underrated coffee origins in the world. Peruvian beans tend to be soft, sweet, and gentle with mild chocolate and caramel notes and very little of the sharp acidity that some people find off-putting. It is a crowd-pleasing origin that works well for people transitioning from commercial to specialty coffee. Organic and fair-trade certifications are very common in Peruvian coffee.",
    roastRec: "Light-Medium to Medium. Gentle enough that dark roasting can flatten the sweetness.",
    brewRec: "Drip, Pour Over, French Press",
    tip: "A great introduction to South American specialty coffee. If you love Colombian but want something even smoother and sweeter, try Peru next.",
  },
  {
    country: "Guatemala",
    region: "Central America",
    color: "#88a840",
    icon: "◉",
    tagline: "Chocolatey with a bright kick",
    flavors: ["Dark chocolate", "Brown sugar", "Apple", "Spice", "Peach", "Dried fruit"],
    body: 4, acidity: 3, sweetness: 4, complexity: 3,
    desc: "Guatemala produces coffee with a distinctive combination of full body and bright acidity that sets it apart from other Central American origins. The high altitude growing regions produce beans with a complex sweetness and a chocolate backbone that makes them very satisfying. Different growing regions within Guatemala produce noticeably different cups, from the floral Huehuetenango to the bold Antigua.",
    roastRec: "Light-Medium to Medium-Dark. Versatile across roast levels.",
    brewRec: "Pour Over, French Press, Espresso, Moka Pot",
    tip: "Guatemalan coffee is a great bridge between the fruity brightness of Ethiopian and the heavy chocolate of Brazilian. A great all-rounder.",
  },
  {
    country: "Costa Rica",
    region: "Central America",
    color: "#78b838",
    icon: "◉",
    tagline: "Clean, bright, and consistently excellent",
    flavors: ["Honey", "Peach", "Citrus", "Brown sugar", "Floral", "Milk chocolate"],
    body: 3, acidity: 4, sweetness: 4, complexity: 3,
    desc: "Costa Rica has a well-deserved reputation for producing very clean and consistently high-quality coffee. The country has strict regulations around coffee production and only arabica is permitted by law. Honey processing is very popular in Costa Rica, which produces a sweet middle ground between the clean character of washed coffees and the fruit intensity of naturals. Expect bright, sweet, and very approachable cups.",
    roastRec: "Light to Medium. The clean sweetness and bright acidity shine at lighter roasts.",
    brewRec: "Pour Over, AeroPress, Drip",
    tip: "Costa Rican honey-processed beans are a fantastic introduction to processing methods. They show you what that sweet, fruity middle ground between washed and natural tastes like.",
  },
  {
    country: "Mexico",
    region: "Central America",
    color: "#98b030",
    icon: "◉",
    tagline: "Mild, smooth, and approachable",
    flavors: ["Mild chocolate", "Nuts", "Apple", "Caramel", "Light citrus", "Brown sugar"],
    body: 2, acidity: 2, sweetness: 3, complexity: 2,
    desc: "Mexican coffee is mild, smooth, and very approachable. It lacks the dramatic complexity of Ethiopian or Kenyan coffee but makes up for it with consistency and drinkability. Mexican beans are commonly used in blends because of their smooth, neutral base character. Chiapas and Oaxaca are the most well known producing regions. Organic certification is very common in Mexican specialty coffee.",
    roastRec: "Medium to Medium-Dark. Mild enough that light roasting can leave it tasting flat.",
    brewRec: "Drip, French Press, Cold Brew",
    tip: "A good choice for an everyday drip coffee or cold brew. Not flashy but consistently pleasant and very easy to live with.",
  },
  {
    country: "Jamaica",
    region: "Caribbean",
    color: "#b8c830",
    icon: "◉",
    tagline: "Famous, expensive, and very mild",
    flavors: ["Mild chocolate", "Nuts", "Cream", "Very light fruit", "Gentle sweetness", "Clean"],
    body: 3, acidity: 2, sweetness: 3, complexity: 2,
    desc: "Jamaica Blue Mountain is one of the most famous and expensive coffees in the world. The reputation comes from the unique microclimate of the Blue Mountains which produces a very clean, mild, and balanced cup with almost no bitterness. The honest truth is that the flavour rarely justifies the price for most people. It is smooth and pleasant but lacks the complexity or drama you would expect from something so expensive. You are partly paying for prestige.",
    roastRec: "Light to Medium. The delicate character is destroyed by dark roasting.",
    brewRec: "Pour Over, Drip",
    tip: "Try it at least once if you are curious. Just know that you will likely find better value for money in Ethiopian or Colombian specialty lots.",
  },
  {
    country: "Yemen",
    region: "Middle East",
    color: "#c89840",
    icon: "★",
    tagline: "Ancient, wild, and unlike anything else",
    flavors: ["Dark fruit", "Wine", "Tobacco", "Spice", "Dried fig", "Earthy"],
    body: 4, acidity: 3, sweetness: 3, complexity: 5,
    desc: "Yemeni coffee is one of the oldest and most distinctive in the world. Grown on ancient terraced hillsides using traditional methods, the beans have a wild, complex character that reflects centuries of cultivation. Expect dark fruit, wine-like notes, a hint of spice, and an earthiness that is completely unlike anything from Africa or the Americas. Supply is limited and quality is inconsistent due to the country's situation, but exceptional lots still reach the specialty market.",
    roastRec: "Light-Medium to Medium. Preserves the complex wild character.",
    brewRec: "Pour Over, French Press, Traditional Arabic preparation",
    tip: "One of the most unique coffees you can try. The flavour is very different from what most people expect so approach it as an experience rather than an everyday cup.",
  },
  {
    country: "India",
    region: "Asia",
    color: "#a87838",
    icon: "◐",
    tagline: "Earthy, spiced, and full-bodied",
    flavors: ["Spice", "Earth", "Dark chocolate", "Tobacco", "Cedar", "Low fruit"],
    body: 5, acidity: 1, sweetness: 2, complexity: 3,
    desc: "Indian coffee has a very distinctive earthy and spiced character. The most famous Indian coffee is Monsooned Malabar, where green beans are exposed to monsoon winds which causes them to swell, lose their acidity, and develop an intensely earthy, musty, and full-bodied character. It is not for everyone but is fascinating and very different from anything else. Standard Indian washed coffees are smoother with chocolate and spice notes.",
    roastRec: "Medium to Dark. Indian beans are naturally suited to darker roasts.",
    brewRec: "Espresso, French Press, Moka Pot",
    tip: "Monsooned Malabar is worth trying just for the experience. It tastes ancient and earthy in a way that nothing else does. Add it to a blend if the earthiness is too intense on its own.",
  },
  {
    country: "Indonesia",
    region: "Asia",
    color: "#906828",
    icon: "◐",
    tagline: "Heavy, earthy, and complex",
    flavors: ["Earth", "Tobacco", "Dark chocolate", "Cedar", "Mushroom", "Herbs"],
    body: 5, acidity: 1, sweetness: 2, complexity: 4,
    desc: "Indonesia produces some of the heaviest and most earthy coffees in the world. Sumatra is the most well known region and its beans have a distinctive syrupy body and low acidity with deep earthy, herbal, and sometimes mushroom-like notes. This character comes partly from the wet-hulling processing method unique to the region. Sulawesi and Java produce slightly cleaner and more structured cups. Indonesian coffees divide opinion strongly.",
    roastRec: "Medium to Dark. The heavy body and earthy notes are best expressed at medium-dark.",
    brewRec: "French Press, Espresso, Cold Brew, Moka Pot",
    tip: "If you love a heavy, bold cup with no acidity, Sumatra is for you. If you find it too earthy or muddy, try Sulawesi which is cleaner and more structured.",
  },
  {
    country: "Papua New Guinea",
    region: "Asia",
    color: "#a88030",
    icon: "◐",
    tagline: "Fruit-forward with a full body",
    flavors: ["Tropical fruit", "Peach", "Brown sugar", "Earth hints", "Mild spice", "Chocolate"],
    body: 4, acidity: 3, sweetness: 4, complexity: 3,
    desc: "Papua New Guinea sits in an interesting middle ground between the fruit-forward character of African coffees and the heavy body of Indonesian ones. Expect tropical fruit notes, a full body, and a mild earthiness in the background. The quality has improved significantly in recent years as specialty buyers have invested in the region. Still relatively uncommon in specialty shops but worth seeking out.",
    roastRec: "Light-Medium to Medium. Shows the fruit notes at lighter roasts.",
    brewRec: "Pour Over, French Press, Drip",
    tip: "A good choice if you want something more body-forward than Ethiopian but more fruit-forward than Sumatran. A nice middle ground.",
  },
  {
    country: "Hawaii",
    region: "Pacific",
    color: "#d4a840",
    icon: "◉",
    tagline: "America's famous coffee, smooth and mild",
    flavors: ["Milk chocolate", "Caramel", "Macadamia", "Mild fruit", "Honey", "Buttery"],
    body: 3, acidity: 2, sweetness: 4, complexity: 2,
    desc: "Kona coffee from Hawaii is one of the most famous American products and one of the priciest coffees you can buy. Grown on the slopes of volcanic mountains on the Big Island, it has a smooth, mild, and buttery character with macadamia-like nuttiness and gentle sweetness. Like Jamaica Blue Mountain, the price reflects the prestige and limited supply as much as the quality. Be aware that many bags labelled Kona Blend contain as little as 10% actual Kona coffee.",
    roastRec: "Light to Medium. The delicate sweetness is lost at darker roasts.",
    brewRec: "Pour Over, Drip",
    tip: "Check the label carefully. True 100% Kona coffee is expensive. If a bag seems too cheap to be real Kona, it probably is not.",
  },
  {
    country: "Tanzania",
    region: "Africa",
    color: "#d46040",
    icon: "◆",
    tagline: "Bright and fruity with a wine-like edge",
    flavors: ["Blackberry", "Peach", "Plum", "Citrus", "Brown sugar", "Wine"],
    body: 3, acidity: 4, sweetness: 4, complexity: 4,
    desc: "Tanzanian coffee shares some of the fruit-forward brightness of its Kenyan neighbour but tends to be a bit softer and less intense. Expect bright acidity, berry and stone fruit notes, and a pleasant wine-like quality. Peaberry beans from Tanzania are particularly sought after. A peaberry is a natural mutation where only one bean develops inside the cherry instead of two, resulting in a rounder bean that many believe has more concentrated flavour.",
    roastRec: "Light to Medium. Best at lighter roasts where the fruit character shines.",
    brewRec: "Pour Over, V60, AeroPress",
    tip: "Try Tanzanian peaberry if you can find it. It is a great introduction to what peaberry means and why people seek it out.",
  },
  {
    country: "Rwanda",
    region: "Africa",
    color: "#c85038",
    icon: "◆",
    tagline: "Floral, juicy, and increasingly celebrated",
    flavors: ["Hibiscus", "Red berry", "Citrus", "Honey", "Black tea", "Stone fruit"],
    body: 2, acidity: 4, sweetness: 4, complexity: 4,
    desc: "Rwanda has emerged as one of the most exciting African origins in specialty coffee over the past two decades. The high altitude growing conditions and careful washing station practices produce incredibly clean and vibrant cups with floral and red fruit character. Rwandan coffees often have a distinctive hibiscus or berry note that is recognisable once you have tasted it. The coffee industry has been a significant part of the country's economic recovery and the quality reflects that investment.",
    roastRec: "Light to Light-Medium. Preserves the delicate floral and fruit character.",
    brewRec: "Pour Over, V60, AeroPress",
    tip: "A great companion to Ethiopian if you want to explore East African coffees. Similar brightness and floral quality but with its own distinct character.",
  },
  {
    country: "Vietnam",
    region: "Asia",
    color: "#689848",
    icon: "◐",
    tagline: "Bold, robusta-heavy, and built for Vietnamese coffee",
    flavors: ["Bitter chocolate", "Earthy", "Tobacco", "Grain", "Rubber", "Bold"],
    body: 5, acidity: 1, sweetness: 1, complexity: 1,
    desc: "Vietnam is the second largest coffee producer in the world but is almost entirely robusta, which is a different species to the arabica used in specialty coffee. Robusta has roughly twice the caffeine, much more bitterness, and very little of the fruit and floral character that makes arabica interesting. Vietnamese coffee culture is built around this robust, bitter character and it works beautifully in traditional Vietnamese iced coffee with sweetened condensed milk, which balances and transforms the intensity.",
    roastRec: "Dark. Robusta is almost always roasted dark.",
    brewRec: "Vietnamese Phin filter, Espresso blending",
    tip: "Do not judge Vietnamese coffee by specialty standards as it is a completely different experience. Try traditional Vietnamese iced coffee with condensed milk. It is genuinely excellent on its own terms.",
  },
];

function OriginsGuide() {
  const tc = useThemeColor;
  const [active, setActive] = useState(null);
  const barVal = (v) => `${(v / 5) * 100}%`;

  const regions = [...new Set(ORIGINS_GUIDE.map((o) => o.region))];

  return (
    <div className="guide-grind-section">
      <div className="guide-section-header" style={{ marginBottom: 8 }}>
        <span className="guide-section-icon">★</span>
        <span className="guide-section-label">Coffee Origins Guide</span>
      </div>
      <p className="guide-grind-intro">Click any origin to explore its flavor profile, character, and brewing recommendations.</p>

      {regions.map((region) => (
        <div key={region} className="origins-region-group">
          <div className="origins-region-label">{region}</div>
          <div className="origins-track">
            {ORIGINS_GUIDE.filter((o) => o.region === region).map((o) => (
              <button
                key={o.country}
                className={`origins-btn ${active?.country === o.country ? "active" : ""}`}
                style={{ "--oc": tc(o.color) }}
                onClick={() => setActive(active?.country === o.country ? null : o)}
              >
                <span className="origins-btn-icon" style={{ color: tc(o.color) }}>{o.icon}</span>
                <span className="origins-btn-label">{o.country}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {active && (
        <div className="origins-detail" style={{ borderTopColor: tc(active.color) }}>
          <div className="origins-detail-header">
            <div>
              <div className="origins-detail-country" style={{ color: tc(active.color) }}>{active.country}</div>
              <div className="origins-detail-region">{active.region}</div>
              <div className="origins-detail-tagline">{active.tagline}</div>
            </div>
          </div>
          <div className="origins-detail-desc">{active.desc}</div>
          <div className="roast-bars" style={{ margin: "16px 0" }}>
            {[
              { label: "Body",       val: active.body },
              { label: "Acidity",    val: active.acidity },
              { label: "Sweetness",  val: active.sweetness },
              { label: "Complexity", val: active.complexity },
            ].map(({ label, val }) => (
              <div className="roast-bar-row" key={label}>
                <span className="roast-bar-label">{label}</span>
                <div className="roast-bar-track">
                  <div className="roast-bar-fill" style={{ width: barVal(val), background: tc(active.color) }} />
                </div>
                <span className="roast-bar-val">{val}/5</span>
              </div>
            ))}
          </div>
          <div className="milk-guide-flavors" style={{ marginBottom: 14 }}>
            {active.flavors.map((f) => (
              <span key={f} className="roast-flavor-tag" style={{ borderColor: tc(active.color) + "88", color: tc(active.color) }}>{f}</span>
            ))}
          </div>
          <div className="roast-bestfor">
            <span className="roast-bestfor-label">Roast recommendation: </span>{active.roastRec}
          </div>
          <div className="roast-bestfor" style={{ marginTop: 6 }}>
            <span className="roast-bestfor-label">Best brew methods: </span>{active.brewRec}
          </div>
          <div className="roast-tip" style={{ marginTop: 12 }}>
            <span className="roast-tip-icon">✦</span>{active.tip}
          </div>
        </div>
      )}
    </div>
  );
}

function GuidePage() {
  const [activeGrind, setActiveGrind] = useState(null);
  const [collapsed, setCollapsed] = useState({
    grind: true,
    roast: true,
    milk: true,
    origins: true,
  });
  const toggle = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const SectionToggle = ({ id, icon, label, children }) => {
    const isOpen = !collapsed[id];
    return (
      <div id={`guide-${id}`} className="guide-collapsible-section">
        <button className="guide-collapse-btn" onClick={() => toggle(id)}>
          <div className="guide-collapse-left">
            <span className="guide-section-icon">{icon}</span>
            <span className="guide-section-label">{label}</span>
          </div>
          <span className="guide-collapse-chevron">{isOpen ? "−" : "+"}</span>
        </button>
        {isOpen && <div className="guide-collapse-body">{children}</div>}
      </div>
    );
  };

  return (
    <div className="page guide-page">
      <div className="guide-header">
        <div className="guide-title">Coffee Guide</div>
        <div className="guide-subtitle">Interactive guides to grind sizes, roast levels, milk options, and coffee origins.</div>
      </div>

      {/* Anchor nav */}
      <div className="guide-anchor-nav">
        {[
          { id: "grind", icon: "◎", label: "Grind" },
          { id: "roast", icon: "◑", label: "Roast" },
          { id: "milk",  icon: "◉", label: "Milk" },
          { id: "origins", icon: "★", label: "Origins" },
        ].map(({ id, icon, label }) => (
          <button key={id} className="guide-anchor-btn" onClick={() => {
            setCollapsed(prev => ({ ...prev, [id]: false }));
            setTimeout(() => document.getElementById(`guide-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
          }}>
            <span className="guide-anchor-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <SectionToggle id="grind" icon="◎" label="Interactive Grind Guide">
        <p className="guide-grind-intro">Click any grind size to learn when and why to use it.</p>
        <div className="faq-grind-track">
          {GRIND_GUIDE.map((g) => (
            <button
              key={g.size}
              className={`faq-grind-btn ${activeGrind?.size === g.size ? "active" : ""}`}
              style={{ "--gc": g.color }}
              onClick={() => setActiveGrind(activeGrind?.size === g.size ? null : g)}
            >
              <div className="faq-grind-dot" style={{ background: g.color }} />
              <span className="faq-grind-label">{g.size}</span>
            </button>
          ))}
        </div>
        {activeGrind && (
          <div className="faq-grind-detail" style={{ borderColor: activeGrind.color + "44" }}>
            <div className="faq-grind-detail-name" style={{ color: activeGrind.color }}>{activeGrind.size}</div>
            <div className="faq-grind-detail-desc">{activeGrind.desc}</div>
            <div className="faq-grind-detail-methods">
              <span className="faq-grind-methods-label">Best for:</span>
              {activeGrind.methods.map((m) => (
                <span key={m} className="faq-grind-method-tag" style={{ borderColor: activeGrind.color + "55", color: activeGrind.color }}>{m}</span>
              ))}
            </div>
          </div>
        )}
      </SectionToggle>

      <SectionToggle id="roast" icon="◑" label="Interactive Roast Guide">
        <RoastGuide />
      </SectionToggle>

      <SectionToggle id="milk" icon="◉" label="Milk & Drinks Guide">
        <MilkGuide />
      </SectionToggle>

      <SectionToggle id="origins" icon="★" label="Coffee Origins">
        <OriginsGuide />
      </SectionToggle>
    </div>
  );
}

function FAQPage() {
  const [openItems, setOpenItems] = useState({});
  const [search, setSearch] = useState("");
  const toggle = (key) => setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));

  const q = search.toLowerCase().trim();
  const filteredSections = FAQ_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    )
  })).filter(section => section.items.length > 0);

  const totalResults = filteredSections.reduce((s, sec) => s + sec.items.length, 0);

  // Track which categories are collapsed — default all collapsed
  const [collapsedCats, setCollapsedCats] = useState(() => {
    const all = {};
    FAQ_SECTIONS.forEach(s => { all[s.category] = true; });
    return all;
  });
  const toggleCat = (cat) => setCollapsedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  const allCollapsed = filteredSections.every(s => collapsedCats[s.category]);
  const toggleAll = () => {
    if (allCollapsed) {
      setCollapsedCats({});
    } else {
      const all = {};
      filteredSections.forEach(s => { all[s.category] = true; });
      setCollapsedCats(all);
    }
  };

  return (
    <div className="page guide-page">
      <div className="guide-header">
        <div className="guide-title">FAQ</div>
        <div className="guide-subtitle">Common questions about coffee, brewing, and getting started.</div>
      </div>

      <div className="journal-search-wrap" style={{ marginBottom: 16 }}>
        <span className="journal-search-icon">⌕</span>
        <input
          className="journal-search"
          placeholder="Search questions..."
          value={search}
          onChange={e => { setSearch(e.target.value); setOpenItems({}); }}
        />
        {search && <button className="journal-search-clear" onClick={() => { setSearch(""); setOpenItems({}); }}>✕</button>}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        {q
          ? <div style={{ fontSize: 12, color: "var(--muted3)", letterSpacing: 1 }}>{totalResults} result{totalResults !== 1 ? "s" : ""} for "{search}"</div>
          : <div style={{ fontSize: 12, color: "var(--muted3)" }}>{FAQ_SECTIONS.length} categories</div>
        }
        {!q && (
          <button onClick={toggleAll} style={{ background: "none", border: "none", color: "var(--gold)", fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", padding: 0 }}>
            {allCollapsed ? "Expand all" : "Collapse all"}
          </button>
        )}
      </div>

      {filteredSections.length === 0 ? (
        <div className="empty" style={{ padding: "48px 0" }}>
          <div className="empty-head">No results found</div>
          <div className="empty-sub">Try a different search term.</div>
          <button className="btn-ghost" onClick={() => setSearch("")}>Clear search</button>
        </div>
      ) : (
        filteredSections.map((section) => {
          const isCatCollapsed = !q && !!collapsedCats[section.category];
          return (
            <div className="guide-section" key={section.category}>
              <div
                className="guide-section-header"
                onClick={() => !q && toggleCat(section.category)}
                style={{ cursor: q ? "default" : "pointer", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="guide-section-icon">{section.icon}</span>
                  <span className="guide-section-label">{section.category}</span>
                  <span style={{ fontSize: 10, color: "var(--muted4)" }}>({section.items.length})</span>
                </div>
                {!q && (
                  <span style={{ color: "var(--muted3)", fontSize: 16, lineHeight: 1, transition: "transform 0.2s", transform: isCatCollapsed ? "rotate(-90deg)" : "rotate(0deg)", display: "inline-block" }}>−</span>
                )}
              </div>
              {!isCatCollapsed && (
                <div className="accordion-list">
                  {section.items.map((item, i) => {
                    const key = `${section.category}-${i}`;
                    const isOpen = !!openItems[key] || (!!q);
                    return (
                      <div key={key} className={`accordion-item ${isOpen ? "open" : ""}`}>
                        <button className="accordion-q" onClick={() => toggle(key)}>
                          <span className="accordion-q-text">{item.q}</span>
                          <span className="accordion-chevron">{isOpen ? "−" : "+"}</span>
                        </button>
                        {isOpen && (
                          <div className="accordion-a">
                            {item.a.split("\n").map((line, li) => (
                              <p key={li} className={line.match(/^\d\./) ? "accordion-step" : ""}>{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// --- Recipes -----------------------------------------------------------------
const RECIPES_STORAGE_KEY = "craft_and_cup_drink_recipes_v1";

const DRINK_TYPES = [
  "Latte", "Cappuccino", "Flat White", "Cortado", "Macchiato",
  "Americano", "Cold Brew", "Iced Latte", "Iced Americano",
  "Mocha", "Matcha Latte", "Chai Latte", "Tea Latte",
  "Espresso Tonic", "Other",
];

const MILK_OPTIONS = [
  "Whole Milk", "2% Milk", "Skim Milk", "Oat Milk", "Almond Milk",
  "Soy Milk", "Coconut Milk", "Macadamia Milk", "Cashew Milk", "Pea Milk", "Rice Milk", "None",
];

const TEMP_OPTIONS = ["Hot", "Iced", "Blended"];

const emptyRecipe = () => ({
  id: Date.now(),
  name: "",
  drinkType: "Latte",
  temp: "Hot",
  espressoShots: 2,
  baseNotes: "",
  milkType: "Oat Milk",
  milkAmount: "",
  syrup: "",
  syrupAmount: "",
  extras: "",
  steps: "",
  notes: "",
  rating: 0,
  createdAt: new Date().toISOString(),
});

function RecipesPage({ showToast }) {
  const [recipes, setRecipes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECIPES_STORAGE_KEY)) || []; } catch { return []; }
  });
  const [view, setView] = useState("list");
  const [active, setActive] = useState(null);
  const [form, setForm] = useState(emptyRecipe());
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
  }, [recipes]);

  const saveRecipe = () => {
    if (!form.name.trim()) { setError("Give your recipe a name."); return; }
    setError("");
    const recipe = { ...form, id: form.id || Date.now(), createdAt: form.createdAt || new Date().toISOString() };
    setRecipes((prev) => {
      const exists = prev.find((r) => r.id === recipe.id);
      return exists ? prev.map((r) => r.id === recipe.id ? recipe : r) : [recipe, ...prev];
    });
    setActive(recipe);
    setView("detail");
    showToast?.("Recipe saved!");
  };

  const deleteRecipe = (id) => { setRecipes((p) => p.filter((r) => r.id !== id)); setView("list"); };
  const startEdit = (r) => { setForm({ ...r }); setError(""); setView("add"); };
  const startAdd = () => { setForm(emptyRecipe()); setError(""); setView("add"); };

  const f = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  // -- Add/Edit form --
  if (view === "add") return (
    <div className="page">
      <div className="form-header">
        <button className="btn-ghost" onClick={() => setView(active ? "detail" : "list")}>← Back</button>
        <h2 className="form-title">{form.createdAt !== emptyRecipe().createdAt ? "Edit Recipe" : "New Recipe"}</h2>
      </div>

      <div className="form-grid">
        <div className="form-group full">
          <label>Recipe Name</label>
          <input placeholder="e.g. Brown Sugar Oat Latte" value={form.name} onChange={(e) => f("name", e.target.value)} />
        </div>

        <div className="form-group">
          <label>Drink Type</label>
          <select value={form.drinkType} onChange={(e) => f("drinkType", e.target.value)}>
            {DRINK_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Temperature</label>
          <select value={form.temp} onChange={(e) => f("temp", e.target.value)}>
            {TEMP_OPTIONS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Espresso Shots</label>
          <select value={form.espressoShots} onChange={(e) => f("espressoShots", Number(e.target.value))}>
            {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n === 0 ? "None" : n}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Milk Type</label>
          <select value={form.milkType} onChange={(e) => f("milkType", e.target.value)}>
            {MILK_OPTIONS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Milk Amount</label>
          <input placeholder="e.g. 180ml or 6oz" value={form.milkAmount} onChange={(e) => f("milkAmount", e.target.value)} />
        </div>

        <div className="form-group">
          <label>Syrup</label>
          <input placeholder="e.g. Brown Sugar, Vanilla, Hazelnut" value={form.syrup} onChange={(e) => f("syrup", e.target.value)} />
        </div>

        <div className="form-group">
          <label>Syrup Amount</label>
          <input placeholder="e.g. 2 pumps or 15ml" value={form.syrupAmount} onChange={(e) => f("syrupAmount", e.target.value)} />
        </div>

        <div className="form-group full">
          <label>Extras</label>
          <input placeholder="e.g. Cold foam, vanilla sweet cream, cinnamon, sea salt" value={form.extras} onChange={(e) => f("extras", e.target.value)} />
        </div>

        <div className="form-group full">
          <label>Steps</label>
          <textarea rows={4} placeholder={"1. Pull 2 shots espresso.\n2. Add syrup to cup.\n3. Steam oat milk to 60C.\n4. Pour milk over espresso.\n5. Top with cold foam."} value={form.steps} onChange={(e) => f("steps", e.target.value)} />
          <div className="hint">Walk yourself through how to make it. Number each step.</div>
        </div>

        <div className="form-group full">
          <label>Notes</label>
          <textarea rows={3} placeholder="What made this good? What would you tweak next time?" value={form.notes} onChange={(e) => f("notes", e.target.value)} />
        </div>

        <div className="form-group full">
          <label>Rating</label>
          <div className="recipe-rating-input">
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <button
                key={n}
                className={`recipe-rating-btn ${form.rating >= n ? "active" : ""}`}
                onClick={() => f("rating", form.rating === n ? 0 : n)}
              >{n}</button>
            ))}
            <span className="recipe-rating-label">{form.rating > 0 ? `${form.rating}/10` : "Not rated"}</span>
          </div>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button className="btn-primary" onClick={saveRecipe}>Save Recipe</button>
        <button className="btn-ghost" onClick={() => setView(active ? "detail" : "list")}>Cancel</button>
      </div>
    </div>
  );

  // -- Detail view --
  if (view === "detail" && active) {
    const r = recipes.find((x) => x.id === active.id) || active;
    const tempColors = { Hot: "#d4b05a", Iced: "#6ab0d4", Blended: "#8aaa6a" };
    const tc = tempColors[r.temp] || "var(--gold)";
    return (
      <div className="page">
        <button className="btn-ghost" onClick={() => setView("list")} style={{ marginBottom: 28 }}>← Recipes</button>
        <div className="recipe-detail">
          <div className="recipe-detail-header">
            <div>
              <div className="recipe-detail-type" style={{ color: tc }}>{r.drinkType} · {r.temp}</div>
              <div className="recipe-detail-name">{r.name}</div>
              {r.rating > 0 && (
                <div className="recipe-detail-rating">
                  <span className="recipe-detail-rating-num" style={{ color: tc }}>{r.rating}</span>
                  <span className="recipe-detail-rating-denom">/10</span>
                </div>
              )}
            </div>
          </div>

          <div className="recipe-detail-grid">
            {/* Ingredients */}
            <div className="recipe-detail-section">
              <div className="detail-block-label">Ingredients</div>
              <div className="recipe-ingredients">
                {r.espressoShots > 0 && (
                  <div className="recipe-ingredient">
                    <span className="recipe-ing-icon">◎</span>
                    <span>{r.espressoShots} shot{r.espressoShots > 1 ? "s" : ""} espresso</span>
                    {r.baseNotes && <span className="recipe-ing-note">{r.baseNotes}</span>}
                  </div>
                )}
                {r.milkType !== "None" && (
                  <div className="recipe-ingredient">
                    <span className="recipe-ing-icon">◉</span>
                    <span>{r.milkAmount ? `${r.milkAmount} ` : ""}{r.milkType}</span>
                  </div>
                )}
                {r.syrup && (
                  <div className="recipe-ingredient">
                    <span className="recipe-ing-icon">◆</span>
                    <span>{r.syrupAmount ? `${r.syrupAmount} ` : ""}{r.syrup} syrup</span>
                  </div>
                )}
                {r.extras && (
                  <div className="recipe-ingredient">
                    <span className="recipe-ing-icon">✦</span>
                    <span>{r.extras}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Steps */}
            {r.steps && (
              <div className="recipe-detail-section">
                <div className="detail-block-label">Steps</div>
                <div className="recipe-steps">
                  {r.steps.split("\n").filter(Boolean).map((step, i) => (
                    <div key={i} className="recipe-step">
                      <span className="recipe-step-num" style={{ color: tc }}>{i + 1}</span>
                      <span className="recipe-step-text">{step.replace(/^\d+\.\s*/, "")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {r.notes && (
            <div className="detail-block" style={{ marginTop: 20 }}>
              <div className="detail-block-label">Notes</div>
              <div className="detail-notes">{r.notes}</div>
            </div>
          )}

          <div className="detail-actions" style={{ marginTop: 28 }}>
            <button className="btn-ghost" onClick={() => { startEdit(r); }}>Edit</button>
            {confirmDelete === r.id ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--muted2)" }}>Are you sure?</span>
                <button className="btn-danger" onClick={() => { deleteRecipe(r.id); setConfirmDelete(null); }}>Yes, delete</button>
                <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              </div>
            ) : (
              <button className="btn-danger" onClick={() => setConfirmDelete(r.id)}>Delete</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -- List view --
  return (
    <div className="page">
      {recipes.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">☕</div>
          <div className="empty-head">Your recipe book is empty</div>
          <div className="empty-sub">Made something you want to make again? Log it here with every detail — milk type, syrup, shots, steps — so you can recreate it exactly.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "20px 0 28px", textAlign: "left", maxWidth: 320 }}>
            {["Save drink recipes with ingredients and steps", "Rate your creations out of 10", "Works great for your own syrups and custom drinks"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "var(--muted2)" }}>
                <span style={{ color: "var(--gold)", flexShrink: 0, marginTop: 2 }}>✦</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={startAdd}>+ Add Your First Recipe</button>
        </div>
      ) : (
        <>
          <div className="list-header">
            <div>
              <div className="list-title">Recipes</div>
              <div className="list-sub">{recipes.length} recipe{recipes.length !== 1 ? "s" : ""} saved</div>
            </div>
            <button className="btn-primary" onClick={startAdd} style={{ fontSize: 11, padding: "8px 18px", letterSpacing: "1.5px" }}>+ Add Recipe</button>
          </div>
          <div className="recipe-list">
            {recipes.map((r) => {
              const tempColors = { Hot: "#d4b05a", Iced: "#6ab0d4", Blended: "#8aaa6a" };
              const tc = tempColors[r.temp] || "var(--gold)";
              return (
                <div key={r.id} className="recipe-card" style={{ "--rc": tc }} onClick={() => { setActive(r); setView("detail"); }}>
                  <div className="recipe-card-left">
                    <div className="recipe-card-type" style={{ color: tc }}>{r.drinkType} · {r.temp}</div>
                    <div className="recipe-card-name">{r.name}</div>
                    <div className="recipe-card-tags">
                      {r.espressoShots > 0 && <span className="bctag">{r.espressoShots} shot{r.espressoShots > 1 ? "s" : ""}</span>}
                      {r.milkType !== "None" && <span className="bctag">{r.milkType}</span>}
                      {r.syrup && <span className="bctag">{r.syrup}</span>}
                      {r.extras && <span className="bctag">{r.extras.split(",")[0].trim()}</span>}
                    </div>
                  </div>
                  {r.rating > 0 && (
                    <div className="recipe-card-rating">
                      <span className="recipe-card-rating-num" style={{ color: tc }}>{r.rating}</span>
                      <span className="recipe-card-rating-denom">/10</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// --- Home / Welcome Screen ---------------------------------------------------
function HomePage({ onNavigate, onTakeTour, onReplayTutorial }) {
  return (
    <div className="welcome-page">
      <div className="welcome-rays" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="welcome-ray" style={{ transform: `rotate(${i * 30}deg)` }} />
        ))}
      </div>

      <div className="welcome-inner">
        <div className="welcome-ornament-top" aria-hidden="true">
          <span className="welcome-orn-line" />
          <span className="welcome-orn-diamond">◆</span>
          <span className="welcome-orn-line" />
        </div>

        <div className="welcome-badge">Coffee Journal & Brew Tool</div>
        <h1 className="welcome-wordmark">Craft<br />&amp; Cup</h1>

        <div className="welcome-deco-divider" aria-hidden="true">
          <span className="wdd-line" />
          <span className="wdd-center">
            <span className="wdd-dot" />
            <span className="wdd-diamond">◆</span>
            <span className="wdd-dot" />
          </span>
          <span className="wdd-line" />
        </div>

        <p className="welcome-tagline">For the curious cup.</p>
        <p className="welcome-desc">
          Craft &amp; Cup is a personal coffee companion for anyone who wants to drink better coffee.
          Maybe you just picked up your first bag of single origin beans. Maybe you've been dialing in espresso
          for years. Either way, this is a place to explore, log what you taste, and get better one cup at a time.
        </p>

        <div className="welcome-features">
          <div className="welcome-feature">
            <span className="welcome-feature-icon">◎</span>
            <span>Log your beans and build a personal flavor library</span>
          </div>
          <div className="welcome-feature">
            <span className="welcome-feature-icon">▽</span>
            <span>Calculate ratios and brew times for any method</span>
          </div>
          <div className="welcome-feature">
            <span className="welcome-feature-icon">✦</span>
            <span>Learn the basics with an interactive coffee guide</span>
          </div>
        </div>

        <button className="welcome-cta" onClick={onTakeTour}>
          Take the tour
        </button>

        <button className="welcome-cta" onClick={onReplayTutorial} style={{ marginTop: 14 }}>
          Replay tutorial
        </button>

        <div className="welcome-ornament-top" aria-hidden="true" style={{ marginTop: 28 }}>
          <span className="welcome-orn-line" />
          <span className="welcome-orn-diamond">◆</span>
          <span className="welcome-orn-line" />
        </div>
      </div>
    </div>
  );
}

// --- Onboarding --------------------------------------------------------------
const ONBOARDING_KEY = "craft_and_cup_onboarded_v1";

const ONBOARDING_STEPS = [
  {
    step: "welcome",
    icon: null,
    title: "Craft & Cup",
    subtitle: "Your personal coffee companion",
    body: "Log your beans, dial in your brews, and learn as you go. Built for enthusiasts and beginners alike.",
  },
  {
    step: "journal",
    icon: "◎",
    title: "The Bean Journal",
    subtitle: "AI-powered flavor mapping",
    body: "Describe what you taste in plain language and Claude AI automatically maps your notes to a multi-tier flavor wheel. No coffee jargon needed.",
  },
  {
    step: "calc",
    icon: "▽",
    title: "Brew Calculator",
    subtitle: "Dial in the perfect cup",
    body: "Precision ratios for 7 brew methods with live timers, grind guides, and a milk drinks calculator for espresso. Everything updates as you adjust.",
  },
  {
    step: "finish",
    icon: "✦",
    title: "You are all set",
    subtitle: null,
    body: "New to specialty coffee? Start with the Guide tab - it covers grind sizes, roast levels, and step by step brew guides. Already know your stuff? Jump straight to the journal.",
  },
];

function OnboardingDemoCalc() {
  const [ratio, setRatio] = useState(16);
  const dose = 20;
  const water = Math.round(dose * ratio);
  const strength = ratio <= 13 ? "Very Strong" : ratio <= 15 ? "Strong" : ratio <= 16 ? "Balanced" : ratio <= 18 ? "Light" : "Very Light";
  const strengthColor = ratio <= 13 ? "var(--red)" : ratio <= 15 ? "var(--gold)" : ratio <= 16 ? "var(--green)" : ratio <= 18 ? "#6ab0d4" : "#a090d0";
  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", padding: "18px 20px" }}>
      <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Try it - drag the ratio</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: "var(--gold)" }}>1 : {ratio}</span>
        <span style={{ fontSize: 13, color: strengthColor, fontStyle: "italic" }}>{strength}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: "var(--muted4)" }}>◂</span>
        <input type="range" min="10" max="20" step="1" value={ratio}
          onChange={e => setRatio(Number(e.target.value))}
          style={{ flex: 1, accentColor: "var(--gold)", cursor: "pointer" }} />
        <span style={{ fontSize: 14, color: "var(--muted4)" }}>▸</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: "var(--bg2)", border: "1px solid var(--border2)", padding: "10px 14px" }}>
          <div style={{ fontSize: 9, color: "var(--muted3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Coffee</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: "var(--text)" }}>{dose}g</div>
        </div>
        <div style={{ flex: 1, background: "var(--bg2)", border: "1px solid var(--gold-dim)", padding: "10px 14px" }}>
          <div style={{ fontSize: 9, color: "var(--muted3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Water</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: "var(--gold)" }}>{water}ml</div>
        </div>
      </div>
    </div>
  );
}

function OnboardingDemoWheel() {
  const mappings = [
    { top: "Fruity", mid: "Berry", specific: "Blackberry", weight: 3 },
    { top: "Fruity", mid: "Citrus", specific: "Orange", weight: 2 },
    { top: "Floral", mid: "Floral", specific: "Jasmine", weight: 2 },
    { top: "Sweet", mid: "Chocolate", specific: "Dark Chocolate", weight: 1 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
        "tastes like blackberry, orange, jasmine, dark chocolate"
      </div>
      <div style={{ fontSize: 20, color: "var(--gold)", marginBottom: 8 }}>↓</div>
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ transform: "scale(0.68)", transformOrigin: "center center", flexShrink: 0 }}>
          <FlavorWheel mappings={mappings} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
        {mappings.map(m => {
          const color = FLAVOR_TAXONOMY[m.top]?.color || "#888";
          return (
            <span key={m.specific} style={{ fontSize: 11, border: "1px solid", borderColor: color + "66", color, padding: "2px 8px" }}>
              {m.specific}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Onboarding({ onComplete, onGoGuide }) {
  const [step, setStep] = useState(0);
  const total = ONBOARDING_STEPS.length;
  const current = ONBOARDING_STEPS[step];
  const isLast = step === total - 1;

  const demos = {
    journal: <OnboardingDemoWheel />,
    calc: <OnboardingDemoCalc />,
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        {/* Progress dots */}
        <div className="onboarding-step-dots">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot ${i === step ? "active" : i < step ? "done" : ""}`}
              onClick={() => setStep(i)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </div>

        {/* Welcome step special treatment */}
        {current.step === "welcome" ? (
          <div className="onboarding-welcome">
            <div className="onboarding-wordmark">Craft & Cup</div>
            <div className="onboarding-tagline">{current.subtitle}</div>
            <div className="onboarding-body">{current.body}</div>
          </div>
        ) : (
          <>
            {current.icon && <div className="onboarding-icon">{current.icon}</div>}
            <div className="onboarding-title">{current.title}</div>
            {current.subtitle && <div className="onboarding-subtitle">{current.subtitle}</div>}
            <div className="onboarding-body">{current.body}</div>
            {demos[current.step] && (
              <div className="onboarding-demo">{demos[current.step]}</div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="onboarding-actions">
          {isLast ? (
            <div className="onboarding-finish-btns">
              <button className="btn-primary onboarding-cta" onClick={onGoGuide}>
                Take me to the Guide →
              </button>
              <button className="onboarding-skip" onClick={onComplete}>
                Start logging beans
              </button>
            </div>
          ) : (
            <div className="onboarding-nav">
              {step > 0 && (
                <button className="onboarding-back" onClick={() => setStep(step - 1)}>← Back</button>
              )}
              <button className="btn-primary onboarding-cta" onClick={() => setStep(step + 1)}>
                Next →
              </button>
              <button className="onboarding-skip" onClick={onComplete}>Skip</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// --- Root App ----------------------------------------------------------------
const TOUR_STEPS = [
  {
    tab: "home",
    title: "Welcome screen",
    desc: "This is where you land every time you open Craft & Cup. From here you can jump straight to any part of the app, or take this tour again whenever you want.",
  },
  {
    tab: "calc",
    title: "Brew Calculator",
    desc: "Dial in the perfect cup for any brew method. Adjust your dose, water amount, and ratio and everything updates live. Save your favourite settings as a recipe so you never lose a good dial-in.",
  },
  {
    tab: "calc",
    title: "Brew Timer",
    desc: "Each method has a built-in stage timer that walks you through the brew step by step. For espresso there is a shot timer with a target zone so you know exactly when to stop.",
  },
  {
    tab: "journal",
    title: "Bean Journal",
    desc: "This is your personal coffee library. Log any bean you try, including the brand, origin, roast level, brew method, and your own tasting notes. The app reads what you write and builds a flavor wheel automatically.",
  },
  {
    tab: "journal",
    title: "Flavor Wheel",
    desc: "When you describe what you taste in plain language, AI maps your words to a multi-tier flavor wheel. The bigger the section, the more prominent that flavor was. No coffee jargon required.",
  },
  {
    tab: "recipes",
    title: "Drink Recipes",
    desc: "Log any drink you love and want to recreate. Save the espresso shots, milk type, syrup, extras, and step-by-step instructions so you can make it exactly the same way every time.",
  },
  {
    tab: "guide",
    title: "Coffee Guide",
    desc: "Four interactive guides covering grind sizes, roast levels, milk options, and coffee origins from around the world. Click any item to expand its full profile.",
  },
  {
    tab: "faq",
    title: "FAQ",
    desc: "Common questions about coffee and brewing answered in plain language. Covers the basics of ratios, bloom, water temperature, and step-by-step guides for every brew method.",
  },
  {
    tab: "home",
    title: "You are all set",
    desc: "That is the full tour. Log your first bean in the Journal, dial in a brew in the Calc, save a drink recipe you love, or explore the Guide whenever you want to learn something new.",
  },
];

function TourBanner({ step, total, onNext, onEnd, title, desc }) {
  const isLast = step === total - 1;
  const pct = ((step + 1) / total) * 100;
  return (
    <div className="tour-banner">
      <div className="tour-progress-bar">
        <div className="tour-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="tour-content">
        <div className="tour-text">
          <div className="tour-step-label">Step {step + 1} of {total}</div>
          <div className="tour-title">{title}</div>
          <div className="tour-desc">{desc}</div>
        </div>
        <div className="tour-controls">
          {isLast ? (
            <button className="tour-btn-end" onClick={onEnd}>Finish tour</button>
          ) : (
            <button className="tour-btn-next" onClick={onNext}>Next →</button>
          )}
          {!isLast && (
            <button className="tour-btn-skip" onClick={onEnd}>End tour</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
      background: "var(--bg3)", border: "1px solid var(--border2)",
      color: "var(--text2)", padding: "12px 24px", fontSize: 13,
      fontFamily: "'Jost', sans-serif", letterSpacing: "0.5px",
      zIndex: 200, animation: "slideUpBanner 0.2s ease",
      display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <span style={{ color: "var(--green)", fontSize: 12 }}>✦</span>
      {message}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [calcMethod, setCalcMethod] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); };

  const [beans, setBeans] = useState(() => {
    try { return JSON.parse(localStorage.getItem("craft_and_cup_beans_v1")) || []; } catch { return []; }
  });

  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem("craft_and_cup_theme") || "system");
  useEffect(() => { localStorage.setItem("craft_and_cup_theme", theme); }, [theme]);
  const toggleTheme = () => setTheme((t) => t === "dark" ? "light" : t === "light" ? "system" : "dark");
  const themeIcon = theme === "dark" ? "☾" : theme === "light" ? "○" : "◐";
  const themeLabel = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "Auto";

  // Onboarding overlay
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARDING_KEY));
  const completeOnboarding = () => { localStorage.setItem(ONBOARDING_KEY, "1"); setShowOnboarding(false); };
  const completeOnboardingToGuide = () => { localStorage.setItem(ONBOARDING_KEY, "1"); setShowOnboarding(false); setTab("guide"); };
  const replayTutorial = () => { setShowOnboarding(true); setTab("home"); };

  // Guided tour
  const [tourStep, setTourStep] = useState(null); // null = not active
  const startTour = () => {
    setTourStep(0);
    setTab(TOUR_STEPS[0].tab);
  };
  const nextTourStep = () => {
    const next = tourStep + 1;
    if (next >= TOUR_STEPS.length) { setTourStep(null); return; }
    setTourStep(next);
    setTab(TOUR_STEPS[next].tab);
  };
  const endTour = () => { setTourStep(null); setTab("home"); };

  const handleBrewCalc = (method) => { setCalcMethod(method); setTab("calc"); };
  const handleNavigate = (t) => setTab(t);

  const [journalTrigger, setJournalTrigger] = useState(0);
  const handleAddBean = () => { setTab("journal"); setJournalTrigger((n) => n + 1); };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Jost:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #0e0e0e;
      --bg2:       #161616;
      --bg3:       #1c1c1c;
      --bg4:       #222222;
      --border:    #2a2a2a;
      --border2:   #333333;
      --border3:   #404040;
      --text:      #ede5d8;
      --text2:     #d4c9b8;
      --muted:     #a89880;
      --muted2:    #907860;
      --muted3:    #786050;
      --muted4:    #605040;
      --muted5:    #484038;
      --gold:      #d4b05a;
      --gold-hi:   #e8c46a;
      --gold-dim:  #d4b05a44;
      --green:     #8aaa6a;
      --red:       #d06860;
      --score-green:  #8aaa6a;
      --score-amber:  #d4b05a;
      --score-orange: #c09040;
      --score-red:    #d06860;
    }

    /* System preference light */
    @media (prefers-color-scheme: light) {
      :root {
        --bg:        #f5ead0;
        --bg2:       #eddfc0;
        --bg3:       #e4d4ac;
        --bg4:       #d9c898;
        --border:    #c0a870;
        --border2:   #a89058;
        --border3:   #907840;
        --text:      #1a1008;
        --text2:     #241808;
        --muted:     #3a2810;
        --muted2:    #4a3818;
        --muted3:    #5a4828;
        --muted4:    #6a5838;
        --muted5:    #7a6848;
        --gold:      #7a5808;
        --gold-hi:   #8a6818;
        --gold-dim:  #7a580822;
        --green:     #3a5020;
        --red:       #801810;
        --score-green:  #3a6a18;
        --score-amber:  #907010;
        --score-orange: #904010;
        --score-red:    #901010;
      }
    }

    /* Manual dark override */
    .theme-dark {
      --bg:        #0e0e0e;
      --bg2:       #161616;
      --bg3:       #1c1c1c;
      --bg4:       #222222;
      --border:    #2a2a2a;
      --border2:   #333333;
      --border3:   #404040;
      --text:      #ede5d8;
      --text2:     #d4c9b8;
      --muted:     #a89880;
      --muted2:    #907860;
      --muted3:    #786050;
      --muted4:    #605040;
      --muted5:    #484038;
      --gold:      #d4b05a;
      --gold-hi:   #e8c46a;
      --gold-dim:  #d4b05a44;
      --green:     #8aaa6a;
      --red:       #d06860;
      --score-green:  #8aaa6a;
      --score-amber:  #d4b05a;
      --score-orange: #c09040;
      --score-red:    #d06860;
    }

    /* Manual light override */
    .theme-light {
      --bg:        #f5ead0;
      --bg2:       #eddfc0;
      --bg3:       #e4d4ac;
      --bg4:       #d9c898;
      --border:    #c0a870;
      --border2:   #a89058;
      --border3:   #907840;
      --text:      #1a1008;
      --text2:     #241808;
      --muted:     #3a2810;
      --muted2:    #4a3818;
      --muted3:    #5a4828;
      --muted4:    #6a5838;
      --muted5:    #7a6848;
      --gold:      #7a5808;
      --gold-hi:   #8a6818;
      --gold-dim:  #7a580822;
      --green:     #3a5020;
      --red:       #801810;
      --score-green:  #3a6a18;
      --score-amber:  #907010;
      --score-orange: #904010;
      --score-red:    #901010;
    }

    html, body { background: var(--bg); }

    .app {
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: 'Jost', sans-serif;
      font-weight: 300;
    }

    /* NAV */
    .nav {
      display: flex; flex-direction: column; align-items: center;
      padding: 14px 24px 0;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
      position: sticky; top: 0; z-index: 20;
    }
    @media (prefers-color-scheme: light) {
      .nav { background: rgba(245,234,208,0.95); backdrop-filter: blur(8px); border-bottom-color: var(--border2); }
    }
    .theme-light .nav { background: rgba(245,234,208,0.95); backdrop-filter: blur(8px); border-bottom-color: var(--border2); }
    .nav-top {
      width: 100%; display: flex; align-items: center; justify-content: center;
      position: relative; margin-bottom: 10px;
    }
    .nav-brand {
      font-family: 'Cormorant Garamond', serif;
      font-size: 16px; font-weight: 600;
      color: var(--gold); letter-spacing: 6px;
      text-transform: uppercase; cursor: pointer;
      text-align: center;
      padding: 5px 24px;
      border: 1px solid var(--gold-dim);
      position: relative;
      transition: all 0.2s;
      user-select: none;
    }
    .nav-brand:hover { background: var(--gold-dim); border-color: var(--gold); }
    .nav-brand:active { transform: scale(0.97); opacity: 0.8; }
    .nav-brand::before {
      content: '';
      position: absolute; inset: 3px;
      border: 1px solid var(--gold-dim);
      pointer-events: none;
    }
    .nav-right {
      position: absolute; right: 0; top: 50%; transform: translateY(-50%);
      display: flex; align-items: center; gap: 8px;
    }
    .nav-left {
      position: absolute; left: 0; top: 50%; transform: translateY(-50%);
    }
    .nav-tabs-wrap {
      position: relative; width: 100%;
    }
    .nav-tabs-wrap::before {
      content: '';
      position: absolute; left: 0; top: 0; bottom: 0;
      width: 24px;
      background: linear-gradient(to left, transparent, var(--bg));
      pointer-events: none; z-index: 1;
    }
    .nav-tabs-wrap::after {
      content: '';
      position: absolute; right: 0; top: 0; bottom: 0;
      width: 24px;
      background: linear-gradient(to right, transparent, var(--bg));
      pointer-events: none; z-index: 1;
    }
    .nav-tabs {
      display: flex; gap: 0;
      overflow-x: auto; max-width: 100%;
      scrollbar-width: none;
    }
    .nav-tabs::-webkit-scrollbar { display: none; }
    .nav-tab {
      background: none; border: none;
      color: var(--muted3); padding: 8px 16px;
      font-family: 'Jost', sans-serif; font-size: 11px;
      font-weight: 400; letter-spacing: 1.5px; text-transform: uppercase;
      cursor: pointer; transition: color 0.2s;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px; white-space: nowrap;
    }
    .nav-tab:hover { color: var(--muted); }
    .nav-tab.active { color: var(--gold); border-bottom-color: var(--gold); }
    .nav-add-bean { display: block; width: 100%; background: var(--gold); color: var(--bg); border: none; padding: 8px 20px; font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; transition: background 0.18s; text-align: center; }
    @media (min-width: 721px) { .nav-add-bean { width: auto; display: inline-block; margin-left: 12px; margin-bottom: 4px; } .nav-tabs-wrap { display: flex; align-items: center; } }
    .nav-add-bean:hover { background: var(--gold-hi); }

    /* PAGE */
    .page { padding: 36px 32px; max-width: 1080px; margin: 0 auto; }

    /* JOURNAL LIST */
    .list-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; }
    .list-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; margin-bottom: 4px; }
    .list-sub { font-size: 12px; color: var(--muted3); letter-spacing: 1px; }
    .bean-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }
    @media (min-width: 1100px) { .bean-grid { grid-template-columns: repeat(3, 1fr); } }
    .bean-card {
      background: var(--bg2); border: 1px solid var(--border);
      padding: 22px; cursor: pointer; transition: all 0.18s;
      position: relative; overflow: hidden;
      box-shadow: inset 0 0 0 3px var(--bg2), inset 0 0 0 4px var(--border);
    }
    .bean-card::before {
      content: ''; position: absolute;
      left: 0; top: 0; bottom: 0; width: 3px;
      background: var(--acc, var(--gold));
    }
    .bean-card:hover { border-color: var(--border3); transform: translateY(-2px); }
    .bc-brand { font-size: 10px; color: var(--muted2); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 5px; }
    .bc-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; margin-bottom: 12px; line-height: 1.2; }
    .bc-tags { display: flex; flex-wrap: wrap; gap: 5px; }
    .bctag { font-size: 10px; color: var(--muted2); border: 1px solid var(--border2); padding: 2px 8px; }
    .bc-summary { font-size: 11px; color: var(--muted3); margin-top: 10px; font-style: italic; line-height: 1.5; }
    .bc-flavor-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
    .bc-flavor-chip { font-size: 10px; border: 1px solid; padding: 2px 7px; letter-spacing: 0.3px; }
    .bean-example-badge {
      font-size: 9px; color: var(--muted3); letter-spacing: 1.5px; text-transform: uppercase;
      border: 1px solid var(--border2); padding: 2px 7px; display: inline-block;
      margin-bottom: 8px;
    }

    /* JOURNAL TOOLBAR */
    .journal-toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .journal-search-wrap { flex: 1; min-width: 200px; position: relative; display: flex; align-items: center; }
    .journal-search-icon { position: absolute; left: 12px; color: var(--muted3); font-size: 16px; pointer-events: none; }
    .journal-search {
      width: 100%; background: var(--bg2); border: 1px solid var(--border2);
      color: var(--text); padding: 10px 36px 10px 34px;
      font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 300;
      outline: none; transition: border 0.15s;
    }
    .journal-search:focus { border-color: var(--gold-dim); }
    .journal-search::placeholder { color: var(--muted3); }
    .journal-search-clear {
      position: absolute; right: 10px; background: none; border: none;
      color: var(--muted3); cursor: pointer; font-size: 11px; padding: 4px;
      transition: color 0.15s;
    }
    .journal-search-clear:hover { color: var(--text); }
    .journal-toolbar-right { display: flex; gap: 8px; align-items: center; }
    .journal-filter-btn {
      background: var(--bg2); border: 1px solid var(--border2); color: var(--muted2);
      padding: 9px 16px; font-family: 'Jost', sans-serif; font-size: 11px;
      letter-spacing: 1px; text-transform: uppercase; cursor: pointer;
      transition: all 0.15s; display: flex; align-items: center; gap: 6px; white-space: nowrap;
    }
    .journal-filter-btn:hover { border-color: var(--border3); color: var(--text); }
    .journal-filter-btn.active { border-color: var(--gold-dim); color: var(--gold); background: var(--bg4); }
    .filter-badge {
      background: var(--gold); color: var(--bg); border-radius: 50%;
      width: 16px; height: 16px; font-size: 9px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .journal-sort {
      background: var(--bg2); border: 1px solid var(--border2); color: var(--muted2);
      padding: 9px 12px; font-family: 'Jost', sans-serif; font-size: 11px;
      letter-spacing: 1px; outline: none; cursor: pointer; transition: border 0.15s;
    }
    .journal-sort:focus { border-color: var(--gold-dim); }

    /* FILTER PANEL */
    .filter-panel {
      background: var(--bg3); border: 1px solid var(--border);
      padding: 20px 22px; margin-bottom: 20px;
      animation: fadeSlide 0.15s ease;
    }
    .filter-group { margin-bottom: 16px; }
    .filter-group:last-of-type { margin-bottom: 0; }
    .filter-group-label { font-size: 10px; color: var(--muted3); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
    .filter-pills { display: flex; flex-wrap: wrap; gap: 6px; }
    .filter-pill {
      background: var(--bg2); border: 1px solid var(--border2);
      color: var(--muted2); padding: 5px 12px;
      font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 0.5px;
      cursor: pointer; transition: all 0.15s;
    }
    .filter-pill:hover { border-color: var(--border3); color: var(--text); }
    .filter-pill.active { border-color: var(--gold); color: var(--gold); background: var(--bg4); }
    .filter-clear {
      background: var(--bg2); border: 1px solid var(--red)44; color: var(--red);
      font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 1px;
      text-transform: uppercase; cursor: pointer; margin-top: 14px;
      padding: 7px 16px; transition: all 0.15s;
    }
    .filter-clear:hover { background: var(--red)15; border-color: var(--red); }

    /* EMPTY */
    .empty { text-align: center; padding: 90px 0; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; filter: grayscale(0.5); }
    .empty-head { font-family: 'Cormorant Garamond', serif; font-size: 26px; margin-bottom: 8px; color: var(--muted); }
    .empty-sub { font-size: 13px; color: var(--muted3); margin-bottom: 28px; }

    /* FORM */
    .form-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
    .form-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .form-group { display: flex; flex-direction: column; gap: 7px; }
    .form-group.full { grid-column: 1 / -1; }
    label { font-size: 10px; color: var(--muted2); letter-spacing: 2px; text-transform: uppercase; }
    input, select, textarea {
      background: var(--bg2); border: 1px solid var(--border2);
      color: var(--text); padding: 11px 13px;
      font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 300;
      outline: none; transition: border 0.15s; width: 100%;
    }
    input:focus, select:focus, textarea:focus { border-color: var(--gold-dim); }
    select option { background: var(--bg2); color: var(--text); }
    textarea { resize: vertical; }
    .hint { font-size: 11px; color: var(--muted3); font-style: italic; margin-top: 4px; line-height: 1.5; }
    .form-error { color: var(--red); font-size: 12px; margin-top: 8px; }
    .form-actions { display: flex; gap: 12px; margin-top: 22px; align-items: center; }
    .analyzing { display: flex; align-items: center; gap: 10px; color: var(--gold); font-size: 12px; letter-spacing: 1px; }
    .spin { width: 15px; height: 15px; border: 2px solid var(--gold-dim); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* BUTTONS */
    .btn-primary {
      background: var(--gold); color: var(--bg); border: none;
      padding: 10px 22px; font-family: 'Jost', sans-serif;
      font-size: 12px; font-weight: 500; letter-spacing: 1.5px;
      text-transform: uppercase; cursor: pointer; transition: background 0.18s;
    }
    .btn-primary:hover { background: var(--gold-hi); }
    .btn-ghost {
      background: transparent; color: var(--muted2); border: 1px solid var(--border2);
      padding: 9px 16px; font-family: 'Jost', sans-serif;
      font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
      cursor: pointer; transition: all 0.15s;
    }
    .btn-ghost:hover { color: var(--text); border-color: var(--muted4); }
    .btn-danger {
      background: transparent; color: var(--red); border: 1px solid var(--red)33;
      padding: 9px 16px; font-family: 'Jost', sans-serif;
      font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
      cursor: pointer; transition: all 0.15s;
    }
    .btn-danger:hover { background: var(--red)15; }
    .btn-brew {
      background: var(--bg4); color: var(--gold);
      border: 1px solid var(--gold)55;
      padding: 9px 18px; font-family: 'Jost', sans-serif;
      font-size: 11px; font-weight: 500; letter-spacing: 1.5px;
      text-transform: uppercase; cursor: pointer; transition: all 0.18s;
      display: flex; align-items: center; gap: 8px;
    }
    .btn-brew:hover { background: var(--gold)15; border-color: var(--gold); }
    .btn-brew-primary {
      background: var(--gold); color: var(--bg);
      border: none; padding: 14px 32px;
      font-family: 'Jost', sans-serif; font-size: 13px;
      font-weight: 500; letter-spacing: 2px; text-transform: uppercase;
      cursor: pointer; transition: all 0.18s;
      display: flex; align-items: center; gap: 10px;
      width: 100%;  justify-content: center;
    }
    .btn-brew-primary:hover { background: var(--gold-hi); transform: translateY(-1px); }
    .btn-brew-icon { font-size: 18px; line-height: 1; }
    .detail-actions { margin-top: 28px; margin-bottom: 10px; }
    .detail-actions-secondary { display: flex; gap: 8px; flex-wrap: wrap; }

    /* DETAIL */
    .detail-layout { display: grid; grid-template-columns: 1fr 420px; gap: 52px; align-items: start; }
    .detail-brand { font-size: 10px; color: var(--muted2); letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px; }
    .detail-name { font-family: 'Cormorant Garamond', serif; font-size: 42px; line-height: 1.05; margin-bottom: 22px; }
    @media (min-width: 721px) { .detail-name { font-size: 34px; } }
    .detail-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 30px; }
    .dtag { font-size: 11px; color: var(--muted2); border: 1px solid var(--border2); padding: 4px 12px; }
    .detail-block { margin-bottom: 26px; }
    .detail-block-label {
      font-size: 10px; color: var(--gold); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;
      display: flex; align-items: center; gap: 8px;
    }
    .detail-block-label::before, .detail-block-label::after {
      content: ''; flex: 0 0 16px; height: 1px; background: var(--gold-dim);
    }
    .detail-summary { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-style: italic; line-height: 1.65; color: var(--text); }
    .detail-notes { font-size: 13px; color: var(--muted); line-height: 1.7; font-style: italic; }
    .flavor-chips { display: flex; flex-wrap: wrap; gap: 7px; }
    .fchip { font-size: 11px; padding: 4px 10px; border: 1px solid; border-radius: 0; }
    .detail-actions-secondary { display: flex; gap: 8px; flex-wrap: wrap; }
    .wheel-col { position: sticky; top: 80px; }
    .wheel-svg-wrap { width: 100%; }
    .flavor-wheel-svg { filter: drop-shadow(0 8px 32px rgba(0,0,0,0.5)); overflow: visible; }
    @media (max-width: 720px) {
      .wheel-svg-wrap { width: 100%; }
      .flavor-wheel-svg { filter: none; overflow: visible; }
    }
    .wheel-label { font-size: 10px; color: var(--muted4); letter-spacing: 3px; text-transform: uppercase; text-align: center; margin-bottom: 14px; }

    /* RECIPES */
    .recipe-list { display: flex; flex-direction: column; gap: 2px; }
    .recipe-card {
      background: var(--bg2); border: 1px solid var(--border);
      padding: 18px 22px; cursor: pointer; transition: all 0.15s;
      display: flex; align-items: center; justify-content: space-between;
      position: relative; overflow: hidden;
    }
    .recipe-card::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
      background: var(--rc, var(--gold));
    }
    .recipe-card:hover { border-color: var(--border3); }
    .recipe-card-left { flex: 1; }
    .recipe-card-type { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; font-family: 'Jost', sans-serif; }
    .recipe-card-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; margin-bottom: 8px; }
    .recipe-card-tags { display: flex; flex-wrap: wrap; gap: 5px; }
    .recipe-card-rating { text-align: right; flex-shrink: 0; margin-left: 16px; }
    .recipe-card-rating-num { font-family: 'Cormorant Garamond', serif; font-size: 28px; }
    .recipe-card-rating-denom { font-size: 12px; color: var(--muted3); }

    /* RECIPE DETAIL */
    .recipe-detail { max-width: 720px; }
    .recipe-detail-header { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
    .recipe-detail-type { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; font-family: 'Jost', sans-serif; }
    .recipe-detail-name { font-family: 'Cormorant Garamond', serif; font-size: 40px; line-height: 1; margin-bottom: 12px; }
    .recipe-detail-rating { display: flex; align-items: baseline; gap: 3px; }
    .recipe-detail-rating-num { font-family: 'Cormorant Garamond', serif; font-size: 32px; }
    .recipe-detail-rating-denom { font-size: 14px; color: var(--muted3); }
    .recipe-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
    .recipe-detail-section { }
    .recipe-ingredients { display: flex; flex-direction: column; gap: 10px; }
    .recipe-ingredient { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--text2); }
    .recipe-ing-icon { color: var(--gold); font-size: 12px; flex-shrink: 0; padding-top: 2px; }
    .recipe-ing-note { font-size: 11px; color: var(--muted3); margin-left: 4px; font-style: italic; }
    .recipe-steps { display: flex; flex-direction: column; gap: 10px; }
    .recipe-step { display: flex; align-items: flex-start; gap: 12px; }
    .recipe-step-num {
      font-family: 'Cormorant Garamond', serif; font-size: 20px;
      line-height: 1; flex-shrink: 0; width: 20px; text-align: center;
    }
    .recipe-step-text { font-size: 13px; color: var(--muted); line-height: 1.65; padding-top: 2px; }

    /* RECIPE RATING INPUT */
    .recipe-rating-input { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .recipe-rating-btn {
      width: 32px; height: 32px; background: var(--bg3); border: 1px solid var(--border2);
      color: var(--muted3); font-family: 'Jost', sans-serif; font-size: 11px;
      cursor: pointer; transition: all 0.15s;
    }
    .recipe-rating-btn.active { background: var(--gold); color: var(--bg); border-color: var(--gold); }
    .recipe-rating-btn:hover { border-color: var(--border3); color: var(--text); }
    .recipe-rating-label { font-size: 12px; color: var(--muted3); margin-left: 8px; }

    @media (max-width: 600px) { .recipe-detail-grid { grid-template-columns: 1fr; } }
    .shot-presets { margin-bottom: 24px; }
    .shot-presets-label { font-size: 10px; color: var(--muted2); letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 10px; }
    .shot-preset-btns { display: flex; gap: 2px; }
    .shot-preset-btn {
      flex: 1; background: var(--bg2); border: 1px solid var(--border);
      color: var(--muted2); padding: 10px 8px; cursor: pointer;
      transition: all 0.15s; display: flex; flex-direction: column;
      align-items: center; gap: 4px; font-family: 'Jost', sans-serif;
      font-size: 12px; font-weight: 400; letter-spacing: 0.5px;
    }
    .shot-preset-btn:hover { border-color: var(--border3); color: var(--text); }
    .shot-preset-btn.active { border-color: var(--gold-dim); background: var(--bg4); color: var(--gold); }
    .shot-preset-sub { font-size: 9px; color: var(--muted3); letter-spacing: 0.5px; }
    .shot-preset-btn.active .shot-preset-sub { color: var(--muted2); }

    /* RECIPES */
    .recipe-bar { display: flex; gap: 10px; align-items: center; margin-bottom: 20px; }
    .recipe-btn-save {
      background: var(--gold); color: var(--bg); border: none;
      padding: 10px 20px; font-family: 'Jost', sans-serif;
      font-size: 11px; font-weight: 500; letter-spacing: 1.5px;
      text-transform: uppercase; cursor: pointer; transition: background 0.18s;
    }
    .recipe-btn-save:hover { background: var(--gold-hi); }
    .recipe-btn-load {
      background: transparent; color: var(--muted2); border: 1px solid var(--border2);
      padding: 9px 16px; font-family: 'Jost', sans-serif;
      font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
      cursor: pointer; transition: all 0.15s;
    }
    .recipe-btn-load:hover { color: var(--text); border-color: var(--border3); }
    .recipe-modal { background: var(--bg3); border: 1px solid var(--border2); padding: 24px; margin-bottom: 20px; animation: fadeSlide 0.2s ease; }
    .recipe-modal-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; margin-bottom: 6px; }
    .recipe-modal-meta { font-size: 11px; color: var(--muted2); margin-bottom: 14px; letter-spacing: 0.5px; }
    .recipe-modal-input { width: 100%; background: var(--bg2); border: 1px solid var(--border2); color: var(--text); padding: 10px 12px; font-family: 'Jost', sans-serif; font-size: 13px; outline: none; margin-bottom: 10px; transition: border 0.15s; }
    .recipe-modal-input:focus { border-color: var(--gold-dim); }
    .recipe-modal-err { font-size: 11px; color: var(--red); margin-bottom: 10px; }
    .recipe-modal-actions { display: flex; gap: 10px; }
    .recipe-list { background: var(--bg3); border: 1px solid var(--border); margin-bottom: 20px; }
    .recipe-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border); transition: background 0.15s; }
    .recipe-item:last-child { border-bottom: none; }
    .recipe-item-left { cursor: pointer; flex: 1; }
    .recipe-item-left:hover .recipe-item-name { color: var(--gold); }
    .recipe-item-name { font-size: 14px; color: var(--text2); margin-bottom: 3px; font-family: 'Cormorant Garamond', serif; transition: color 0.15s; }
    .recipe-item-meta { font-size: 11px; color: var(--muted2); letter-spacing: 0.5px; }
    .recipe-item-delete { background: none; border: none; color: var(--muted3); cursor: pointer; padding: 4px 8px; font-size: 12px; transition: color 0.15s; flex-shrink: 0; }
    .recipe-item-delete:hover { color: var(--red); }

    /* BREW CALCULATOR */
    .calc-wrap { max-width: 860px; margin: 0 auto; padding: 36px 32px; }
    .method-tabs { display: flex; gap: 2px; margin-bottom: 36px; flex-wrap: wrap; }
    .method-tabs-wrap { position: relative; margin-bottom: 36px; }
    .method-tabs-scroll { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; }
    @media (max-width: 720px) { .method-tabs { display: none; } .method-tabs-wrap { display: block; } }
    @media (min-width: 721px) { .method-tabs-wrap { display: none; } .method-tabs { display: flex; } }
    .method-tab {
      flex: 1; min-width: 100px;
      background: var(--bg2); border: 1px solid var(--border);
      color: var(--muted3); padding: 12px 8px;
      font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 1px;
      text-transform: uppercase; cursor: pointer; transition: all 0.18s;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
    }
    @media (max-width: 720px) {
      .method-tab { min-width: unset; padding: 10px 4px; font-size: 9px; letter-spacing: 0.5px; gap: 4px; }
      .method-icon { font-size: 18px; }
    }
    .method-tab:hover { border-color: var(--border3); color: var(--muted); }
    .method-tab.active { background: var(--bg4); border-color: var(--gold-dim); color: var(--gold); }
    .method-icon { font-size: 22px; }
    .method-label { font-size: 10px; text-align: center; line-height: 1.3; }
    .calc-body { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    .calc-section-head {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px;
      font-size: 10px; color: var(--muted2); letter-spacing: 2px; text-transform: uppercase;
    }
    .unit-toggle { display: flex; gap: 2px; }
    .utog {
      background: none; border: 1px solid var(--border2); color: var(--muted3);
      padding: 4px 10px; font-family: 'Jost', sans-serif; font-size: 10px;
      letter-spacing: 1px; cursor: pointer; transition: all 0.15s;
    }
    .utog.active { background: var(--bg4); color: var(--gold); border-color: var(--gold-dim); }
    .input-group { margin-bottom: 18px; }
    .input-group label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
    .input-unit { color: var(--muted4); letter-spacing: 0.5px; font-size: 9px; }
    .ratio-group { margin-top: 8px; }
    .ratio-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .ratio-header label { font-size: 10px; color: var(--muted2); letter-spacing: 2px; text-transform: uppercase; }
    .ratio-display { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: var(--gold); }
    .ratio-slider {
      width: 100%; -webkit-appearance: none; appearance: none;
      height: 2px; background: var(--border2); outline: none; margin-bottom: 8px;
    }
    .ratio-slider::-webkit-slider-thumb {
      -webkit-appearance: none; width: 22px; height: 22px;
      background: var(--gold); cursor: grab; border-radius: 50%;
      border: 3px solid var(--bg); box-shadow: 0 0 0 2px var(--gold-dim);
    }
    .ratio-slider::-webkit-slider-thumb:active { cursor: grabbing; }
    .ratio-ends { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted4); }
    .calc-outputs { display: flex; flex-direction: column; gap: 10px; }
    .output-card {
      background: var(--bg2); border: 1px solid var(--border);
      padding: 14px 18px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .output-card.primary {
      border-color: var(--gold-dim); background: var(--bg3);
      box-shadow: inset 0 0 0 3px var(--bg3), inset 0 0 0 4px var(--gold-dim);
    }
    .output-label { font-size: 10px; color: var(--muted2); letter-spacing: 2px; text-transform: uppercase; }
    .output-value { font-family: 'Cormorant Garamond', serif; font-size: 26px; color: var(--text); }
    .output-card.primary .output-value { color: var(--gold); }

    /* GRIND */
    .grind-section { background: var(--bg2); border: 1px solid var(--border); padding: 22px 24px; margin-bottom: 20px; }
    .grind-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
    .grind-title { font-size: 10px; color: var(--muted2); letter-spacing: 2px; text-transform: uppercase; }
    .grind-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; }
    .grind-bar-wrap { display: flex; justify-content: space-between; align-items: center; padding: 8px 0 20px; gap: 4px; }
    .grind-segment { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; cursor: default; }
    .grind-dot { width: 10px; height: 10px; border-radius: 50%; transition: all 0.25s; }
    .grind-tick-label { position: absolute; top: 18px; font-size: 9px; color: var(--muted); white-space: nowrap; letter-spacing: 0.5px; }
    .grind-desc { font-size: 12px; color: var(--muted2); font-style: italic; margin-top: 8px; }

    /* BREW NOTE */
    .brew-note {
      background: var(--bg2); border-left: 2px solid var(--gold-dim);
      padding: 16px 18px; font-size: 12px; color: var(--muted);
      line-height: 1.7; display: flex; gap: 10px; margin-bottom: 20px;
    }
    .brew-note-icon { color: var(--gold); font-size: 10px; flex-shrink: 0; margin-top: 2px; }

    /* BREW TIMER */
    .timer-wrap { background: var(--bg2); border: 1px solid var(--border); padding: 28px 28px 22px; }
    .timer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .timer-title { font-size: 10px; color: var(--muted2); letter-spacing: 2px; text-transform: uppercase; }
    .timer-total { font-family: 'Cormorant Garamond', serif; font-size: 18px; color: var(--muted3); }
    .timer-clock-area { margin-bottom: 22px; }
    .timer-stage-area { text-align: center; padding: 10px 0 20px; }
    .timer-stage-name { font-size: 10px; color: var(--gold); letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px; }
    .timer-stage-countdown { font-family: 'Cormorant Garamond', serif; font-size: 72px; color: var(--text); line-height: 1; margin-bottom: 10px; transition: color 0.3s; }
    .timer-stage-instruction { font-size: 13px; color: var(--muted2); font-style: italic; line-height: 1.6; }
    .timer-stage-dots { display: flex; justify-content: center; gap: 0; margin-bottom: 16px; }
    .timer-stage-dot-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; max-width: 80px; }
    .timer-stage-dot { width: 8px; height: 8px; border-radius: 50%; transition: all 0.3s; }
    .timer-stage-dot.past { background: var(--gold); }
    .timer-stage-dot.current { background: var(--gold); box-shadow: 0 0 0 3px var(--gold-dim); transform: scale(1.4); }
    .timer-stage-dot.future { background: var(--border3); border: 1px solid var(--border3); }
    .timer-stage-dot-label { font-size: 9px; color: var(--muted4); letter-spacing: 0.5px; text-align: center; }
    .timer-progress-track { height: 2px; background: var(--border); margin-top: 4px; }
    .timer-progress-fill { height: 100%; background: var(--gold-dim); transition: width 1s linear; }
    .timer-done { text-align: center; padding: 20px 0; }
    .timer-done-icon { font-size: 28px; color: var(--gold); margin-bottom: 10px; }
    .timer-done-text { font-family: 'Cormorant Garamond', serif; font-size: 28px; margin-bottom: 6px; }
    .timer-done-sub { font-size: 13px; color: var(--muted2); }
    .timer-clock-espresso { text-align: center; padding: 10px 0 16px; }
    .timer-big { font-family: 'Cormorant Garamond', serif; font-size: 80px; line-height: 1; margin-bottom: 6px; transition: color 0.4s; }
    .timer-esp-label { font-size: 13px; letter-spacing: 1px; margin-bottom: 4px; transition: color 0.4s; }
    .timer-esp-target { font-size: 10px; color: var(--muted4); letter-spacing: 1px; margin-bottom: 20px; }
    .timer-esp-bar-wrap { max-width: 320px; margin: 0 auto; }
    .timer-esp-bar-track { position: relative; height: 4px; background: var(--border2); margin-bottom: 8px; }
    .timer-esp-zone { position: absolute; top: 0; height: 100%; background: var(--green)44; border-left: 1px solid var(--green)66; border-right: 1px solid var(--green)66; }
    .timer-esp-cursor { position: absolute; top: -4px; width: 12px; height: 12px; border-radius: 50%; transform: translateX(-50%); transition: left 0.5s linear, background 0.4s; border: 2px solid var(--bg); }
    .timer-esp-bar-labels { display: flex; justify-content: space-between; font-size: 9px; color: var(--muted4); }
    .timer-cold { background: var(--bg2); border: 1px solid var(--border); padding: 20px 24px; display: flex; gap: 16px; align-items: flex-start; }
    .timer-cold-icon { font-size: 22px; margin-top: 2px; }
    .timer-cold-head { font-size: 13px; color: var(--text); margin-bottom: 4px; }
    .timer-cold-sub { font-size: 12px; color: var(--muted2); font-style: italic; line-height: 1.6; }
    .timer-controls { display: flex; gap: 10px; margin-top: 4px; }
    @media (max-width: 720px) { .timer-controls { flex-direction: column; } .timer-btn-start, .timer-btn-pause, .timer-btn-reset { width: 100%; text-align: center; } }
    .timer-btn-start { background: var(--gold); color: var(--bg); border: none; padding: 14px 32px; font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; transition: background 0.18s; min-height: 48px; }
    .timer-btn-start:hover { background: var(--gold-hi); }
    .timer-btn-pause { background: transparent; color: var(--gold); border: 1px solid var(--gold)55; padding: 14px 28px; font-family: 'Jost', sans-serif; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; min-height: 48px; }
    .timer-btn-pause:hover { background: var(--gold)15; }
    .timer-btn-reset { background: transparent; color: var(--muted4); border: 1px solid var(--border2); padding: 14px 24px; font-family: 'Jost', sans-serif; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; min-height: 48px; }
    .timer-btn-reset:hover { color: var(--muted); border-color: var(--muted4); }

    /* MILK DRINKS */
    .milk-wrap { background: var(--bg2); border: 1px solid var(--border); padding: 24px 26px; margin-top: 20px; }
    .milk-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 20px; }
    .milk-title { font-size: 10px; color: var(--muted2); letter-spacing: 2px; text-transform: uppercase; }
    .milk-sub { font-size: 11px; color: var(--muted3); font-style: italic; }
    .milk-tabs { display: flex; gap: 2px; flex-wrap: wrap; margin-bottom: 20px; }
    .milk-tab {
      flex: 1; min-width: 80px;
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      background: var(--bg3); border: 1px solid var(--border);
      padding: 10px 6px; cursor: pointer; transition: all 0.15s;
      color: var(--muted3);
    }
    .milk-tab:hover { border-color: var(--border3); color: var(--muted); }
    .milk-tab.active { border-color: var(--gold-dim); background: var(--bg4); color: var(--gold); }
    .milk-tab-icon { font-size: 16px; }
    .milk-tab-name { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; text-align: center; font-family: 'Jost', sans-serif; }
    .milk-detail { }
    .milk-desc { font-size: 13px; color: var(--muted); line-height: 1.7; margin-bottom: 20px; font-style: italic; }
    .milk-bar-wrap { margin-bottom: 20px; }
    .milk-bar { display: flex; height: 10px; overflow: hidden; border-radius: 0; gap: 2px; margin-bottom: 10px; }
    .milk-bar-seg { height: 100%; transition: width 0.4s ease; }
    .milk-bar-seg.esp   { background: var(--gold); }
    .milk-bar-seg.milk  { background: #a0c0d8; }
    .milk-bar-seg.foam  { background: #d8d0c0; }
    .milk-bar-seg.water { background: #80a8c0; }
    .milk-bar-legend { display: flex; flex-wrap: wrap; gap: 10px; }
    .mbl { font-size: 10px; display: flex; align-items: center; gap: 5px; color: var(--muted2); }
    .mbl::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
    .mbl.esp::before   { background: var(--gold); }
    .mbl.milk::before  { background: #a0c0d8; }
    .mbl.foam::before  { background: #d8d0c0; }
    .mbl.water::before { background: #80a8c0; }
    .milk-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px; margin-bottom: 18px; }
    .milk-stat { background: var(--bg3); border: 1px solid var(--border); padding: 12px 14px; }
    .milk-stat-val { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: var(--gold); }
    .milk-stat-label { font-size: 10px; color: var(--muted3); letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
    .milk-tip { background: var(--bg3); border-left: 2px solid var(--gold-dim); padding: 12px 16px; font-size: 12px; color: var(--muted); line-height: 1.7; display: flex; gap: 10px; }
    .milk-tip-icon { color: var(--gold); flex-shrink: 0; font-size: 10px; margin-top: 2px; }

    /* TASTING SCORES */
    .scores-wrap { margin-top: 28px; }
    .scores-header { margin-bottom: 16px; }
    .scores-title-row { display: flex; justify-content: space-between; align-items: center; }
    .scores-overall { display: flex; align-items: baseline; gap: 2px; }
    .scores-overall-num { font-family: 'Cormorant Garamond', serif; font-size: 32px; line-height: 1; transition: color 0.3s; }
    .scores-overall-denom { font-size: 12px; color: var(--muted3); }
    .scores-list { display: flex; flex-direction: column; gap: 14px; }
    .score-row { display: flex; flex-direction: column; gap: 6px; }
    .score-row-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .score-attr-info { display: flex; flex-direction: column; gap: 2px; }
    .score-attr-label { font-size: 11px; color: var(--gold); letter-spacing: 1px; text-transform: uppercase; }
    .score-attr-desc { font-size: 10px; color: var(--muted3); font-style: italic; }
    .score-val { font-family: 'Cormorant Garamond', serif; font-size: 22px; line-height: 1; transition: color 0.3s; }
    .score-slider-wrap { display: flex; flex-direction: column; gap: 4px; }
    .score-slider { width: 100%; -webkit-appearance: none; appearance: none; height: 2px; outline: none; background: linear-gradient(to right, var(--fill) 0%, var(--fill) var(--pct), var(--border2) var(--pct), var(--border2) 100%); transition: background 0.2s; }
    .score-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: var(--fill); cursor: pointer; border-radius: 50%; border: 2px solid var(--bg); transition: background 0.2s; }
    .score-track-labels { display: flex; justify-content: space-between; font-size: 9px; color: var(--muted5); }

    /* Collection card score badge */
    .bc-score { display: flex; align-items: baseline; gap: 1px; margin-top: 10px; }
    .bc-score-num { font-family: 'Cormorant Garamond', serif; font-size: 20px; color: var(--gold); }
    .bc-score-denom { font-size: 10px; color: var(--muted3); }

    /* GUIDE PAGE */
    .guide-collapsible-section { margin-bottom: 4px; }
    .guide-collapse-btn {
      width: 100%; display: flex; justify-content: space-between; align-items: center;
      background: var(--bg2); border: 1px solid var(--border);
      padding: 16px 20px; cursor: pointer; transition: all 0.15s;
      text-align: left;
    }
    .guide-collapse-btn:hover { background: var(--bg3); border-color: var(--border3); }
    .guide-collapse-left { display: flex; align-items: center; gap: 10px; }
    .guide-collapse-chevron { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: var(--gold); line-height: 1; flex-shrink: 0; }
    .guide-collapse-body { background: var(--bg2); border: 1px solid var(--border); border-top: none; padding: 24px; margin-bottom: 0; animation: fadeSlide 0.2s ease; }
    @media (min-width: 721px) { .guide-page { max-width: 900px; } }
    .guide-header { margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid var(--border); }
    .guide-anchor-nav { display: flex; gap: 4px; margin-bottom: 40px; flex-wrap: wrap; }
    .guide-anchor-btn { display: flex; align-items: center; gap: 7px; background: var(--bg2); border: 1px solid var(--border2); color: var(--muted2); padding: 9px 18px; font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; flex: 1; justify-content: center; }
    .guide-anchor-btn:hover { border-color: var(--gold-dim); color: var(--gold); background: var(--bg3); }
    .guide-anchor-icon { font-size: 10px; color: var(--gold); }
    .guide-title { font-family: 'Cormorant Garamond', serif; font-size: 36px; margin-bottom: 10px; }
    .guide-subtitle { font-size: 14px; color: var(--muted2); line-height: 1.6; font-style: italic; }
    .guide-grind-section { margin-bottom: 48px; }
    .guide-grind-intro { font-size: 12px; color: var(--muted2); margin-bottom: 20px; font-style: italic; }
    .faq-grind-track { display: flex; gap: 2px; flex-wrap: wrap; margin-bottom: 0; }
    .faq-grind-btn { flex: 1; min-width: 86px; display: flex; flex-direction: column; align-items: center; gap: 8px; background: var(--bg2); border: 1px solid var(--border); padding: 16px 8px; cursor: pointer; transition: all 0.18s; }
    .faq-grind-btn:hover { border-color: var(--gc); }
    .faq-grind-btn.active { border-color: var(--gc); background: var(--bg4); }
    .faq-grind-dot { width: 14px; height: 14px; border-radius: 50%; transition: transform 0.2s; }
    .faq-grind-btn.active .faq-grind-dot { transform: scale(1.4); box-shadow: 0 0 0 3px var(--gc, #888)33; }
    .faq-grind-label { font-size: 9px; color: var(--muted2); letter-spacing: 0.5px; text-transform: uppercase; text-align: center; line-height: 1.4; transition: color 0.18s; }
    .faq-grind-btn.active .faq-grind-label { color: var(--gc); }
    .faq-grind-detail { margin-top: 2px; background: var(--bg2); border: 1px solid var(--border); border-top-width: 2px; padding: 22px 24px; animation: fadeSlide 0.2s ease; }
    @keyframes fadeSlide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    .faq-grind-detail-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; margin-bottom: 10px; }
    .faq-grind-detail-desc { font-size: 13px; color: var(--muted); line-height: 1.8; margin-bottom: 16px; }
    .faq-grind-detail-methods { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .faq-grind-methods-label { font-size: 10px; color: var(--muted3); letter-spacing: 1px; text-transform: uppercase; }
    .faq-grind-method-tag { font-size: 11px; border: 1px solid; padding: 3px 10px; }
    .guide-section { margin-bottom: 40px; }
    .guide-section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .guide-section-icon { font-size: 10px; color: var(--gold); }
    .guide-section-label { font-size: 10px; color: var(--gold); letter-spacing: 4px; text-transform: uppercase; }
    .guide-section-header::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .accordion-list { display: flex; flex-direction: column; gap: 2px; }
    .accordion-item { background: var(--bg2); border: 1px solid var(--border); overflow: hidden; }
    .accordion-item.open { border-color: var(--border3); }
    .accordion-q { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; background: none; border: none; cursor: pointer; text-align: left; gap: 16px; transition: background 0.15s; }
    .accordion-q:hover { background: var(--bg3); }
    .accordion-q-text { font-size: 14px; color: var(--text2); line-height: 1.4; font-family: 'Cormorant Garamond', serif; }
    .accordion-chevron { font-size: 20px; color: var(--gold); flex-shrink: 0; font-family: 'Cormorant Garamond', serif; line-height: 1; }
    .accordion-a { padding: 4px 20px 20px; border-top: 1px solid var(--border); }
    .accordion-a p { font-size: 13px; color: var(--muted); line-height: 1.8; margin-top: 12px; }
    .accordion-a p.accordion-step { padding-left: 10px; border-left: 2px solid var(--gold-dim); color: var(--muted2); }

    /* ORIGINS GUIDE */
    .origins-region-group { margin-bottom: 12px; }
    .origins-region-label { font-size: 9px; color: var(--muted3); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; padding-left: 2px; font-family: 'Jost', sans-serif; }
    .origins-track { display: flex; gap: 2px; flex-wrap: wrap; }
    .origins-btn {
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      background: var(--bg2); border: 1px solid var(--border);
      padding: 10px 14px; cursor: pointer; transition: all 0.18s;
      min-width: 80px; flex: 1;
    }
    .origins-btn:hover { border-color: var(--oc); }
    .origins-btn.active { border-color: var(--oc); background: var(--bg4); }
    .origins-btn-icon { font-size: 14px; transition: transform 0.2s; }
    .origins-btn.active .origins-btn-icon { transform: scale(1.3); }
    .origins-btn-label { font-size: 9px; color: var(--muted2); letter-spacing: 0.5px; text-transform: uppercase; text-align: center; font-family: 'Jost', sans-serif; transition: color 0.18s; }
    .origins-btn.active .origins-btn-label { color: var(--oc); }
    .origins-detail {
      margin-top: 2px; background: var(--bg2);
      border: 1px solid var(--border); border-top: 2px solid;
      padding: 24px 26px; animation: fadeSlide 0.2s ease;
    }
    .origins-detail-header { margin-bottom: 14px; }
    .origins-detail-country { font-family: 'Cormorant Garamond', serif; font-size: 28px; margin-bottom: 2px; }
    .origins-detail-region { font-size: 9px; color: var(--muted3); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
    .origins-detail-tagline { font-size: 13px; color: var(--muted); font-style: italic; }
    .origins-detail-desc { font-size: 13px; color: var(--muted); line-height: 1.75; }

    /* MILK GUIDE */
    .milk-guide-track { display: flex; gap: 2px; flex-wrap: wrap; margin-bottom: 0; }
    .milk-guide-btn {
      flex: 1; min-width: 80px;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      background: var(--bg2); border: 1px solid var(--border);
      padding: 12px 6px; cursor: pointer; transition: all 0.18s;
    }
    .milk-guide-btn:hover { border-color: var(--mc); }
    .milk-guide-btn.active { border-color: var(--mc); background: var(--bg4); }
    .milk-guide-icon { font-size: 16px; transition: transform 0.2s; }
    .milk-guide-btn.active .milk-guide-icon { transform: scale(1.3); }
    .milk-guide-label { font-size: 9px; color: var(--muted2); letter-spacing: 0.5px; text-transform: uppercase; text-align: center; line-height: 1.4; transition: color 0.18s; font-family: 'Jost', sans-serif; }
    .milk-guide-btn.active .milk-guide-label { color: var(--mc); }
    .milk-guide-detail {
      margin-top: 2px; background: var(--bg2);
      border: 1px solid var(--border); border-top: 2px solid;
      padding: 24px 26px; animation: fadeSlide 0.2s ease;
    }
    .milk-guide-detail-header { margin-bottom: 16px; }
    .milk-guide-detail-name { font-family: 'Cormorant Garamond', serif; font-size: 24px; margin-bottom: 4px; }
    .milk-guide-detail-tagline { font-size: 13px; color: var(--muted); font-style: italic; }
    .milk-guide-split { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 4px; }
    .milk-guide-half { }
    .milk-guide-half-label { font-size: 10px; color: var(--gold); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
    .milk-guide-half-desc { font-size: 12px; color: var(--muted); line-height: 1.7; margin-bottom: 10px; }
    .milk-guide-flavors { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 4px; }
    @media (max-width: 560px) { .milk-guide-split { grid-template-columns: 1fr; } }

    /* ROAST GUIDE */
    .roast-track { display: flex; gap: 2px; flex-wrap: wrap; margin-bottom: 0; }
    .roast-btn {
      flex: 1; min-width: 70px;
      display: flex; flex-direction: column; align-items: center; gap: 7px;
      background: var(--bg2); border: 1px solid var(--border);
      padding: 12px 6px; cursor: pointer; transition: all 0.18s;
    }
    .roast-btn:hover { border-color: var(--rc); }
    .roast-btn.active { border-color: var(--rc); background: var(--bg4); }
    .roast-bean-icon { font-size: 20px; transition: transform 0.2s; line-height: 1; }
    .roast-btn.active .roast-bean-icon { transform: scale(1.3); }
    .roast-btn-label { font-size: 9px; color: var(--muted2); letter-spacing: 0.5px; text-transform: uppercase; text-align: center; line-height: 1.4; transition: color 0.18s; font-family: 'Jost', sans-serif; }
    .roast-btn.active .roast-btn-label { color: var(--rc); }
    .roast-detail {
      margin-top: 2px; background: var(--bg2);
      border: 1px solid var(--border); border-top: 2px solid;
      padding: 24px 26px;
      animation: fadeSlide 0.2s ease;
    }
    .roast-detail-top { margin-bottom: 14px; }
    .roast-detail-level { font-family: 'Cormorant Garamond', serif; font-size: 26px; margin-bottom: 4px; }
    .roast-detail-tagline { font-size: 13px; color: var(--muted); font-style: italic; margin-bottom: 4px; }
    .roast-detail-temp { font-size: 10px; color: var(--muted3); letter-spacing: 1px; }
    .roast-detail-desc { font-size: 13px; color: var(--muted); line-height: 1.8; margin-bottom: 20px; }
    .roast-bars { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .roast-bar-row { display: flex; align-items: center; gap: 12px; }
    .roast-bar-label { font-size: 10px; color: var(--muted3); letter-spacing: 1px; text-transform: uppercase; width: 70px; flex-shrink: 0; }
    .roast-bar-track { flex: 1; height: 3px; background: var(--border2); }
    .roast-bar-fill { height: 100%; transition: width 0.4s ease; }
    .roast-bar-val { font-size: 10px; color: var(--muted3); width: 28px; text-align: right; flex-shrink: 0; }
    .roast-flavors { margin-bottom: 16px; }
    .roast-flavors-label { font-size: 10px; color: var(--muted3); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
    .roast-flavor-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .roast-flavor-tag { font-size: 11px; border: 1px solid; padding: 3px 10px; }
    .roast-chars { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .roast-char { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted2); }
    .roast-char-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .roast-bestfor { font-size: 12px; color: var(--muted2); margin-bottom: 12px; line-height: 1.6; }
    .roast-bestfor-label { color: var(--muted3); text-transform: uppercase; letter-spacing: 1px; font-size: 10px; }
    .roast-tip { background: var(--bg3); border-left: 2px solid var(--gold-dim); padding: 12px 16px; font-size: 12px; color: var(--muted); line-height: 1.7; display: flex; gap: 10px; }
    .roast-tip-icon { color: var(--gold); flex-shrink: 0; font-size: 10px; margin-top: 2px; }

    /* Light mode guide overrides */
    @media (prefers-color-scheme: light) {
      .roast-detail-desc, .faq-grind-detail-desc { color: var(--muted); }
      .roast-char { color: var(--text2); }
      .roast-bestfor { color: var(--muted); }
      .roast-bestfor-label { color: var(--muted2); }
      .roast-detail-tagline { color: var(--muted2); }
      .roast-detail-temp { color: var(--muted2); }
      .roast-bar-label { color: var(--muted2); }
      .roast-bar-val { color: var(--muted2); }
      .roast-flavors-label { color: var(--muted2); }
      .roast-tip { color: var(--muted); }
      .faq-grind-detail-name { color: var(--text); }
      .roast-detail-level { color: var(--text); }
      .guide-section-label { color: var(--muted); }
      .guide-subtitle { color: var(--muted2); }
      .guide-grind-intro { color: var(--muted2); }
      .origins-detail-desc { color: var(--muted); }
      .origins-detail-tagline { color: var(--muted2); }
      .milk-guide-half-desc { color: var(--muted); }
      .accordion-q-text { color: var(--text2); }
      .accordion-a p { color: var(--muted); }
    }
    .theme-light .roast-detail-desc, .theme-light .faq-grind-detail-desc { color: var(--muted); }
    .theme-light .roast-char { color: var(--text2); }
    .theme-light .roast-bestfor { color: var(--muted); }
    .theme-light .roast-bestfor-label { color: var(--muted2); }
    .theme-light .roast-detail-tagline { color: var(--muted2); }
    .theme-light .roast-detail-temp { color: var(--muted2); }
    .theme-light .roast-bar-label { color: var(--muted2); }
    .theme-light .roast-bar-val { color: var(--muted2); }
    .theme-light .roast-flavors-label { color: var(--muted2); }
    .theme-light .roast-tip { color: var(--muted); }
    .theme-light .faq-grind-detail-name { color: var(--text); }
    .theme-light .roast-detail-level { color: var(--text); }
    .theme-light .guide-section-label { color: var(--muted); }
    .theme-light .guide-subtitle { color: var(--muted2); }
    .theme-light .guide-grind-intro { color: var(--muted2); }
    .theme-light .origins-detail-desc { color: var(--muted); }
    .theme-light .origins-detail-tagline { color: var(--muted2); }
    .theme-light .milk-guide-half-desc { color: var(--muted); }
    .theme-light .accordion-q-text { color: var(--text2); }
    .theme-light .accordion-a p { color: var(--muted); }

    /* ONBOARDING */
    .onboarding-overlay {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(0,0,0,0.85);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .onboarding-card {
      background: var(--bg2); border: 1px solid var(--border2);
      padding: 36px 32px; max-width: 520px; width: 100%;
      text-align: center;
      animation: slideUp 0.3s ease;
      max-height: 90vh; overflow-y: auto;
    }
    @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .onboarding-step-dots { display: flex; justify-content: center; gap: 6px; margin-bottom: 28px; }
    .onboarding-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border3); transition: all 0.2s; }
    .onboarding-dot.active { background: var(--gold); transform: scale(1.3); }
    .onboarding-dot.done { background: var(--gold)88; }

    /* Welcome step */
    .onboarding-welcome { margin-bottom: 20px; }
    .onboarding-wordmark {
      font-family: 'Cormorant Garamond', serif; font-size: 42px;
      color: var(--gold); letter-spacing: 2px; margin-bottom: 8px;
    }
    .onboarding-tagline { font-size: 12px; color: var(--muted3); letter-spacing: 3px; text-transform: uppercase; margin-bottom: 20px; }

    /* Regular steps */
    .onboarding-icon { font-size: 32px; margin-bottom: 12px; }
    .onboarding-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; margin-bottom: 6px; color: var(--text); }
    .onboarding-subtitle { font-size: 10px; color: var(--gold); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px; }
    .onboarding-body { font-size: 13px; color: var(--muted); line-height: 1.75; margin-bottom: 20px; }
    .onboarding-demo { margin-bottom: 20px; text-align: left; }

    /* Navigation */
    .onboarding-actions { margin-top: 4px; }
    .onboarding-nav { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .onboarding-finish-btns { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .onboarding-cta { width: 100%; padding: 13px; font-size: 13px; }
    .onboarding-back {
      background: none; border: 1px solid var(--border2); color: var(--muted2);
      font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 1px;
      text-transform: uppercase; cursor: pointer; padding: 8px 16px; transition: all 0.15s;
    }
    .onboarding-back:hover { color: var(--text); border-color: var(--border3); }
    .onboarding-skip {
      background: none; border: none; color: var(--muted3);
      font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 1px;
      text-transform: uppercase; cursor: pointer; transition: color 0.15s;
    }
    .onboarding-skip:hover { color: var(--muted); }

    /* THEME TOGGLE */
    .theme-toggle {
      background: none; border: 1px solid var(--border2);
      color: var(--muted2); padding: 5px 10px;
      font-size: 11px; cursor: pointer; transition: all 0.15s;
      display: flex; align-items: center; gap: 5px;
      font-family: 'Jost', sans-serif; letter-spacing: 0.5px;
    }
    .theme-toggle:hover { border-color: var(--border3); color: var(--text); }

    /* WELCOME SCREEN */
    .welcome-page {
      min-height: calc(100vh - 80px);
      display: flex; align-items: flex-start; justify-content: center;
      padding: 80px 32px 60px;
      position: relative; overflow: hidden;
      background: var(--bg);
    }
    .welcome-page::before {
      content: '';
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse at 50% 100%, rgba(80,40,0,0.18) 0%, transparent 60%),
        radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(60,30,0,0.12) 100%),
        radial-gradient(ellipse at 50% 0%, var(--gold-dim) 0%, transparent 55%);
      pointer-events: none; z-index: 0;
    }
    @media (prefers-color-scheme: light) {
      .welcome-page::before {
        background:
          radial-gradient(ellipse at 50% 100%, rgba(100,60,10,0.25) 0%, transparent 65%),
          radial-gradient(ellipse at 100% 50%, rgba(120,80,20,0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 0% 50%, rgba(120,80,20,0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 0%, rgba(180,130,40,0.3) 0%, transparent 60%);
      }
      .welcome-rays { opacity: 0.06; }
      .welcome-wordmark { text-shadow: 0 2px 20px rgba(120,80,10,0.15); }
      .welcome-features { background: rgba(255,240,200,0.4); border-color: var(--border2); }
      .welcome-features::before, .welcome-features::after { background: transparent; }
    }
    .theme-light .welcome-page::before {
      background:
        radial-gradient(ellipse at 50% 100%, rgba(100,60,10,0.25) 0%, transparent 65%),
        radial-gradient(ellipse at 100% 50%, rgba(120,80,20,0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 0% 50%, rgba(120,80,20,0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 0%, rgba(180,130,40,0.3) 0%, transparent 60%);
    }
    .theme-light .welcome-rays { opacity: 0.06; }
    .theme-light .welcome-wordmark { text-shadow: 0 2px 20px rgba(120,80,10,0.15); }
    .theme-light .welcome-features { background: rgba(255,240,200,0.4); border-color: var(--border2); }
    .theme-light .welcome-features::before, .theme-light .welcome-features::after { background: transparent; }
    /* Sunburst rays */
    .welcome-rays {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      pointer-events: none; z-index: 0; opacity: 0.03;
    }
    .welcome-ray {
      position: absolute;
      width: 2px; height: 120vh;
      background: linear-gradient(to bottom, transparent, var(--gold) 40%, transparent);
      transform-origin: center center;
    }
    .welcome-inner {
      max-width: 540px; width: 100%;
      display: flex; flex-direction: column;
      align-items: center; text-align: center;
      animation: welcomeIn 0.7s ease both;
      position: relative; z-index: 1;
    }
    @keyframes welcomeIn {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    /* Top/bottom ornaments */
    .welcome-ornament-top {
      display: flex; align-items: center; gap: 10px;
      width: 100%; margin-bottom: 20px;
    }
    .welcome-orn-line { flex: 1; height: 1px; background: var(--gold-dim); }
    .welcome-orn-diamond { font-size: 8px; color: var(--gold); flex-shrink: 0; }
    /* Badge */
    .welcome-badge {
      font-size: 9px; color: var(--gold); letter-spacing: 4px;
      text-transform: uppercase; margin-bottom: 20px;
      border-top: 1px solid var(--gold-dim);
      border-bottom: 1px solid var(--gold-dim);
      padding: 6px 20px;
    }
    /* Wordmark */
    .welcome-wordmark {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(72px, 14vw, 108px);
      font-weight: 400; line-height: 0.85;
      color: var(--text); margin-bottom: 24px;
      letter-spacing: 4px; text-transform: uppercase;
      text-shadow: 0 0 60px var(--gold-dim);
    }
    /* Deco divider */
    .welcome-deco-divider {
      display: flex; align-items: center; gap: 10px;
      width: 80%; margin: 0 auto 24px; 
    }
    .wdd-line { flex: 1; height: 1px; background: var(--gold-dim); }
    .wdd-center { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
    .wdd-dot { width: 3px; height: 3px; background: var(--gold-dim); border-radius: 50%; }
    .wdd-diamond { font-size: 8px; color: var(--gold); }
    /* Tagline */
    .welcome-tagline {
      font-family: 'Cormorant Garamond', serif;
      font-size: 20px; font-style: italic;
      color: var(--text2); margin-bottom: 16px; line-height: 1.4;
    }
    .welcome-desc {
      font-size: 13px; color: var(--muted); line-height: 1.85;
      margin-bottom: 28px; font-weight: 300; max-width: 420px;
    }
    /* Features */
    .welcome-features {
      display: flex; flex-direction: column; gap: 8px;
      margin-bottom: 32px; width: 100%;
      border: 1px solid var(--border); padding: 16px 20px;
      background: var(--bg2);
      position: relative;
    }
    .welcome-features::before, .welcome-features::after {
      content: '◆';
      position: absolute; font-size: 7px; color: var(--gold);
    }
    .welcome-features::before { top: -5px; left: 50%; transform: translateX(-50%); background: var(--bg2); padding: 0 4px; }
    .welcome-features::after  { bottom: -5px; left: 50%; transform: translateX(-50%); background: var(--bg2); padding: 0 4px; }
    .welcome-feature {
      display: flex; align-items: center; gap: 12px;
      font-size: 12px; color: var(--muted2); justify-content: center;
    }
    .welcome-feature-icon { color: var(--gold); font-size: 12px; flex-shrink: 0; }
    /* CTA */
    .welcome-cta {
      background: transparent; color: var(--gold);
      border: 1px solid var(--gold);
      padding: 14px 52px; font-family: 'Cormorant Garamond', serif;
      font-size: 16px; letter-spacing: 5px; text-transform: uppercase;
      cursor: pointer; transition: all 0.25s; margin-bottom: 0;
      position: relative;
    }
    .welcome-cta::before {
      content: '';
      position: absolute; inset: 3px;
      border: 1px solid var(--gold-dim);
      pointer-events: none; transition: all 0.25s;
    }
    .welcome-cta:hover {
      background: var(--gold); color: var(--bg);
      transform: translateY(-1px);
      box-shadow: 0 8px 32px var(--gold-dim);
    }
    .welcome-cta:hover::before { border-color: rgba(0,0,0,0.2); }
    .welcome-nav-links { display: flex; align-items: center; gap: 10px; }
    .welcome-nav-link {
      background: none; border: none; color: var(--muted3);
      font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 1.5px;
      text-transform: uppercase; cursor: pointer; transition: color 0.15s; padding: 0;
    }
    .welcome-nav-link:hover { color: var(--text); }
    .welcome-nav-sep { color: var(--border3); font-size: 14px; }
    .welcome-tour-btn {
      background: none; border: none; color: var(--muted3);
      font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 1px;
      text-transform: uppercase; cursor: pointer; transition: color 0.15s;
      padding: 0; margin-top: 20px; text-decoration: underline;
      text-underline-offset: 3px; text-decoration-color: var(--border3);
    }
    .welcome-tour-btn:hover { color: var(--muted); text-decoration-color: var(--muted3); }

    /* SHARE SHEET */
    .share-overlay {
      position: fixed; inset: 0; z-index: 60;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: flex-end; justify-content: center;
      animation: fadeIn 0.2s ease;
    }
    .share-sheet {
      background: var(--bg2); border-top: 1px solid var(--border2);
      width: 100%; max-width: 560px; padding: 28px 28px 36px;
      animation: slideUpBanner 0.25s ease;
    }
    .share-sheet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .share-sheet-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; }
    .share-sheet-close { background: none; border: none; color: var(--muted3); font-size: 14px; cursor: pointer; padding: 4px; transition: color 0.15s; }
    .share-sheet-close:hover { color: var(--text); }
    .share-bean-preview { margin-bottom: 20px; padding-bottom: 18px; border-bottom: 1px solid var(--border); }
    .share-bean-brand { font-size: 10px; color: var(--muted3); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
    .share-bean-name { font-family: 'Cormorant Garamond', serif; font-size: 24px; color: var(--text); }
    .share-options { display: flex; flex-direction: column; gap: 2px; margin-bottom: 16px; }
    .share-option {
      display: flex; align-items: center; gap: 16px;
      background: var(--bg3); border: 1px solid var(--border);
      padding: 18px 20px; cursor: pointer; transition: border-color 0.15s;
    }
    .share-option:hover { border-color: var(--border3); }
    .share-option-icon { font-size: 20px; color: var(--gold); flex-shrink: 0; }
    .share-option-text { flex: 1; }
    .share-option-label { font-size: 14px; color: var(--text2); margin-bottom: 4px; font-family: 'Cormorant Garamond', serif; }
    .share-option-desc { font-size: 11px; color: var(--muted2); line-height: 1.5; }
    .share-code-preview { font-size: 10px; color: var(--muted3); font-family: monospace; margin-top: 6px; letter-spacing: 0.5px; }
    .share-option-arrow { font-size: 16px; color: var(--gold); flex-shrink: 0; }
    .share-import-toggle {
      background: none; border: none; color: var(--muted3);
      font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 1px;
      text-transform: uppercase; cursor: pointer; transition: color 0.15s;
      padding: 0; text-decoration: underline; text-underline-offset: 3px;
    }
    .share-import-toggle:hover { color: var(--muted); }
    .share-import { display: flex; flex-direction: column; gap: 12px; }
    .share-import-label { font-size: 13px; color: var(--muted2); }
    .share-import-input {
      width: 100%; background: var(--bg3); border: 1px solid var(--border2);
      color: var(--text); padding: 12px; font-family: monospace; font-size: 12px;
      outline: none; resize: none; transition: border 0.15s;
    }
    .share-import-input:focus { border-color: var(--gold-dim); }
    .share-import-error { font-size: 12px; color: var(--red); }
    .share-import-actions { display: flex; gap: 10px; }
    .tour-banner {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
      background: var(--bg2); border-top: 1px solid var(--border2);
      animation: slideUpBanner 0.25s ease;
    }
    @keyframes slideUpBanner {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    .tour-progress-bar { height: 2px; background: var(--border); }
    .tour-progress-fill { height: 100%; background: var(--gold); transition: width 0.35s ease; }
    .tour-content {
      display: flex; align-items: center; justify-content: space-between;
      gap: 24px; padding: 18px 28px; max-width: 1080px; margin: 0 auto;
    }
    .tour-text { flex: 1; }
    .tour-step-label { font-size: 10px; color: var(--gold); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
    .tour-title { font-family: 'Cormorant Garamond', serif; font-size: 18px; color: var(--text); margin-bottom: 4px; }
    .tour-desc { font-size: 12px; color: var(--muted); line-height: 1.6; max-width: 600px; }
    .tour-controls { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .tour-btn-next {
      background: var(--gold); color: var(--bg); border: none;
      padding: 10px 22px; font-family: 'Jost', sans-serif;
      font-size: 11px; font-weight: 500; letter-spacing: 1.5px;
      text-transform: uppercase; cursor: pointer; transition: background 0.18s;
      white-space: nowrap;
    }
    .tour-btn-next:hover { background: var(--gold-hi); }
    .tour-btn-end {
      background: var(--gold); color: var(--bg); border: none;
      padding: 10px 22px; font-family: 'Jost', sans-serif;
      font-size: 11px; font-weight: 500; letter-spacing: 1.5px;
      text-transform: uppercase; cursor: pointer; transition: background 0.18s;
      white-space: nowrap;
    }
    .tour-btn-end:hover { background: var(--gold-hi); }
    .tour-btn-skip {
      background: none; border: none; color: var(--muted3);
      font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 1px;
      text-transform: uppercase; cursor: pointer; transition: color 0.15s;
      white-space: nowrap;
    }
    .tour-btn-skip:hover { color: var(--muted); }

    /* BEAN CARD EXPORT */
    .export-overlay {
      position: fixed; inset: 0; z-index: 120;
      background: rgba(0,0,0,0.9);
      display: flex; align-items: center; justify-content: center;
      padding: 20px; overflow-y: auto;
    }
    .export-modal {
      background: var(--bg2); border: 1px solid var(--border2);
      width: 100%; max-width: 760px;
      animation: slideUp 0.25s ease;
    }
    .export-modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-bottom: 1px solid var(--border);
      gap: 12px;
    }
    .export-modal-title { font-size: 10px; color: var(--muted3); letter-spacing: 2px; text-transform: uppercase; }
    .export-modal-actions { display: flex; gap: 8px; align-items: center; }
    .export-hint {
      font-size: 12px; color: var(--muted2); padding: 10px 20px;
      border-bottom: 1px solid var(--border); line-height: 1.6;
    }
    .export-img-wrap { padding: 20px; background: #000; }
    .export-img { border: 1px solid #222; display: block; width: 100%; cursor: pointer; }
    .export-rendering {
      display: flex; align-items: center; justify-content: center;
      gap: 12px; padding: 48px; color: var(--muted3);
      font-size: 13px; letter-spacing: 1px;
    }

    /* The card */
    .bean-export-card {
      position: relative; overflow: hidden;
      background: #0a0a0a;
      color: #ede5d8;
      display: flex;
    }
    .bec-accent-bar { width: 3px; flex-shrink: 0; }
    .bec-bg-splashes { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .bec-splash { position: absolute; border-radius: 50%; filter: blur(60px); top: -40px; }
    .bec-content { flex: 1; padding: 36px 32px 28px; position: relative; z-index: 1; }

    /* Card header */
    .bec-header { margin-bottom: 28px; border-bottom: 1px solid #1e1e1e; padding-bottom: 24px; }
    .bec-brand { font-size: 10px; color: #666; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px; font-family: 'Jost', sans-serif; }
    .bec-name { font-family: 'Cormorant Garamond', serif; font-size: 48px; line-height: 1; color: #ede5d8; margin-bottom: 12px; font-weight: 600; }
    .bec-summary { font-family: 'Cormorant Garamond', serif; font-size: 15px; color: #888; font-style: italic; line-height: 1.6; }

    /* Card body */
    .bec-body { display: grid; grid-template-columns: 1fr 320px; gap: 32px; margin-bottom: 24px; }
    .bec-left { }
    .bec-right { display: flex; flex-direction: column; align-items: center; }
    .bec-section-label { font-size: 9px; color: #d4b05a; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; font-family: 'Jost', sans-serif; }

    /* Meta */
    .bec-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 2px; }
    .bec-meta-row { display: flex; align-items: baseline; gap: 8px; }
    .bec-meta-label { font-size: 9px; color: #555; letter-spacing: 2px; text-transform: uppercase; width: 46px; flex-shrink: 0; font-family: 'Jost', sans-serif; }
    .bec-meta-val { font-size: 13px; color: #c8bfaf; font-family: 'Jost', sans-serif; font-weight: 300; }

    /* Flavor chips */
    .bec-flavor-chips { display: flex; flex-wrap: wrap; gap: 5px; }
    .bec-fchip { font-size: 10px; padding: 2px 8px; border: 1px solid; font-family: 'Jost', sans-serif; letter-spacing: 0.3px; }

    /* Scores */
    .bec-overall { display: flex; align-items: baseline; gap: 3px; margin-bottom: 12px; }
    .bec-overall-num { font-family: 'Cormorant Garamond', serif; font-size: 36px; line-height: 1; }
    .bec-overall-denom { font-size: 11px; color: #555; font-family: 'Jost', sans-serif; }
    .bec-scores { display: flex; flex-direction: column; gap: 7px; }
    .bec-score-row { display: flex; align-items: center; gap: 8px; }
    .bec-score-label { font-size: 9px; color: #555; letter-spacing: 1px; text-transform: uppercase; width: 68px; flex-shrink: 0; font-family: 'Jost', sans-serif; }
    .bec-score-track { flex: 1; height: 2px; background: #1e1e1e; }
    .bec-score-fill { height: 100%; transition: width 0.4s; }
    .bec-score-val { font-family: 'Cormorant Garamond', serif; font-size: 14px; width: 18px; text-align: right; flex-shrink: 0; }

    /* Raw notes */
    .bec-raw-text { font-size: 12px; color: #666; line-height: 1.7; font-style: italic; }

    /* Wheel */
    .bec-wheel-wrap { width: 100%; display: flex; justify-content: center; }

    /* Footer */
    .bec-footer {
      display: flex; justify-content: space-between; align-items: center;
      border-top: 1px solid #1e1e1e; padding-top: 16px;
    }
    .bec-footer-brand { font-family: 'Cormorant Garamond', serif; font-size: 13px; color: #d4b05a; letter-spacing: 2px; }
    .bec-footer-date { font-size: 10px; color: #444; letter-spacing: 1px; font-family: 'Jost', sans-serif; }

    /* COMPARE */
    .compare-banner {
      display: flex; align-items: center; justify-content: space-between;
      background: var(--gold-dim); border: 1px solid var(--gold);
      padding: 12px 18px; margin-bottom: 16px; gap: 12px;
    }
    .compare-banner-text { font-size: 13px; color: var(--text); display: flex; align-items: center; gap: 8px; }
    .compare-banner-icon { font-size: 16px; color: var(--gold); }
    .compare-banner-cancel { background: none; border: 1px solid var(--border3); color: var(--muted2); padding: 6px 12px; font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; }
    .compare-banner-cancel:hover { color: var(--text); }
    .compare-card-hint { font-size: 10px; color: var(--gold); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
    .compare-card-hint.self { color: var(--muted3); }
    .bean-card.compare-self { border-color: var(--gold); opacity: 0.6; }
    .cmp-header { margin-bottom: 32px; }
    .cmp-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; margin-bottom: 4px; }
    .cmp-subtitle { font-size: 13px; color: var(--muted2); font-style: italic; }
    .cmp-layout { display: grid; grid-template-columns: 1fr 40px 1fr; gap: 0; align-items: start; }
    .cmp-col { padding: 0 24px 0 0; }
    .cmp-col:last-child { padding: 0 0 0 24px; }
    .cmp-col-accent { height: 2px; width: 100%; margin-bottom: 16px; }
    .cmp-brand { font-size: 10px; color: var(--muted2); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
    .cmp-name { font-family: 'Cormorant Garamond', serif; font-size: 26px; line-height: 1.1; margin-bottom: 12px; }
    .cmp-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 14px; }
    .cmp-tag { font-size: 10px; color: var(--muted2); border: 1px solid var(--border2); padding: 2px 8px; }
    .cmp-overall { font-family: 'Cormorant Garamond', serif; font-size: 42px; line-height: 1; margin-bottom: 16px; }
    .cmp-overall-denom { font-size: 16px; color: var(--muted3); }
    .cmp-wheel-wrap { margin-bottom: 16px; display: flex; justify-content: center; }
    .cmp-summary { font-size: 12px; color: var(--muted); font-style: italic; line-height: 1.7; margin-bottom: 18px; }
    .cmp-scores { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .cmp-score-row { display: flex; align-items: center; gap: 8px; }
    .cmp-score-label { font-size: 10px; color: var(--muted3); letter-spacing: 1px; text-transform: uppercase; width: 72px; flex-shrink: 0; }
    .cmp-score-bar-track { flex: 1; height: 2px; background: var(--border2); }
    .cmp-score-bar-fill { height: 100%; transition: width 0.4s; }
    .cmp-score-val { font-family: 'Cormorant Garamond', serif; font-size: 16px; width: 20px; text-align: right; flex-shrink: 0; }
    .cmp-section-label { font-size: 10px; color: var(--gold); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
    .cmp-flavor-section { margin-bottom: 16px; }
    .cmp-flavor-chips { display: flex; flex-wrap: wrap; gap: 5px; }
    .cmp-fchip { font-size: 11px; padding: 3px 8px; border: 1px solid; }
    .cmp-notes-section { margin-bottom: 16px; }
    .cmp-notes { font-size: 12px; color: var(--muted); line-height: 1.7; font-style: italic; }
    .cmp-divider { display: flex; flex-direction: column; align-items: center; padding-top: 48px; }
    .cmp-vs { font-family: 'Cormorant Garamond', serif; font-size: 18px; color: var(--muted4); font-style: italic; }

    @media (min-width: 721px) {
      .app { zoom: 1.35; }
    }
    @media (max-width: 720px) {
      .cmp-layout { grid-template-columns: 1fr; }
      .cmp-divider { flex-direction: row; padding: 16px 0; justify-content: center; }
      .cmp-col, .cmp-col:last-child { padding: 0; }
      .cmp-col:last-child { border-top: 1px solid var(--border); padding-top: 24px; }
      .tour-content { flex-direction: column; align-items: flex-start; gap: 14px; padding: 16px; }
      .tour-controls { width: 100%; }
      .tour-btn-next, .tour-btn-end { flex: 1; text-align: center; }
      .detail-layout { grid-template-columns: 1fr; gap: 24px; }
      .wheel-col { order: -1; position: static; overflow: visible; }
      .page { overflow-x: hidden; }
      .detail-left { order: 1; }
      .calc-body { grid-template-columns: 1fr; }
      .form-grid { grid-template-columns: 1fr; }
      .page, .calc-wrap { padding: 20px 16px; }
      .nav { position: fixed; top: 0; left: 0; right: 0; padding: 12px 16px 0; }
      .app { padding-top: 120px; }
      .nav-add-bean-wrap { margin: 0 -16px; }
      .welcome-page { padding: 32px 24px; align-items: flex-start; padding-top: 48px; }
      .welcome-wordmark { font-size: 64px; }
    }
  `;

  return (
    <ThemeContext.Provider value={theme}>
    <div className={`app ${theme !== "system" ? `theme-${theme}` : ""}`}>
      <style>{css}</style>
      {showOnboarding && <Onboarding onComplete={completeOnboarding} onGoGuide={completeOnboardingToGuide} />}
      <nav className="nav">
        <div className="nav-top">
          <div className="nav-brand" onClick={() => setTab("home")}>Craft & Cup</div>
          <div className="nav-right">
            <button className="theme-toggle" onClick={toggleTheme} title={`Theme: ${themeLabel}`}>
              {themeIcon} {themeLabel}
            </button>
          </div>
        </div>
        <div className="nav-tabs-wrap">
          <div className="nav-tabs">
            <button className={`nav-tab ${tab === "home" ? "active" : ""}`} onClick={() => setTab("home")}>Home</button>
            <button className={`nav-tab ${tab === "calc" ? "active" : ""}`} onClick={() => setTab("calc")}>Brew Calc</button>
            <button className={`nav-tab ${tab === "journal" ? "active" : ""}`} onClick={() => setTab("journal")}>Journal</button>
            <button className={`nav-tab ${tab === "recipes" ? "active" : ""}`} onClick={() => setTab("recipes")}>Recipes</button>
            <button className={`nav-tab ${tab === "guide" ? "active" : ""}`} onClick={() => setTab("guide")}>Guide</button>
            <button className={`nav-tab ${tab === "faq" ? "active" : ""}`} onClick={() => setTab("faq")}>FAQ</button>
          </div>
          {tab === "journal" && (
            <button className="nav-add-bean" onClick={handleAddBean}>+ Log Bean</button>
          )}
        </div>
      </nav>
      {tab === "home"    && <HomePage onNavigate={handleNavigate} onTakeTour={startTour} onReplayTutorial={replayTutorial} />}
      {tab === "journal"  && <BeanJournal onBrewCalc={handleBrewCalc} onBeansChange={setBeans} addTrigger={journalTrigger} showToast={showToast} />}
      {tab === "recipes"  && <RecipesPage showToast={showToast} />}
      {tab === "calc"     && <BrewCalculator initialMethod={calcMethod} />}
      {tab === "guide"   && <GuidePage />}
      {tab === "faq"     && <FAQPage />}
      {tourStep !== null && (
        <TourBanner
          step={tourStep}
          total={TOUR_STEPS.length}
          title={TOUR_STEPS[tourStep].title}
          desc={TOUR_STEPS[tourStep].desc}
          onNext={nextTourStep}
          onEnd={endTour}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
    </ThemeContext.Provider>
  );
}
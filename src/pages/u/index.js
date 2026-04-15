import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { supabase } from "../../lib/supabase";

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
- Go as deep as the notes support - if someone says "white peach" use all 4 levels, if they just say "fruity" use 1 level
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
      {/* Method selector - wrapping on desktop, scrollable on mobile */}
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
// --- Brew Page (Recommender + Calculator) ------------------------------------
const BREW_TASTE_OPTIONS = [
  { key: "first", label: "First time brewing this" },
  { key: "perfect", label: "It's great" },
  { key: "bitter", label: "Too bitter" },
  { key: "sour", label: "Too sour / acidic" },
  { key: "weak", label: "Too weak" },
  { key: "strong", label: "Too strong" },
];

const BREW_TASTE_TIPS = {
  "Pour Over / V60": { first: "Start with 20g coffee to 300ml water at 93°C. Bloom for 40 seconds then pour in slow spirals.", perfect: "You've nailed it - save this as a recipe so you can repeat it.", bitter: "Grind coarser or reduce brew time. Make sure you're not pouring too slowly.", sour: "Grind finer or pour slightly slower to increase contact time.", weak: "Use more coffee or reduce the ratio - try 1:15 instead of 1:16.", strong: "Add more water or reduce your dose slightly." },
  Chemex: { first: "Start with 42g coffee to 630ml water at 94°C. The thick filter needs a coarser grind than V60.", perfect: "Locked in - save it as a recipe.", bitter: "Grind coarser. The Chemex filter is thick so it's easy to over-extract.", sour: "Grind finer or let it drawdown a little longer.", weak: "Increase your dose or tighten the ratio to 1:14.", strong: "Back off the dose or open the ratio to 1:16." },
  Espresso: { first: "Start with 18g in, 36g out in 25-30 seconds. Adjust grind until you hit that window.", perfect: "Dialled in - log it as a recipe.", bitter: "Grind coarser to speed up the shot. Target 25-30 seconds.", sour: "Grind finer to slow the shot down. Under 25 seconds usually means under-extraction.", weak: "Check your dose and tamping pressure. A loose puck causes channelling.", strong: "Increase your yield - pull to 40g out instead of 36g." },
  "Cold Brew": { first: "Use 100g coffee to 500ml cold water. Steep 16-18 hours in the fridge. Strain and dilute 1:1 to serve.", perfect: "Save the ratio as a recipe for next time.", bitter: "Steep for less time or grind coarser.", sour: "Steep for longer - cold brew rarely tastes sour unless the beans are stale.", weak: "Tighten the ratio to 1:4 for a stronger concentrate.", strong: "Dilute more when serving or open the ratio to 1:6." },
  "French Press": { first: "30g coffee to 450ml water at 94°C. Steep 4 minutes then plunge slowly.", perfect: "Classic - save it.", bitter: "Grind coarser or reduce steep time. Plunging too hard also adds bitterness.", sour: "Steep a little longer or grind slightly finer.", weak: "More coffee - try 1:14. French Press rewards a stronger ratio.", strong: "Less coffee or pour out immediately after plunging to stop extraction." },
  AeroPress: { first: "17g coffee to 200ml water at 85°C. Steep 90 seconds and press slowly.", perfect: "AeroPress gold - save it.", bitter: "Lower the water temperature or reduce steep time. AeroPress is forgiving at cooler temps.", sour: "Steep slightly longer or grind a touch finer.", weak: "More coffee or less water. AeroPress shines as a concentrate.", strong: "Dilute with hot water after pressing." },
  "Moka Pot": { first: "Fill the basket level (don't tamp), use pre-boiled water, and brew on medium-low heat.", perfect: "Moka perfection - save it.", bitter: "Lower the heat or grind slightly coarser. Remove from heat the moment it starts gurgling.", sour: "Grind slightly finer or use hotter water in the bottom chamber.", weak: "Make sure the basket is full and level. Don't tamp but don't leave gaps.", strong: "Dilute with a splash of hot water - this is how Italians drink it." },
  "Drip Machine": { first: "60g coffee to 1L water. Medium grind. Keep your machine clean for the best results.", perfect: "Sorted - save it.", bitter: "Grind coarser or use slightly less coffee.", sour: "Grind finer or check your machine is reaching the right temperature.", weak: "More coffee. Most people under-dose drip machines significantly.", strong: "Reduce the dose or increase the water amount." },
};

const NEWCOMER_RECS = {
  "Bright and fruity": {
    quick: { method: "AeroPress", why: "Fast, forgiving, and produces a surprisingly vibrant cup. Great entry point for tasting what specialty coffee can do.", equipment: "AeroPress (~$35), a burr grinder, and a kettle." },
    time:  { method: "Pour Over / V60", why: "The best way to experience everything bright, fruity beans have to offer. Clean, clear, and expressive.", equipment: "A V60 dripper (~$15), paper filters, a burr grinder, and a kettle." },
  },
  "Smooth and chocolatey": {
    quick: { method: "French Press", why: "Hands-off and forgiving. The full-immersion brew brings out rich, chocolatey notes with minimal technique.", equipment: "A French Press (~$25) and coarsely ground coffee." },
    time:  { method: "French Press", why: "Full-bodied, rich, and perfect for smooth chocolatey beans. Set a timer and let it do its thing.", equipment: "A French Press (~$25), a burr grinder, and a kettle." },
  },
  "Strong and bold": {
    quick: { method: "Moka Pot", why: "Produces a strong, intense coffee similar to espresso without the expensive machine. Stovetop and simple.", equipment: "A Moka Pot (~$30) and finely ground coffee." },
    time:  { method: "Espresso", why: "The most intense and complex cup you can make. Takes practice to dial in but incredibly rewarding.", equipment: "An espresso machine (prices vary widely) and a burr grinder." },
  },
  "Something cold": {
    quick: { method: "Cold Brew", why: "Just coffee and cold water - no heat, no timing, no technique. Steep overnight and it's ready in the morning.", equipment: "A large jar or French Press and coarsely ground coffee." },
    time:  { method: "Cold Brew", why: "Smooth, naturally sweet, and keeps in the fridge for up to two weeks. The easiest brew method there is.", equipment: "A large jar or cold brew maker and coarsely ground coffee." },
  },
};

function BrewPage({ initialMethod }) {
  const getDefaultPersona = () => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(PERSONA_KEY);
    return stored === "enthusiast" ? "enthusiast" : stored === "beginner" || stored === "intermediate" ? "newcomer" : null;
  };

  const [persona, setPersona] = useState(() => getDefaultPersona());
  const [newcomerFlavor, setNewcomerFlavor] = useState(null);
  const [newcomerTime, setNewcomerTime] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedTaste, setSelectedTaste] = useState(null);
  const [showCalc, setShowCalc] = useState(false);

  const methods = Object.keys(BREW_CONFIGS);
  const newcomerRec = newcomerFlavor && newcomerTime ? NEWCOMER_RECS[newcomerFlavor]?.[newcomerTime] : null;
  const finalMethod = selectedMethod || newcomerRec?.method || initialMethod || "Pour Over / V60";
  const tip = selectedMethod && selectedTaste ? BREW_TASTE_TIPS[selectedMethod]?.[selectedTaste] : null;

  const reset = () => {
    setPersona(getDefaultPersona());
    setNewcomerFlavor(null);
    setNewcomerTime(null);
    setSelectedMethod(null);
    setSelectedTaste(null);
    setShowCalc(false);
  };

  const OptionBtn = ({ onClick, children, fullWidth }) => (
    <button onClick={onClick} style={{ padding: "13px 18px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--muted2)", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: 13, textAlign: "left", transition: "all 0.15s", width: fullWidth ? "100%" : "auto", display: "block" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--muted2)"; }}>
      {children}
    </button>
  );

  const SpecsGrid = ({ method }) => {
    const cfg = BREW_CONFIGS[method];
    const specs = [
      { label: "Grind", value: cfg.grindSize },
      { label: "Ratio", value: `1:${cfg.defaultRatio}` },
      cfg.tempC ? { label: "Temp", value: `${cfg.tempC}°C` } : null,
      cfg.bloomTime ? { label: "Bloom", value: cfg.bloomTime } : null,
      cfg.brewTime ? { label: "Brew Time", value: cfg.brewTime } : null,
      cfg.steepHours ? { label: "Steep", value: `${cfg.steepHours}h` } : null,
    ].filter(Boolean);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {specs.map(({ label, value }) => (
          <div key={label} style={{ background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px 14px" }}>
            <div style={{ fontSize: 9, color: "var(--muted3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 18, color: "var(--text)", fontFamily: "'Cormorant Garamond',serif" }}>{value}</div>
          </div>
        ))}
      </div>
    );
  };

  const StepHeader = ({ label }) => (
    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontSize: 10, color: "var(--gold)", letterSpacing: 2, textTransform: "uppercase" }}>{label}</div>
      {persona && <button onClick={reset} style={{ background: "none", border: "none", color: "var(--muted3)", fontSize: 10, cursor: "pointer", fontFamily: "'Jost',sans-serif", letterSpacing: 1, textTransform: "uppercase", padding: 0 }}>Start over</button>}
    </div>
  );

  return (
    <div className="page">
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "var(--text)", marginBottom: 4 }}>Brew</div>
          <div style={{ fontSize: 12, color: "var(--muted3)" }}>Dial in your cup - whether you're just starting out or fine-tuning your technique.</div>
        </div>

        <div style={{ border: "1px solid var(--border)", marginBottom: 24 }}>

          {/* Step 0 - Persona */}
          {!persona && (<>
            <StepHeader label="Where are you at?" />
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              <OptionBtn onClick={() => setPersona("newcomer")} fullWidth>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>I'm new to this</div>
                <div style={{ fontSize: 11, color: "var(--muted3)" }}>Help me figure out what to make and how</div>
              </OptionBtn>
              <OptionBtn onClick={() => setPersona("enthusiast")} fullWidth>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>I know my setup</div>
                <div style={{ fontSize: 11, color: "var(--muted3)" }}>Show me specs and help me troubleshoot</div>
              </OptionBtn>
            </div>
          </>)}

          {/* Newcomer - flavor */}
          {persona === "newcomer" && !newcomerFlavor && (<>
            <StepHeader label="What do you want in the cup?" />
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.keys(NEWCOMER_RECS).map(flavor => (
                <OptionBtn key={flavor} onClick={() => setNewcomerFlavor(flavor)} fullWidth>{flavor}</OptionBtn>
              ))}
            </div>
          </>)}

          {/* Newcomer - time */}
          {persona === "newcomer" && newcomerFlavor && !newcomerTime && (<>
            <StepHeader label="How much time do you have?" />
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              <OptionBtn onClick={() => setNewcomerTime("quick")} fullWidth>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>Quick - under 5 minutes</div>
                <div style={{ fontSize: 11, color: "var(--muted3)" }}>I just want a good cup with minimal fuss</div>
              </OptionBtn>
              <OptionBtn onClick={() => setNewcomerTime("time")} fullWidth>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>I've got time</div>
                <div style={{ fontSize: 11, color: "var(--muted3)" }}>I want to learn and get the most out of my beans</div>
              </OptionBtn>
            </div>
          </>)}

          {/* Newcomer - result */}
          {persona === "newcomer" && newcomerRec && (<>
            <StepHeader label={`Try ${newcomerRec.method}`} />
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 13, color: "var(--muted2)", lineHeight: 1.7, marginBottom: 16 }}>{newcomerRec.why}</div>
              <div style={{ background: "var(--gold-dim)", border: "1px solid var(--gold)", padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "var(--gold)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>What you'll need</div>
                <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{newcomerRec.equipment}</div>
              </div>
              <SpecsGrid method={newcomerRec.method} />
              <div style={{ fontSize: 12, color: "var(--muted3)", lineHeight: 1.6, marginBottom: 16, fontStyle: "italic" }}>{BREW_CONFIGS[newcomerRec.method].grindDesc}</div>
              <button onClick={() => setShowCalc(true)} className="btn-primary" style={{ fontSize: 11 }}>Open Calculator →</button>
            </div>
          </>)}

          {/* Enthusiast - method */}
          {persona === "enthusiast" && !selectedMethod && (<>
            <StepHeader label="What are you brewing with?" />
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {methods.map(m => <OptionBtn key={m} onClick={() => setSelectedMethod(m)}>{BREW_CONFIGS[m].icon} {m}</OptionBtn>)}
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <button onClick={() => setShowCalc(true)} style={{ background: "none", border: "none", color: "var(--muted3)", fontSize: 11, cursor: "pointer", fontFamily: "'Jost',sans-serif", letterSpacing: 1, textTransform: "uppercase", padding: 0 }}>Skip - just show the calculator</button>
              </div>
            </div>
          </>)}

          {/* Enthusiast - taste */}
          {persona === "enthusiast" && selectedMethod && !selectedTaste && (<>
            <StepHeader label="How's it tasting?" />
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {BREW_TASTE_OPTIONS.map(o => <OptionBtn key={o.key} onClick={() => setSelectedTaste(o.key)} fullWidth>{o.label}</OptionBtn>)}
            </div>
          </>)}

          {/* Enthusiast - result */}
          {persona === "enthusiast" && selectedMethod && selectedTaste && (<>
            <StepHeader label={selectedMethod} />
            <div style={{ padding: "16px 20px" }}>
              <SpecsGrid method={selectedMethod} />
              {tip && (
                <div style={{ background: "var(--gold-dim)", border: "1px solid var(--gold)", padding: "12px 16px", marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: "var(--gold)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Tip</div>
                  <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{tip}</div>
                </div>
              )}
              <div style={{ fontSize: 12, color: "var(--muted3)", lineHeight: 1.6, marginBottom: 16, fontStyle: "italic" }}>{BREW_CONFIGS[selectedMethod].grindDesc}</div>
              <button onClick={() => setShowCalc(true)} className="btn-primary" style={{ fontSize: 11 }}>Open Calculator →</button>
            </div>
          </>)}

        </div>

        {showCalc && <BrewCalculator initialMethod={finalMethod} />}
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
  visibility: "private",
  image_url: null,
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
  flavorText: "Opens with an intensely bright wild blackberry note - jammy but with that raw bramble edge you get from a really fresh natural process. Underneath that there's a distinct blood orange citrus that's almost like biting into the pith, not just the juice. As it cools a white peach emerges, really delicate and floral. The aroma is all white jasmine and dried rose, almost perfume-like. Mid-palate there's a brown sugar sweetness that reminds me of demerara more than anything refined. The finish is long with a dark bittersweet chocolate note - like a 70% cacao bar - and just a whisper of pipe tobacco earthiness that grounds the whole thing. Really remarkable complexity.",
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

// --- Card Export Shared Utilities -------------------------------------------
async function loadCardFonts() {
  try {
    const fonts = [
      new FontFace("Cormorant Garamond", "url(https://fonts.gstatic.com/s/cormorantgaramond/v21/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2)", { weight: "300" }),
      new FontFace("Jost", "url(https://fonts.gstatic.com/s/jost/v18/92zPtBhPNqw79Ij1E865zBUv7myjJQVGPokMmuQ.woff2)", { weight: "300" }),
    ];
    await Promise.all(fonts.map(f => f.load().then(lf => document.fonts.add(lf)).catch(() => {})));
    await document.fonts.ready;
  } catch(e) {}
}

function drawCardCanvas(ctx, W, H, theme, accent, drawContent) {
  const dark = theme === "dark";
  const bg = dark ? "#0a0a0a" : "#f5ead0";
  const fg = dark ? "#ede5d8" : "#1a1208";
  const muted = dark ? "#888" : "#7a6a50";
  const faint = dark ? "#1e1e1e" : "#d8c8a8";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Double border art deco
  ctx.strokeStyle = accent + "55"; ctx.lineWidth = 1;
  ctx.strokeRect(12, 12, W - 24, H - 24);
  ctx.strokeStyle = accent + "22"; ctx.lineWidth = 0.5;
  ctx.strokeRect(17, 17, W - 34, H - 34);

  // Left accent bar
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, accent); grad.addColorStop(1, accent + "44");
  ctx.fillStyle = grad; ctx.fillRect(12, 12, 3, H - 24);

  // Corner ornaments
  const orn = (x, y, sx, sy) => {
    ctx.strokeStyle = accent + "88"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x, y + sy * 20); ctx.lineTo(x, y); ctx.lineTo(x + sx * 20, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + sx * 9, y); ctx.lineTo(x + sx * 9, y + sy * 9); ctx.lineTo(x, y + sy * 9); ctx.stroke();
  };
  orn(22, 22, 1, 1); orn(W-22, 22, -1, 1); orn(22, H-22, 1, -1); orn(W-22, H-22, -1, -1);

  // Radial glow
  const splash = ctx.createRadialGradient(W*0.78, H*0.28, 0, W*0.78, H*0.28, 260);
  splash.addColorStop(0, accent + (dark ? "0e" : "18")); splash.addColorStop(1, "transparent");
  ctx.fillStyle = splash; ctx.fillRect(0, 0, W, H);

  drawContent(ctx, W, H, { bg, fg, muted, faint, accent, dark });
}

function drawFlavorWheel(ctx, cx, cy, mappings, accent, dark) {
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

function ExportModal({ title, rendering, imgSrc, onDownload, onClose, theme, setTheme, children }) {
  return (
    <div className="export-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="export-modal">
        <div className="export-modal-header">
          <span className="export-modal-title">{title}</span>
          <div className="export-modal-actions">
            {!rendering && (
              <button className="btn-primary" style={{ padding: "8px 16px", fontSize: 12 }} onClick={onDownload}>
                ↓ Download PNG
              </button>
            )}
            <button className="btn-ghost" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0 10px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1.5, textTransform: "uppercase" }}>Card theme</span>
          <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
            {["dark", "light"].map(t => (
              <button key={t} onClick={() => setTheme(t)} style={{
                padding: "4px 14px", fontSize: 10, letterSpacing: 1, textTransform: "uppercase",
                fontFamily: "'Jost',sans-serif", cursor: "pointer", border: "1px solid", transition: "all 0.15s",
                background: theme === t ? "var(--gold)" : "none",
                borderColor: theme === t ? "var(--gold)" : "var(--border2)",
                color: theme === t ? "var(--bg)" : "var(--muted3)"
              }}>{t}</button>
            ))}
          </div>
          <span style={{ fontSize: 10, color: "var(--muted3)", marginLeft: "auto" }}>Long press image to save on iPhone</span>
        </div>
        {children}
        <div className="export-img-wrap">
          {rendering ? (
            <div className="export-rendering"><div className="spin" /><span>Rendering card...</span></div>
          ) : (
            <img src={imgSrc} alt="Export card" className="export-img" style={{ width: "100%", display: "block", userSelect: "none" }} />
          )}
        </div>
      </div>
    </div>
  );
}

function RecipeCardExport({ recipe, onClose }) {
  const canvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [rendering, setRendering] = useState(true);
  const [theme, setTheme] = useState("dark");

  const tempColors = { Hot: "#d4b05a", Iced: "#6ab0d4", Blended: "#8aaa6a" };
  const accent = tempColors[recipe.temp] || "#d4b05a";

  useEffect(() => {
    setRendering(true); setImgSrc(null);
    const W = 900, H = 600;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W * 2; canvas.height = H * 2;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);

    loadCardFonts().then(() => {
      drawCardCanvas(ctx, W, H, theme, accent, (ctx, W, H, { fg, muted, accent, dark }) => {
        const CG = "Cormorant Garamond, Georgia";
        const JT = "Jost, Arial";
        const COL_MAX = 430; // left column boundary - wheel starts at 473
        const BOTTOM = H - 30;

        // Type label
        let y = 50;
        ctx.font = `300 15px ${JT}`; ctx.fillStyle = muted;
        ctx.fillText(`${(recipe.drinkType || "Recipe").toUpperCase()}  ·  ${(recipe.temp || "").toUpperCase()}`, 32, y);

        // Name - large, auto-sizing
        y += 42;
        const name = recipe.name || "Unnamed Recipe";
        let fs = 58; ctx.font = `300 ${fs}px ${CG}`;
        while (ctx.measureText(name).width > COL_MAX - 32 && fs > 24) { fs -= 2; ctx.font = `300 ${fs}px ${CG}`; }
        ctx.fillStyle = fg; ctx.fillText(name, 32, y);

        // Art deco divider
        y += 16;
        ctx.strokeStyle = accent + "66"; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(32, y); ctx.lineTo(COL_MAX, y); ctx.stroke();
        ctx.fillStyle = accent; ctx.font = `10px ${JT}`; ctx.textAlign = "center";
        ctx.fillText("◆", (32 + COL_MAX) / 2, y + 5); ctx.textAlign = "left"; y += 22;

        // --- Calculate content budget ---
        const stepLines = recipe.steps ? recipe.steps.split("\n").filter(Boolean) : [];
        const ings = [];
        if (recipe.espressoShots > 0) ings.push(`${recipe.espressoShots} shot${recipe.espressoShots > 1 ? "s" : ""} espresso`);
        if (recipe.milkType && recipe.milkType !== "None") ings.push(`${recipe.milkAmount ? recipe.milkAmount + "oz " : ""}${recipe.milkType}`);
        if (recipe.syrup) ings.push(`${recipe.syrupAmount ? recipe.syrupAmount + " " : ""}${recipe.syrup} syrup`);
        if (recipe.extras) ings.push(recipe.extras);

        // How much vertical space do we have?
        const availH = BOTTOM - y - 10;
        const hasRating = recipe.rating > 0;
        const hasChips = recipe.flavorData?.mappings?.length > 0;

        // Estimate sections: ingredients header + items + steps header + steps + rating + chips
        const ingCount = ings.length;
        const stepCount = stepLines.length;
        const totalChars = stepLines.reduce((s, l) => s + l.replace(/^\d+\.\s*/, "").length, 0);

        // Target font sizes - bigger for less content
        const contentDensity = ingCount + stepCount + (hasRating ? 2 : 0) + (hasChips ? 2 : 0);
        let bodyFs = contentDensity <= 6 ? 19 : contentDensity <= 9 ? 16 : contentDensity <= 12 ? 14 : 13;
        let labelFs = bodyFs - 2;
        let lineH = bodyFs + 7;
        let sectionGap = contentDensity <= 8 ? 16 : 12;

        // INGREDIENTS
        ctx.font = `300 ${labelFs}px ${JT}`; ctx.fillStyle = accent;
        ctx.fillText("INGREDIENTS", 32, y); y += labelFs + 4;
        ctx.font = `300 ${bodyFs}px ${JT}`;
        for (const ing of ings) {
          if (y > BOTTOM) break;
          ctx.fillStyle = accent + "99"; ctx.fillText("◆", 32, y);
          ctx.fillStyle = dark ? "#d4c8b8" : "#3a2a10"; ctx.fillText(ing, 50, y); y += lineH;
        }
        y += sectionGap;

        // STEPS
        if (stepLines.length > 0 && y < BOTTOM) {
          // Dynamic step font: scale down if many steps
          let stepFs = bodyFs;
          const stepLineH = stepFs + 5;
          ctx.font = `300 ${labelFs}px ${JT}`; ctx.fillStyle = dark ? accent : '#5a3a10';
          ctx.fillText("METHOD", 32, y); y += labelFs + 4;
          ctx.font = `300 ${stepFs}px ${JT}`;
          for (let si = 0; si < stepLines.length; si++) {
            if (y > BOTTOM) break;
            const step = stepLines[si].replace(/^\d+\.\s*/, "");
            ctx.fillStyle = accent; ctx.fillText(`${si + 1}.`, 32, y);
            ctx.fillStyle = dark ? "#d4c8b8" : "#3a2a10";
            const words = step.split(" ");
            let line = "";
            for (const word of words) {
              const test = line + word + " ";
              if (ctx.measureText(test).width > COL_MAX - 52 && line) {
                if (y > BOTTOM) break;
                ctx.fillText(line, 52, y); line = word + " "; y += stepLineH;
              } else line = test;
            }
            if (line && y <= BOTTOM) { ctx.fillText(line, 52, y); y += stepLineH + 2; }
          }
          y += sectionGap;
        }

        // RATING
        if (hasRating && y < BOTTOM) {
          ctx.font = `300 ${labelFs}px ${JT}`; ctx.fillStyle = dark ? accent : '#5a3a10';
          ctx.fillText("RATING", 32, y); y += labelFs + 4;
          ctx.font = `300 ${Math.max(bodyFs + 10, 26)}px ${CG}`; ctx.fillStyle = accent;
          ctx.fillText(recipe.rating.toString(), 32, y + bodyFs + 4);
          ctx.font = `300 ${bodyFs}px ${JT}`; ctx.fillStyle = muted;
          ctx.fillText("/10", 32 + (recipe.rating >= 10 ? bodyFs * 2.2 : bodyFs * 1.5), y + bodyFs);
          y += bodyFs + 18 + sectionGap;
        }

        // FLAVOR CHIPS
        if (hasChips && y < BOTTOM) {
          ctx.font = `300 ${labelFs}px ${JT}`; ctx.fillStyle = dark ? accent : '#5a3a10';
          ctx.fillText("FLAVORS", 32, y); y += labelFs + 4;
          let chipX = 32; const chipFs = Math.max(bodyFs - 2, 11);
          ctx.font = `300 ${chipFs}px ${JT}`;
          for (const m of recipe.flavorData.mappings.slice(0, 8)) {
            const topKey = m.path ? m.path[0] : m.top;
            const color = FLAVOR_TAXONOMY[topKey]?.color || "#888";
            const label = m.path ? m.path[m.path.length - 1] : (m.specific || m.mid || m.top);
            const tw = ctx.measureText(label).width + 16;
            if (chipX + tw > COL_MAX) { chipX = 32; y += chipFs + 8; }
            ctx.strokeStyle = dark ? color + '88' : color + 'cc'; ctx.lineWidth = dark ? 0.8 : 1.2;
            ctx.strokeRect(chipX, y - chipFs + 2, tw, chipFs + 4);
            ctx.fillStyle = color; ctx.fillText(label, chipX + 8, y); chipX += tw + 6;
          }
        }

        // Wheel
        const mappings = recipe.flavorData?.mappings || [];
        if (mappings.length > 0) {
          ctx.font = `300 11px ${JT}`; ctx.fillStyle = accent;
          ctx.fillStyle = accent;
          drawFlavorWheel(ctx, 668, 308, mappings, accent, dark);
        }

        // Footer
        ctx.strokeStyle = accent + "44"; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(32, H - 28); ctx.lineTo(W - 32, H - 28); ctx.stroke();
        ctx.font = `300 13px ${CG}`; ctx.fillStyle = accent; ctx.fillText("Craft & Cup", 32, H - 14);
        ctx.font = `300 11px ${JT}`; ctx.fillStyle = muted;
        const dateStr = new Date(recipe.createdAt || Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        ctx.fillText(dateStr, W - 32 - ctx.measureText(dateStr).width, H - 14);
      });

      setImgSrc(canvas.toDataURL("image/png"));
      setRendering(false);
    });
  }, [recipe, theme]);

  return (
    <ExportModal title="Recipe Card" rendering={rendering} imgSrc={imgSrc}
      onDownload={() => { const a = document.createElement("a"); a.href = imgSrc; a.download = `${(recipe.name||"recipe").replace(/\s+/g,"-").toLowerCase()}-craft-and-cup.png`; a.click(); }}
      onClose={onClose} theme={theme} setTheme={setTheme}>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </ExportModal>
  );
}

function BeanCardExport({ bean, onClose }) {
  const canvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [rendering, setRendering] = useState(true);
  const [theme, setTheme] = useState("dark");

  const overall = bean.scores
    ? Math.round((Object.values(bean.scores).reduce((s, v) => s + v, 0) / SCORE_ATTRIBUTES.length) * 10) / 10 : null;
  const scoreColor = (v) => v >= 8 ? "#8aaa6a" : v >= 6 ? "#d4b05a" : v >= 4 ? "#a89880" : "#d06860";
  const accent = bean.flavorData?.mappings?.[0]
    ? FLAVOR_TAXONOMY[bean.flavorData.mappings[0].path?.[0] || bean.flavorData.mappings[0].top]?.color || "#d4b05a"
    : "#d4b05a";

  useEffect(() => {
    setRendering(true); setImgSrc(null);
    const W = 900, H = 600;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W * 2; canvas.height = H * 2;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);

    loadCardFonts().then(() => {
      drawCardCanvas(ctx, W, H, theme, accent, (ctx, W, H, { fg, muted, accent, dark }) => {
        const CG = "Cormorant Garamond, Georgia";
        const JT = "Jost, Arial";
        const COL_MAX = 430;
        const BOTTOM = H - 30;

        // Brand
        let y = 50;
        ctx.font = `300 15px ${JT}`; ctx.fillStyle = muted;
        ctx.fillText((bean.brand || "Unknown Roaster").toUpperCase(), 32, y);

        // Name
        y += 42;
        const name = bean.name || bean.origin || "Unnamed Bean";
        let fs = 58; ctx.font = `300 ${fs}px ${CG}`;
        while (ctx.measureText(name).width > COL_MAX - 32 && fs > 24) { fs -= 2; ctx.font = `300 ${fs}px ${CG}`; }
        ctx.fillStyle = fg; ctx.fillText(name, 32, y);

        // Divider
        y += 16;
        ctx.strokeStyle = accent + "66"; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(32, y); ctx.lineTo(COL_MAX, y); ctx.stroke();
        ctx.fillStyle = accent; ctx.font = `10px ${JT}`; ctx.textAlign = "center";
        ctx.fillText("◆", (32 + COL_MAX) / 2, y + 5); ctx.textAlign = "left"; y += 22;

        // Estimate content density
        const hasSummary = !!bean.flavorData?.summary;
        const hasScores = !!(bean.scores && overall !== null);
        const hasChips = bean.flavorData?.mappings?.length > 0;
        const details = [bean.roast && ["ROAST", bean.roast], bean.origin && ["ORIGIN", bean.origin], bean.brewMethod && ["BREW METHOD", bean.brewMethod]].filter(Boolean);
        const contentDensity = (hasSummary ? 3 : 0) + details.length + (hasChips ? 3 : 0) + (hasScores ? 8 : 0);
        const bodyFs = contentDensity <= 8 ? 19 : contentDensity <= 12 ? 16 : contentDensity <= 16 ? 14 : 13;
        const labelFs = bodyFs - 2;
        const lineH = bodyFs + 6;
        const sectionGap = contentDensity <= 10 ? 16 : 12;

        // Summary
        if (hasSummary) {
          ctx.font = `italic ${bodyFs + 2}px ${CG}`; ctx.fillStyle = muted;
          const words = `"${bean.flavorData.summary}"`.split(" ");
          let line = "";
          for (const word of words) {
            if (y > BOTTOM) break;
            const test = line + word + " ";
            if (ctx.measureText(test).width > COL_MAX - 32 && line) {
              ctx.fillText(line, 32, y); line = word + " "; y += lineH;
            } else line = test;
          }
          if (line) { ctx.fillText(line, 32, y); y += lineH + sectionGap; }
        }

        // Details
        if (details.length > 0) {
          ctx.font = `300 ${labelFs}px ${JT}`; ctx.fillStyle = accent;
          ctx.fillText("DETAILS", 32, y); y += labelFs + 5;
          for (const [label, val] of details) {
            if (y > BOTTOM) break;
            ctx.font = `300 ${labelFs}px ${JT}`; ctx.fillStyle = muted; ctx.fillText(label, 32, y);
            ctx.font = `300 ${bodyFs}px ${JT}`; ctx.fillStyle = dark ? "#d4c8b8" : "#3a2a10";
            ctx.fillText(val, 32 + 110, y); y += lineH;
          }
          y += sectionGap;
        }

        // Flavor chips
        if (hasChips && y < BOTTOM) {
          ctx.font = `300 ${labelFs}px ${JT}`; ctx.fillStyle = accent;
          ctx.fillText("DETECTED FLAVORS", 32, y); y += labelFs + 5;
          const chipFs = Math.max(bodyFs - 1, 11);
          ctx.font = `300 ${chipFs}px ${JT}`;
          let chipX = 32;
          for (const m of bean.flavorData.mappings.slice(0, 8)) {
            const topKey = m.path ? m.path[0] : m.top;
            const color = FLAVOR_TAXONOMY[topKey]?.color || "#888";
            const label = m.path ? m.path[m.path.length - 1] : (m.specific || m.mid || m.top);
            const tw = ctx.measureText(label).width + 16;
            if (chipX + tw > COL_MAX) { chipX = 32; y += chipFs + 8; }
            if (y > BOTTOM) break;
            ctx.strokeStyle = dark ? color + '88' : color + 'cc'; ctx.lineWidth = dark ? 0.8 : 1.2;
            ctx.strokeRect(chipX, y - chipFs + 2, tw, chipFs + 4);
            ctx.fillStyle = color; ctx.fillText(label, chipX + 8, y); chipX += tw + 6;
          }
          y += chipFs + sectionGap + 4;
        }

        // Scores
        if (hasScores && y < BOTTOM) {
          ctx.font = `300 ${labelFs}px ${JT}`; ctx.fillStyle = accent;
          ctx.fillText("TASTING SCORES", 32, y); y += labelFs + 5;
          ctx.font = `300 ${bodyFs + 14}px ${CG}`; ctx.fillStyle = scoreColor(overall);
          ctx.fillText(overall.toString(), 32, y + bodyFs + 8);
          ctx.font = `300 ${bodyFs}px ${JT}`; ctx.fillStyle = muted;
          ctx.fillText("/10 overall", 32 + (overall >= 10 ? bodyFs * 2.2 : bodyFs * 1.5), y + bodyFs + 4);
          y += bodyFs + 20;
          const barW = 180;
          for (const attr of SCORE_ATTRIBUTES) {
            if (y > BOTTOM) break;
            const val = bean.scores[attr.key] ?? 5;
            ctx.font = `300 ${labelFs}px ${JT}`; ctx.fillStyle = muted;
            ctx.fillText(attr.label.toUpperCase(), 32, y);
            ctx.fillStyle = dark ? "#1e1e1e" : "#d8c8a8"; ctx.fillRect(120, y - labelFs + 3, barW, 3);
            ctx.fillStyle = scoreColor(val); ctx.fillRect(120, y - labelFs + 3, (val / 10) * barW, 3);
            ctx.font = `300 ${labelFs}px ${JT}`; ctx.fillStyle = scoreColor(val);
            ctx.fillText(val.toString(), 120 + barW + 8, y); y += lineH - 2;
          }
        }

        // Wheel
        const mappings = bean.flavorData?.mappings || [];
        if (mappings.length > 0) {
          ctx.font = `300 11px ${JT}`; ctx.fillStyle = accent;
          ctx.fillStyle = accent;
          drawFlavorWheel(ctx, 668, 308, mappings, accent, dark);
        }

        // Footer
        ctx.strokeStyle = accent + "44"; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(32, H - 28); ctx.lineTo(W - 32, H - 28); ctx.stroke();
        ctx.font = `300 13px ${CG}`; ctx.fillStyle = accent; ctx.fillText("Craft & Cup", 32, H - 14);
        ctx.font = `300 11px ${JT}`; ctx.fillStyle = muted;
        const dateStr = new Date(bean.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        ctx.fillText(dateStr, W - 32 - ctx.measureText(dateStr).width, H - 14);
      });

      setImgSrc(canvas.toDataURL("image/png"));
      setRendering(false);
    });
  }, [bean, theme]);

  return (
    <ExportModal title="Bean Card" rendering={rendering} imgSrc={imgSrc}
      onDownload={() => { const a = document.createElement("a"); a.href = imgSrc; a.download = `${(bean.name||bean.brand||"bean").replace(/\s+/g,"-").toLowerCase()}-craft-and-cup.png`; a.click(); }}
      onClose={onClose} theme={theme} setTheme={setTheme}>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </ExportModal>
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
function BeanJournal({ onBrewCalc, onBeansChange, addTrigger, showToast, session, onViewChange, shareTrigger }) {
  const [beans, setBeans] = useState([]);
  const [view, setView] = useState("list");
  const [activeBean, setActiveBean] = useState(null);
  const changeView = (v, bean) => { setView(v); onViewChange?.(v, bean); };
  const [compareBean, setCompareBean] = useState(null);
  const [comparePick, setComparePick] = useState(false);
  const [showExportCard, setShowExportCard] = useState(false);
  const [showSendToFriend, setShowSendToFriend] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [form, setForm] = useState(emptyBean());
  const [analyzing, setAnalyzing] = useState(false);
  const [debounced, setDebounced] = useState(false);
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const analysisLog = useRef([]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }
    setUploadingImage(true);
    const ext = file.name.split(".").pop();
    const path = `${session.user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("bean-images").upload(path, file);
    if (uploadErr) { setError("Image upload failed - try again."); setUploadingImage(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("bean-images").getPublicUrl(path);
    setForm(prev => ({ ...prev, image_url: publicUrl }));
    setUploadingImage(false);
  };

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

  // --- Convert between local bean format and Supabase row format ---
  const beanToRow = (bean, userId) => ({
    user_id: userId,
    local_id: String(bean.id),
    brand: bean.brand || null,
    name: bean.name || null,
    origin: bean.origin || null,
    roast: bean.roast || null,
    brew_method: bean.brewMethod || null,
    notes: bean.notes || null,
    flavor_text: bean.flavorText || null,
    flavor_data: bean.flavorData || null,
    scores: bean.scores || null,
    is_example: bean.isExample || false,
    visibility: bean.visibility || "private",
    image_url: bean.image_url || null,
    created_at: bean.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const rowToBean = (row) => ({
    id: row.local_id || row.id,
    supabase_id: row.id,
    brand: row.brand || "",
    name: row.name || "",
    origin: row.origin || "",
    roast: row.roast || "Medium",
    brewMethod: row.brew_method || "Pour Over / V60",
    notes: row.notes || "",
    flavorText: row.flavor_text || "",
    flavorData: row.flavor_data || null,
    scores: row.scores || { ...DEFAULT_SCORES },
    isExample: row.is_example || false,
    visibility: row.visibility || "private",
    image_url: row.image_url || null,
    createdAt: row.created_at,
  });

  // --- Load beans ---
  useEffect(() => {
    const loadBeans = async () => {
      if (session) {
        setSyncing(true);
        // Load from Supabase
        const { data: rows } = await supabase.from("beans").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
        
        if (rows && rows.length > 0) {
          // Have cloud beans - use them
          const cloudBeans = rows.map(rowToBean);
          setBeans(cloudBeans);
          onBeansChange?.(cloudBeans);
          // Clear localStorage since we have cloud data
          localStorage.removeItem(STORAGE_KEY);
        } else {
          // No cloud beans yet - check for local beans to migrate
          const localStr = localStorage.getItem(STORAGE_KEY);
          const localBeans = localStr ? JSON.parse(localStr).filter(b => !b.isExample) : [];
          
          if (localBeans.length > 0) {
            // Migrate local beans to Supabase
            showToast?.("Syncing your beans to the cloud...");
            const rows = localBeans.map(b => beanToRow(b, session.user.id));
            const { data: migrated } = await supabase.from("beans").insert(rows).select();
            if (migrated) {
              const cloudBeans = migrated.map(rowToBean);
              setBeans(cloudBeans);
              onBeansChange?.(cloudBeans);
              localStorage.removeItem(STORAGE_KEY);
              showToast?.("Beans synced to your account!");
            }
          } else {
            // Fresh account - start with example bean (don't save to DB)
            setBeans([EXAMPLE_BEAN]);
            onBeansChange?.([EXAMPLE_BEAN]);
          }
        }
        setSyncing(false);
      } else {
        // Not signed in - use localStorage
        try {
          const s = localStorage.getItem(STORAGE_KEY);
          if (s) {
            const parsed = JSON.parse(s);
            const withFresh = parsed.map(b => b.isExample ? EXAMPLE_BEAN : b);
            setBeans(withFresh); onBeansChange?.(withFresh);
          } else {
            setBeans([EXAMPLE_BEAN]);
            onBeansChange?.([EXAMPLE_BEAN]);
          }
        } catch {}
      }
    };
    loadBeans();
  }, [session?.user?.id]);

  // Save to localStorage only when not signed in
  useEffect(() => {
    if (!session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(beans));
    }
  }, [beans, session]);

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
    if (form.flavorText.trim().length < 30) { setError("Add a bit more detail to your flavor notes - at least 30 characters."); return; }
    const sanitizedText = form.flavorText.trim().slice(0, 500).replace(/[^\w\s.,!?'"()-]/g, " ");
    setError(""); setApiError(false); setAnalyzing(true);
    try {
      const cached = beans.find(
        (b) => b.flavorData && b.flavorText?.trim() === form.flavorText.trim() && b.id !== form.id
      );
      if (!cached) analysisLog.current.push(Date.now());
      const result = cached ? cached.flavorData : await mapFlavorsWithAI(sanitizedText);
      const isNew = !beans.find(b => b.id === form.id);
      const bean = { ...form, id: form.id || Date.now(), flavorData: result, createdAt: form.createdAt || new Date().toISOString() };

      if (session && !bean.isExample) {
        // Save to Supabase
        if (bean.supabase_id) {
          // Update existing
          await supabase.from("beans").update(beanToRow(bean, session.user.id)).eq("id", bean.supabase_id);
          updateBeans(beans.map(b => b.id === bean.id ? bean : b));
        } else {
          // Insert new
          const { data: inserted } = await supabase.from("beans").insert(beanToRow(bean, session.user.id)).select().single();
          if (inserted) {
            const savedBean = rowToBean(inserted);
            updateBeans(isNew ? [savedBean, ...beans.filter(b => !b.isExample)] : beans.map(b => b.id === bean.id ? savedBean : b));
            setActiveBean(savedBean);
            changeView("detail", savedBean);
            showToast?.("Bean saved!");
            if (isNew && savedBean.visibility !== "private") {
              supabase.from("activity").insert({ user_id: session.user.id, type: "logged_bean", item_data: { id: savedBean.id, brand: savedBean.brand, name: savedBean.name, origin: savedBean.origin, roast: savedBean.roast, flavorData: savedBean.flavorData }, is_public: savedBean.visibility === "public" }).then(() => {});
            }
            setAnalyzing(false);
            return;
          }
        }
      } else {
        // Save to localStorage
        updateBeans(isNew ? [bean, ...beans] : beans.map(b => b.id === bean.id ? bean : b));
      }

      setActiveBean(bean); changeView("detail", bean);
      showToast?.("Bean saved!");
    } catch (e) { setError("Couldn't analyze flavors. Check your connection and try again."); setApiError(true); }
    setAnalyzing(false);
  };

  const deleteBean = async (id) => {
    const bean = beans.find(b => b.id === id);
    if (session && bean?.supabase_id) {
      await supabase.from("beans").delete().eq("id", bean.supabase_id);
    }
    updateBeans(beans.filter((b) => b.id !== id));
    changeView("list", null);
  };

  const startEdit = (bean) => { setForm({ ...bean }); setError(""); setView("add"); };
  const startAdd = () => { setForm(emptyBean()); setError(""); setView("add"); };

  useEffect(() => { if (addTrigger > 0) startAdd(); }, [addTrigger]);
  useEffect(() => { if (shareTrigger > 0) setShowShareMenu(true); }, [shareTrigger]);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const updateScores = async (beanId, newScores) => {
    const next = beans.map((b) => b.id === beanId ? { ...b, scores: newScores } : b);
    updateBeans(next);
    setActiveBean((prev) => prev?.id === beanId ? { ...prev, scores: newScores } : prev);
    if (session) {
      const bean = beans.find(b => b.id === beanId);
      if (bean?.supabase_id) {
        await supabase.from("beans").update({ scores: newScores, updated_at: new Date().toISOString() }).eq("id", bean.supabase_id);
      }
    }
  };

  if (view === "add") return (
    <div className="page">
      <div className="form-header">
        <button className="btn-ghost" onClick={() => changeView("list", null)}>← Back</button>
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
      <div className="form-group" style={{ marginBottom: 8 }}>
        <label>Photo <span style={{ color: "var(--muted3)", fontWeight: 400 }}>(optional)</span></label>
        {form.image_url ? (
          <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
            <img src={form.image_url} alt="Bean" style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block", border: "1px solid var(--border)" }} />
            <button onClick={() => setForm(prev => ({ ...prev, image_url: null }))}
              style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        ) : (
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: "1px dashed var(--border2)", cursor: "pointer", color: "var(--muted3)", fontSize: 13 }}>
            {uploadingImage ? "Uploading..." : "📷 Add a photo of the bag or cup"}
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} disabled={uploadingImage} />
          </label>
        )}
        <div className="hint">JPG, PNG, or WEBP - max 5MB</div>
      </div>
      <div className="form-group" style={{ marginBottom: 8 }}>
        <label>Visibility</label>
        <select value={form.visibility || "private"} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
          <option value="private">Private - only you</option>
          <option value="friends">Friends - your friends feed</option>
          <option value="public">Public - visible to friends of friends</option>
        </select>
      </div>
      <div className="form-actions">
        {analyzing
          ? <div className="analyzing"><div className="spin" />Mapping your flavors...</div>
          : apiError
            ? <><button className="btn-primary" onClick={saveBean}>↺ Retry</button><button className="btn-ghost" onClick={() => setView("list")}>Cancel</button></>
            : <><button className="btn-primary" onClick={() => { if (!session) { setShowAuthModal(true); } else { saveBean(); } }} disabled={debounced} style={{ opacity: debounced ? 0.5 : 1 }}>Build Flavor Wheel →</button><button className="btn-ghost" onClick={() => setView("list")}>Cancel</button></>}
      </div>
    </div>
  );

  if (view === "detail" && activeBean) {
    const bean = activeBean;
    return (
      <div className="page">
        <button className="btn-ghost" onClick={() => changeView("list", null)} style={{ marginBottom: 28 }}>← Collection</button>
        {bean.image_url && (
          <img src={bean.image_url} alt={bean.name} style={{ width: "100%", maxHeight: 300, objectFit: "cover", marginBottom: 24, border: "1px solid var(--border)", display: "block" }} />
        )}
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
              <button className="btn-ghost" onClick={() => startEdit(bean)}>Edit</button>
              <button className="btn-ghost" onClick={() => {
                setActiveBean(bean);
                setComparePick(true);
                changeView("list", null);
              }}>Compare</button>
              <button className="btn-ghost" onClick={() => setShowExportCard(true)}>Export Card</button>
              {session && <button className="btn-ghost" onClick={() => setShowSendToFriend(true)}>Send to Friend</button>}
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
                      <span style={{ fontSize: 10, color: "var(--muted4)" }}> - {desc}</span>
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
        {showShareMenu && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowShareMenu(false)}>
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", width: "100%", maxWidth: 480, padding: "24px 24px 32px" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 10, color: "var(--gold)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Share</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => { setShowShareMenu(false); setShowExportCard(true); }}
                  style={{ padding: "14px 18px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ color: "var(--gold)", fontSize: 18 }}>◎</span>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>Export Card</div>
                    <div style={{ fontSize: 11, color: "var(--muted3)" }}>Download a shareable PNG card</div>
                  </div>
                </button>
                {session && (
                  <button onClick={() => { setShowShareMenu(false); setShowSendToFriend(true); }}
                    style={{ padding: "14px 18px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ color: "var(--gold)", fontSize: 18 }}>✉</span>
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>Send to Friend</div>
                      <div style={{ fontSize: 11, color: "var(--muted3)" }}>Share directly with a friend on Craft & Cup</div>
                    </div>
                  </button>
                )}
              </div>
              <button onClick={() => setShowShareMenu(false)} style={{ marginTop: 16, background: "none", border: "none", color: "var(--muted3)", fontSize: 11, cursor: "pointer", fontFamily: "'Jost',sans-serif", letterSpacing: 1, textTransform: "uppercase", padding: 0 }}>Cancel</button>
            </div>
          </div>
        )}
        {showExportCard && (
          <BeanCardExport bean={bean} onClose={() => setShowExportCard(false)} />
        )}
        {showSendToFriend && session && (
          <SendToFriendModal session={session} item={bean} itemType="bean" onClose={() => setShowSendToFriend(false)} showToast={showToast} />
        )}
      </div>
    );
  }

  if (view === "compare" && activeBean && compareBean) {
    return <CompareView
      beanA={activeBean}
      beanB={compareBean}
      onBack={() => { changeView("list", null); setCompareBean(null); setActiveBean(null); }}
      onViewBean={(b) => { setActiveBean(b); setCompareBean(null); changeView("detail", b); }}
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
                {syncing ? "Syncing..." : filteredBeans.length === beans.length
                  ? `${beans.length} bean${beans.length !== 1 ? "s" : ""}`
                  : `${filteredBeans.length} of ${beans.length} beans`}
              </div>
            </div>
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
                        changeView("compare", null);
                      } else {
                        setActiveBean(bean); changeView("detail", bean);
                      }
                    }}>
                    {comparePick && activeBean?.id !== bean.id && (
                      <div className="compare-card-hint">Tap to compare</div>
                    )}
                    {comparePick && activeBean?.id === bean.id && (
                      <div className="compare-card-hint self">Comparing this bean</div>
                    )}
                    {bean.isExample && <div className="bean-example-badge">Example</div>}
                    {bean.image_url && (
                      <div style={{ width: "100%", height: 120, overflow: "hidden", marginBottom: 10 }}>
                        <img src={bean.image_url} alt={bean.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
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
    </div>
  );
}

// --- Guide / Tips Page -------------------------------------------------------

const GRIND_GUIDE = [
  { size: "Extra Coarse", color: "#c8a878", desc: "Visibly chunky, like cracked peppercorns or coarse sea salt. Almost no resistance when you rub it between your fingers. Used exclusively for cold brew - the 12-24 hour steep compensates for the open grind, and going finer would make the concentrate bitter and astringent.", methods: ["Cold Brew"] },
  { size: "Coarse",       color: "#b89060", desc: "Like rough kosher salt - distinct, irregular particles with plenty of space between them. Ideal for French Press because the full-immersion brew method needs a coarse grind to avoid over-extraction during the 4-minute steep. Also works well for cold brew concentrate.", methods: ["French Press", "Cold Brew"] },
  { size: "Medium-Coarse",color: "#c09858", desc: "Slightly finer than French Press but still quite open - closer to coarse beach sand. The Chemex uses a much thicker paper filter than a V60, which dramatically slows the flow rate. A coarser grind compensates for this, keeping brew time in range and preventing a bitter, over-extracted cup.", methods: ["Chemex"] },
  { size: "Medium",       color: "#b88848", desc: "The workhorse grind - consistent, uniform particles about the size of fine breadcrumbs. Drip machines are designed around this grind size, and it's the safest starting point for any new brew method. Not too fast, not too slow, extracts evenly with moderate heat and contact time.", methods: ["Drip Machine"] },
  { size: "Medium-Fine",  color: "#c09040", desc: "Finer than drip but not as dense as espresso - smooth to the touch with just a hint of texture. This is the sweet spot for pour over and AeroPress, where you want enough resistance to slow the flow and extend contact time, but not so much that it chokes the drawdown or over-extracts.", methods: ["Pour Over / V60", "AeroPress"] },
  { size: "Fine",         color: "#a87838", desc: "Dense and powdery-smooth, like fine table salt or granulated sugar. At this size, water has to work hard to push through the bed of grounds, which is exactly what espresso machines and Moka Pots need. That resistance is what creates pressure and forces fast, concentrated extraction in under 30 seconds.", methods: ["Espresso", "Moka Pot"] },
  { size: "Extra Fine",   color: "#906030", desc: "Almost a powder - finer than espresso, closer to flour or powdered sugar. The only common use is Turkish coffee, where grounds are simmered directly in water in a cezve and never filtered out. The ultra-fine grind is intentional: it settles to the bottom of the cup and becomes part of the drinking experience.", methods: ["Turkish Coffee"] },
];

const FAQ_SECTIONS = [
  {
    category: "The Basics",
    icon: "◎",
    items: [
      { q: "What is a brew ratio?", a: "The brew ratio is how much coffee you use relative to water, expressed as 1:X. A 1:15 ratio means 1 gram of coffee per 15 grams of water. Lower numbers make stronger coffee, higher numbers make it lighter. Most pour overs sit around 1:15 to 1:16. Espresso is far more concentrated at around 1:2. The Brew Calculator handles all of this automatically - just dial in your preferred strength and it tells you exactly how much of each to use." },
      { q: "Why do people weigh coffee instead of using scoops?", a: "Coffee beans vary in density depending on roast level and origin. A scoop of light roast beans weighs more than the same scoop of dark roast. Grams are consistent. Using a scale is the single biggest upgrade most beginners can make and cheap ones work perfectly well." },
      { q: "What does bloom mean?", a: "When hot water hits fresh coffee grounds, trapped CO2 gases escape in a burst. If you skip this step, those gases repel water and cause uneven extraction. Blooming means pouring a small amount of water (usually twice the coffee weight) over the grounds and waiting 30 to 45 seconds before the main pour. Fresh coffee bubbles and rises dramatically during the bloom. Stale coffee barely reacts at all." },
      { q: "Does water temperature matter?", a: "Yes, significantly. Water above 96 degrees Celsius over-extracts and tastes harsh. Water that is too cool under-extracts and tastes flat or sour. Most brew methods aim for 90 to 95 degrees Celsius. A simple approach is to boil water and let it sit off the heat for 30 to 60 seconds. AeroPress intentionally uses cooler water around 85 degrees to reduce bitterness and increase smoothness." },
      { q: "What causes bitter coffee?", a: "Bitterness means over-extraction - too many compounds dissolved into the cup. The most common causes are grinding too fine, water too hot, brewing too long, or using too much coffee. Grinding coarser is almost always the first adjustment to try. Stale beans and poor water quality also contribute to bitterness." },
      { q: "What causes sour or flat tasting coffee?", a: "Sourness and flatness mean under-extraction - not enough dissolved in the cup. Common causes include grinding too coarse, water not hot enough, brewing too quickly, or not enough coffee. Try grinding finer first. Some bright acidity is desirable especially in light roasts, but sharp or harsh sourness is a sign something is off with your extraction." },
      { q: "What is the difference between light, medium, and dark roast?", a: "Roast level shapes the flavor more than almost any other variable. Light roasts retain more of the beans original character: fruity, floral, complex, higher acidity. Dark roasts develop flavors from the roasting process itself: chocolate, smoke, caramel, lower acidity. Medium sits between the two. Neither is objectively better. The Roast Guide in the Guide tab covers 12 roast levels in detail including their flavor profiles and best brew methods." },
      { q: "Does grind freshness matter?", a: "Dramatically. Coffee starts oxidizing within minutes of being ground. Pre-ground coffee from a supermarket bag is significantly less vibrant than freshly ground beans. If you want better coffee without changing anything else, grinding fresh right before brewing is the highest-impact change you can make. Even an inexpensive hand grinder makes a noticeable difference." },
      { q: "What is specialty coffee?", a: "Specialty coffee refers to beans that score 80 or above on a 100-point scale assessed by trained tasters called Q Graders. The scoring covers flavor clarity, sweetness, acidity, and the absence of defects. Practically speaking, specialty coffee is traceable to a specific farm or region, roasted recently, and handled carefully at every step. The difference in the cup compared to commodity coffee is real and significant." },
      { q: "What is a coffee processing method?", a: "Processing is how the coffee cherry is turned into a green bean ready for roasting. Washed coffees have the fruit removed before drying, which produces clean and bright cups where the origin character comes through clearly. Natural coffees are dried with the fruit still on, adding intense sweetness and jammy berry notes. Honey processed coffees are a middle ground - some fruit is left on during drying, producing a sweet and rounded cup. Processing method is one of the biggest factors in a coffee's flavor profile." },
    ],
  },
  {
    category: "Accounts and Sign In",
    icon: "◈",
    items: [
      { q: "Do I need an account to use Craft and Cup?", a: "No. You can use the Brew Calculator and explore the Guide and FAQ without an account. However, saving beans to your Journal, saving recipes, creating collections, and using any social features requires signing in. If you use the app without an account your data is stored locally on your device and will not sync across devices or browsers." },
      { q: "How do I create an account?", a: "Tap Sign In in the navigation bar and choose Continue with Google or Continue with Discord. There is no separate sign-up flow - signing in for the first time automatically creates your account. After signing in you will be prompted to choose a screenname, which is how other users will see you on the platform." },
      { q: "What is a screenname?", a: "Your screenname is the public-facing name other users see on Craft and Cup. It is separate from your Google or Discord name and your email address, which are never shown to other users. Screennames must be 3 to 24 characters using only letters, numbers, and underscores. You can change your screenname at any time from your Profile tab." },
      { q: "Can I link multiple sign-in methods to one account?", a: "Yes. Go to your Profile tab, tap Accounts, and you will see options to link Google and Discord. If you signed in with Discord you can link Google to the same account and vice versa. This means you can sign in with either method and access the same data." },
      { q: "How do I sign out?", a: "Go to your Profile tab and scroll down to the Account section. Tap Sign Out. Your data remains saved in your account and will be there when you sign back in." },
      { q: "What happens to my data if I sign in for the first time on a device I already used without an account?", a: "If you have beans saved locally and sign in for the first time, Craft and Cup automatically migrates all your local beans and recipes to your account in the cloud. You will see a brief syncing message and then everything appears in your account. Your local data is cleared after a successful migration. Nothing is lost." },
      { q: "Can I delete my account?", a: "Yes. Go to your Profile tab, scroll down to the Account section, and tap Delete Account. You will be asked to confirm with a 5 second delay before the deletion goes through. Deleting your account permanently removes your profile, beans, recipes, collections, and all associated data. This cannot be undone." },
    ],
  },
  {
    category: "Your Data and Privacy",
    icon: "◉",
    items: [
      { q: "Where is my data stored?", a: "When you are signed in, your beans, recipes, and collections are stored securely in Supabase, a cloud database. Your photos are stored in Supabase Storage. Your theme preference and onboarding state are stored locally in your browser. When you are not signed in, everything is stored locally in your browser only." },
      { q: "What visibility options do I have for my beans and recipes?", a: "Every bean and recipe has three visibility options you can set when saving. Private means only you can see it. Friends means it appears in the feed of people you are friends with on Craft and Cup. Public means it is visible to a broader audience. The default is Private, so nothing is shared unless you choose to share it." },
      { q: "Can other users see my email address or real name?", a: "Never. Your email address, Google name, and Discord username are never shown to other users. The only thing other users see is the screenname you chose when setting up your profile. Your linked sign-in providers are also private." },
      { q: "Can I make my profile private?", a: "Yes. By default your profile is private. Go to your Profile tab, tap Edit Profile, and you will see a Make my profile public toggle. When your profile is private, other users cannot find or view your profile page even if they have your screenname. Your friend code still works for adding friends regardless of this setting." },
      { q: "Who can see my activity in the feed?", a: "Only beans and recipes you have set to Friends or Public visibility will appear in any feed. Private items never appear to anyone but you. Friends visibility items appear only to users you have accepted as friends." },
      { q: "Can I change the visibility of a bean or recipe after saving it?", a: "Yes. Open the bean or recipe, tap Edit, and change the Visibility dropdown to your preferred setting. Save it and the change takes effect immediately." },
    ],
  },
  {
    category: "Bean Journal",
    icon: "◎",
    items: [
      { q: "How do I log a bean?", a: "Tap the Journal tab, then tap the gold Log Bean button in the bottom right corner. Fill in the brand, bean name, origin, roast level, and brew method. Add personal notes about where you got it or any context about the roast. Then write your tasting notes in the Flavor Notes field - describe what you taste in plain language. Tap Build Flavor Wheel and the AI maps your description to the flavor wheel automatically. You need to be signed in to save beans." },
      { q: "How does the AI flavor wheel work?", a: "Craft and Cup uses Claude, an AI model made by Anthropic, to build flavor profiles two ways. For beans, it reads your tasting notes and maps what you described onto a multi-tier flavor taxonomy - from broad categories like Fruity or Floral down to specific notes like Wild Blackberry or White Jasmine. For recipes, it builds a profile automatically from your ingredients - the drink type, milk, syrup, and extras - and combines that with any taste notes you add. The size of each wheel segment reflects how prominent that flavor is. You do not need to use coffee jargon for either." },
      { q: "What should I write in the flavor notes?", a: "Write exactly what you taste as if describing it to a friend who has never tried the coffee. The AI responds well to specific, sensory language. Instead of just 'fruity' try 'reminds me of fresh blackberry jam with a hint of citrus peel.' Mention texture (silky, coating, thin), finish (long, short, clean, lingering), aroma (floral, earthy, roasted), and any specific foods or flavors the coffee reminds you of. The more detail you give, the richer and more accurate the wheel will be." },
      { q: "Can I add a photo to a bean entry?", a: "Yes. When logging or editing a bean, tap the Photo field and select an image from your camera roll or files. A photo of the bag, the cup, or the brewing setup all work well. Photos are stored securely in your account and appear as a thumbnail in your collection and at the top of the bean detail page." },
      { q: "What are tasting scores?", a: "Each bean can be scored on seven attributes: Aroma, Acidity, Body, Sweetness, Finish, Balance, and Bitterness. Each attribute is scored from 1 to 10. The overall score is the average. Scores appear on the bean card and are used for sorting your collection by highest-rated. You can update scores at any time from the bean detail page." },
      { q: "Can I compare two beans side by side?", a: "Yes. Open any bean in your journal and tap Compare. This puts the app in compare mode. Tap a second bean from your collection and you will see both beans displayed side by side with their flavor wheels, scores, tasting notes, and details. It is useful for comparing two beans from the same origin or seeing how your palate has tracked a roaster over time." },
      { q: "Can I export a bean as a shareable card?", a: "Yes. Open any bean and tap Export Card. This renders the bean data into a PNG image with the flavor wheel, scores, flavor chips, and tasting notes. On iPhone you can long press the image to Save to Photos, or tap the Download button to save it as a file. The card is high resolution and looks good shared on social media or in messages." },
      { q: "How do I send a bean to a friend?", a: "Open the bean detail page and tap Send to Friend. Select the friend from your list, add an optional message, and tap Send. Your friend will receive the bean in their Inbox tab. Sending requires you to be signed in and to have at least one accepted friend." },
      { q: "How many beans can I store?", a: "There is no hard limit on how many beans you can store in your journal. Log as many as you want." },
      { q: "Is there a limit on AI flavor wheel analysis?", a: "To prevent abuse, each account is limited to 10 AI flavor analyses per hour - this covers both bean flavor wheels and recipe flavor profiles. The counter resets after 60 minutes. If you hit the limit you will see a message letting you know and the analysis will be available again once the hour is up." },
    ],
  },
  {
    category: "Recipes",
    icon: "◆",
    items: [
      { q: "What kinds of recipes can I save?", a: "The recipe section is designed for milk-based espresso drinks - lattes, flat whites, cappuccinos, cortados, macchiatos, and similar. You can log the drink type, temperature, espresso shots, milk type and amount, syrups, extras, and step-by-step instructions. Rating and personal notes are also supported. It is designed for drinks you want to recreate exactly." },
      { q: "Can I add a photo to a recipe?", a: "Yes. When creating or editing a recipe, tap the Photo field and upload an image. A photo of the finished drink makes recipe cards much more personal and easier to identify at a glance. Photos appear as a thumbnail in the recipe list and full-width at the top of the recipe detail page." },
      { q: "Can I share a recipe with a friend?", a: "Yes. Open the recipe detail page and tap Send to Friend. The full recipe including all ingredients, steps, and your photo is sent directly to your friend's Inbox." },
      { q: "How do I control who sees my recipes?", a: "Each recipe has a Visibility setting: Private (only you), Friends (your friends feed), or Public. The default is Private. You can change the visibility at any time by editing the recipe." },
    ],
  },
  {
    category: "Collections",
    icon: "◻",
    items: [
      { q: "What are collections?", a: "Collections let you organise your saved beans into named groups. You might create collections like My Ethiopia Naturals, Beans to Try, Favourite Light Roasts, or Gifts for Friends. Each collection can have a name, optional description, a selection of beans from your journal, and a public or private visibility setting." },
      { q: "How do I create a collection?", a: "Go to the Collections tab and tap New. Give your collection a name and optional description. Tap Add Beans from Journal to pick which beans to include. Choose your visibility setting and save. You can edit a collection at any time to add or remove beans." },
      { q: "Can other people see my collections?", a: "Only if you set them to public. Private collections are only visible to you. Public collections are visible on your public profile page to anyone who views it." },
    ],
  },
  {
    category: "Friends and Social",
    icon: "✦",
    items: [
      { q: "How do I add a friend?", a: "Go to your Profile tab and tap Friends. You will see your unique Friend Code displayed in gold - a short code like BREW-4X9K. Share this code with someone and have them enter it in the Add a Friend field on their Profile. They send you a request and you can accept or decline it from the Friend Requests section." },
      { q: "Where do I find my friend code?", a: "Go to your Profile tab and tap the Friends section. Your code is displayed at the top in large gold text. Tap Copy to copy it to your clipboard." },
      { q: "Can someone find me without my friend code?", a: "Only if you share your friend code with them directly. If your profile is private, your friend code is the only way someone can add you." },
      { q: "How do I accept or decline a friend request?", a: "Go to your Profile tab and tap Friends. Incoming requests appear with Accept and Decline buttons. The Friends tab in the nav shows a red badge when you have pending requests." },
      { q: "How do I remove a friend?", a: "Go to your Profile tab, tap Friends, and find the person in your friends list. Tap Remove next to their name." },
      { q: "What does the Friends Feed show?", a: "The Feed tab shows activity from your friends - beans they have logged and recipes they have saved, but only the ones they have set to Friends or Public visibility. Private items from your friends never appear in your feed." },
      { q: "What is the Friends Feed?", a: "The Friends Feed shows beans and recipes shared by people you are friends with on Craft and Cup. You can react to posts and leave comments. Only content set to Friends or Public visibility will appear." },
      { q: "How do reactions work?", a: "On any post in the Feed you will see three reaction buttons: a coffee cup for Love it, a star for Want to try, and a coffee bean for Interesting. Tap once to react, tap again to remove your reaction. Reaction counts are shown on each post. The person who posted the item gets a notification when someone reacts." },
      { q: "How do comments work?", a: "Tap Comments on any feed or discovery post to expand the comments section. Write up to 280 characters and tap Post. There is a 5 second cooldown between comments to prevent spam. You can edit or delete your own comments at any time. Deleted comments show as [comment deleted] rather than disappearing so conversation threads stay readable. You can report any comment using the Report button." },
      { q: "Can I comment without an account?", a: "No. Commenting requires being signed in. You can read comments without an account but you need to sign in to post." },
    ],
  },
  {
    category: "Notifications and Inbox",
    icon: "◈",
    items: [
      { q: "What is the Inbox?", a: "The Inbox tab shows beans and recipes that friends have sent directly to you using the Send to Friend feature. Each item shows who sent it, what they sent, any message they included, and when it was sent. Unread items show a gold dot and the Inbox button shows a badge count when you have unread items." },
      { q: "What are notifications?", a: "Notifications (the bell icon in the nav) alert you when something happens related to your content or social activity. You get notified when someone reacts to your post, comments on your post, sends you a friend request, accepts your friend request, or sends you something via the Inbox. The bell shows a badge count when you have unread notifications." },
      { q: "How do I mark notifications as read?", a: "Opening the notifications panel marks all current notifications as read automatically. The badge clears when you open it." },
    ],
  },
  {
    category: "Brew Calculator",
    icon: "▽",
    items: [
      { q: "Which brew methods does the calculator support?", a: "The Brew Calculator supports Pour Over and V60, Chemex, Espresso, Cold Brew, French Press, AeroPress, Moka Pot, and Drip Machine. Each method has its own default ratio, grind guide, recommended temperature, and a built-in stage timer that walks you through the brew step by step." },
      { q: "How does the brew timer work?", a: "Each brew method has a staged timer built in. For pour overs it walks you through the bloom and each pour with individual countdowns. For espresso there is a shot timer that counts up with a target zone highlighted so you know when to stop. Tap the Start button when you begin brewing and the timer handles the rest." },
      { q: "What is yield and how is it different from dose?", a: "Dose is the amount of dry coffee you put in. Yield is the amount of liquid in the cup at the end. For most brew methods these are directly calculated from the ratio. For espresso they are treated separately because the puck absorbs a significant amount of water. The calculator shows both and lets you adjust either." },
      { q: "What is the Milk Drinks Calculator?", a: "The Milk Drinks Calculator is part of the espresso section. It lets you dial in the milk and espresso ratios for standard drinks like lattes, flat whites, cappuccinos, cortados, and macchiatos based on your espresso yield. Adjust the yield and all the milk volumes update proportionally." },
      { q: "What temperature should I use for each method?", a: "The calculator shows a recommended temperature for each method. As a general guide: pour over and Chemex work well at 93 to 95 degrees Celsius, French Press at 93 to 96 degrees, AeroPress at 80 to 85 degrees, espresso at 90 to 96 degrees depending on the machine, and cold brew uses room temperature or cold water over a long steep. The Brew Calculator displays the target range for the selected method." },
      { q: "Can I save my favourite brew settings?", a: "Yes. Once you have dialled in your preferred settings for a method, you can save them as a recipe in the Recipes tab. Set the drink type, shots, milk, and other details and save. The recipe is stored in your account and synced across devices when you are signed in." },
    ],
  },
  {
    category: "Milk and Drinks",
    icon: "◉",
    items: [
      { q: "What is the difference between a latte, flat white, and cappuccino?", a: "All three are espresso with steamed milk but the ratios and textures differ. A latte is the largest and milkiest, typically 200 to 250ml with a thin layer of microfoam on top. A flat white is smaller at 150 to 180ml with a higher ratio of espresso to milk and very thin velvety microfoam that blends fully into the drink. A cappuccino is traditionally equal thirds of espresso, steamed milk, and foam, producing a drier lighter texture with a thick foam cap. The Milk Guide in the Guide tab covers these in detail." },
      { q: "What milk works best for steaming?", a: "Whole milk steams easiest and tastes richest. For plant-based options, barista oat milk is the best for hot drinks and produces latte-art quality microfoam. Standard grocery oat milk separates and tastes grainy when heated. Almond milk is better cold than hot. Soy milk steams reasonably well but has a strong flavour. Always look for barista edition plant milks for hot espresso drinks." },
      { q: "What is cold foam and how do I make it at home?", a: "Cold foam is frothed cold milk served on top of iced drinks. To make it at home use cold low-fat milk or skim milk and froth with a handheld frother for 20 to 30 seconds until thick and stable. You can also use a French Press by adding cold milk and pumping the plunger rapidly for 30 seconds. Flavoured cold foams are made by blending a small amount of syrup or sweet cream into the milk before frothing." },
      { q: "What is a cortado?", a: "A cortado is a small drink of equal parts espresso and steamed milk, usually 60 to 90ml total. The name comes from the Spanish word for cut, meaning the milk cuts the intensity of the espresso. It is similar to a small flat white but with even less milk and no thick foam layer. If you find lattes too milky but straight espresso too intense, a cortado is often the perfect middle ground." },
    ],
  },
  {
    category: "Grind and Equipment",
    icon: "⊟",
    items: [
      { q: "What grinder should I buy as a beginner?", a: "A burr grinder is essential. Blade grinders chop unevenly and produce a mix of fine dust and large chunks that extracts inconsistently. For hand grinders the 1Zpresso Q2 and Timemore Chestnut C2 are excellent value. For electric grinders the Baratza Encore is the most recommended entry-level option. The single biggest upgrade most beginners can make is switching from a blade grinder to a burr grinder." },
      { q: "Why does grind size matter so much?", a: "Grind size controls the rate of extraction. Finer grinds have more surface area and extract faster. Coarser grinds extract slower. Each brew method has an optimal extraction time and grind size is the primary way you control it. Too fine and you over-extract (bitter). Too coarse and you under-extract (sour, flat). The Interactive Grind Guide in the Guide tab shows the right size for each method." },
      { q: "Do I need a scale?", a: "Yes, if you want consistent results. Volume measurements with scoops vary too much between bean densities and grind sizes. A basic kitchen scale that measures in 0.1 gram increments is all you need and they cost very little. Weighing both your coffee dose and your brew water is the fastest path to reproducible, dialled-in coffee." },
      { q: "Does water quality affect taste?", a: "Significantly. Coffee is 98 to 99 percent water, so its mineral content directly affects extraction and taste. Distilled water extracts poorly and produces flat coffee. Very hard water over-extracts and can taste bitter or chalky. Filtered tap water is sufficient for most people. If you want to go further, Third Wave Water mineral packets added to distilled water create an ideal mineral profile for coffee extraction." },
    ],
  },
  {
    category: "Coffee Origins",
    icon: "★",
    items: [
      { q: "Why does origin matter so much in specialty coffee?", a: "Coffee absorbs the character of where it grows through a concept called terroir - the combination of altitude, soil, climate, and farming practices that shape the bean before it is ever roasted. Ethiopian coffees taste like Ethiopia. Kenyan coffees taste like Kenya. Understanding origin is one of the most reliable ways to predict what a coffee will taste like before you try it. The Origins Guide in the Guide tab covers the major producing regions in depth." },
      { q: "What are the main coffee growing regions?", a: "The major regions are East Africa (Ethiopia, Kenya, Rwanda, Burundi), Central America (Guatemala, Costa Rica, Honduras, Panama), South America (Colombia, Brazil, Peru, Bolivia), and Asia and Pacific (Sumatra, Java, Yemen, Papua New Guinea). Each region has characteristic flavor profiles shaped by altitude, variety, and processing traditions. The Guide tab has an interactive Origins section that covers each region in detail." },
      { q: "What is the difference between Arabica and Robusta?", a: "Arabica is grown at higher altitudes, is more delicate, and produces complex, aromatic coffees with higher perceived acidity. Almost all specialty coffee is Arabica. Robusta is hardier, grows at lower altitudes, has more caffeine, stronger and more bitter flavors, and is used primarily in commercial blends and instant coffee. When a bag just says coffee with no origin, it is usually Robusta or low-grade Arabica." },
      { q: "What does single origin mean versus a blend?", a: "Single origin means the coffee comes from one specific country, region, or even a single farm. This lets the unique character of that place come through clearly in the cup. A blend combines beans from multiple origins, usually to create a consistent flavor profile that is more balanced and predictable. Blends are the backbone of most commercial espresso. Neither is objectively better. Single origins are great for exploring flavors. Blends are great for everyday reliability." },
    ],
  },
  {
    category: "Homemade Syrups",
    icon: "◆",
    items: [
      { q: "What is a simple syrup and how do I make one?", a: "Simple syrup is equal parts sugar and water heated together until the sugar fully dissolves. The standard ratio is 1 cup of sugar to 1 cup of water. Combine in a saucepan over medium heat, stir until the sugar is completely dissolved, then remove from heat. Unlike granulated sugar, simple syrup blends instantly into both hot and cold drinks with no graininess. Once cooled, store in an airtight glass jar or bottle in the fridge for up to one month. Almost all flavored coffee syrups start with this base." },
      { q: "How do I make vanilla syrup?", a: "Combine 1 cup of sugar and 1 cup of water in a saucepan over medium heat, stirring until the sugar dissolves. Remove from heat and immediately stir in 2 teaspoons of pure vanilla extract, or split and scrape a vanilla bean pod directly into the mixture while it heats for a more intense flavour. Let cool fully, then strain through a fine mesh strainer and store in a glass jar in the fridge for up to one month. For a richer version, substitute brown sugar for white to make a vanilla brown sugar syrup." },
      { q: "How do I make brown sugar cinnamon syrup?", a: "Combine 1 cup of brown sugar, 1 cup of water, and 2 cinnamon sticks in a saucepan over medium heat. Stir until the brown sugar fully dissolves, then reduce heat and simmer for 5 minutes to infuse the cinnamon. Remove from heat and let cool before removing the cinnamon sticks. For a deeper flavour, let the cinnamon sticks steep in the cooling syrup for up to 3 hours before straining. Store in a sealed glass jar in the fridge for up to two weeks. This is the base for a brown sugar oat milk latte - two pumps of syrup, oat milk, espresso over ice." },
      { q: "How do I make lavender syrup?", a: "Combine 1 cup of sugar, 1 cup of water, and 2 tablespoons of dried culinary lavender in a saucepan. Bring to a simmer over medium heat, stirring until the sugar dissolves. Simmer for 15 minutes, then remove from heat and let the lavender steep for another 15 to 30 minutes - taste as you go and stop when the floral flavour is where you want it. Strain through a fine mesh strainer into a glass jar, discarding the buds. Store in the fridge for up to two weeks. Use in iced lattes, hot lattes, or matcha drinks." },
      { q: "How do I make caramel syrup?", a: "Add 1 cup of sugar and 1/4 cup of water to a heavy saucepan over medium heat. Do not stir - swirl the pan gently if needed. Cook until the mixture turns a deep amber golden colour, about 8 to 10 minutes. Remove from heat and carefully add 1/2 cup of warm water (it will bubble vigorously), then stir until smooth. Add a pinch of salt and 1 teaspoon of vanilla extract once slightly cooled. Store in the fridge for up to two weeks. This is a true caramel syrup rather than a simple syrup - it has more depth and a slightly bitter edge that pairs beautifully with milk drinks." },
      { q: "How do I make hazelnut syrup?", a: "Combine 1 cup of sugar and 1 cup of water in a saucepan over medium heat, stirring until the sugar dissolves. Remove from heat and add 1 to 2 teaspoons of hazelnut extract (start with 1 and taste before adding more - hazelnut extract is strong). Let cool fully and store in a sealed glass jar in the fridge for up to one month. For a more natural version, toast 1/2 cup of raw hazelnuts and add them to the simmering syrup, then strain after cooling." },
      { q: "How do I make a honey lavender syrup?", a: "Replace the sugar in a standard lavender syrup with raw honey. Combine 3/4 cup of honey, 3/4 cup of water, and 2 tablespoons of dried culinary lavender. Heat gently over low to medium heat - do not boil, as boiling honey can reduce its flavour complexity. Stir until the honey dissolves fully, simmer for 5 minutes, then remove from heat and steep for 20 to 30 minutes. Strain and store in the fridge for up to two weeks. The honey adds a floral sweetness that layers beautifully with the lavender." },
      { q: "How do I make peppermint syrup?", a: "Combine 1 cup of sugar and 1 cup of water in a saucepan over medium heat, stirring until dissolved. Remove from heat and add 1/2 teaspoon of pure peppermint extract. Start conservatively - peppermint extract is potent and the flavour intensifies as the syrup cools. Taste and add more in small increments if needed. Let cool fully and store in a glass jar in the fridge for up to one month. Pairs well with mocha drinks and iced lattes." },
      { q: "How do I make a brown sugar maple syrup?", a: "Combine 1/2 cup of brown sugar, 1/4 cup of pure maple syrup, and 3/4 cup of water in a saucepan over medium heat. Stir until the sugar dissolves and the maple syrup is fully incorporated. Simmer for 3 to 5 minutes, then remove from heat and let cool. Store in the fridge for up to two weeks. The maple adds a warm, earthy sweetness that pairs especially well with cold brew and iced lattes with oat milk." },
      { q: "How long do homemade syrups last?", a: "Most simple syrups last 3 to 4 weeks in the fridge in a sealed glass jar. Syrups made with fruit or dairy will have a shorter life of around 1 to 2 weeks. Honey-based syrups last 2 to 3 weeks. Always discard a syrup if it looks cloudy, has any mold, or smells off. To extend shelf life slightly, add a small splash of vodka (about a teaspoon per cup of syrup) - it acts as a natural preservative without affecting the flavour." },
      { q: "What glass jars work best for storing syrups?", a: "Swing-top glass bottles (also called Grolsch-style bottles) are ideal - they seal tightly, pour easily, and stay less sticky than screw-top jars. Small 250ml to 500ml sizes work well for home use. Standard mason jars with lids work perfectly fine too. Always let the syrup cool completely before sealing and refrigerating, as sealing hot syrup can create condensation and shorten shelf life." },
      { q: "Can I make syrups without refined sugar?", a: "Yes. Coconut sugar works as a 1:1 substitute for white or brown sugar and adds a subtle caramel note. Honey works well but should be heated gently rather than boiled. Maple syrup can be used directly or combined with a small amount of water. Agave nectar dissolves easily and has a neutral flavour good for delicate syrups like lavender. Each alternative will produce a slightly different flavour profile, which can be a good thing - experiment and find what you like." },
      { q: "What is the difference between white sugar, brown sugar, and raw sugar in syrups?", a: "White granulated sugar produces a clean, neutral sweetness that lets other flavours like vanilla or lavender come through without interference. It makes a perfectly clear syrup. Brown sugar contains molasses, which adds a warm caramel and toffee depth that pairs beautifully with cinnamon, vanilla, and espresso-based drinks. Light brown sugar is more subtle, dark brown sugar is richer and more intense. Raw sugar (such as turbinado or demerara) sits between the two - less refined than white, with a mild caramel edge and slightly larger crystals that take a little longer to dissolve." },
      { q: "What is demerara sugar and when should I use it?", a: "Demerara is a raw cane sugar with large golden crystals and a distinct toffee and butterscotch note from residual molasses. It dissolves more slowly than white sugar so requires a bit more stirring, but the flavour payoff is worth it. It pairs exceptionally well with cold brew, dark roast espresso, and whisky-inspired coffee drinks. If you have ever tasted a particularly complex caramel note in a specialty coffee drink, demerara syrup is often behind it." },
      { q: "What is muscovado sugar and how does it affect a syrup?", a: "Muscovado is an unrefined cane sugar with a very high molasses content, giving it a dark, almost sticky texture and a bold, deep flavour reminiscent of toffee, dark rum, and black treacle. It makes the most intensely flavoured brown sugar syrup you can produce at home. A small amount goes a long way. It pairs best with dark roast espresso, cold brew, and chocolate-forward drinks. Use it sparingly at first - it is significantly more powerful than regular brown sugar." },
      { q: "What is coconut sugar and does it taste like coconut?", a: "Coconut sugar comes from the sap of coconut palm flowers, not the coconut fruit itself. It does not taste like coconut. The flavour is mild and slightly caramel-like, similar to a light brown sugar but with a more subtle depth. It has a lower glycaemic index than white sugar and dissolves well in syrups. It produces a slightly darker, lightly caramel-toned syrup that is a good everyday alternative to brown sugar without the intensity of demerara or muscovado." },
      { q: "Can I use honey instead of sugar in any syrup recipe?", a: "Yes, with a few adjustments. Honey is sweeter than sugar so you can use about 3/4 of the amount the recipe calls for. The most important thing is not to boil it - high heat destroys the complex flavour compounds that make honey interesting. Warm it gently over low to medium heat just until it dissolves into the water. Raw honey and wildflower honey produce the most interesting syrups. Acacia honey is mild and nearly flavourless if you want sweetness without honey character. Buckwheat honey is dark and earthy and pairs well with cold brew." },
      { q: "What is caster sugar and when should I use it for syrups?", a: "Caster sugar (also called superfine sugar) has smaller crystals than standard granulated sugar and dissolves faster, which means it reaches a smooth syrup stage more quickly. For hot syrups made on the stove there is no practical difference - both dissolve fully with heat. Caster sugar is more useful if you are making cold syrups or quick syrups that do not involve extended heating. Standard granulated sugar is perfectly fine for all the syrup recipes in this guide." },
      { q: "What is turbinado sugar and how does it compare to demerara?", a: "Turbinado is a raw cane sugar similar to demerara - both have large golden crystals with residual molasses and a mild caramel flavour. The difference is subtle: demerara tends to be slightly crunchier and more intensely flavoured, while turbinado is a touch lighter and milder. They are largely interchangeable in syrup recipes. Both dissolve well with heat and produce a warm, lightly caramel-toned syrup that works beautifully in cold brew, iced lattes, and any drink where you want more depth than plain white sugar provides without the full intensity of muscovado." },
      { q: "What is agave nectar and when should I use it in syrups?", a: "Agave nectar comes from the agave plant and has a neutral, clean sweetness that is slightly milder than honey and dissolves effortlessly in both hot and cold liquids without any heating required. This makes it ideal for quick cold syrups and drinks where you just want to add sweetness without cooking anything. It is about 1.5 times sweeter than sugar so use less - roughly 2/3 of the amount a recipe calls for. Light agave is nearly flavourless and works well in delicate syrups like lavender or vanilla where you do not want the sweetener to compete. Amber agave has more character and pairs better with caramel and spice-forward drinks." },
    ],
  },
  {
    category: "Bean Freshness and Roast Dates",
    icon: "◎",
    items: [
      { q: "How fresh should my coffee beans be?", a: "For the best cup, you want beans that were roasted within the last 2 to 4 weeks. Right after roasting, beans release a lot of CO2 which can actually interfere with extraction - this is why very freshly roasted beans (within 2 to 3 days) can produce uneven results. The sweet spot for most beans is 7 to 21 days post-roast, when the CO2 has settled but the complex volatile compounds that carry flavour and aroma are still intact. After about 4 to 6 weeks the beans start going noticeably stale. After 3 months they are significantly degraded." },
      { q: "What does a roast date on a bag mean?", a: "The roast date is the specific day the beans were roasted, printed by the roaster. It is the most useful piece of information on a coffee bag because it tells you exactly how fresh the coffee is. A best-before date tells you nothing about freshness - it only tells you the legal minimum shelf life, which is typically 12 to 24 months and is not a useful guide for specialty coffee. Always look for a roast date, not a best-before date. If a bag only has a best-before date with no roast date, that is usually a sign of lower-quality commodity coffee." },
      { q: "What is degassing and why does it matter?", a: "Degassing is the process by which freshly roasted coffee releases carbon dioxide that built up during roasting. The CO2 escapes from the bean gradually over the first week or two after roasting. During this period, if you try to brew, the escaping gas creates turbulence in the coffee bed that can push water away from the grounds and cause uneven extraction - this is called channelling. This is why very fresh beans (within 48 to 72 hours of roasting) can taste oddly bright, sharp, or uneven. Most specialty roasters recommend letting beans rest for at least 5 to 7 days before brewing, and up to 2 weeks for espresso which is particularly sensitive to CO2." },
      { q: "Why does my fresh bag of coffee have a one-way valve?", a: "That small valve on specialty coffee bags is a one-way degassing valve. It lets CO2 escape from the beans without letting oxygen in. Without it, the CO2 from freshly roasted beans would inflate and eventually burst the sealed bag. The valve is a good sign - it means the coffee was sealed while still fresh and actively degassing. Bags without valves are usually either pre-ground (which degasses much faster and does not need one) or filled with older coffee that has already finished degassing." },
      { q: "How should I store coffee to keep it fresh?", a: "Store whole beans in an airtight container away from light, heat, and moisture at room temperature. A ceramic or opaque container with a one-way valve or a tight-sealing lid is ideal. Do not store coffee in the fridge - the temperature fluctuations and moisture from condensation when you remove and replace the container cause faster staling, and coffee absorbs fridge odours through its porous surface. Freezing is acceptable for long-term storage only if you divide beans into single-use airtight portions and thaw them completely before opening - never refreeze. For beans you are actively using, room temperature in an airtight container is correct." },
      { q: "How can I tell if my beans are stale?", a: "The most reliable test is smell. Fresh beans smell intensely aromatic the moment you open the bag - complex, rich, and immediately identifiable as coffee. Stale beans smell flat, dull, cardboard-like, or faintly rancid. The second test is the bloom. When you pour hot water over fresh grounds during brewing, you should see an active bubble and rise as CO2 escapes. Stale beans barely react - the grounds just sit there. A flat, sluggish or non-existent bloom is a clear sign your beans are past their best. In the cup, stale coffee tastes flat, papery, and lifeless even when brewed correctly." },
      { q: "Does roast level affect how quickly beans go stale?", a: "Yes. Dark roasts go stale faster than light roasts. The roasting process breaks down the cellular structure of the bean, making it more porous and more vulnerable to oxidation. Dark roasted beans have been through more heat and structural breakdown, so they lose their volatile compounds more quickly after roasting. A dark roast may taste best within 1 to 2 weeks of roasting, while a light roast can remain vibrant for 3 to 4 weeks or longer. This is one reason specialty roasters tend to favour lighter roast levels - they preserve more of the original bean character and have longer peak freshness windows." },
      { q: "Does pre-ground coffee go stale faster than whole beans?", a: "Dramatically faster. Grinding dramatically increases the surface area of the coffee exposed to oxygen - a typical grind produces hundreds of small particles where previously there was one whole bean. This accelerates oxidation and CO2 release to the point where pre-ground coffee starts going noticeably stale within 15 to 30 minutes of grinding. Pre-ground coffee in a sealed bag is already significantly stale by the time you buy it, even if the bag is sealed. Grinding fresh immediately before brewing is one of the highest-impact changes you can make to coffee quality." },
    ],
  },
  {
    category: "Cold Brew",
    icon: "❄",
    items: [
      { q: "What is cold brew and how is it different from iced coffee?", a: "Cold brew is made by steeping coarsely ground coffee in cold or room temperature water for 12 to 24 hours. Iced coffee is simply hot brewed coffee poured over ice. The difference in the cup is significant. Cold brew produces a smoother, lower-acid, naturally sweeter concentrate because the slow cold extraction pulls different compounds than hot water does. It never goes through the volatile flash-cooling that can make iced coffee taste sharp or bitter. Cold brew is generally more forgiving to make and keeps well in the fridge for up to 2 weeks." },
      { q: "What ratio should I use for cold brew?", a: "For a concentrate (which you dilute before drinking), use a 1:4 to 1:5 ratio of coffee to water by weight - 100g of coffee to 400 to 500ml of water. This produces a strong concentrate you dilute with milk or water 1:1 when serving. For a ready-to-drink cold brew you can pour straight over ice, use a 1:8 ratio. The Brew Calculator has a cold brew setting that adjusts these ratios automatically. Starting with a concentrate gives you more flexibility since you can adjust strength when serving." },
      { q: "How long should I steep cold brew?", a: "The standard range is 12 to 24 hours. 12 to 14 hours produces a lighter, brighter result. 18 to 20 hours is the sweet spot for most people - full extraction, smooth, and sweet. 24 hours produces a bolder, heavier concentrate. Steeping longer than 24 hours can lead to over-extraction with bitter or astringent notes, though this depends on grind size. Cold brew is forgiving - an extra hour or two rarely ruins it. Stir or swirl the container once or twice during the steep if you can." },
      { q: "What grind size is best for cold brew?", a: "Extra coarse - the coarsest setting on most grinders, similar to cracked peppercorns or very coarse sea salt. The long steep time compensates for the open grind and extracts fully over 12 to 24 hours. Using a finer grind with the same steep time will over-extract and produce a bitter, astringent result. If your cold brew tastes bitter, grind coarser before adjusting anything else. The Interactive Grind Guide in the Guide tab shows what extra coarse should look like." },
      { q: "What equipment do I need to make cold brew at home?", a: "The minimum is a large jar or container, coarse ground coffee, and cold water. You can steep directly in a mason jar and strain through a paper coffee filter, a fine mesh strainer, or a nut milk bag when done. Dedicated cold brew makers like the Toddy or OXO Cold Brew Maker have built-in filters that make straining cleaner and easier, but they are not necessary. A French Press works very well - steep in the press, then plunge and pour. Whatever method you use, double-straining through a paper filter after the initial strain produces the cleanest, most sediment-free result." },
      { q: "How long does cold brew keep in the fridge?", a: "Cold brew concentrate keeps well in the fridge for up to 2 weeks in a sealed container. Ready-to-drink cold brew (already diluted) is best within 5 to 7 days. The long shelf life compared to hot coffee is because the cold extraction process produces fewer of the compounds that go rancid quickly, and the lack of heat means the coffee never goes through the oxidation that happens when hot coffee cools. If your cold brew starts tasting flat or sour before the 2 weeks are up, it usually means the beans were stale to begin with." },
      { q: "Can I use any coffee for cold brew?", a: "Yes, but some work better than others. Medium to dark roast beans tend to produce the most crowd-pleasing cold brew - smooth, chocolatey, and sweet with low perceived acidity. Light roasts can produce interesting cold brew with more fruity and floral notes, but the result is more divisive and can taste thin or overly acidic to some palates. Natural process beans (dried with the fruit on) often produce particularly sweet and complex cold brew. Avoid very old or stale beans - cold brew amplifies staleness and produces a flat, hollow-tasting result." },
      { q: "What is cold brew concentrate and how do I use it?", a: "Cold brew concentrate is cold brew made at a high coffee-to-water ratio (typically 1:4 or 1:5) that is too strong to drink straight. You dilute it before serving, typically 1:1 with water or milk. The advantage of making a concentrate is flexibility - you can adjust strength when serving and it keeps just as well as regular cold brew. To serve: add ice to a glass, pour equal parts concentrate and your liquid of choice (water, oat milk, regular milk), stir, and add any syrups. Barista oat milk poured directly over cold brew concentrate with no dilution water is a popular approach that produces a very creamy result." },
    ],
  },
  {
    category: "AeroPress",
    icon: "⊟",
    items: [
      { q: "What is an AeroPress and why do people love it?", a: "The AeroPress is a manual brewing device that uses air pressure to push hot water through coffee grounds, producing a concentrated, smooth, low-acid cup in about 1 to 2 minutes. It was invented in 2005 by Alan Adler. People love it because it is extremely forgiving - small changes in technique do not ruin the cup the way they can with pour over. It is also fast, inexpensive, easy to clean, nearly unbreakable, and portable. There is an annual World AeroPress Championship where competitors share thousands of creative recipes, which speaks to how much room it has for experimentation." },
      { q: "What grind size should I use for AeroPress?", a: "Medium-fine is the standard starting point - finer than a pour over grind but coarser than espresso. The beauty of AeroPress is that it is very tolerant of grind variation. You can go coarser and brew for longer, or finer and push through faster, and both can produce excellent results. If your cup tastes bitter, grind coarser or reduce brew time. If it tastes weak or sour, grind finer or add more coffee. The AeroPress rewards experimentation in a way that more precise methods like espresso do not." },
      { q: "What is the inverted AeroPress method?", a: "The inverted method involves flipping the AeroPress upside down during brewing so the plunger end is at the bottom. This prevents water from dripping through the filter before you are ready to press, giving you more control over steep time and producing a slightly heavier bodied cup. You add water, stir, steep, attach the filter cap, flip over onto your cup, and press. It is a popular technique and worth trying once you are comfortable with the standard method. The main risk is spillage during the flip, which is easy to avoid with a confident motion." },
      { q: "What water temperature should I use for AeroPress?", a: "Most AeroPress enthusiasts use cooler water than other brew methods - around 80 to 85 degrees Celsius (175 to 185 Fahrenheit). The lower temperature extracts differently than boiling water, producing a smoother and less bitter cup that many people prefer. James Hoffmann and other specialty coffee figures have written extensively about this. That said, the AeroPress works across a wide range of temperatures. If you prefer a brighter, more acidic cup, try 90 to 93 degrees. If you want smooth and round, go cooler. The Brew Calculator shows the recommended range." },
      { q: "How much coffee should I use in an AeroPress?", a: "A standard AeroPress recipe uses 15 to 18 grams of coffee to 200 to 250ml of water, producing a full cup. For a more concentrated espresso-style shot, use 18 to 20 grams with only 40 to 60ml of water and dilute with hot water or milk afterward. The AeroPress is flexible enough to brew anything from a light filter-style cup to a thick concentrate depending on your ratio and technique. The Brew Calculator covers the standard ratio and lets you scale up or down." },
      { q: "How do I clean an AeroPress?", a: "AeroPress is one of the easiest brewing devices to clean. After pressing, simply push the plunger all the way through to eject the coffee puck and paper filter directly into the bin. The puck comes out in a neat disc. Rinse the chamber and plunger under running water. That is all that is required after daily use. For a deeper clean, wash with mild dish soap once a week. The AeroPress is dishwasher safe on the top rack if you prefer. No oils accumulate the way they do in a French Press, which makes it one of the most low-maintenance brewing devices available." },
    ],
  },
  {
    category: "Cleaning and Maintenance",
    icon: "◈",
    items: [
      { q: "How often should I clean my coffee grinder?", a: "For daily home use, a quick brush-out of the burrs and chute after every use keeps grounds from accumulating and going rancid. A deeper clean every 2 to 4 weeks involves removing the top burr (on most grinders this requires no tools) and brushing out all the coffee residue and oils with a stiff brush. Grinder cleaning tablets (like Grindz) can be run through periodically to absorb oils and dislodge stubborn residue. Rancid old grounds left in the grinder are one of the most common causes of mysteriously bad-tasting coffee." },
      { q: "How do I clean a French Press?", a: "After brewing, add a small amount of cold water to the press and swirl to loosen the grounds, then pour the slurry directly into the bin rather than the sink (grounds clog drains over time). Disassemble the plunger - unscrew the mesh screens and plates, wash each piece with dish soap, and rinse thoroughly. Oils from coffee accumulate in the mesh and on the glass if not cleaned regularly, producing a rancid flavour that ruins fresh coffee. A thorough disassembly and wash once a week is sufficient for daily use. The glass carafe can go in the dishwasher." },
      { q: "How do I descale an espresso machine?", a: "Descaling removes limescale deposits that build up from mineral content in water and block the internal workings of the machine over time. Most home espresso machines have a descaling cycle in their settings or manual. Use a purpose-made descaling solution (citric acid or Cafiza-style products) diluted in water according to the manufacturer's instructions. Run the descaling cycle, then run at least 2 full cycles of clean water through the machine afterward to flush all residue. For most home machines with average-hardness water, descale every 2 to 3 months. If you use very hard water, descale monthly." },
      { q: "How do I backflush an espresso machine?", a: "Backflushing cleans the group head and shower screen by forcing soapy water back through the system in reverse. It requires a blind basket (a basket with no holes) inserted into the portafilter. Add a small amount of espresso cleaning powder (Cafiza or similar), run the machine in short cycles as per the manufacturer's guide, then repeat with clean water to rinse. Not all home machines support backflushing - check your manual. Machines with a three-way solenoid valve (most prosumer machines) benefit most from regular backflushing. Do this weekly for machines used daily." },
      { q: "How do I clean a pour over dripper or Chemex?", a: "Rinse immediately after use with hot water - most residue washes away before it sets. For a deeper clean, wash with mild dish soap and a soft brush or sponge. Do not use abrasive scrubbers on glass drippers. Chemex recommends against soap for the glass carafe, preferring a rinse and occasional clean with ice, salt, and lemon juice to remove staining without chemicals. The wooden collar on a Chemex should not be submerged - wipe it clean with a damp cloth. Most ceramic drippers are dishwasher safe. For metal mesh filters, soak in hot water and scrub gently to remove built-up oils." },
      { q: "How do I clean an AeroPress?", a: "After pressing, push the plunger all the way through to eject the coffee puck and paper filter into the bin in one clean disc. Rinse the chamber and plunger under running water. Wash with mild dish soap once a week. The AeroPress is dishwasher safe on the top rack. No deep cleaning or disassembly is needed for regular use - it is one of the most maintenance-free brewing devices available." },
      { q: "How do I keep my portafilter basket clean?", a: "After every shot, knock out the puck and rinse the basket under hot running water immediately - espresso oils set quickly and become harder to remove. Once a week, soak the basket in a solution of hot water and espresso cleaning powder (Cafiza or similar) for 20 to 30 minutes, then scrub with a small brush. The tiny holes in the basket can clog with compacted coffee oils over time, which affects flow rate and shot consistency. A clean, well-maintained basket is one of the most underrated factors in consistent espresso quality." },
    ],
  },
  {
    category: "Buying Coffee Beans",
    icon: "★",
    items: [
      { q: "What should I look for when buying specialty coffee beans?", a: "The most important thing on the bag is a roast date within the last 2 to 4 weeks. After that, look for origin information - country, region, and ideally the specific farm or cooperative. Processing method (washed, natural, honey) tells you a lot about what to expect in the cup. A tasting notes section written by the roaster gives you a rough flavour preview, though these are aspirational guides rather than guarantees. Avoid bags that only show a best-before date with no roast date, or generic descriptors like smooth or bold with no origin information." },
      { q: "What is the difference between single origin and blend for a beginner?", a: "For a beginner exploring what coffee can taste like, single origin beans are more educational - each one tastes distinctly different and helps you understand how origin, processing, and roast level affect flavour. Ethiopian coffees, Colombian coffees, and Guatemalan coffees all taste noticeably different from each other. A blend combines beans from multiple origins for consistency and balance. Blends are often designed to taste good across multiple brew methods and milk ratios, making them reliable everyday coffees. Neither is better - start with single origins to explore, use blends when you want reliability." },
      { q: "Where should I buy specialty coffee beans?", a: "Direct from specialty roasters is almost always the best option - the coffee is freshest, the roast dates are clear, and you are supporting independent businesses. Many excellent roasters ship directly and include roast date information on every bag. Local specialty coffee shops often sell retail bags of the beans they use in their drinks. Subscription services from roasters like Trade, Onyx, or Counter Culture deliver rotating fresh roasts to your door. Avoid supermarket coffee unless it clearly shows a recent roast date - most supermarket coffee is roasted months before it reaches the shelf." },
      { q: "What does fair trade and direct trade mean on a coffee bag?", a: "Fair trade is a certification that guarantees farmers received a minimum price per pound of coffee above commodity market rates, along with community development premiums. It is administered by third-party certifying organisations. Direct trade is an informal term used by roasters who purchase beans directly from farms or cooperatives without an intermediary, often at prices above fair trade minimums and with ongoing relationships with farmers. Direct trade is not certified by any third party - it relies on the roaster's transparency. Both aim to improve farmer livelihoods, but direct trade relationships can be more flexible and sometimes result in higher quality and higher prices for producers." },
      { q: "What does organic mean on a coffee bag?", a: "Certified organic coffee is grown without synthetic pesticides or fertilisers and is certified by an accredited third-party organisation. It does not inherently mean better quality - some of the world's best specialty coffees are not certified organic because certification is expensive and many small farms cannot afford it, even if their practices are effectively organic. Buy organic if it matters to you, but do not use it as a proxy for quality. A clear roast date and good origin information are more reliable quality signals." },
      { q: "What roast level should a beginner start with?", a: "Medium roast is the most accessible starting point - it has enough sweetness and body to be satisfying without the sharp acidity of light roasts or the heavy bitterness of dark roasts. Colombian and Brazilian single origins at medium roast are particularly approachable. Once you are comfortable there, try a light roast from Ethiopia or Kenya to experience how dramatically different specialty coffee can taste. Dark roast is a personal preference - many people love it, but it tells you less about the underlying bean quality and origin character than lighter roasts do." },
      { q: "How much should I expect to pay for good specialty coffee?", a: "Quality specialty coffee typically costs between 15 and 30 dollars per 250g bag, with exceptional microlot or competition-grade coffees going higher. Below that range you are likely getting commodity-grade coffee regardless of what the packaging says. The premium price reflects better farming practices, more careful processing, smaller batch roasting, and fresher delivery. The cost per cup when brewed at home is still significantly lower than buying the same quality from a coffee shop. If a bag claims to be specialty and costs significantly less than 12 to 15 dollars per 250g, look at the roast date and origin information carefully." },
      { q: "What is a microlot coffee?", a: "A microlot is a small, separately harvested and processed batch of coffee from a specific section of a farm, a single picking date, or a particular experimental processing method. Because of the small quantity and careful handling, microlots often showcase unusually distinctive or high-scoring flavours. They are typically more expensive than standard single origin coffees from the same farm. When a roaster labels something a microlot, they are usually signalling something worth paying attention to - a unique variety, an experimental natural process, or an exceptional harvest from a particularly high-altitude plot." },
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

function SweetenerGuide() {
  const [active, setActive] = useState(null);

  const SWEETENERS = [
    {
      name: "White Sugar",
      icon: "○",
      color: "#e8e0d0",
      sub: "Clean and neutral",
      sweetness: 5,
      flavour: 1,
      dissolvesHot: 5,
      dissolvesCold: 4,
      tags: ["Neutral", "Versatile", "Affordable"],
      desc: "The baseline sweetener. White granulated sugar dissolves cleanly in hot drinks and produces a simple syrup with no competing flavour. Because it has no character of its own, it lets delicate flavours like lavender, vanilla, or floral coffees come through without interference. Use it when you want pure sweetness and nothing else.",
      bestFor: ["Simple syrups", "Delicate floral or fruit-forward coffees", "Any drink where you want sweetness without flavour"],
      tip: "For cold drinks, make a simple syrup first (equal parts sugar and hot water, stir to dissolve) - granulated sugar does not dissolve well in cold liquids.",
    },
    {
      name: "Light Brown Sugar",
      icon: "◑",
      color: "#c8a96e",
      sub: "Mild caramel warmth",
      sweetness: 5,
      flavour: 3,
      dissolvesHot: 5,
      dissolvesCold: 3,
      tags: ["Caramel", "Mild", "Warm"],
      desc: "Light brown sugar is white sugar with a small amount of molasses added back, giving it a subtle caramel and toffee edge. It pairs naturally with espresso drinks, oat milk lattes, and cinnamon. The flavour is present but not dominant - it rounds out a drink rather than defining it.",
      bestFor: ["Lattes and cappuccinos", "Oat milk espresso drinks", "Brown sugar syrup", "Anything with cinnamon"],
      tip: "The classic brown sugar cinnamon syrup uses light brown sugar - it hits that sweet spot between flavour and subtlety that works in almost any espresso drink.",
    },
    {
      name: "Dark Brown Sugar",
      icon: "◕",
      color: "#9c6e3a",
      sub: "Intense molasses depth",
      sweetness: 5,
      flavour: 4,
      dissolvesHot: 5,
      dissolvesCold: 3,
      tags: ["Bold", "Molasses", "Dark roast"],
      desc: "Dark brown sugar has significantly more molasses than light brown, producing a richer, more intense flavour - think toffee, dark rum, and treacle. It pairs especially well with dark roast espresso and cold brew where you want the sweetener to hold its own against the coffee. Too much can overpower lighter roasts.",
      bestFor: ["Cold brew concentrate", "Dark roast espresso", "Mochas", "Rich winter drinks"],
      tip: "Use dark brown sugar when you want the sweetener to be part of the flavour profile, not just background sweetness. Start with less than you think you need.",
    },
    {
      name: "Demerara",
      icon: "◈",
      color: "#b8883a",
      sub: "Toffee and crunch",
      sweetness: 4,
      flavour: 4,
      dissolvesHot: 4,
      dissolvesCold: 2,
      tags: ["Toffee", "Butterscotch", "Raw cane"],
      desc: "Demerara is a minimally refined raw cane sugar with large golden crystals and a distinct toffee and butterscotch flavour from residual molasses. It dissolves more slowly than refined sugars but the flavour complexity is worth it. It makes a superb syrup and is excellent stirred directly into a hot flat white or cortado.",
      bestFor: ["Flat whites and cortados", "Cold brew syrups", "Dark espresso drinks", "Whisky-inspired coffee"],
      tip: "Demerara stirred into a hot espresso drink without making a syrup first is a classic approach - the crystals dissolve slowly and create a slightly different texture than pre-dissolved syrup.",
    },
    {
      name: "Turbinado",
      icon: "◎",
      color: "#c49a4a",
      sub: "Lighter raw cane",
      sweetness: 4,
      flavour: 3,
      dissolvesHot: 4,
      dissolvesCold: 2,
      tags: ["Raw cane", "Mild caramel", "Versatile"],
      desc: "Turbinado is very similar to demerara - raw cane sugar with large crystals and mild molasses character - but slightly lighter and less intense. The two are largely interchangeable. Turbinado is a good middle ground if demerara feels too bold but plain brown sugar feels too subtle. It works in both syrups and direct stirring.",
      bestFor: ["Syrups for lattes", "Iced espresso drinks", "Everyday sweetening"],
      tip: "Turbinado is what most coffee shops use in their raw sugar packets. If a coffee shop drink tastes more interesting than when you make it at home with white sugar, turbinado is often why.",
    },
    {
      name: "Muscovado",
      icon: "●",
      color: "#6b3f1a",
      sub: "Bold and treacly",
      sweetness: 4,
      flavour: 5,
      dissolvesHot: 4,
      dissolvesCold: 1,
      tags: ["Intense", "Molasses", "Dark rum"],
      desc: "Muscovado is an unrefined cane sugar with extremely high molasses content. It is dark, almost sticky, and has a powerful flavour profile - dark rum, black treacle, tobacco, and deep caramel. A small amount has a huge impact. It makes the most intensely flavoured brown sugar syrup possible and pairs best with dark roast espresso, cold brew, and chocolate drinks.",
      bestFor: ["Intense cold brew syrups", "Mochas", "Dark roast espresso", "Rum-inspired coffee drinks"],
      tip: "Use muscovado sparingly until you know your threshold. It is 3 to 4 times more flavourful than regular brown sugar and can easily overwhelm a drink.",
    },
    {
      name: "Coconut Sugar",
      icon: "◆",
      color: "#a07040",
      sub: "Mild caramel, no coconut",
      sweetness: 4,
      flavour: 3,
      dissolvesHot: 4,
      dissolvesCold: 2,
      tags: ["Lower GI", "Caramel", "No coconut taste"],
      desc: "Coconut sugar is made from the sap of coconut palm flowers, not the coconut fruit - it does not taste like coconut. The flavour is a mild, slightly earthy caramel similar to light brown sugar but more subtle. It has a lower glycaemic index than white or brown sugar. It works as a 1:1 substitute for brown sugar in any syrup recipe and produces a slightly darker, lightly caramel-toned result.",
      bestFor: ["Brown sugar syrup substitute", "Everyday lattes", "Anyone avoiding refined sugar"],
      tip: "Coconut sugar dissolves slightly more slowly than refined sugar. Give it an extra minute of stirring when making a syrup.",
    },
    {
      name: "Honey",
      icon: "⬡",
      color: "#d4a520",
      sub: "Floral and complex",
      sweetness: 6,
      flavour: 4,
      dissolvesHot: 5,
      dissolvesCold: 4,
      tags: ["Floral", "Natural", "Sweeter than sugar"],
      desc: "Honey is about 1.5 times sweeter than sugar and brings a distinct floral, slightly fruity character that varies enormously by variety. Raw wildflower honey is the most complex. Acacia is mild and almost neutral. Buckwheat is dark and earthy. The key rule is never boil honey - high heat destroys the volatile flavour compounds. Add it to warm (not boiling) drinks or use it in syrups made at low heat.",
      bestFor: ["Honey lattes", "Chamomile and tea lattes", "Lavender honey syrups", "Golden milk drinks"],
      tip: "Use about 2/3 of the amount a recipe calls for in sugar - honey is significantly sweeter. And always add it after the heat is off or turned to low.",
    },
    {
      name: "Maple Syrup",
      icon: "⬢",
      color: "#b85c1a",
      sub: "Warm and earthy",
      sweetness: 5,
      flavour: 5,
      dissolvesHot: 5,
      dissolvesCold: 5,
      tags: ["Earthy", "Warm", "No dissolving needed"],
      desc: "Real maple syrup dissolves instantly in both hot and cold liquids, making it one of the most convenient liquid sweeteners. Grade A dark or amber maple has the most pronounced flavour - warm, earthy, slightly woody. It pairs unexpectedly well with cold brew and medium roast espresso. Use it directly in drinks or combine with brown sugar and water to make a brown sugar maple syrup.",
      bestFor: ["Cold brew", "Iced lattes", "Brown sugar maple syrup", "Oat milk flat whites"],
      tip: "Always buy pure maple syrup, not pancake syrup - pancake syrup is corn syrup with artificial maple flavouring and tastes nothing like the real thing in coffee.",
    },
    {
      name: "Agave Nectar",
      icon: "◇",
      color: "#c8b860",
      sub: "Neutral and cold-friendly",
      sweetness: 6,
      flavour: 2,
      dissolvesHot: 5,
      dissolvesCold: 5,
      tags: ["Cold drinks", "Neutral", "No heating needed"],
      desc: "Agave nectar is about 1.5 times sweeter than sugar and dissolves effortlessly in cold liquids without any heating - making it uniquely convenient for iced drinks and cold brew. Light agave is nearly flavourless. Amber agave has a mild caramel character. Because it does not need cooking, it is the most practical sweetener for cold drinks if you do not want to make a syrup first.",
      bestFor: ["Iced lattes", "Cold brew", "Quick cold drinks", "Delicate flavour syrups"],
      tip: "Use about 2/3 of the amount a recipe calls for in sugar. Start with less - agave is easy to overdo and difficult to balance once the drink is sweet.",
    },
  ];

  const barStyle = (val, max = 6, color) => ({
    height: 6,
    borderRadius: 3,
    background: `linear-gradient(to right, ${color} ${(val/max)*100}%, var(--bg3) ${(val/max)*100}%)`,
    marginTop: 4,
    border: "1px solid var(--border)",
  });

  return (
    <div>
      <p className="guide-grind-intro">Tap any sweetener to learn when and why to use it in coffee drinks and syrups.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {SWEETENERS.map(s => (
          <button key={s.name} onClick={() => setActive(active?.name === s.name ? null : s)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
              background: active?.name === s.name ? s.color + "22" : "var(--bg3)",
              border: `1px solid ${active?.name === s.name ? s.color : "var(--border)"}`,
              color: active?.name === s.name ? s.color : "var(--muted2)",
              cursor: "pointer", transition: "all 0.15s", fontFamily: "'Jost',sans-serif", fontSize: 13 }}>
            <span style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
            {s.name}
          </button>
        ))}
      </div>

      {active && (
        <div style={{ border: `1px solid ${active.color}44`, padding: 24, background: active.color + "0a" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: active.color }}>{active.name}</span>
            <span style={{ fontSize: 12, color: "var(--muted3)", fontStyle: "italic" }}>{active.sub}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {active.tags.map(t => (
              <span key={t} style={{ fontSize: 10, padding: "2px 8px", border: `1px solid ${active.color}55`, color: active.color, background: active.color + "12", letterSpacing: 0.5 }}>{t}</span>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Sweetness", val: active.sweetness },
              { label: "Flavour Character", val: active.flavour },
              { label: "Dissolves Hot", val: active.dissolvesHot },
              { label: "Dissolves Cold", val: active.dissolvesCold },
            ].map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
                <div style={barStyle(val, 6, active.color)} />
                <div style={{ fontSize: 10, color: "var(--muted3)", marginTop: 2 }}>{val}/6</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7, marginBottom: 16 }}>{active.desc}</div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: active.color, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Best For</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {active.bestFor.map(b => (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted2)" }}>
                  <span style={{ color: active.color, fontSize: 10 }}>◆</span> {b}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", padding: "12px 16px" }}>
            <div style={{ fontSize: 10, color: active.color, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Tip</div>
            <div style={{ fontSize: 13, color: "var(--muted2)", lineHeight: 1.6 }}>{active.tip}</div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [activeTopic, setActiveTopic] = useState(null);

  const TOPICS = [
    { id: "grind",    icon: "◎", label: "Grind Sizes",    sub: "How coarse or fine to grind for each method" },
    { id: "roast",    icon: "◑", label: "Roast Levels",   sub: "What roast level means for flavour" },
    { id: "milk",     icon: "◉", label: "Milk & Drinks",  sub: "Steaming, ratios, and drink types" },
    { id: "sweetener",icon: "◆", label: "Sweeteners",     sub: "Which sugar or syrup works best" },
    { id: "origins",  icon: "★", label: "Coffee Origins", sub: "Where beans come from and what to expect" },
  ];

  const renderContent = () => {
    switch (activeTopic) {
      case "grind":
        return (
          <>
            <p className="guide-grind-intro">Tap any grind size to learn when and why to use it.</p>
            <div className="faq-grind-track">
              {GRIND_GUIDE.map((g) => (
                <button key={g.size} className={`faq-grind-btn ${activeGrind?.size === g.size ? "active" : ""}`}
                  style={{ "--gc": g.color }} onClick={() => setActiveGrind(activeGrind?.size === g.size ? null : g)}>
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
          </>
        );
      case "roast":     return <RoastGuide />;
      case "milk":      return <MilkGuide />;
      case "sweetener": return <SweetenerGuide />;
      case "origins":   return <OriginsGuide />;
      default:          return null;
    }
  };

  const currentTopic = TOPICS.find(t => t.id === activeTopic);

  return (
    <div className="page guide-page">
      {!activeTopic ? (
        <>
          <div className="guide-header">
            <div className="guide-title">Coffee Guide</div>
            <div className="guide-subtitle">What do you want to know about?</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TOPICS.map(({ id, icon, label, sub }) => (
              <button key={id} onClick={() => setActiveTopic(id)}
                style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 20px",
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  color: "var(--text)", cursor: "pointer", textAlign: "left",
                  fontFamily: "'Jost',sans-serif", transition: "all 0.15s", width: "100%" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>
                <span style={{ fontSize: 26, color: "var(--gold)", flexShrink: 0, width: 36, textAlign: "center" }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted3)" }}>{sub}</div>
                </div>
                <span style={{ color: "var(--muted3)", fontSize: 16 }}>→</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button onClick={() => { setActiveTopic(null); setActiveGrind(null); }}
              className="btn-ghost" style={{ fontSize: 11, padding: "6px 14px", flexShrink: 0 }}>
              ← Back
            </button>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--text)", lineHeight: 1 }}>
                {currentTopic?.icon} {currentTopic?.label}
              </div>
            </div>
          </div>
          {renderContent()}
        </>
      )}
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

  // Track which categories are collapsed - default all collapsed
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

const EXAMPLE_RECIPE = {
  id: "example-recipe-1",
  name: "French Vanilla Whole Milk Latte",
  drinkType: "Latte",
  temp: "Hot",
  espressoShots: 3,
  baseNotes: "Southern Weather by Onyx Coffee Lab - Ethiopia Yirgacheffe, Light Roast",
  milkType: "Whole Milk",
  milkAmount: "6",
  syrup: "Monin French Vanilla",
  syrupAmount: "2 pumps",
  extras: "",
  steps: "1. Pull three shots of espresso into a warm cup.\n2. Steam whole milk to about 60-65°C with a fine, silky microfoam.\n3. Add two pumps of Monin French Vanilla syrup to the espresso.\n4. Pour steamed milk over the espresso and syrup, holding back the foam.\n5. Spoon a thin layer of foam on top to finish.",
  notes: "The light roast on the Southern Weather works beautifully here - the fruity brightness cuts through the richness of the whole milk and the vanilla rounds everything out without overpowering the bean. Three shots keeps it balanced at 6oz of milk.",
  flavorText: "Rich and creamy with a sweet vanilla warmth, the fruity brightness of the espresso comes through on the finish.",
  flavorData: {
    summary: "A rich and creamy latte with sweet vanilla warmth, whole milk softness, and the fruity brightness of a light roast peeking through on the finish.",
    mappings: [
      { path: ["Sweet", "Vanilla", "French Vanilla"], weight: 3 },
      { path: ["Sweet", "Caramel", "Brown Sugar"], weight: 2 },
      { path: ["Fruity", "Berry", "Blackberry"], weight: 2 },
      { path: ["Fruity", "Citrus", "Orange"], weight: 1 },
      { path: ["Nutty", "Creamy", "Milk Chocolate"], weight: 2 },
      { path: ["Floral", "Jasmine"], weight: 1 },
    ],
  },
  rating: 9,
  visibility: "private",
  image_url: null,
  isExample: true,
  createdAt: new Date(Date.now() - 86400000).toISOString(),
};

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
  flavorText: "",
  flavorData: null,
  rating: 0,
  visibility: "private",
  image_url: null,
  createdAt: new Date().toISOString(),
});

function RecipesPage({ showToast, session, onNeedAuth, addTrigger, onViewChange, shareTrigger }) {
  const [recipes, setRecipes] = useState([]);
  const [view, setView] = useState("list");
  const [active, setActive] = useState(null);
  const changeView = (v, recipe) => { setView(v); onViewChange?.(v, recipe); };
  const [form, setForm] = useState(emptyRecipe());
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showSendToFriend, setShowSendToFriend] = useState(false);
  const [showExportCard, setShowExportCard] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzingFlavor, setAnalyzingFlavor] = useState(false);
  const [useMetric, setUseMetric] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterTemp, setFilterTemp] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [showFilters, setShowFilters] = useState(false);

  const RECIPE_SORT_OPTIONS = [
    { value: "date",   label: "Date saved" },
    { value: "rating", label: "Rating (highest)" },
    { value: "alpha",  label: "Alphabetical" },
  ];

  const DRINK_TYPES = ["Latte", "Cappuccino", "Flat White", "Americano", "Cold Brew", "Iced Latte", "Espresso", "Macchiato", "Mocha", "Other"];
  const TEMP_OPTIONS = ["Hot", "Iced", "Blended"];

  const filteredRecipes = recipes
    .filter(r => {
      if (search) {
        const q = search.toLowerCase();
        if (!(r.name?.toLowerCase().includes(q) || r.drinkType?.toLowerCase().includes(q) || r.syrup?.toLowerCase().includes(q) || r.milkType?.toLowerCase().includes(q))) return false;
      }
      if (filterType && r.drinkType !== filterType) return false;
      if (filterTemp && r.temp !== filterTemp) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "alpha") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

  const activeFilters = [filterType, filterTemp].filter(Boolean).length;

  const formatMilk = (amount, metric) => {
    if (!amount) return "";
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    if (metric) return `${Math.round(num * 29.5735)}ml`;
    return `${num}oz`;
  };

  // Build a flavor description from recipe ingredients
  const buildIngredientDesc = (recipe) => {
    const parts = [];
    if (recipe.drinkType) parts.push(recipe.drinkType);
    if (recipe.temp === "Iced") parts.push("iced");
    if (recipe.milkType && recipe.milkType !== "None") parts.push(recipe.milkType);
    if (recipe.syrup) parts.push(`${recipe.syrup} syrup`);
    if (recipe.extras) parts.push(recipe.extras);
    if (recipe.flavorText) parts.push(recipe.flavorText);
    return parts.join(", ");
  };

  const generateFlavorWheel = async (recipe) => {
    const desc = buildIngredientDesc(recipe);
    if (!desc || desc.length < 5) return null;
    try {
      const result = await mapFlavorsWithAI(desc);
      return result;
    } catch { return null; }
  };

  const handlePreviewFlavor = async () => {
    setAnalyzingFlavor(true);
    const result = await generateFlavorWheel(form);
    if (result) setForm(prev => ({ ...prev, flavorData: result }));
    setAnalyzingFlavor(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${session.user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("recipe-images").upload(path, file);
    if (uploadErr) { setError("Image upload failed - try again."); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("recipe-images").getPublicUrl(path);
    setForm(prev => ({ ...prev, image_url: publicUrl }));
    setUploading(false);
  };

  const recipeToRow = (recipe, userId) => ({
    user_id: userId,
    local_id: String(recipe.id),
    name: recipe.name || null,
    type: recipe.drinkType || null,
    shots: recipe.espressoShots || null,
    milk: recipe.milkType || null,
    milk_oz: recipe.milkAmount || null,
    temp: recipe.temp || null,
    syrup: recipe.syrup ? `${recipe.syrup}${recipe.syrupAmount ? ' ' + recipe.syrupAmount : ''}` : null,
    extras: recipe.extras || null,
    steps: recipe.steps || null,
    rating: recipe.rating || 0,
    notes: recipe.notes || null,
    flavor_text: recipe.flavorText || null,
    flavor_data: recipe.flavorData || null,
    visibility: recipe.visibility || "private",
    image_url: recipe.image_url || null,
    created_at: recipe.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const rowToRecipe = (row) => ({
    id: row.local_id || row.id,
    supabase_id: row.id,
    name: row.name || "",
    drinkType: row.type || "Latte",
    espressoShots: row.shots || 2,
    milkType: row.milk || "Oat Milk",
    milkAmount: row.milk_oz || "",
    temp: row.temp || "Hot",
    syrup: row.syrup || "",
    syrupAmount: "",
    extras: row.extras || "",
    steps: row.steps || "",
    rating: row.rating || 0,
    notes: row.notes || "",
    flavorText: row.flavor_text || "",
    flavorData: row.flavor_data || null,
    visibility: row.visibility || "private",
    image_url: row.image_url || null,
    createdAt: row.created_at,
  });

  useEffect(() => {
    const loadRecipes = async () => {
      if (session) {
        setSyncing(true);
        const { data: rows } = await supabase.from("recipes").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });

        if (rows && rows.length > 0) {
          setRecipes(rows.map(rowToRecipe));
          localStorage.removeItem(RECIPES_STORAGE_KEY);
        } else {
          // Check for local recipes to migrate
          const localStr = localStorage.getItem(RECIPES_STORAGE_KEY);
          const localRecipes = localStr ? JSON.parse(localStr).filter(r => !r.isExample) : [];
          if (localRecipes.length > 0) {
            showToast?.("Syncing your recipes to the cloud...");
            const { data: migrated } = await supabase.from("recipes").insert(localRecipes.map(r => recipeToRow(r, session.user.id))).select();
            if (migrated) {
              setRecipes([EXAMPLE_RECIPE, ...migrated.map(rowToRecipe)]);
              localStorage.removeItem(RECIPES_STORAGE_KEY);
              showToast?.("Recipes synced to your account!");
            }
          } else {
            setRecipes([EXAMPLE_RECIPE]);
          }
        }
        setSyncing(false);
      } else {
        try {
          const s = localStorage.getItem(RECIPES_STORAGE_KEY);
          const local = s ? JSON.parse(s).filter(r => !r.isExample) : [];
          setRecipes([EXAMPLE_RECIPE, ...local]);
        } catch { setRecipes([EXAMPLE_RECIPE]); }
      }
    };
    loadRecipes();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session) {
      localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
    }
  }, [recipes, session]);

  const saveRecipe = async () => {
    if (!form.name.trim()) { setError("Give your recipe a name."); return; }
    setError("");
    const isNew = !recipes.find(r => r.id === form.id);

    // Auto-generate flavor wheel if not already present
    let flavorData = form.flavorData;
    if (!flavorData) {
      setAnalyzingFlavor(true);
      flavorData = await generateFlavorWheel(form);
      setAnalyzingFlavor(false);
    }

    const recipe = { ...form, flavorData, id: form.id || Date.now(), createdAt: form.createdAt || new Date().toISOString() };

    if (session) {
      if (recipe.supabase_id) {
        // Update existing
        await supabase.from("recipes").update(recipeToRow(recipe, session.user.id)).eq("id", recipe.supabase_id);
        setRecipes(prev => prev.map(r => r.id === recipe.id ? recipe : r));
      } else {
        // Insert new
        const { data: inserted } = await supabase.from("recipes").insert(recipeToRow(recipe, session.user.id)).select().single();
        if (inserted) {
          const saved = rowToRecipe(inserted);
          setRecipes(prev => [saved, ...prev]);
          setActive(saved);
          setView("detail");
          showToast?.("Recipe saved!");
          if (isNew && saved.visibility !== "private") {
            supabase.from("activity").insert({ user_id: session.user.id, type: "logged_recipe", item_data: { id: saved.id, name: saved.name, type: saved.drinkType, rating: saved.rating, temp: saved.temp, milkType: saved.milkType }, is_public: saved.visibility === "public" }).then(() => {});
          }
          return;
        }
      }
    } else {
      setRecipes(prev => {
        const exists = prev.find(r => r.id === recipe.id);
        return exists ? prev.map(r => r.id === recipe.id ? recipe : r) : [recipe, ...prev];
      });
    }

    setActive(recipe); changeView("detail", recipe);
    setView("detail");
    showToast?.("Recipe saved!");
    if (session && isNew) {
      supabase.from("activity").insert({ user_id: session.user.id, type: "logged_recipe", item_data: { id: recipe.id, name: recipe.name, type: recipe.drinkType, rating: recipe.rating }, is_public: false }).then(() => {});
    }
  };

  const deleteRecipe = async (id) => {
    const recipe = recipes.find(r => r.id === id);
    if (session && recipe?.supabase_id) {
      await supabase.from("recipes").delete().eq("id", recipe.supabase_id);
    }
    setRecipes(p => p.filter(r => r.id !== id));
    changeView("list", null);
  };

  const startEdit = (r) => { setForm({ ...r }); setError(""); changeView("add", null); };
  const startAdd = () => { setForm(emptyRecipe()); setError(""); changeView("add", null); };
  useEffect(() => { if (addTrigger > 0) startAdd(); }, [addTrigger]);
  useEffect(() => { if (shareTrigger > 0) setShowShareMenu(true); }, [shareTrigger]);

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
          <label>Milk Amount <span style={{ color: "var(--muted3)", fontWeight: 400 }}>({form.milkUnit || "oz"})</span></label>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder={form.milkUnit === "ml" ? "e.g. 180" : "e.g. 6"} value={form.milkAmount} onChange={(e) => f("milkAmount", e.target.value)} style={{ flex: 1 }} />
            <div className="utog-wrap" style={{ flexShrink: 0 }}>
              <button type="button" className={(!form.milkUnit || form.milkUnit === "oz") ? "utog active" : "utog"} onClick={() => f("milkUnit", "oz")}>oz</button>
              <button type="button" className={form.milkUnit === "ml" ? "utog active" : "utog"} onClick={() => f("milkUnit", "ml")}>ml</button>
            </div>
          </div>
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
          <label>How does it taste? <span style={{ color: "var(--muted3)", fontWeight: 400 }}>(optional)</span></label>
          <textarea rows={3} placeholder='e.g. "Smooth and sweet with a warm caramel finish, hint of cinnamon"'
            value={form.flavorText || ""} onChange={(e) => f("flavorText", e.target.value.slice(0, 300))} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <div className="hint">Describe what you taste — or skip it and we'll build the profile from your ingredients.</div>
            <button type="button" onClick={handlePreviewFlavor} disabled={analyzingFlavor}
              style={{ background: "none", border: "1px solid var(--border2)", color: "var(--gold)", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", padding: "6px 12px", cursor: "pointer", fontFamily: "'Jost',sans-serif", flexShrink: 0, marginLeft: 12, opacity: analyzingFlavor ? 0.5 : 1 }}>
              {analyzingFlavor ? "Building..." : form.flavorData ? "Regenerate" : "Preview"}
            </button>
          </div>
          {form.flavorData?.mappings?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {[...new Set(form.flavorData.mappings.map(m => m.top))].slice(0, 5).map(top => {
                const color = FLAVOR_TAXONOMY[top]?.color || "#888";
                return <span key={top} style={{ fontSize: 10, padding: "2px 8px", border: `1px solid ${color}55`, color, background: color + "12" }}>{top}</span>;
              })}
            </div>
          )}
        </div>

        <div className="form-group full">
          <label>Photo <span style={{ color: "var(--muted3)", fontWeight: 400 }}>(optional)</span></label>
          {form.image_url ? (
            <div style={{ position: "relative", display: "inline-block" }}>
              <img src={form.image_url} alt="Recipe" style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block", border: "1px solid var(--border)" }} />
              <button onClick={() => setForm(prev => ({ ...prev, image_url: null }))}
                style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          ) : (
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: "1px dashed var(--border2)", cursor: "pointer", color: "var(--muted3)", fontSize: 13 }}>
              {uploading ? "Uploading..." : "📷 Tap to add a photo of your drink"}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} disabled={uploading} />
            </label>
          )}
          <div className="hint">JPG, PNG, or WEBP - max 5MB</div>
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
        <div className="form-group" style={{ marginBottom: 12, width: "100%" }}>
          <label>Visibility</label>
          <select value={form.visibility || "private"} onChange={(e) => setForm(prev => ({ ...prev, visibility: e.target.value }))}>
            <option value="private">Private - only you</option>
            <option value="friends">Friends - your friends feed</option>
            <option value="public">Public - visible to friends of friends</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => { if (!session) { onNeedAuth?.(); } else { saveRecipe(); } }} disabled={analyzingFlavor}>
          {analyzingFlavor ? "Building flavor profile..." : "Save Recipe"}
        </button>
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
        <button className="btn-ghost" onClick={() => changeView("list", null)} style={{ marginBottom: 28 }}>← Recipes</button>
        <div className="recipe-detail">
          {r.image_url && (
            <img src={r.image_url} alt={r.name} style={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block", marginBottom: 24, border: "1px solid var(--border)" }} />
          )}
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
            <div className="utog-wrap" style={{ alignSelf: "flex-start" }}>
              <button className={!useMetric ? "utog active" : "utog"} onClick={() => setUseMetric(false)}>oz</button>
              <button className={useMetric ? "utog active" : "utog"} onClick={() => setUseMetric(true)}>ml</button>
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
                    <span>{r.milkAmount ? `${formatMilk(r.milkAmount, useMetric)} ` : ""}{r.milkType}</span>
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

          {r.flavorData?.mappings?.length > 0 && (
            <div className="detail-block" style={{ marginTop: 20 }}>
              <div className="detail-block-label">Flavor Profile</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {[...new Set(r.flavorData.mappings.map(m => m.path ? m.path[0] : m.top))].map(top => {
                  const color = FLAVOR_TAXONOMY[top]?.color || "#888";
                  return <span key={top} style={{ fontSize: 11, padding: "3px 10px", border: `1px solid ${color}55`, color, background: color + "12" }}>{top}</span>;
                })}
              </div>
              <div className="wheel-svg-wrap">
                <FlavorWheel mappings={r.flavorData.mappings} />
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
                        <span style={{ fontSize: 10, color: "var(--muted4)" }}> - {desc}</span>
                        <div style={{ fontSize: 9, color: "var(--muted5)", fontStyle: "italic" }}>{example}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 9, color: "var(--muted5)", fontStyle: "italic", textAlign: "center", lineHeight: 1.6 }}>
                  Larger segments = more prominent flavor
                </div>
              </div>
              {r.flavorData.summary && (
                <div style={{ fontSize: 13, color: "var(--muted2)", fontStyle: "italic", lineHeight: 1.6, marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  {r.flavorData.summary}
                </div>
              )}
            </div>
          )}

          <div className="detail-actions" style={{ marginTop: 28 }}>
            <button className="btn-ghost" onClick={() => { startEdit(r); }}>Edit</button>
            {session && <button className="btn-ghost" onClick={() => setShowSendToFriend(true)}>Send to Friend</button>}
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
          {showShareMenu && (
            <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => setShowShareMenu(false)}>
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", width: "100%", maxWidth: 480, padding: "24px 24px 32px" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 10, color: "var(--gold)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Share</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button onClick={() => { setShowShareMenu(false); setShowExportCard(true); }}
                    style={{ padding: "14px 18px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ color: "var(--gold)", fontSize: 18 }}>◎</span>
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>Export Card</div>
                      <div style={{ fontSize: 11, color: "var(--muted3)" }}>Download a shareable PNG card</div>
                    </div>
                  </button>
                  {session && (
                    <button onClick={() => { setShowShareMenu(false); setShowSendToFriend(true); }}
                      style={{ padding: "14px 18px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ color: "var(--gold)", fontSize: 18 }}>✉</span>
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 2 }}>Send to Friend</div>
                        <div style={{ fontSize: 11, color: "var(--muted3)" }}>Share directly with a friend on Craft & Cup</div>
                      </div>
                    </button>
                  )}
                </div>
                <button onClick={() => setShowShareMenu(false)} style={{ marginTop: 16, background: "none", border: "none", color: "var(--muted3)", fontSize: 11, cursor: "pointer", fontFamily: "'Jost',sans-serif", letterSpacing: 1, textTransform: "uppercase", padding: 0 }}>Cancel</button>
              </div>
            </div>
          )}
          {showExportCard && (
            <RecipeCardExport recipe={r} onClose={() => setShowExportCard(false)} />
          )}
          {showSendToFriend && session && (
            <SendToFriendModal session={session} item={r} itemType="recipe" onClose={() => setShowSendToFriend(false)} showToast={showToast} />
          )}
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
          <div className="empty-sub">Made something you want to make again? Log it here with every detail - milk type, syrup, shots, steps - so you can recreate it exactly. Every recipe gets an AI-generated flavor profile built from your ingredients.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "20px 0 28px", textAlign: "left", maxWidth: 320 }}>
            {["Save drink recipes with ingredients and steps", "AI builds a flavor wheel from your ingredients automatically", "Rate your creations out of 10"].map(f => (
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
              <div className="list-sub">
                {syncing ? "Syncing..." : filteredRecipes.length === recipes.length
                  ? `${recipes.length} recipe${recipes.length !== 1 ? "s" : ""}`
                  : `${filteredRecipes.length} of ${recipes.length} recipes`}
              </div>
            </div>
          </div>

          {/* Search + filter toolbar */}
          <div className="journal-toolbar">
            <div className="journal-search-wrap">
              <span className="journal-search-icon">⌕</span>
              <input className="journal-search" placeholder="Search by name, type, or ingredient..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button className="journal-search-clear" onClick={() => setSearch("")}>✕</button>}
            </div>
            <div className="journal-toolbar-right">
              <button className={`journal-filter-btn ${showFilters || activeFilters > 0 ? "active" : ""}`}
                onClick={() => setShowFilters(!showFilters)}>
                Filter {activeFilters > 0 && <span className="filter-badge">{activeFilters}</span>}
              </button>
              <select className="journal-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {RECIPE_SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="filter-panel">
              <div className="filter-group">
                <div className="filter-group-label">Drink Type</div>
                <div className="filter-pills">
                  {DRINK_TYPES.map(t => (
                    <button key={t} className={`filter-pill ${filterType === t ? "active" : ""}`}
                      onClick={() => setFilterType(filterType === t ? "" : t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <div className="filter-group-label">Temperature</div>
                <div className="filter-pills">
                  {TEMP_OPTIONS.map(t => (
                    <button key={t} className={`filter-pill ${filterTemp === t ? "active" : ""}`}
                      onClick={() => setFilterTemp(filterTemp === t ? "" : t)}>{t}</button>
                  ))}
                </div>
              </div>
              {activeFilters > 0 && (
                <button className="filter-clear" onClick={() => { setFilterType(""); setFilterTemp(""); }}>
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {filteredRecipes.length === 0 ? (
            <div className="empty" style={{ padding: "48px 0" }}>
              <div className="empty-head">No matches found</div>
              <div className="empty-sub">Try adjusting your search or filters.</div>
              <button className="btn-ghost" onClick={() => { setSearch(""); setFilterType(""); setFilterTemp(""); }}>Clear all</button>
            </div>
          ) : (
            <div className="bean-grid">
              {filteredRecipes.map((r) => {
                const tempColors = { Hot: "#d4b05a", Iced: "#6ab0d4", Blended: "#8aaa6a" };
                const tc = tempColors[r.temp] || "var(--gold)";
                return (
                  <div key={r.id} className="recipe-card" style={{ "--rc": tc, "--acc": tc }} onClick={() => { setActive(r); changeView("detail", r); }}>
                    {r.image_url && (
                      <div style={{ width: "100%", height: 120, overflow: "hidden", marginBottom: 10 }}>
                        <img src={r.image_url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                    {r.isExample && <div className="bean-example-badge">Example</div>}
                    <div className="recipe-card-type" style={{ color: tc }}>{r.drinkType} · {r.temp}</div>
                    <div className="recipe-card-name">{r.name}</div>
                    <div className="bc-tags" style={{ marginBottom: 6 }}>
                      {r.espressoShots > 0 && <span className="bctag">{r.espressoShots} shot{r.espressoShots > 1 ? "s" : ""}</span>}
                      {r.milkType !== "None" && <span className="bctag">{r.milkType}</span>}
                      {r.syrup && <span className="bctag">{r.syrup}</span>}
                      {r.extras && <span className="bctag">{r.extras.split(",")[0].trim()}</span>}
                    </div>
                    {r.flavorData?.mappings?.length > 0 && (
                      <div className="bc-flavor-chips">
                        {r.flavorData.mappings.slice(0, 3).map((m, i) => {
                          const topKey = m.path ? m.path[0] : m.top;
                          const color = FLAVOR_TAXONOMY[topKey]?.color || "#888";
                          return (
                            <span key={i} className="bc-flavor-chip" style={{ background: color + "18", borderColor: color + "55", color }}>
                              {m.path ? m.path[m.path.length - 1] : (m.specific || m.mid || m.top)}
                            </span>
                          );
                        })}
                        {r.flavorData.mappings.length > 3 && (
                          <span className="bc-flavor-chip" style={{ background: "var(--bg3)", borderColor: "var(--border2)", color: "var(--muted3)" }}>
                            +{r.flavorData.mappings.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    {r.rating > 0 && (
                      <div className="bc-score">
                        <span className="bc-score-num" style={{ color: tc }}>{r.rating}</span>
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
    </div>
  );
}

// --- Home / Welcome Screen ---------------------------------------------------
function HomePage({ onNavigate, onTakeTour, onReplayTutorial, session, profile, beans, onSignIn }) {
  const hasNoBeans = session && (!beans || beans.filter(b => !b.isExample).length === 0);
  const isReturning = session && beans && beans.filter(b => !b.isExample).length > 0;
  const beanCount = beans ? beans.filter(b => !b.isExample).length : 0;
  const lastBean = isReturning ? [...beans].filter(b => !b.isExample).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null;

  const Ornament = () => (
    <div className="welcome-ornament-top" aria-hidden="true">
      <span className="welcome-orn-line" />
      <span className="welcome-orn-diamond">◆</span>
      <span className="welcome-orn-line" />
    </div>
  );

  const Divider = () => (
    <div className="welcome-deco-divider" aria-hidden="true">
      <span className="wdd-line" />
      <span className="wdd-center">
        <span className="wdd-dot" />
        <span className="wdd-diamond">◆</span>
        <span className="wdd-dot" />
      </span>
      <span className="wdd-line" />
    </div>
  );

  return (
    <div className="welcome-page">
      <div className="welcome-rays" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="welcome-ray" style={{ transform: `rotate(${i * 30}deg)` }} />
        ))}
      </div>

      <div className="welcome-inner">
        <Ornament />
        <div className="welcome-badge">Coffee Journal & Brew Tool</div>
        <h1 className="welcome-wordmark">Craft<br />&amp; Cup</h1>
        <Divider />

        {/* --- Signed out --- */}
        {!session && (
          <>
            <p className="welcome-tagline">For the curious cup.</p>
            <div className="welcome-features" style={{ marginBottom: 24 }}>
              <div className="welcome-feature">
                <span className="welcome-feature-icon">◎</span>
                <span>AI maps flavors to a wheel - from your tasting notes or your drink ingredients</span>
              </div>
              <div className="welcome-feature">
                <span className="welcome-feature-icon">▽</span>
                <span>Dial in any brew method with ratios, grind guides, and timers</span>
              </div>
              <div className="welcome-feature">
                <span className="welcome-feature-icon">✦</span>
                <span>Save your collection and access it from any device</span>
              </div>
              <div className="welcome-feature">
                <span className="welcome-feature-icon">◈</span>
                <span>Share beans and recipes with friends who love coffee</span>
              </div>
            </div>
            <button className="welcome-cta" onClick={onSignIn}>
              Create a free account
            </button>
            <button className="welcome-cta" onClick={onTakeTour} style={{ marginTop: 12 }}>
              Take the tour first
            </button>
            <button onClick={() => onNavigate("brew")} style={{ background: "none", border: "none", color: "var(--muted3)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", fontFamily: "'Jost',sans-serif", marginTop: 16 }}>
              Continue without account
            </button>
          </>
        )}

        {/* --- Signed in, new user --- */}
        {hasNoBeans && (
          <>
            <p className="welcome-tagline">Welcome, {profile?.screenname}.</p>
            <p className="welcome-desc" style={{ marginBottom: 24 }}>
              You're all set. Here's the best way to get started.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginBottom: 24 }}>
              {[
                { icon: "▽", label: "Get a brew recommendation", sub: "Tell us what you want in the cup", tab: "brew" },
                { icon: "◎", label: "Log your first bean", sub: "Describe what you taste and build your flavor wheel", tab: "journal" },
                { icon: "★", label: "Explore the coffee guide", sub: "Grind sizes, roast levels, sweeteners, and origins", tab: "guide" },
              ].map(({ icon, label, sub, tab }) => (
                <button key={tab} onClick={() => onNavigate(tab)}
                  style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer", textAlign: "left", fontFamily: "'Jost',sans-serif", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>
                  <span style={{ fontSize: 22, color: "var(--gold)", flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 11, color: "var(--muted3)" }}>{sub}</div>
                  </div>
                  <span style={{ color: "var(--muted3)", marginLeft: "auto", fontSize: 14 }}>→</span>
                </button>
              ))}
            </div>
            <button className="welcome-cta" onClick={onTakeTour} style={{ background: "none", border: "1px solid var(--border2)", color: "var(--muted3)", fontSize: 10 }}>
              Take the tour
            </button>
          </>
        )}

        {/* --- Signed in, returning user --- */}
        {isReturning && (
          <>
            <p className="welcome-tagline">Welcome back, {profile?.screenname}.</p>
            <Divider />

            {/* Snapshot */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", marginBottom: 24 }}>
              <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: "var(--gold)" }}>{beanCount}</div>
                <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>Bean{beanCount !== 1 ? "s" : ""} Logged</div>
              </div>
              <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", padding: "14px 16px", textAlign: "center", cursor: "pointer" }} onClick={() => onNavigate("journal")}>
                {lastBean ? (
                  <>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: "var(--text)", marginBottom: 2, lineHeight: 1.2 }}>{lastBean.name || lastBean.brand || lastBean.origin || "Unnamed"}</div>
                    <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1.5, textTransform: "uppercase" }}>Last Logged</div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", marginBottom: 24 }}>
              {[
                { icon: "◎", label: "Log a new bean", tab: "journal" },
                { icon: "▽", label: "Open the Brew tab", tab: "brew" },
                { icon: "◈", label: "See what friends are tasting", tab: "feed" },
              ].map(({ icon, label, tab }) => (
                <button key={tab} onClick={() => onNavigate(tab)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", background: "none", border: "1px solid var(--border)", color: "var(--muted2)", cursor: "pointer", textAlign: "left", fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: 0.5, transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted2)"; }}>
                  <span style={{ fontSize: 16, color: "var(--gold)" }}>{icon}</span>
                  {label}
                  <span style={{ marginLeft: "auto", fontSize: 12 }}>→</span>
                </button>
              ))}
            </div>

            <button onClick={onTakeTour} style={{ background: "none", border: "none", color: "var(--muted3)", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", fontFamily: "'Jost',sans-serif" }}>
              Take the tour
            </button>
          </>
        )}

        <Ornament />
      </div>
    </div>
  );
}

// --- Onboarding --------------------------------------------------------------
const ONBOARDING_KEY = "craft_and_cup_onboarded_v3";
const PERSONA_KEY = "craft_and_cup_persona";

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
        <input type="range" min="10" max="20" step="1" value={ratio} onChange={e => setRatio(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--gold)", cursor: "pointer" }} />
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
          return <span key={m.specific} style={{ fontSize: 11, border: "1px solid", borderColor: color + "66", color, padding: "2px 8px" }}>{m.specific}</span>;
        })}
      </div>
    </div>
  );
}

const ONBOARDING_PATHS = {
  beginner: [
    {
      step: "welcome",
      title: "Craft & Cup",
      subtitle: "Your coffee companion",
      body: "Whether you just picked up your first bag of beans or you've been curious about coffee for a while - you're in the right place. Let's get you set up.",
    },
    {
      step: "brew",
      icon: "▽",
      title: "Start with the Brew tab",
      subtitle: "No jargon, no guesswork",
      body: "Tell us what you want in your cup and how much time you have. We'll recommend a method and walk you through the specs. No equipment knowledge needed.",
      demo: "calc",
    },
    {
      step: "journal",
      icon: "◎",
      title: "Log what you taste",
      subtitle: "Build your flavor library",
      body: "As you try different coffees, log them in your Bean Journal. Describe what you taste in plain language and AI maps your notes to a flavor wheel automatically. Recipes get a flavor profile too - built from the ingredients.",
      demo: "journal",
    },
    {
      step: "social",
      icon: "◈",
      title: "You're not alone",
      subtitle: "A community of coffee lovers",
      body: "Connect with friends, see what they're brewing, react to their posts, and share beans you love. Add friends using your unique friend code in the Profile tab.",
      demo: "social",
    },
    {
      step: "finish",
      icon: "✦",
      title: "Ready to brew",
      subtitle: null,
      body: "Head to the Brew tab to get your first recommendation. The Guide tab is also great for learning the basics at your own pace.",
      finishTab: "brew",
    },
  ],
  intermediate: [
    {
      step: "welcome",
      title: "Craft & Cup",
      subtitle: "Level up your coffee",
      body: "You've got some coffee experience under your belt. Craft & Cup helps you track what you're tasting, dial in your technique, and connect with people who get it.",
    },
    {
      step: "journal",
      icon: "◎",
      title: "Track every bean",
      subtitle: "AI-powered flavor mapping",
      body: "Log any bean with your tasting notes and Claude AI maps your flavors to a multi-tier wheel automatically. Save drink recipes and they get a flavor profile built from the ingredients too.",
      demo: "journal",
    },
    {
      step: "brew",
      icon: "▽",
      title: "Dial in your cup",
      subtitle: "Specs and troubleshooting",
      body: "Pick your method and tell us how it's tasting. Get grind size, ratio, temp, and a targeted tip. Open the calculator to fine-tune your numbers.",
      demo: "calc",
    },
    {
      step: "social",
      icon: "◈",
      title: "Share the experience",
      subtitle: "Coffee is better together",
      body: "Add friends using your unique friend code, share beans and recipes directly, and react to what your friends are tasting. Your feed shows everything your friends have set to Friends or Public.",
      demo: "social",
    },
    {
      step: "finish",
      icon: "✦",
      title: "You are all set",
      subtitle: null,
      body: "Log your first bean in the Journal, dial in a brew, or explore the Guide for deep dives on grind sizes, roast levels, sweeteners, and origins.",
      finishTab: "journal",
    },
  ],
  enthusiast: [
    {
      step: "welcome",
      title: "Craft & Cup",
      subtitle: "For the serious coffee lover",
      body: "A personal coffee companion built for people who care about what's in their cup. Log beans, dial in ratios, share with friends who get it.",
    },
    {
      step: "journal",
      icon: "◎",
      title: "The Bean Journal",
      subtitle: "AI-powered flavor mapping",
      body: "Log beans with tasting notes and Claude AI maps your flavors to a multi-tier wheel. Score on aroma, acidity, body, and more. Save drink recipes and they get a flavor profile built from ingredients automatically.",
      demo: "journal",
    },
    {
      step: "social",
      icon: "◈",
      title: "Coffee Community",
      subtitle: "Share the obsession",
      body: "Add friends via your unique friend code, share beans and recipes, and react and comment on posts. Control who sees each bean and recipe with Private, Friends, or Public visibility.",
      demo: "social",
    },
    {
      step: "brew",
      icon: "▽",
      title: "Brew and Dial In",
      subtitle: "Specs, ratios, timers",
      body: "Pick your method, tell us how it's tasting, and get targeted specs and a troubleshooting tip. Full calculator with stage timers for every method.",
      demo: "calc",
    },
    {
      step: "finish",
      icon: "✦",
      title: "You are all set",
      subtitle: null,
      body: "Jump straight to the Journal and log your first bean. The FAQ covers 128 questions across 18 categories if you ever need it.",
      finishTab: "journal",
    },
  ],
};

function Onboarding({ onComplete, onNavigate }) {
  const [persona, setPersona] = useState(null);
  const [step, setStep] = useState(0);

  const steps = persona ? ONBOARDING_PATHS[persona] : null;
  const current = steps ? steps[step] : null;
  const isLast = steps && step === steps.length - 1;
  const isFirst = step === 0;

  const handlePersona = (p) => {
    localStorage.setItem(PERSONA_KEY, p);
    setPersona(p);
    setStep(0);
  };

  const handleBack = () => {
    if (step === 0) setPersona(null);
    else setStep(s => s - 1);
  };

  const handleFinish = (tab) => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    onComplete();
    if (tab) onNavigate(tab);
  };

  const SocialDemo = () => (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", padding: "16px 18px" }}>
      <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>How it works</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { icon: "◈", text: "Share your friend code - found in your Profile tab" },
          { icon: "☕", text: "React to friends' beans and recipes in the Feed" },
          { icon: "✉", text: "Send beans or recipes directly via the Inbox" },
          { icon: "◻", text: "Build Collections to organise your favourites" },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, color: "var(--gold)", flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: 12, color: "var(--muted2)" }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const demos = {
    journal: <OnboardingDemoWheel />,
    calc: <OnboardingDemoCalc />,
    social: <SocialDemo />,
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">

        {/* Persona selection */}
        {!persona && (
          <>
            <div className="onboarding-welcome">
              <div className="onboarding-wordmark">Craft & Cup</div>
              <div className="onboarding-tagline">Where are you at with coffee?</div>
              <div className="onboarding-body">We'll tailor the experience to you.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {[
                { key: "beginner", label: "Just getting started", sub: "New to specialty coffee, need some guidance" },
                { key: "intermediate", label: "Know a bit, want to learn more", sub: "Have some experience, looking to improve" },
                { key: "enthusiast", label: "I know my stuff", sub: "Experienced, want to track and dial in" },
              ].map(({ key, label, sub }) => (
                <button key={key} onClick={() => handlePersona(key)}
                  style={{ padding: "14px 18px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--muted2)", cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: 13, textAlign: "left", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--muted2)"; }}>
                  <div style={{ fontWeight: 500, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted3)" }}>{sub}</div>
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button className="onboarding-skip" onClick={() => handleFinish(null)}>Skip</button>
            </div>
          </>
        )}

        {/* Step content */}
        {persona && current && (
          <>
            {/* Progress dots */}
            <div className="onboarding-step-dots">
              {steps.map((_, i) => (
                <div key={i} className={`onboarding-dot ${i === step ? "active" : i < step ? "done" : ""}`} />
              ))}
            </div>

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
                {current.demo && demos[current.demo] && (
                  <div className="onboarding-demo">{demos[current.demo]}</div>
                )}
              </>
            )}

            <div className="onboarding-actions">
              {isLast ? (
                <div className="onboarding-finish-btns">
                  <button className="btn-primary onboarding-cta" onClick={() => handleFinish(current.finishTab)}>
                    {current.finishTab === "brew" ? "Take me to Brew →" : "Take me to the Journal →"}
                  </button>
                  <button className="onboarding-skip" onClick={() => handleFinish(null)}>Skip for now</button>
                </div>
              ) : (
                <div className="onboarding-nav">
                  <button className="onboarding-back" onClick={handleBack}>← Back</button>
                  <button className="btn-primary onboarding-cta" onClick={() => setStep(s => s + 1)}>Next →</button>
                  <button className="onboarding-skip" onClick={() => handleFinish(null)}>Skip</button>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// --- Root App ----------------------------------------------------------------
const TOUR_STEPS = [
  {
    tab: "home",
    title: "Welcome to Craft & Cup",
    desc: "Your home base. Jump to any part of the app from here, replay this tour anytime, or head straight to the journal to log your first bean.",
  },
  {
    tab: "journal",
    title: "Bean Journal",
    desc: "Your personal coffee library. Log any bean with brand, origin, roast level, brew method, and tasting notes. Sign in to save your collection across devices.",
  },
  {
    tab: "journal",
    title: "AI Flavor Wheel",
    desc: "Write your tasting notes in plain language and Claude AI maps them to a multi-tier flavor wheel automatically. The bigger the section, the more prominent that flavor. No coffee jargon required.",
  },
  {
    tab: "journal",
    title: "Bean Cards & Sharing",
    desc: "On any bean detail page you can export a shareable card as a PNG image, or send the bean directly to a friend from your friends list.",
  },
  {
    tab: "feed",
    title: "Friends Feed",
    desc: "See what your friends are logging and tasting in real time. React with ☕ Love it, 🌟 Want to try, or 🫘 Interesting - and leave comments on any post.",
  },
  {
    tab: "recipes",
    title: "Drink Recipes",
    desc: "Save any drink you love and want to recreate. Log the shots, milk, syrups, extras, and step-by-step instructions. Send recipes to friends directly from the detail page.",
  },
  {
    tab: "collections",
    title: "Collections",
    desc: "Organise your beans into named groups like 'My Ethiopia Naturals' or 'Beans to Try'. Make collections private or public for others to discover.",
  },
  {
    tab: "brew",
    title: "Brew",
    desc: "Pick your method and get your specs - grind size, ratio, temp, and a tip based on how your cup is tasting. Open the calculator to dial in your numbers and run the stage timer.",
  },
  {
    tab: "profile",
    title: "Your Profile & Friends",
    desc: "Set your screenname, write a bio, and find your unique friend code. Share your code with others so they can add you - accept or decline requests from the Friends tab.",
  },
  {
    tab: "guide",
    title: "Coffee Guide",
    desc: "Five reference guides covering grind sizes, roast levels, milk options, sweeteners, and coffee origins. Tap any topic to dive in - use the back button to return to the menu.",
  },
  {
    tab: "faq",
    title: "FAQ",
    desc: "Common questions about specialty coffee answered in plain language - ratios, bloom, water temperature, processing methods, and step-by-step brew guides for every method.",
  },
  {
    tab: "home",
    title: "You are all set",
    desc: "That is the full tour. Log your first bean in the Journal, connect with friends using your friend code in Profile, or explore the Guide to level up your coffee knowledge.",
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

// --- Profile Page ------------------------------------------------------------
// --- Screenname Setup Modal --------------------------------------------------
function ScreennameModal({ session, onComplete }) {
  const [screenname, setScreenname] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const name = screenname.trim();
    if (!name) { setError("Please choose a screenname."); return; }
    if (name.length < 3) { setError("Screenname must be at least 3 characters."); return; }
    if (name.length > 24) { setError("Screenname must be 24 characters or less."); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) { setError("Only letters, numbers, and underscores allowed."); return; }
    setSaving(true);
    const { error: err } = await supabase.from("profiles").insert({ id: session.user.id, screenname: name, is_public: false });
    if (err) {
      if (err.code === "23505") { setError("That screenname is taken - try another."); }
      else { setError("Something went wrong. Please try again."); }
      setSaving(false);
      return;
    }
    // Send welcome message to inbox
    await supabase.from("shared_items").insert({
      sender_id: session.user.id,
      receiver_id: session.user.id,
      item_type: "message",
      item_data: {
        subject: "Welcome to Craft & Cup",
        body: `Hey @${name},\n\nThank you so much for signing up - it genuinely means a lot.\n\nCraft & Cup started as something I built for myself because I wanted a better way to keep track of the beans I was trying and the drinks I was making. It slowly turned into something I'm really proud of, and sharing it with people who love coffee as much as I do makes all the late nights worth it.\n\nI hope it makes your coffee journey a little more fun.\n\nIf you ever have feedback, ideas, or just want to talk coffee, I'd love to hear from you.\n\nEnjoy every cup.\n\n- Nick`,
      },
      message: "Welcome to Craft & Cup!",
      read: false,
    });
    onComplete({ screenname: name, is_public: false, bio: "" });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", padding: "40px 36px", width: "100%", maxWidth: 400, textAlign: "center" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "var(--gold)", marginBottom: 6 }}>Welcome!</div>
        <div style={{ fontSize: 12, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Choose your screenname</div>
        <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 28, fontStyle: "italic" }}>This is how others will see you. Your email and sign-in info stay private.</div>
        <input
          value={screenname}
          onChange={e => { setScreenname(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="e.g. brewmaster_nick"
          maxLength={24}
          style={{ width: "100%", padding: "12px 16px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 14, fontFamily: "'Jost', sans-serif", marginBottom: 8, boxSizing: "border-box", textAlign: "center", letterSpacing: 1 }}
        />
        {error && <div style={{ fontSize: 12, color: "#d06860", marginBottom: 12 }}>{error}</div>}
        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: "100%", marginTop: 8, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : "Set Screenname"}
        </button>
      </div>
    </div>
  );
}

// --- Delete Account Button ---------------------------------------------------
function DeleteAccountButton({ session, onSignOut }) {
  const [step, setStep] = useState("idle"); // idle | confirm | counting | deleting
  const [countdown, setCountdown] = useState(5);
  const intervalRef = useRef(null);

  const handleInitiate = () => setStep("confirm");
  const handleCancel = () => { setStep("idle"); setCountdown(5); clearInterval(intervalRef.current); };

  const handleConfirm = () => {
    setStep("counting");
    setCountdown(5);
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          handleDelete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDelete = async () => {
    setStep("deleting");
    // Delete all user data
    await supabase.from("beans").delete().eq("user_id", session.user.id);
    await supabase.from("recipes").delete().eq("user_id", session.user.id);
    await supabase.from("collections").delete().eq("user_id", session.user.id);
    await supabase.from("activity").delete().eq("user_id", session.user.id);
    await supabase.from("reactions").delete().eq("user_id", session.user.id);
    await supabase.from("comments").delete().eq("user_id", session.user.id);
    await supabase.from("notifications").delete().eq("user_id", session.user.id);
    await supabase.from("shared_items").delete().eq("sender_id", session.user.id);
    await supabase.from("shared_items").delete().eq("receiver_id", session.user.id);
    await supabase.from("friendships").delete().or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);
    await supabase.from("profiles").delete().eq("id", session.user.id);
    await supabase.auth.signOut();
    onSignOut();
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  if (step === "idle") return (
    <button onClick={handleInitiate}
      style={{ background: "none", border: "1px solid #d0686055", color: "#d06860", fontSize: 11, letterSpacing: 1, padding: "8px 16px", cursor: "pointer", fontFamily: "'Jost',sans-serif" }}>
      Delete Account
    </button>
  );

  if (step === "confirm") return (
    <div style={{ border: "1px solid #d0686055", padding: 16, background: "#d0686008" }}>
      <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 4, fontWeight: 500 }}>Are you sure?</div>
      <div style={{ fontSize: 12, color: "var(--muted3)", marginBottom: 14, lineHeight: 1.5 }}>
        This permanently deletes your account, beans, recipes, collections, and all data. This cannot be undone.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleConfirm}
          style={{ background: "#d06860", border: "none", color: "#fff", fontSize: 11, letterSpacing: 1, padding: "8px 16px", cursor: "pointer", fontFamily: "'Jost',sans-serif" }}>
          Yes, delete my account
        </button>
        <button onClick={handleCancel} className="btn-ghost" style={{ fontSize: 11 }}>Cancel</button>
      </div>
    </div>
  );

  if (step === "counting") return (
    <div style={{ border: "1px solid #d0686055", padding: 16, background: "#d0686008" }}>
      <div style={{ fontSize: 13, color: "#d06860", marginBottom: 8 }}>Deleting in {countdown} second{countdown !== 1 ? "s" : ""}...</div>
      <div style={{ height: 4, background: "var(--bg3)", marginBottom: 14, borderRadius: 2 }}>
        <div style={{ height: "100%", background: "#d06860", borderRadius: 2, width: `${((5 - countdown) / 5) * 100}%`, transition: "width 1s linear" }} />
      </div>
      <button onClick={handleCancel} className="btn-ghost" style={{ fontSize: 11 }}>Cancel</button>
    </div>
  );

  if (step === "deleting") return (
    <div style={{ fontSize: 13, color: "var(--muted3)", fontStyle: "italic" }}>Deleting your account...</div>
  );
}

// --- Profile Page ------------------------------------------------------------
function ProfilePage({ session, onSignOut, profile, onProfileUpdate, onSignIn }) {
  if (!session) return (
    <div className="page">
      <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", paddingTop: 60 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "var(--text)", marginBottom: 8 }}>Your Profile</div>
        <div style={{ fontSize: 13, color: "var(--muted3)", marginBottom: 32, lineHeight: 1.6 }}>
          Sign in to access your profile, manage your account, and connect with friends.
        </div>
        <button className="btn-primary" onClick={onSignIn} style={{ width: "100%", marginBottom: 12 }}>
          Sign In
        </button>
        <div style={{ fontSize: 11, color: "var(--muted3)", marginTop: 16, lineHeight: 1.6 }}>
          Your beans, recipes, and collections are saved to your account and accessible from any device.
        </div>
      </div>
    </div>
  );
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ screenname: profile?.screenname || "", bio: profile?.bio || "", is_public: profile?.is_public || false });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [linkMsg, setLinkMsg] = useState("");
  const [activeSection, setActiveSection] = useState("profile"); // profile | friends | requests
  const [friends, setFriends] = useState([]);
  const [pendingIn, setPendingIn] = useState([]);
  const [pendingOut, setPendingOut] = useState([]);
  const [addCode, setAddCode] = useState("");
  const [addMsg, setAddMsg] = useState("");
  const [addError, setAddError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    const { data } = await supabase
      .from("friendships")
      .select("*, requester:requester_id(screenname, friend_code), receiver:receiver_id(screenname, friend_code)")
      .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);
    if (data) {
      setFriends(data.filter(f => f.status === "accepted").map(f =>
        f.requester_id === session.user.id ? { ...f.receiver, friendship_id: f.id } : { ...f.requester, friendship_id: f.id }
      ));
      setPendingIn(data.filter(f => f.status === "pending" && f.receiver_id === session.user.id).map(f => ({ ...f.requester, friendship_id: f.id })));
      setPendingOut(data.filter(f => f.status === "pending" && f.requester_id === session.user.id).map(f => ({ ...f.receiver, friendship_id: f.id })));
    }
    setLoadingFriends(false);
  };

  useEffect(() => { if (activeSection === "friends") fetchFriends(); }, [activeSection]);

  const handleAddFriend = async () => {
    const code = addCode.trim().toUpperCase();
    if (!code) { setAddError("Enter a friend code."); return; }
    if (code === profile?.friend_code) { setAddError("That's your own code!"); return; }
    const { data: target, error: findErr } = await supabase.from("profiles").select("id, screenname").eq("friend_code", code).single();
    if (findErr || !target) { setAddError("No user found with that code."); return; }
    const { error: reqErr } = await supabase.from("friendships").insert({ requester_id: session.user.id, receiver_id: target.id });
    if (reqErr) {
      if (reqErr.code === "23505") { setAddError("You already sent a request to this user."); }
      else { setAddError("Something went wrong."); }
      return;
    }
    sendNotification(target.id, "friend_request", session.user.id, session.user.id, `@${profile?.screenname} sent you a friend request`);
    setAddMsg(`Friend request sent to @${target.screenname}!`);
    setAddCode("");
    setAddError("");
    setTimeout(() => setAddMsg(""), 3000);
  };

  const handleAccept = async (friendship_id) => {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendship_id);
    // Notify the requester
    const friend = pendingIn.find(f => f.friendship_id === friendship_id);
    if (friend) sendNotification(friend.id, "friend_accepted", session.user.id, session.user.id, `@${profile?.screenname} accepted your friend request`);
    fetchFriends();
  };

  const handleDecline = async (friendship_id) => {
    await supabase.from("friendships").update({ status: "declined" }).eq("id", friendship_id);
    fetchFriends();
  };

  const handleRemoveFriend = async (friendship_id) => {
    await supabase.from("friendships").delete().eq("id", friendship_id);
    fetchFriends();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(profile?.friend_code || "");
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSave = async () => {
    const name = form.screenname.trim();
    if (!name) { setError("Screenname can't be empty."); return; }
    if (name.length < 3) { setError("Screenname must be at least 3 characters."); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) { setError("Only letters, numbers, and underscores allowed."); return; }
    setSaving(true);
    const { error: err } = await supabase.from("profiles").update({
      screenname: name, bio: form.bio.trim(), is_public: form.is_public, updated_at: new Date().toISOString()
    }).eq("id", session.user.id);
    if (err) {
      if (err.code === "23505") { setError("That screenname is taken."); }
      else { setError("Something went wrong."); }
      setSaving(false);
      return;
    }
    onProfileUpdate({ ...profile, screenname: name, bio: form.bio.trim(), is_public: form.is_public });
    setEditing(false);
    setSaving(false);
  };

  const linkProvider = async (provider) => {
    const { error } = await supabase.auth.linkIdentity({ provider, options: { redirectTo: window.location.origin + "/auth/callback" } });
    if (error) setLinkMsg("Could not link account: " + error.message);
  };

  const linkedProviders = session?.user?.identities?.map(i => i.provider) || [];
  const initial = profile?.screenname?.[0]?.toUpperCase() || "?";

  const sectionBtn = (id, label, badge) => (
    <button onClick={() => setActiveSection(id)} style={{
      padding: "8px 16px", background: activeSection === id ? "var(--gold-dim)" : "none",
      border: "1px solid " + (activeSection === id ? "var(--gold)" : "var(--border)"),
      color: activeSection === id ? "var(--gold)" : "var(--muted3)",
      cursor: "pointer", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
      fontFamily: "'Jost', sans-serif", position: "relative"
    }}>
      {label}
      {badge > 0 && <span style={{ position: "absolute", top: -6, right: -6, background: "#d06860", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>}
    </button>
  );

  return (
    <div className="page">
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 0" }}>

        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--gold-dim)", border: "2px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "var(--gold)", fontFamily: "'Cormorant Garamond', serif", flexShrink: 0 }}>
            {initial}
          </div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--text)" }}>@{profile?.screenname}</div>
            <div style={{ fontSize: 11, color: "var(--muted3)", marginTop: 2, letterSpacing: 1 }}>
              {profile?.is_public ? "Public profile" : "Private profile"}
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {sectionBtn("profile", "Profile")}
          {sectionBtn("friends", "Friends", pendingIn.length)}
          {sectionBtn("accounts", "Accounts")}
        </div>

        {/* PROFILE SECTION */}
        {activeSection === "profile" && (
          <>
            <div style={{ border: "1px solid var(--border)", padding: 24, marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Profile</div>
              {!editing ? (
                <>
                  {profile?.bio && <div style={{ fontSize: 13, color: "var(--muted2)", marginBottom: 16, fontStyle: "italic" }}>"{profile.bio}"</div>}
                  {profile?.is_public && (
                    <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--muted3)" }}>
                        Public URL: <span style={{ color: "var(--gold)" }}>mycraftcup.com/u/{profile.screenname}</span>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(`https://mycraftcup.com/u/${profile.screenname}`); }}
                        style={{ background: "none", border: "none", color: "var(--muted3)", fontSize: 10, cursor: "pointer", fontFamily: "'Jost',sans-serif", letterSpacing: 1, textTransform: "uppercase", padding: 0 }}>
                        Copy
                      </button>
                    </div>
                  )}
                  <button className="btn-ghost" onClick={() => { setEditing(true); setError(""); }} style={{ fontSize: 11 }}>Edit Profile</button>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1, marginBottom: 6 }}>SCREENNAME</div>
                    <input value={form.screenname} onChange={e => setForm(f => ({ ...f, screenname: e.target.value }))} maxLength={24}
                      style={{ width: "100%", padding: "10px 14px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 13, fontFamily: "'Jost',sans-serif", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1, marginBottom: 6 }}>BIO <span style={{ color: "var(--muted3)" }}>(optional)</span></div>
                    <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} maxLength={160} rows={3}
                      style={{ width: "100%", padding: "10px 14px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 13, fontFamily: "'Jost',sans-serif", boxSizing: "border-box", resize: "vertical" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <input type="checkbox" id="public-toggle" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--gold)", flexShrink: 0, margin: 0 }} />
                    <label htmlFor="public-toggle" style={{ fontSize: 12, color: "var(--muted2)", cursor: "pointer", margin: 0, lineHeight: 1 }}>Make my profile public</label>
                  </div>
                  {error && <div style={{ fontSize: 12, color: "#d06860", marginBottom: 12 }}>{error}</div>}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Save"}</button>
                    <button className="btn-ghost" onClick={() => { setEditing(false); setError(""); setForm({ screenname: profile?.screenname || "", bio: profile?.bio || "", is_public: profile?.is_public || false }); }}>Cancel</button>
                  </div>
                </>
              )}
            </div>
            <div style={{ border: "1px solid var(--border)", padding: 24 }}>
              <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Account</div>
              <button className="btn-ghost" onClick={onSignOut} style={{ fontSize: 11, letterSpacing: 1 }}>Sign Out</button>
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Danger Zone</div>
                <DeleteAccountButton session={session} onSignOut={onSignOut} />
              </div>
            </div>
          </>
        )}

        {/* FRIENDS SECTION */}
        {activeSection === "friends" && (
          <>
            {/* Your friend code */}
            <div style={{ border: "1px solid var(--border)", padding: 24, marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Your Friend Code</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--gold)", letterSpacing: 4 }}>{profile?.friend_code}</div>
                <button className="btn-ghost" onClick={copyCode} style={{ fontSize: 11, padding: "6px 14px" }}>
                  {codeCopied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted3)", marginTop: 8 }}>Share this code with friends so they can add you.</div>
            </div>

            {/* Add a friend */}
            <div style={{ border: "1px solid var(--border)", padding: 24, marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Add a Friend</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={addCode} onChange={e => { setAddCode(e.target.value.toUpperCase()); setAddError(""); setAddMsg(""); }}
                  placeholder="Enter friend code" maxLength={9}
                  onKeyDown={e => e.key === "Enter" && handleAddFriend()}
                  style={{ flex: 1, padding: "10px 14px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 13, fontFamily: "'Jost',sans-serif", letterSpacing: 2 }} />
                <button className="btn-primary" onClick={handleAddFriend} style={{ whiteSpace: "nowrap" }}>Send Request</button>
              </div>
              {addError && <div style={{ fontSize: 12, color: "#d06860", marginTop: 8 }}>{addError}</div>}
              {addMsg && <div style={{ fontSize: 12, color: "var(--green)", marginTop: 8 }}>{addMsg}</div>}
            </div>

            {/* Pending incoming requests */}
            {pendingIn.length > 0 && (
              <div style={{ border: "1px solid var(--gold-dim)", padding: 24, marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "var(--gold)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Friend Requests</div>
                {pendingIn.map(f => (
                  <div key={f.friendship_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, color: "var(--text)" }}>@{f.screenname}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-primary" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => handleAccept(f.friendship_id)}>Accept</button>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => handleDecline(f.friendship_id)}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending outgoing requests */}
            {pendingOut.length > 0 && (
              <div style={{ border: "1px solid var(--border)", padding: 24, marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Sent Requests</div>
                {pendingOut.map(f => (
                  <div key={f.friendship_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, color: "var(--muted2)" }}>@{f.screenname}</span>
                    <span style={{ fontSize: 11, color: "var(--muted3)", letterSpacing: 1 }}>PENDING</span>
                  </div>
                ))}
              </div>
            )}

            {/* Friends list */}
            <div style={{ border: "1px solid var(--border)", padding: 24 }}>
              <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Friends {friends.length > 0 && `(${friends.length})`}</div>
              {loadingFriends ? (
                <div style={{ fontSize: 13, color: "var(--muted3)" }}>Loading...</div>
              ) : friends.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--muted3)", fontStyle: "italic" }}>No friends yet - share your code to get started!</div>
              ) : (
                friends.map(f => (
                  <div key={f.friendship_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, color: "var(--text)" }}>@{f.screenname}</span>
                    <button className="btn-ghost" style={{ fontSize: 11, padding: "4px 10px", color: "#d06860" }} onClick={() => handleRemoveFriend(f.friendship_id)}>Remove</button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ACCOUNTS SECTION */}
        {activeSection === "accounts" && (
          <div style={{ border: "1px solid var(--border)", padding: 24 }}>
            <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Linked Accounts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--muted2)" }}>Google</span>
                {linkedProviders.includes("google") ? (
                  <span style={{ fontSize: 11, color: "var(--green)", letterSpacing: 1 }}>LINKED</span>
                ) : (
                  <button className="btn-ghost" style={{ fontSize: 11, padding: "4px 12px" }} onClick={() => linkProvider("google")}>Link</button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--muted2)" }}>Discord</span>
                {linkedProviders.includes("discord") ? (
                  <span style={{ fontSize: 11, color: "var(--green)", letterSpacing: 1 }}>LINKED</span>
                ) : (
                  <button className="btn-ghost" style={{ fontSize: 11, padding: "4px 12px" }} onClick={() => linkProvider("discord")}>Link</button>
                )}
              </div>
            </div>
            {linkMsg && <div style={{ fontSize: 12, color: "#d06860", marginTop: 12 }}>{linkMsg}</div>}
          </div>
        )}

      </div>
    </div>
  );
}

// --- Send To Friend Modal ----------------------------------------------------
// --- Notification helper -----------------------------------------------------
const sendNotification = async (userId, type, actorId, referenceId, message) => {
  if (userId === actorId) return; // Don't notify yourself
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    actor_id: actorId,
    reference_id: referenceId,
    message,
  });
};

function SendToFriendModal({ session, item, itemType, onClose, showToast }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      const { data } = await supabase
        .from("friendships")
        .select("*, requester:requester_id(id, screenname), receiver:receiver_id(id, screenname)")
        .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .eq("status", "accepted");
      if (data) {
        setFriends(data.map(f =>
          f.requester_id === session.user.id ? { id: f.receiver.id, screenname: f.receiver.screenname } : { id: f.requester.id, screenname: f.requester.screenname }
        ));
      }
      setLoading(false);
    };
    fetchFriends();
  }, []);

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    const { error } = await supabase.from("shared_items").insert({
      sender_id: session.user.id,
      receiver_id: selected.id,
      item_type: itemType,
      item_data: item,
      message: message.trim() || null,
    });
    if (error) { showToast?.("Failed to send - try again."); setSending(false); return; }
    sendNotification(selected.id, "inbox", session.user.id, session.user.id, `@${profile?.screenname || "Someone"} sent you a ${itemType}`);
    showToast?.(`Sent to @${selected.screenname}!`);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", padding: "32px 28px", width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--text)" }}>Send to Friend</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted3)", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
          {itemType === "bean" ? `Bean - ${item.name || item.brand || "Unnamed"}` : `Recipe - ${item.name || "Unnamed"}`}
        </div>

        {loading ? (
          <div style={{ fontSize: 13, color: "var(--muted3)", padding: "20px 0" }}>Loading friends...</div>
        ) : friends.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted3)", padding: "20px 0", fontStyle: "italic" }}>
            You don't have any friends yet. Add friends using your friend code in the Profile tab!
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {friends.map(f => (
                <button key={f.id} onClick={() => setSelected(f)}
                  style={{ padding: "12px 16px", background: selected?.id === f.id ? "var(--gold-dim)" : "var(--bg3)",
                    border: `1px solid ${selected?.id === f.id ? "var(--gold)" : "var(--border)"}`,
                    color: selected?.id === f.id ? "var(--gold)" : "var(--text)", cursor: "pointer",
                    textAlign: "left", fontSize: 14, fontFamily: "'Jost', sans-serif", transition: "all 0.15s" }}>
                  @{f.screenname}
                </button>
              ))}
            </div>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Add a message (optional)" maxLength={200} rows={2}
              style={{ width: "100%", padding: "10px 14px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 13, fontFamily: "'Jost',sans-serif", boxSizing: "border-box", resize: "none", marginBottom: 16 }} />
            <button className="btn-primary" onClick={handleSend} disabled={!selected || sending}
              style={{ width: "100%", opacity: !selected || sending ? 0.5 : 1 }}>
              {sending ? "Sending..." : "Send"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// --- Inbox Modal -------------------------------------------------------------
function InboxModal({ session, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInbox = async () => {
      const { data } = await supabase
        .from("shared_items")
        .select("*, sender:sender_id(screenname)")
        .eq("receiver_id", session.user.id)
        .order("created_at", { ascending: false });
      if (data) setItems(data);
      setLoading(false);
      // Mark all as read
      await supabase.from("shared_items").update({ read: true }).eq("receiver_id", session.user.id).eq("read", false);
    };
    fetchInbox();
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", width: "100%", maxWidth: 480, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--text)" }}>Inbox</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted3)", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: 24, fontSize: 13, color: "var(--muted3)" }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: "var(--muted3)", fontStyle: "italic" }}>Nothing here yet - when friends send you beans or recipes they'll appear here.</div>
          ) : (
            items.map(item => (
              <div key={item.id} style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: item.read ? "transparent" : "var(--bg3)" }}>
                {item.item_type === "message" ? (
                  // Welcome / system message
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ fontSize: 10, color: "var(--gold)", letterSpacing: 1.5, textTransform: "uppercase" }}>
                        Message from Craft & Cup
                      </div>
                      <div style={{ fontSize: 10, color: "var(--muted3)" }}>{formatDate(item.created_at)}</div>
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--text)", marginBottom: 10 }}>
                      {item.item_data?.subject || "Welcome"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted2)", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                      {item.item_data?.body}
                    </div>
                    {!item.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", marginTop: 8 }} />}
                  </>
                ) : (
                  // Bean or recipe shared by a friend
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ fontSize: 10, color: "var(--gold)", letterSpacing: 1.5, textTransform: "uppercase" }}>
                        {item.item_type === "bean" ? "Bean" : "Recipe"} from @{item.sender?.screenname}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--muted3)" }}>{formatDate(item.created_at)}</div>
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--text)", marginBottom: 4 }}>
                      {item.item_data?.name || item.item_data?.brand || "Unnamed"}
                    </div>
                    {item.item_data?.origin && <div style={{ fontSize: 11, color: "var(--muted3)", marginBottom: 6 }}>{item.item_data.origin}</div>}
                    {item.message && <div style={{ fontSize: 12, color: "var(--muted2)", fontStyle: "italic", marginTop: 6 }}>"{item.message}"</div>}
                    {!item.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", marginTop: 8 }} />}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// --- Activity Feed Page ------------------------------------------------------
// --- Profanity filter --------------------------------------------------------
const PROFANITY_LIST = ["fuck","shit","cunt","nigger","nigga","faggot","fag","asshole","bitch","cock","pussy","dick","bastard","whore","slut","retard","spic","kike","chink","twat","wanker","piss","crap","damn","ass"];
const containsProfanity = (text) => {
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  return PROFANITY_LIST.some(w => new RegExp(`\\b${w}\\b`).test(lower));
};

// --- Comments Section --------------------------------------------------------
function CommentsSection({ activityId, session, profile }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");
  const [reportedIds, setReportedIds] = useState(new Set());
  const cooldownRef = useRef(null);

  const fetchComments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("comments")
      .select("*, profile:user_id(screenname)")
      .eq("activity_id", activityId)
      .order("created_at", { ascending: true });
    if (data) setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    if (expanded) fetchComments();
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [expanded]);

  const startCooldown = () => {
    setCooldown(5);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePost = async () => {
    if (!session) return;
    const content = text.trim();
    if (!content) return;
    if (content.length > 280) { setError("Comments must be 280 characters or less."); return; }
    if (containsProfanity(content)) { setError("Your comment contains language that isn't allowed. Please revise it."); return; }
    setError("");
    setPosting(true);
    const { data, error: err } = await supabase.from("comments").insert({
      activity_id: activityId,
      user_id: session.user.id,
      content,
    }).select("*, profile:user_id(screenname)").single();
    if (err) { setError("Failed to post - try again."); setPosting(false); return; }
    setComments(prev => [...prev, data]);
    setText("");
    setPosting(false);
    startCooldown();
    // Notify activity owner
    const { data: act } = await supabase.from("activity").select("user_id").eq("id", activityId).single();
    if (act) sendNotification(act.user_id, "comment", session.user.id, activityId, `@${profile?.screenname} commented on your post`);
  };

  const handleEdit = async (id) => {
    const content = editText.trim();
    if (!content) return;
    if (content.length > 280) { setError("Comments must be 280 characters or less."); return; }
    if (containsProfanity(content)) { setError("Your comment contains language that isn't allowed."); return; }
    setError("");
    await supabase.from("comments").update({ content, is_edited: true, edited_at: new Date().toISOString() }).eq("id", id);
    setComments(prev => prev.map(c => c.id === id ? { ...c, content, is_edited: true } : c));
    setEditingId(null);
    setEditText("");
  };

  const handleDelete = async (id) => {
    await supabase.from("comments").update({ is_deleted: true, content: "" }).eq("id", id);
    setComments(prev => prev.map(c => c.id === id ? { ...c, is_deleted: true, content: "" } : c));
  };

  const handleReport = async (commentId) => {
    if (!session || reportedIds.has(commentId)) return;
    await supabase.from("reports").insert({ reporter_id: session.user.id, comment_id: commentId, reason: "user_report" });
    setReportedIds(prev => new Set([...prev, commentId]));
  };

  const formatDate = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const visibleCount = comments.length;

  return (
    <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
      <button onClick={() => setExpanded(e => !e)}
        style={{ background: "none", border: "none", color: "var(--muted3)", fontSize: 11, letterSpacing: 1, cursor: "pointer", fontFamily: "'Jost',sans-serif", padding: 0, textTransform: "uppercase" }}>
        {expanded ? "Hide" : `Comments${visibleCount > 0 ? ` (${visibleCount})` : ""}`}
      </button>

      {expanded && (
        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div style={{ fontSize: 12, color: "var(--muted3)", padding: "8px 0" }}>Loading...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              {comments.length === 0 && <div style={{ fontSize: 12, color: "var(--muted3)", fontStyle: "italic" }}>No comments yet - be the first!</div>}
              {comments.map(c => (
                <div key={c.id} style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--gold-dim)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--gold)", fontFamily: "'Cormorant Garamond',serif", flexShrink: 0 }}>
                    {c.is_deleted ? "?" : (c.profile?.screenname?.[0]?.toUpperCase() || "?")}
                  </div>
                  <div style={{ flex: 1 }}>
                    {c.is_deleted ? (
                      <div style={{ fontSize: 12, color: "var(--muted3)", fontStyle: "italic" }}>[comment deleted]</div>
                    ) : editingId === c.id ? (
                      <div>
                        <textarea value={editText} onChange={e => setEditText(e.target.value)} maxLength={280} rows={2}
                          style={{ width: "100%", padding: "8px 10px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 12, fontFamily: "'Jost',sans-serif", boxSizing: "border-box", resize: "none" }} />
                        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                          <button onClick={() => handleEdit(c.id)} className="btn-primary" style={{ fontSize: 10, padding: "4px 10px" }}>Save</button>
                          <button onClick={() => { setEditingId(null); setEditText(""); }} className="btn-ghost" style={{ fontSize: 10, padding: "4px 10px" }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 500 }}>@{c.profile?.screenname}</span>
                          <span style={{ fontSize: 10, color: "var(--muted3)" }}>{formatDate(c.created_at)}</span>
                          {c.is_edited && <span style={{ fontSize: 9, color: "var(--muted3)", fontStyle: "italic" }}>edited</span>}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{c.content}</div>
                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                          {session?.user?.id === c.user_id && (
                            <>
                              <button onClick={() => { setEditingId(c.id); setEditText(c.content); }}
                                style={{ background: "none", border: "none", color: "var(--muted3)", fontSize: 10, cursor: "pointer", padding: 0, letterSpacing: 0.5 }}>Edit</button>
                              <button onClick={() => handleDelete(c.id)}
                                style={{ background: "none", border: "none", color: "#d06860", fontSize: 10, cursor: "pointer", padding: 0, letterSpacing: 0.5 }}>Delete</button>
                            </>
                          )}
                          {session && session?.user?.id !== c.user_id && (
                            <button onClick={() => handleReport(c.id)}
                              style={{ background: "none", border: "none", color: reportedIds.has(c.id) ? "var(--muted3)" : "var(--muted3)", fontSize: 10, cursor: reportedIds.has(c.id) ? "default" : "pointer", padding: 0, letterSpacing: 0.5 }}>
                              {reportedIds.has(c.id) ? "Reported" : "Report"}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {session ? (
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--gold-dim)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--gold)", fontFamily: "'Cormorant Garamond',serif", flexShrink: 0, marginTop: 2 }}>
                  {profile?.screenname?.[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <textarea value={text} onChange={e => { setText(e.target.value); setError(""); }} maxLength={280} rows={2} placeholder="Write a comment..."
                    style={{ width: "100%", padding: "8px 10px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 12, fontFamily: "'Jost',sans-serif", boxSizing: "border-box", resize: "none" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: text.length > 250 ? "#d06860" : "var(--muted3)" }}>{text.length}/280</span>
                    <button onClick={handlePost} disabled={posting || cooldown > 0 || !text.trim()} className="btn-primary"
                      style={{ fontSize: 11, padding: "6px 14px", opacity: posting || cooldown > 0 || !text.trim() ? 0.5 : 1 }}>
                      {cooldown > 0 ? `Wait ${cooldown}s` : posting ? "Posting..." : "Post"}
                    </button>
                  </div>
                  {error && <div style={{ fontSize: 11, color: "#d06860", marginTop: 4 }}>{error}</div>}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--muted3)", fontStyle: "italic" }}>Sign in to leave a comment.</div>
          )}
        </div>
      )}
    </div>
  );
}

function FeedPage({ session, profile }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myReactions, setMyReactions] = useState({});

  const REACTIONS = [
    { key: "love", emoji: "☕", label: "Love it" },
    { key: "want_to_try", emoji: "🌟", label: "Want to try" },
    { key: "interesting", emoji: "🫘", label: "Interesting" },
  ];

  useEffect(() => {
    const fetchFeed = async () => {
      const { data } = await supabase
        .from("activity")
        .select("*, profile:user_id(screenname), reactions(id, user_id, reaction)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setFeed(data);

      if (session) {
        const { data: myR } = await supabase.from("reactions").select("activity_id, reaction").eq("user_id", session.user.id);
        if (myR) {
          const map = {};
          myR.forEach(r => { map[r.activity_id] = r.reaction; });
          setMyReactions(map);
        }
      }
      setLoading(false);
    };
    fetchFeed();
  }, []);

  const handleReact = async (activityId, reaction) => {
    if (!session) return;
    const current = myReactions[activityId];
    if (current === reaction) {
      await supabase.from("reactions").delete().eq("user_id", session.user.id).eq("activity_id", activityId);
      setMyReactions(prev => { const n = { ...prev }; delete n[activityId]; return n; });
      setFeed(prev => prev.map(f => f.id === activityId ? { ...f, reactions: f.reactions.filter(r => r.user_id !== session.user.id) } : f));
    } else {
      await supabase.from("reactions").upsert({ user_id: session.user.id, activity_id: activityId, reaction }, { onConflict: "user_id,activity_id" });
      setMyReactions(prev => ({ ...prev, [activityId]: reaction }));
      setFeed(prev => prev.map(f => {
        if (f.id !== activityId) return f;
        const filtered = f.reactions.filter(r => r.user_id !== session.user.id);
        return { ...f, reactions: [...filtered, { user_id: session.user.id, reaction }] };
      }));
      const feedItem = feed.find(f => f.id === activityId);
      if (feedItem) sendNotification(feedItem.user_id, 'reaction', session.user.id, activityId, `@${profile?.screenname} reacted to your post`);
    }
  };

  const reactionCount = (item, key) => item.reactions?.filter(r => r.reaction === key).length || 0;

  const formatDate = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="page">
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "var(--text)", marginBottom: 4 }}>Friends Feed</div>
          <div style={{ fontSize: 12, color: "var(--muted3)" }}>What your friends are brewing and tasting</div>
        </div>

        {loading ? (
          <div style={{ fontSize: 13, color: "var(--muted3)", padding: "40px 0", textAlign: "center" }}>Loading feed...</div>
        ) : feed.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted3)", fontStyle: "italic", padding: "40px 0", textAlign: "center" }}>
            Nothing here yet - add friends and log beans to see activity!
          </div>
        ) : (
          feed.map(item => {
            const [expanded, setExpanded] = React.useState(false);
            return (
            <div key={item.id} style={{ border: "1px solid var(--border)", padding: "16px 20px", marginBottom: 8 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gold-dim)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--gold)", fontFamily: "'Cormorant Garamond', serif", flexShrink: 0 }}>
                    {item.profile?.screenname?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted2)" }}>
                    {item.profile?.screenname}
                    <span style={{ color: "var(--muted3)", marginLeft: 6, fontSize: 11 }}>
                      {item.type === "logged_bean" ? "logged a bean" : "saved a recipe"}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "var(--muted3)" }}>{formatDate(item.created_at)}</div>
              </div>

              {/* Content - compact */}
              <div style={{ cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
                {item.type === "logged_bean" && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--text)" }}>
                      {item.item_data?.name || item.item_data?.origin || "Unnamed Bean"}
                    </div>
                    {item.item_data?.origin && (
                      <div style={{ fontSize: 11, color: "var(--muted3)" }}>{item.item_data.roast}</div>
                    )}
                  </div>
                )}
                {item.type === "logged_recipe" && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--text)" }}>
                      {item.item_data?.name || "Unnamed Recipe"}
                    </div>
                    <div style={{ fontSize: 11, color: "#6ab0d4" }}>{item.item_data?.type}</div>
                  </div>
                )}

                {/* Expanded detail */}
                {expanded && (
                  <div style={{ marginTop: 10 }}>
                    {item.type === "logged_bean" && (
                      <>
                        {item.item_data?.brand && <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>{item.item_data.brand}</div>}
                        {item.item_data?.origin && <div style={{ fontSize: 12, color: "var(--muted3)", marginBottom: 8 }}>{item.item_data.origin} · {item.item_data.roast}</div>}
                        {item.item_data?.flavorData?.mappings?.length > 0 && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {[...new Set(item.item_data.flavorData.mappings.map(m => m.top))].slice(0, 4).map(top => {
                              const color = FLAVOR_TAXONOMY[top]?.color || "#888";
                              return <span key={top} style={{ fontSize: 10, padding: "2px 8px", border: `1px solid ${color}55`, color, background: color + "12" }}>{top}</span>;
                            })}
                          </div>
                        )}
                      </>
                    )}
                    {item.type === "logged_recipe" && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {item.item_data?.temp && <span style={{ fontSize: 10, padding: "2px 8px", border: "1px solid var(--border2)", color: "var(--muted2)" }}>{item.item_data.temp}</span>}
                        {item.item_data?.milkType && <span style={{ fontSize: 10, padding: "2px 8px", border: "1px solid var(--border2)", color: "var(--muted2)" }}>{item.item_data.milkType}</span>}
                        {item.item_data?.rating > 0 && <span style={{ fontSize: 10, padding: "2px 8px", border: "1px solid var(--border2)", color: "var(--gold)" }}>{item.item_data.rating}/10</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Expand hint */}
                <div style={{ fontSize: 10, color: "var(--muted3)", marginTop: 6, letterSpacing: 0.5 }}>
                  {expanded ? "▲ Less" : "▼ More"}
                </div>
              </div>

              {/* Reactions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, marginBottom: 4 }}>
                {REACTIONS.map(r => {
                  const count = reactionCount(item, r.key);
                  const isActive = myReactions[item.id] === r.key;
                  return (
                    <button key={r.key} onClick={() => handleReact(item.id, r.key)}
                      title={r.label}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                        background: isActive ? "var(--gold-dim)" : "var(--bg3)",
                        border: `1px solid ${isActive ? "var(--gold)" : "var(--border)"}`,
                        cursor: session ? "pointer" : "default", fontSize: 13, color: isActive ? "var(--gold)" : "var(--muted3)",
                        transition: "all 0.15s" }}>
                      {r.emoji} {count > 0 && <span style={{ fontSize: 11 }}>{count}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Comments */}
              <CommentsSection activityId={item.id} session={session} profile={profile} />
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// --- Discovery Page ----------------------------------------------------------
function DiscoveryPage({ session, profile, onViewProfile }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [myReactions, setMyReactions] = useState({});

  const REACTIONS = [
    { key: "love", emoji: "☕", label: "Love it" },
    { key: "want_to_try", emoji: "🌟", label: "Want to try" },
    { key: "interesting", emoji: "🫘", label: "Interesting" },
  ];

  useEffect(() => {
    const fetchDiscovery = async () => {
      const { data } = await supabase
        .from("activity")
        .select("*, profile:user_id(screenname), reactions(id, user_id, reaction)")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setFeed(data);

      if (session) {
        const { data: myR } = await supabase.from("reactions").select("activity_id, reaction").eq("user_id", session.user.id);
        if (myR) {
          const map = {};
          myR.forEach(r => { map[r.activity_id] = r.reaction; });
          setMyReactions(map);
        }
      }
      setLoading(false);
    };
    fetchDiscovery();
  }, []);

  const handleReact = async (activityId, reaction) => {
    if (!session) return;
    const current = myReactions[activityId];
    if (current === reaction) {
      await supabase.from("reactions").delete().eq("user_id", session.user.id).eq("activity_id", activityId);
      setMyReactions(prev => { const n = { ...prev }; delete n[activityId]; return n; });
      setFeed(prev => prev.map(f => f.id === activityId ? { ...f, reactions: f.reactions.filter(r => r.user_id !== session.user.id) } : f));
    } else {
      await supabase.from("reactions").upsert({ user_id: session.user.id, activity_id: activityId, reaction }, { onConflict: "user_id,activity_id" });
      setMyReactions(prev => ({ ...prev, [activityId]: reaction }));
      setFeed(prev => prev.map(f => {
        if (f.id !== activityId) return f;
        const filtered = f.reactions.filter(r => r.user_id !== session.user.id);
        return { ...f, reactions: [...filtered, { user_id: session.user.id, reaction }] };
      }));
    }
  };

  const reactionCount = (item, key) => item.reactions?.filter(r => r.reaction === key).length || 0;

  const formatDate = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const filtered = feed.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.profile?.screenname?.toLowerCase().includes(q) ||
      item.item_data?.name?.toLowerCase().includes(q) ||
      item.item_data?.brand?.toLowerCase().includes(q) ||
      item.item_data?.origin?.toLowerCase().includes(q)
    );
  });

  const FeedItem = ({ item }) => (
    <div style={{ border: "1px solid var(--border)", padding: 20, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gold-dim)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--gold)", fontFamily: "'Cormorant Garamond', serif", cursor: "pointer" }}
            onClick={() => onViewProfile?.(item.profile?.screenname)}>
            {item.profile?.screenname?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--gold)", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => onViewProfile?.(item.profile?.screenname)}>@{item.profile?.screenname}</div>
            <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1 }}>
              {item.type === "logged_bean" ? "logged a bean" : "saved a recipe"}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted3)" }}>{formatDate(item.created_at)}</div>
      </div>

      {item.type === "logged_bean" && (
        <div style={{ borderLeft: "3px solid var(--gold-dim)", paddingLeft: 14, marginBottom: 12 }}>
          {item.item_data?.brand && <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>{item.item_data.brand}</div>}
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--text)" }}>{item.item_data?.name || item.item_data?.origin || "Unnamed Bean"}</div>
          {item.item_data?.origin && <div style={{ fontSize: 11, color: "var(--muted3)", marginTop: 2 }}>{item.item_data.origin} · {item.item_data.roast}</div>}
          {item.item_data?.flavorData?.mappings?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {[...new Set(item.item_data.flavorData.mappings.map(m => m.top))].slice(0, 4).map(top => {
                const color = FLAVOR_TAXONOMY[top]?.color || "#888";
                return <span key={top} style={{ fontSize: 10, padding: "2px 8px", border: `1px solid ${color}55`, color, background: color + "12" }}>{top}</span>;
              })}
            </div>
          )}
        </div>
      )}

      {item.type === "logged_recipe" && (
        <div style={{ borderLeft: "3px solid #6ab0d4", paddingLeft: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#6ab0d4", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>{item.item_data?.type || "Recipe"} · {item.item_data?.temp || ""}</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--text)" }}>{item.item_data?.name || "Unnamed Recipe"}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {item.item_data?.milkType && <span style={{ fontSize: 10, padding: "2px 8px", border: "1px solid var(--border2)", color: "var(--muted2)" }}>{item.item_data.milkType}</span>}
            {item.item_data?.rating > 0 && <span style={{ fontSize: 10, padding: "2px 8px", border: "1px solid var(--border2)", color: "var(--gold)" }}>{item.item_data.rating}/10</span>}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
        {REACTIONS.map(r => {
          const count = reactionCount(item, r.key);
          const isActive = myReactions[item.id] === r.key;
          return (
            <button key={r.key} onClick={() => handleReact(item.id, r.key)} title={r.label}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                background: isActive ? "var(--gold-dim)" : "var(--bg3)",
                border: `1px solid ${isActive ? "var(--gold)" : "var(--border)"}`,
                cursor: session ? "pointer" : "default", fontSize: 13,
                color: isActive ? "var(--gold)" : "var(--muted3)", transition: "all 0.15s" }}>
              {r.emoji} {count > 0 && <span style={{ fontSize: 11 }}>{count}</span>}
            </button>
          );
        })}
      </div>
      <CommentsSection activityId={item.id} session={session} profile={profile} />
    </div>
  );

  return (
    <div className="page">
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "var(--text)", marginBottom: 4 }}>Discovery</div>
          <div style={{ fontSize: 12, color: "var(--muted3)" }}>Public beans and recipes from the Craft & Cup community</div>
        </div>

        <div style={{ position: "relative", marginBottom: 20 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, origin, roaster, or user..."
            style={{ width: "100%", padding: "10px 14px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 13, fontFamily: "'Jost',sans-serif", boxSizing: "border-box" }} />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted3)", cursor: "pointer", fontSize: 14 }}>✕</button>}
        </div>

        {loading ? (
          <div style={{ fontSize: 13, color: "var(--muted3)", padding: "40px 0", textAlign: "center" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted3)", fontStyle: "italic", padding: "40px 0", textAlign: "center" }}>
            {search ? "No results found." : "Nothing public yet - be the first to share!"}
          </div>
        ) : (
          filtered.map(item => <FeedItem key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

// --- Collections Page --------------------------------------------------------
function CollectionsPage({ session, beans, onNeedAuth }) {
  const COLLECTIONS_KEY = "craft_and_cup_collections_v1";
  const [collections, setCollections] = useState([]);
  const [view, setView] = useState("list");
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", is_public: false, beans: [] });
  const [error, setError] = useState("");
  const [beanPicker, setBeanPicker] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const colToRow = (col, userId) => ({
    user_id: userId,
    name: col.name,
    description: col.description || null,
    is_public: col.is_public || false,
    beans: col.beans || [],
  });

  const rowToCol = (row) => ({
    id: row.id,
    supabase_id: row.id,
    name: row.name || "",
    description: row.description || "",
    is_public: row.is_public || false,
    beans: row.beans || [],
    createdAt: row.created_at,
  });

  useEffect(() => {
    const loadCollections = async () => {
      if (session) {
        setSyncing(true);
        const { data: rows } = await supabase.from("collections").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
        if (rows && rows.length > 0) {
          setCollections(rows.map(rowToCol));
          localStorage.removeItem(COLLECTIONS_KEY);
        } else {
          // Migrate from localStorage
          const localStr = localStorage.getItem(COLLECTIONS_KEY);
          const localCols = localStr ? JSON.parse(localStr) : [];
          if (localCols.length > 0) {
            const { data: migrated } = await supabase.from("collections").insert(localCols.map(c => colToRow(c, session.user.id))).select();
            if (migrated) {
              setCollections(migrated.map(rowToCol));
              localStorage.removeItem(COLLECTIONS_KEY);
            }
          } else {
            setCollections([]);
          }
        }
        setSyncing(false);
      } else {
        try {
          const s = localStorage.getItem(COLLECTIONS_KEY);
          setCollections(s ? JSON.parse(s) : []);
        } catch { setCollections([]); }
      }
    };
    loadCollections();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session) {
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
    }
  }, [collections, session]);

  const saveCollection = async () => {
    if (!form.name.trim()) { setError("Give your collection a name."); return; }
    if (!session) { onNeedAuth?.(); return; }
    setError("");

    if (form.supabase_id) {
      // Update existing
      await supabase.from("collections").update({ name: form.name, description: form.description, is_public: form.is_public, beans: form.beans, updated_at: new Date().toISOString() }).eq("id", form.supabase_id);
      const updated = { ...form };
      setCollections(prev => prev.map(c => c.id === updated.id ? updated : c));
      setActive(updated);
      setView("detail");
    } else {
      // Insert new
      const { data: inserted } = await supabase.from("collections").insert(colToRow(form, session.user.id)).select().single();
      if (inserted) {
        const saved = rowToCol(inserted);
        setCollections(prev => [saved, ...prev]);
        setActive(saved);
        setView("detail");
      }
    }
  };

  const deleteCollection = async (id) => {
    const col = collections.find(c => c.id === id);
    if (session && col?.supabase_id) {
      await supabase.from("collections").delete().eq("id", col.supabase_id);
    }
    setCollections(p => p.filter(c => c.id !== id));
    setView("list");
  };

  const toggleBean = (bean) => {
    const exists = form.beans.find(b => b.id === bean.id);
    setForm(f => ({ ...f, beans: exists ? f.beans.filter(b => b.id !== bean.id) : [...f.beans, { id: bean.id, brand: bean.brand, name: bean.name, origin: bean.origin, roast: bean.roast }] }));
  };

  if (view === "add") return (
    <div className="page">
      <div className="form-header">
        <button className="btn-ghost" onClick={() => setView(active ? "detail" : "list")}>← Back</button>
        <h2 className="form-title">{form.id ? "Edit Collection" : "New Collection"}</h2>
      </div>
      <div style={{ maxWidth: 560 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1, marginBottom: 6 }}>COLLECTION NAME</div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={50}
            style={{ width: "100%", padding: "10px 14px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 14, fontFamily: "'Jost',sans-serif", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1, marginBottom: 6 }}>DESCRIPTION <span style={{ color: "var(--muted3)" }}>(optional)</span></div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={200} rows={2}
            style={{ width: "100%", padding: "10px 14px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 13, fontFamily: "'Jost',sans-serif", boxSizing: "border-box", resize: "none" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1, marginBottom: 10 }}>BEANS ({form.beans.length})</div>
          {form.beans.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {form.beans.map(b => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg3)", border: "1px solid var(--border)" }}>
                  <div>
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{b.name || b.brand || "Unnamed"}</span>
                    {b.origin && <span style={{ fontSize: 11, color: "var(--muted3)", marginLeft: 8 }}>{b.origin}</span>}
                  </div>
                  <button onClick={() => toggleBean(b)} style={{ background: "none", border: "none", color: "var(--muted3)", cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <button className="btn-ghost" onClick={() => setBeanPicker(true)} style={{ fontSize: 11 }}>+ Add Beans from Journal</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <input type="checkbox" id="col-public" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--gold)", margin: 0 }} />
          <label htmlFor="col-public" style={{ fontSize: 12, color: "var(--muted2)", cursor: "pointer", margin: 0 }}>Make this collection public</label>
        </div>
        {error && <div style={{ fontSize: 12, color: "#d06860", marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={saveCollection}>Save Collection</button>
          <button className="btn-ghost" onClick={() => setView(active ? "detail" : "list")}>Cancel</button>
        </div>
      </div>

      {/* Bean Picker Modal */}
      {beanPicker && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => e.target === e.currentTarget && setBeanPicker(false)}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", width: "100%", maxWidth: 480, maxHeight: "70vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20 }}>Select Beans</span>
              <button onClick={() => setBeanPicker(false)} style={{ background: "none", border: "none", color: "var(--muted3)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {beans.length === 0 ? (
                <div style={{ padding: 20, fontSize: 13, color: "var(--muted3)", fontStyle: "italic" }}>No beans in your journal yet.</div>
              ) : beans.map(b => {
                const selected = form.beans.find(fb => fb.id === b.id);
                return (
                  <div key={b.id} onClick={() => toggleBean(b)} style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: selected ? "var(--bg3)" : "transparent" }}>
                    <div>
                      <div style={{ fontSize: 14, color: "var(--text)" }}>{b.name || b.brand || "Unnamed"}</div>
                      {b.origin && <div style={{ fontSize: 11, color: "var(--muted3)" }}>{b.origin}</div>}
                    </div>
                    {selected && <span style={{ color: "var(--gold)", fontSize: 16 }}>✓</span>}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
              <button className="btn-primary" onClick={() => setBeanPicker(false)} style={{ width: "100%" }}>Done ({form.beans.length} selected)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (view === "detail" && active) {
    const col = collections.find(c => c.id === active.id) || active;
    return (
      <div className="page">
        <div className="form-header">
          <button className="btn-ghost" onClick={() => setView("list")}>← Back</button>
        </div>
        <div style={{ maxWidth: 560 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "var(--text)", marginBottom: 4 }}>{col.name}</div>
            {col.description && <div style={{ fontSize: 13, color: "var(--muted2)", fontStyle: "italic" }}>{col.description}</div>}
            <div style={{ fontSize: 11, color: "var(--muted3)", marginTop: 6 }}>{col.is_public ? "Public collection" : "Private collection"} · {col.beans?.length || 0} beans</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
            {col.beans?.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--muted3)", fontStyle: "italic" }}>No beans in this collection yet.</div>
            ) : col.beans?.map(b => (
              <div key={b.id} style={{ padding: "12px 16px", border: "1px solid var(--border)", background: "var(--bg2)" }}>
                <div style={{ fontSize: 14, color: "var(--text)" }}>{b.name || b.brand || "Unnamed"}</div>
                {b.origin && <div style={{ fontSize: 11, color: "var(--muted3)", marginTop: 2 }}>{b.origin} · {b.roast}</div>}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={() => { setForm(col); setView("add"); }}>Edit</button>
            <button className="btn-danger" onClick={() => deleteCollection(col.id)}>Delete</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "var(--text)", marginBottom: 4 }}>Collections</div>
          <div style={{ fontSize: 12, color: "var(--muted3)" }}>{syncing ? "Syncing..." : "Curate your beans into named groups"}</div>
        </div>
        <button className="btn-primary" onClick={() => { setForm({ name: "", description: "", is_public: false, beans: [] }); setActive(null); setView("add"); }} style={{ fontSize: 11, letterSpacing: 1 }}>+ New</button>
      </div>
      {collections.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--muted3)", fontStyle: "italic", padding: "40px 0", textAlign: "center" }}>
          No collections yet - create one to group your beans!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {collections.map(col => (
            <div key={col.id} onClick={() => { setActive(col); setView("detail"); }} style={{ padding: "16px 20px", border: "1px solid var(--border)", cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border3)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--text)", marginBottom: 4 }}>{col.name}</div>
                  {col.description && <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 6 }}>{col.description}</div>}
                  <div style={{ fontSize: 11, color: "var(--muted3)" }}>{col.beans?.length || 0} beans · {col.is_public ? "Public" : "Private"}</div>
                </div>
                <span style={{ fontSize: 18, color: "var(--muted3)" }}>›</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Notifications Panel -----------------------------------------------------
function NotificationsPanel({ session, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*, actor:actor_id(screenname)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (data) setNotifications(data);
      setLoading(false);
      // Mark all as read
      await supabase.from("notifications").update({ read: true }).eq("user_id", session.user.id).eq("read", false);
    };
    fetch();
  }, []);

  const formatDate = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const typeIcon = (type) => {
    if (type === "reaction") return "☕";
    if (type === "comment") return "◈";
    if (type === "friend_request") return "✦";
    if (type === "friend_accepted") return "✓";
    if (type === "inbox") return "✉";
    return "◎";
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", width: "100%", maxWidth: 440, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--text)" }}>Notifications</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted3)", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: 24, fontSize: 13, color: "var(--muted3)" }}>Loading...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: "var(--muted3)", fontStyle: "italic" }}>No notifications yet.</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", background: n.read ? "transparent" : "var(--bg3)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, color: "var(--gold)", flexShrink: 0, marginTop: 2 }}>{typeIcon(n.type)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: "var(--muted3)", marginTop: 4 }}>{formatDate(n.created_at)}</div>
                </div>
                {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", flexShrink: 0, marginTop: 6 }} />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// --- Public Profile Page -----------------------------------------------------
function PublicProfilePage({ screenname, session, currentProfile, onAddFriend, onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState(null); // null, pending, accepted
  const [addMsg, setAddMsg] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("screenname", screenname).single();
      if (!p) { setLoading(false); return; }
      setProfile(p);

      // Get public activity
      const { data: acts } = await supabase
        .from("activity")
        .select("*, reactions(id, user_id, reaction)")
        .eq("user_id", p.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (acts) setActivity(acts);

      // Check friendship status
      if (session) {
        const { data: fs } = await supabase.from("friendships")
          .select("status")
          .or(`and(requester_id.eq.${session.user.id},receiver_id.eq.${p.id}),and(requester_id.eq.${p.id},receiver_id.eq.${session.user.id})`)
          .single();
        if (fs) setFriendStatus(fs.status);
      }
      setLoading(false);
    };
    fetch();
  }, [screenname]);

  const handleAddFriend = async () => {
    if (!session || !profile) return;
    const { error } = await supabase.from("friendships").insert({ requester_id: session.user.id, receiver_id: profile.id });
    if (error) { setAddMsg("Could not send request."); return; }
    sendNotification(profile.id, "friend_request", session.user.id, session.user.id, `@${currentProfile?.screenname} sent you a friend request`);
    setFriendStatus("pending");
    setAddMsg("Friend request sent!");
    setTimeout(() => setAddMsg(""), 3000);
  };

  const formatDate = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const isOwnProfile = session?.user?.id === profile?.id;

  if (loading) return <div className="page"><div style={{ fontSize: 13, color: "var(--muted3)", padding: "40px 0", textAlign: "center" }}>Loading...</div></div>;
  if (!profile) return <div className="page"><div style={{ fontSize: 13, color: "var(--muted3)", padding: "40px 0", textAlign: "center" }}>Profile not found.</div></div>;

  return (
    <div className="page">
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <button className="btn-ghost" onClick={() => onNavigate("discovery")} style={{ marginBottom: 24 }}>← Discovery</button>

        {/* Profile header */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, padding: "24px", border: "1px solid var(--border)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--gold-dim)", border: "2px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "var(--gold)", fontFamily: "'Cormorant Garamond', serif", flexShrink: 0 }}>
            {profile.screenname?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--text)" }}>@{profile.screenname}</div>
            {profile.bio && <div style={{ fontSize: 13, color: "var(--muted2)", marginTop: 4, fontStyle: "italic" }}>{profile.bio}</div>}
          </div>
          {session && !isOwnProfile && (
            <div>
              {friendStatus === "accepted" ? (
                <span style={{ fontSize: 11, color: "var(--green)", letterSpacing: 1 }}>FRIENDS</span>
              ) : friendStatus === "pending" ? (
                <span style={{ fontSize: 11, color: "var(--muted3)", letterSpacing: 1 }}>PENDING</span>
              ) : (
                <button className="btn-primary" onClick={handleAddFriend} style={{ fontSize: 11, padding: "8px 16px" }}>+ Add Friend</button>
              )}
              {addMsg && <div style={{ fontSize: 11, color: "var(--green)", marginTop: 6 }}>{addMsg}</div>}
            </div>
          )}
          {isOwnProfile && (
            <button className="btn-ghost" onClick={() => onNavigate("profile")} style={{ fontSize: 11 }}>Edit Profile</button>
          )}
        </div>

        {/* Public activity */}
        <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Public Posts ({activity.length})</div>
        {activity.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted3)", fontStyle: "italic" }}>No public posts yet.</div>
        ) : (
          activity.map(item => (
            <div key={item.id} style={{ border: "1px solid var(--border)", padding: 16, marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "var(--muted3)", marginBottom: 8 }}>
                {item.type === "logged_bean" ? "Bean" : "Recipe"} · {formatDate(item.created_at)}
              </div>
              {item.type === "logged_bean" && (
                <div style={{ borderLeft: "3px solid var(--gold-dim)", paddingLeft: 12 }}>
                  {item.item_data?.brand && <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1.5, textTransform: "uppercase" }}>{item.item_data.brand}</div>}
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--text)" }}>{item.item_data?.name || item.item_data?.origin || "Unnamed Bean"}</div>
                  {item.item_data?.origin && <div style={{ fontSize: 11, color: "var(--muted3)" }}>{item.item_data.origin} · {item.item_data.roast}</div>}
                  {item.item_data?.flavorData?.mappings?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                      {[...new Set(item.item_data.flavorData.mappings.map(m => m.top))].slice(0, 4).map(top => {
                        const color = FLAVOR_TAXONOMY[top]?.color || "#888";
                        return <span key={top} style={{ fontSize: 10, padding: "2px 8px", border: `1px solid ${color}55`, color, background: color + "12" }}>{top}</span>;
                      })}
                    </div>
                  )}
                </div>
              )}
              {item.type === "logged_recipe" && (
                <div style={{ borderLeft: "3px solid #6ab0d4", paddingLeft: 12 }}>
                  <div style={{ fontSize: 10, color: "#6ab0d4", letterSpacing: 1.5, textTransform: "uppercase" }}>{item.item_data?.type} · {item.item_data?.temp}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--text)" }}>{item.item_data?.name}</div>
                  {item.item_data?.rating > 0 && <div style={{ fontSize: 11, color: "var(--gold)" }}>{item.item_data.rating}/10</div>}
                </div>
              )}
              <div style={{ fontSize: 11, color: "var(--muted3)", marginTop: 8 }}>
                {item.reactions?.length > 0 && `${item.reactions.length} reaction${item.reactions.length !== 1 ? "s" : ""}`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AuthModal({ onClose }) {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/auth/callback" } });
  };
  const signInWithDiscord = async () => {
    await supabase.auth.signInWithOAuth({ provider: "discord", options: { redirectTo: window.location.origin + "/auth/callback" } });
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", padding: "40px 36px", width: "100%", maxWidth: 400, textAlign: "center" }}>
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, color: "var(--gold)", marginBottom: 6 }}>Craft & Cup</div>
        <div style={{ fontSize: 12, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Sign in to save your collection</div>
        <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 24, fontStyle: "italic" }}>Don't worry - everything you've typed is still here.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={signInWithGoogle} style={{ padding: "13px 20px", background: "#fff", color: "#000", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 10, justifyContent: "center", width: "100%" }}>Continue with Google</button>
          <button onClick={signInWithDiscord} style={{ padding: "13px 20px", background: "#5865F2", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 10, justifyContent: "center", width: "100%" }}>Continue with Discord</button>
        </div>
        <button onClick={onClose} style={{ marginTop: 24, background: "none", border: "none", color: "var(--muted3)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>Continue without signing in</button>
      </div>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState("home");
  const [calcMethod, setCalcMethod] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); };

  const [session, setSession] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [needsScreenname, setNeedsScreenname] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [publicProfileScreenname, setPublicProfileScreenname] = useState(null);

  const fetchUnread = async (userId) => {
    const { count } = await supabase.from("shared_items").select("*", { count: "exact", head: true }).eq("receiver_id", userId).eq("read", false);
    setUnreadCount(count || 0);
    const { count: notifCount } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("read", false);
    setUnreadNotifCount(notifCount || 0);
  };

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) { setProfile(data); setNeedsScreenname(false); }
    else { setNeedsScreenname(true); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { fetchProfile(session.user.id); fetchUnread(session.user.id); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) { fetchProfile(session.user.id); fetchUnread(session.user.id); }
      else { setProfile(null); setNeedsScreenname(false); setUnreadCount(0); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); setSession(null); setProfile(null); setNeedsScreenname(false); setUnreadCount(0); setUnreadNotifCount(0); showToast("You've been signed out."); };

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

  const handleBrewCalc = (method) => { setCalcMethod(method); setTab("brew"); };
  const handleNavigate = (t) => {
    setTab(t);
    setPublicProfileScreenname(null);
    if (t !== "recipes") { setRecipeView("list"); setRecipeActive(null); }
    if (t !== "journal") { setJournalView("list"); setJournalActiveBean(null); }
  };

  const [journalTrigger, setJournalTrigger] = useState(0);
  const handleAddBean = () => { setTab("journal"); setJournalTrigger((n) => n + 1); };
  const [recipeTrigger, setRecipeTrigger] = useState(0);
  const handleAddRecipe = () => { setTab("recipes"); setRecipeTrigger((n) => n + 1); };
  const [journalShareTrigger, setJournalShareTrigger] = useState(0);
  const [recipeShareTrigger, setRecipeShareTrigger] = useState(0);
  const [journalView, setJournalView] = useState("list");
  const [journalActiveBean, setJournalActiveBean] = useState(null);
  const [recipeView, setRecipeView] = useState("list");
  const [recipeActive, setRecipeActive] = useState(null);

  const FAB_STYLE = {
    position: "fixed", bottom: 28, right: 24, zIndex: 90,
    background: "var(--gold)", color: "var(--bg)",
    border: "none", padding: "12px 22px",
    fontFamily: "'Jost', sans-serif", fontSize: 11,
    fontWeight: 500, letterSpacing: 2, textTransform: "uppercase",
    cursor: "pointer", boxShadow: "0 4px 20px rgba(201,168,76,0.35)",
    transition: "background 0.18s",
  };

  const SHARE_FAB_STYLE = {
    ...FAB_STYLE,
    background: "var(--bg2)", color: "var(--gold)",
    border: "1px solid var(--gold)",
    boxShadow: "0 4px 20px rgba(201,168,76,0.15)",
  };

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

    /* Mobile bottom nav */
    .mobile-bottom-nav {
      display: none;
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: var(--bg2); border-bottom: 1px solid var(--border2);
      padding: 0; padding-top: env(safe-area-inset-top, 0px);
    }
    .mobile-bottom-nav-inner {
      display: flex; align-items: stretch;
    }
    .mobile-nav-btn {
      flex: 1; background: none; border: none; padding: 10px 4px;
      color: var(--muted3); font-family: 'Jost', sans-serif; font-size: 10px;
      font-weight: 400; letter-spacing: 1.5px; text-transform: uppercase;
      cursor: pointer; transition: color 0.2s; display: flex; flex-direction: column;
      align-items: center; gap: 0; position: relative;
      border-bottom: 2px solid transparent;
    }
    .mobile-nav-btn.active { color: var(--gold); border-bottom-color: var(--gold); }
    .mobile-nav-btn-icon { display: none; }
    .mobile-drawer-overlay {
      position: fixed; inset: 0; z-index: 150; background: rgba(0,0,0,0.7);
      display: flex; align-items: flex-end;
    }
    .mobile-drawer {
      background: var(--bg2); border-top: 1px solid var(--border2);
      width: 100%; padding: 20px 0; padding-bottom: env(safe-area-inset-bottom, 20px);
    }
    .mobile-drawer-item {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 24px; background: none; border: none; width: 100%;
      color: var(--muted2); font-family: 'Jost', sans-serif; font-size: 12px;
      letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer;
      text-align: left; transition: color 0.15s;
    }
    .mobile-drawer-item:hover { color: var(--gold); }
    .mobile-drawer-item.active { color: var(--gold); }
    .mobile-drawer-divider { height: 1px; background: var(--border); margin: 8px 24px; }
    @media (max-width: 720px) {
      .mobile-bottom-nav { display: block; }
      .page { padding-top: 80px !important; padding-bottom: 16px !important; }
      .welcome-page { padding-top: 80px !important; }
      .nav { display: none; }
    }

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
    .recipe-card {
      background: var(--bg2); border: 1px solid var(--border);
      padding: 22px; cursor: pointer; transition: all 0.18s;
      position: relative; overflow: hidden;
      box-shadow: inset 0 0 0 3px var(--bg2), inset 0 0 0 4px var(--border);
    }
    .recipe-card::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
      background: var(--rc, var(--gold));
    }
    .recipe-card:hover { border-color: var(--border3); transform: translateY(-2px); }
    .recipe-card-left { flex: 1; }
    .recipe-card-type { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; font-family: 'Jost', sans-serif; }
    .recipe-card-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; margin-bottom: 8px; line-height: 1.2; }
    .recipe-card-tags { display: flex; flex-wrap: wrap; gap: 5px; }
    .recipe-card-rating { text-align: right; flex-shrink: 0; margin-left: 16px; }
    .recipe-card-rating-num { font-family: 'Cormorant Garamond', serif; font-size: 28px; }
    .recipe-card-rating-denom { font-size: 12px; color: var(--muted3); }

    /* RECIPE DETAIL */
    .recipe-detail { max-width: 720px; }
    .recipe-detail-header { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; }
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
      .app { padding-top: 0; }
      .nav-add-bean-wrap { margin: 0 -16px; }
      .welcome-page { padding: 32px 24px; align-items: flex-start; padding-top: 48px; }
      .welcome-wordmark { font-size: 64px; }
    }
  `;

  return (
    <ThemeContext.Provider value={theme}>
    <div className={`app ${theme !== "system" ? `theme-${theme}` : ""}`}>
      <style>{css}</style>
      {showOnboarding && <Onboarding onComplete={completeOnboarding} onNavigate={(t) => { completeOnboarding(); if (t) setTab(t); }} />}
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
            {session ? (
              <button className="nav-tab" onClick={() => setTab("profile")} style={{ color: "var(--gold)", borderBottom: tab === "profile" ? "2px solid var(--gold)" : "2px solid transparent" }}>Profile</button>
            ) : (
              <button className="nav-tab" onClick={() => setShowAuthModal(true)} style={{ color: "var(--gold)", borderBottom: "2px solid transparent" }}>Sign In</button>
            )}
            {session && (
              <button className="nav-tab" onClick={() => { setShowInbox(true); setUnreadCount(0); }}
                style={{ color: unreadCount > 0 ? "var(--gold)" : "var(--muted3)", borderBottom: "2px solid transparent", position: "relative" }}>
                Inbox{unreadCount > 0 && <span style={{ position: "absolute", top: 2, right: 2, background: "var(--gold)", color: "var(--bg)", borderRadius: "50%", width: 14, height: 14, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{unreadCount}</span>}
              </button>
            )}
            {session && (
              <button className="nav-tab" onClick={() => { setShowNotifications(true); setUnreadNotifCount(0); }}
                style={{ color: unreadNotifCount > 0 ? "var(--gold)" : "var(--muted3)", borderBottom: "2px solid transparent", position: "relative",
                  textShadow: unreadNotifCount > 0 ? "0 0 8px var(--gold), 0 0 16px var(--gold)" : "none",
                  transition: "text-shadow 0.3s, color 0.3s" }}>
                Notifications{unreadNotifCount > 0 && <span style={{ position: "absolute", top: 2, right: 2, background: "var(--gold)", color: "var(--bg)", borderRadius: "50%", width: 14, height: 14, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{unreadNotifCount}</span>}
              </button>
            )}
            <button className={`nav-tab ${tab === "home" ? "active" : ""}`} onClick={() => setTab("home")}>Home</button>
            <button className={`nav-tab ${tab === "journal" ? "active" : ""}`} onClick={() => handleNavigate("journal")}>Journal</button>
            <button className={`nav-tab ${tab === "feed" ? "active" : ""}`} onClick={() => setTab("feed")}>Feed</button>
            {/* Discovery tab hidden - re-enable when ready
            <button className={`nav-tab ${tab === "discovery" ? "active" : ""}`} onClick={() => setTab("discovery")}>Discovery</button>
            */}
            <button className={`nav-tab ${tab === "recipes" ? "active" : ""}`} onClick={() => handleNavigate("recipes")}>Recipes</button>
            <button className={`nav-tab ${tab === "collections" ? "active" : ""}`} onClick={() => setTab("collections")}>Collections</button>
            <button className={`nav-tab ${tab === "brew" ? "active" : ""}`} onClick={() => setTab("brew")}>Brew</button>
            <button className={`nav-tab ${tab === "guide" ? "active" : ""}`} onClick={() => setTab("guide")}>Guide</button>
            <button className={`nav-tab ${tab === "faq" ? "active" : ""}`} onClick={() => setTab("faq")}>FAQ</button>
          </div>
        </div>
      </nav>
      {tab === "home"    && <HomePage onNavigate={handleNavigate} onTakeTour={startTour} onReplayTutorial={replayTutorial} session={session} profile={profile} beans={beans} onSignIn={() => setShowAuthModal(true)} />}
      {tab === "profile"  && <ProfilePage session={session} onSignOut={signOut} profile={profile} onProfileUpdate={setProfile} onSignIn={() => setShowAuthModal(true)} />}
      {tab === "journal"  && (
        <>
          <BeanJournal onBrewCalc={handleBrewCalc} onBeansChange={setBeans} addTrigger={journalTrigger} showToast={showToast} session={session}
            onViewChange={(v, bean) => { setJournalView(v); setJournalActiveBean(bean || null); }}
            shareTrigger={journalShareTrigger} />
          {journalView !== "detail" && (
            <button onClick={handleAddBean} style={FAB_STYLE}
              onMouseEnter={e => e.currentTarget.style.background = "var(--gold-hi)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--gold)"}>
              + Log Bean
            </button>
          )}
          {journalView === "detail" && journalActiveBean && session && (
            <button onClick={() => setJournalShareTrigger(n => n + 1)} style={SHARE_FAB_STYLE}
              onMouseEnter={e => e.currentTarget.style.background = "var(--gold-dim)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--bg2)"}>
              ✉ Share
            </button>
          )}
        </>
      )}
      {tab === "recipes"  && (
        <>
          <RecipesPage showToast={showToast} session={session} onNeedAuth={() => setShowAuthModal(true)} addTrigger={recipeTrigger}
            onViewChange={(v, recipe) => { setRecipeView(v); setRecipeActive(recipe || null); }}
            shareTrigger={recipeShareTrigger} />
          {recipeView !== "detail" && (
            <button onClick={handleAddRecipe} style={FAB_STYLE}
              onMouseEnter={e => e.currentTarget.style.background = "var(--gold-hi)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--gold)"}>
              + Add Recipe
            </button>
          )}
          {recipeView === "detail" && session && (
            <button onClick={() => setRecipeShareTrigger(n => n + 1)} style={SHARE_FAB_STYLE}
              onMouseEnter={e => e.currentTarget.style.background = "var(--gold-dim)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--bg2)"}>
              ✉ Share
            </button>
          )}
        </>
      )}
      {tab === "brew"     && <BrewPage initialMethod={calcMethod} />}
      {tab === "calc"     && <BrewCalculator initialMethod={calcMethod} />}
      {tab === "guide"   && <GuidePage />}
      {tab === "faq"     && <FAQPage />}
      {tab === "feed"    && <FeedPage session={session} profile={profile} />}
      {tab === "discovery" && !publicProfileScreenname && <DiscoveryPage session={session} profile={profile} onViewProfile={(sn) => setPublicProfileScreenname(sn)} />}
      {tab === "discovery" && publicProfileScreenname && <PublicProfilePage screenname={publicProfileScreenname} session={session} currentProfile={profile} onNavigate={(t) => { setPublicProfileScreenname(null); setTab(t); }} />}
      {tab === "collections" && <CollectionsPage session={session} beans={beans} onNeedAuth={() => setShowAuthModal(true)} />}
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
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showNotifications && session && <NotificationsPanel session={session} onClose={() => setShowNotifications(false)} />}
      {needsScreenname && session && <ScreennameModal session={session} onComplete={(p) => { setProfile(p); setNeedsScreenname(false); }} />}
      {showInbox && session && <InboxModal session={session} onClose={() => setShowInbox(false)} />}

      {/* Mobile Top Nav */}
      <nav className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          {[
            { key: "profile", icon: "✦", label: session ? "Profile" : "Sign In" },
            { key: "home", icon: "⌂", label: "Home" },
            { key: "brew", icon: "▽", label: "Brew" },
            { key: "journal", icon: "◎", label: "Journal" },
            { key: "feed", icon: "◈", label: "Feed" },
          ].map(({ key, icon, label }) => (
            <button key={key} className={`mobile-nav-btn ${tab === key ? "active" : ""}`}
              onClick={() => {
                if (key === "profile" && !session) { setShowAuthModal(true); }
                else { setTab(key); setShowMobileDrawer(false); }
              }}>
              {key === "home"
                ? <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
                : <span className="mobile-nav-btn-icon">{icon}</span>}
              {key !== "home" && <span>{label}</span>}
            </button>
          ))}
          <button className={`mobile-nav-btn ${showMobileDrawer ? "active" : ""}`}
            onClick={() => setShowMobileDrawer(d => !d)}>
            <span className="mobile-nav-btn-icon">⋯</span>
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {showMobileDrawer && (
        <div className="mobile-drawer-overlay" onClick={() => setShowMobileDrawer(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 9, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", padding: "0 24px 12px" }}>More</div>
            {[
              { key: "recipes", icon: "◆", label: "Recipes" },
              { key: "collections", icon: "◻", label: "Collections" },
              // { key: "discovery", icon: "★", label: "Discovery" }, // hidden for now
            ].map(({ key, icon, label }) => (
              <button key={key} className={`mobile-drawer-item ${tab === key ? "active" : ""}`}
                onClick={() => { setTab(key); setShowMobileDrawer(false); }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
            <div className="mobile-drawer-divider" />
            {[
              { key: "guide", icon: "◑", label: "Guide" },
              { key: "faq", icon: "?", label: "FAQ" },
            ].map(({ key, icon, label }) => (
              <button key={key} className={`mobile-drawer-item ${tab === key ? "active" : ""}`}
                onClick={() => { setTab(key); setShowMobileDrawer(false); }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
            {session && (
              <>
                <div className="mobile-drawer-divider" />
                <button className="mobile-drawer-item" onClick={() => { setShowInbox(true); setUnreadCount(0); setShowMobileDrawer(false); }}>
                  <span style={{ fontSize: 16 }}>✉</span>
                  <span>Inbox{unreadCount > 0 ? ` (${unreadCount})` : ""}</span>
                </button>
                <button className="mobile-drawer-item" onClick={() => { setShowNotifications(true); setUnreadNotifCount(0); setShowMobileDrawer(false); }}>
                  <span style={{ fontSize: 16 }}>◎</span>
                  <span>Notifications{unreadNotifCount > 0 ? ` (${unreadNotifCount})` : ""}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </ThemeContext.Provider>
  );
}









export default dynamic(() => Promise.resolve(App), { ssr: false });

import { useState } from "react";
import { ROAST_GUIDE, MILK_GUIDE } from "./faqData";

export const GRIND_GUIDE = [
  { size: "Extra Coarse", color: "#c8a878", desc: "Visibly chunky, like cracked peppercorns or coarse sea salt. Almost no resistance when you rub it between your fingers. Used exclusively for cold brew - the 12-24 hour steep compensates for the open grind, and going finer would make the concentrate bitter and astringent.", methods: ["Cold Brew"] },
  { size: "Coarse",       color: "#b89060", desc: "Like rough kosher salt - distinct, irregular particles with plenty of space between them. Ideal for French Press because the full-immersion brew method needs a coarse grind to avoid over-extraction during the 4-minute steep. Also works well for cold brew concentrate.", methods: ["French Press", "Cold Brew"] },
  { size: "Medium-Coarse",color: "#c09858", desc: "Slightly finer than French Press but still quite open - closer to coarse beach sand. The Chemex uses a much thicker paper filter than a V60, which dramatically slows the flow rate. A coarser grind compensates for this, keeping brew time in range and preventing a bitter, over-extracted cup.", methods: ["Chemex"] },
  { size: "Medium",       color: "#b88848", desc: "The workhorse grind - consistent, uniform particles about the size of fine breadcrumbs. Drip machines are designed around this grind size, and it's the safest starting point for any new brew method. Not too fast, not too slow, extracts evenly with moderate heat and contact time.", methods: ["Drip Machine"] },
  { size: "Medium-Fine",  color: "#c09040", desc: "Finer than drip but not as dense as espresso - smooth to the touch with just a hint of texture. This is the sweet spot for pour over and AeroPress, where you want enough resistance to slow the flow and extend contact time, but not so much that it chokes the drawdown or over-extracts.", methods: ["Pour Over / V60", "AeroPress"] },
  { size: "Fine",         color: "#a87838", desc: "Dense and powdery-smooth, like fine table salt or granulated sugar. At this size, water has to work hard to push through the bed of grounds, which is exactly what espresso machines and Moka Pots need. That resistance is what creates pressure and forces fast, concentrated extraction in under 30 seconds.", methods: ["Espresso", "Moka Pot"] },
  { size: "Extra Fine",   color: "#906030", desc: "Almost a powder - finer than espresso, closer to flour or powdered sugar. The only common use is Turkish coffee, where grounds are simmered directly in water in a cezve and never filtered out. The ultra-fine grind is intentional: it settles to the bottom of the cup and becomes part of the drinking experience.", methods: ["Turkish Coffee"] },
];






export function RoastGuide({ tc }) {
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



export function MilkGuide({ tc }) {
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

export const ORIGINS_GUIDE = [
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

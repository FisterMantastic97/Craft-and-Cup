export const FAQ_SECTIONS = [
  {
    category: "The Basics",
    icon: "◎",
    items: [
      {
        q: "What is a brew ratio?",
        a: "The brew ratio is how much coffee you use relative to water, expressed as 1:X. A 1:15 ratio means 1 gram of coffee per 15 grams of water. Lower numbers make stronger coffee, higher numbers make it lighter. Most pour overs sit around 1:15 to 1:16. Espresso is far more concentrated at around 1:2. The Brew Calculator handles all of this automatically - just dial in your preferred strength and it tells you exactly how much of each to use.",
      },
      {
        q: "Why do people weigh coffee instead of using scoops?",
        a: "Coffee beans vary in density depending on roast level and origin. A scoop of light roast beans weighs more than the same scoop of dark roast. Grams are consistent. Using a scale is the single biggest upgrade most beginners can make and cheap ones work perfectly well.",
      },
      {
        q: "What does bloom mean?",
        a: "When hot water hits fresh coffee grounds, trapped CO2 gases escape in a burst. If you skip this step, those gases repel water and cause uneven extraction. Blooming means pouring a small amount of water (usually twice the coffee weight) over the grounds and waiting 30 to 45 seconds before the main pour. Fresh coffee bubbles and rises dramatically during the bloom. Stale coffee barely reacts at all.",
      },
      {
        q: "Does water temperature matter?",
        a: "Yes, significantly. Water above 96 degrees Celsius over-extracts and tastes harsh. Water that is too cool under-extracts and tastes flat or sour. Most brew methods aim for 90 to 95 degrees Celsius. A simple approach is to boil water and let it sit off the heat for 30 to 60 seconds. AeroPress intentionally uses cooler water around 85 degrees to reduce bitterness and increase smoothness.",
      },
      {
        q: "What causes bitter coffee?",
        a: "Bitterness means over-extraction - too many compounds dissolved into the cup. The most common causes are grinding too fine, water too hot, brewing too long, or using too much coffee. Grinding coarser is almost always the first adjustment to try. Stale beans and poor water quality also contribute to bitterness.",
      },
      {
        q: "What causes sour or flat tasting coffee?",
        a: "Sourness and flatness mean under-extraction - not enough dissolved in the cup. Common causes include grinding too coarse, water not hot enough, brewing too quickly, or not enough coffee. Try grinding finer first. Some bright acidity is desirable especially in light roasts, but sharp or harsh sourness is a sign something is off with your extraction.",
      },
      {
        q: "What is the difference between light, medium, and dark roast?",
        a: "Roast level shapes the flavor more than almost any other variable. Light roasts retain more of the beans original character: fruity, floral, complex, higher acidity. Dark roasts develop flavors from the roasting process itself: chocolate, smoke, caramel, lower acidity. Medium sits between the two. Neither is objectively better. The Roast Guide in the Guide tab covers 12 roast levels in detail including their flavor profiles and best brew methods.",
      },
      {
        q: "Does grind freshness matter?",
        a: "Dramatically. Coffee starts oxidizing within minutes of being ground. Pre-ground coffee from a supermarket bag is significantly less vibrant than freshly ground beans. If you want better coffee without changing anything else, grinding fresh right before brewing is the highest-impact change you can make. Even an inexpensive hand grinder makes a noticeable difference.",
      },
      {
        q: "What is specialty coffee?",
        a: "Specialty coffee refers to beans that score 80 or above on a 100-point scale assessed by trained tasters called Q Graders. The scoring covers flavor clarity, sweetness, acidity, and the absence of defects. Practically speaking, specialty coffee is traceable to a specific farm or region, roasted recently, and handled carefully at every step. The difference in the cup compared to commodity coffee is real and significant.",
      },
      {
        q: "What is a coffee processing method?",
        a: "Processing is how the coffee cherry is turned into a green bean ready for roasting. Washed coffees have the fruit removed before drying, which produces clean and bright cups where the origin character comes through clearly. Natural coffees are dried with the fruit still on, adding intense sweetness and jammy berry notes. Honey processed coffees are a middle ground - some fruit is left on during drying, producing a sweet and rounded cup. Processing method is one of the biggest factors in a coffee's flavor profile.",
      },
    ],
  },
  {
    category: "Accounts and Sign In",
    icon: "◈",
    items: [
      {
        q: "Do I need an account to use Craft and Cup?",
        a: "No. You can use the Brew Calculator and explore the Guide and FAQ without an account. However, saving beans to your Journal, saving recipes, creating collections, and using any social features requires signing in. If you use the app without an account your data is stored locally on your device and will not sync across devices or browsers.",
      },
      {
        q: "How do I create an account?",
        a: "Tap Sign In in the navigation bar and choose Continue with Google or Continue with Discord. There is no separate sign-up flow - signing in for the first time automatically creates your account. After signing in you will be prompted to choose a screenname, which is how other users will see you on the platform.",
      },
      {
        q: "What is a screenname?",
        a: "Your screenname is the public-facing name other users see on Craft and Cup. It is separate from your Google or Discord name and your email address, which are never shown to other users. Screennames must be 3 to 24 characters using only letters, numbers, and underscores. You can change your screenname at any time from your Profile tab.",
      },
      {
        q: "Can I link multiple sign-in methods to one account?",
        a: "Yes. Go to your Profile tab, tap Accounts, and you will see options to link Google and Discord. If you signed in with Discord you can link Google to the same account and vice versa. This means you can sign in with either method and access the same data.",
      },
      {
        q: "How do I sign out?",
        a: "Go to your Profile tab and scroll down to the Account section. Tap Sign Out. Your data remains saved in your account and will be there when you sign back in.",
      },
      {
        q: "Can I change the temperature unit?",
        a: "Yes. The brew calculator has a °C and °F toggle next to the metric and imperial buttons. Switching it changes all temperature displays in the calculator immediately. Your preference is saved automatically.",
      },
      {
        q: "Can I switch between dark and light mode?",
        a: "Yes. On desktop, use the theme toggle in the top right corner of the navigation bar. On mobile, tap More in the navigation bar and use the Dark, Light, and Auto buttons at the bottom of the drawer. Auto follows your device system setting.",
      },
      {
        q: "What happens to my data if I sign in for the first time on a device I already used without an account?",
        a: "If you have beans saved locally and sign in for the first time, Craft and Cup automatically migrates all your local beans and recipes to your account in the cloud. You will see a brief syncing message and then everything appears in your account. Your local data is cleared after a successful migration. Nothing is lost.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Go to your Profile tab, scroll down to the Account section, and tap Delete Account. You will be asked to confirm with a 5 second delay before the deletion goes through. Deleting your account permanently removes your profile, beans, recipes, collections, and all associated data. This cannot be undone.",
      },
    ],
  },
  {
    category: "Your Data and Privacy",
    icon: "◉",
    items: [
      {
        q: "Where is my data stored?",
        a: "When you are signed in, your beans, recipes, and collections are stored securely in Supabase, a cloud database. Your photos are stored in Supabase Storage. Your theme preference and onboarding state are stored locally in your browser. When you are not signed in, everything is stored locally in your browser only.",
      },
      {
        q: "What visibility options do I have for my beans and recipes?",
        a: "Every bean and recipe has three visibility options you can set when saving. Private means only you can see it. Friends means it appears in the feed of people you are friends with on Craft and Cup. Public means it is visible to a broader audience. The default is Private, so nothing is shared unless you choose to share it.",
      },
      {
        q: "Can other users see my email address or real name?",
        a: "Never. Your email address, Google name, and Discord username are never shown to other users. The only thing other users see is the screenname you chose when setting up your profile. Your linked sign-in providers are also private.",
      },
      {
        q: "Can I make my profile private?",
        a: "Yes. By default your profile is private. Go to your Profile tab, tap Edit Profile, and you will see a Make my profile public toggle. When your profile is private, other users cannot find or view your profile page even if they have your screenname. Your friend code still works for adding friends regardless of this setting.",
      },
      {
        q: "Who can see my activity in the feed?",
        a: "Only beans and recipes you have set to Friends or Public visibility will appear in any feed. Private items never appear to anyone but you. Friends visibility items appear only to users you have accepted as friends.",
      },
      {
        q: "Can I change the visibility of a bean or recipe after saving it?",
        a: "Yes. Open the bean or recipe, tap Edit, and change the Visibility dropdown to your preferred setting. Save it and the change takes effect immediately.",
      },
    ],
  },
  {
    category: "Bean Journal",
    icon: "◎",
    items: [
      {
        q: "How do I log a bean?",
        a: "Tap the Journal tab, then tap the gold Log Bean button in the bottom right corner. Fill in the brand, bean name, origin, roast level, and brew method. Add personal notes about where you got it or any context about the roast. Then write your tasting notes in the Flavor Notes field - describe what you taste in plain language. Tap Build Flavor Wheel and the AI maps your description to the flavor wheel automatically. You need to be signed in to save beans.",
      },
      {
        q: "How does the AI flavor wheel work?",
        a: "Craft and Cup uses Claude, an AI model made by Anthropic, to build flavor profiles two ways. For beans, it reads your tasting notes and maps what you described onto a multi-tier flavor taxonomy - from broad categories like Fruity or Floral down to specific notes like Wild Blackberry or White Jasmine. For recipes, it builds a profile automatically from your ingredients - the drink type, milk, syrup, and extras - and combines that with any taste notes you add. The size of each wheel segment reflects how prominent that flavor is. You do not need to use coffee jargon for either.",
      },
      {
        q: "What should I write in the flavor notes?",
        a: "Write exactly what you taste as if describing it to a friend who has never tried the coffee. The AI responds well to specific, sensory language. Instead of just 'fruity' try 'reminds me of fresh blackberry jam with a hint of citrus peel.' Mention texture (silky, coating, thin), finish (long, short, clean, lingering), aroma (floral, earthy, roasted), and any specific foods or flavors the coffee reminds you of. The more detail you give, the richer and more accurate the wheel will be.",
      },
      {
        q: "Can I add a photo to a bean entry?",
        a: "Yes. When logging or editing a bean, tap the Photo field and select an image from your camera roll or files. A photo of the bag, the cup, or the brewing setup all work well. Photos are stored securely in your account and appear as a thumbnail in your collection and at the top of the bean detail page.",
      },
      {
        q: "What are tasting scores?",
        a: "Each bean can be scored on seven attributes: Aroma, Acidity, Body, Sweetness, Finish, Balance, and Bitterness. Each attribute is scored from 1 to 10. The overall score is the average. Scores appear on the bean card and are used for sorting your collection by highest-rated. You can update scores at any time from the bean detail page.",
      },
      {
        q: "Can I compare two beans side by side?",
        a: "Yes. Open any bean in your journal and tap Compare. This puts the app in compare mode. Tap a second bean from your collection and you will see both beans displayed side by side with their flavor wheels, scores, tasting notes, and details. It is useful for comparing two beans from the same origin or seeing how your palate has tracked a roaster over time.",
      },
      {
        q: "Can I export a bean as a shareable card?",
        a: "Yes. Open any bean detail page and tap the Share button in the bottom right corner. From the share menu, tap Export Card. This renders the bean data into a PNG image with the flavor wheel, scores, flavor chips, and tasting notes. You can choose between a dark or light card theme before downloading. On mobile, long press the image to save it to your photos, or tap Download to save it as a file. The card is high resolution and looks great shared on social media or in messages.",
      },
      {
        q: "What is the Share button on bean and recipe pages?",
        a: "When viewing a bean or recipe detail, a Share button appears in the bottom right corner. Tapping it opens a menu with two options: Export Card, which generates a downloadable PNG card, and Send to Friend, which sends the item directly to a friend in the app. You need to be signed in to use either option.",
      },
      {
        q: "How do I send a bean to a friend?",
        a: "Open the bean detail page and tap Send to Friend. Select the friend from your list, add an optional message, and tap Send. Your friend will receive the bean in their Inbox tab. Sending requires you to be signed in and to have at least one accepted friend.",
      },
      {
        q: "How many beans can I store?",
        a: "There is no hard limit on how many beans you can store in your journal. Log as many as you want.",
      },
      {
        q: "Is there a limit on AI flavor wheel analysis?",
        a: "To prevent abuse, each account is limited to 10 AI flavor analyses per hour - this covers both bean flavor wheels and recipe flavor profiles. The counter resets after 60 minutes. If you hit the limit you will see a message letting you know and the analysis will be available again once the hour is up.",
      },
    ],
  },
  {
    category: "Recipes",
    icon: "◆",
    items: [
      {
        q: "What kinds of recipes can I save?",
        a: "The recipe section is designed for espresso drinks - lattes, flat whites, cappuccinos, cortados, americanos, macchiatos, and similar. You can log the drink type, temperature, espresso shots, milk type and amount, syrups, extras, and step-by-step instructions. Rating and personal notes are also supported. It is designed for drinks you want to recreate exactly.",
      },
      {
        q: "Can I add a photo to a recipe?",
        a: "Yes. When creating or editing a recipe, tap the Photo field and upload an image. A photo of the finished drink makes recipe cards much more personal and easier to identify at a glance. Photos appear as a thumbnail in the recipe list and full-width at the top of the recipe detail page.",
      },
      {
        q: "Can I share a recipe with a friend?",
        a: "Yes. Open the recipe detail page and tap Send to Friend. The full recipe including all ingredients, steps, and your photo is sent directly to your friend's Inbox.",
      },
      {
        q: "How do I control who sees my recipes?",
        a: "Each recipe has a Visibility setting: Private (only you), Friends (your friends feed), or Public. The default is Private. You can change the visibility at any time by editing the recipe.",
      },
    ],
  },
  {
    category: "Collections",
    icon: "◻",
    items: [
      {
        q: "What are collections?",
        a: "Collections let you organise your saved beans into named groups. You might create collections like My Ethiopia Naturals, Beans to Try, Favourite Light Roasts, or Gifts for Friends. Each collection can have a name, optional description, a selection of beans from your journal, and a public or private visibility setting.",
      },
      {
        q: "How do I create a collection?",
        a: "Go to the Collections tab and tap New. Give your collection a name and optional description. Tap Add Beans from Journal to pick which beans to include. Choose your visibility setting and save. You can edit a collection at any time to add or remove beans.",
      },
      {
        q: "Can other people see my collections?",
        a: "Only if you set them to public. Private collections are only visible to you. Public collections are visible on your public profile page to anyone who views it.",
      },
    ],
  },
  {
    category: "Friends and Social",
    icon: "✦",
    items: [
      {
        q: "How do I add a friend?",
        a: "Go to your Profile tab and tap Friends. You will see your unique Friend Code displayed in gold - a short code like BREW-4X9K. Share this code with someone and have them enter it in the Add a Friend field on their Profile. They send you a request and you can accept or decline it from the Friend Requests section.",
      },
      {
        q: "Where do I find my friend code?",
        a: "Go to your Profile tab and tap the Friends section. Your code is displayed at the top in large gold text. Tap Copy to copy it to your clipboard.",
      },
      {
        q: "Can someone find me without my friend code?",
        a: "Only if you share your friend code with them directly. If your profile is private, your friend code is the only way someone can add you.",
      },
      {
        q: "How do I accept or decline a friend request?",
        a: "Go to your Profile tab and tap Friends. Incoming requests appear with Accept and Decline buttons. The Friends tab in the nav shows a red badge when you have pending requests.",
      },
      {
        q: "How do I remove a friend?",
        a: "Go to your Profile tab, tap Friends, and find the person in your friends list. Tap Remove next to their name.",
      },
      {
        q: "What does the Friends Feed show?",
        a: "The Feed tab shows beans and recipes from people you are friends with, but only items they have set to Friends or Public visibility. Private items never appear. You can react to posts and leave comments. If you have no friends yet, the feed will be empty - add friends using your friend code in the Profile tab.",
      },
      {
        q: "What is the Friends Feed?",
        a: "The Friends Feed shows beans and recipes shared by people you are friends with on Craft and Cup. You can react to posts and leave comments. Only content set to Friends or Public visibility will appear.",
      },
      {
        q: "How do reactions work?",
        a: "On any post in the Feed you will see three reaction buttons: a coffee cup for Love it, a star for Want to try, and a coffee bean for Interesting. Tap once to react, tap again to remove your reaction. Reaction counts are shown on each post. The person who posted the item gets a notification when someone reacts.",
      },
      {
        q: "How do comments work?",
        a: "Tap Comments on any feed or discovery post to expand the comments section. Write up to 280 characters and tap Post. There is a 5 second cooldown between comments to prevent spam. You can edit or delete your own comments at any time. Deleted comments show as [comment deleted] rather than disappearing so conversation threads stay readable. You can report any comment using the Report button.",
      },
      {
        q: "Can I comment without an account?",
        a: "No. Commenting requires being signed in. You can read comments without an account but you need to sign in to post.",
      },
    ],
  },
  {
    category: "Notifications and Inbox",
    icon: "◈",
    items: [
      {
        q: "What is the Inbox?",
        a: "The Inbox tab shows beans and recipes that friends have sent directly to you using the Send to Friend feature. Each item shows who sent it, what they sent, any message they included, and when it was sent. Unread items show a gold dot and the Inbox button shows a badge count when you have unread items.",
      },
      {
        q: "What are notifications?",
        a: "Notifications (the bell icon in the nav) alert you when something happens related to your content or social activity. You get notified when someone reacts to your post, comments on your post, sends you a friend request, accepts your friend request, or sends you something via the Inbox. The bell shows a badge count when you have unread notifications.",
      },
      {
        q: "How do I mark notifications as read?",
        a: "Opening the notifications panel marks all current notifications as read automatically. The badge clears when you open it.",
      },
    ],
  },
  {
    category: "Brew Calculator",
    icon: "▽",
    items: [
      {
        q: "Which brew methods does the calculator support?",
        a: "The Brew Calculator supports Pour Over and V60, Chemex, Espresso, Cold Brew, French Press, AeroPress, Moka Pot, and Drip Machine. Each method has its own default ratio, grind guide, recommended temperature, and a built-in stage timer that walks you through the brew step by step.",
      },
      {
        q: "How does the brew timer work?",
        a: "Each brew method has a staged timer built in. For pour overs it walks you through the bloom and each pour with individual countdowns. For espresso there is a shot timer that counts up with a target zone highlighted so you know when to stop. Tap the Start button when you begin brewing and the timer handles the rest.",
      },
      {
        q: "What is yield and how is it different from dose?",
        a: "Dose is the amount of dry coffee you put in. Yield is the amount of liquid in the cup at the end. For most brew methods these are directly calculated from the ratio. For espresso they are treated separately because the puck absorbs a significant amount of water. The calculator shows both and lets you adjust either.",
      },
      {
        q: "What is the Espresso Drinks Calculator?",
        a: "The Espresso Drinks Calculator is part of the espresso section. It lets you dial in the milk and espresso ratios for standard drinks like lattes, flat whites, cappuccinos, cortados, and macchiatos based on your espresso yield. Adjust the yield and all the milk volumes update proportionally.",
      },
      {
        q: "What temperature should I use for each method?",
        a: "The calculator shows a recommended temperature for each method. As a general guide: pour over and Chemex work well at 93 to 95 degrees Celsius, French Press at 93 to 96 degrees, AeroPress at 80 to 85 degrees, espresso at 90 to 96 degrees depending on the machine, and cold brew uses room temperature or cold water over a long steep. The Brew Calculator displays the target range for the selected method.",
      },
      {
        q: "Can I save my favourite brew settings?",
        a: "Yes. Once you have dialled in your preferred settings for a method, you can save them as a recipe in the Recipes tab. Set the drink type, shots, milk, and other details and save. The recipe is stored in your account and synced across devices when you are signed in.",
      },
    ],
  },
  {
    category: "Milk and Drinks",
    icon: "◉",
    items: [
      {
        q: "What is the difference between a latte, flat white, and cappuccino?",
        a: "All three are espresso with steamed milk but the ratios and textures differ. A latte is the largest and milkiest, typically 200 to 250ml with a thin layer of microfoam on top. A flat white is smaller at 150 to 180ml with a higher ratio of espresso to milk and very thin velvety microfoam that blends fully into the drink. A cappuccino is traditionally equal thirds of espresso, steamed milk, and foam, producing a drier lighter texture with a thick foam cap. The Milk Guide in the Guide tab covers these in detail.",
      },
      {
        q: "What milk works best for steaming?",
        a: "Whole milk steams easiest and tastes richest. For plant-based options, barista oat milk is the best for hot drinks and produces latte-art quality microfoam. Standard grocery oat milk separates and tastes grainy when heated. Almond milk is better cold than hot. Soy milk steams reasonably well but has a strong flavour. Always look for barista edition plant milks for hot espresso drinks.",
      },
      {
        q: "What is cold foam and how do I make it at home?",
        a: "Cold foam is frothed cold milk served on top of iced drinks. To make it at home use cold low-fat milk or skim milk and froth with a handheld frother for 20 to 30 seconds until thick and stable. You can also use a French Press by adding cold milk and pumping the plunger rapidly for 30 seconds. Flavoured cold foams are made by blending a small amount of syrup or sweet cream into the milk before frothing.",
      },
      {
        q: "What is a cortado?",
        a: "A cortado is a small drink of equal parts espresso and steamed milk, usually 60 to 90ml total. The name comes from the Spanish word for cut, meaning the milk cuts the intensity of the espresso. It is similar to a small flat white but with even less milk and no thick foam layer. If you find lattes too milky but straight espresso too intense, a cortado is often the perfect middle ground.",
      },
    ],
  },
  {
    category: "Grind and Equipment",
    icon: "⊟",
    items: [
      {
        q: "What grinder should I buy as a beginner?",
        a: "A burr grinder is essential. Blade grinders chop unevenly and produce a mix of fine dust and large chunks that extracts inconsistently. For hand grinders the 1Zpresso Q2 and Timemore Chestnut C2 are excellent value. For electric grinders the Baratza Encore is the most recommended entry-level option. The single biggest upgrade most beginners can make is switching from a blade grinder to a burr grinder.",
      },
      {
        q: "Why does grind size matter so much?",
        a: "Grind size controls the rate of extraction. Finer grinds have more surface area and extract faster. Coarser grinds extract slower. Each brew method has an optimal extraction time and grind size is the primary way you control it. Too fine and you over-extract (bitter). Too coarse and you under-extract (sour, flat). The Interactive Grind Guide in the Guide tab shows the right size for each method.",
      },
      {
        q: "Do I need a scale?",
        a: "Yes, if you want consistent results. Volume measurements with scoops vary too much between bean densities and grind sizes. A basic kitchen scale that measures in 0.1 gram increments is all you need and they cost very little. Weighing both your coffee dose and your brew water is the fastest path to reproducible, dialled-in coffee.",
      },
      {
        q: "Does water quality affect taste?",
        a: "Significantly. Coffee is 98 to 99 percent water, so its mineral content directly affects extraction and taste. Distilled water extracts poorly and produces flat coffee. Very hard water over-extracts and can taste bitter or chalky. Filtered tap water is sufficient for most people. If you want to go further, Third Wave Water mineral packets added to distilled water create an ideal mineral profile for coffee extraction.",
      },
    ],
  },
  {
    category: "Coffee Origins",
    icon: "★",
    items: [
      {
        q: "Why does origin matter so much in specialty coffee?",
        a: "Coffee absorbs the character of where it grows through a concept called terroir - the combination of altitude, soil, climate, and farming practices that shape the bean before it is ever roasted. Ethiopian coffees taste like Ethiopia. Kenyan coffees taste like Kenya. Understanding origin is one of the most reliable ways to predict what a coffee will taste like before you try it. The Origins Guide in the Guide tab covers the major producing regions in depth.",
      },
      {
        q: "What are the main coffee growing regions?",
        a: "The major regions are East Africa (Ethiopia, Kenya, Rwanda, Burundi), Central America (Guatemala, Costa Rica, Honduras, Panama), South America (Colombia, Brazil, Peru, Bolivia), and Asia and Pacific (Sumatra, Java, Yemen, Papua New Guinea). Each region has characteristic flavor profiles shaped by altitude, variety, and processing traditions. The Guide tab has an interactive Origins section that covers each region in detail.",
      },
      {
        q: "What is the difference between Arabica and Robusta?",
        a: "Arabica is grown at higher altitudes, is more delicate, and produces complex, aromatic coffees with higher perceived acidity. Almost all specialty coffee is Arabica. Robusta is hardier, grows at lower altitudes, has more caffeine, stronger and more bitter flavors, and is used primarily in commercial blends and instant coffee. When a bag just says coffee with no origin, it is usually Robusta or low-grade Arabica.",
      },
      {
        q: "What does single origin mean versus a blend?",
        a: "Single origin means the coffee comes from one specific country, region, or even a single farm. This lets the unique character of that place come through clearly in the cup. A blend combines beans from multiple origins, usually to create a consistent flavor profile that is more balanced and predictable. Blends are the backbone of most commercial espresso. Neither is objectively better. Single origins are great for exploring flavors. Blends are great for everyday reliability.",
      },
    ],
  },
  {
    category: "Homemade Syrups",
    icon: "◆",
    items: [
      {
        q: "What is a simple syrup and how do I make one?",
        a: "Simple syrup is equal parts sugar and water heated together until the sugar fully dissolves. The standard ratio is 1 cup of sugar to 1 cup of water. Combine in a saucepan over medium heat, stir until the sugar is completely dissolved, then remove from heat. Unlike granulated sugar, simple syrup blends instantly into both hot and cold drinks with no graininess. Once cooled, store in an airtight glass jar or bottle in the fridge for up to one month. Almost all flavored coffee syrups start with this base.",
      },
      {
        q: "How do I make vanilla syrup?",
        a: "Combine 1 cup of sugar and 1 cup of water in a saucepan over medium heat, stirring until the sugar dissolves. Remove from heat and immediately stir in 2 teaspoons of pure vanilla extract, or split and scrape a vanilla bean pod directly into the mixture while it heats for a more intense flavour. Let cool fully, then strain through a fine mesh strainer and store in a glass jar in the fridge for up to one month. For a richer version, substitute brown sugar for white to make a vanilla brown sugar syrup.",
      },
      {
        q: "How do I make brown sugar cinnamon syrup?",
        a: "Combine 1 cup of brown sugar, 1 cup of water, and 2 cinnamon sticks in a saucepan over medium heat. Stir until the brown sugar fully dissolves, then reduce heat and simmer for 5 minutes to infuse the cinnamon. Remove from heat and let cool before removing the cinnamon sticks. For a deeper flavour, let the cinnamon sticks steep in the cooling syrup for up to 3 hours before straining. Store in a sealed glass jar in the fridge for up to two weeks. This is the base for a brown sugar oat milk latte - two pumps of syrup, oat milk, espresso over ice.",
      },
      {
        q: "How do I make lavender syrup?",
        a: "Combine 1 cup of sugar, 1 cup of water, and 2 tablespoons of dried culinary lavender in a saucepan. Bring to a simmer over medium heat, stirring until the sugar dissolves. Simmer for 15 minutes, then remove from heat and let the lavender steep for another 15 to 30 minutes - taste as you go and stop when the floral flavour is where you want it. Strain through a fine mesh strainer into a glass jar, discarding the buds. Store in the fridge for up to two weeks. Use in iced lattes, hot lattes, or matcha drinks.",
      },
      {
        q: "How do I make caramel syrup?",
        a: "Add 1 cup of sugar and 1/4 cup of water to a heavy saucepan over medium heat. Do not stir - swirl the pan gently if needed. Cook until the mixture turns a deep amber golden colour, about 8 to 10 minutes. Remove from heat and carefully add 1/2 cup of warm water (it will bubble vigorously), then stir until smooth. Add a pinch of salt and 1 teaspoon of vanilla extract once slightly cooled. Store in the fridge for up to two weeks. This is a true caramel syrup rather than a simple syrup - it has more depth and a slightly bitter edge that pairs beautifully with milk drinks.",
      },
      {
        q: "How do I make hazelnut syrup?",
        a: "Combine 1 cup of sugar and 1 cup of water in a saucepan over medium heat, stirring until the sugar dissolves. Remove from heat and add 1 to 2 teaspoons of hazelnut extract (start with 1 and taste before adding more - hazelnut extract is strong). Let cool fully and store in a sealed glass jar in the fridge for up to one month. For a more natural version, toast 1/2 cup of raw hazelnuts and add them to the simmering syrup, then strain after cooling.",
      },
      {
        q: "How do I make a honey lavender syrup?",
        a: "Replace the sugar in a standard lavender syrup with raw honey. Combine 3/4 cup of honey, 3/4 cup of water, and 2 tablespoons of dried culinary lavender. Heat gently over low to medium heat - do not boil, as boiling honey can reduce its flavour complexity. Stir until the honey dissolves fully, simmer for 5 minutes, then remove from heat and steep for 20 to 30 minutes. Strain and store in the fridge for up to two weeks. The honey adds a floral sweetness that layers beautifully with the lavender.",
      },
      {
        q: "How do I make peppermint syrup?",
        a: "Combine 1 cup of sugar and 1 cup of water in a saucepan over medium heat, stirring until dissolved. Remove from heat and add 1/2 teaspoon of pure peppermint extract. Start conservatively - peppermint extract is potent and the flavour intensifies as the syrup cools. Taste and add more in small increments if needed. Let cool fully and store in a glass jar in the fridge for up to one month. Pairs well with mocha drinks and iced lattes.",
      },
      {
        q: "How do I make a brown sugar maple syrup?",
        a: "Combine 1/2 cup of brown sugar, 1/4 cup of pure maple syrup, and 3/4 cup of water in a saucepan over medium heat. Stir until the sugar dissolves and the maple syrup is fully incorporated. Simmer for 3 to 5 minutes, then remove from heat and let cool. Store in the fridge for up to two weeks. The maple adds a warm, earthy sweetness that pairs especially well with cold brew and iced lattes with oat milk.",
      },
      {
        q: "How long do homemade syrups last?",
        a: "Most simple syrups last 3 to 4 weeks in the fridge in a sealed glass jar. Syrups made with fruit or dairy will have a shorter life of around 1 to 2 weeks. Honey-based syrups last 2 to 3 weeks. Always discard a syrup if it looks cloudy, has any mold, or smells off. To extend shelf life slightly, add a small splash of vodka (about a teaspoon per cup of syrup) - it acts as a natural preservative without affecting the flavour.",
      },
      {
        q: "What glass jars work best for storing syrups?",
        a: "Swing-top glass bottles (also called Grolsch-style bottles) are ideal - they seal tightly, pour easily, and stay less sticky than screw-top jars. Small 250ml to 500ml sizes work well for home use. Standard mason jars with lids work perfectly fine too. Always let the syrup cool completely before sealing and refrigerating, as sealing hot syrup can create condensation and shorten shelf life.",
      },
      {
        q: "Can I make syrups without refined sugar?",
        a: "Yes. Coconut sugar works as a 1:1 substitute for white or brown sugar and adds a subtle caramel note. Honey works well but should be heated gently rather than boiled. Maple syrup can be used directly or combined with a small amount of water. Agave nectar dissolves easily and has a neutral flavour good for delicate syrups like lavender. Each alternative will produce a slightly different flavour profile, which can be a good thing - experiment and find what you like.",
      },
      {
        q: "What is the difference between white sugar, brown sugar, and raw sugar in syrups?",
        a: "White granulated sugar produces a clean, neutral sweetness that lets other flavours like vanilla or lavender come through without interference. It makes a perfectly clear syrup. Brown sugar contains molasses, which adds a warm caramel and toffee depth that pairs beautifully with cinnamon, vanilla, and espresso-based drinks. Light brown sugar is more subtle, dark brown sugar is richer and more intense. Raw sugar (such as turbinado or demerara) sits between the two - less refined than white, with a mild caramel edge and slightly larger crystals that take a little longer to dissolve.",
      },
      {
        q: "What is demerara sugar and when should I use it?",
        a: "Demerara is a raw cane sugar with large golden crystals and a distinct toffee and butterscotch note from residual molasses. It dissolves more slowly than white sugar so requires a bit more stirring, but the flavour payoff is worth it. It pairs exceptionally well with cold brew, dark roast espresso, and whisky-inspired coffee drinks. If you have ever tasted a particularly complex caramel note in a specialty coffee drink, demerara syrup is often behind it.",
      },
      {
        q: "What is muscovado sugar and how does it affect a syrup?",
        a: "Muscovado is an unrefined cane sugar with a very high molasses content, giving it a dark, almost sticky texture and a bold, deep flavour reminiscent of toffee, dark rum, and black treacle. It makes the most intensely flavoured brown sugar syrup you can produce at home. A small amount goes a long way. It pairs best with dark roast espresso, cold brew, and chocolate-forward drinks. Use it sparingly at first - it is significantly more powerful than regular brown sugar.",
      },
      {
        q: "What is coconut sugar and does it taste like coconut?",
        a: "Coconut sugar comes from the sap of coconut palm flowers, not the coconut fruit itself. It does not taste like coconut. The flavour is mild and slightly caramel-like, similar to a light brown sugar but with a more subtle depth. It has a lower glycaemic index than white sugar and dissolves well in syrups. It produces a slightly darker, lightly caramel-toned syrup that is a good everyday alternative to brown sugar without the intensity of demerara or muscovado.",
      },
      {
        q: "Can I use honey instead of sugar in any syrup recipe?",
        a: "Yes, with a few adjustments. Honey is sweeter than sugar so you can use about 3/4 of the amount the recipe calls for. The most important thing is not to boil it - high heat destroys the complex flavour compounds that make honey interesting. Warm it gently over low to medium heat just until it dissolves into the water. Raw honey and wildflower honey produce the most interesting syrups. Acacia honey is mild and nearly flavourless if you want sweetness without honey character. Buckwheat honey is dark and earthy and pairs well with cold brew.",
      },
      {
        q: "What is caster sugar and when should I use it for syrups?",
        a: "Caster sugar (also called superfine sugar) has smaller crystals than standard granulated sugar and dissolves faster, which means it reaches a smooth syrup stage more quickly. For hot syrups made on the stove there is no practical difference - both dissolve fully with heat. Caster sugar is more useful if you are making cold syrups or quick syrups that do not involve extended heating. Standard granulated sugar is perfectly fine for all the syrup recipes in this guide.",
      },
      {
        q: "What is turbinado sugar and how does it compare to demerara?",
        a: "Turbinado is a raw cane sugar similar to demerara - both have large golden crystals with residual molasses and a mild caramel flavour. The difference is subtle: demerara tends to be slightly crunchier and more intensely flavoured, while turbinado is a touch lighter and milder. They are largely interchangeable in syrup recipes. Both dissolve well with heat and produce a warm, lightly caramel-toned syrup that works beautifully in cold brew, iced lattes, and any drink where you want more depth than plain white sugar provides without the full intensity of muscovado.",
      },
      {
        q: "What is agave nectar and when should I use it in syrups?",
        a: "Agave nectar comes from the agave plant and has a neutral, clean sweetness that is slightly milder than honey and dissolves effortlessly in both hot and cold liquids without any heating required. This makes it ideal for quick cold syrups and drinks where you just want to add sweetness without cooking anything. It is about 1.5 times sweeter than sugar so use less - roughly 2/3 of the amount a recipe calls for. Light agave is nearly flavourless and works well in delicate syrups like lavender or vanilla where you do not want the sweetener to compete. Amber agave has more character and pairs better with caramel and spice-forward drinks.",
      },
    ],
  },
  {
    category: "Bean Freshness and Roast Dates",
    icon: "◎",
    items: [
      {
        q: "How fresh should my coffee beans be?",
        a: "For the best cup, you want beans that were roasted within the last 2 to 4 weeks. Right after roasting, beans release a lot of CO2 which can actually interfere with extraction - this is why very freshly roasted beans (within 2 to 3 days) can produce uneven results. The sweet spot for most beans is 7 to 21 days post-roast, when the CO2 has settled but the complex volatile compounds that carry flavour and aroma are still intact. After about 4 to 6 weeks the beans start going noticeably stale. After 3 months they are significantly degraded.",
      },
      {
        q: "What does a roast date on a bag mean?",
        a: "The roast date is the specific day the beans were roasted, printed by the roaster. It is the most useful piece of information on a coffee bag because it tells you exactly how fresh the coffee is. A best-before date tells you nothing about freshness - it only tells you the legal minimum shelf life, which is typically 12 to 24 months and is not a useful guide for specialty coffee. Always look for a roast date, not a best-before date. If a bag only has a best-before date with no roast date, that is usually a sign of lower-quality commodity coffee.",
      },
      {
        q: "What is degassing and why does it matter?",
        a: "Degassing is the process by which freshly roasted coffee releases carbon dioxide that built up during roasting. The CO2 escapes from the bean gradually over the first week or two after roasting. During this period, if you try to brew, the escaping gas creates turbulence in the coffee bed that can push water away from the grounds and cause uneven extraction - this is called channelling. This is why very fresh beans (within 48 to 72 hours of roasting) can taste oddly bright, sharp, or uneven. Most specialty roasters recommend letting beans rest for at least 5 to 7 days before brewing, and up to 2 weeks for espresso which is particularly sensitive to CO2.",
      },
      {
        q: "Why does my fresh bag of coffee have a one-way valve?",
        a: "That small valve on specialty coffee bags is a one-way degassing valve. It lets CO2 escape from the beans without letting oxygen in. Without it, the CO2 from freshly roasted beans would inflate and eventually burst the sealed bag. The valve is a good sign - it means the coffee was sealed while still fresh and actively degassing. Bags without valves are usually either pre-ground (which degasses much faster and does not need one) or filled with older coffee that has already finished degassing.",
      },
      {
        q: "How should I store coffee to keep it fresh?",
        a: "Store whole beans in an airtight container away from light, heat, and moisture at room temperature. A ceramic or opaque container with a one-way valve or a tight-sealing lid is ideal. Do not store coffee in the fridge - the temperature fluctuations and moisture from condensation when you remove and replace the container cause faster staling, and coffee absorbs fridge odours through its porous surface. Freezing is acceptable for long-term storage only if you divide beans into single-use airtight portions and thaw them completely before opening - never refreeze. For beans you are actively using, room temperature in an airtight container is correct.",
      },
      {
        q: "How can I tell if my beans are stale?",
        a: "The most reliable test is smell. Fresh beans smell intensely aromatic the moment you open the bag - complex, rich, and immediately identifiable as coffee. Stale beans smell flat, dull, cardboard-like, or faintly rancid. The second test is the bloom. When you pour hot water over fresh grounds during brewing, you should see an active bubble and rise as CO2 escapes. Stale beans barely react - the grounds just sit there. A flat, sluggish or non-existent bloom is a clear sign your beans are past their best. In the cup, stale coffee tastes flat, papery, and lifeless even when brewed correctly.",
      },
      {
        q: "Does roast level affect how quickly beans go stale?",
        a: "Yes. Dark roasts go stale faster than light roasts. The roasting process breaks down the cellular structure of the bean, making it more porous and more vulnerable to oxidation. Dark roasted beans have been through more heat and structural breakdown, so they lose their volatile compounds more quickly after roasting. A dark roast may taste best within 1 to 2 weeks of roasting, while a light roast can remain vibrant for 3 to 4 weeks or longer. This is one reason specialty roasters tend to favour lighter roast levels - they preserve more of the original bean character and have longer peak freshness windows.",
      },
      {
        q: "Does pre-ground coffee go stale faster than whole beans?",
        a: "Dramatically faster. Grinding dramatically increases the surface area of the coffee exposed to oxygen - a typical grind produces hundreds of small particles where previously there was one whole bean. This accelerates oxidation and CO2 release to the point where pre-ground coffee starts going noticeably stale within 15 to 30 minutes of grinding. Pre-ground coffee in a sealed bag is already significantly stale by the time you buy it, even if the bag is sealed. Grinding fresh immediately before brewing is one of the highest-impact changes you can make to coffee quality.",
      },
    ],
  },
  {
    category: "Cold Brew",
    icon: "❄",
    items: [
      {
        q: "What is cold brew and how is it different from iced coffee?",
        a: "Cold brew is made by steeping coarsely ground coffee in cold or room temperature water for 12 to 24 hours. Iced coffee is simply hot brewed coffee poured over ice. The difference in the cup is significant. Cold brew produces a smoother, lower-acid, naturally sweeter concentrate because the slow cold extraction pulls different compounds than hot water does. It never goes through the volatile flash-cooling that can make iced coffee taste sharp or bitter. Cold brew is generally more forgiving to make and keeps well in the fridge for up to 2 weeks.",
      },
      {
        q: "What ratio should I use for cold brew?",
        a: "For a concentrate (which you dilute before drinking), use a 1:4 to 1:5 ratio of coffee to water by weight - 100g of coffee to 400 to 500ml of water. This produces a strong concentrate you dilute with milk or water 1:1 when serving. For a ready-to-drink cold brew you can pour straight over ice, use a 1:8 ratio. The Brew Calculator has a cold brew setting that adjusts these ratios automatically. Starting with a concentrate gives you more flexibility since you can adjust strength when serving.",
      },
      {
        q: "How long should I steep cold brew?",
        a: "The standard range is 12 to 24 hours. 12 to 14 hours produces a lighter, brighter result. 18 to 20 hours is the sweet spot for most people - full extraction, smooth, and sweet. 24 hours produces a bolder, heavier concentrate. Steeping longer than 24 hours can lead to over-extraction with bitter or astringent notes, though this depends on grind size. Cold brew is forgiving - an extra hour or two rarely ruins it. Stir or swirl the container once or twice during the steep if you can.",
      },
      {
        q: "What grind size is best for cold brew?",
        a: "Extra coarse - the coarsest setting on most grinders, similar to cracked peppercorns or very coarse sea salt. The long steep time compensates for the open grind and extracts fully over 12 to 24 hours. Using a finer grind with the same steep time will over-extract and produce a bitter, astringent result. If your cold brew tastes bitter, grind coarser before adjusting anything else. The Interactive Grind Guide in the Guide tab shows what extra coarse should look like.",
      },
      {
        q: "What equipment do I need to make cold brew at home?",
        a: "The minimum is a large jar or container, coarse ground coffee, and cold water. You can steep directly in a mason jar and strain through a paper coffee filter, a fine mesh strainer, or a nut milk bag when done. Dedicated cold brew makers like the Toddy or OXO Cold Brew Maker have built-in filters that make straining cleaner and easier, but they are not necessary. A French Press works very well - steep in the press, then plunge and pour. Whatever method you use, double-straining through a paper filter after the initial strain produces the cleanest, most sediment-free result.",
      },
      {
        q: "How long does cold brew keep in the fridge?",
        a: "Cold brew concentrate keeps well in the fridge for up to 2 weeks in a sealed container. Ready-to-drink cold brew (already diluted) is best within 5 to 7 days. The long shelf life compared to hot coffee is because the cold extraction process produces fewer of the compounds that go rancid quickly, and the lack of heat means the coffee never goes through the oxidation that happens when hot coffee cools. If your cold brew starts tasting flat or sour before the 2 weeks are up, it usually means the beans were stale to begin with.",
      },
      {
        q: "Can I use any coffee for cold brew?",
        a: "Yes, but some work better than others. Medium to dark roast beans tend to produce the most crowd-pleasing cold brew - smooth, chocolatey, and sweet with low perceived acidity. Light roasts can produce interesting cold brew with more fruity and floral notes, but the result is more divisive and can taste thin or overly acidic to some palates. Natural process beans (dried with the fruit on) often produce particularly sweet and complex cold brew. Avoid very old or stale beans - cold brew amplifies staleness and produces a flat, hollow-tasting result.",
      },
      {
        q: "What is cold brew concentrate and how do I use it?",
        a: "Cold brew concentrate is cold brew made at a high coffee-to-water ratio (typically 1:4 or 1:5) that is too strong to drink straight. You dilute it before serving, typically 1:1 with water or milk. The advantage of making a concentrate is flexibility - you can adjust strength when serving and it keeps just as well as regular cold brew. To serve: add ice to a glass, pour equal parts concentrate and your liquid of choice (water, oat milk, regular milk), stir, and add any syrups. Barista oat milk poured directly over cold brew concentrate with no dilution water is a popular approach that produces a very creamy result.",
      },
    ],
  },
  {
    category: "AeroPress",
    icon: "⊟",
    items: [
      {
        q: "What is an AeroPress and why do people love it?",
        a: "The AeroPress is a manual brewing device that uses air pressure to push hot water through coffee grounds, producing a concentrated, smooth, low-acid cup in about 1 to 2 minutes. It was invented in 2005 by Alan Adler. People love it because it is extremely forgiving - small changes in technique do not ruin the cup the way they can with pour over. It is also fast, inexpensive, easy to clean, nearly unbreakable, and portable. There is an annual World AeroPress Championship where competitors share thousands of creative recipes, which speaks to how much room it has for experimentation.",
      },
      {
        q: "What grind size should I use for AeroPress?",
        a: "Medium-fine is the standard starting point - finer than a pour over grind but coarser than espresso. The beauty of AeroPress is that it is very tolerant of grind variation. You can go coarser and brew for longer, or finer and push through faster, and both can produce excellent results. If your cup tastes bitter, grind coarser or reduce brew time. If it tastes weak or sour, grind finer or add more coffee. The AeroPress rewards experimentation in a way that more precise methods like espresso do not.",
      },
      {
        q: "What is the inverted AeroPress method?",
        a: "The inverted method involves flipping the AeroPress upside down during brewing so the plunger end is at the bottom. This prevents water from dripping through the filter before you are ready to press, giving you more control over steep time and producing a slightly heavier bodied cup. You add water, stir, steep, attach the filter cap, flip over onto your cup, and press. It is a popular technique and worth trying once you are comfortable with the standard method. The main risk is spillage during the flip, which is easy to avoid with a confident motion.",
      },
      {
        q: "What water temperature should I use for AeroPress?",
        a: "Most AeroPress enthusiasts use cooler water than other brew methods - around 80 to 85 degrees Celsius (175 to 185 Fahrenheit). The lower temperature extracts differently than boiling water, producing a smoother and less bitter cup that many people prefer. James Hoffmann and other specialty coffee figures have written extensively about this. That said, the AeroPress works across a wide range of temperatures. If you prefer a brighter, more acidic cup, try 90 to 93 degrees. If you want smooth and round, go cooler. The Brew Calculator shows the recommended range.",
      },
      {
        q: "How much coffee should I use in an AeroPress?",
        a: "A standard AeroPress recipe uses 15 to 18 grams of coffee to 200 to 250ml of water, producing a full cup. For a more concentrated espresso-style shot, use 18 to 20 grams with only 40 to 60ml of water and dilute with hot water or milk afterward. The AeroPress is flexible enough to brew anything from a light filter-style cup to a thick concentrate depending on your ratio and technique. The Brew Calculator covers the standard ratio and lets you scale up or down.",
      },
      {
        q: "How do I clean an AeroPress?",
        a: "AeroPress is one of the easiest brewing devices to clean. After pressing, simply push the plunger all the way through to eject the coffee puck and paper filter directly into the bin. The puck comes out in a neat disc. Rinse the chamber and plunger under running water. That is all that is required after daily use. For a deeper clean, wash with mild dish soap once a week. The AeroPress is dishwasher safe on the top rack if you prefer. No oils accumulate the way they do in a French Press, which makes it one of the most low-maintenance brewing devices available.",
      },
    ],
  },
  {
    category: "Cleaning and Maintenance",
    icon: "◈",
    items: [
      {
        q: "How often should I clean my coffee grinder?",
        a: "For daily home use, a quick brush-out of the burrs and chute after every use keeps grounds from accumulating and going rancid. A deeper clean every 2 to 4 weeks involves removing the top burr (on most grinders this requires no tools) and brushing out all the coffee residue and oils with a stiff brush. Grinder cleaning tablets (like Grindz) can be run through periodically to absorb oils and dislodge stubborn residue. Rancid old grounds left in the grinder are one of the most common causes of mysteriously bad-tasting coffee.",
      },
      {
        q: "How do I clean a French Press?",
        a: "After brewing, add a small amount of cold water to the press and swirl to loosen the grounds, then pour the slurry directly into the bin rather than the sink (grounds clog drains over time). Disassemble the plunger - unscrew the mesh screens and plates, wash each piece with dish soap, and rinse thoroughly. Oils from coffee accumulate in the mesh and on the glass if not cleaned regularly, producing a rancid flavour that ruins fresh coffee. A thorough disassembly and wash once a week is sufficient for daily use. The glass carafe can go in the dishwasher.",
      },
      {
        q: "How do I descale an espresso machine?",
        a: "Descaling removes limescale deposits that build up from mineral content in water and block the internal workings of the machine over time. Most home espresso machines have a descaling cycle in their settings or manual. Use a purpose-made descaling solution (citric acid or Cafiza-style products) diluted in water according to the manufacturer's instructions. Run the descaling cycle, then run at least 2 full cycles of clean water through the machine afterward to flush all residue. For most home machines with average-hardness water, descale every 2 to 3 months. If you use very hard water, descale monthly.",
      },
      {
        q: "How do I backflush an espresso machine?",
        a: "Backflushing cleans the group head and shower screen by forcing soapy water back through the system in reverse. It requires a blind basket (a basket with no holes) inserted into the portafilter. Add a small amount of espresso cleaning powder (Cafiza or similar), run the machine in short cycles as per the manufacturer's guide, then repeat with clean water to rinse. Not all home machines support backflushing - check your manual. Machines with a three-way solenoid valve (most prosumer machines) benefit most from regular backflushing. Do this weekly for machines used daily.",
      },
      {
        q: "How do I clean a pour over dripper or Chemex?",
        a: "Rinse immediately after use with hot water - most residue washes away before it sets. For a deeper clean, wash with mild dish soap and a soft brush or sponge. Do not use abrasive scrubbers on glass drippers. Chemex recommends against soap for the glass carafe, preferring a rinse and occasional clean with ice, salt, and lemon juice to remove staining without chemicals. The wooden collar on a Chemex should not be submerged - wipe it clean with a damp cloth. Most ceramic drippers are dishwasher safe. For metal mesh filters, soak in hot water and scrub gently to remove built-up oils.",
      },
      {
        q: "How do I clean an AeroPress?",
        a: "After pressing, push the plunger all the way through to eject the coffee puck and paper filter into the bin in one clean disc. Rinse the chamber and plunger under running water. Wash with mild dish soap once a week. The AeroPress is dishwasher safe on the top rack. No deep cleaning or disassembly is needed for regular use - it is one of the most maintenance-free brewing devices available.",
      },
      {
        q: "How do I keep my portafilter basket clean?",
        a: "After every shot, knock out the puck and rinse the basket under hot running water immediately - espresso oils set quickly and become harder to remove. Once a week, soak the basket in a solution of hot water and espresso cleaning powder (Cafiza or similar) for 20 to 30 minutes, then scrub with a small brush. The tiny holes in the basket can clog with compacted coffee oils over time, which affects flow rate and shot consistency. A clean, well-maintained basket is one of the most underrated factors in consistent espresso quality.",
      },
    ],
  },
  {
    category: "Buying Coffee Beans",
    icon: "★",
    items: [
      {
        q: "What should I look for when buying specialty coffee beans?",
        a: "The most important thing on the bag is a roast date within the last 2 to 4 weeks. After that, look for origin information - country, region, and ideally the specific farm or cooperative. Processing method (washed, natural, honey) tells you a lot about what to expect in the cup. A tasting notes section written by the roaster gives you a rough flavour preview, though these are aspirational guides rather than guarantees. Avoid bags that only show a best-before date with no roast date, or generic descriptors like smooth or bold with no origin information.",
      },
      {
        q: "What is the difference between single origin and blend for a beginner?",
        a: "For a beginner exploring what coffee can taste like, single origin beans are more educational - each one tastes distinctly different and helps you understand how origin, processing, and roast level affect flavour. Ethiopian coffees, Colombian coffees, and Guatemalan coffees all taste noticeably different from each other. A blend combines beans from multiple origins for consistency and balance. Blends are often designed to taste good across multiple brew methods and milk ratios, making them reliable everyday coffees. Neither is better - start with single origins to explore, use blends when you want reliability.",
      },
      {
        q: "Where should I buy specialty coffee beans?",
        a: "Direct from specialty roasters is almost always the best option - the coffee is freshest, the roast dates are clear, and you are supporting independent businesses. Many excellent roasters ship directly and include roast date information on every bag. Local specialty coffee shops often sell retail bags of the beans they use in their drinks. Subscription services from roasters like Trade, Onyx, or Counter Culture deliver rotating fresh roasts to your door. Avoid supermarket coffee unless it clearly shows a recent roast date - most supermarket coffee is roasted months before it reaches the shelf.",
      },
      {
        q: "What does fair trade and direct trade mean on a coffee bag?",
        a: "Fair trade is a certification that guarantees farmers received a minimum price per pound of coffee above commodity market rates, along with community development premiums. It is administered by third-party certifying organisations. Direct trade is an informal term used by roasters who purchase beans directly from farms or cooperatives without an intermediary, often at prices above fair trade minimums and with ongoing relationships with farmers. Direct trade is not certified by any third party - it relies on the roaster's transparency. Both aim to improve farmer livelihoods, but direct trade relationships can be more flexible and sometimes result in higher quality and higher prices for producers.",
      },
      {
        q: "What does organic mean on a coffee bag?",
        a: "Certified organic coffee is grown without synthetic pesticides or fertilisers and is certified by an accredited third-party organisation. It does not inherently mean better quality - some of the world's best specialty coffees are not certified organic because certification is expensive and many small farms cannot afford it, even if their practices are effectively organic. Buy organic if it matters to you, but do not use it as a proxy for quality. A clear roast date and good origin information are more reliable quality signals.",
      },
      {
        q: "What roast level should a beginner start with?",
        a: "Medium roast is the most accessible starting point - it has enough sweetness and body to be satisfying without the sharp acidity of light roasts or the heavy bitterness of dark roasts. Colombian and Brazilian single origins at medium roast are particularly approachable. Once you are comfortable there, try a light roast from Ethiopia or Kenya to experience how dramatically different specialty coffee can taste. Dark roast is a personal preference - many people love it, but it tells you less about the underlying bean quality and origin character than lighter roasts do.",
      },
      {
        q: "How much should I expect to pay for good specialty coffee?",
        a: "Quality specialty coffee typically costs between 15 and 30 dollars per 250g bag, with exceptional microlot or competition-grade coffees going higher. Below that range you are likely getting commodity-grade coffee regardless of what the packaging says. The premium price reflects better farming practices, more careful processing, smaller batch roasting, and fresher delivery. The cost per cup when brewed at home is still significantly lower than buying the same quality from a coffee shop. If a bag claims to be specialty and costs significantly less than 12 to 15 dollars per 250g, look at the roast date and origin information carefully.",
      },
      {
        q: "What is a microlot coffee?",
        a: "A microlot is a small, separately harvested and processed batch of coffee from a specific section of a farm, a single picking date, or a particular experimental processing method. Because of the small quantity and careful handling, microlots often showcase unusually distinctive or high-scoring flavours. They are typically more expensive than standard single origin coffees from the same farm. When a roaster labels something a microlot, they are usually signalling something worth paying attention to - a unique variety, an experimental natural process, or an exceptional harvest from a particularly high-altitude plot.",
      },
    ],
  },
  {
    category: "Installing the App",
    icon: "↓",
    items: [
      {
        q: "Can I install Craft and Cup as an app on my phone?",
        a: "Yes. Craft and Cup is a Progressive Web App which means you can add it to your home screen and use it like a native app - no app store required. On iPhone, open Safari and visit mycraftcup.com, tap the three dots in the bottom right, tap Share, then tap Add to Home Screen. On Android Chrome, you should see an install prompt automatically.",
      },
      {
        q: "Why does it say I need to use Safari on iPhone?",
        a: "Apple only allows Add to Home Screen from Safari. If you are using Chrome, Firefox, or another browser on iPhone, you need to open Safari to install the app. The app will show you a banner with a Copy Link button so you can easily paste the URL into Safari.",
      },
      {
        q: "Is Craft and Cup on the App Store or Google Play?",
        a: "Not currently. It is available as a web app at mycraftcup.com and can be installed to your home screen as a PWA. A native app may come in the future.",
      },
      {
        q: "Does the app work offline?",
        a: "Some features work offline - you can browse beans and recipes stored locally, and use the brew calculator. Features that require the cloud like signing in, syncing data, and AI flavor analysis need an internet connection. The app will show an offline banner when you lose connection.",
      },
    ],
  },
  {
    category: "Magic Link Sign In",
    icon: "✉",
    items: [
      {
        q: "What is magic link sign in?",
        a: "Magic link is a passwordless sign in method. Enter your email address and tap Send. You will receive an email with a link - tap it and you are signed in. No password needed. It is especially useful on mobile where typing passwords is inconvenient.",
      },
      {
        q: "I did not receive the magic link email.",
        a: "Check your spam or junk folder first. The email comes from Supabase Auth and may be filtered. If it is not there, wait a few minutes and try again. There is a rate limit of a few emails per hour to prevent abuse. Make sure you typed your email address correctly.",
      },
      {
        q: "Can I use magic link and Google sign in on the same account?",
        a: "If you sign in with magic link using the same email address as your Google account, Supabase will link them automatically. You can then use either method to access the same account and data.",
      },
    ],
  },
  {
    category: "Troubleshooting",
    icon: "⚡",
    items: [
      {
        q: "The flavor wheel analysis is not working.",
        a: "First check your internet connection - the AI analysis requires a connection to work. If you are online and it still fails, you may have hit the rate limit of 10 analyses per hour. Wait for the limit to reset and try again. If the error persists, try rewording your tasting notes with more detail.",
      },
      {
        q: "My beans are not syncing between devices.",
        a: "Make sure you are signed in on both devices with the same account. Beans only sync through the cloud when you are signed in. If you created beans while signed out, they are stored locally on that device only. Sign in and the app will offer to migrate your local beans to the cloud.",
      },
      {
        q: "The app looks zoomed in or out of place.",
        a: "Try clearing your browser cache and reloading the page. On desktop, press Ctrl+Shift+R (or Cmd+Shift+R on Mac) for a hard refresh. If the issue persists, check that your browser zoom is set to 100 percent.",
      },
      {
        q: "I accidentally deleted a bean or recipe.",
        a: "When you delete a bean or recipe, an undo banner appears at the top of the list for 5 seconds. Tap Undo to restore it. If the undo window has passed, the deletion is permanent and cannot be reversed.",
      },
      {
        q: "Photos are not uploading.",
        a: "Make sure your image is under 5MB and is a JPEG, PNG, WebP, or GIF file. Other file types are not accepted. If the upload fails, check your internet connection and try again. You must be signed in to upload photos.",
      },
    ],
  },
];

export const ROAST_GUIDE = [
  {
    level: "White / Blonde",
    color: "#e8d8a0",
    temp: "160-175°C",
    icon: "○",
    tagline: "Barely roasted, raw-adjacent",
    characteristics: [
      "Very high acidity",
      "Very light tan colour",
      "Grassy, raw character",
      "Extremely dense bean",
      "Highest caffeine content",
    ],
    flavors: ["Grass", "Hay", "Raw grain", "Bread dough", "Sour", "Green apple"],
    body: 1,
    acidity: 5,
    sweetness: 1,
    bitterness: 1,
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
    characteristics: [
      "Very sharp acidity",
      "Thin body",
      "Light tan-brown",
      "Grainy sweetness",
      "Subtle complexity",
    ],
    flavors: ["Cinnamon", "Lemon", "Green tea", "Grain", "Sour apple", "Hay"],
    body: 1,
    acidity: 5,
    sweetness: 2,
    bitterness: 1,
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
    characteristics: [
      "Very high acidity",
      "Very light body",
      "Pale tan-brown",
      "Cereal-like",
      "Underdeveloped sweetness",
    ],
    flavors: ["Grain", "Hay", "Lemon", "Unripe apple", "Bread", "Mild floral"],
    body: 1,
    acidity: 5,
    sweetness: 2,
    bitterness: 1,
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
    characteristics: [
      "High acidity",
      "Light body",
      "Light-medium brown",
      "Floral and fruity",
      "No surface oil",
    ],
    flavors: ["Floral", "Citrus zest", "Berry", "White peach", "Honey", "Jasmine"],
    body: 2,
    acidity: 5,
    sweetness: 3,
    bitterness: 1,
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
    characteristics: [
      "Bright acidity",
      "Light-medium body",
      "Medium-light brown",
      "Clean and approachable",
      "No surface oil",
    ],
    flavors: ["Toast", "Mild citrus", "Caramel hint", "Grain", "Light fruit", "Nuts"],
    body: 2,
    acidity: 4,
    sweetness: 3,
    bitterness: 1,
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
    characteristics: [
      "High acidity",
      "No visible oil",
      "Light brown",
      "Dense bean",
      "High caffeine",
    ],
    flavors: ["Floral", "Citrus", "Berry", "Stone fruit", "Tea-like", "Herbal"],
    body: 2,
    acidity: 5,
    sweetness: 4,
    bitterness: 1,
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
    characteristics: [
      "Moderate acidity",
      "Light-medium body",
      "Medium-light brown",
      "Mild and smooth",
      "No surface oil",
    ],
    flavors: ["Toast", "Mild caramel", "Light nut", "Gentle citrus", "Grain", "Brown sugar"],
    body: 2,
    acidity: 3,
    sweetness: 3,
    bitterness: 2,
    desc: "Breakfast Roast is less of a precise temperature and more of a commercial style term. You will see it on supermarket bags and coffee shop menus to mean something smooth, mild, and easy to drink in quantity first thing in the morning. It usually sits in the light-to-medium range. Nothing too challenging, nothing too bold just pleasant and drinkable.",
    bestFor:
      "Drip machines, French Press, and everyday brewing. Great for people who drink multiple cups a day.",
    tip: "If someone tells you they hate specialty coffee because it tastes sour, hand them a good Breakfast Roast. It is a much gentler introduction.",
  },
  {
    level: "City",
    color: "#b88840",
    temp: "210-218°C",
    icon: "◑",
    tagline: "Light-medium, sweet and approachable",
    characteristics: [
      "Moderate-high acidity",
      "Developing body",
      "Medium-light brown",
      "Roast sweetness emerging",
      "No oil",
    ],
    flavors: ["Citrus", "Apple", "Caramel hints", "Nougat", "Dried fruit", "Milk chocolate"],
    body: 3,
    acidity: 4,
    sweetness: 4,
    bitterness: 2,
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
    characteristics: [
      "Balanced acidity",
      "Full body",
      "Medium-dark brown",
      "Roast sweetness prominent",
      "Traces of oil possible",
    ],
    flavors: ["Caramel", "Chocolate", "Brown sugar", "Dried cherry", "Toasted nuts", "Mild spice"],
    body: 4,
    acidity: 3,
    sweetness: 4,
    bitterness: 2,
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
    characteristics: [
      "Low-moderate acidity",
      "Heavy body",
      "Dark brown",
      "Slight oil sheen",
      "Bittersweet",
    ],
    flavors: ["Dark chocolate", "Roasted nuts", "Molasses", "Dried fruit", "Spice", "Smoke hints"],
    body: 4,
    acidity: 2,
    sweetness: 3,
    bitterness: 3,
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
    characteristics: [
      "Balanced acidity",
      "Full body",
      "Medium brown",
      "Roast sweetness prominent",
      "Minimal oil",
    ],
    flavors: ["Caramel", "Chocolate", "Nuts", "Mild fruit", "Brown sugar", "Toast"],
    body: 3,
    acidity: 3,
    sweetness: 4,
    bitterness: 2,
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
    characteristics: [
      "Low acidity",
      "Very full body",
      "Dark brown",
      "Oily surface",
      "Pronounced roast character",
    ],
    flavors: [
      "Bittersweet chocolate",
      "Smoky caramel",
      "Toasted bread",
      "Dried fruit",
      "Spice",
      "Smoke",
    ],
    body: 5,
    acidity: 2,
    sweetness: 2,
    bitterness: 3,
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
    characteristics: [
      "Low acidity",
      "Full body",
      "Very dark brown",
      "Oily sheen developing",
      "Pronounced roast character",
    ],
    flavors: [
      "Bittersweet chocolate",
      "Roasted grain",
      "Dark caramel",
      "Smoke hints",
      "Dried fruit",
      "Spice",
    ],
    body: 5,
    acidity: 1,
    sweetness: 2,
    bitterness: 3,
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
    characteristics: [
      "Very low acidity",
      "Very full body",
      "Near-black",
      "Very oily surface",
      "Sharp bitterness",
    ],
    flavors: ["Smoke", "Ash", "Dark chocolate", "Tobacco", "Charred sugar", "Rubber"],
    body: 5,
    acidity: 1,
    sweetness: 2,
    bitterness: 4,
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
    characteristics: [
      "Variable by roaster",
      "Usually medium-dark to dark",
      "Designed for espresso machines",
      "Heavy body",
      "Low to moderate acidity",
    ],
    flavors: ["Dark chocolate", "Caramel", "Toasted nuts", "Smoke hints", "Molasses", "Spice"],
    body: 4,
    acidity: 2,
    sweetness: 3,
    bitterness: 3,
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
    characteristics: [
      "Very low acidity",
      "Full body",
      "Very dark brown",
      "Oily surface",
      "Bold roast character with less harshness than full French",
    ],
    flavors: [
      "Smoke",
      "Dark chocolate",
      "Bittersweet caramel",
      "Toasted grain",
      "Dried fruit hints",
      "Light ash",
    ],
    body: 5,
    acidity: 1,
    sweetness: 2,
    bitterness: 4,
    desc: "Light French sits between Espresso Roast and full French roast. It has that bold, smoky European dark roast character but stops before the beans become fully carbonized. For people who love dark coffee but find French roast too harsh and one-dimensional, this is the sweet spot. You still get some bittersweet complexity rather than just ash and rubber. Some roasters label this as Half French or Dark French depending on their house style.",
    bestFor:
      "Espresso, Moka Pot, French Press. Works in milk drinks where you want a strong coffee flavour to cut through.",
    tip: "A good bridge roast if you enjoy dark coffee and want to explore beyond Vienna without committing to the full intensity of French roast.",
  },
  {
    level: "French",
    color: "#c87030",
    temp: "240-250°C",
    icon: "▪",
    tagline: "Extreme dark, carbonized edges",
    characteristics: [
      "Almost no acidity",
      "Maximum body",
      "Near-black beans",
      "Heavy oily surface",
      "Very sharp bitterness",
    ],
    flavors: ["Charcoal", "Bitter chocolate", "Tar", "Heavy smoke", "Carbon", "Rubber"],
    body: 5,
    acidity: 1,
    sweetness: 1,
    bitterness: 5,
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
    characteristics: [
      "No detectable acidity",
      "Maximum body",
      "Black beans",
      "Extremely oily",
      "Predominantly bitter and ashy",
    ],
    flavors: ["Ash", "Charcoal", "Carbon", "Bitter espresso", "Rubber", "Burnt sugar"],
    body: 5,
    acidity: 1,
    sweetness: 1,
    bitterness: 5,
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
    characteristics: [
      "No acidity at all",
      "Maximum body",
      "Near-black to black beans",
      "Extremely oily surface",
      "Intensely bitter and ashy",
    ],
    flavors: ["Pure carbon", "Ash", "Rubber", "Tar", "Char", "Acrid smoke"],
    body: 5,
    acidity: 1,
    sweetness: 1,
    bitterness: 5,
    desc: "Spanish roast is the darkest roast level with a recognised name. The beans are essentially carbonized pushed so far that you are tasting almost nothing of the original coffee bean at all. This roast is extremely rare and not used by any serious specialty roaster. It exists mainly as a historical curiosity from an era before coffee quality and roasting science were well understood. You are very unlikely to encounter this unless you roast at home and simply go too far.",
    bestFor: "Not recommended for any brewing method.",
    tip: "If you encounter beans this dark, they are almost certainly past the point of being enjoyable. This is included here for completeness and education rather than as a recommendation.",
  },
];

export const MILK_GUIDE = [
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
    hotDesc:
      "Whole milk is what every barista trains on because it steams better than anything else. The fat content creates a thick, glossy microfoam that is both stable and silky. Hot, it tastes rich and naturally sweet with a buttery quality that rounds off espresso perfectly.",
    icedDesc:
      "Iced, whole milk is clean and creamy without being heavy. It blends seamlessly with espresso and does not separate or water down. The classic choice for an iced latte.",
    bestDrinks: ["Latte", "Cappuccino", "Flat White", "Cortado"],
    steamTip:
      "Stretch early and quickly, then swirl to integrate. Whole milk is very forgiving and recovers from mistakes easily.",
    icedTip:
      "Pour over ice immediately after combining with espresso the fat content means it stays mixed without stirring.",
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
    hotDesc:
      "2% milk steams well and produces decent microfoam, though it is less stable and glossy than whole milk. The lower fat content means the foam is a bit airier and the drink feels lighter overall. Still a solid everyday choice for most milk drinks.",
    icedDesc:
      "Iced, 2% is refreshing and light. It has less of the creamy richness of whole milk but is a good option for people who want something a bit lighter without going fully to a plant milk.",
    bestDrinks: ["Latte", "Cappuccino", "Iced Latte", "Americano with milk"],
    steamTip:
      "Works best with slightly more aeration time than whole milk. The foam will be a little less stable so work quickly.",
    icedTip:
      "Shake or stir well if making ahead 2% milk separates a bit faster than whole milk over ice.",
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
    hotDesc:
      "Skim milk produces the most foam volume of any dairy milk because the lack of fat allows more air to be incorporated. The result is light, airy, and voluminous but not very stable or flavourful. It tastes thin and watery compared to whole or 2% milk. Cappuccinos made with skim milk will have a large foam cap but lack the richness of a classic version.",
    icedDesc:
      "Iced, skim milk is quite watery and does not add much to the drink. The espresso flavour dominates completely. Not a great choice for iced drinks if you want any creaminess.",
    bestDrinks: ["Cappuccino (for volume)", "Americano with milk"],
    steamTip:
      "Aerate more than you think you need to skim milk needs lots of air to produce a usable texture. Work fast before it collapses.",
    icedTip:
      "Not recommended for iced drinks unless you specifically want a very light, low-calorie option.",
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
    hotDesc:
      "Oat milk is the most popular alternative milk in specialty coffee for good reason. It steams well, produces a stable and creamy foam, and has a mild oat sweetness that complements espresso without fighting it. Barista-edition oat milks (like Oatly Barista) are specifically formulated to steam well and are significantly better than standard grocery store varieties.",
    icedDesc:
      "Iced oat milk is where it really shines. It is thick, naturally sweet, and incredibly creamy cold. An iced oat latte tastes almost dessert-like without any added sugar. This is why oat milk took over coffee shops.",
    bestDrinks: ["Iced Latte", "Latte", "Flat White", "Cortado", "Matcha Latte"],
    steamTip:
      "Always buy barista edition if you can. Standard oat milk will split and taste grainy when steamed. Keep it cold right up until you steam it.",
    icedTip:
      "Oat milk is arguably better iced than hot. Shake it well before using as it settles in the carton.",
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
    hotDesc:
      "Almond milk is notoriously difficult to steam. It separates easily, the foam is thin and collapses quickly, and it can taste slightly chalky or grainy when hot. The almond flavour competes with espresso rather than complementing it. That said, barista editions have improved significantly and are much more manageable than standard grocery varieties.",
    icedDesc:
      "Iced is where almond milk performs much better. Cold, it has a pleasant nutty lightness that works well in iced lattes and cold brew drinks. The flavour is refreshing rather than heavy.",
    bestDrinks: ["Iced Latte", "Cold Brew with milk", "Iced Americano with milk"],
    steamTip:
      "Use barista edition only. Keep it very cold, steam quickly, and do not over-aerate. Serve immediately before the foam separates.",
    icedTip:
      "Almond milk is much better iced than hot. Stir or shake well before using as it separates in the carton.",
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
    hotDesc:
      "Soy milk was the first widely available alternative milk in coffee shops and it steams surprisingly well producing a stable, creamy foam similar to whole milk in texture. The issue is the flavour. Soy has a distinct beany, slightly savoury quality that many people love but others find off-putting in coffee. It also curdles in very acidic espresso, so with light roasts you may see the milk split.",
    icedDesc:
      "Iced soy milk is creamy and thick but the beany flavour is more pronounced cold. It works well in cold brew drinks where the coffee is less acidic. Less popular iced than oat or almond due to the stronger flavour.",
    bestDrinks: ["Latte", "Cappuccino", "Cold Brew Latte"],
    steamTip:
      "Avoid pairing with very light, acidic espresso roasts as soy curdles at low pH. Medium roasts work best.",
    icedTip:
      "Shake well before using. Soy milk can taste quite beany cold so sweeter syrups pair well if the flavour is too strong.",
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
    hotDesc:
      "Coconut milk adds a very distinct tropical sweetness to hot drinks. It steams inconsistently carton coconut milk behaves differently from canned, and neither produces great microfoam. The coconut flavour dominates, so this works best in drinks where you actually want coconut as part of the flavour profile rather than a neutral base.",
    icedDesc:
      "Iced is where coconut milk makes much more sense. Cold coconut drinks feel tropical and refreshing, and the sweetness works naturally without feeling cloying. Iced coconut lattes with a touch of vanilla are genuinely excellent.",
    bestDrinks: ["Iced Latte", "Iced Americano", "Cold Brew Latte", "Specialty seasonal drinks"],
    steamTip:
      "Use carton coconut milk rather than canned for steaming canned is too thick and fatty. Accept that the foam will be loose and serve quickly.",
    icedTip:
      "Coconut milk is significantly better iced than hot. Shake the carton very well as it separates aggressively.",
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
    hotDesc:
      "Macadamia milk is underrated in the coffee world. It has a buttery, mild nuttiness that does not compete aggressively with espresso. Steaming is decent though not as reliable as oat or whole milk. The flavour is subtle enough to work as a neutral base while still adding a pleasant creaminess.",
    icedDesc:
      "Iced macadamia milk is excellent. Cold, the buttery richness comes through beautifully and it pairs especially well with medium roast espresso. Smoother and more neutral than almond or coconut iced.",
    bestDrinks: ["Iced Latte", "Latte", "Flat White", "Cold Brew Latte"],
    steamTip:
      "A relatively new option so barista editions are still limited. Standard macadamia milk steams adequately but watch for separation.",
    icedTip:
      "One of the best alt milks for iced drinks. The buttery quality holds up beautifully cold without being too heavy.",
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
    hotDesc:
      "Cashew milk is one of the creamiest and most neutral of all the nut milks. The flavour is very mild much less distinct than almond or coconut which makes it an excellent neutral base. It does not steam as well as oat milk but the result is creamy enough for most drinks.",
    icedDesc:
      "Iced cashew milk is creamy and smooth with very little of its own flavour getting in the way. It lets the espresso or coffee shine through while adding a pleasant richness. A great choice for people who want something creamy but do not want oat milk.",
    bestDrinks: ["Iced Latte", "Latte", "Cold Brew Latte", "Cortado"],
    steamTip:
      "Steams reasonably well for a nut milk. Barista editions are worth finding if available in your area.",
    icedTip:
      "Very solid iced option. The creaminess holds up well cold and the neutral flavour makes it versatile.",
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
    hotDesc:
      "Pea milk (made from yellow split peas, not green peas) is one of the best kept secrets in alternative milks. It steams surprisingly well, produces a stable foam, and has a very neutral flavour that does not interfere with the coffee. The name puts people off but the taste does not taste like peas at all. Ripple is the most well-known brand.",
    icedDesc:
      "Iced pea milk is clean, creamy, and very neutral. It performs comparably to oat milk cold without the oat sweetness, making it a great option for people who find oat milk too sweet.",
    bestDrinks: ["Latte", "Flat White", "Iced Latte", "Cappuccino"],
    steamTip:
      "Ripple Barista Edition steams very close to whole milk in texture. Genuinely impressive for an alt milk.",
    icedTip:
      "A great alternative if you want oat-milk-level performance without the sweetness. Very underrated iced.",
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
    hotDesc:
      "Rice milk is the most watery of all common milk alternatives. It has very little fat or protein which means it steams poorly producing almost no foam and a very thin texture. The flavour is mildly sweet with a slight rice character but mostly just tastes like thin water. It is primarily used by people with nut, soy, and oat allergies who have limited options.",
    icedDesc:
      "Iced, rice milk is very thin and watery. It adds almost no creaminess and the coffee flavour dominates completely. Not a great choice for lattes but works passably in iced Americanos where you just want a touch of lightness.",
    bestDrinks: ["Iced Americano with milk", "Cold brew lightly", "Allergy-friendly drinks"],
    steamTip:
      "Rice milk is genuinely very difficult to steam well. Manage expectations you will not get good microfoam. Use it only if allergies require it.",
    icedTip:
      "Add a small amount to iced drinks for lightness rather than using it as a full milk replacement. A dash goes a long way.",
  },
];

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_CATALOG = [
  { id:"bioregion", mark:"❋", shelf:"Ocotillo Field", topic:"Imperial County Bioregion", short:"Bioregion", color:"#417C98",
    intro:"A below-sea-level rift basin ringed by mountains — holding an accidental inland sea, the busiest bird stop on the Pacific Flyway, and a superheated aquifer now called “white gold.”",
    entries:[
      { id:"sea", t:"The Salton Sea", s:"An accidental inland sea", call:"551.48", type:"Field Note", media:"Aerial photograph of shoreline",
        b:["California’s largest lake is an accident. In 1905 the Colorado River broke through an irrigation intake and poured into the Salton Trough for roughly two years, filling a dry, below-sea-level basin. With no outlet, the Sea has been sustained only by farm runoff ever since.",
           "Fed by drainage and starved of fresh inflow after the 2003 water transfers, the Sea is shrinking and growing saltier. Its surface sits near −235 ft; as it recedes it exposes playa laced with selenium and arsenic that blows into surrounding communities as toxic dust."],
        f:[["Surface elevation","≈ −235 ft"],["Salinity","Saltier than the Pacific & rising"],["Corvina fishery","Collapsed ~2020"]],
        src:[["Salton Sea Management Program","https://saltonsea.ca.gov"],["USGS — Salton Sea studies","https://pubs.usgs.gov"]] },
      { id:"climate", t:"Sun & Climate", s:"One of the hottest, driest places in America", call:"551.69", type:"Report", media:"Photograph — the desert sun over the basin",
        b:["The Salton Trough is a low desert basin among the hottest and driest places in North America. Summer highs routinely top 110°F and have reached 120°+, while rainfall averages under three inches a year — the valley lives on imported Colorado River water, not on the sky.",
           "That same relentless sun is a resource. Some of the highest solar-energy potential in the United States falls on this basin, and utility-scale solar now shares the desert with geothermal power. But a warming climate is intensifying the heat, deepening drought on the Colorado, and speeding the Sea’s evaporation and its blowing dust."],
        f:[["Summer highs","Routinely 110°F+"],["Annual rainfall","Under 3 inches"],["Solar potential","Among the highest in the U.S."]],
        src:[["NOAA — climate data","https://www.ncei.noaa.gov"],["CA Energy Commission — solar","https://www.energy.ca.gov"]] },
      { id:"water", t:"Water Flows: The All-American Canal", s:"From snowmelt to tap", call:"627.13", type:"Map", media:"Map — Colorado River to the valley",
        b:["Nearly every drop in Imperial County begins as Rocky Mountain snowmelt. It travels the Colorado River, is diverted under century-old compacts, and enters the county through the All-American Canal — an 82-mile concrete channel that is the sole water source for over half a million acres of farmland and every tap in the valley.",
           "By the time water reaches a tap at Bombay Beach it has traveled more than 300 miles. The Imperial Irrigation District (IID) manages this delivery, holding some of the largest and most senior water rights on the entire river."],
        f:[["Canal length","82 miles"],["Journey to tap","300+ miles"],["Manager","Imperial Irrigation District"]],
        src:[["Imperial Irrigation District","https://www.iid.com"],["Colorado River Compact — Reclamation","https://www.usbr.gov/lc"]] },
      { id:"wildlife", t:"Wildlife & the Pacific Flyway", s:"A barometer in trouble", call:"598.072", type:"Field Guide", media:"Photograph — wintering flocks",
        b:["Despite its collapse, the Salton Sea is one of the most important migratory bird stops in North America — more than 400 species recorded. In winter the sky fills with snow geese, sandhill cranes, and white pelicans, and up to a million eared grebes gather here, the largest concentration on the continent.",
           "The Sea is a barometer in trouble. The corvina that supported a sport fishery is gone, and the endangered Ridgway’s rail — which needs cattail marsh — is the truest indicator of wetland health. Kit fox, coyote, jackrabbit, and desert bighorn range the basin and its mountains."],
        f:[["Bird species recorded","400+"],["Eared grebes (winter)","Up to 1 million"],["Key indicator","Ridgway’s rail (endangered)"]],
        src:[["Audubon — Salton Sea IBA","https://www.audubon.org"],["eBird — Salton Sea hotspot","https://ebird.org"]] },
      { id:"plants", t:"Native Plants of the Sonoran Desert", s:"Creosote, ocotillo & the bloom", call:"581.79", type:"Field Guide", media:"Photograph — desert scrub & bloom",
        b:["The valley floor was creosote-bursage scrub before the canals came — creosote bush, brittlebush, ocotillo, and cholla, with mesquite bosques in the sandy arroyos. Creosote is the pharmacy of the desert; its resin defends it from grazers and its leaves have long been brewed for colds and infection.",
           "After winter rain the desert can bloom: sand verbena, desert lily, and brittlebush carpet the bajadas, and nearby Anza-Borrego draws crowds for its superblooms. Along the Sea’s salty margin, saltgrass and invasive tamarisk now dominate."],
        f:[["Dominant community","Creosote–bursage scrub"],["First bloomers","Sand verbena, desert lily"],["Invasive","Tamarisk (saltcedar)"]],
        src:[["Calscape — native plants","https://calscape.org"],["Anza-Borrego bloom report","https://theabf.org"]] },
      { id:"geology", t:"Geology, Mountains & the Fault Lines", s:"A basin walled by ranges", call:"551.8", type:"Report", media:"Diagram — the Salton Trough rift & its ranges",
        b:["The Salton Trough is an active rift — the northern tip of the Gulf of California spreading system, where the Pacific and North American plates pull apart. That rifting dropped the basin more than 200 feet below sea level and left a superheated geothermal reservoir beneath it.",
           "The ranges that wall the basin tell the story. On the northwest, the Santa Rosa Escarpment rises abruptly from the desert floor — a steep, fault-controlled front of the Peninsular Ranges. On the east, the Chocolate Mountains, dark volcanic and metamorphic ridges, edge the trough. Between them the Brawley Seismic Zone links the San Andreas and Imperial faults, producing frequent earthquake swarms."],
        f:[["Basin depth","200+ ft below sea level"],["NW wall","Santa Rosa Escarpment"],["Eastern wall","Chocolate Mountains"],["Active zone","Brawley Seismic Zone"]],
        src:[["USGS — Salton Sea geology","https://pubs.usgs.gov"],["USGS — earthquakes","https://earthquake.usgs.gov"]] },
      { id:"lithium", t:"Geothermal & Lithium Valley", s:"Power born from the earth", call:"553.493", type:"Report", media:"Photograph — geothermal plant & brine",
        b:["Eleven commercial geothermal plants already tap the trough’s superheated brine to generate electricity. That same brine holds one of the world’s largest lithium deposits — enough, by U.S. Department of Energy estimates, for hundreds of millions of EV batteries. Officials now call the area “Lithium Valley.”",
           "Direct lithium extraction (DLE) promises a cleaner, closed loop: pull up brine, strip the lithium, reinject the rest. The first commercial plant, Hell’s Kitchen, aims for geothermal power first and lithium after. Community and tribal advocates warn that reviews understate impacts on water, air, and cultural resources."],
        f:[["Geothermal plants","11 commercial"],["Lithium","Among the world’s largest deposits"],["First plant","Hell’s Kitchen (CTR)"]],
        src:[["CA Energy Commission — Lithium Valley","https://www.energy.ca.gov"],["U.S. DOE — Lithium Valley","https://www.energy.gov"]] },
      { id:"infra", t:"Infrastructure: Water, Power & Waste", s:"What runs underneath", call:"363.7", type:"Field Note", media:"Photograph — canal, poles & playa",
        b:["Bombay Beach has no central sewage; homes use septic systems or cesspools, and greywater sinks into hypersaline sand. Farm wastewater across the valley drains directly into the Sea, driving salinity and toxic algal blooms. Trash transfers at Brawley to regional landfills, and illegal dumping is a persistent scar on the desert.",
           "Electricity is largely home-grown — geothermal and utility-scale solar feeding the CAISO grid — so local power is literally born from the earth underfoot. Yet the region ranks among California’s most environmentally burdened communities on CalEnviroScreen."],
        f:[["Sewage","Septic / cesspool (no central system)"],["Grid","CAISO — geothermal + solar"],["Burden","High on CalEnviroScreen"]],
        src:[["State Water Resources Control Board","https://www.waterboards.ca.gov"],["CalEnviroScreen — OEHHA","https://oehha.ca.gov"]] }
    ] },

  { id:"indigenous", mark:"◒", shelf:"Quechan Rattle", topic:"Indigenous People of Imperial County", short:"Indigenous", color:"#2E5534",
    intro:"The basin has been home for millennia to Cahuilla, Quechan, Kumeyaay, and Cocopah peoples — whose calendars, songs, and cosmologies are tuned to a lake that comes and goes.",
    entries:[
      { id:"nations", t:"The Nations of the Region", s:"Who this land belongs to", call:"970.004", type:"Overview", media:"Map — tribal territories",
        b:["Several nations hold this land. The Desert Cahuilla — including the Torres-Martinez Desert Cahuilla, whose reservation abuts and is partly flooded by the Sea — have lived in the Salton Trough for at least two thousand years. To the east along the Colorado are the Quechan (Yuma); to the south and west, the Kumeyaay; downstream toward the delta, the Cocopah.",
           "All remain present and sovereign. Far from historical footnotes, tribes are increasingly central to Salton Sea restoration, water governance, and lithium-development negotiations today."],
        f:[["Cahuilla presence","2,000+ years"],["Nations","Cahuilla, Quechan, Kumeyaay, Cocopah"],["Local reservation","Torres-Martinez Desert Cahuilla"]],
        src:[["Torres-Martinez Desert Cahuilla","https://www.torresmartinez.org"],["Kumeyaay Nation","https://www.kumeyaay.com"]] },
      { id:"lake", t:"Lake Cahuilla & Ancestral Subsistence", s:"Living with a vanishing lake", call:"970.1", type:"Field Note", media:"Illustration — fish weirs & mesquite",
        b:["For centuries a large freshwater lake — ancient Lake Cahuilla — filled this basin whenever the Colorado swung north, then evaporated when it swung back. The Cahuilla organized life around it: fishing corvina, mullet, and carp with weirs and nets, and drying the catch for trade.",
           "On land, mesquite pods were the staple — ground to flour and stored in woven granaries — supplemented by screwbean, agave hearts, chia, and pinyon. Rabbit drives and bighorn hunts rounded out a diversified, seasonal diet."],
        f:[["Ancient lake","Lake Cahuilla"],["Staple food","Mesquite flour"],["Fishing","Weirs & nets on the lake"]],
        src:[["Bean — ‘Mukat’s People’ (UC Press)","https://www.ucpress.edu"],["Malki Museum","https://www.malkimuseum.org"]] },
      { id:"objects", t:"Sacred Objects & Traditions", s:"Song held in a gourd", call:"299.7", type:"Oral History", media:"Photograph — gourd rattle & basketry",
        b:["Song is central. Cahuilla bird songs and Quechan song cycles carry cosmology, history, and territory across a whole night of singing, kept in time by the gourd rattle — a dried gourd filled with seeds or pebbles and fitted to a handle. Basketry, calibrated to the desert’s plants and seasons, is both craft and archive.",
           "These traditions are living, not preserved. Ceremony, language, and song continue, and revitalization efforts are recovering names and knowledge that colonization interrupted."],
        f:[["Instrument","Gourd rattle (song cycles)"],["Forms","Bird songs, basketry"],["Status","Living & revitalizing"]],
        src:[["Malki Museum","https://www.malkimuseum.org"],["Agua Caliente Cultural Museum","https://www.accmuseum.org"]] },
      { id:"names", t:"First Nations Names & Cosmology", s:"The lake that recurs", call:"398.2", type:"Oral History", media:"Illustration — the recurring lake",
        b:["The Cahuilla understood the trough as the bed of a lake that recurs — central to their cosmology and territorial identity, and organized around clan (sib) territories. Many place-names fell out of common use under colonization but are being recovered through language work.",
           "The Sea’s current crisis is read, in Cahuilla oral history, as a recapitulation of a loss the ancestors already survived — a flood and a drying the people have witnessed before."],
        f:[["Worldview","The recurring lake"],["Social unit","Clans (sibs)"],["Effort","Language revitalization"]],
        src:[["Agua Caliente Band of Cahuilla","https://www.aguacaliente.org"],["Malki Museum","https://www.malkimuseum.org"]] },
      { id:"contact", t:"Contact with Settlers", s:"When the water drowned the land", call:"979.4004", type:"History", media:"Archival photo — early settlement",
        b:["Spanish rancho grants, then American canals, reordered the basin. When the Colorado flooded the trough in 1905–07, it inundated part of the Torres-Martinez reservation — the same water that made the valley bloom drowned tribal land.",
           "Reservation boundaries, water diversions, and agricultural settlement dispossessed and reshaped Indigenous life across the twentieth century, even as communities endured."],
        f:[["Grants","Spanish ranchos"],["1905 flood","Inundated Torres-Martinez land"],["Pattern","Dispossession & endurance"]],
        src:[["Torres-Martinez Desert Cahuilla","https://www.torresmartinez.org"],["KCET — Salton Sea series","https://www.kcet.org"]] },
      { id:"sovereignty", t:"Sovereignty Today", s:"A decisive voice returns", call:"323.11", type:"Article", media:"Photograph — restoration site",
        b:["Tribes are asserting a decisive voice in the basin’s future. Torres-Martinez land ringing the Sea puts the tribe at the center of restoration and water-transfer decisions, and tribes must be consulted on lithium projects that touch cultural resources.",
           "Advocates have proposed protecting sacred features — including a cluster of volcanic domes near the southern Sea — as a cultural district, insisting development and cultural survival be held in balance."],
        f:[["Lever","Land around the Sea"],["Requirement","Tribal consultation on lithium"],["Proposal","Sacred cultural district"]],
        src:[["Salton Sea Authority","https://saltonsea.ca.gov"],["CA Truth & Healing Council","https://tribalaffairs.ca.gov"]] }
    ] },

  { id:"history", mark:"▤", shelf:"Water Rights Ledger", topic:"Imperial County History", short:"History", color:"#A27532",
    intro:"A century of engineering rewrote the desert — an accidental sea, a canal-fed empire of farms, contested water, and nine fragile colonias strung along the shore.",
    entries:[
      { id:"ancient", t:"Ancient Lake Cahuilla", s:"The basin has filled before", call:"979.499", type:"History", media:"Photograph — fossil shoreline",
        b:["Long before farms, the basin held ancient Lake Cahuilla, a freshwater lake far larger than today’s Sea. It formed whenever the Colorado River shifted north into the trough and vanished when the river returned to the Gulf — a cycle repeated over centuries.",
           "Old shorelines are still visible as a ‘bathtub ring’ on the surrounding mountains, marking how high the water once stood and reminding the valley that this basin has always filled and dried."],
        f:[["Feature","Ancient Lake Cahuilla"],["Behavior","Filled & dried in cycles"],["Evidence","Fossil shoreline on the ranges"]],
        src:[["‘Introduction to Water in California’ (UC Press)","https://www.ucpress.edu"],["USGS — Salton Sea","https://pubs.usgs.gov"]] },
      { id:"accident", t:"The Accidental Sea, 1905", s:"When the river turned inland", call:"979.499", type:"History", media:"Archival photo — the 1905 breach",
        b:["In 1905 spring floods overwhelmed a poorly built irrigation intake on the Colorado, and the entire river turned into the Salton Trough. For roughly two years engineers fought to close the breach as the river filled the basin, creating the modern Salton Sea.",
           "It was never meant to exist. Everything since — the resorts, the ecology, the dust — descends from that engineering failure and the decision to keep the basin farmed."],
        f:[["Year","1905"],["Cause","Irrigation-intake breach"],["Inflow","~2 years"]],
        src:[["Fradkin — ‘A River No More’","https://www.ucpress.edu"],["KCET — Salton Sea series","https://www.kcet.org"]] },
      { id:"canal", t:"The Canal System & the Birth of Agriculture", s:"Desert into farmland", call:"630.9794", type:"History", media:"Aerial — the green rectangle",
        b:["Canals turned one of the driest places in America into one of the most productive. Beginning with the Imperial Canal and later the All-American Canal, IID spread Colorado River water across ancient lakebed soils, and the ‘Imperial Valley’ became a year-round farm feeding the nation.",
           "That transformation is total: more than half a million acres of irrigated fields now cover the valley floor — a green rectangle visible from space in the middle of the Sonoran Desert."],
        f:[["Agency","Imperial Irrigation District"],["Irrigated land","500,000+ acres"],["Growing season","Year-round"]],
        src:[["Imperial County Farm Bureau","https://www.icfb.net"],["Imperial Irrigation District","https://www.iid.com"]] },
      { id:"rights", t:"Water Rights: Compacts to the QSA", s:"Who owns the river", call:"346.0469", type:"Report", media:"Diagram — the river’s division",
        b:["Imperial’s water rests on the 1922 Colorado River Compact, which divided the river among seven states, and on IID’s senior priority within California’s share. For decades the valley used more water than any other single user on the river.",
           "The 2003 Quantification Settlement Agreement (QSA) changed the math, transferring large volumes from Imperial farms to San Diego and the coast. Less inflow reached the Sea — accelerating its shrinkage and the dust crisis that followed."],
        f:[["Foundation","1922 Colorado River Compact"],["Turning point","2003 QSA"],["Effect","Water transferred to the coast"]],
        src:[["QSA history — IID","https://www.iid.com"],["Bureau of Reclamation","https://www.usbr.gov/lc"]] },
      { id:"colonias", t:"What Is a Colonia? The Nine", s:"Communities on the margin", call:"307.72", type:"Report", media:"Map — the nine colonias",
        b:["A colonia is a community within about 150 miles of the U.S.–Mexico border that lacks basics like potable water, adequate sewers, or safe housing. Of fifteen recognized colonias in Imperial County, nine sit in unincorporated areas — often isolated, majority-Hispanic, or depopulating former resort towns.",
           "The nine are Bombay Beach, Heber, Niland, Ocotillo, Palo Verde, Poe, Salton Sea Beach, Seeley, and Winterhaven. HUD designation makes them eligible for Community Development Block Grant funds to close those infrastructure gaps."],
        f:[["Definition","Border community lacking basic infrastructure"],["In Imperial County","15 recognized (9 unincorporated)"],["Funding","HUD CDBG Colonias set-aside"]],
        src:[["ICCED — Colonias","https://icced.imperialcounty.org/colonias/"],["SCAG — needs assessment","https://scag.ca.gov"]] },
      { id:"bombay", t:"Boom & Collapse: Bombay Beach", s:"A resort and its ruins", call:"979.499", type:"Field Note", media:"Archival photo — the resort era",
        b:["In the 1950s and ’60s the Salton Sea was a resort — yacht clubs, waterfront lots, and visitors like Sinatra and the Beach Boys. Bombay Beach was a getaway on a shimmering inland sea.",
           "Rising salinity and fish die-offs ended the dream; property crashed and most residents left. Today a small community of low-income residents, artists, and seasonal visitors lives among the ruins, and an art scene has grown in the wreckage."],
        f:[["Heyday","1950s–60s resort"],["Visitors","Sinatra, the Beach Boys"],["Now","Low-income residents & artists"]],
        src:[["KCET — Salton Sea series","https://www.kcet.org"],["Salton Sea History Museum","https://saltonseamuseum.org"]] },
      { id:"catastrophe", t:"The Slow-Motion Catastrophe", s:"A crisis unfolding by the foot", call:"363.7394", type:"Report", media:"Photograph — exposed playa",
        b:["As inflow fell, salinity rose past the tolerance of the food web: corvina disappeared around 2020 and bird numbers strained. Each foot the Sea drops uncovers more toxic playa, and windblown PM2.5 has given the region some of California’s worst air and highest childhood asthma rates.",
           "The state’s Salton Sea Management Program funds dust suppression and habitat ponds, but restoration lags the shrinkage — a crisis unfolding in slow motion on the doorstep of the colonias."],
        f:[["Corvina","Gone ~2020"],["Health","Elevated asthma from playa dust"],["Response","Salton Sea Management Program"]],
        src:[["Salton Sea Management Program","https://saltonsea.ca.gov"],["Comité Cívico del Valle","https://ccvhe.org"]] }
    ] },

  { id:"wider", mark:"⇄", shelf:"Train & Container", topic:"Imperial County & the Wider World", short:"Wider World", color:"#B15A3A",
    intro:"A poor desert county feeds the nation’s winter table, powers its grid, and sits thirty miles from an international border on the most fought-over river in America.",
    entries:[
      { id:"saladbowl", t:"Feeding the Nation: The Winter Salad Bowl", s:"When the country freezes, we harvest", call:"338.1", type:"Article", media:"Photograph — winter lettuce harvest",
        b:["When the rest of the country freezes, the Imperial Valley harvests. It is one of the only U.S. regions that grows field crops every month of the year, and in winter it supplies a huge share of the nation’s lettuce, broccoli, cauliflower, and leafy greens.",
           "Those greens are picked largely by Latinx farmworkers, many crossing daily from Mexicali, then trucked to distribution centers and onto plates coast to coast within days."],
        f:[["Nickname","America’s ‘winter salad bowl’"],["Season","Crops every month"],["Labor","Cross-border farmworkers"]],
        src:[["Imperial County Farm Bureau","https://www.icfb.net"],["United Farm Workers","https://ufw.org"]] },
      { id:"supply", t:"Cattle, Hay & the Global Supply Chain", s:"Colorado River water, exported", call:"636.2", type:"Article", media:"Photograph — alfalfa bales & feedlot",
        b:["Imperial is also cattle country — Brawley feedlots make it one of California’s top beef counties — and a hay powerhouse. Fields of alfalfa and Sudan grass, watered by the Colorado, are baled and shipped far beyond the valley.",
           "Much of that hay is exported overseas, including to dairies in Asia and the Middle East — meaning Colorado River water, embodied in alfalfa, effectively leaves the country by ship."],
        f:[["Beef","Top-tier California county"],["Key crops","Alfalfa & Sudan grass"],["Trade","Hay exported overseas"]],
        src:[["Imperial County Farm Bureau","https://www.icfb.net"],["USDA NASS","https://www.nass.usda.gov"]] },
      { id:"energy", t:"Energy for the Grid", s:"Exporting power & minerals", call:"333.79", type:"Report", media:"Photograph — solar & geothermal",
        b:["The county exports power as well as produce. Geothermal plants and vast solar arrays around the Sea feed the California grid (CAISO), and Lithium Valley aims to plug the region into the national EV-battery supply chain.",
           "The stakes are national: the Department of Energy treats domestic lithium as a critical-mineral security issue, and the Salton Sea’s brine could reduce U.S. dependence on foreign sources."],
        f:[["Grid","Exports to CAISO"],["Sources","Geothermal + solar"],["Frontier","Lithium for EV batteries"]],
        src:[["CA Energy Commission","https://www.energy.ca.gov"],["CAISO","https://www.caiso.com"]] },
      { id:"border", t:"The Border & Mexicali", s:"A seam, not an edge", call:"327.73", type:"Article", media:"Photograph — Calexico–Mexicali line",
        b:["The international line is about thirty miles south, and the twin cities of Calexico and Mexicali function as one cross-border economy of labor, trade, and family. Two rivers — the New and the Alamo — actually flow north into the Sea from Mexico, carrying water and pollution across the border.",
           "Imperial’s farms, factories, and stores depend on that daily flow of people and goods; the border is less an edge than a seam running through everyday life."],
        f:[["Distance to border","~30 miles"],["Twin cities","Calexico–Mexicali"],["Cross-border rivers","New & Alamo"]],
        src:[["Comité Cívico del Valle","https://ccvhe.org"],["SANDAG — border data","https://www.sandag.org"]] },
      { id:"river", t:"The Colorado River in Context", s:"One straw in a shared river", call:"333.91", type:"Report", media:"Map — the seven-state basin",
        b:["Imperial’s canal is one straw in a river shared by seven states, thirty tribes, and Mexico, and promised to more users than it can supply. The 1922 Compact over-allocated the flow, and decades of drought and overuse have pushed reservoirs like Mead and Powell to record lows.",
           "Because IID holds senior rights to a large slice, decisions in this desert county ripple across the whole Southwest — every acre fallowed or transferred here is water argued over in seven state capitals."],
        f:[["Shared by","7 states, 30 tribes & Mexico"],["Problem","Over-allocated & drought-stressed"],["Imperial’s role","Major senior right-holder"]],
        src:[["Bureau of Reclamation","https://www.usbr.gov/lc"],["USGS — Colorado River basin","https://www.usgs.gov"]] },
      { id:"litworld", t:"Lithium & the Clean-Energy World", s:"A hinge in the energy transition", call:"553.493", type:"Report", media:"Diagram — battery supply chain",
        b:["If Lithium Valley scales, this remote county becomes a hinge in the global energy transition — a domestic source for the batteries in electric cars, phones, and grid storage, in a market projected to grow many times over by mid-century.",
           "But it is a race. Falling prices and faster-permitting rivals in Arkansas, Nevada, and Texas threaten California’s lead, and local advocates insist that if the wealth leaves, the community must not be left with only the dust."],
        f:[["Prize","Domestic EV-battery lithium"],["Rivals","Arkansas, Nevada, Texas"],["Demand","Projected to grow sharply"]],
        src:[["CalMatters — Lithium Valley","https://calmatters.org"],["U.S. DOE","https://www.energy.gov"]] }
    ] }
];

const DEFAULT_SUGGESTIONS = [
  { id:"s1", theme:"bioregion", title:"2024 Salton Sea playa dust study", what:"New PM2.5 monitoring shows how far dust from the exposed playa carries into nearby colonias.", url:"https://pubs.usgs.gov/playa-dust-2024", name:"Maria Reyes" },
  { id:"s2", theme:"history", title:"Oral history: the Bombay Beach resort era", what:"Recorded interviews with residents who lived through the 1960s heyday and the collapse that followed.", url:"https://saltonseamuseum.org/oral-history", name:"Frank Delgado" },
  { id:"s3", theme:"wider", title:"Alfalfa water-export analysis, 2023", what:"Quantifies how much Colorado River water leaves the country embedded in exported hay.", url:"https://calmatters.org/hay-water-export", name:"" },
  { id:"s4", theme:"indigenous", title:"Torres-Martinez restoration testimony", what:"Tribal council statement laying out priorities for Salton Sea restoration and consultation.", url:"https://torresmartinez.org/testimony", name:"J. Miranda" }
];

const DEFAULT_SOURCES = [
  { id:"src1", theme:"bioregion", label:"USGS — Salton Sea studies", url:"https://pubs.usgs.gov", item:"The Salton Sea", date:"2 days ago" },
  { id:"src2", theme:"wider", label:"CalMatters — Lithium Valley", url:"https://calmatters.org", item:"Lithium & the Clean-Energy World", date:"4 days ago" },
  { id:"src3", theme:"history", label:"Imperial Irrigation District", url:"https://www.iid.com", item:"The Canal System", date:"5 days ago" },
  { id:"src4", theme:"indigenous", label:"Malki Museum", url:"https://www.malkimuseum.org", item:"Sacred Objects & Traditions", date:"1 week ago" },
  { id:"src5", theme:"bioregion", label:"Audubon — Salton Sea IBA", url:"https://www.audubon.org", item:"Wildlife & the Pacific Flyway", date:"1 week ago" },
  { id:"src6", theme:"history", label:"Salton Sea Management Program", url:"https://saltonsea.ca.gov", item:"The Slow-Motion Catastrophe", date:"2 weeks ago" },
  { id:"src7", theme:"wider", label:"Bureau of Reclamation", url:"https://www.usbr.gov/lc", item:"The Colorado River in Context", date:"2 weeks ago" }
];

async function seed() {
  console.log("Seeding Catalog...");
  const catalogInserts = [];
  DEFAULT_CATALOG.forEach(cat => {
    cat.entries.forEach(entry => {
      catalogInserts.push({
        theme_id: cat.id,
        slug: entry.id,
        title: entry.t,
        subtitle: entry.s,
        call_no: entry.call,
        type: entry.type,
        media_caption: entry.media,
        body_text: entry.b,
        facts: entry.f ? entry.f.map(f => ({ k: f[0], v: f[1] })) : [],
        sources: entry.src ? entry.src.map(s => ({ label: s[0], url: s[1] })) : []
      });
    });
  });
  
  await supabase.from('environmental_catalog').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: catErr } = await supabase.from('environmental_catalog').insert(catalogInserts);
  if (catErr) console.error('Catalog Error:', catErr.message);
  else console.log(`Inserted ${catalogInserts.length} catalog items`);

  console.log("Seeding Suggestions...");
  await supabase.from('environmental_suggestions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const sugInserts = DEFAULT_SUGGESTIONS.map(s => ({
    theme_id: s.theme,
    title: s.title,
    description: s.what,
    url: s.url,
    submitter_name: s.name || null
  }));
  const { error: sugErr } = await supabase.from('environmental_suggestions').insert(sugInserts);
  if (sugErr) console.error('Suggestions Error:', sugErr.message);
  else console.log(`Inserted ${sugInserts.length} suggestions`);

  console.log("Seeding Sources...");
  await supabase.from('environmental_sources').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const srcInserts = DEFAULT_SOURCES.map(s => ({
    theme_id: s.theme,
    label: s.label,
    url: s.url,
    item_description: s.item
  }));
  const { error: srcErr } = await supabase.from('environmental_sources').insert(srcInserts);
  if (srcErr) console.error('Sources Error:', srcErr.message);
  else console.log(`Inserted ${srcInserts.length} sources`);

  console.log("Seeding Complete!");
}

seed();

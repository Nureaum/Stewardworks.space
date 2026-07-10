// Shared catalogue + persistence bridge for the Workforce Development pathways atlas
// and its Steward console. Mirrors field-content.js from Environmental Literacy so the
// developer can map the same shape onto Supabase tables.
//
// Library integration: every entry & approved source also belongs in the Steward Library
// under "Industry and Workforce Development", tagged with the pathway tag below
// (*Content Creator Resource or *Environmental Career Resource).

export const LIBRARY_BOOK = "Industry and Workforce Development";

export const PATHWAYS = [
  {
    id: "creator",
    name: "Content Creator",
    tag: "*Content Creator Resource",
    color: "#B15A3A",
    mark: "◍",
    shelf: "Field Studio",
    tagline: "Tell human stories people watch, read, play & buy",
    intro: "A creator is a one-person media company — and every business, agency, and cause in the valley needs one. This trail covers the working roles behind the word “creator,” the portfolio that proves you can do them, and the tools (including AI) that let a small team punch far above its weight.",
    stops: [
      { id: "terrain", name: "Know the Terrain", mark: "⌖", color: "#B15A3A", mesa: true,
        blurb: "The real jobs behind “content creator” — what they're called, what they pay attention to, and where they overlap.",
        entries: [
          { id: "map", t: "The Creator Economy, Mapped", s: "One skillset, many doors", call: "331.7", type: "Overview", media: "Diagram — creator roles and where they overlap",
            b: ["“Content creator” is not one job — it's a skillset that opens many. The same core loop (notice a story → shape it → publish it → read the response) powers social media managers, brand designers, video editors, podcast producers, game developers, marketing consultants, and independent creators building their own audience.",
                "Most working creators mix several income streams at once: a part-time role, client work, and their own channel. That mix is the norm, not a failure to pick one — which is exactly why the portfolio strategy (next stop) matters more here than any single job title."],
            f: [["Core loop","Notice → shape → publish → learn"],["Typical income","2–3 streams mixed"],["Entry cost","A phone and consistency"]],
            src: [["Creator economy overview — SignalFire","https://signalfire.com/blog/creator-economy"],["Bureau of Labor Statistics — media occupations","https://www.bls.gov/ooh/media-and-communication"]] },
          { id: "marketing", t: "Marketing, Branding & Social Media Management", s: "Every business is a media company now", call: "659.1", type: "Career Profile", media: "Photograph — small-business shoot on Main Street",
            b: ["The steadiest creator work is making other people look good: running social accounts for a restaurant or clinic, designing brand identities, shooting product photos, writing email campaigns. Every farm stand, agency, and family business in the valley competes online now, and most have nobody in-house who can do this.",
                "Titles to search: social media manager, content marketing specialist, brand designer, digital marketing coordinator. Locally this is often freelance or part-time first — three small retainer clients can equal a full-time wage, and each one adds a case study to your portfolio."],
            f: [["Search titles","Social media manager · brand designer · marketing coordinator"],["Local reality","Freelance/retainer first, W-2 later"],["Proof that hires","Before/after case studies"]],
            src: [["American Marketing Association — careers","https://www.ama.org/careers"],["HubSpot free marketing certifications","https://academy.hubspot.com"]] },
          { id: "storytelling", t: "Storytelling, Advocacy & Influence", s: "Audience as a public voice", call: "070.4", type: "Career Profile", media: "Photograph — creator filming at the Salton Sea shoreline",
            b: ["Some creators build an audience around a cause or a place — documenting the Salton Sea, translating air-quality data for neighbors, telling border-community stories that outside media gets wrong. This is journalism, organizing, and entertainment braided together, and it can become paid work: grants, brand partnerships, speaking, and roles at advocacy orgs.",
                "Environmental-justice groups like Comité Cívico del Valle hire communicators; state programs fund community storytellers. This is also where the two pathways on this page meet — an environmental career and a creator career can be the same career."],
            f: [["Forms","Documentary, explainer, campaign content"],["Funders","Grants, orgs, partnerships"],["Crossover","Environmental storytelling is a real niche"]],
            src: [["Comité Cívico del Valle","https://ccvhe.org"],["KCET — Salton Sea storytelling","https://www.kcet.org"]] },
          { id: "games", t: "Games & Interactive Media", s: "Play is a career", call: "794.8", type: "Career Profile", media: "Screenshot — indie game dev environment",
            b: ["Game development is content creation with systems: art, writing, sound, and code in one artifact. Indie tools (Godot, Unity, Roblox Studio, Twine) have collapsed the barrier — solo and two-person teams ship commercial games, and studios hire for narrative design, environment art, QA, and community management.",
                "The MESA connection is direct: game dev is applied math and physics. A student who can code a projectile arc or balance an economy has a portfolio piece that doubles as an engineering credential."],
            f: [["Free engines","Godot · Unity · Roblox Studio"],["Entry roles","QA, community, narrative, art"],["MESA link","Applied math & physics, visibly"]],
            src: [["Godot Engine — free & open source","https://godotengine.org"],["Game Dev field guide — GDC Vault","https://gdcvault.com"]] },
          { id: "entrepreneur", t: "Creator Entrepreneurship & Consulting", s: "Build the asset you own", call: "658.11", type: "Career Profile", media: "Photograph — pop-up market table with QR code",
            b: ["The ceiling of creator work is ownership: your channel, your product line, your consulting practice. Market and asset consulting — helping a business figure out what content to make, auditing their brand, managing their ad spend — pays professional rates once you can show results.",
                "The Becoming Project runs small-business training right here in the north end (Calipatria), built for residents starting home-based businesses. Pairing that with a creator skillset is a genuinely local route to self-employment."],
            f: [["Local program","The Becoming Project — 8-week course, north end"],["Consulting rates","Professional, once proven"],["Asset","An audience or client base you own"]],
            src: [["The Becoming Project","https://www.becomingprojectinc.org"],["SBA — start a business","https://www.sba.gov"]] }
        ] },
      { id: "portfolio", name: "The Portfolio Strategy", mark: "▣", color: "#A27532", mesa: true,
        blurb: "Why a portfolio beats a resume in creative work — and the forms it can take.",
        entries: [
          { id: "what", t: "What Is a Portfolio Career?", s: "An asset you steer, not a ladder you climb", call: "650.14", type: "Field Note", media: "Diagram — one portfolio feeding many income streams",
            b: ["A portfolio career means your working life is a set of parallel strands — client work, a part-time role, your own projects, teaching — held together by a body of work that proves what you can do. Instead of one employer defining you, the portfolio does, and you re-weight the strands as your needs change: more client work when you need income, more of your own projects when you're building something.",
                "This is the primary strategy of this whole page. A degree expires on a resume line; a portfolio compounds. Every project you finish makes the next one easier to get — it is an asset you own and leverage according to your needs."],
            f: [["Definition","Multiple strands, one body of work"],["Advantage","Compounds; survives layoffs"],["You control","The mix, the story, the direction"]],
            src: [["Harvard Business Review — portfolio careers","https://hbr.org"],["The Portfolio Life — Christina Wallace","https://www.christinawallace.com"]] },
          { id: "forms", t: "The Forms a Creator Portfolio Takes", s: "Reel, feed, site, case study", call: "686.2", type: "Field Guide", media: "Collage — portfolio formats side by side",
            b: ["A creator portfolio is rarely a PDF. It's a 60–90 second reel for video work; a well-kept public feed that shows consistency; a one-page site with 3–5 case studies for client work; an itch.io or GitHub page for games and interactive; a media kit with audience numbers once you have them.",
                "Pick the form your target work actually consumes. A restaurant owner will watch a reel; a marketing director wants case studies with numbers; a game studio wants a playable build. Three finished pieces beat thirty fragments — curate ruthlessly."],
            f: [["Video work","60–90s reel"],["Client work","3–5 case studies + results"],["Games","Playable build on itch.io"]],
            src: [["itch.io — host playable work free","https://itch.io"],["Behance — portfolio examples","https://www.behance.net"]] },
          { id: "start", t: "Building It From Zero", s: "Invent the client if you have to", call: "158.1", type: "Field Note", media: "Photograph — first project, phone on a tripod",
            b: ["No clients yet? Assign yourself. Redesign a real local business's feed and show the before/after (then offer it to them). Document a place you know better than anyone — that's a portfolio piece and an audience seed. Enter game jams; ship in 48 hours. The unit of progress is the finished piece, not the follower count.",
                "Ship small and often: a piece a week for ten weeks outperforms a masterpiece a year. Each one teaches you the loop — and gives the suggest-a-resource librarians here something to catalogue."],
            f: [["Rule","Finished > perfect"],["Cadence","Small piece weekly"],["Spec work","Redesign real local businesses"]],
            src: [["Global Game Jam","https://globalgamejam.org"],["#100DaysOfCode model","https://www.100daysofcode.com"]] },
          { id: "leverage", t: "Leveraging the Portfolio", s: "Same asset, four uses", call: "650.13", type: "Field Note", media: "Diagram — portfolio → job, client, grant, audience",
            b: ["One portfolio converts four ways: attached to a job application it beats a resume; shown to a business it wins client work; cited in a grant or program application it proves capacity; published consistently it grows an audience that becomes its own economy.",
                "This is why the portfolio comes before the job search, not after. When an opportunity appears — a posting on the board below, a Lithium Valley comms role, a program like Creating Coding Careers' apprenticeships — you apply with evidence, not promises."],
            f: [["Job apps","Evidence beats claims"],["Clients","Portfolio is the sales pitch"],["Grants","Proof of capacity"]],
            src: [["Creating Coding Careers — apprenticeships","https://cccareers.org"],["CalJOBS","https://www.caljobs.ca.gov"]] }
        ] },
      { id: "story", name: "Story & Resume", mark: "✎", color: "#417C98", mesa: false,
        blurb: "Turning your life — this valley, both languages, real responsibility — into career material.",
        entries: [
          { id: "mine", t: "Mining Your Life for Material", s: "You already have a story archive", call: "808.06", type: "Field Note", media: "Photograph — family photos & field notebook",
            b: ["Growing up here is material: cross-border life, harvest seasons, dust days, quinceañera economics, fixing things because replacing them wasn't an option. The experiences students are taught to hide on applications are exactly what makes content specific — and specificity is what audiences and employers respond to.",
                "Make an inventory: 10 things you've done that had real stakes, 10 things you can explain better than most people, 10 moments that changed your mind. That list is your content calendar, your cover-letter bank, and your interview prep, all at once."],
            f: [["Exercise","3 lists of 10"],["Principle","Specific beats polished"],["Your edge","Stories outsiders can't tell"]],
            src: [["StoryCenter — digital storytelling","https://www.storycenter.org"],["The Moth — story structure","https://themoth.org"]] },
          { id: "resume", t: "The Resume, Rebuilt", s: "Achievements, not duties", call: "650.142", type: "How-To", media: "Side-by-side — duty resume vs achievement resume",
            b: ["A working resume is one page of outcomes: “grew the taquería's Instagram from 200 to 4,000 followers in 6 months; weekend lines doubled” — not “responsible for social media.” Numbers, timespans, and results. Lead with a link to the portfolio; the resume's job is to get the portfolio opened.",
                "Use AI as a drafting partner, not a ghostwriter: paste your three lists of 10 and ask it to draft achievement bullets, then rewrite every line in your own voice. Recruiters can smell an unedited template."],
            f: [["Formula","Verb + number + result"],["Length","One page"],["First line","Portfolio link"]],
            src: [["America's Job Center — resume help (El Centro)","https://www.ivworkforce.com"],["CalJOBS resume builder","https://www.caljobs.ca.gov"]] },
          { id: "narrative", t: "Career Storytelling", s: "The thread that ties the strands", call: "153.85", type: "Field Note", media: "Illustration — braided career timeline",
            b: ["A portfolio career needs a narrative or it reads as scattered. Practice the two-minute version: where you started, what you kept choosing, what you're building toward. “I started filming my uncle's fields to sell equipment, learned editing, now I run content for three ag businesses and I'm studying drone mapping” — that's a thread anyone can follow and repeat to others.",
                "Your story is also your differentiation. Thousands of editors know CapCut; very few can say “I document the communities around an inland sea most of America has never heard of.”"],
            f: [["Practice","2-minute version, out loud"],["Structure","Started → kept choosing → building toward"],["Test","Can someone retell it?"]],
            src: [["MESA student success storytelling — IVC","https://www.imperial.edu/students/mesa/"],["LinkedIn — About section guide","https://www.linkedin.com"]] }
        ] },
      { id: "tools", name: "Tools & AI Kit", mark: "⚒", color: "#2E5534", mesa: true,
        blurb: "The free stack, the AI multipliers, and the places to learn them.",
        entries: [
          { id: "stack", t: "The Free Creator Stack", s: "Professional output, zero budget", call: "006.68", type: "Toolkit", media: "Grid — free tool logos",
            b: ["You can produce professional work without buying anything: CapCut or DaVinci Resolve for video; Canva and Figma for design; OBS for streaming and screen capture; Audacity for audio; Godot for games; Notion or a plain notebook for the pipeline. Phone camera first — lenses later.",
                "Learn tools by shipping with them, not by watching tutorials about them. One finished piece per tool teaches you more than a course."],
            f: [["Video","CapCut · DaVinci Resolve"],["Design","Canva · Figma"],["Games","Godot · Twine"],["Audio","Audacity"]],
            src: [["DaVinci Resolve — free","https://www.blackmagicdesign.com/products/davinciresolve"],["Figma — free tier","https://www.figma.com"]] },
          { id: "ai", t: "AI as a Creative Multiplier", s: "One person, small-studio output", call: "006.3", type: "Toolkit", media: "Screenshot — AI-assisted edit session",
            b: ["Used well, AI collapses the boring 80%: drafting scripts and captions, cleaning transcripts, generating storyboards and thumbnails, translating content into Spanish and back, summarizing research, writing first-pass code for interactive pieces. That frees your hours for the part only you can do — taste, judgment, and knowing this place.",
                "The skill that pays is direction: writing precise briefs, iterating on outputs, and knowing when the machine is wrong. “AI content creator” increasingly appears in job postings as exactly this — a person who can drive the tools toward a brand's voice."],
            f: [["Use for","Drafts, variants, translation, cleanup"],["Keep human","Taste, voice, judgment"],["Job skill","Prompting & directing, not just generating"]],
            src: [["Anthropic — learn to work with Claude","https://www.anthropic.com"],["Google AI Essentials (free course)","https://grow.google/ai-essentials"]] },
          { id: "learn", t: "Where to Learn: Cohorts & Communities", s: "Courses built by working practitioners", call: "374.4", type: "Directory", media: "Collage — learning platform screens",
            b: ["Beyond YouTube: Maven hosts cohort courses taught by working creators and marketers; The Multiverse School runs hands-on technical AI classes; AI Learning Labs and LearnVibe teach applied AI skills and vibe-coding; Design Science Studio connects art and regenerative design; Black Tech Link runs free tech training and community in Southern California.",
                "Creating Coding Careers (San Diego) registers Department of Labor apprenticeships that pay you while you learn — a real bridge from creator-adjacent skills into tech wages."],
            f: [["Cohort courses","maven.com"],["Applied AI","themultiverse.school · ailearninglabs.io · learnvibe.build"],["Community","blacktechlink.org"],["Paid apprenticeships","cccareers.org"]],
            src: [["Maven","https://maven.com"],["The Multiverse School","https://themultiverse.school"],["AI Learning Labs","https://ailearninglabs.io"],["LearnVibe","https://learnvibe.build"],["Black Tech Link","https://blacktechlink.org"],["Design Science Studio","https://designscience.studio"]] },
          { id: "distribution", t: "Distribution & the Numbers", s: "Publishing is half the craft", call: "384.3", type: "Toolkit", media: "Chart — audience analytics dashboard",
            b: ["Making the thing is half the job; getting it seen is the other half. Learn one platform's analytics deeply (watch time, saves, shares — not just likes), keep a simple spreadsheet of what worked, and repurpose every piece three ways: the video becomes a carousel becomes a newsletter item.",
                "For client work, reporting is the deliverable: a monthly one-pager showing growth is what gets retainers renewed. The MESA students in the room have an advantage here — this is just data analysis wearing sunglasses."],
            f: [["Watch","Retention & shares, not likes"],["Habit","Repurpose 1 piece → 3 formats"],["Client skill","Monthly results one-pager"]],
            src: [["YouTube Creator Academy","https://www.youtube.com/creators"],["Meta Blueprint — free courses","https://www.facebook.com/business/learn"]] }
        ] },
      { id: "hiring", name: "Who's Hiring", mark: "⚑", color: "#3C2A18", mesa: false,
        blurb: "Local demand, remote demand, and the boards where creator work is posted.",
        entries: [
          { id: "local", t: "Local Demand: The Unadvertised Market", s: "Most valley creator work is never posted", call: "331.12", type: "Field Note", media: "Photograph — El Centro storefronts",
            b: ["Most creator work in Imperial County never hits a job board — it's the restaurant that needs a menu shot, the ag supplier who wants product videos, the clinic that needs bilingual social posts. The move is direct outreach with proof: a one-minute spec edit of their business gets replies that resumes never will.",
                "Anchor institutions hire too: the county, IID, hospitals, school districts, and colleges all employ communications and public-information staff — stable W-2 creator jobs with benefits, posted on government boards."],
            f: [["Hidden market","Direct outreach + spec work"],["Stable roles","County/IID/district PIO & comms"],["Advantage","Bilingual content"]],
            src: [["Imperial County jobs","https://www.governmentjobs.com/careers/imperialcounty"],["IID careers","https://www.iid.com/careers"]] },
          { id: "remote", t: "Remote & Border-Regional Work", s: "The valley's location stops mattering", call: "331.25", type: "Field Note", media: "Photograph — laptop, hotspot, desert horizon",
            b: ["Creator work is the most remote-friendly career category there is: editing, design, social management, and community moderation are hired nationally at valley cost-of-living. San Diego's tech and creative market is two hours away and increasingly hybrid — orgs like Black Tech Link and Creating Coding Careers are direct bridges into it.",
                "Build the remote-work muscle deliberately: portfolio site, async communication habits, a reliable setup. One remote retainer at coastal rates changes the math of staying home."],
            f: [["Remote-first roles","Editing · design · social · community"],["Bridge orgs","Black Tech Link · CCC (San Diego)"],["Leverage","Coastal rates, valley costs"]],
            src: [["Black Tech Link","https://blacktechlink.org"],["We Work Remotely — creative","https://weworkremotely.com"]] },
          { id: "programs", t: "Programs That Pay You to Level Up", s: "Apprenticeships & funded training", call: "331.259", type: "Directory", media: "Photograph — cohort classroom",
            b: ["The Imperial County Workforce Development Board funds training through WIOA — if a creator-adjacent program (digital marketing, media production) is on the Eligible Training Provider List, tuition can be covered. America's Job Center in El Centro is the front door: computers, Wi-Fi, resume help, and program enrollment.",
                "Creating Coding Careers registers DOL apprenticeships in tech roles; The Becoming Project trains north-end entrepreneurs. Stack them: funded training → apprenticeship → portfolio → clients."],
            f: [["Front door","AJCC El Centro (1550 W Main St)"],["Funding","WIOA via ICWDB"],["Paid learning","DOL registered apprenticeships"]],
            src: [["ICWDB / AJCC","https://www.ivworkforce.com"],["Creating Coding Careers","https://cccareers.org"],["The Becoming Project","https://www.becomingprojectinc.org"]] }
        ] },
      { id: "mesa", name: "MESA Basecamp", mark: "▲", color: "#417C98", mesa: true,
        blurb: "For IVC MESA students: your math/science training is a creator superpower, not a detour.",
        entries: [
          { id: "why", t: "Why MESA Skills Transfer", s: "Technical fluency is rare among creators", call: "507.1", type: "Field Note", media: "Photograph — MESA lab bench & camera",
            b: ["The rarest creator profile is the one who actually understands the technical subject. Science communication, data visualization, engineering explainers, and STEM education content are underserved niches where MESA training — statistics, physics, programming — is the moat. You can verify claims, read papers, and make charts that are actually correct.",
                "Concretely: a MESA student who can run a regression can make analytics-driven content decisions; one who knows Python can automate a content pipeline; one who's built a bridge model can explain Lithium Valley engineering to the community it's landing on."],
            f: [["Niche","STEM & data storytelling"],["Moat","You can check the math"],["Demand","Science explainer content is exploding"]],
            src: [["IVC MESA Program","https://www.imperial.edu/students/mesa/"],["3Blue1Brown — the model","https://www.3blue1brown.com"]] },
          { id: "channels", t: "The Student Portfolio Channel", s: "Document the degree in public", call: "371.3", type: "How-To", media: "Screenshot — study-with-me & project log",
            b: ["The lowest-friction student portfolio: document what you're already doing. Project logs, lab-to-layman explainers, “how I passed Calc II,” MESA competition builds. It compounds into three assets at once — a portfolio, a study tool (teaching forces understanding), and an audience of peers who become your network.",
                "Keep it sustainable: one post a week, tied to coursework. By transfer time you have two years of public evidence of technical and communication skill — which reads beautifully on UC applications and internship forms."],
            f: [["Cadence","1 post/week from coursework"],["Payoff","Portfolio + study tool + network"],["Reads well on","Transfer & internship apps"]],
            src: [["IVC MESA","https://www.imperial.edu/students/mesa/"],["Obsidian — public notes","https://obsidian.md"]] },
          { id: "supports", t: "Campus & Transfer Supports", s: "Use the machinery built for you", call: "378.1", type: "Directory", media: "Photograph — IVC campus",
            b: ["MESA at IVC exists to move you into STEM degrees and careers: tutoring, a study center, transfer advising, internship pipelines, and industry field trips. Layer the creator path on top — MESA's competitions and projects are portfolio material, and its network is your first audience.",
                "SDSU Imperial Valley's new Science & Engineering Laboratories in Brawley expand what you can do without leaving the county, and its media/communication coursework pairs with a creator practice."],
            f: [["At IVC","MESA center — tutoring, advising, internships"],["In Brawley","SDSU IV Science & Engineering Labs"],["Strategy","Every project → portfolio piece"]],
            src: [["IVC MESA","https://www.imperial.edu/students/mesa/"],["SDSU Imperial Valley","https://iv.sdsu.edu"]] }
        ] }
    ]
  },
  {
    id: "enviro",
    name: "Environmental Careers",
    tag: "*Environmental Career Resource",
    color: "#2E5534",
    mark: "❋",
    shelf: "Field Station",
    tagline: "Steward the air, water, land & wildlife of the basin",
    intro: "Imperial County is one of the most consequential environmental workplaces in America — a shrinking sea, the nation's winter farmland, a lithium boom, and communities on the front line of all three. This trail maps the agencies and orgs that hire here, the field skills they want, and the portfolio that proves you have them.",
    stops: [
      { id: "terrain", name: "Know the Terrain", mark: "⌖", color: "#2E5534", mesa: true,
        blurb: "The five job families of environmental work in the basin — agency, air, water, ag, and wildlife.",
        entries: [
          { id: "agency", t: "Agency Careers: The Public Backbone", s: "County, state & federal payrolls", call: "354.3", type: "Overview", media: "Photograph — agency field truck on a canal road",
            b: ["Most environmental jobs here are public: Imperial County (Air Pollution Control District, Environmental Health, Public Works), state agencies (CDFW, Water Boards, CA Natural Resources Agency and its Salton Sea Management Program), and federal (US Fish & Wildlife at the Sonny Bono Salton Sea Refuge, BLM, USDA). They hire technicians, inspectors, scientists, and program staff.",
                "Public hiring runs on its own rails — CalCareers for state, USAJOBS for federal, county HR portals — with exam-style applications. Entry titles to watch: Environmental Services Intern, Scientific Aid, Environmental Scientist, Air Quality Technician."],
            f: [["State portal","CalCareers"],["Federal portal","USAJOBS"],["Entry titles","Scientific Aid · Technician · Intern"]],
            src: [["CalCareers","https://calcareers.ca.gov"],["USAJOBS","https://www.usajobs.gov"],["CA Natural Resources Agency","https://resources.ca.gov"]] },
          { id: "air", t: "Air Quality: Testing & Protecting", s: "The dust is the job", call: "628.53", type: "Career Profile", media: "Photograph — PM10 monitor on the playa edge",
            b: ["As the Sea shrinks, exposed playa dust has made air quality the county's defining environmental health issue — and a job engine. Air-quality technicians run monitoring networks, specialists analyze PM10/PM2.5 data, inspectors check compliance, and community programs like Comité Cívico del Valle's IVAN network hire locally to maintain neighborhood sensors.",
                "Skills that get you hired: instrument maintenance, data logging and QA, GIS mapping of readings, and the ability to explain results to residents in Spanish and English."],
            f: [["Employers","County APCD · CARB · CCV"],["Community network","IVAN air monitors"],["Skills","Instruments, data QA, GIS, bilingual reporting"]],
            src: [["Imperial County APCD","https://apcd.imperialcounty.org"],["IVAN Air Monitoring","https://ivan-imperial.org"],["CARB careers","https://ww2.arb.ca.gov"]] },
          { id: "water", t: "Water: Quality, Rights & Delivery", s: "The most engineered resource in America", call: "628.1", type: "Career Profile", media: "Photograph — All-American Canal gates",
            b: ["Water work spans the Imperial Irrigation District (canal operations, water resources, lab techs), the Regional Water Board (quality monitoring, enforcement), and restoration programs sampling the Sea and its drains. IID is one of the county's largest employers, with apprenticeships and technical tracks that don't require a four-year degree.",
                "Watch for: water treatment/distribution operator certs (SWRCB), lab analyst roles, hydrographers, and the Salton Sea monitoring contracts that state programs fund locally."],
            f: [["Big employer","IID — operations & apprenticeships"],["Certs","SWRCB operator grades"],["Growth","Sea monitoring & restoration"]],
            src: [["IID careers","https://www.iid.com/careers"],["State Water Boards — jobs","https://www.waterboards.ca.gov"],["Salton Sea Management Program","https://saltonsea.ca.gov"]] },
          { id: "ag", t: "Agriculture & Ag-Tech", s: "Half a million acres of employer", call: "630.2", type: "Career Profile", media: "Photograph — winter lettuce harvest & drone",
            b: ["The valley's farms need pest control advisers, irrigation techs, food-safety auditors, soil lab staff, and increasingly drone pilots and ag-data analysts. The Imperial Valley Research Center and UC desert research stations hire field and lab assistants — classic first jobs for science students.",
                "Ag is also where environmental careers begin quietly: water efficiency, soil health, and pesticide regulation are all environmental science wearing work boots."],
            f: [["Rising roles","Drone mapping · ag data · food safety"],["Research","IV Research Center · UC ANR"],["License track","PCA / QAL"]],
            src: [["UC ANR — Desert Research & Extension","https://desertrec.ucanr.edu"],["USDA ARS — careers","https://www.ars.usda.gov/careers"]] },
          { id: "wildlife", t: "Wildlife, Ecology & Restoration", s: "400 species need staff", call: "590.7", type: "Career Profile", media: "Photograph — bird survey at dawn, Unit 1",
            b: ["The Salton Sea is a Pacific Flyway keystone, and its crisis has created restoration work: the Species Conservation Habitat project (thousands of acres of engineered ponds), refuge operations at Sonny Bono NWR, Audubon's Salton Sea program, and CDFW field crews. Roles run from seasonal bird-survey techs to restoration ecologists and heavy-equipment-adjacent habitat construction.",
                "Seasonal tech work is the standard entry — apply broadly, stack two or three seasons, and keep a field notebook that becomes your portfolio (next stop)."],
            f: [["Flagship project","SCH — Species Conservation Habitat"],["Employers","CDFW · USFWS · Audubon · SS Authority"],["Entry","Seasonal field technician"]],
            src: [["Species Conservation Habitat project","https://saltonsea.ca.gov/planning/species-conservation-habitat/"],["Audubon Salton Sea","https://ca.audubon.org/saltonsea"],["Sonny Bono Salton Sea NWR","https://www.fws.gov/refuge/sonny-bono-salton-sea"]] },
          { id: "lithium", t: "Lithium Valley & Clean Energy", s: "The boom arriving next door", call: "553.499", type: "Career Profile", media: "Photograph — geothermal plant at the south shore",
            b: ["Geothermal-lithium projects forecast roughly 700 permanent and 1,000 construction jobs in the near term, and the county's new Lithium Valley workforce ordinance is designed to route them to local residents through apprenticeships and training requirements. Environmental monitoring, permitting, and community-benefit compliance are job categories the boom creates directly.",
                "Environmental careers and the boom intersect: someone has to do the air, water, and habitat monitoring around every plant — and communities want those monitors to be from here."],
            f: [["Near-term jobs","~700 permanent · ~1,000 construction"],["Local-hire rule","Lithium Valley workforce ordinance (2026)"],["Enviro angle","Monitoring & compliance roles"]],
            src: [["Lithium Valley — CA Energy Commission","https://www.energy.ca.gov/lithiumvalley"],["RAND — Imperial lithium workforce strategy","https://www.rand.org/pubs/research_reports/RRA3836-1.html"]] }
        ] },
      { id: "portfolio", name: "The Portfolio Strategy", mark: "▣", color: "#A27532", mesa: true,
        blurb: "Field evidence beats credentials-only applications — the scientist's version of a portfolio.",
        entries: [
          { id: "what", t: "The Portfolio Strategy, Field Edition", s: "Proof of fieldwork, not just coursework", call: "650.14", type: "Field Note", media: "Photograph — field notebook, GPS & sample bottles",
            b: ["In environmental work the portfolio is your documented field record: species lists with photos, water-sample logs, maps you've made, monitoring reports, restoration hours. Two applicants with the same degree are separated by one thing — evidence of real fieldwork, however humble.",
                "The portfolio-career logic applies here too: seasonal tech gigs, a monitoring contract, volunteer survey work, and tutoring can run in parallel, all feeding one body of evidence you leverage toward permanent roles."],
            f: [["Portfolio =","Documented field record"],["Separator","Evidence of real fieldwork"],["Structure","Parallel gigs → one record"]],
            src: [["iNaturalist — public field record","https://www.inaturalist.org"],["eBird — survey history","https://ebird.org"]] },
          { id: "forms", t: "Forms It Takes: Notebooks, Maps, Data", s: "iNaturalist to GIS story maps", call: "025.34", type: "Field Guide", media: "Collage — iNaturalist profile, QGIS map, report cover",
            b: ["Concrete forms an environmental portfolio takes: an iNaturalist/eBird profile with hundreds of verified observations; a QGIS or ArcGIS story map of a real local question (where does playa dust travel?); a tidy data notebook analyzing public datasets (CalEnviroScreen, USGS gauges); a monitoring report written like the agency ones; photos of you doing the work, dated and located.",
                "Public data makes this possible without a job: the Salton Sea is one of the most-instrumented ecosystems anywhere. Analyze what's already published and your portfolio can be genuinely useful before you're ever hired."],
            f: [["Free platforms","iNaturalist · eBird · QGIS"],["Public data","USGS · CalEnviroScreen · SSMP reports"],["Bonus","Dated, located field photos"]],
            src: [["QGIS — free GIS","https://qgis.org"],["CalEnviroScreen","https://oehha.ca.gov/calenviroscreen"],["USGS Salton Sea data","https://pubs.usgs.gov"]] },
          { id: "certs", t: "Certs + Portfolio, Together", s: "Stackable credentials with evidence attached", call: "331.259", type: "Field Guide", media: "Photograph — cert cards & field gear",
            b: ["Short credentials that move applications here: HAZWOPER 40, SWRCB water operator grades, pesticide QAL, drone Part 107, first aid/CPR, 4WD field safety. Cheap or WIOA-fundable, and each pairs naturally with a portfolio artifact — your Part 107 plus an actual orthomosaic map of a real site is a hire.",
                "IVC and SDSU IV are adding programs aimed at Lithium Valley and STEM fields; ask MESA and the workforce board what's ETPL-funded this year before paying for anything."],
            f: [["High-value certs","HAZWOPER · Part 107 · SWRCB grades"],["Funding","WIOA via ICWDB — ask first"],["Pairing","Cert + artifact = hire"]],
            src: [["ICWDB training","https://www.ivworkforce.com"],["FAA Part 107","https://www.faa.gov/uas"]] },
          { id: "service", t: "Service Corps: The Paid On-Ramp", s: "Get paid to build the record", call: "361.2", type: "Directory", media: "Photograph — corps crew planting habitat",
            b: ["Conservation corps are the classic environmental portfolio-builders: the California Conservation Corps pays a wage plus scholarships for habitat and emergency-response work; AmeriCorps and the new California Climate Action Corps place members with local environmental orgs; SCA runs conservation internships on refuges.",
                "A corps year yields exactly what agencies screen for — documented field hours, references inside the system, and hiring preferences (some corps alumni get direct-hire authority for federal jobs)."],
            f: [["Programs","CCC · Climate Action Corps · SCA"],["Yield","Field hours + references + hiring preference"],["Wage","Paid, with education award"]],
            src: [["California Conservation Corps","https://ccc.ca.gov"],["California Climate Action Corps","https://climateactioncorps.ca.gov"],["Student Conservation Association","https://thesca.org"]] }
        ] },
      { id: "story", name: "Story & Resume", mark: "✎", color: "#417C98", mesa: false,
        blurb: "Government applications are a genre. Learn it — and translate your lived experience into it.",
        entries: [
          { id: "gov", t: "Cracking the Government Application", s: "CalCareers & USAJOBS are a genre", call: "351.1", type: "How-To", media: "Screenshot — CalCareers application flow",
            b: ["Public-sector applications reward people who learn the format: minimum qualifications are checklists (mirror their exact language), state jobs often need an exam first (take exams early, they stay valid), and federal resumes run 3–5 pages with hours-per-week listed. None of this measures talent — it measures whether someone showed you the rails.",
                "Set up saved searches on CalCareers, USAJOBS, and CalJOBS for Imperial County + your titles, and treat AJCC El Centro as a coach — that's literally their job."],
            f: [["State","Exam first — take them early"],["Federal","3–5 page resume, hours listed"],["Coach","AJCC El Centro, free"]],
            src: [["CalCareers exams","https://calcareers.ca.gov"],["USAJOBS help center","https://help.usajobs.gov"],["AJCC / ICWDB","https://www.ivworkforce.com"]] },
          { id: "lived", t: "Lived Experience Is Environmental Expertise", s: "You grew up inside the case study", call: "304.2", type: "Field Note", media: "Photograph — dust storm over a school yard",
            b: ["If you grew up here you already hold environmental knowledge agencies badly need: what dust days do to a classroom, how canal water structures a town, which families fish the drains, why meetings in English-only fail. Community-based orgs and agencies funding environmental-justice work hire specifically for this fluency.",
                "On applications, translate it: “15 years living in a CalEnviroScreen top-decile community; bilingual; organized neighbors for county air-monitor siting input” is qualification language, not biography."],
            f: [["Reframe","Biography → qualification"],["Buyers","EJ programs, community liaisons"],["Language","Use the metrics (CalEnviroScreen, PM10)"]],
            src: [["Comité Cívico del Valle","https://ccvhe.org"],["CA EJ grants — CalEPA","https://calepa.ca.gov/envjustice"]] },
          { id: "star", t: "STAR Stories for Field Interviews", s: "Situation, task, action, result", call: "650.144", type: "How-To", media: "Illustration — STAR structure card",
            b: ["Agency interviews are structured: “tell me about a time you handled X.” Prepare six STAR stories — safety decision, data mistake you caught, conflict on a crew, explaining science to a non-scientist, equipment failure, deadline under heat. Draw them from any work: packing sheds and restaurant shifts produce excellent STAR stories.",
                "Write them down, say them out loud, keep each under 90 seconds. Interview skill is rehearsal, not charisma."],
            f: [["Prepare","6 stories, 90 seconds each"],["Sources","Any real responsibility counts"],["Method","Written, then rehearsed aloud"]],
            src: [["USAJOBS interview guidance","https://help.usajobs.gov"],["MESA career prep — IVC","https://www.imperial.edu/students/mesa/"]] }
        ] },
      { id: "tools", name: "Tools & AI Kit", mark: "⚒", color: "#2E5534", mesa: true,
        blurb: "Field instruments, open data, GIS, and AI for the analysis and paperwork layers.",
        entries: [
          { id: "field", t: "The Field & Data Stack", s: "The free instruments of the trade", call: "550.28", type: "Toolkit", media: "Grid — QGIS, iNaturalist, spreadsheet, GPS",
            b: ["The employable baseline: QGIS for mapping, spreadsheets you actually trust (clean data, documented steps), iNaturalist/eBird for species records, Survey123 or Epicollect for field forms, basic Python or R for anything repetitive. All free; all learnable through one real local project each.",
                "Pick questions that matter here: map the sensors near your town, chart a decade of a USGS gauge, build a species list for one wetland unit. Local questions make every tutorial stick — and every result is a portfolio artifact."],
            f: [["Map","QGIS"],["Record","iNaturalist · eBird"],["Analyze","Sheets → Python/R"],["Collect","Survey123 / Epicollect"]],
            src: [["QGIS training materials","https://qgis.org/en/docs"],["Epicollect5 — free field forms","https://five.epicollect.net"]] },
          { id: "ai", t: "AI for the Science Layer", s: "Reports, literature, and translation", call: "006.3", type: "Toolkit", media: "Screenshot — AI-assisted monitoring report draft",
            b: ["Environmental work drowns in documents — monitoring reports, EIRs, grant narratives, permit conditions. AI is a legitimate accelerator: summarize a 400-page EIR before a community meeting, draft the boilerplate sections of a report, translate outreach materials, or explain a method you're learning. The professional skill is verification — you sign what you submit.",
                "AI + domain knowledge is a differentiator on this side too: agencies are hiring people who can automate data pipelines and communicate findings, and very few field-credible candidates have those skills yet."],
            f: [["Use for","EIR summaries, drafts, translation"],["Never skip","Verification — you sign it"],["Edge","Field skills + AI literacy is rare"]],
            src: [["AI Learning Labs","https://ailearninglabs.io"],["Google AI Essentials","https://grow.google/ai-essentials"]] },
          { id: "watch", t: "Know the Data That Watches This Place", s: "The basin's public instruments", call: "025.06", type: "Directory", media: "Map — monitoring stations around the Sea",
            b: ["Fluency with the local datasets is an interview superpower: IVAN and county PM10 networks (air), USGS gauges and Water Board portals (water), SSMP habitat monitoring (ecology), CalEnviroScreen (community burden), DWR and IID reports (water accounting). Knowing where the numbers live — and their limitations — signals you're already doing the job.",
                "Practice: pick one dataset and present it to someone in plain language. That's the core professional act of environmental work in a place like this."],
            f: [["Air","IVAN · APCD monitors"],["Water","USGS · Water Boards"],["Ecosystem","SSMP monitoring reports"],["Burden","CalEnviroScreen"]],
            src: [["IVAN Imperial","https://ivan-imperial.org"],["SSMP documents","https://saltonsea.ca.gov"],["CalEnviroScreen map","https://experience.arcgis.com/experience/11d2f52282a54ceebcac7428e6184203"]] }
        ] },
      { id: "hiring", name: "Who's Hiring", mark: "⚑", color: "#3C2A18", mesa: false,
        blurb: "The agencies, orgs, and companies of the basin — and the boards they post on.",
        entries: [
          { id: "roster", t: "The Employer Roster", s: "Who actually signs paychecks here", call: "331.12", type: "Directory", media: "Logo wall — basin employers",
            b: ["Public: Imperial County (APCD, Environmental Health), IID, CDFW, USFWS (Sonny Bono NWR), Water Boards, CNRA/SSMP, BLM, USDA/ARS. Nonprofit: Audubon California, Comité Cívico del Valle, Alianza Coachella Valley, The Becoming Project. Private: geothermal & lithium operators (CTR, BHE Renewables, EnergySource), solar developers, ag employers and their compliance teams, environmental consultancies doing basin fieldwork.",
                "The Salton Sea Authority and the Salton Sea Conservancy (new as of 2024) coordinate restoration — small staffs, but their project pages are a map of who's getting contracts, which is a map of who's hiring."],
            f: [["Restoration hubs","SS Authority · SS Conservancy · SSMP"],["Energy","CTR · BHE · EnergySource"],["Community","CCV · Alianza · Becoming Project"]],
            src: [["Salton Sea Authority","https://saltonseaauthority.org"],["Salton Sea Program — CNRA","https://saltonsea.ca.gov"],["CDFW careers","https://wildlife.ca.gov/careers"]] },
          { id: "boards", t: "Where the Jobs Are Posted", s: "Five boards cover 90% of it", call: "025.5", type: "Directory", media: "Screenshot — saved-search dashboard",
            b: ["CalCareers (state), USAJOBS (federal), governmentjobs.com (county/city), CalJOBS (everything WIOA-connected), and Texas A&M's Wildlife & Fisheries board plus Conservation Job Board for the seasonal ecology circuit. Set saved searches once; check weekly; apply the day postings open — government postings close fast and interview slowly.",
                "The curated board below this atlas is our local layer: staff-vetted postings from basin employers, updated by the stewards of this page."],
            f: [["Government","CalCareers · USAJOBS · governmentjobs.com"],["Seasonal ecology","TAMU board · Conservation Job Board"],["Local layer","The curated board below"]],
            src: [["CalCareers","https://calcareers.ca.gov"],["Conservation Job Board","https://www.conservationjobboard.com"],["TAMU Wildlife & Fisheries jobs","https://wfscjobs.tamu.edu/job-board/"]] },
          { id: "pipeline", t: "Timing the Lithium Valley Pipeline", s: "Position before the wave", call: "338.2", type: "Field Note", media: "Timeline — construction → operations → monitoring",
            b: ["The boom hires in waves: construction trades first (union apprenticeships via the building trades council), then plant operations, then the long tail of environmental monitoring, compliance, and community-benefit roles. The county's workforce ordinance pushes employers toward local hiring and registered apprenticeships — being enrolled in a relevant program when the wave lands is the strategy.",
                "For environmental students the durable play is the monitoring layer: air, water, and habitat compliance around each project runs for decades, not construction seasons."],
            f: [["Wave order","Trades → operations → monitoring"],["Lever","Registered apprenticeships + local-hire rules"],["Durable layer","Decades of compliance monitoring"]],
            src: [["Lithium Valley Specific Plan — Imperial County","https://imperialcounty.org"],["ICWDB","https://www.ivworkforce.com"]] }
        ] },
      { id: "mesa", name: "MESA Basecamp", mark: "▲", color: "#417C98", mesa: true,
        blurb: "For IVC MESA students: the basin is your laboratory, and the pipeline is built for you.",
        entries: [
          { id: "lab", t: "The Basin Is Your Laboratory", s: "Course projects with real stakes", call: "507.2", type: "Field Note", media: "Photograph — students sampling at a drain outlet",
            b: ["Few STEM students anywhere have a living case study like this out the classroom window: an evaporating sea, geothermal rifts, engineered hydrology, and a lithium rush. Point every course project at it — stats homework on PM10 data, engineering projects on dust suppression, chemistry on brine composition. Real-stakes projects become portfolio pieces and scholarship essays simultaneously.",
                "Faculty and agencies notice students who work on local problems; that's how research assistantships and internship invitations actually happen."],
            f: [["Strategy","Every assignment → basin question"],["Yield","Portfolio + essays + faculty notice"],["Unfair advantage","You live in the case study"]],
            src: [["IVC MESA","https://www.imperial.edu/students/mesa/"],["SDSU IV Science & Engineering Labs","https://iv.sdsu.edu"]] },
          { id: "pipeline", t: "Internships & the STEM Pipeline", s: "Paid research before you transfer", call: "378.36", type: "Directory", media: "Photograph — summer research cohort",
            b: ["The pipeline exists: MESA's own internship placements, UC/CSU summer research programs (SCCUR, STAR, UC LEADS), USDA and USGS student pathways, CDFW scientific aid postings, and Audubon/CCV community science roles. Most pay; all produce the references that carry transfer applications.",
                "Apply the semester before you feel ready — summer programs recruit in December–February, and “not ready” is the main reason valley students miss them."],
            f: [["Programs","UC LEADS · STAR · USDA Pathways"],["Local","CDFW sci-aid · Audubon · CCV"],["Deadline rhythm","Winter apps for summer work"]],
            src: [["USDA Pathways","https://www.usda.gov/careers"],["CDFW scientific aid postings","https://wildlife.ca.gov/careers"]] },
          { id: "transfer", t: "Transfer With the Region in Your Pocket", s: "Leave for the degree, keep the story", call: "378.16", type: "Field Note", media: "Photograph — campus quad, hoodie from home",
            b: ["Transferring out doesn't mean leaving the pathway — it deepens it. An environmental engineering degree plus an Imperial Valley upbringing is precisely the profile agencies and Lithium Valley employers say they can't find. Keep the thread alive while away: summer positions back home, your monitoring project maintained remotely, your network warm.",
                "The region's story — told by someone from it, with a portfolio to prove it — is the strongest application material this pathway produces. Come back with the credential; the work will be here."],
            f: [["Profile in demand","Degree + local roots"],["While away","Summers home, project maintained"],["The bet","The boom needs local scientists"]],
            src: [["SDSU Imperial Valley","https://iv.sdsu.edu"],["RAND workforce strategy","https://www.rand.org/pubs/research_reports/RRA3836-1.html"]] }
        ] }
    ]
  }
];

// ---- Curated local job board (admin-managed) ----
export const DEFAULT_JOBS = [
  { id:"j1", pathway:"enviro", title:"Scientific Aid — Salton Sea Unit", org:"CA Dept. of Fish & Wildlife", place:"Imperial County", kind:"Seasonal", url:"https://wildlife.ca.gov/careers", note:"Field surveys & habitat monitoring; entry-level, degree in progress OK.", posted:"2 days ago" },
  { id:"j2", pathway:"enviro", title:"Air Monitoring Technician (IVAN network)", org:"Comité Cívico del Valle", place:"Brawley", kind:"Part-time", url:"https://ccvhe.org", note:"Maintain community air sensors; bilingual preferred.", posted:"5 days ago" },
  { id:"j3", pathway:"enviro", title:"Canal Operations Apprentice", org:"Imperial Irrigation District", place:"El Centro", kind:"Apprenticeship", url:"https://www.iid.com/careers", note:"Paid apprenticeship; no degree required.", posted:"1 week ago" },
  { id:"j4", pathway:"enviro", title:"Habitat Restoration Crew — SCH Project", org:"Salton Sea Management Program contractor", place:"Westmorland area", kind:"Full-time", url:"https://saltonsea.ca.gov", note:"Species Conservation Habitat build-out; field construction & planting.", posted:"2 weeks ago" },
  { id:"j5", pathway:"creator", title:"Bilingual Social Media Coordinator", org:"Imperial County Public Health", place:"El Centro", kind:"Full-time", url:"https://www.governmentjobs.com/careers/imperialcounty", note:"Campaign content in English & Spanish; portfolio required.", posted:"3 days ago" },
  { id:"j6", pathway:"creator", title:"Content & Community Apprentice", org:"Creating Coding Careers", place:"San Diego / remote", kind:"Apprenticeship", url:"https://cccareers.org", note:"DOL-registered; earn while you learn.", posted:"1 week ago" },
  { id:"j7", pathway:"creator", title:"Marketing Assistant — Ag Products", org:"Valley ag supplier (via AJCC)", place:"Brawley", kind:"Part-time", url:"https://www.caljobs.ca.gov", note:"Product photos, catalog updates, social posts.", posted:"1 week ago" },
  { id:"j8", pathway:"creator", title:"Videographer — Lithium Valley community meetings", org:"County contractor", place:"Calipatria / Niland", kind:"Contract", url:"https://imperialcounty.org", note:"Document public meetings; Spanish captioning a plus.", posted:"3 weeks ago" }
];

export const MORE_BOARDS = [
  { label:"CalJOBS", url:"https://www.caljobs.ca.gov", desc:"State job exchange — all WIOA postings" },
  { label:"CalCareers", url:"https://calcareers.ca.gov", desc:"California state agency jobs & exams" },
  { label:"USAJOBS", url:"https://www.usajobs.gov", desc:"Federal — refuges, USGS, USDA, BLM" },
  { label:"Imperial County HR", url:"https://www.governmentjobs.com/careers/imperialcounty", desc:"County departments incl. APCD" },
  { label:"IID Careers", url:"https://www.iid.com/careers", desc:"Water & power district jobs" },
  { label:"ICWDB / AJCC", url:"https://www.ivworkforce.com", desc:"Local workforce board & job center" },
  { label:"Conservation Job Board", url:"https://www.conservationjobboard.com", desc:"National ecology & conservation postings" }
];

// ---- Per-node quizzes (admin-editable) ----
// One question per waypoint. The student's pick at each node aggregates into
// Node 7 (the Summit) as their Career Pathway Card. `optional` waypoints (MESA)
// don't block completion. `allowCustom` adds a free-text "my own answer" slot.
export const QUIZZES = {
  creator: {
    terrain: {
      prompt: "Which creator job profile fits you best right now?",
      pick: "Pick a job profile", result: "Job profile",
      optional: false, allowCustom: true, customLabel: "…or name the role you're after",
      options: [
        { id: "marketing", label: "Social Media & Brand Manager", sub: "Make local businesses look good" },
        { id: "story", label: "Storyteller & Advocate", sub: "Build an audience around a cause or place" },
        { id: "games", label: "Games & Interactive Maker", sub: "Ship playable worlds" },
        { id: "entrepreneur", label: "Creator Entrepreneur", sub: "Own the channel, product, or practice" },
        { id: "mix", label: "The Multi-Stream Creator", sub: "A part-time role + clients + my own channel" }
      ]
    },
    portfolio: {
      prompt: "Which portfolio piece will you build first?",
      pick: "Pick a portfolio piece", result: "First portfolio piece",
      optional: false, allowCustom: true, customLabel: "…or describe your own piece",
      options: [
        { id: "reel", label: "A 60–90s reel", sub: "For video work" },
        { id: "cases", label: "3–5 case studies", sub: "Client work with results" },
        { id: "build", label: "A playable build", sub: "Games / interactive on itch.io" },
        { id: "feed", label: "A consistent public feed", sub: "Proof you show up" },
        { id: "kit", label: "A media kit", sub: "Audience numbers, once you have them" }
      ]
    },
    story: {
      prompt: "What story do you most want to tell?",
      pick: "Choose your story", result: "Story I'll tell",
      optional: false, allowCustom: true, customLabel: "…or write your own story in a line",
      options: [
        { id: "border", label: "Cross-border, bilingual life" },
        { id: "place", label: "My community & place", sub: "e.g. the Salton Sea" },
        { id: "teach", label: "A skill I can teach" },
        { id: "business", label: "Building something from zero" },
        { id: "cause", label: "A cause I advocate for" }
      ]
    },
    tools: {
      prompt: "Which tool will you learn first?",
      pick: "Pick a tool", result: "Tool to learn first",
      optional: false, allowCustom: true, customLabel: "…or name another tool",
      options: [
        { id: "video", label: "CapCut / DaVinci Resolve", sub: "Video" },
        { id: "design", label: "Canva / Figma", sub: "Design" },
        { id: "godot", label: "Godot / Twine", sub: "Games" },
        { id: "audio", label: "Audacity", sub: "Audio" },
        { id: "ai", label: "AI (Claude, prompting)", sub: "The multiplier" }
      ]
    },
    hiring: {
      prompt: "Where will you send your first application?",
      pick: "Pick a first target", result: "First application",
      optional: false, allowCustom: true, customLabel: "…or name a specific employer",
      options: [
        { id: "local", label: "A local business", sub: "Direct outreach + spec edit" },
        { id: "gov", label: "County / IID / district comms", sub: "Stable PIO role" },
        { id: "remote", label: "A remote creative role" },
        { id: "appr", label: "A paid apprenticeship", sub: "Creating Coding Careers" },
        { id: "own", label: "My own channel / client base" }
      ]
    },
    mesa: {
      prompt: "MESA students: what's your current project or focus at school?",
      pick: "Your MESA project", result: "MESA focus",
      optional: true, allowCustom: true, customLabel: "e.g. Calc II study logs, a bridge model, a PM10 data project",
      options: [
        { id: "log", label: "A study-in-public project log" },
        { id: "comp", label: "A MESA competition build" },
        { id: "explainer", label: "A STEM explainer series" },
        { id: "data", label: "A data / analytics project" }
      ]
    }
  },
  enviro: {
    terrain: {
      prompt: "Which environmental job family fits you best?",
      pick: "Pick a job family", result: "Job family",
      optional: false, allowCustom: true, customLabel: "…or name the role you're after",
      options: [
        { id: "agency", label: "Agency / public backbone", sub: "County, state & federal" },
        { id: "air", label: "Air quality", sub: "The dust is the job" },
        { id: "water", label: "Water", sub: "Quality, rights & delivery" },
        { id: "ag", label: "Agriculture & ag-tech" },
        { id: "wildlife", label: "Wildlife, ecology & restoration" },
        { id: "lithium", label: "Lithium Valley & clean energy" }
      ]
    },
    portfolio: {
      prompt: "Which field-evidence piece will you build first?",
      pick: "Pick a field-evidence piece", result: "First portfolio piece",
      optional: false, allowCustom: true, customLabel: "…or describe your own piece",
      options: [
        { id: "inat", label: "An iNaturalist / eBird record" },
        { id: "gis", label: "A QGIS / ArcGIS story map" },
        { id: "notebook", label: "A public-data notebook", sub: "CalEnviroScreen, USGS…" },
        { id: "report", label: "A monitoring-style report" },
        { id: "photos", label: "A dated field-photo log" }
      ]
    },
    story: {
      prompt: "What story do you most want to tell?",
      pick: "Choose your story", result: "Story I'll tell",
      optional: false, allowCustom: true, customLabel: "…or write your own story in a line",
      options: [
        { id: "casestudy", label: "Growing up inside the case study" },
        { id: "dust", label: "Dust days & air-quality justice" },
        { id: "water", label: "Water & the canal town" },
        { id: "restore", label: "A restoration I joined" },
        { id: "translate", label: "Translating science for neighbors" }
      ]
    },
    tools: {
      prompt: "Which tool will you learn first?",
      pick: "Pick a tool", result: "Tool to learn first",
      optional: false, allowCustom: true, customLabel: "…or name another tool",
      options: [
        { id: "qgis", label: "QGIS", sub: "Mapping" },
        { id: "inat", label: "iNaturalist / eBird", sub: "Species records" },
        { id: "code", label: "Python / R", sub: "Analysis" },
        { id: "collect", label: "Survey123 / Epicollect", sub: "Field forms" },
        { id: "ai", label: "AI for reports & translation" }
      ]
    },
    hiring: {
      prompt: "Where will you send your first application?",
      pick: "Pick a first target", result: "First application",
      optional: false, allowCustom: true, customLabel: "…or name a specific employer",
      options: [
        { id: "cdfw", label: "CDFW scientific aid", sub: "Seasonal field tech" },
        { id: "iid", label: "IID apprenticeship" },
        { id: "air", label: "Air monitoring", sub: "CCV / IVAN network" },
        { id: "corps", label: "A conservation corps", sub: "CCC / SCA / Climate Corps" },
        { id: "lithium", label: "Lithium Valley monitoring" }
      ]
    },
    mesa: {
      prompt: "MESA students: what's your current project or focus at school?",
      pick: "Your MESA project", result: "MESA focus",
      optional: true, allowCustom: true, customLabel: "e.g. PM10 dataset analysis, dust-suppression build, brine chemistry",
      options: [
        { id: "basin", label: "A basin-question course project" },
        { id: "intern", label: "A research internship application" },
        { id: "data", label: "A local-data analysis" },
        { id: "comp", label: "A MESA competition build" }
      ]
    }
  }
};

// ---- Node 7 "Summit" finale copy (admin-editable) ----
export const SUMMITS = {
  creator: {
    title: "CONTENT CREATOR · PATHWAY CARD",
    klass: "THE STORYTELLER",
    intro: "You cleared every waypoint. This is the creator run you built — one portfolio, many doors.",
    closer: "Bring this card to AJCC El Centro or your MESA advisor. Ship your first portfolio piece this week."
  },
  enviro: {
    title: "ENVIRONMENTAL CAREER · PATHWAY CARD",
    klass: "THE STEWARD",
    intro: "You cleared every waypoint. This is the field run you built — documented evidence, real employers, a place that needs you.",
    closer: "Set saved searches on CalCareers & USAJOBS and log your first field hours. The basin is hiring."
  }
};

// ---- Persistence (localStorage bridge; developer maps these to Supabase) ----
const KEY = "swwf.v1";

export function loadState(){
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; }
}
export function saveState(patch){
  const cur = loadState();
  const next = Object.assign({}, cur, patch);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch(e){}
  return next;
}

// Catalog with admin edits/unpublishes applied
export function getCatalog(){
  const st = loadState();
  const edits = st.entryEdits || {};     // key: `${pathway}.${stop}.${entry}` -> {t,s,call,type,images,...}
  const removed = st.removedEntries || []; // keys
  const added = st.addedEntries || {};   // key: `${pathway}.${stop}` -> [entry,...]
  const pwEdits = st.pathwayEdits || {}; // pathwayId -> {intro,tagline,...}
  const stopEdits = st.stopEdits || {};  // key: `${pathway}.${stop}` -> {name,blurb}
  const quizEdits = st.quizEdits || {};  // key: `${pathway}.${stop}` -> {prompt,options,...}
  const summitEdits = st.summitEdits || {}; // pathwayId -> {title,klass,intro,closer}
  return PATHWAYS.map(p => Object.assign({}, p, pwEdits[p.id] || {}, {
    summit: Object.assign({}, SUMMITS[p.id] || {}, summitEdits[p.id] || {}),
    stops: p.stops.map(sp => {
      let entries = sp.entries
        .filter(e => removed.indexOf(p.id+"."+sp.id+"."+e.id) === -1)
        .map(e => Object.assign({}, e, edits[p.id+"."+sp.id+"."+e.id] || {}));
      const extra = added[p.id+"."+sp.id] || [];
      const baseQuiz = (QUIZZES[p.id] && QUIZZES[p.id][sp.id]) || null;
      const quiz = baseQuiz ? Object.assign({}, baseQuiz, quizEdits[p.id+"."+sp.id] || {}) : null;
      return Object.assign({}, sp, stopEdits[p.id+"."+sp.id] || {}, { entries: entries.concat(extra), quiz });
    })
  }));
}

export function getSuggestions(){ return loadState().suggestions || []; }
export function addSuggestion(s){
  const list = getSuggestions().concat([Object.assign({ id:"s"+Date.now(), status:"pending", when:"Just now" }, s)]);
  saveState({ suggestions: list });
  return list;
}
export function setSuggestions(list){ saveState({ suggestions: list }); return list; }

export function getSources(){
  const st = loadState();
  return st.sources || null; // null = use defaults derived from catalog
}
export function setSources(list){ saveState({ sources: list }); return list; }

export function getJobs(){
  const st = loadState();
  return st.jobs || DEFAULT_JOBS;
}
export function setJobs(list){ saveState({ jobs: list }); return list; }

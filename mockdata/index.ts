export const metrics = [
  { id: "m1", label: "Revenue", value: "$48,290", trend: "+12.4%" },
  { id: "m2", label: "Orders", value: "1,284", trend: "+8.1%" },
  { id: "m3", label: "Customers", value: "892", trend: "+6.2%" },
  { id: "m4", label: "Refund Rate", value: "1.2%", trend: "-0.3%" },
  { id: "m5", label: "Avg. Order Value", value: "$112", trend: "+3.8%" },
  { id: "m6", label: "Conversion", value: "3.4%", trend: "+0.5%" }
] as const;

export const categories = [
  { id: "all", name: "All" },
  { id: "fashion", name: "Fashion" },
  { id: "electronics", name: "Electronics" },
  { id: "home", name: "Home" }
] as const;

export const products = [
  { id: "P-1001", name: "Minimal Backpack", category: "Fashion", categoryId: "fashion", price: 129, stock: 48, rating: 4.6 },
  { id: "P-1002", name: "Smart Watch", category: "Electronics", categoryId: "electronics", price: 199, stock: 35, rating: 4.7 },
  { id: "P-1003", name: "Ceramic Lamp", category: "Home", categoryId: "home", price: 64, stock: 62, rating: 4.4 },
  { id: "P-1004", name: "Oversized Tee", category: "Fashion", categoryId: "fashion", price: 38, stock: 82, rating: 4.5 },
  { id: "P-1005", name: "Wireless Earbuds", category: "Electronics", categoryId: "electronics", price: 149, stock: 22, rating: 4.3 },
  { id: "P-1006", name: "Linen Throw", category: "Home", categoryId: "home", price: 89, stock: 41, rating: 4.6 },
  { id: "P-1007", name: "Linen Field Jacket", category: "Fashion", categoryId: "fashion", price: 218, stock: 17, rating: 4.8 },
  { id: "P-1008", name: "Mechanical Keyboard", category: "Electronics", categoryId: "electronics", price: 179, stock: 58, rating: 4.7 },
  { id: "P-1009", name: "Stoneware Mug Set", category: "Home", categoryId: "home", price: 42, stock: 96, rating: 4.5 },
  { id: "P-1010", name: "Wool Beanie", category: "Fashion", categoryId: "fashion", price: 28, stock: 134, rating: 4.4 },
  { id: "P-1011", name: "4K Action Camera", category: "Electronics", categoryId: "electronics", price: 329, stock: 12, rating: 4.6 },
  { id: "P-1012", name: "Brass Candleholder", category: "Home", categoryId: "home", price: 36, stock: 78, rating: 4.3 },
  { id: "P-1013", name: "Leather Card Holder", category: "Fashion", categoryId: "fashion", price: 54, stock: 110, rating: 4.5 },
  { id: "P-1014", name: "Portable SSD 1TB", category: "Electronics", categoryId: "electronics", price: 119, stock: 67, rating: 4.7 },
  { id: "P-1015", name: "Walnut Cutting Board", category: "Home", categoryId: "home", price: 72, stock: 44, rating: 4.8 },
  { id: "P-1016", name: "Canvas Sneakers", category: "Fashion", categoryId: "fashion", price: 89, stock: 38, rating: 4.4 },
  { id: "P-1017", name: "Noise-Canceling Headphones", category: "Electronics", categoryId: "electronics", price: 289, stock: 26, rating: 4.8 },
  { id: "P-1018", name: "Cotton Bath Towels", category: "Home", categoryId: "home", price: 58, stock: 89, rating: 4.6 },
  { id: "P-1019", name: "Pleated Trousers", category: "Fashion", categoryId: "fashion", price: 124, stock: 31, rating: 4.5 },
  { id: "P-1020", name: "Smart Bulb 4-Pack", category: "Electronics", categoryId: "electronics", price: 49, stock: 152, rating: 4.2 },
  { id: "P-1021", name: "Aroma Diffuser", category: "Home", categoryId: "home", price: 68, stock: 23, rating: 4.5 },
  { id: "P-1022", name: "Cashmere Scarf", category: "Fashion", categoryId: "fashion", price: 168, stock: 19, rating: 4.7 },
  { id: "P-1023", name: "Bluetooth Speaker", category: "Electronics", categoryId: "electronics", price: 99, stock: 74, rating: 4.4 },
  { id: "P-1024", name: "Hand-Blown Glass Vase", category: "Home", categoryId: "home", price: 95, stock: 28, rating: 4.6 }
] as const;

export const orders = [
  { id: "ORD-8901", customerName: "Alex Turner", total: 328, status: "processing", placedAt: "2026-05-16" },
  { id: "ORD-8902", customerName: "Maya Singh", total: 89, status: "pending", placedAt: "2026-05-17" },
  { id: "ORD-8903", customerName: "Jordan Miles", total: 512, status: "shipped", placedAt: "2026-05-14" },
  { id: "ORD-8904", customerName: "Priya Sharma", total: 124, status: "delivered", placedAt: "2026-05-09" },
  { id: "ORD-8905", customerName: "Ethan Wright", total: 218, status: "processing", placedAt: "2026-05-17" },
  { id: "ORD-8906", customerName: "Sofia Marino", total: 64, status: "pending", placedAt: "2026-05-18" },
  { id: "ORD-8907", customerName: "Liam Park", total: 289, status: "shipped", placedAt: "2026-05-13" },
  { id: "ORD-8908", customerName: "Nora Khan", total: 168, status: "delivered", placedAt: "2026-05-07" },
  { id: "ORD-8909", customerName: "Alex Turner", total: 42, status: "delivered", placedAt: "2026-05-05" },
  { id: "ORD-8910", customerName: "Daniel Cho", total: 449, status: "shipped", placedAt: "2026-05-12" },
  { id: "ORD-8911", customerName: "Maya Singh", total: 76, status: "delivered", placedAt: "2026-05-04" },
  { id: "ORD-8912", customerName: "Isabella Rossi", total: 312, status: "processing", placedAt: "2026-05-18" },
  { id: "ORD-8913", customerName: "Marcus Hale", total: 99, status: "pending", placedAt: "2026-05-19" },
  { id: "ORD-8914", customerName: "Jordan Miles", total: 184, status: "delivered", placedAt: "2026-05-02" },
  { id: "ORD-8915", customerName: "Aisha Bello", total: 542, status: "shipped", placedAt: "2026-05-11" },
  { id: "ORD-8916", customerName: "Ryo Tanaka", total: 218, status: "processing", placedAt: "2026-05-17" },
  { id: "ORD-8917", customerName: "Priya Sharma", total: 36, status: "delivered", placedAt: "2026-04-29" },
  { id: "ORD-8918", customerName: "Elena Costa", total: 247, status: "shipped", placedAt: "2026-05-10" },
  { id: "ORD-8919", customerName: "Marcus Hale", total: 168, status: "delivered", placedAt: "2026-05-01" },
  { id: "ORD-8920", customerName: "Nora Khan", total: 89, status: "pending", placedAt: "2026-05-19" },
  { id: "ORD-8921", customerName: "Theo Bauer", total: 728, status: "processing", placedAt: "2026-05-18" },
  { id: "ORD-8922", customerName: "Sofia Marino", total: 124, status: "shipped", placedAt: "2026-05-15" },
  { id: "ORD-8923", customerName: "Ana Lopez", total: 95, status: "delivered", placedAt: "2026-05-06" },
  { id: "ORD-8924", customerName: "Liam Park", total: 416, status: "delivered", placedAt: "2026-04-30" },
  { id: "ORD-8925", customerName: "Daniel Cho", total: 58, status: "pending", placedAt: "2026-05-19" },
  { id: "ORD-8926", customerName: "Isabella Rossi", total: 134, status: "delivered", placedAt: "2026-05-03" },
  { id: "ORD-8927", customerName: "Aisha Bello", total: 199, status: "shipped", placedAt: "2026-05-13" }
] as const;

export const customers = [
  { id: "C-01", name: "Alex Turner", email: "alex@example.com", orders: 14 },
  { id: "C-02", name: "Maya Singh", email: "maya@example.com", orders: 5 },
  { id: "C-03", name: "Jordan Miles", email: "jordan@example.com", orders: 9 },
  { id: "C-04", name: "Priya Sharma", email: "priya.sharma@example.com", orders: 22 },
  { id: "C-05", name: "Ethan Wright", email: "ethan.w@example.com", orders: 3 },
  { id: "C-06", name: "Sofia Marino", email: "sofia.m@example.com", orders: 11 },
  { id: "C-07", name: "Liam Park", email: "liam.park@example.com", orders: 7 },
  { id: "C-08", name: "Nora Khan", email: "nora.k@example.com", orders: 18 },
  { id: "C-09", name: "Daniel Cho", email: "dcho@example.com", orders: 4 },
  { id: "C-10", name: "Isabella Rossi", email: "isabella.r@example.com", orders: 12 },
  { id: "C-11", name: "Marcus Hale", email: "marcus.h@example.com", orders: 6 },
  { id: "C-12", name: "Aisha Bello", email: "aisha.b@example.com", orders: 27 },
  { id: "C-13", name: "Ryo Tanaka", email: "ryo.tanaka@example.com", orders: 2 },
  { id: "C-14", name: "Elena Costa", email: "elena.costa@example.com", orders: 15 },
  { id: "C-15", name: "Theo Bauer", email: "theo.bauer@example.com", orders: 1 },
  { id: "C-16", name: "Ana Lopez", email: "ana.lopez@example.com", orders: 8 },
  { id: "C-17", name: "Felix Andersen", email: "felix.a@example.com", orders: 19 },
  { id: "C-18", name: "Yara Haddad", email: "yara.h@example.com", orders: 10 },
  { id: "C-19", name: "Noah Patel", email: "noah.patel@example.com", orders: 13 },
  { id: "C-20", name: "Olivia Brennan", email: "olivia.b@example.com", orders: 31 },
  { id: "C-21", name: "Hiro Nakamura", email: "hiro.n@example.com", orders: 5 },
  { id: "C-22", name: "Camille Dubois", email: "camille.d@example.com", orders: 17 }
] as const;

export const cartItems = [
  { id: "c1", productName: "Minimal Backpack", qty: 1, price: 129 },
  { id: "c2", productName: "Ceramic Lamp", qty: 2, price: 64 },
  { id: "c3", productName: "Wireless Earbuds", qty: 1, price: 149 },
  { id: "c4", productName: "Stoneware Mug Set", qty: 1, price: 42 },
  { id: "c5", productName: "Cotton Bath Towels", qty: 3, price: 58 },
  { id: "c6", productName: "Wool Beanie", qty: 2, price: 28 }
] as const;

export const productExtras = [
  {
    productId: "P-1001",
    images: [
      { id: "i1", initials: "MB", theme: "brand", caption: "Front" },
      { id: "i2", initials: "S1", theme: "violet", caption: "Side" },
      { id: "i3", initials: "BK", theme: "mint", caption: "Back panel" },
      { id: "i4", initials: "OP", theme: "amber", caption: "Open view" }
    ],
    highlights: [
      "Heavyweight 16oz waxed canvas",
      "Padded 15\" laptop sleeve with felt lining",
      "Vegetable-tanned leather trims age beautifully",
      "Water-resistant YKK zippers"
    ],
    specs: [
      { key: "Material", value: "Waxed canvas + vegetable-tanned leather" },
      { key: "Capacity", value: "22 L" },
      { key: "Dimensions", value: "45 × 30 × 14 cm" },
      { key: "Weight", value: "1.1 kg" },
      { key: "Laptop sleeve", value: "Fits up to 15\"" },
      { key: "Country of origin", value: "India" }
    ],
    inBox: ["Backpack", "Cotton dust bag", "Care guide"]
  },
  {
    productId: "P-1002",
    images: [
      { id: "i1", initials: "SW", theme: "violet", caption: "Face" },
      { id: "i2", initials: "BD", theme: "brand", caption: "Band detail" },
      { id: "i3", initials: "SD", theme: "mint", caption: "Sensors" },
      { id: "i4", initials: "OS", theme: "amber", caption: "On-skin" }
    ],
    highlights: [
      "5-day battery on a single charge",
      "Continuous heart rate + SpO₂ tracking",
      "Always-on AMOLED display, sapphire crystal",
      "Pairs with iOS 16+ and Android 12+"
    ],
    specs: [
      { key: "Display", value: "1.43\" AMOLED, 466×466" },
      { key: "Battery life", value: "Up to 5 days" },
      { key: "Water resistance", value: "5 ATM" },
      { key: "Connectivity", value: "Bluetooth 5.3, NFC" },
      { key: "Sensors", value: "HR, SpO₂, accelerometer, gyroscope" },
      { key: "Warranty", value: "2 years" }
    ],
    inBox: ["Smart watch", "Magnetic charger", "Extra strap (S/L)"]
  },
  {
    productId: "P-1003",
    images: [
      { id: "i1", initials: "CL", theme: "mint", caption: "Hero" },
      { id: "i2", initials: "TP", theme: "brand", caption: "Top" },
      { id: "i3", initials: "OF", theme: "amber", caption: "Lit" },
      { id: "i4", initials: "BS", theme: "rose", caption: "Base" }
    ],
    highlights: [
      "Wheel-thrown stoneware, hand-glazed",
      "Warm 2700K dimmable bulb included",
      "Felt-lined base protects surfaces",
      "Each piece varies slightly — that's the point"
    ],
    specs: [
      { key: "Material", value: "Stoneware ceramic" },
      { key: "Dimensions", value: "32 × 18 cm" },
      { key: "Weight", value: "2.4 kg" },
      { key: "Bulb", value: "E27, 2700K, 8W LED included" },
      { key: "Cable", value: "1.8 m fabric-wrapped" },
      { key: "Country of origin", value: "Portugal" }
    ]
  },
  {
    productId: "P-1005",
    images: [
      { id: "i1", initials: "WE", theme: "violet", caption: "Pair" },
      { id: "i2", initials: "CS", theme: "brand", caption: "Case" },
      { id: "i3", initials: "TP", theme: "mint", caption: "Tips" },
      { id: "i4", initials: "FT", theme: "amber", caption: "In ear" }
    ],
    highlights: [
      "Hybrid ANC blocks up to 32 dB ambient noise",
      "8h battery, 28h with charging case",
      "Multi-point: connect phone + laptop simultaneously",
      "Custom EQ via companion app"
    ],
    specs: [
      { key: "Drivers", value: "11 mm dynamic + balanced armature" },
      { key: "Battery (earbud)", value: "8 hours" },
      { key: "Battery (case)", value: "28 hours total" },
      { key: "Connectivity", value: "Bluetooth 5.3, LE Audio" },
      { key: "Charging", value: "USB-C, Qi wireless" },
      { key: "Weight", value: "5.2 g per earbud" }
    ],
    inBox: ["Earbuds", "Charging case", "USB-C cable", "Eartips (XS/S/M/L)"]
  },
  {
    productId: "P-1007",
    images: [
      { id: "i1", initials: "LJ", theme: "brand", caption: "Front" },
      { id: "i2", initials: "BK", theme: "mint", caption: "Back" },
      { id: "i3", initials: "DT", theme: "amber", caption: "Detail" },
      { id: "i4", initials: "WR", theme: "violet", caption: "On model" }
    ],
    highlights: [
      "Belgian linen, garment-washed for softness",
      "Horn buttons, hand-finished collar",
      "Patch pockets large enough for a paperback",
      "Cut for a relaxed but tailored fit"
    ],
    specs: [
      { key: "Material", value: "100% Belgian linen" },
      { key: "Weight", value: "260 gsm" },
      { key: "Fit", value: "Relaxed / unstructured" },
      { key: "Sizes", value: "XS / S / M / L / XL" },
      { key: "Care", value: "Cold wash, hang dry, light iron" },
      { key: "Country of origin", value: "Portugal" }
    ]
  },
  {
    productId: "P-1015",
    images: [
      { id: "i1", initials: "WB", theme: "mint", caption: "Top" },
      { id: "i2", initials: "GR", theme: "amber", caption: "Juice groove" },
      { id: "i3", initials: "ED", theme: "brand", caption: "Edge" },
      { id: "i4", initials: "OL", theme: "rose", caption: "Oiled" }
    ],
    highlights: [
      "Single piece of American black walnut",
      "Deep juice groove on one face, flat reverse",
      "Hand-finished with food-safe mineral oil",
      "Each board has a unique grain pattern"
    ],
    specs: [
      { key: "Material", value: "American black walnut" },
      { key: "Dimensions", value: "45 × 28 × 3 cm" },
      { key: "Weight", value: "1.8 kg" },
      { key: "Finish", value: "Food-safe mineral oil" },
      { key: "Care", value: "Hand wash, re-oil every 2-3 months" },
      { key: "Country of origin", value: "USA" }
    ]
  },
  {
    productId: "P-1017",
    images: [
      { id: "i1", initials: "HP", theme: "violet", caption: "Headband" },
      { id: "i2", initials: "EC", theme: "brand", caption: "Earcup" },
      { id: "i3", initials: "FT", theme: "mint", caption: "Folded" },
      { id: "i4", initials: "WR", theme: "amber", caption: "Worn" }
    ],
    highlights: [
      "Industry-leading ANC across 8 microphones",
      "40-hour battery with ANC on",
      "Memory-foam earcups, magnesium frame",
      "Auto-pause when you take them off"
    ],
    specs: [
      { key: "Drivers", value: "40 mm dynamic" },
      { key: "Frequency response", value: "4 Hz - 40 kHz" },
      { key: "Battery (ANC on)", value: "40 hours" },
      { key: "Battery (ANC off)", value: "60 hours" },
      { key: "Connectivity", value: "Bluetooth 5.3, 3.5 mm aux" },
      { key: "Weight", value: "254 g" }
    ],
    inBox: ["Headphones", "Hard case", "3.5 mm cable", "USB-C cable", "Airline adapter"]
  }
] as const;

export const heroSlides = [
  {
    id: "HS-301",
    eyebrow: "New season",
    title: "Quiet essentials,\nmade well.",
    subtitle: "A small collection of considered pieces, refined over multiple seasons of use.",
    ctaText: "Shop the collection",
    ctaUrl: "/shop",
    audience: "all",
    status: "active",
    theme: "brand",
    imageInitials: "QE",
    order: 1,
    createdAt: "2026-05-08"
  },
  {
    id: "HS-302",
    eyebrow: "Spring sale",
    title: "20% off everything",
    subtitle: "Sitewide sale on essentials. Use code SPRING20 at checkout.",
    ctaText: "Browse the sale",
    ctaUrl: "/shop",
    audience: "all",
    status: "active",
    theme: "violet",
    imageInitials: "SS",
    order: 2,
    createdAt: "2026-05-10"
  },
  {
    id: "HS-303",
    eyebrow: "Just landed",
    title: "Linen for warmer days",
    subtitle: "Heavyweight Belgian linen, cut for an easy summer fit.",
    ctaText: "See what's new",
    ctaUrl: "/shop?cat=fashion",
    audience: "web",
    status: "active",
    theme: "mint",
    imageInitials: "LN",
    order: 3,
    createdAt: "2026-05-12"
  },
  {
    id: "HS-304",
    eyebrow: "App exclusive",
    title: "Early access drops",
    subtitle: "Get a 6-hour head start on every new release, only in the app.",
    ctaText: "Set a reminder",
    ctaUrl: "/account",
    audience: "mobile",
    status: "active",
    theme: "amber",
    imageInitials: "EA",
    order: 4,
    createdAt: "2026-05-14"
  },
  {
    id: "HS-305",
    eyebrow: "Refer a friend",
    title: "Give $10, get $10",
    subtitle: "Both sides receive credit toward their next order.",
    ctaText: "Get your link",
    ctaUrl: "/account",
    audience: "all",
    status: "draft",
    theme: "rose",
    imageInitials: "RF",
    order: 5,
    createdAt: "2026-05-16"
  }
] as const;

export const promotions = [
  {
    id: "PR-101",
    title: "Spring Refresh — 20% off everything",
    message: "Sitewide sale on essentials. Use code SPRING20 at checkout.",
    ctaText: "Shop the sale",
    ctaUrl: "/products",
    audience: "all",
    status: "active",
    theme: "brand",
    startsAt: "2026-05-10",
    endsAt: "2026-05-31",
    createdAt: "2026-05-08"
  },
  {
    id: "PR-102",
    title: "Free shipping on orders over $50",
    message: "Standard shipping is on us. No code required.",
    ctaText: "Browse new arrivals",
    ctaUrl: "/products",
    audience: "all",
    status: "active",
    theme: "mint",
    createdAt: "2026-04-15"
  },
  {
    id: "PR-103",
    title: "App-exclusive: Early access to the next drop",
    message: "Open the mobile app on May 24 for a 6-hour head start.",
    ctaText: "Set a reminder",
    audience: "mobile",
    status: "draft",
    theme: "violet",
    startsAt: "2026-05-24",
    createdAt: "2026-05-12"
  },
  {
    id: "PR-104",
    title: "Mid-season clearance preview",
    message: "Loyalty members see prices first. Goes live to everyone June 1.",
    ctaText: "View clearance",
    ctaUrl: "/products",
    audience: "web",
    status: "scheduled",
    theme: "amber",
    startsAt: "2026-05-25",
    endsAt: "2026-06-10",
    createdAt: "2026-05-14"
  },
  {
    id: "PR-105",
    title: "Refer a friend, both get $10",
    message: "Send your unique link from your profile and both sides receive credit on first order.",
    ctaText: "Get your link",
    audience: "all",
    status: "draft",
    theme: "rose",
    createdAt: "2026-05-16"
  }
] as const;

export const feedback = [
  {
    id: "FB-2001",
    productId: "P-1001",
    productName: "Minimal Backpack",
    customerId: "C-04",
    customerName: "Priya Sharma",
    rating: 5,
    title: "Quiet luxury done right",
    body: "I've used this every day for three months. The leather has softened beautifully and the inner pockets fit my 14\" laptop and a journal without bulk. Worth every rupee.",
    createdAt: "2026-05-17",
    status: "new",
    sentiment: "positive",
    helpfulVotes: 14
  },
  {
    id: "FB-2002",
    productId: "P-1002",
    productName: "Smart Watch",
    customerId: "C-08",
    customerName: "Nora Khan",
    rating: 4,
    title: "Great hardware, app is fiddly",
    body: "Battery lasts almost a week and heart-rate is accurate against my Polar strap. First-run pairing with the iOS app took three tries. Once paired it's been rock solid.",
    createdAt: "2026-05-16",
    status: "replied",
    sentiment: "positive",
    reply: "Thanks Nora — the pairing flow is getting an overhaul in next month's app release. We'll let you know when it ships.",
    repliedAt: "2026-05-17",
    helpfulVotes: 22
  },
  {
    id: "FB-2003",
    productId: "P-1005",
    productName: "Wireless Earbuds",
    customerId: "C-11",
    customerName: "Marcus Hale",
    rating: 2,
    title: "Right earbud cuts out on calls",
    body: "Music playback is fine but the right earbud drops audio whenever I'm on a Zoom or phone call. I've tried two phones and a laptop. Otherwise the fit and sound are great.",
    createdAt: "2026-05-15",
    status: "flagged",
    sentiment: "negative",
    helpfulVotes: 31
  },
  {
    id: "FB-2004",
    productId: "P-1003",
    productName: "Ceramic Lamp",
    customerId: "C-06",
    customerName: "Sofia Marino",
    rating: 5,
    title: "Sculptural and warm",
    body: "Bought two — one for the bedroom and one for the studio. The dimmer warmth is exactly right and the base is heavier than I expected, which I appreciate.",
    createdAt: "2026-05-14",
    status: "new",
    sentiment: "positive",
    helpfulVotes: 9
  },
  {
    id: "FB-2005",
    productId: "P-1007",
    productName: "Linen Field Jacket",
    customerId: "C-20",
    customerName: "Olivia Brennan",
    rating: 5,
    title: "My new go-to spring layer",
    body: "Drapes well, the linen is heavyweight enough to hold its shape, and the buttons feel substantial. Sizing ran true for me — I'm normally a M and the M fit perfectly.",
    createdAt: "2026-05-13",
    status: "replied",
    sentiment: "positive",
    reply: "Olivia — thrilled to hear it. Tag us if you ever post a photo of it in the wild.",
    repliedAt: "2026-05-14",
    helpfulVotes: 18
  },
  {
    id: "FB-2006",
    productId: "P-1008",
    productName: "Mechanical Keyboard",
    customerId: "C-19",
    customerName: "Noah Patel",
    rating: 4,
    title: "Fantastic switches, software is rough",
    body: "The keys feel incredible — typing on it is genuinely a pleasure. The macro configurator on the Mac app crashes when I try to remap function keys though.",
    createdAt: "2026-05-12",
    status: "new",
    sentiment: "neutral",
    helpfulVotes: 12
  },
  {
    id: "FB-2007",
    productId: "P-1011",
    productName: "4K Action Camera",
    customerId: "C-17",
    customerName: "Felix Andersen",
    rating: 5,
    title: "Holds its own against the big names",
    body: "Took it diving in the Maldives and the footage is gorgeous. Stabilization is shockingly good for the price point.",
    createdAt: "2026-05-11",
    status: "replied",
    sentiment: "positive",
    reply: "Felix — that's amazing. If you ever want to share clips for our gallery, hit hello@intellicart.shop.",
    repliedAt: "2026-05-12",
    helpfulVotes: 27
  },
  {
    id: "FB-2008",
    productId: "P-1004",
    productName: "Oversized Tee",
    customerId: "C-13",
    customerName: "Ryo Tanaka",
    rating: 3,
    title: "Soft but shrinks on hot wash",
    body: "Cotton is lovely and the drape is exactly the oversized fit I wanted. Lost about a size after one accidental hot wash though — wish the care label was more prominent.",
    createdAt: "2026-05-10",
    status: "new",
    sentiment: "neutral",
    helpfulVotes: 6
  },
  {
    id: "FB-2009",
    productId: "P-1017",
    productName: "Noise-Canceling Headphones",
    customerId: "C-12",
    customerName: "Aisha Bello",
    rating: 5,
    title: "Made my commute bearable",
    body: "ANC is class-leading. I used them on a 12-hour flight to Lagos and they blocked engine noise completely without the usual ear fatigue.",
    createdAt: "2026-05-09",
    status: "replied",
    sentiment: "positive",
    reply: "Aisha — really glad to hear that. Safe travels, and thanks for taking the time to write this up.",
    repliedAt: "2026-05-10",
    helpfulVotes: 41
  },
  {
    id: "FB-2010",
    productId: "P-1014",
    productName: "Portable SSD 1TB",
    customerId: "C-09",
    customerName: "Daniel Cho",
    rating: 4,
    title: "Fast and pocketable",
    body: "Sustained writes match the spec. The braided USB-C cable is a nice touch — feels much more durable than the rubber ones from the last brand I tried.",
    createdAt: "2026-05-08",
    status: "new",
    sentiment: "positive",
    helpfulVotes: 8
  },
  {
    id: "FB-2011",
    productId: "P-1023",
    productName: "Bluetooth Speaker",
    customerId: "C-15",
    customerName: "Theo Bauer",
    rating: 1,
    title: "Stopped charging after 3 weeks",
    body: "Loved the sound for the first three weeks. Now it won't take a charge from any cable. Reached out to support and waiting to hear back.",
    createdAt: "2026-05-07",
    status: "flagged",
    sentiment: "negative",
    helpfulVotes: 19
  },
  {
    id: "FB-2012",
    productId: "P-1006",
    productName: "Linen Throw",
    customerId: "C-14",
    customerName: "Elena Costa",
    rating: 5,
    title: "Exactly what I hoped for",
    body: "The weight and weave are gorgeous. It's become the centerpiece of the living room and feels like it'll last decades.",
    createdAt: "2026-05-06",
    status: "replied",
    sentiment: "positive",
    reply: "Elena — that's lovely to hear, thank you for taking the time.",
    repliedAt: "2026-05-07",
    helpfulVotes: 11
  },
  {
    id: "FB-2013",
    productId: "P-1016",
    productName: "Canvas Sneakers",
    customerId: "C-07",
    customerName: "Liam Park",
    rating: 3,
    title: "Comfortable but sizing runs small",
    body: "Wish I'd ordered a half size up. Comfort once they broke in is excellent, but the first week was rough on my pinky toes.",
    createdAt: "2026-05-05",
    status: "new",
    sentiment: "neutral",
    helpfulVotes: 24
  },
  {
    id: "FB-2014",
    productId: "P-1015",
    productName: "Walnut Cutting Board",
    customerId: "C-22",
    customerName: "Camille Dubois",
    rating: 5,
    title: "Heirloom quality",
    body: "Weighty, beautifully finished, and feels like something I'll hand down. The juice groove is deep enough to actually catch liquid from a tomato.",
    createdAt: "2026-05-04",
    status: "replied",
    sentiment: "positive",
    reply: "Camille — that's wonderful, thank you. Don't forget to oil it every few months.",
    repliedAt: "2026-05-05",
    helpfulVotes: 15
  },
  {
    id: "FB-2015",
    productId: "P-1010",
    productName: "Wool Beanie",
    customerId: "C-21",
    customerName: "Hiro Nakamura",
    rating: 4,
    title: "Cozy and well-made",
    body: "Soft against the forehead, no itching. Slightly snug at first but stretched to a perfect fit after a couple of wears.",
    createdAt: "2026-05-03",
    status: "new",
    sentiment: "positive",
    helpfulVotes: 5
  },
  {
    id: "FB-2016",
    productId: "P-1018",
    productName: "Cotton Bath Towels",
    customerId: "C-18",
    customerName: "Yara Haddad",
    rating: 4,
    title: "Plush after a wash or two",
    body: "First wash was needed to bring out the absorbency, but they've been excellent since. Color held up beautifully through six wash cycles so far.",
    createdAt: "2026-05-02",
    status: "new",
    sentiment: "positive",
    helpfulVotes: 7
  },
  {
    id: "FB-2017",
    productId: "P-1022",
    productName: "Cashmere Scarf",
    customerId: "C-04",
    customerName: "Priya Sharma",
    rating: 5,
    title: "Worth the splurge",
    body: "Impossibly soft and the dye saturation is gorgeous. Pilled slightly on the first wear but smoothed out with a quick comb.",
    createdAt: "2026-05-01",
    status: "replied",
    sentiment: "positive",
    reply: "Priya — thank you for the second review this month, we appreciate the loyalty!",
    repliedAt: "2026-05-02",
    helpfulVotes: 13
  },
  {
    id: "FB-2018",
    productId: "P-1020",
    productName: "Smart Bulb 4-Pack",
    customerId: "C-05",
    customerName: "Ethan Wright",
    rating: 2,
    title: "Two bulbs flicker on dim",
    body: "Setup was easy and the color tuning is great. Two of the four flicker noticeably below 30% brightness though — hoping support can swap them.",
    createdAt: "2026-04-30",
    status: "flagged",
    sentiment: "negative",
    helpfulVotes: 17
  },
  {
    id: "FB-2019",
    productId: "P-1024",
    productName: "Hand-Blown Glass Vase",
    customerId: "C-10",
    customerName: "Isabella Rossi",
    rating: 5,
    title: "Stunning piece, packed beautifully",
    body: "Arrived without a scratch despite a long international shipping window. The light catches it differently throughout the day — really special.",
    createdAt: "2026-04-29",
    status: "archived",
    sentiment: "positive",
    helpfulVotes: 10
  },
  {
    id: "FB-2020",
    productId: "P-1019",
    productName: "Pleated Trousers",
    customerId: "C-16",
    customerName: "Ana Lopez",
    rating: 4,
    title: "Beautiful drape, hem ran long",
    body: "The fabric and pleats are perfect. Had to take an inch off the hem — would love an inseam option at checkout.",
    createdAt: "2026-04-28",
    status: "new",
    sentiment: "neutral",
    helpfulVotes: 9
  },
  {
    id: "FB-2021",
    productId: "P-1001",
    productName: "Minimal Backpack",
    customerId: "C-01",
    customerName: "Alex Turner",
    rating: 4,
    title: "Great for daily carry",
    body: "Slim enough to not look bulky, fits a 13\" laptop and notebook. Would love a dedicated pen slot inside.",
    createdAt: "2026-04-27",
    status: "replied",
    sentiment: "positive",
    reply: "Alex — noted on the pen slot, passed it to the design team for the next iteration.",
    repliedAt: "2026-04-28",
    helpfulVotes: 6
  },
  {
    id: "FB-2022",
    productId: "P-1002",
    productName: "Smart Watch",
    customerId: "C-03",
    customerName: "Jordan Miles",
    rating: 5,
    title: "Replaced my Apple Watch",
    body: "Battery and sleep tracking are a generational leap. The strap quick-release is a small detail I love.",
    createdAt: "2026-04-26",
    status: "new",
    sentiment: "positive",
    helpfulVotes: 33
  },
  {
    id: "FB-2023",
    productId: "P-1013",
    productName: "Leather Card Holder",
    customerId: "C-02",
    customerName: "Maya Singh",
    rating: 5,
    title: "Beautifully made",
    body: "Holds six cards comfortably and a folded note. The leather smell when it arrived was glorious.",
    createdAt: "2026-04-25",
    status: "archived",
    sentiment: "positive",
    helpfulVotes: 4
  }
] as const;

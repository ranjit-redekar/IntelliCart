import { products } from "../mockdata";

type Product = (typeof products)[number];

export interface AssistantReply {
  text: string;
  products: Product[];
  followups: string[];
}

// Mock "AI" — deterministic intent + entity extraction.
// Production swap point: replace with a streaming call to your model
// of choice. The shape of the returned object is what the UI consumes.
export function generateAssistantReply(prompt: string): AssistantReply {
  const q = prompt.toLowerCase().trim();

  // Greeting / pleasantries
  if (/^(hi|hello|hey|yo|howdy)\b/.test(q)) {
    return {
      text: "Hi there. I can help you find products, summarize reviews, or answer questions about anything in the catalog. What are you looking for?",
      products: [],
      followups: [
        "Show me something under $100",
        "What's selling right now?",
        "I need a gift for someone who likes minimal design",
      ],
    };
  }

  if (/thank/.test(q)) {
    return {
      text: "Anytime. Let me know if you'd like recommendations or help comparing pieces.",
      products: [],
      followups: ["What's new this week?", "Top rated under $150"],
    };
  }

  // Category detection
  let category: string | null = null;
  if (/cloth|jacket|shirt|fashion|wear|tee|trouser|sneaker|beanie|scarf/.test(q)) category = "fashion";
  else if (/electronic|gadget|tech|watch|earbud|speaker|keyboard|ssd|headphone|camera|bulb/.test(q)) category = "electronics";
  else if (/home|lamp|mug|decor|kitchen|towel|vase|throw|candle|board|diffuser/.test(q)) category = "home";

  // Price filter
  const underMatch = q.match(/under\s*\$?(\d+)/);
  const maxPrice = underMatch ? Number(underMatch[1]) : null;

  let pool: Product[] = [...products];
  if (category) pool = pool.filter((p) => p.categoryId === category);
  if (maxPrice != null) pool = pool.filter((p) => p.price <= maxPrice);

  // Intent
  let intro = "Here are a few picks based on what you asked.";
  let followups: string[] = [
    "Anything similar but cheaper?",
    "What do customers say about these?",
    "Show me more like the first one",
  ];

  if (/gift|present/.test(q)) {
    intro = "Crowd-pleasing gift ideas — high-rated, broadly liked, and packaged nicely.";
    pool = pool.sort((a, b) => b.rating - a.rating);
    followups = ["Anything under $50?", "What's new this season?", "Bundle two of these"];
  } else if (/sale|deal|discount/.test(q)) {
    intro = "Sitewide is 20% off with code SPRING20. The strongest picks at full price are still strong on sale.";
    pool = pool.sort((a, b) => b.rating - a.rating);
    followups = ["Show me clearance only", "What's the deepest discount?", "Add free shipping?"];
  } else if (/best|top|popular|rated/.test(q)) {
    intro = "These are the highest-rated pieces customers keep coming back to.";
    pool = pool.sort((a, b) => b.rating - a.rating);
    followups = ["Why is the first one rated so highly?", "Anything similar but bigger?", "Compare these"];
  } else if (/cheap|budget|afford|under/.test(q)) {
    intro = "Most rewarding pieces at lower price points.";
    pool = pool.sort((a, b) => a.price - b.price);
    followups = ["Anything under $30?", "Bundle a few", "Add a related piece"];
  } else if (/compare/.test(q)) {
    intro = "These three are the ones customers most often weigh against each other.";
    pool = pool.sort((a, b) => b.rating - a.rating);
    followups = ["Which is best for daily use?", "Smallest of the three?", "Which lasts longest?"];
  } else if (/new|latest|fresh/.test(q)) {
    intro = "Newer additions worth a look this week.";
    pool = pool.sort((a, b) => b.rating - a.rating);
    followups = ["Show me by category", "Anything app-exclusive?"];
  } else if (/recommend|suggest|help|need|find|looking/.test(q)) {
    intro = "Based on what's resonating with customers like you right now.";
    pool = pool.sort((a, b) => b.rating - a.rating);
  } else if (pool.length === 0) {
    return {
      text: "I couldn't find anything that matches exactly. Try broadening the search — for instance, drop the price cap or remove a category word.",
      products: [],
      followups: ["Show me everything top-rated", "What's under $50?", "Browse home goods"],
    };
  }

  return {
    text: intro,
    products: pool.slice(0, 3),
    followups,
  };
}

export interface SmartSearchInterpretation {
  summary: string | null;
  filters: {
    categoryId?: string;
    maxPrice?: number;
    minRating?: number;
    sort?: "price-asc" | "price-desc" | "rating";
  };
}

export function interpretSearch(query: string): SmartSearchInterpretation {
  const q = query.toLowerCase().trim();
  if (!q) return { summary: null, filters: {} };

  const filters: SmartSearchInterpretation["filters"] = {};
  const notes: string[] = [];

  const under = q.match(/under\s*\$?(\d+)/);
  if (under) {
    filters.maxPrice = Number(under[1]);
    notes.push(`under $${filters.maxPrice}`);
  }

  if (/fashion|cloth|jacket|tee|wear|sneaker|beanie|scarf|trouser/.test(q)) {
    filters.categoryId = "fashion";
    notes.push("in fashion");
  } else if (/electronic|gadget|tech|watch|earbud|speaker|keyboard/.test(q)) {
    filters.categoryId = "electronics";
    notes.push("in electronics");
  } else if (/home|lamp|mug|decor|towel|vase|candle/.test(q)) {
    filters.categoryId = "home";
    notes.push("for the home");
  }

  if (/top.rated|best|highly.rated/.test(q)) {
    filters.sort = "rating";
    filters.minRating = 4.5;
    notes.push("top-rated");
  } else if (/cheap|budget|afford/.test(q)) {
    filters.sort = "price-asc";
    notes.push("budget-friendly");
  } else if (/premium|luxury|high end/.test(q)) {
    filters.sort = "price-desc";
    notes.push("premium");
  }

  if (notes.length === 0) return { summary: null, filters: {} };
  return { summary: notes.join(" · "), filters };
}

export function generateProductAnswer(question: string, productName: string, category: string): string {
  const q = question.toLowerCase();
  if (/material|made of|fabric|build/.test(q)) {
    if (category.toLowerCase() === "fashion") {
      return `The ${productName} uses sourced-from-named-mill materials — typically a heavyweight, breathable construction designed to soften and improve with wear. Spec sheet is on the product page.`;
    }
    if (category.toLowerCase() === "electronics") {
      return `The ${productName} pairs a machined aluminum chassis with shock-absorbing internals. Components are chosen for durability over spec-sheet bragging rights.`;
    }
    return `The ${productName} is made from natural, named materials — provenance is listed on the product page. It's built to age well rather than look pristine forever.`;
  }
  if (/wash|care|clean|maintain/.test(q)) {
    return `Cold wash, gentle cycle, lay flat to dry is the safest default for the ${productName}. Avoid hot water and tumble drying — these accelerate wear.`;
  }
  if (/return|refund/.test(q)) {
    return `You have 30 days to return the ${productName} for any reason. We cover return shipping on orders over $50.`;
  }
  if (/ship|delivery|when/.test(q)) {
    return `Most orders ship within 1 business day. Standard delivery is free over $50; expedited adds $12.`;
  }
  if (/size|fit|measur/.test(q)) {
    return `Customers report the ${productName} runs true to size. If you're between sizes, the consensus is to size down for a closer fit.`;
  }
  if (/compare|vs|versus/.test(q)) {
    return `Within the catalog, the ${productName} is most often compared to higher-priced alternatives that don't outperform it on the metrics that matter day-to-day. It's the value choice in its category.`;
  }
  if (/good for|use for|suitable/.test(q)) {
    return `The ${productName} is built for everyday use rather than edge-case scenarios. Customers report it slots into daily routines without fuss.`;
  }
  return `Based on what customers report about the ${productName}: it's well-made, performs as advertised, and tends to get better with use. If you have a more specific question, ask again with the detail you care about.`;
}

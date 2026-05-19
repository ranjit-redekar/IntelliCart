import { products } from "../mockdata";

type Product = (typeof products)[number];

export interface AssistantReply {
  text: string;
  products: Product[];
  followups: string[];
}

// Mock "AI" — deterministic intent + entity extraction.
// Production swap: replace with a streaming API call. The shape this
// returns is what the UI consumes.
export function generateAssistantReply(prompt: string): AssistantReply {
  const q = prompt.toLowerCase().trim();

  if (/^(hi|hello|hey|yo|howdy)\b/.test(q)) {
    return {
      text:
        "Hi there. I can help you find products, summarize reviews, or answer questions about anything in the catalog. What are you looking for?",
      products: [],
      followups: [
        "Show me something under $100",
        "What's selling right now?",
        "I need a gift for someone minimal",
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

  let category: string | null = null;
  if (/cloth|jacket|shirt|fashion|wear|tee|trouser|sneaker|beanie|scarf/.test(q)) category = "fashion";
  else if (/electronic|gadget|tech|watch|earbud|speaker|keyboard|ssd|headphone|camera|bulb/.test(q))
    category = "electronics";
  else if (/home|lamp|mug|decor|kitchen|towel|vase|throw|candle|board|diffuser/.test(q)) category = "home";

  const underMatch = q.match(/under\s*\$?(\d+)/);
  const maxPrice = underMatch ? Number(underMatch[1]) : null;

  let pool: Product[] = [...products];
  if (category) pool = pool.filter((p) => p.categoryId === category);
  if (maxPrice != null) pool = pool.filter((p) => p.price <= maxPrice);

  let intro = "Here are a few picks based on what you asked.";
  let followups: string[] = [
    "Anything similar but cheaper?",
    "What do customers say about these?",
    "Show me more like the first one",
  ];

  if (/gift|present/.test(q)) {
    intro = "Crowd-pleasing gift ideas — high-rated and broadly liked.";
    pool = pool.sort((a, b) => b.rating - a.rating);
    followups = ["Anything under $50?", "What's new this season?"];
  } else if (/sale|deal|discount/.test(q)) {
    intro = "Sitewide is 20% off with code SPRING20. The strongest picks at full price are still strong on sale.";
    pool = pool.sort((a, b) => b.rating - a.rating);
    followups = ["Show me clearance only", "Deepest discount?"];
  } else if (/best|top|popular|rated/.test(q)) {
    intro = "Top-rated picks customers keep coming back to.";
    pool = pool.sort((a, b) => b.rating - a.rating);
    followups = ["Why is the first one rated so high?", "Anything bigger?"];
  } else if (/cheap|budget|afford|under/.test(q)) {
    intro = "Most rewarding pieces at lower price points.";
    pool = pool.sort((a, b) => a.price - b.price);
    followups = ["Anything under $30?", "Bundle a few"];
  } else if (/compare/.test(q)) {
    intro = "These are most often weighed against each other.";
    pool = pool.sort((a, b) => b.rating - a.rating);
    followups = ["Which is best for daily use?", "Smallest of the three?"];
  } else if (/new|latest|fresh/.test(q)) {
    intro = "Newer additions worth a look.";
    pool = pool.sort((a, b) => b.rating - a.rating);
  } else if (/recommend|suggest|help|need|find|looking/.test(q)) {
    intro = "Based on what's resonating with customers like you right now.";
    pool = pool.sort((a, b) => b.rating - a.rating);
  } else if (pool.length === 0) {
    return {
      text:
        "I couldn't find anything that matches exactly. Try broadening — drop the price cap or remove a category word.",
      products: [],
      followups: ["Show me everything top-rated", "What's under $50?"],
    };
  }

  return {
    text: intro,
    products: pool.slice(0, 3),
    followups,
  };
}

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "budgetpilot-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasAiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // AI Savings & Household Financial Advisor endpoint
  app.post("/api/ai-advisor", async (req, res) => {
    try {
      const { budgetSummary, prompt, mode } = req.body;
      const ai = getAi();

      if (!ai) {
        // Fallback local smart insights if Gemini key is not configured
        const fallbackInsights = generateLocalFinancialInsights(budgetSummary, prompt, mode);
        return res.json({
          response: fallbackInsights,
          isFallback: true,
          mode,
        });
      }

      const systemPrompt = `You are a certified Household Financial & Savings Coach specializing in family budgeting, zero-based budgeting, smart frugal living, recurring bill reduction, and debt elimination.
Your goal is to provide empathetic, realistic, high-impact financial advice tailored to this specific household's data.

Guidelines:
1. Always be practical, respectful, and motivating.
2. Use formatted markdown with clear headings, bullet points, and bold numbers.
3. Suggest specific dollar-saving tactics (e.g. meal planning, grocery unit pricing, utility timers, subscription audit, insurance rate check).
4. Focus on helping every household member work together seamlessly to save money.
5. If recommending cuts, prioritize non-essential discretionary items over health and safety.`;

      let userContent = "";
      if (mode === "audit") {
        userContent = `Please review this household's financial snapshot and provide:
1. A quick "Financial Health Score" (0-100) with 2-sentence rationale.
2. The Top 3 Immediate Money Leaks / Overspending risks.
3. 3 Concrete Action Steps to save at least $150-$400 this month.
4. Suggestions for their Savings Goals.

Household Financial Snapshot:
${JSON.stringify(budgetSummary, null, 2)}
`;
      } else if (mode === "bill_negotiator") {
        userContent = `The household has the following recurring bills and subscriptions. Provide specific scripts, tactics, and alternatives to negotiate, bundle, or eliminate costs:
Recurring Bills:
${JSON.stringify(budgetSummary.bills || [], null, 2)}
`;
      } else if (mode === "savings_challenge") {
        userContent = `Create a customized 30-Day Household Savings Challenge for this household based on their current spending breakdown and savings goals:
Household Data:
${JSON.stringify(budgetSummary, null, 2)}
`;
      } else {
        userContent = `User Question: "${prompt || "How can our household optimize our budget and save more this month?"}"

Current Household Financial Data:
${JSON.stringify(budgetSummary, null, 2)}
`;
      }

      let responseText = "";
      let isAiGenerated = false;

      // Model priority list: primary 3.7 flash, fallback to flash-latest or 3.1-flash-lite
      const candidateModels = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: userContent,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
            },
          });

          if (response.text) {
            responseText = response.text;
            isAiGenerated = true;
            break;
          }
        } catch (modelError: any) {
          console.warn(`Attempt with ${modelName} encountered:`, modelError.message || modelError);
          // If 503 or 429, wait briefly and try next model
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }

      if (isAiGenerated && responseText) {
        return res.json({
          response: responseText,
          isFallback: false,
          mode,
        });
      }

      // If AI services are momentarily overloaded (503/429), serve instant dynamic rules-based insights
      const localInsights = generateLocalFinancialInsights(budgetSummary, prompt, mode);
      res.json({
        response: localInsights,
        isFallback: true,
        notice: "AI model is currently experiencing peak traffic. Displaying real-time calculated financial diagnosis.",
        mode,
      });
    } catch (error: any) {
      console.error("AI Advisor handler error:", error);
      const { budgetSummary, prompt, mode } = req.body || {};
      const fallbackInsights = generateLocalFinancialInsights(budgetSummary, prompt, mode);
      res.json({
        response: fallbackInsights,
        isFallback: true,
        notice: "Displaying live calculated financial diagnosis.",
        mode,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BudgetPilot server running at http://localhost:${PORT}`);
  });
}

function generateLocalFinancialInsights(budgetSummary: any, prompt?: string, mode?: string): string {
  const totalIncome = budgetSummary?.totalIncome || 0;
  const totalSpent = budgetSummary?.totalSpent || 0;
  const totalBudget = budgetSummary?.totalBudget || 0;
  const currency = budgetSummary?.currency || "$";
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalSpent) / totalIncome) * 100) : 0;
  const remaining = totalIncome - totalSpent;

  // Find categories over or close to 85% budget
  const categories = budgetSummary?.categories || [];
  const overspentCats = categories.filter((c: any) => c.budgetCap > 0 && c.actualSpent > c.budgetCap);
  const highVarianceCats = categories.filter((c: any) => c.budgetCap > 0 && c.actualSpent >= c.budgetCap * 0.85 && c.actualSpent <= c.budgetCap);

  // Find highest cost bills
  const bills = budgetSummary?.bills || [];
  const sortedBills = [...bills].sort((a: any, b: any) => (b.amount || 0) - (a.amount || 0));
  const topBills = sortedBills.slice(0, 3);

  // Health Score Calculation (0 - 100)
  let healthScore = 65;
  if (savingsRate >= 20) healthScore += 20;
  else if (savingsRate >= 10) healthScore += 10;
  if (overspentCats.length === 0) healthScore += 15;
  else healthScore -= overspentCats.length * 8;
  healthScore = Math.max(20, Math.min(98, healthScore));

  if (mode === "bill_negotiator") {
    const billItemsText = topBills.length > 0 
      ? topBills.map((b: any) => `- **${b.name}** (${currency}${b.amount}/mo): Call provider, request loyalty discounts or bundle adjustments. Projected savings: **${currency}${Math.round(b.amount * 0.15)}–${currency}${Math.round(b.amount * 0.3)}/mo**`).join("\n")
      : "- **Internet & Mobile:** Mention competitor rates. Average savings: **$30–$50/mo**.";

    return `### 💡 Smart Bill Negotiation & Subscription Audit

${billItemsText}

#### 📞 Action Script for Service Providers:
> *"Hello, I have been reviewing our household expenses. I've noticed competitive offers from other providers for similar tiers. What promotions, speed/loyalty credits, or retention bundles can you apply to keep our monthly rate competitive?"*

#### ⚡ Additional Quick Wins:
1. **Streaming & Subscriptions:** Pause or rotate active services you haven't accessed in the last 14 days.
2. **Insurance Policy Review:** Obtain 2 comparison quotes for auto & home/renters insurance every 12 months (avg. saving **${currency}400+/yr**).
3. **Utility Time-of-Use:** Schedule high-draw appliances (dishwasher, dryer) for off-peak hours.`;
  }

  if (mode === "savings_challenge") {
    return `### 🎯 30-Day Household Savings Sprint (Target: +${currency}250–${currency}400)

- **Week 1: The Pantry & Freezer Sweep:** Plan 4-5 dinners strictly around pantry staples and store discounts. Projected savings: **${currency}65–${currency}90**.
- **Week 2: Zero-Discretionary Weekend:** Enjoy free local nature trails, movie night with home popcorn, and board games. Projected savings: **${currency}80–${currency}120**.
- **Week 3: Energy & Thermostat Optimization:** Adjust cooling/heating by 2°F and wash clothing loads on cold. Projected savings: **${currency}25–${currency}40/mo**.
- **Week 4: Subscription & Service Audit:** Cancel or share 2 unutilized digital passes. Projected savings: **${currency}30–${currency}50/mo**.

*🏆 Projected 30-Day Household Gain: **~${currency}280–${currency}380***`;
  }

  const overspentWarning = overspentCats.length > 0
    ? `⚠️ **Over-Budget Envelopes Detected:** ${overspentCats.map((c: any) => `**${c.name}** (spent ${currency}${c.actualSpent} vs cap ${currency}${c.budgetCap})`).join(", ")}.`
    : `✅ **Envelopes on Track:** All category budgets are currently within allocated thresholds.`;

  const highVarianceNotice = highVarianceCats.length > 0
    ? `\n- **Close to Limit (85%+ used):** ${highVarianceCats.map((c: any) => `${c.name} (${currency}${c.actualSpent}/${currency}${c.budgetCap})`).join(", ")}.`
    : "";

  return `### 📊 360° Household Financial Health Diagnostic

- **Financial Health Score:** **${healthScore}/100** — ${healthScore >= 80 ? "Solid foundation with positive cash accumulation." : "Good momentum with opportunities to plug monthly leaks."}
- **Household Savings Rate:** **${savingsRate}%** (${savingsRate >= 20 ? "🌟 Exceeds the 20% golden standard" : "Target: 15–20% of net income"})
- **Monthly Net Cash Remaining:** **${currency}${remaining.toLocaleString()}**
- **Budget Allocated:** **${currency}${totalBudget.toLocaleString()}** | **Total Spent:** **${currency}${totalSpent.toLocaleString()}**

---

#### 🔍 Critical Overviews & Money Leaks:
1. ${overspentWarning}${highVarianceNotice}
2. **50/30/20 Balance:** Ensure essential Needs stay under 50% of income, leaving ample space for automated debt elimination and savings vault contributions.
3. **Paycheck-to-Paycheck Buffer:** Aim to maintain at least 1 full month of baseline living expenses liquid in your Emergency Fund.

#### 🚀 3 Immediate High-Impact Action Steps:
1. **Automate Sinking Fund Transfers:** Schedule automatic deposits into your designated savings goals on the 1st of every month before discretionary spending begins.
2. **Weekly Dining Out Envelope:** Establish a mid-week check-in for dining out and delivery spending to prevent weekend envelope overflows.
3. **Weekly Family Sync:** Spend 5 minutes every Sunday reviewing the **BudgetPilot Visuals** together to celebrate progress!`;
}

startServer();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini API client on the server
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not set.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key-for-init",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// AI Chatbot endpoint for GST & Business Advisory Assistant
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, contextData, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are "Shree ERP AI Assistant", an expert AI Business Advisor and GST Compliance Specialist built into Shree Billing & ERP Pro software.
Your job is to assist Indian small & medium business owners (SMBs) with:
1. Indian GST Laws, CGST/SGST/IGST calculations, HSN/SAC code lookups, E-way bill rules, and GSTR filing tips.
2. Invoice generation assistance, discount structuring, and billing summaries.
3. Inventory management advice (reorder optimization, cash flow management).
4. Financial breakdown of company stats provided in context.

Company Context:
Business Name: ${contextData?.businessName || "Shree Enterprises"}
GSTIN: ${contextData?.gstin || "27ABCDE1234F1ZH"}
State: ${contextData?.state || "Maharashtra"}
Total Revenue: ₹${contextData?.totalRevenue || 0}
Pending Collections: ₹${contextData?.totalReceivable || 0}
Low Stock Count: ${contextData?.lowStockCount || 0} items

Respond concisely, accurately, and professionally in markdown format. You can use Indian Rupee (₹) formatting. Keep answers clear, practical, and tailored to Indian business standards.`;

    const contents = [];
    if (history && Array.isArray(history) && history.length > 0) {
      for (const msg of history.slice(-6)) {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I'm sorry, I couldn't process that request at the moment.";
    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    return res.status(500).json({
      error: "Failed to generate AI response",
      details: error?.message || "Internal Server Error",
      fallbackReply: "GST Advice Quick Note: CGST & SGST apply for intra-state sales (same state POS), while IGST applies for inter-state transactions. Check your business settings to ensure correct GSTIN configuration."
    });
  }
});

// AI Bill Photo & Document OCR Scanner endpoint
app.post("/api/ai/scan-bill", async (req, res) => {
  try {
    const { image, images, mimeType } = req.body;

    if (!image && (!images || !images.length)) {
      return res.status(400).json({ error: "At least one bill image or PDF page is required" });
    }

    const ai = getGeminiClient();

    // Prepare parts array with images and prompt
    const parts: any[] = [];

    const rawImages = images && images.length > 0 ? images : [image];

    for (const rawImg of rawImages) {
      if (!rawImg) continue;
      // strip data URL prefix if present (e.g. data:image/jpeg;base64,...)
      let base64Data = rawImg;
      let effectiveMime = mimeType || "image/jpeg";

      if (rawImg.includes(";base64,")) {
        const split = rawImg.split(";base64,");
        effectiveMime = split[0].replace("data:", "");
        base64Data = split[1];
      }

      parts.push({
        inlineData: {
          mimeType: effectiveMime,
          data: base64Data,
        },
      });
    }

    const promptText = `Analyze this purchase bill / invoice photo / document and extract all structured details into a JSON object.
Extract supplier details, invoice number, invoice date, and all line items with precision.

Required JSON format:
{
  "supplierName": "Supplier or Vendor Company Name",
  "supplierGstin": "15-digit GSTIN or empty string",
  "supplierPhone": "Phone number or empty string",
  "supplierAddress": "Full supplier address or empty string",
  "invoiceNumber": "Invoice / Bill Number e.g. INV-1024 or 1245",
  "invoiceDate": "YYYY-MM-DD",
  "items": [
    {
      "productName": "Name of the product/item",
      "hsnCode": "HSN/SAC Code or empty string",
      "quantity": 10,
      "unit": "PCS",
      "purchaseRate": 100,
      "sellingPrice": 125,
      "discountPercent": 0,
      "gstPercent": 18,
      "taxAmount": 180,
      "totalAmount": 1180,
      "batchNo": "Optional Batch No or empty string",
      "warehouse": "Main Store",
      "remarks": "Item specs/notes or empty string",
      "confidence": 95,
      "confidenceLevel": "high"
    }
  ],
  "subtotal": 1000,
  "totalTax": 180,
  "grandTotal": 1180,
  "overallConfidence": 90
}

Note for 'unit': Choose best fit from: PCS, BAG, MTR, KG, GM, LTR, ML, BOX, PKT, ROLL, NOS, SET, DOZEN, FT, INCH.
Note for 'confidenceLevel': 'high' if confidence >= 85, 'review' if 60 to 84, 'low' if < 60.
Ensure numbers are pure numbers. Return raw valid JSON.`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const rawJsonText = response.text || "{}";
    let scanResult: any = {};
    try {
      scanResult = JSON.parse(rawJsonText);
    } catch {
      // Fallback clean regex
      const jsonMatch = rawJsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scanResult = JSON.parse(jsonMatch[0]);
      }
    }

    return res.json({
      success: true,
      data: scanResult,
    });
  } catch (error: any) {
    console.error("AI Bill Scan Error:", error);
    return res.status(500).json({
      error: "Failed to process bill OCR",
      details: error?.message || "AI Vision scanning failed",
    });
  }
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Shree Billing & ERP Pro" });
});

async function startServer() {
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
    console.log(`Shree ERP Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

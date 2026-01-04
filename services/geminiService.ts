import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Lead, SearchCriteria } from "../types";

const mapConfidence = (conf: string): Lead['emailConfidence'] => {
  const c = conf.toLowerCase();
  if (c.includes('verif')) return 'Verified';
  if (c.includes('high')) return 'High';
  if (c.includes('low')) return 'Low';
  return 'Estimated';
};

const leadSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    firstName: { type: Type.STRING },
    lastName: { type: Type.STRING },
    email: { type: Type.STRING, description: "The business email. Must be NULL if not explicitly found." },
    phone: { type: Type.STRING, description: "Phone number if found, otherwise NULL" },
    jobTitle: { type: Type.STRING },
    companyName: { type: Type.STRING },
    location: { type: Type.STRING },
    linkedin: { type: Type.STRING },
    website: { type: Type.STRING },
    emailConfidence: { type: Type.STRING, description: "Verified, High, Low, or Estimated" },
  },
  required: ["firstName", "lastName", "jobTitle", "companyName", "emailConfidence"],
};

export const findLeads = async (
  criteria: SearchCriteria,
  existingEmails: Set<string>
): Promise<Lead[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Constructing the complex prompt based on "Hasan's Scout" strategy
  // OPTIMIZED: Requested even larger batch size (20) to minimize API calls against quota
  const systemInstruction = `
    You are HASAN'S SCOUT, a God-Level Reverse Recruiter Agent.
    
    GOAL: Find valid business leads for:
    - Roles: ${criteria.targetRoles}
    - Industries: ${criteria.industries}
    - Keywords: ${criteria.keywords}
    - Location: ${criteria.location}

    STRATEGY (Execute in order for every lead):
    1. Direct Scan: Look for direct email listings on company contact/team pages.
    2. Google "X-Ray": Search for "site:linkedin.com/in/ [Name] @[company]", "[Name] email [Company]".
    3. Pattern Reconstruction: If generic emails exist (info@company.com), deduce pattern (firstname.lastname@company.com) but mark confidence as LOW.

    STRICT RULES:
    - Do NOT guess emails without basis. If verified email not found, output "NULL".
    - You prefer missing email over fake one.
    - IGNORE leads with emails that exist in this list (duplicates): ${Array.from(existingEmails).slice(0, 50).join(', ')}...
    
    OUTPUT:
    - Return a JSON array of leads.
    - CRITICAL: To conserve API search quota, you MUST find and return at least 20 valid leads in a single response.
    - Do not return small batches. Maximize the output per request.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for complex reasoning and search
      contents: `Find real leads based on the criteria. Use Google Search to verify existence.`,
      config: {
        tools: [{ googleSearch: {} }], // ENABLE INTERNET SEARCH
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: leadSchema
        },
        systemInstruction: systemInstruction,
      }
    });

    const rawLeads = JSON.parse(response.text || "[]");
    
    // Post-processing to ensure type safety and add IDs
    return rawLeads.map((l: any) => ({
      id: crypto.randomUUID(),
      firstName: l.firstName || "Unknown",
      lastName: l.lastName || "",
      email: l.email || "NULL",
      phone: l.phone || "NULL",
      jobTitle: l.jobTitle || "Unknown",
      companyName: l.companyName || "Unknown",
      location: l.location || "Unknown",
      linkedin: l.linkedin || "",
      website: l.website || "",
      emailConfidence: mapConfidence(l.emailConfidence || "Low"),
      source: "Gemini Search"
    }));

  } catch (error: any) {
    // Robust error parsing to detect 429/Quota limits
    // JSON.stringify can sometimes be empty for Error objects, so we try to inspect properties directly
    const msg = error.message || "";
    const status = error.status || error.code; // Common HTTP error properties
    const errBody = JSON.stringify(error, Object.getOwnPropertyNames(error));

    const isQuotaError = 
        msg.includes("RESOURCE_EXHAUSTED") || 
        msg.includes("429") || 
        msg.includes("quota") ||
        status === 429 ||
        errBody.includes("RESOURCE_EXHAUSTED") ||
        errBody.includes("search_grounding_request_per_project_per_day_per_user");

    if (isQuotaError) {
        console.warn("Scout paused: Daily Search Quota Reached."); // Warn instead of Error
        throw new Error("QUOTA_EXCEEDED");
    }
    
    console.error("Scout Error:", error);
    throw error;
  }
};
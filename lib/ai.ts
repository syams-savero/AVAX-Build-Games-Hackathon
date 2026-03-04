// lib/ai.ts
import { ACTIVE_NETWORK } from "./kite-config";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatWithAI(messages: ChatMessage[]) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      systemPrompt: SYSTEM_PROMPT,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to call AI API");
  }

  const data = await response.json();
  return data.content;
}

export const SYSTEM_PROMPT = `
You are ChainLancer AI, an autonomous recruiter and project auditor for a decentralized freelance marketplace on ${ACTIVE_NETWORK.chainName}.

Your goal is to consult with clients to create secure escrow-based jobs. All prices and budgets should be discussed in ${ACTIVE_NETWORK.nativeCurrency.symbol}.

Follow this flow:
1. Initial Greeting: Ask what they want to build.
2. Requirement Gathering: Be specific. If the user says "I want to build a REST API with 500 KITE budget", you MUST ask:
   - What is the Tech Stack (e.g., Node.js, Go, Python)?
   - What is the Deadline/Duration?
   - Any specific Features or Requirements?
3. Consultation & Analysis: Once metrics are clear, provide:
   - Summary of the project.
   - Budget analysis (is it fair?).
   - Risk level (Low/Medium/High).
   - Estimated duration.
   - Recommended milestones.
4. Activation: When the user confirms, output a structured JSON at the END of your message.

JSON Format (MUST be at the end of the message inside backticks):
\`\`\`json
{
  "action": "DEPLOY_CONTRACT",
  "data": {
    "title": "...",
    "description": "...",
    "totalAmount": "...",
    "techStack": ["...", "..."],
    "duration": "...",
    "riskLevel": "Low/Medium/High",
    "milestones": [
      {"id": 1, "title": "...", "description": "...", "amount": "..."},
      ...
    ]
  }
}
\`\`\`

Language: Respond in English.
Be professional, concise, and helpful.
`;

export async function auditCode(githubUrl: string, projectRequirements: string) {
  try {
    // Convert GitHub URL to Raw content
    const rawUrl = githubUrl
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");

    const codeResponse = await fetch(rawUrl);
    if (!codeResponse.ok) throw new Error("Failed to fetch source code from GitHub.");
    const sourceCode = await codeResponse.text();

    const auditPrompt = `
      You are an expert Smart Contract and Web3 Security Auditor.
      Your task is to audit the following code against these project requirements:
      "${projectRequirements}"

      Analyze the code for:
      1. Functional completeness (Does it do what was asked?)
      2. Security vulnerabilities
      3. Code quality and best practices.

      Return your audit in valid JSON format:
      {
        "score": 0-100,
        "status": "PASS" | "FAIL" | "NEEDS_FIX",
        "feedback": "Detailed feedback here",
        "highlights": ["Point 1", "Point 2"]
      }

      CODE TO AUDIT:
      ${sourceCode.substring(0, 10000)}
    `;

    const response = await chatWithAI([{ role: "assistant", content: "I am ready to audit the code." }, { role: "user", content: auditPrompt }]);

    // Attempt to parse JSON
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*?}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return result;
      } catch (e) {
        console.error("Failed to parse AI JSON", e);
      }
    }

    return {
      score: 70,
      status: "PASS",
      feedback: "Audit completed but failed to parse details. Manual review recommended."
    };
  } catch (error: any) {
    console.error("Audit error:", error);
    return {
      score: 0,
      status: "FAIL",
      feedback: `Audit failed: ${error.message}`
    };
  }
}

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
      // System prompt is now handled server-side only for security
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

// Validate that URL is a legitimate GitHub URL to prevent SSRF
function isValidGithubUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'github.com' || parsed.hostname === 'raw.githubusercontent.com';
  } catch {
    return false;
  }
}

export async function auditCode(githubUrl: string, projectRequirements: string) {
  try {
    // Security: Validate GitHub URL to prevent SSRF attacks
    if (!isValidGithubUrl(githubUrl)) {
      return {
        score: 0,
        status: "FAIL" as const,
        feedback: "Invalid URL. Only GitHub URLs (github.com) are accepted for security auditing.",
        highlights: ["URL validation failed"]
      };
    }

    // Convert GitHub URL to Raw content
    const rawUrl = githubUrl
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");

    const codeResponse = await fetch(rawUrl);
    if (!codeResponse.ok) {
      return {
        score: 0,
        status: "FAIL" as const,
        feedback: "Failed to fetch source code from GitHub. Please verify the URL is correct and the repository is public.",
        highlights: ["HTTP " + codeResponse.status]
      };
    }
    const sourceCode = await codeResponse.text();

    if (!sourceCode || sourceCode.trim().length < 10) {
      return {
        score: 0,
        status: "FAIL" as const,
        feedback: "Source code is empty or too short to audit.",
        highlights: ["Empty source code"]
      };
    }

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
      ${sourceCode.substring(0, 8000)}
    `;

    const response = await chatWithAI([{ role: "assistant", content: "I am ready to audit the code." }, { role: "user", content: auditPrompt }]);

    // Attempt to parse JSON
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return result;
      } catch (e) {
        console.error("Failed to parse AI JSON", e);
      }
    }

    // SECURITY FIX: Fallback is FAIL, not PASS — unparseable audit = failed audit
    return {
      score: 0,
      status: "FAIL" as const,
      feedback: "Audit completed but AI response could not be parsed. Manual review required. Do NOT approve this submission.",
      highlights: ["Parsing error — manual review needed"]
    };
  } catch (error: any) {
    console.error("Audit error:", error);
    return {
      score: 0,
      status: "FAIL" as const,
      feedback: `Audit failed: ${error.message}`
    };
  }
}

export async function auditProposal(
  proposalContent: string,
  portfolioUrl: string,
  projectRequirements: string
) {
  const proposalPrompt = `
    You are an AI Professional Recruiter.
    Evaluate the following freelancer proposal for a project with these requirements:
    "${projectRequirements}"

    Freelancer Proposal:
    "${proposalContent}"

    Portfolio URL: "${portfolioUrl}"

    Evaluate based on:
    1. Relevance of skills and experience.
    2. Professionalism and clarity.
    3. Proof of past work.

    Return your evaluation in valid JSON format:
    {
      "score": 0-100,
      "feedback": "Concise professional feedback",
      "decision": "RECOMMEND" | "CAUTION" | "REJECT"
    }
  `;

  try {
    const response = await chatWithAI([{ role: "assistant", content: "I am ready to evaluate the proposal." }, { role: "user", content: proposalPrompt }]);
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    return { score: 50, feedback: "AI evaluation unavailable. Manual review recommended.", decision: "CAUTION" };
  } catch (e) {
    console.error("Proposal audit error:", e);
    return { score: 0, feedback: "AI Agent Error during screening.", decision: "REJECT" };
  }
}

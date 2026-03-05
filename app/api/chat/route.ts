import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/ai";

// Simple in-memory rate limiter (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20; // max requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return false;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
        return true;
    }
    return false;
}

export async function POST(req: Request) {
    try {
        // Rate limiting
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: "Too many requests. Please wait a moment before trying again." },
                { status: 429 }
            );
        }

        const { messages } = await req.json();
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "GROQ_API_KEY is not defined on the server" }, { status: 500 });
        }

        // Input validation
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
        }

        // Sanitize: only allow valid roles
        const sanitizedMessages = messages
            .filter((m: any) => m && typeof m.content === "string" && ["user", "assistant"].includes(m.role))
            .map((m: any) => ({ role: m.role, content: m.content.substring(0, 4000) }));

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    // SECURITY: System prompt is server-side only, never from client
                    { role: "system", content: SYSTEM_PROMPT },
                    ...sanitizedMessages
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json({ error: error.error?.message || "Failed to call Groq API" }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ content: data.choices[0].message.content });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

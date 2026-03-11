// lib/profile-store.ts — Supabase version

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Profile {
    address: string;
    name: string;
    bio: string;
    skills: string[];
    githubUrl: string;
    twitterUrl: string;
    portfolioUrl: string;
}

function mapProfile(row: any): Profile {
    return {
        address: row.address,
        name: row.name ?? "",
        bio: row.bio ?? "",
        skills: Array.isArray(row.skills) ? row.skills : [],
        githubUrl: row.github_url ?? "",
        twitterUrl: row.twitter_url ?? "",
        portfolioUrl: row.portfolio_url ?? "",
    };
}

export async function getProfile(address: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("address", address.toLowerCase())
        .maybeSingle();

    if (error) { console.error("getProfile error:", error.message); return null; }
    if (!data) return null;
    return mapProfile(data);
}

export async function upsertProfile(
    address: string,
    updates: Partial<Omit<Profile, "address">>
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from("profiles").upsert({
        address: address.toLowerCase(),
        name: updates.name ?? "",
        bio: updates.bio ?? "",
        skills: updates.skills ?? [],
        github_url: updates.githubUrl ?? "",
        twitter_url: updates.twitterUrl ?? "",
        portfolio_url: updates.portfolioUrl ?? "",
        updated_at: new Date().toISOString(),
    }, { onConflict: "address" });

    if (error) return { success: false, error: error.message };
    return { success: true };
}
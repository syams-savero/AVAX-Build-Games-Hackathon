'use server';

import { createClient } from '@supabase/supabase-js';
import { auditCode, auditProposal as libAuditProposal } from '@/lib/ai';

// Initialize Supabase with Service Role Key for secure backend operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function submitAndAuditWork(escrowId: string, githubUrl: string, userId: string) {
    try {
        // 1. Get escrow details securely from DB
        const { data: escrow, error: fetchError } = await supabaseAdmin
            .from('escrows')
            .select('worker, description')
            .eq('id', escrowId)
            .single();

        if (fetchError || !escrow) {
            throw new Error("Project not found");
        }

        // 2. Authorization check
        if (escrow.worker?.toLowerCase() !== userId.toLowerCase()) {
            throw new Error("Unauthorized: Only the assigned freelancer can submit work.");
        }

        // 3. Perform AI Audit from Server
        const result = await auditCode(githubUrl, escrow.description);

        // 4. Update Database Securely from Server
        const { error: updateError } = await supabaseAdmin
            .from('escrows')
            .update({
                github_url: githubUrl,
                ai_audit_result: `${result.score}% - ${result.status}: ${result.feedback.substring(0, 100)}...`
            })
            .eq('id', escrowId);

        if (updateError) {
            throw new Error("Failed to save audit result to database");
        }

        return { success: true, result };
    } catch (error: any) {
        console.error("Server Action Error (Audit):", error);
        return { success: false, error: error.message };
    }
}

export async function submitAndAuditProposalServer(
    escrowId: string,
    freelancerAddress: string,
    content: string,
    portfolioUrl: string
) {
    try {
        // 1. Get description
        const { data: escrow, error: fetchError } = await supabaseAdmin
            .from('escrows')
            .select('description')
            .eq('id', escrowId)
            .single();

        if (fetchError || !escrow) {
            throw new Error("Project not found");
        }

        // 2. AI Vetting
        const result = await libAuditProposal(content, portfolioUrl, escrow.description);

        // 3. Securely Insert Proposal
        const proposal = {
            id: `prop-${Date.now()}`,
            escrow_id: escrowId,
            freelancer: freelancerAddress,
            content: content,
            portfolio_url: portfolioUrl,
            ai_score: result.score,
            ai_feedback: result.feedback,
            status: 'pending'
        };

        const { error: insertError } = await supabaseAdmin
            .from('proposals')
            .insert([proposal]);

        if (insertError) {
            throw new Error("Database insertion failed");
        }

        return { success: true, result };
    } catch (error: any) {
        console.error("Server Action Error (Proposal):", error);
        return { success: false, error: error.message };
    }
}

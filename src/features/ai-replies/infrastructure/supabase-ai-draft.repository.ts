/** ADAPTER: SupabaseAiDraftRepository — persists generated drafts to ai_drafts. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, InternalError } from "@/core/errors/app-error";
import type { Database } from "@/network/supabase/types";
import type { AiDraftRepository, NewAiDraft } from "../domain/ai-draft.repository";

export class SupabaseAiDraftRepository implements AiDraftRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async record(draft: NewAiDraft): Promise<Result<void, AppError>> {
    const { error } = await this.db.from("ai_drafts").insert({
      business_id: draft.businessId,
      review_id: draft.reviewId,
      model: draft.model,
      prompt_tokens: draft.promptTokens,
      completion_tokens: draft.completionTokens,
      draft_text: draft.draftText,
      status: "draft",
    });
    if (error) return err(new InternalError("Could not record AI draft.", error));
    return ok(undefined);
  }
}

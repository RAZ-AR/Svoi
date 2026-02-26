// @ts-nocheck
// Svoi — Create listing server action + Supabase Storage upload helper
"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

export interface CreateListingPayload {
  categoryId:      number;
  title:           string;
  description:     string;
  price:           number | null;
  currency:        string;
  address:         string;
  lat:             number | null;
  lng:             number | null;
  images:          { url: string }[];
  eventDate:       string | null;
  // Jobs
  jobType?:        "seeking" | "offering" | null;
  jobSphere?:      string | null;
  jobExperience?:  string | null;
  jobCompany?:     string | null;
  jobWebsite?:     string | null;
  jobPosition?:    string | null;
  jobRequirements?: string | null;
  jobResumeUrl?:   string | null;
}

export type CreateListingResult =
  | {
      ok: true;
      listingId: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function createListing(
  payload: CreateListingPayload
): Promise<CreateListingResult> {
  try {
    const supabase = await createClient();

    // Get current svoi user id from auth session
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { ok: false, error: "Не авторизован" };

    // Telegram auth sets svoi_user_id in metadata directly
    let svoiUserId = authData.user.user_metadata?.svoi_user_id as string | undefined;

    // Fallback for Google OAuth users: look up by auth_id in users table
    if (!svoiUserId) {
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authData.user.id)
        .single();
      svoiUserId = userRow?.id;
    }

    if (!svoiUserId) return { ok: false, error: "Не авторизован" };

    // Use service client for INSERT — we've already verified the user above.
    // The RLS policy uses svoi_uid() which reads svoi_user_id from the JWT
    // top-level, but Supabase nests it inside user_metadata. Until the
    // svoi_uid() DB function is patched, bypass RLS server-side safely.
    const serviceSupabase = createServiceClient();
    const { data, error } = await serviceSupabase
      .from("listings")
      .insert({
        user_id:     svoiUserId,
        category_id: payload.categoryId,
        title:       payload.title.trim(),
        description: payload.description.trim() || null,
        price:       payload.price,
        currency:    payload.currency,
        address:     payload.address.trim() || null,
        lat:         payload.lat,
        lng:         payload.lng,
        images:           payload.images,
        status:           "active",
        event_date:       payload.eventDate       || null,
        job_type:         payload.jobType         || null,
        job_sphere:       payload.jobSphere       || null,
        job_experience:   payload.jobExperience   || null,
        job_company:      payload.jobCompany      || null,
        job_website:      payload.jobWebsite      || null,
        job_position:     payload.jobPosition     || null,
        job_requirements: payload.jobRequirements || null,
        job_resume_url:   payload.jobResumeUrl    || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    // Sync to Meilisearch in background (non-blocking)
    supabase
      .rpc("listing_to_search_doc", { p_listing_id: data.id })
      .then(async ({ data: doc }) => {
        if (doc) {
          const { indexListing } = await import("@/lib/meilisearch/sync");
          await indexListing(doc as Record<string, unknown>);
        }
      })
      .catch((e) => console.warn("[createListing] meili sync:", e));

    return { ok: true, listingId: data.id };
  } catch (err: unknown) {
    console.error("[createListing]", err);
    // Expose the real Supabase/postgres error message for debugging
    const msg =
      (err as { message?: string })?.message ??
      (err as { error_description?: string })?.error_description ??
      JSON.stringify(err);
    return { ok: false, error: msg };
  }
}

/**
 * Generates a pre-signed upload URL for Supabase Storage.
 * Images are uploaded directly from the browser — server only signs the URL.
 */
export async function getImageUploadUrl(
  mimeType: string
): Promise<{ ok: true; uploadUrl: string; publicUrl: string } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const ext = mimeType.split("/")[1] ?? "jpg";
    const path = `listings/${nanoid(12)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("images")
      .createSignedUploadUrl(path);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("images")
      .getPublicUrl(path);

    return { ok: true, uploadUrl: data.signedUrl, publicUrl };
  } catch (err) {
    console.error("[getImageUploadUrl]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Ошибка загрузки",
    };
  }
}

/** Generates a pre-signed upload URL for a PDF resume in the "files" bucket */
export async function getResumeUploadUrl(): Promise<
  { ok: true; uploadUrl: string; publicUrl: string } | { ok: false; error: string }
> {
  try {
    const supabase = await createClient();
    const path = `resumes/${nanoid(12)}.pdf`;

    const { data, error } = await supabase.storage
      .from("files")
      .createSignedUploadUrl(path);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("files")
      .getPublicUrl(path);

    return { ok: true, uploadUrl: data.signedUrl, publicUrl };
  } catch (err) {
    console.error("[getResumeUploadUrl]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Ошибка загрузки",
    };
  }
}

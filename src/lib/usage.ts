import { supabase } from "@/integrations/supabase/client";

/** Adds the number of files actually downloaded to the signed-in user's counter. Silent no-op when signed out. */
export const recordDocumentsIssued = (count: number) => {
  if (count < 1) return;
  supabase.rpc("record_documents_issued" as never, { _count: count } as never).then(({ error }) => {
    if (error) console.warn("usage tracking failed", error.message);
  });
};

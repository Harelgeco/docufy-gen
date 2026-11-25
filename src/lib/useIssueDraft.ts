import { useEffect, useState } from "react";
import { readIssueDraft, recoveryId, type IssueDraft } from "./issueRecovery";
import { setSharedWordFile } from "./wordFileStore";
import { toast } from "sonner";

export function useIssueDraft(kind: IssueDraft["kind"]) {
  const [state, setState] = useState<{ ready: boolean; draft?: IssueDraft }>({ ready: !recoveryId() });
  useEffect(() => {
    const id = recoveryId();
    if (!id) return;
    let active = true;
    readIssueDraft(id).then((draft) => {
      if (!active) return;
      if (draft?.kind === kind) {
        setSharedWordFile(draft.wordFile);
        setState({ ready: true, draft });
      } else setState({ ready: true });
    }).catch(() => {
      if (!active) return;
      toast.error("לא ניתן לשחזר את העבודה בדפדפן זה. חזרו ללשונית המקורית.");
      setState({ ready: true });
    });
    return () => { active = false; };
  }, [kind]);
  return state;
}
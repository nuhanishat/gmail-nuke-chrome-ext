import { useRef, useState } from "react";
import "./ActionButtonsBlock.css";
import "../ActionButton/ActionButton.css";
import ActionButton from "../ActionButton/ActionButton";
import PreviewPanel from "../PreviewPanel/PreviewPanel";
import CircularProgressBar from "../CircularProgressBar/CircularProgressBar";
import { getAccessToken } from "../../helpers/auth";
import { getProfile, listAllIds, trashIds } from "../../helpers/gmail";

type Mode = "idle" | "preview" | "trashing" | "done" | "cancelled";

const MODE_MESSAGES: Partial<Record<Mode, string>> = {
  trashing: "Keep this popup open while we clean your inbox",
  done: "You can run another query or close popup",
  cancelled: "Cancelled. You can run another query",
};

const PROGRESS_MODES: ReadonlyArray<Mode> = ["trashing", "done", "cancelled"];

interface ActionButtonsBlockProps {
  query: string;
}

export default function ActionButtonsBlock({ query }: ActionButtonsBlockProps) {
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>("idle");

  // GMail API state
  const [status, setStatus] = useState<string>("");
  const [count, setCount] = useState<number | null>(null);

  const [ids, setIds] = useState<string[]>([]);

  const cancelRef = useRef<{ cancel: boolean }>({ cancel: false });

  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const percent =
    progress && progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  const [saveToken, setSaveToken] = useState<string | null>(null);

  async function handlePreview() {
    setStatus("");
    console.log(status);
    setCount(null);
    console.log(count);
    setIds([]);
    console.log(ids);
    if (!query) {
      setStatus("Enter a query to preview");
      setMode("idle");
      setBusy(false);
      console.log(status);
    }
    try {
      console.log("[handlePreview] GOT QUERY, getting token");
      setMode("preview");
      setBusy(true);

      const token = await getAccessToken();
      setSaveToken(token);
      console.log("[handlePreview] GOT token!!");
      // console.log("Test begin");
      await getProfile(token); // logs account + message count
      // const testQ = "in:inbox newer_than:7d"; // change to something you know exists
      // const allIds = await listAllIds(token, testQ);
      // console.log("[smoke] ids length:", ids.length);
      // console.log("Test end");

      console.log(`[handlePreview] Query: ${query}`);
      const profile = getProfile(token);
      console.log(`[handlePreview] ${profile}`);
      const allIds = await listAllIds(token, query);
      setIds(allIds);
      setCount(allIds.length);
      console.log(`[handlePreview] Got ${count} matches!`);
      console.log(allIds);
      if (allIds.length === 0) {
        setStatus("[handlePreview] No matches for this query");
      }
      setBusy(false);
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? e}`);
      setMode("idle");
      setBusy(false);
    }
  }

  async function handleTrash() {
    if (!query) {
      setStatus("Enter a query before trashing.");
      return;
    }
    if (
      !confirm(
        `Are you sure you want to move all matches to Trash?\n\n${query}?`
      )
    )
      return;
    try {
      setStatus("");
      setMode("trashing");
      setBusy(true);
      setProgress({ done: 0, total: 0 });
      cancelRef.current.cancel = false;

      const t = saveToken ?? (await getAccessToken());
      if (!saveToken) setSaveToken(t);

      // Reuse IDs from preview if present, otherwise fetch now
      const all = ids.length ? ids : await listAllIds(t, query);
      setIds(all);
      setCount(all.length);

      if (all.length === 0) {
        setStatus("No matches for this query");
        setMode("preview");
        return;
      }
      console.log("[trash] ids:", all.length);
      // Wrap the progress callback so we can support cancel
      await trashIds(t, all, (done, total) => {
        if (cancelRef.current.cancel) return;
        setProgress({ done, total });
      });
      setProgress({ done: all.length, total: all.length }); // freeze at 100%
      setStatus(`Done. Trashed ${all.length} messages.`);
      setMode("done");
      setBusy(false);
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? e}`);
      setMode("preview");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form-actions-wrap">
      <div className="form-actions">
        <ActionButton
          label="Preview"
          onClick={handlePreview}
          disabled={busy}
          variant="default"
        />
        <ActionButton
          label="Trash"
          onClick={handleTrash}
          disabled={busy}
          variant="danger"
        />
      </div>
      {/* Default (idle): show nothing */}
      {mode === "preview" && saveToken && (
        // Later pass real build query + scrollRootRef
        <div className="scroll-area" ref={scrollRootRef}>
          <PreviewPanel
            token={saveToken}
            ids={ids}
            scrollRootRef={scrollRootRef}
          />
        </div>
      )}
      {PROGRESS_MODES.includes(mode) && (
        <div className="trash-p-bar-wrap">
          <div
            style={{
              padding: 16,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgressBar
              percent={
                percent
                  ? progress?.total
                    ? (progress.done / progress.total) * 100
                    : 0
                  : 0
              }
              label={
                mode === "trashing"
                  ? progress
                    ? `${progress.done}/${progress.total}`
                    : "Starting…"
                  : mode === "done"
                  ? "Completed!"
                  : "Cancelled."
              }
              ariaLabel="Trashing emails"
            />
            <div
              className="trash-msg"
              style={{
                fontSize: 12,
                color: "#6b7280",
                marginTop: 8,
                marginLeft: 8,
              }}
            >
              {MODE_MESSAGES[mode] && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  {MODE_MESSAGES[mode]}
                </div>
              )}
            </div>
          </div>
          <button
            className="actbtn"
            style={{ marginLeft: 12 }}
            onClick={() => {
              cancelRef.current.cancel = true;
              setStatus("Cancelling…");
              setMode("cancelled");
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

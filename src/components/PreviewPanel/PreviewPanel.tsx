import type { EmailPreview } from "../../types";
import { useCallback, useEffect, useMemo, useState } from "react";
import EmailList from "../EmailList/EmailList";
import { getMetaData } from "../../helpers/gmail";

//Fake data generator (replace with real Gmail later)
// function makeFakePreview(idx: number): EmailPreview {
//   return {
//     id: `fake_${idx}`,
//     from: `Sender ${idx} <sender${idx}@example.com>`,
//     to: `me@example.com`,
//     date: new Date(Date.now() - idx * 3600_000).toUTCString(),
//     subject: `Sample subject line #${idx}`,
//   };
// }

// Simulate paginated fetch (pageSize items per page)
// async function fakeFetchPage(
//   page: number,
//   pageSize: number
// ): Promise<{ items: EmailPreview[]; hasMore: boolean }> {
//   await new Promise((r) => setTimeout(r, 500)); // simulate latency
//   const start = page * pageSize;
//   const end = start + pageSize;
//   const total = 60; // pretend there are 60 total matches
//   const slice = Array.from(
//     { length: Math.max(0, Math.min(pageSize, total - start)) },
//     (_, i) => makeFakePreview(start + i + 1)
//   );
//   return { items: slice, hasMore: end < total };
// }

interface PreviewPanelProps {
  // eventually you’ll pass the built query in here to trigger real fetches
  token: string;
  ids: string[];
  scrollRootRef?: React.RefObject<HTMLDivElement | null>;
  pageSize?: number;
}

const PAGE_SIZE = 10;

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  token,
  ids,
  scrollRootRef,
  pageSize = PAGE_SIZE,
}) => {
  const [items, setItems] = useState<EmailPreview[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset when ids changes
  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(ids.length > 0);
  }, [ids]);

  const nextSlice = useMemo(() => {
    const start = page * pageSize;
    const end = Math.min(ids.length, start + pageSize);
    return ids.slice(start, end);
  }, [ids, page, pageSize]);

  const loadPage = useCallback(async () => {
    if (!nextSlice.length) {
      setHasMore(false);
      return;
    }

    setLoading(true);

    try {
      const previews = await Promise.all(
        nextSlice.map((id) => getMetaData(token, id))
      );
      setItems((prev) => [...prev, ...previews]);
      const moreLeft = (page + 1) * pageSize < ids.length;
      setHasMore(moreLeft);
      setPage((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [ids.length, nextSlice, page, pageSize, token]);

  //Auto
  useEffect(() => {
    // Only load if nothing loaded yet
    if (items.length === 0 && !loading && ids.length > 0) {
      void loadPage();
    }
  }, [ids.length, items.length, loading, loadPage]);

  return (
    <div style={{ height: "200px" }}>
      {/* Optional header */}
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
        Showing {ids.length === 0 ? 0 : items.length}
        {ids.length === 0
          ? " results"
          : items.length < ids.length
          ? ` of ${ids.length}`
          : " results"}
      </div>
      {items.length > 0 && (
        <EmailList
          items={items}
          hasMore={hasMore}
          loading={loading}
          onLoadMore={loadPage}
          initialCount={5} // first 5 are “regular preview”; scroll loads more
          rootRef={scrollRootRef}
        />
      )}
      {ids.length === 0 && (
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          No messages matched this query.
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;

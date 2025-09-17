import { useEffect, useRef } from "react";
import type { EmailPreview } from "../../types";
import EmailCard from "../EmailCard/EmailCard";
import "./EmailList.css";

interface EmailListProps {
  items: EmailPreview[]; // renders items
  hasMore: boolean; // asks more when user scrolls down
  loading: boolean; // show skeletons and do not trigger more load
  onLoadMore: () => void; // called when sentinel becomes visible
  initialCount?: number; // minimum items - default is 5
  /** The scrolling container ref. If omitted, defaults to viewport */
  rootRef?: React.RefObject<HTMLDivElement | null>;
}

const EmailList: React.FC<EmailListProps> = ({
  items,
  hasMore,
  loading,
  onLoadMore,
  initialCount = 5,
  rootRef,
}) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null); //inivisible div calls onLoadMore when enters viewport

  //Intersection Observer
  useEffect(() => {
    if (!hasMore) return; // If nothing to load
    const el = sentinelRef.current;
    if (!el) return; // If no sentinel DOM

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { root: rootRef?.current ?? null, rootMargin: "300px", threshold: 0 } // prefetch earlier;
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  const visible = items.slice(0, Math.max(initialCount, items.length));
  return (
    <div>
      {visible.map((it) => (
        <EmailCard key={it.id} item={it} />
      ))}

      {/* Loading skeletons */}
      {loading && (
        <>
          <div className="email-skel"></div>
          <div className="email-skel"></div>
        </>
      )}
      {/* Sentinel triggers onLoadMore when visible */}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </div>
  );
};

export default EmailList;

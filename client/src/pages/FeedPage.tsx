import React, { useContext, useEffect } from "react";
import { isLoggedIn } from "../auth";
import TopBar from "../components/TopBar";
import EntryItem from "../EntryItem";
import { showToast } from "../lib/toast";
import { useKeyboardNav } from "../lib/useKeyboardNavigation";
import usePullToRefresh from "../lib/usePullToRefresh";
import { setAppBadge } from "../lib/utils";
import MobileBottomMenu from "../MobileBottomMenu";
import StateProvider, { StateContext } from "../StateProvider";
import { type Entry } from "../types";

const FeedPage: React.FC = () => {
  return (
    <StateProvider>
      <FeedPageWithState />
    </StateProvider>
  );
};

const FeedPageWithState: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [expandedEntryId, setExpandedEntryId] = React.useState<number | null>(
    null,
  );

  const isLogged = isLoggedIn();

  const {
    state: {
      entries: { data: entries, loading },
    },
    fire,
  } = useContext(StateContext);

  function handleEntrySelect(entry: Entry) {
    fire({ action: "SELECT_ENTRY", id: entry.id });
    // Toggle expanded state - if clicking the same entry, collapse it
    setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id);
  }

  const handleMarkAllRead: React.MouseEventHandler = async () => {
    await fire({ action: "MARK_ALL_READ" });
    showToast("All entries marked as read", "success");
    fire({ action: "LOAD_ENTRIES" });
  };

  //   const handleMarkAsRead = (entryId: number) => {
  //     fire({ action: "MARK_AS_READ_ENTRY", id: entryId });
  //   };

  const handleAllRead: React.MouseEventHandler = async () => {
    if (!window.confirm("Are you sure?")) {
      return;
    }
    await fire({ action: "MARK_ALL_READ" });
    fire({ action: "LOAD_ENTRIES" });
  };

  useEffect(() => {
    if (!isLogged) {
      window.location.href = "/#/login";
    }
  }, [isLogged]);

  useEffect(() => {
    fire({ action: "LOAD_ENTRIES" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  usePullToRefresh(ref, () => {
    fire({ action: "LOAD_ENTRIES" });
  });

  useEffect(() => {
    setAppBadge(entries?.length ?? 0);
  }, [entries?.length]);

  // j/ArrowDown for next, k/ArrowUp for prev
  useKeyboardNav(entries, expandedEntryId, handleEntrySelect);

  return (
    <StateProvider>
      <TopBar
        actions={
          <div className="entries-top-actions">
            {(entries ?? []).length > 0 && (
              <>
                <span>
                  {(entries ?? []).filter((e) => !e.read).length + " unread"}
                </span>
                <button className="icon-button" onClick={handleAllRead}>
                  <i className="fa-solid fa-check" />
                  All Read
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="page-container">
        <main className="feed-page">
          <div className="feed-page-inner" ref={ref}>
            <div className="entries">
              {loading && <div className="loading">Loading...</div>}
              {!loading && (entries ?? []).length === 0 && (
                <div className="no-entries">
                  <i className="fa-solid fa-mug-saucer"></i>
                  All Clear
                </div>
              )}
              {(entries ?? []).map((e) => (
                <EntryItem
                  key={e.id}
                  entry={e}
                  onSelect={handleEntrySelect}
                  isExpanded={expandedEntryId === e.id}
                />
              ))}
            </div>

            {!loading && (entries ?? []).length > 0 && (
              <div className="actions">
                <button onClick={handleMarkAllRead}>✓ Mark All as Read</button>
              </div>
            )}
          </div>
        </main>
        <MobileBottomMenu />
      </div>
    </StateProvider>
  );
};

export default FeedPage;

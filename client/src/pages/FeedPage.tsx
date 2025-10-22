import React, { useContext, useEffect } from "react";
import { isLoggedIn } from "../auth";
import EntryItem from "../EntryItem";
import usePullToRefresh from "../lib/usePullToRefresh";
import { dropHeight, forceNewTab, setAppBadge } from "../lib/utils";
import MobileBottomMenu from "../MobileBottomMenu";
import StateProvider, { StateContext } from "../StateProvider";
import { type Entry } from "../types";
import { showToast } from "../lib/toast";

const FeedPage: React.FC = () => {
  return (
    <StateProvider>
      <FeedPageWithState />
    </StateProvider>
  );
};

const FeedPageWithState: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const root = React.useRef<HTMLDivElement>(null);

  const isLogged = isLoggedIn();

  const {
    state: {
      entries: { data: entries, loading },
      selectedEntry,
    },
    fire,
  } = useContext(StateContext);

  function handleEntrySelect(entry: Entry) {
    fire({ action: "SELECT_ENTRY", id: entry.id });
  }

  const handleCloseEntryDetails: React.MouseEventHandler = () => {
    fire({ action: "UNSELECT_ENTRY" });
  };

  const handleMarkAllRead: React.MouseEventHandler = async () => {
    await fire({ action: "MARK_ALL_READ" });
    showToast("All entries marked as read", "success");
    fire({ action: "LOAD_ENTRIES" });
  };

  const handleMarkAsRead = (entryId: number) => {
    fire({ action: "MARK_AS_READ_ENTRY", id: entryId });
  };

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

  return (
    <StateProvider>
      <nav className="top-bar">
        <div className="logo">
          <img src="/icon512.png" />
          <span>sRSSly</span>
        </div>
        <div className="actions">
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
        </div>
      </nav>
      <main className="feed-page" ref={root}>
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
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>

          {!loading && (entries ?? []).length > 0 && (
            <div className="actions">
              <button onClick={handleMarkAllRead}>✓ Mark All as Read</button>
            </div>
          )}
        </div>
        <div className={`entry-detail ${selectedEntry ? "show" : ""}`}>
          <div className="entry-detail-top">
            <a onClick={handleCloseEntryDetails} className="close">
              [x] Close
            </a>
          </div>
          {selectedEntry && (
            <div className="entry-detail-body">
              <h1 className="entry-detail-title">
                <a
                  href={selectedEntry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {selectedEntry.title}
                </a>
              </h1>
              <div
                className="entry-detail-content"
                dangerouslySetInnerHTML={{
                  __html: forceNewTab(dropHeight(selectedEntry.summary)),
                }}
              />
            </div>
          )}
        </div>
      </main>
      <MobileBottomMenu />
    </StateProvider>
  );
};

export default FeedPage;

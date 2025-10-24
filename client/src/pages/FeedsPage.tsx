import React, { useContext, useEffect } from "react";
import { shorten } from "../lib/utils";
import MobileBottomMenu from "../MobileBottomMenu";
import StateProvider, { StateContext } from "../StateProvider";

const FeedsPage: React.FC = () => {
  return (
    <StateProvider>
      <FeedsPageWithState />
    </StateProvider>
  );
};

const FeedsPageWithState: React.FC = () => {
  const [newFeedUrl, setNewFeedUrl] = React.useState("");

  const {
    state: {
      feeds: { data: feeds, loading },
      addFeedForm: { visible: formVisible, options, adding },
    },
    fire,
  } = useContext(StateContext);

  const handleFeedDel = async (id: number) => {
    if (!confirm("Are you sure you want to delete this feed?")) {
      return;
    }
    fire({ action: "DEL_FEED", id });
  };

  const doAddFeed = async (url: string) => {
    await fire({ action: "ADD_FEED", url });
    setNewFeedUrl("");
  };

  const handleAddFeed = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newFeedUrl === "") {
      return;
    }
    await doAddFeed(newFeedUrl);
  };

  const handleShowAddFeedForm: React.MouseEventHandler = () => {
    fire({ action: "SHOW_ADD_FEED_FORM" });
  };

  useEffect(() => {
    // it's enough to load feeds only once
    // they don't change much often
    if (feeds === null) {
      fire({ action: "LOAD_FEEDS" });
    }
  }, []);

  return (
    <StateProvider>
      <nav className="top-bar">
        <div className="logo">
          <img src="/icon512.png" />
          <span>sRSSly</span>
        </div>
        <div className="actions">
          <div className="entries-top-actions">
            <button
              className="icon-button"
              onClick={handleShowAddFeedForm}
              disabled={formVisible}
            >
              <i className="fa-solid fa-plus" />
            </button>
          </div>
        </div>
      </nav>

      <div className="page-container">
        <main className="feeds-page">
          {formVisible && (
            <div className="add-feed-wrapper">
              {options.length > 0 && (
                <div className="add-feed-options">
                  <div className="add-feed-options">
                    <div className="add-feed-options-header">Which one?</div>
                    {options.map((option) => (
                      <a
                        href="#"
                        className="add-feed-option"
                        key={option.url}
                        onClick={(e) => {
                          e.preventDefault();
                          doAddFeed(option.url);
                        }}
                      >
                        {option.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {options.length === 0 && (
                <form className="add-feed-form" onSubmit={handleAddFeed}>
                  <div className="form-item">
                    <input
                      type="text"
                      placeholder="Feed URL"
                      value={newFeedUrl}
                      onChange={(e) => setNewFeedUrl(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="form-item">
                    <button type="submit" disabled={!newFeedUrl || adding}>
                      {adding ? "..." : "Add feed"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="feed-list">
            {(feeds ?? []).map((feed) => {
              return (
                <div className="feed-item" key={feed.id}>
                  {feed.icon_url && (
                    <div className="feed-item-icon">
                      <img
                        src={feed.icon_url}
                        alt={`Icon for feed ${feed.title}`}
                      />
                    </div>
                  )}
                  <div className="feed-item-title">
                    {shorten(feed.title, 42)}
                  </div>
                  <div className="feed-item-delete">
                    <i
                      className="fas fa-close"
                      role="button"
                      onClick={() => handleFeedDel(feed.id)}
                    ></i>
                  </div>
                </div>
              );
            })}

            {!loading && (feeds ?? []).length === 0 && (
              <div className="no-feeds">No feeds found</div>
            )}
          </div>
        </main>
        <MobileBottomMenu />
      </div>
    </StateProvider>
  );
};

export default FeedsPage;

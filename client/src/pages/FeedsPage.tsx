import React, { useContext, useEffect } from "react";
import { shorten } from "../lib/utils";
import MobileBottomMenu from "../MobileBottomMenu";
import StateProvider, { StateContext } from "../StateProvider";
import TopBar from "../components/TopBar";
import NewFeedForm from "../components/NewFeedForm";

const FeedsPage: React.FC = () => {
  return (
    <StateProvider>
      <FeedsPageWithState />
    </StateProvider>
  );
};

const FeedsPageWithState: React.FC = () => {
  const {
    state: {
      feeds: { data: feeds, loading },
      addFeedForm: { visible: formVisible },
    },
    fire,
  } = useContext(StateContext);

  const handleFeedDel = async (id: number) => {
    if (!confirm("Are you sure you want to delete this feed?")) {
      return;
    }
    fire({ action: "DEL_FEED", id });
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
      <TopBar
        actions={
          <div className="entries-top-actions">
            <button
              className="icon-button"
              onClick={handleShowAddFeedForm}
              disabled={formVisible}
            >
              <i className="fa-solid fa-plus" />
            </button>
          </div>
        }
      />
      <div className="page-container">
        <main className="feeds-page">
          {formVisible && <NewFeedForm />}

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

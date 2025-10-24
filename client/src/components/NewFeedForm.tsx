import { useContext, useState } from "react";
import { StateContext } from "../StateProvider";

const NewFeedForm = () => {
  const [newFeedUrl, setNewFeedUrl] = useState("");

  const {
    state: {
      addFeedForm: { options, adding },
    },
    fire,
  } = useContext(StateContext);

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

  return (
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
  );
};

export default NewFeedForm;

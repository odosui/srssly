import { useRef } from "react";
import { dropHeight, dropTags, forceNewTab, shorten, toAgo } from "./lib/utils";
import { type Entry } from "./types";

const EntryItem: React.FC<{
  entry: Entry;
  onSelect: (e: Entry) => void;
  isExpanded: boolean;
}> = ({ entry, onSelect, isExpanded }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    onSelect(entry);
  };

  return (
    <div
      className={`entry ${entry.read ? "read" : ""} ${isExpanded ? "expanded" : ""}`}
    >
      <div className="entry-info" ref={ref} onClick={handleClick}>
        {entry.feed.icon_url && (
          <img className="entry-img" src={entry.feed.icon_url} />
        )}
        <span className="entry-title">{entry.title}</span>
        <span className="entry-summary">
          {shorten(dropTags(entry.summary))}
        </span>
        <span className="entry-date"> · {toAgo(entry.published)}</span>
        <span className="entry-feed"> · {entry.feed.title}</span>
      </div>

      {isExpanded && (
        <div className="entry-detail-inline">
          <h1 className="entry-detail-title">
            <a href={entry.url} target="_blank" rel="noopener noreferrer">
              {entry.title}
            </a>
          </h1>
          <div
            className="entry-detail-content"
            dangerouslySetInnerHTML={{
              __html: forceNewTab(dropHeight(entry.summary)),
            }}
          />

          <div className="entry-detail-actions">
            <a href={entry.url} target="_blank" rel="noopener noreferrer">
              Read more...
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryItem;

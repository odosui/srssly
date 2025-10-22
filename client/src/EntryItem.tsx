import { useRef, useState } from "react";
import { buildGradFn, dropTags, shorten, toAgo } from "./lib/utils";
import { type Entry } from "./types";

const ACTIVATE_THRESHOLD = -70;
const gradFn = buildGradFn(100, 70);

const EntryItem: React.FC<{
  entry: Entry;
  onSelect: (e: Entry) => void;
  onMarkAsRead: (entryId: number) => void;
}> = ({ entry, onSelect, onMarkAsRead }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [initialX, setInitialX] = useState<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [markedRead, setMarkedRead] = useState(false);

  const handleTouchStart: React.TouchEventHandler = (e) => {
    if (entry.read) {
      return;
    }
    const touch = e.touches[0];
    setInitialX(touch.clientX);
  };

  const handleTouchMove: React.TouchEventHandler = (moveEvent) => {
    const entryEl = ref.current;
    if (!entryEl || initialX === null) return;
    const touch = moveEvent.touches[0];
    const diffX = touch.clientX - initialX;

    if (diffX < -10) {
      setOffsetX(diffX);
      if (diffX < ACTIVATE_THRESHOLD && !markedRead) {
        setMarkedRead(true);
      }
    }
  };

  const handleTouchEnd: React.TouchEventHandler = () => {
    const entryEl = ref.current;
    if (!entryEl || initialX === null) return;
    entryEl.style.transition = `transform 0.2s ease-in-out`;
    setOffsetX(0);
    setInitialX(null);
    if (markedRead) {
      onMarkAsRead(entry.id);
      setMarkedRead(false);
    }
  };

  const handleTransitionEnd: React.TransitionEventHandler = () => {
    const entryEl = ref.current;
    if (!entryEl) return;
    entryEl.style.transition = "";
  };

  return (
    <div
      className={`entry ${entry.read ? "read" : ""}`}
      onClick={() => onSelect(entry)}
    >
      <div
        className="entry-info"
        ref={ref}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTransitionEnd={handleTransitionEnd}
        style={{ transform: `translateX(${gradFn(offsetX)}px)` }}
      >
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

      <div
        className={`mark-read-activator ${
          offsetX < ACTIVATE_THRESHOLD ? "activated" : ""
        }`}
      >
        <div className="icon-wrapper">
          <i className="fa-solid fa-check"></i>
        </div>
        <div className="text">read</div>
      </div>
    </div>
  );
};

export default EntryItem;

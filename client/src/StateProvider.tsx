import { createContext, type FC, useState } from "react";
import Api from "./api";
import { showToast } from "./lib/toast";
import { type Entry, type Feed } from "./types";

type Loadable<T> = {
  loading: boolean;
  data: null | T;
  error: null | string;
};

type State = {
  entries: Loadable<Entry[]>;
  selectedEntry: Entry | null;
  feeds: Loadable<Feed[]>;
  addFeedForm: {
    visible: boolean;
    options: { title: string; url: string }[];
    adding: boolean;
  };
};

type FireArg =
  | { action: "SHOW_ADD_FEED_FORM" }
  | { action: "LOAD_FEEDS" }
  | { action: "DEL_FEED"; id: number }
  | { action: "ADD_FEED"; url: string }
  | { action: "SELECT_ENTRY"; id: number }
  | { action: "MARK_AS_READ_ENTRY"; id: number }
  | { action: "UNSELECT_ENTRY" }
  | { action: "MARK_ALL_READ" }
  | { action: "LOAD_ENTRIES" };

type fireFn = (a: FireArg) => Promise<void>;

const initialState: State = {
  entries: initial(),
  feeds: initial(),
  selectedEntry: null,
  addFeedForm: {
    visible: false,
    options: [],
    adding: false,
  },
};

export const StateContext = createContext<{ state: State; fire: fireFn }>({
  state: initialState,
  fire: async () => {},
});

const StateProvider: FC<{ children: any }> = ({ children }) => {
  const [state, _setState] = useState(initialState);

  const setState = (newState: State) => {
    // console.log("setState", newState);
    _setState(newState);
  };

  const fire: fireFn = async (a) => {
    if (a.action === "LOAD_FEEDS") {
      setState({
        ...state,
        feeds: loading(),
      });

      const res = await Api.get<Feed[]>("/feeds");

      if (!res.data) {
        showToast(res.error, "error");
        setState({
          ...state,
          feeds: error(res.error),
        });
        return;
      }

      setState({
        ...state,
        feeds: success(res.data),
      });
    } else if (a.action === "DEL_FEED") {
      const res = await Api.del<{ success: boolean }>(`/feeds/${a.id}`);
      if (!res.data) {
        showToast(res.error, "error");
        // handle error?
        return;
      }

      showToast("Feed has been removed", "success");
      const newFeeds = (state.feeds.data ?? []).filter(
        (feed) => feed.id !== a.id,
      );

      setState({
        ...state,
        feeds: success(newFeeds),
      });
    } else if (a.action === "ADD_FEED") {
      setState({
        ...state,
        addFeedForm: {
          ...state.addFeedForm,
          adding: true,
        },
      });

      const res = await Api.post<
        Feed | { options: { title: string; url: string }[] }
      >("/feeds", {
        url: a.url,
      });

      setState({
        ...state,
        addFeedForm: {
          ...state.addFeedForm,
          adding: false,
        },
      });

      if (!res.data) {
        showToast(res.error, "error");
        return;
      }

      if ("options" in res.data) {
        setState({
          ...state,
          addFeedForm: {
            ...state.addFeedForm,
            options: res.data.options,
          },
        });
        return;
      } else {
        setState({
          ...state,
          addFeedForm: {
            ...state.addFeedForm,
            visible: false,
            options: [],
            adding: false,
          },
          feeds: {
            ...state.feeds,
            data: [res.data, ...(state.feeds.data ?? [])],
          },
        });
      }

      // state not updated?
    } else if (a.action === "SHOW_ADD_FEED_FORM") {
      setState({
        ...state,
        addFeedForm: {
          ...state.addFeedForm,
          visible: true,
        },
      });
    } else if (a.action === "LOAD_ENTRIES") {
      setState({
        ...state,
        entries: loading(),
      });

      const res = await Api.get<Entry[]>("/entries");

      if (!res.data) {
        showToast(res.error, "error");
        setState({
          ...state,
          entries: error(res.error),
        });
        return;
      }

      setState({
        ...state,
        entries: success(res.data),
      });
    } else if (a.action === "SELECT_ENTRY") {
      const entry = state.entries.data?.find((e) => e.id === a.id);

      if (!entry) {
        throw new Error("Entry not found");
      }

      // mark the entry as read
      Api.post(`/entries/${entry.id}/read`);

      setState({
        ...state,
        selectedEntry: entry,
        entries: {
          ...state.entries,
          data: (state.entries.data ?? []).map((e) => {
            if (e.id === entry.id) {
              return { ...e, read: true };
            }
            return e;
          }),
        },
      });
    } else if (a.action === "MARK_AS_READ_ENTRY") {
      const entry = state.entries.data?.find((e) => e.id === a.id);

      if (!entry) {
        throw new Error("Entry not found");
      }

      // mark the entry as read
      Api.post(`/entries/${entry.id}/read`);

      setState({
        ...state,
        entries: {
          ...state.entries,
          data: (state.entries.data ?? []).map((e) => {
            if (e.id === entry.id) {
              return { ...e, read: true };
            }
            return e;
          }),
        },
      });
    } else if (a.action === "UNSELECT_ENTRY") {
      setState({
        ...state,
        selectedEntry: null,
      });
    } else if (a.action === "MARK_ALL_READ") {
      const ids = (state.entries.data ?? []).map((e) => e.id).join(",");
      await Api.post(`/entries/read_all`, { ids: ids });

      setState({
        ...state,
        entries: {
          ...state.entries,
          data: [],
        },
      });
    } else {
      throw new Error("Unknown action");
    }
  };

  return (
    <StateContext.Provider value={{ state, fire }}>
      {children}
    </StateContext.Provider>
  );
};

export default StateProvider;

// helpers for loadable
function initial<T>(): Loadable<T> {
  return {
    loading: false,
    data: null,
    error: null,
  };
}

function loading<T>(): Loadable<T> {
  return {
    loading: true,
    data: null,
    error: null,
  };
}

function error<T>(error: string): Loadable<T> {
  return {
    loading: false,
    data: null,
    error,
  };
}

function success<T>(data: T): Loadable<T> {
  return {
    loading: false,
    data,
    error: null,
  };
}

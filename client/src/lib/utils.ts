export function dropHeight(html: string) {
  return (html ?? "").replace(/height="\d+"/g, "");
}

export function forceNewTab(html: string) {
  return (html ?? "").replace(
    /<a /g,
    '<a target="_blank" rel="noopener noreferrer" '
  );
}

export function dropTags(html: string) {
  return (html ?? "").replace(/<[^>]*>?/gm, "");
}

export function shorten(body: string | null, length = 64) {
  if (!body) {
    return "";
  }

  if (body.length > length) {
    return body.substring(0, length) + "...";
  }

  return body;
}

export function toAgo(published: string) {
  const date = new Date(published);
  const diff = new Date().getTime() - date.getTime();
  const seconds = diff / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const months = days / 30;
  const years = months / 12;
  if (years > 1) return Math.floor(years) + " years ago";
  if (months > 1) return Math.floor(months) + " months ago";
  if (days > 1) return Math.floor(days) + " days ago";
  if (hours > 1) return Math.floor(hours) + " hours ago";
  if (minutes > 1) return Math.floor(minutes) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

export function buildGradFn(max: number, growthRate: number) {
  return (x: number) => {
    let isNegative = x < 0;
    const arg = Math.abs(x);
    let limitedGrowth = max * (1 - Math.exp(-arg / growthRate));
    const res = Math.min(arg, limitedGrowth);
    return isNegative ? -res : res;
  };
}

export function setAppBadge(num: number) {
  const nav = window.navigator as any;
  if (nav.setAppBadge) {
    num > 0 ? nav.setAppBadge(num) : nav.clearAppBadge();
  }
}

export function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

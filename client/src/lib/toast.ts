export function showToast(
  message: string,
  kind: "success" | "error",
  duration = 3000
) {
  if (!message || !["success", "error"].includes(kind)) {
    throw new Error("Invalid toast options");
  }
  const toast = document.createElement("div");
  toast.classList.add("toast");
  toast.classList.add(`toast-${kind}`);
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.textContent = message;

  const container = document.body;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-show");
  }, 100);

  const removeToast = () => {
    toast.classList.remove("toast-show");
    toast.classList.add("toast-hide");
    setTimeout(() => {
      toast.remove();
    }, 300);
  };

  setTimeout(removeToast, duration);
}

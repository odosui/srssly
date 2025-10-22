import { useEffect } from "react";

const SHOW_INDICATOR_THRESHOLD = 50;
const TRIGGER_THRESHOLD = 100;

function usePullToRefresh(
  ref: React.RefObject<HTMLDivElement | null>,
  onTrigger: () => void,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // attach the event listener
    el.addEventListener("touchstart", handleTouchStart);

    function handleTouchStart(startEvent: TouchEvent) {
      const el = ref.current;
      if (!el) return;

      // get the initial Y position
      const initialY = startEvent.touches[0].clientY;

      el.addEventListener("touchmove", handleTouchMove);
      el.addEventListener("touchend", handleTouchEnd);

      function handleTouchMove(moveEvent: TouchEvent) {
        const el = ref.current;
        if (!el) return;

        // get the current Y position
        const currentY = moveEvent.touches[0].clientY;

        // get the difference
        const dy = currentY - initialY;

        // we don't want to go beyond the top of the element
        if (dy < 0) return;

        // update the element's transform
        el.style.transform = `translateY(${appr(dy)}px)`;

        const parentEl = el.parentNode as HTMLDivElement;
        if (dy > TRIGGER_THRESHOLD) {
          flipArrow(parentEl);
        } else if (dy > SHOW_INDICATOR_THRESHOLD) {
          addPullIndicator(parentEl);
        } else {
          removePullIndicator(parentEl);
        }
      }

      function handleTouchEnd(endEvent: TouchEvent) {
        const el = ref.current;
        if (!el) return;

        // return the element to its initial position
        el.style.transform = "translateY(0)";
        removePullIndicator(el.parentNode as HTMLDivElement);

        // add transition
        el.style.transition = "transform 0.2s";

        const dy = endEvent.changedTouches[0].clientY - initialY;
        if (dy > TRIGGER_THRESHOLD) {
          onTrigger();
        }

        // listen for transition end event
        el.addEventListener("transitionend", onTransitionEnd);

        // cleanup
        el.removeEventListener("touchmove", handleTouchMove);
        el.removeEventListener("touchend", handleTouchEnd);
      }

      function onTransitionEnd() {
        const el = ref.current;
        if (!el) return;

        // remove transition
        el.style.transition = "";

        // cleanup
        el.removeEventListener("transitionend", onTransitionEnd);
      }
    }

    return () => {
      // let's not forget to cleanup
      el.removeEventListener("touchstart", handleTouchStart);
    };
  }, [ref.current]);
}

// def f(x):
//     res = m * (1 - math.exp(-k * x / m))
//     return min(res, x)

const MAX = 128;
const k = 0.4;
function appr(x: number) {
  return MAX * (1 - Math.exp((-k * x) / MAX));
}

export default usePullToRefresh;

function addPullIndicator(el: HTMLDivElement) {
  const indicator = el.querySelector(".pull-indicator");
  if (indicator) {
    // already added

    // make sure the arrow is not flipped
    if (indicator.classList.contains("flip")) {
      indicator.classList.remove("flip");
    }
    return;
  }

  const pullIndicator = document.createElement("div");
  pullIndicator.className = "pull-indicator";
  pullIndicator.innerHTML = "<i class='fa-solid fa-arrow-down'></i>";
  el.appendChild(pullIndicator);
}

function removePullIndicator(el: HTMLDivElement) {
  const pullIndicator = el.querySelector(".pull-indicator");
  if (pullIndicator) {
    pullIndicator.remove();
  }
}

function flipArrow(el: HTMLDivElement) {
  const pullIndicator = el.querySelector(".pull-indicator");
  if (pullIndicator && !pullIndicator.classList.contains("flip")) {
    pullIndicator.classList.add("flip");
  }
}

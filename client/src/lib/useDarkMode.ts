import {useEffect, useState} from "react";

export default function useDarkMode() {
  const [ colorScheme, setColorScheme ] = useState<"light" | "dark">("light");

  useEffect(() => {
    setColorScheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light");

    const onColorSchemeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setColorScheme("dark");
      } else {
        setColorScheme("light");
      }
    }

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', onColorSchemeChange);

    return () => {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .removeEventListener('change', onColorSchemeChange);
    }

  }, [])

  return colorScheme;
}

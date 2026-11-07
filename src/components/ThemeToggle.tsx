import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const handleSetTheme = (newTheme: string) => {
    setTheme(newTheme);
    if (typeof document !== 'undefined') {
      const isDark =
        newTheme === 'dark' ||
        (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  };

  const currentLabel = theme === 'light' ? 'LIGHT' : theme === 'dark' ? 'DARK' : 'AUTO';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-7 px-2 border border-border hover:border-primary/50 text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors focus:outline-none flex items-center gap-1.5"
          aria-label="Toggle display theme"
        >
          <span className="text-primary text-[10px]">●</span>
          <span>THEME:{currentLabel}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32 rounded-none border border-border bg-card p-1 font-mono text-xs shadow-none">
        <DropdownMenuItem
          onClick={() => handleSetTheme("dark")}
          className="flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-none hover:bg-secondary focus:bg-secondary focus:text-primary"
        >
          <span>[*] DARK</span>
          {theme === 'dark' && <span className="text-primary text-[10px]">✔</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSetTheme("light")}
          className="flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-none hover:bg-secondary focus:bg-secondary focus:text-primary"
        >
          <span>[o] LIGHT</span>
          {theme === 'light' && <span className="text-primary text-[10px]">✔</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSetTheme("system")}
          className="flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-none hover:bg-secondary focus:bg-secondary focus:text-primary"
        >
          <span>[-] AUTO</span>
          {theme === 'system' && <span className="text-primary text-[10px]">✔</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

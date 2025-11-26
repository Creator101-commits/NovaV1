import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Color theme types
export type BackgroundTheme = "black" | "white" | "blue" | "green" | "purple" | "orange" | "pink" | "gray";

export interface ColorCustomization {
  backgroundTheme: BackgroundTheme;
  customBackgroundColor?: string;
}

interface ColorCustomizationContextType {
  customization: ColorCustomization;
  updateCustomization: (updates: Partial<ColorCustomization>) => void;
  resetToDefault: () => void;
  applyCustomization: () => void;
}

const ColorCustomizationContext = createContext<ColorCustomizationContextType | undefined>(undefined);

export const useColorCustomization = () => {
  const context = useContext(ColorCustomizationContext);
  if (context === undefined) {
    throw new Error("useColorCustomization must be used within a ColorCustomizationProvider");
  }
  return context;
};

interface ColorCustomizationProviderProps {
  children: ReactNode;
}

// Default color customization
const DEFAULT_CUSTOMIZATION: ColorCustomization = {
  backgroundTheme: "black",
};

// Color palette definitions - improved contrast and neutral cards
export const BACKGROUND_THEMES = {
  black: {
    name: "Dark",
    background: "#191919",
    foreground: "#ffffff",
    muted: "#222222",
    mutedForeground: "#ffffff",
    border: "#2a2a2a",
    card: "#191919",
    cardForeground: "#ffffff",
    popover: "#191919",
    popoverForeground: "#ffffff",
  },
  white: {
    name: "Light",
    background: "#ffffff",
    foreground: "#0a0a0a",
    muted: "#f5f5f5",
    mutedForeground: "#737373",
    border: "#e5e5e5",
    card: "#ffffff",
    cardForeground: "#0a0a0a",
    popover: "#ffffff",
    popoverForeground: "#0a0a0a",
  },
  blue: {
    name: "Ocean Blue",
    background: "#0f172a",
    foreground: "#f8fafc",
    muted: "#1e293b",
    mutedForeground: "#cbd5e1",
    border: "#334155",
    card: "#1e293b",
    cardForeground: "#f8fafc",
    popover: "#1e293b",
    popoverForeground: "#f8fafc",
  },
  green: {
    name: "Forest Green",
    background: "#0f1b0f",
    foreground: "#f0fdf4",
    muted: "#1a2e1a",
    mutedForeground: "#bbf7d0",
    border: "#365f32",
    card: "#1a2e1a",
    cardForeground: "#f0fdf4",
    popover: "#1a2e1a",
    popoverForeground: "#f0fdf4",
  },
  purple: {
    name: "Royal Purple",
    background: "#1a0d1a",
    foreground: "#faf5ff",
    muted: "#2d1b2d",
    mutedForeground: "#d8b4fe",
    border: "#581c87",
    card: "#2d1b2d",
    cardForeground: "#faf5ff",
    popover: "#2d1b2d",
    popoverForeground: "#faf5ff",
  },
  orange: {
    name: "Sunset Orange",
    background: "#1c0f0a",
    foreground: "#fff7ed",
    muted: "#2d1b0a",
    mutedForeground: "#fed7aa",
    border: "#ea580c",
    card: "#2d1b0a",
    cardForeground: "#fff7ed",
    popover: "#2d1b0a",
    popoverForeground: "#fff7ed",
  },
  pink: {
    name: "Rose Pink",
    background: "#1a0f14",
    foreground: "#fdf2f8",
    muted: "#2d1b21",
    mutedForeground: "#f9a8d4",
    border: "#be185d",
    card: "#2d1b21",
    cardForeground: "#fdf2f8",
    popover: "#2d1b21",
    popoverForeground: "#fdf2f8",
  },
  gray: {
    name: "Steel Gray",
    background: "#191919",
    foreground: "#ffffff",
    muted: "#222222",
    mutedForeground: "#ffffff",
    border: "#333333",
    card: "#222222",
    cardForeground: "#ffffff",
    popover: "#222222",
    popoverForeground: "#ffffff",
  },
};


export const ColorCustomizationProvider = ({ children }: ColorCustomizationProviderProps) => {
  const [customization, setCustomization] = useState<ColorCustomization>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("colorCustomization");
      if (saved) {
        try {
          return { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(saved) };
        } catch (error) {
          console.warn("Failed to parse saved color customization:", error);
        }
      }
    }
    return DEFAULT_CUSTOMIZATION;
  });

  // Save to localStorage whenever customization changes
  useEffect(() => {
    localStorage.setItem("colorCustomization", JSON.stringify(customization));
    applyCustomization();
  }, [customization]);

  const updateCustomization = (updates: Partial<ColorCustomization>) => {
    setCustomization(prev => ({ ...prev, ...updates }));
  };

  const resetToDefault = () => {
    setCustomization(DEFAULT_CUSTOMIZATION);
  };

  const applyCustomization = () => {
    const root = document.documentElement;
    
    // Apply background theme
    const backgroundTheme = BACKGROUND_THEMES[customization.backgroundTheme];
    
    // Set CSS custom properties for background theme only
    root.style.setProperty("--background", backgroundTheme.background);
    root.style.setProperty("--foreground", backgroundTheme.foreground);
    root.style.setProperty("--muted", backgroundTheme.muted);
    root.style.setProperty("--muted-foreground", backgroundTheme.mutedForeground);
    root.style.setProperty("--border", backgroundTheme.border);
    root.style.setProperty("--card", backgroundTheme.card);
    root.style.setProperty("--card-foreground", backgroundTheme.cardForeground);
    root.style.setProperty("--popover", backgroundTheme.popover);
    root.style.setProperty("--popover-foreground", backgroundTheme.popoverForeground);
    
    // Apply custom background color if provided
    if (customization.customBackgroundColor) {
      root.style.setProperty("--background", customization.customBackgroundColor);
    }
  };

  return (
    <ColorCustomizationContext.Provider value={{
      customization,
      updateCustomization,
      resetToDefault,
      applyCustomization,
    }}>
      {children}
    </ColorCustomizationContext.Provider>
  );
};

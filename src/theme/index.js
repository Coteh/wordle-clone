// Regex pattern for parsing RGB/RGBA colors (supports decimal values)
const RGB_REGEX = /rgba?\((\d*\.?\d+),\s*(\d*\.?\d+),\s*(\d*\.?\d+)(?:,\s*([\d.]+))?\)/;

/**
 * ThemeManager facilitates the switching of the game's theme,
 * theme color calculations, and meta tag updates
 */
class ThemeManager {
    /**
     * Retrieve ThemeManager singleton instance. A new one is created if it hasn't been already.
     * @returns {ThemeManager} ThemeManager singleton instance
     */
    static getInstance() {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }

    /**
     * Initializes ThemeManager
     */
    constructor() {
        this.selectedTheme = DARK_MODE;
        this.selectableThemesMap = {
            [SNOW_THEME]: new SnowTheme(),
        };
    }

    /**
     * Get the currently selected theme
     */
    getSelectedTheme() {
        return this.selectedTheme;
    }

    /**
     * Set the themes to be selectable by this theme manager
     * @param {string[]} selectableThemes - Theme names that are selectable by this theme manager
     */
    setSelectableThemes(selectableThemes) {
        this.selectableThemes = selectableThemes;
    }

    /**
     * Get the background color for a given theme
     * @param {string} theme - Theme name (dark, light, snow, fuji)
     * @returns {string} RGB color string
     */
    getThemeColor(theme) {
        return this.getThemeColorFromCSS(theme);
    }

    /**
     * Get the dimmed (blended with overlay) color for a given theme
     * @param {string} theme - Theme name (dark, light, snow, fuji)
     * @returns {string} RGB color string
     */
    getDimmedThemeColor(theme) {
        const themeColor = this.getThemeColor(theme);
        const overlay = this.getOverlayColorAndAlpha();
        return this.blendColors(overlay.color, themeColor, overlay.alpha);
    }

    /**
     * Switch themes
     * @param {string} theme - Theme name to switch to (dark, light, snow, fuji)
     */
    switchTheme(theme) {
        if (!theme || !this.selectableThemes.includes(theme)) {
            theme = DARK_MODE;
        }
        document.body.classList.remove(this.selectedTheme);
        if (theme !== DARK_MODE) {
            document.body.classList.add(theme);
        }
        if (this.selectableThemesMap[this.selectedTheme]) {
            this.selectableThemesMap[this.selectedTheme].teardown();
        }
        if (this.selectableThemesMap[theme]) {
            this.selectableThemesMap[theme].apply();
        }
        this.selectedTheme = theme;

        // Check if a dialog is currently open
        const dialog = document.querySelector(".dialog");
        const overlayBack = document.querySelector(".overlay-back");
        const isDialogOpen = dialog && overlayBack && overlayBack.style.display !== "none";

        // Apply dimmed or normal theme color based on dialog state
        if (isDialogOpen) {
            this.applyDimmedThemeColor();
        } else {
            this.applyNormalThemeColor();
        }
    }

    /**
     * Apply normal theme color (not dimmed)
     */
    applyNormalThemeColor() {
        const color = this.getThemeColor(this.selectedTheme);
        this.updateThemeColor(color);
    }

    /**
     * Apply dimmed theme color (blended with overlay)
     */
    applyDimmedThemeColor() {
        const color = this.getDimmedThemeColor(this.selectedTheme);
        this.updateThemeColor(color);
    }

    /**
     * Update the meta theme-color tag and body background-color
     * @param {string} color - Color in rgb format
     */
    updateThemeColor(color) {
        const hexColor = this.rgbToHex(color);
        const metaTag = document.querySelector("meta[name='theme-color']");
        if (metaTag) {
            metaTag.content = hexColor;
        }
        // Set body background color for iOS 26+ compatibility (which no longer respects theme-color meta tag)
        document.body.style.backgroundColor = hexColor;
    }

    /**
     * Get the background color for a given theme from CSS variables
     * @param {string} theme - Theme name (dark, light, snow, fuji)
     * @returns {string} RGB color string
     */
    getThemeColorFromCSS(theme) {
        // Fallback colors if DOM access fails
        const fallbackColors = {
            [DARK_MODE]: "rgb(0, 0, 0)",
            [LIGHT_MODE]: "rgb(255, 255, 255)",
            [SNOW_THEME]: "rgb(2, 0, 36)",
            [FUJI_THEME]: "rgb(168, 207, 233)"
        };
        
        // Check if document.body exists
        if (!document.body) {
            return fallbackColors[theme] || fallbackColors.dark;
        }
        
        // Create a temporary element with the theme class to read CSS variables
        const tempElem = document.createElement("div");
        tempElem.style.display = "none";
        
        // Every theme but dark is scoped to a class of the same name, dark uses :root variables
        if (theme !== DARK_MODE) {
            tempElem.className = theme;
        }
        
        try {
            document.body.appendChild(tempElem);
            const computedStyle = window.getComputedStyle(tempElem);
            
            // Resolve a CSS variable to an rgb string, or to an empty string if the variable
            // doesn't hold a plain color. Themes that paint their background with gradients
            // fall into the latter case, and declare a solid fallback color to use instead.
            const resolveColor = (value) => {
                if (!value) return "";
                if (value.startsWith("rgb")) return value;
                // Assigning an invalid value leaves the previous one in place, so clear it first
                tempElem.style.backgroundColor = "";
                tempElem.style.backgroundColor = value;
                const resolved = window.getComputedStyle(tempElem).backgroundColor;
                return resolved !== "rgba(0, 0, 0, 0)" ? resolved : "";
            };
            
            const bgColor =
                resolveColor(computedStyle.getPropertyValue("--background-color").trim()) ||
                resolveColor(computedStyle.getPropertyValue("--fallback-background-color").trim());
            
            // Return the color if valid, otherwise fallback
            if (bgColor) {
                return bgColor;
            }
        } finally {
            // Ensure cleanup even if an error occurs
            if (tempElem.parentNode) {
                document.body.removeChild(tempElem);
            }
        }
        
        // Fallback to hardcoded values if CSS variables not available
        return fallbackColors[theme] || fallbackColors.dark;
    }

    /**
     * Blend two colors together based on alpha transparency
     * @param {string} topColor - The top color in rgb/rgba format
     * @param {string} bottomColor - The bottom color in rgb/rgba format
     * @param {number} alphaTop - The alpha value of the top color (0-1)
     * @returns {string} The blended color in rgb format
     */
    blendColors(topColor, bottomColor, alphaTop) {
        // Extract RGB components from the top and bottom colors
        const topMatch = topColor.match(/\d+/g);
        const bottomMatch = bottomColor.match(/\d+/g);
        
        if (!topMatch || !bottomMatch) {
            console.warn("Invalid color format in blendColors:", topColor, bottomColor);
            return bottomColor; // Return bottom color as fallback
        }
        
        const top = topMatch.map(Number);
        const bottom = bottomMatch.map(Number);
        
        // Calculate the resulting RGB values
        const r = Math.round(alphaTop * top[0] + (1 - alphaTop) * bottom[0]);
        const g = Math.round(alphaTop * top[1] + (1 - alphaTop) * bottom[1]);
        const b = Math.round(alphaTop * top[2] + (1 - alphaTop) * bottom[2]);

        // Return the combined color in the RGB format
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Convert rgb color string to hex format
     * @param {string} rgb - Color in rgb format (e.g., "rgb(0, 0, 0)")
     * @returns {string} Color in hex format (e.g., "#000000")
     */
    rgbToHex(rgb) {
        const match = rgb.match(/\d+/g);
        if (!match || match.length < 3) {
            console.warn("Invalid rgb format in rgbToHex:", rgb);
            return "#000000"; // Return black as fallback
        }
        
        const values = match.map(Number);
        const r = values[0].toString(16).padStart(2, '0');
        const g = values[1].toString(16).padStart(2, '0');
        const b = values[2].toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    /**
     * Get the overlay color and alpha from the overlay element
     * @returns {{color: string, alpha: number}} Overlay color and alpha value
     */
    getOverlayColorAndAlpha() {
        const overlayElem = document.querySelector(".overlay-back");
        if (overlayElem) {
            const computedStyle = window.getComputedStyle(overlayElem);
            const bgColor = computedStyle.backgroundColor;
            
            // Parse rgba to get alpha - handles both integer and decimal RGB values
            const match = bgColor.match(RGB_REGEX);
            if (match) {
                const r = Math.round(parseFloat(match[1]));
                const g = Math.round(parseFloat(match[2]));
                const b = Math.round(parseFloat(match[3]));
                const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
                return {
                    color: `rgba(${r}, ${g}, ${b}, ${a})`,
                    alpha: a
                };
            }
        }
        
        // Fallback to hardcoded values if element not found
        return {
            color: "rgba(0, 0, 0, 0.5)",
            alpha: 0.5
        };
    }
}

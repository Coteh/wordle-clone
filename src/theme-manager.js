/**
 * Theme Manager
 * Handles theme color calculations and meta tag updates
 */

/**
 * Get the overlay color and alpha from the overlay element
 * @returns {{color: string, alpha: number}} Overlay color and alpha value
 */
function getOverlayColorAndAlpha() {
    const overlayElem = document.querySelector(".overlay-back");
    if (overlayElem) {
        const computedStyle = window.getComputedStyle(overlayElem);
        const bgColor = computedStyle.backgroundColor;
        
        // Parse rgba to get alpha
        const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            const r = match[1];
            const g = match[2];
            const b = match[3];
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

/**
 * Get the background color for a given theme from CSS variables
 * @param {string} theme - Theme name (dark, light, snow)
 * @returns {string} RGB color string
 */
function getThemeColorFromCSS(theme) {
    // Create a temporary element with the theme class to read CSS variables
    const tempElem = document.createElement("div");
    tempElem.style.display = "none";
    
    if (theme === "light") {
        tempElem.className = "light";
    } else if (theme === "snow") {
        tempElem.className = "snow";
    }
    // dark theme uses :root variables (no class needed)
    
    document.body.appendChild(tempElem);
    const computedStyle = window.getComputedStyle(tempElem);
    
    // Get the background color from CSS variable
    let bgColor = computedStyle.getPropertyValue("--background-color").trim();
    
    // For snow theme, use fallback color if gradient is defined
    if (theme === "snow" && bgColor.includes("gradient")) {
        bgColor = computedStyle.getPropertyValue("--fallback-background-color").trim();
    }
    
    // If CSS variable returns a named color or hex, convert to rgb
    if (bgColor && !bgColor.startsWith("rgb")) {
        // Apply to temp element and get computed color
        tempElem.style.backgroundColor = bgColor;
        bgColor = window.getComputedStyle(tempElem).backgroundColor;
    }
    
    document.body.removeChild(tempElem);
    
    // Fallback to hardcoded values if CSS variables not available
    if (!bgColor || bgColor === "rgba(0, 0, 0, 0)") {
        const fallbackColors = {
            dark: "rgb(0, 0, 0)",
            light: "rgb(255, 255, 255)",
            snow: "rgb(2, 0, 36)"
        };
        return fallbackColors[theme] || fallbackColors.dark;
    }
    
    return bgColor;
}

/**
 * Blend two colors together based on alpha transparency
 * @param {string} topColor - The top color in rgb/rgba format
 * @param {string} bottomColor - The bottom color in rgb/rgba format
 * @param {number} alphaTop - The alpha value of the top color (0-1)
 * @returns {string} The blended color in rgb format
 */
function blendColors(topColor, bottomColor, alphaTop) {
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
function rgbToHex(rgb) {
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
 * Get the background color for a given theme
 * @param {string} theme - Theme name (dark, light, snow)
 * @returns {string} RGB color string
 */
function getThemeColor(theme) {
    return getThemeColorFromCSS(theme);
}

/**
 * Get the dimmed (blended with overlay) color for a given theme
 * @param {string} theme - Theme name (dark, light, snow)
 * @returns {string} RGB color string
 */
function getDimmedThemeColor(theme) {
    const themeColor = getThemeColor(theme);
    const overlay = getOverlayColorAndAlpha();
    return blendColors(overlay.color, themeColor, overlay.alpha);
}

/**
 * Update the meta theme-color tag and body background-color
 * @param {string} color - Color in rgb format
 */
function updateThemeColor(color) {
    const hexColor = rgbToHex(color);
    const metaTag = document.querySelector("meta[name='theme-color']");
    if (metaTag) {
        metaTag.content = hexColor;
    }
    // Set body background color for iOS 26+ compatibility (which no longer respects theme-color meta tag)
    document.body.style.backgroundColor = hexColor;
}

/**
 * Apply normal theme color (not dimmed)
 * @param {string} theme - Theme name (dark, light, snow)
 */
function applyNormalThemeColor(theme) {
    const color = getThemeColor(theme);
    updateThemeColor(color);
}

/**
 * Apply dimmed theme color (blended with overlay)
 * @param {string} theme - Theme name (dark, light, snow)
 */
function applyDimmedThemeColor(theme) {
    const color = getDimmedThemeColor(theme);
    updateThemeColor(color);
}

/**
 * Get the current theme from the DOM (by checking body classes)
 * @returns {string} Current theme name
 */
function getCurrentThemeFromDOM() {
    const body = document.body;
    if (body.classList.contains("light")) {
        return "light";
    } else if (body.classList.contains("snow")) {
        return "snow";
    }
    return "dark";
}

/**
 * Apply normal theme color based on the current DOM state
 */
function applyNormalThemeColorFromDOM() {
    const theme = getCurrentThemeFromDOM();
    applyNormalThemeColor(theme);
}

/**
 * Apply dimmed theme color based on the current DOM state
 */
function applyDimmedThemeColorFromDOM() {
    const theme = getCurrentThemeFromDOM();
    applyDimmedThemeColor(theme);
}

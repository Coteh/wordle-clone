#!/usr/bin/env node

/*
 * Reports WCAG contrast ratios for a theme's colours, and searches for backgrounds
 * that a theme could use in high contrast mode.
 *
 * Usage, from the repository root:
 *
 *   node scripts/check_contrast.js                    every theme, both contrast modes
 *   node scripts/check_contrast.js sakura             one theme, both contrast modes
 *   node scripts/check_contrast.js sakura --contrast  one theme, high contrast only
 *   node scripts/check_contrast.js sakura --backdrop=#081a2c
 *   node scripts/check_contrast.js --search --hue=204 [--theme=sakura]
 *
 * The colours come from index.css, so this stays in step with the themes. Values are
 * resolved through var() chains, and a translucent colour is composited over the
 * background behind it.
 *
 * IMPORTANT - what this cannot see. A theme whose --background-color is a gradient or
 * an image has no single colour, so this falls back to --fallback-background-color and
 * says so. That fallback is only one point of the real background: the sakura theme's
 * painted backdrop runs from #0092e2 at the top of the sky to #fafcfe on the snowcap.
 * Where a ratio matters, sample the rendered page instead and pass the sampled colour
 * with --backdrop. Take the screenshot at a device pixel ratio of 1, and sample clear
 * of letter glyphs, or the glyph antialiasing will pull the reading toward the text
 * colour.
 *
 * --search sweeps saturation and lightness at a fixed hue and keeps the backgrounds
 * that hold 3:1 against all three of the theme's state colours. It reports the lightest
 * usable background per saturation, since that boundary is what a background has to
 * stay inside. It proposes candidates only; confirm the winner against the rendered
 * page as above.
 */

const fs = require("fs");
const path = require("path");

const NON_TEXT_MINIMUM = 3;
const TEXT_MINIMUM = 4.5;
const THEMES = ["dark", "light", "snow", "sakura"];
const CONTRAST_CLASS = "high-contrast";

const NAMED_COLOURS = {
    black: "#000000",
    white: "#ffffff",
    green: "#008000",
    grey: "#808080",
    gray: "#808080",
    lightgrey: "#d3d3d3",
    lightgray: "#d3d3d3",
};

/* ---------------------------------------------------------------- colour maths */

const linearize = (channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
};

const relativeLuminance = ({ r, g, b }) =>
    0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);

const contrastRatio = (first, second) => {
    const a = relativeLuminance(first);
    const b = relativeLuminance(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

const toHex = ({ r, g, b }) =>
    `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/* Composite a translucent colour over whatever sits behind it. */
const flatten = (colour, backdrop) => {
    if (colour.a === undefined || colour.a >= 1) return colour;
    if (!backdrop) return colour;
    return {
        r: colour.a * colour.r + (1 - colour.a) * backdrop.r,
        g: colour.a * colour.g + (1 - colour.a) * backdrop.g,
        b: colour.a * colour.b + (1 - colour.a) * backdrop.b,
    };
};

const parseColour = (value) => {
    if (!value) return null;
    const text = String(value).trim().toLowerCase();
    if (NAMED_COLOURS[text]) return parseColour(NAMED_COLOURS[text]);

    const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (hex) {
        const full = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
        return {
            r: parseInt(full.slice(0, 2), 16),
            g: parseInt(full.slice(2, 4), 16),
            b: parseInt(full.slice(4, 6), 16),
        };
    }

    const rgb = text.match(/^rgba?\(([^)]+)\)$/);
    if (rgb) {
        const parts = rgb[1].split(",").map((p) => parseFloat(p.trim()));
        if (parts.length < 3 || parts.some(Number.isNaN)) return null;
        const colour = { r: parts[0], g: parts[1], b: parts[2] };
        if (parts.length > 3) colour.a = parts[3];
        return colour;
    }

    return null;
};

const hslToRgb = (h, s, l) => {
    const hue = ((h % 360) + 360) % 360;
    const saturation = s / 100;
    const lightness = l / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const match = lightness - chroma / 2;
    const [r, g, b] =
        hue < 60
            ? [chroma, x, 0]
            : hue < 120
              ? [x, chroma, 0]
              : hue < 180
                ? [0, chroma, x]
                : hue < 240
                  ? [0, x, chroma]
                  : hue < 300
                    ? [x, 0, chroma]
                    : [chroma, 0, x];
    return { r: (r + match) * 255, g: (g + match) * 255, b: (b + match) * 255 };
};

/* ------------------------------------------------------------------ css reading */

/* Collect the top level rules of index.css as [selector, body] pairs. Rules that
   nest, such as @media, are skipped - no theme declares its variables inside one. */
const readRules = (css) => {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const rules = [];
    let index = 0;
    while (index < stripped.length) {
        const open = stripped.indexOf("{", index);
        if (open === -1) break;
        let depth = 1;
        let close = open + 1;
        while (close < stripped.length && depth > 0) {
            if (stripped[close] === "{") depth++;
            else if (stripped[close] === "}") depth--;
            close++;
        }
        const body = stripped.slice(open + 1, close - 1);
        if (!body.includes("{")) {
            rules.push([stripped.slice(index, open).trim(), body]);
        }
        index = close;
    }
    return rules;
};

const declarationsOf = (body) => {
    const out = {};
    body.split(";").forEach((line) => {
        const at = line.indexOf(":");
        if (at === -1) return;
        const name = line.slice(0, at).trim();
        if (name.startsWith("--")) out[name] = line.slice(at + 1).trim();
    });
    return out;
};

/*
 * Build a theme's variables the way the cascade would: :root, then the theme's own
 * class, then the shared high contrast rule, then anything scoped to both.
 */
const variablesFor = (rules, theme, highContrast) => {
    const applies = (selector) =>
        selector.split(",").some((part) => {
            const trimmed = part.trim();
            if (trimmed === ":root") return true;
            if (trimmed === `.${theme}`) return theme !== "dark";
            if (trimmed === `.${CONTRAST_CLASS}`) return highContrast;
            // A rule scoped to the theme and high contrast together, in either order
            return (
                highContrast &&
                trimmed.includes(`.${theme}`) &&
                trimmed.includes(`.${CONTRAST_CLASS}`)
            );
        });

    const variables = {};
    rules.forEach(([selector, body]) => {
        if (!applies(selector)) return;
        Object.assign(variables, declarationsOf(body));
    });
    return variables;
};

const NOT_A_COLOUR = "not-a-colour";

/* Follow var() chains. Returns a colour, or NOT_A_COLOUR for gradients and images. */
const resolve = (variables, name, seen = new Set()) => {
    if (seen.has(name)) return null;
    seen.add(name);
    const raw = variables[name];
    if (raw === undefined) return null;

    const reference = raw.match(/^var\(\s*(--[\w-]+)\s*\)$/);
    if (reference) return resolve(variables, reference[1], seen);

    const colour = parseColour(raw);
    if (colour) return colour;
    return NOT_A_COLOUR;
};

/* ------------------------------------------------------------------- the report */

const backgroundOf = (variables, override) => {
    if (override) return { colour: override, note: "from --backdrop" };
    const declared = resolve(variables, "--background-color");
    if (declared && declared !== NOT_A_COLOUR) return { colour: declared, note: "" };
    const fallback = resolve(variables, "--fallback-background-color");
    if (fallback && fallback !== NOT_A_COLOUR) {
        return {
            colour: fallback,
            note: "layered background, showing --fallback-background-color only",
        };
    }
    return { colour: null, note: "unresolved" };
};

const report = (rules, theme, highContrast, override) => {
    const variables = variablesFor(rules, theme, highContrast);
    const background = backgroundOf(variables, override);
    const get = (name) => {
        const value = resolve(variables, name);
        return value === NOT_A_COLOUR ? null : value;
    };
    const over = (name) => {
        const value = get(name);
        return value ? flatten(value, background.colour) : null;
    };

    const pageBg = background.colour;
    const emptyFill = over("--standard-block-color");
    const colours = {
        "page background": pageBg,
        "empty tile fill": emptyFill,
        "empty tile border": get("--box-border-color"),
        "filled tile border": get("--box-border-color-highlighted"),
        "correct tile": get("--correct-color"),
        "present tile": get("--within-color"),
        "absent tile": get("--incorrect-color"),
        "standard key": get("--standard-color"),
        "key border": over("--key-border-color"),
        "default text": get("--text-color"),
        "typed letter": get("--letter-text-color"),
        "state letter": get("--letter-selected-text-color"),
        "state letter (inverted)": get("--letter-selected-inverted-text-color"),
        "dialog surface": get("--dialog-background-color"),
        "focus ring": get("--focused-card-border-color"),
    };

    console.log(`\n${"=".repeat(78)}`);
    console.log(`${theme}${highContrast ? " + high contrast" : ""}`);
    if (background.note) console.log(`  note: ${background.note}`);
    console.log("=".repeat(78));

    console.log("\n  resolved colours");
    Object.entries(colours).forEach(([name, colour]) => {
        console.log(`    ${name.padEnd(26)} ${colour ? toHex(colour) : "(not a plain colour)"}`);
    });

    const pairs = [
        ["correct tile vs empty tile", "correct tile", "empty tile fill", NON_TEXT_MINIMUM],
        ["present tile vs empty tile", "present tile", "empty tile fill", NON_TEXT_MINIMUM],
        ["absent tile vs empty tile", "absent tile", "empty tile fill", NON_TEXT_MINIMUM],
        ["correct tile vs page background", "correct tile", "page background", NON_TEXT_MINIMUM],
        ["present tile vs page background", "present tile", "page background", NON_TEXT_MINIMUM],
        ["absent tile vs page background", "absent tile", "page background", NON_TEXT_MINIMUM],
        ["empty border vs empty fill", "empty tile border", "empty tile fill", NON_TEXT_MINIMUM],
        [
            "empty border vs page background",
            "empty tile border",
            "page background",
            NON_TEXT_MINIMUM,
        ],
        ["correct key vs standard key", "correct tile", "standard key", NON_TEXT_MINIMUM],
        ["present key vs standard key", "present tile", "standard key", NON_TEXT_MINIMUM],
        ["absent key vs standard key", "absent tile", "standard key", NON_TEXT_MINIMUM],
        ["standard key vs page background", "standard key", "page background", NON_TEXT_MINIMUM],
        ["key border vs page background", "key border", "page background", NON_TEXT_MINIMUM],
        ["focus ring vs page background", "focus ring", "page background", NON_TEXT_MINIMUM],
        ["default text vs page background", "default text", "page background", TEXT_MINIMUM],
        ["default text vs dialog surface", "default text", "dialog surface", TEXT_MINIMUM],
        ["typed letter vs empty tile", "typed letter", "empty tile fill", TEXT_MINIMUM],
        ["state letter vs correct tile", "state letter (inverted)", "correct tile", TEXT_MINIMUM],
        ["state letter vs present tile", "state letter (inverted)", "present tile", TEXT_MINIMUM],
        ["state letter vs absent tile", "state letter", "absent tile", TEXT_MINIMUM],
        ["typed letter vs standard key", "typed letter", "standard key", TEXT_MINIMUM],
    ];

    console.log("\n  ratios");
    let failures = 0;
    pairs.forEach(([label, first, second, minimum]) => {
        const a = colours[first];
        const b = colours[second];
        if (!a || !b) {
            console.log(`    ${label.padEnd(34)} ${"-".padStart(7)}  skipped`);
            return;
        }
        const ratio = contrastRatio(a, b);
        const passed = ratio >= minimum;
        if (!passed) failures++;
        console.log(
            `    ${label.padEnd(34)} ${ratio.toFixed(2).padStart(6)}:1  ` +
                `${passed ? "pass" : "FAIL"} (needs ${minimum})`,
        );
    });
    console.log(`\n  ${failures} below threshold`);
    return failures;
};

/* ------------------------------------------------------------------ the search */

const search = (rules, theme, hue) => {
    const variables = variablesFor(rules, theme, true);
    const states = {
        correct: resolve(variables, "--correct-color"),
        present: resolve(variables, "--within-color"),
        absent: resolve(variables, "--incorrect-color"),
    };
    if (Object.values(states).some((c) => !c || c === NOT_A_COLOUR)) {
        console.error(`Could not resolve the state colours for "${theme}".`);
        process.exit(1);
    }

    console.log(`\nBackgrounds at hue ${hue} that hold ${NON_TEXT_MINIMUM}:1 against`);
    console.log(
        `${theme} + high contrast state colours ` +
            Object.entries(states)
                .map(([k, v]) => `${k} ${toHex(v)}`)
                .join(", "),
    );

    const perSaturation = new Map();
    for (let saturation = 0; saturation <= 60; saturation += 5) {
        for (let lightness = 0; lightness <= 100; lightness++) {
            const background = hslToRgb(hue, saturation, lightness);
            const ratios = Object.fromEntries(
                Object.entries(states).map(([k, v]) => [k, contrastRatio(v, background)]),
            );
            const lowest = Math.min(...Object.values(ratios));
            if (lowest < NON_TEXT_MINIMUM) continue;
            const previous = perSaturation.get(saturation);
            if (!previous || lightness > previous.lightness) {
                perSaturation.set(saturation, { lightness, background, ratios, lowest });
            }
        }
    }

    if (perSaturation.size === 0) {
        console.log("\n  No background at this hue clears all three. The state colours");
        console.log("  themselves are the constraint - try a different hue, or accept a");
        console.log("  lower bar on whichever relationship is binding.");
        return;
    }

    console.log("\n  lightest usable background per saturation (stay at or below these)");
    console.log(
        `    ${"sat".padEnd(6)}${"max L".padEnd(8)}${"hex".padEnd(10)}` +
            `${"worst".padEnd(8)}binding`,
    );
    [...perSaturation.entries()].forEach(([saturation, best]) => {
        const binding = Object.entries(best.ratios).sort((a, b) => a[1] - b[1])[0][0];
        console.log(
            `    ${`${saturation}%`.padEnd(6)}${`${best.lightness}%`.padEnd(8)}` +
                `${toHex(best.background).padEnd(10)}${best.lowest.toFixed(2).padEnd(8)}${binding} tile`,
        );
    });
    console.log("\n  Candidates only. Confirm the winner against the rendered page.");
};

/* --------------------------------------------------------------------- the cli */

const main = () => {
    const args = process.argv.slice(2);
    if (args.includes("--help") || args.includes("-h")) {
        console.log(
            fs
                .readFileSync(__filename, "utf8")
                .split("*/")[0]
                .replace(/^#!.*\n/, ""),
        );
        return;
    }

    const flag = (name) => {
        const found = args.find((a) => a.startsWith(`--${name}=`));
        return found ? found.slice(name.length + 3) : null;
    };

    const css = fs.readFileSync(path.join(__dirname, "..", "index.css"), "utf8");
    const rules = readRules(css);

    if (args.includes("--search")) {
        const theme = flag("theme") || "sakura";
        search(rules, theme, Number(flag("hue") ?? 204));
        return;
    }

    const named = args.filter((a) => !a.startsWith("-"));
    const themes = named.length ? named : THEMES;
    const unknown = themes.filter((t) => !THEMES.includes(t));
    if (unknown.length) {
        console.error(`Unknown theme(s): ${unknown.join(", ")}. Known: ${THEMES.join(", ")}`);
        process.exit(1);
    }

    const backdrop = flag("backdrop") ? parseColour(flag("backdrop")) : null;
    if (flag("backdrop") && !backdrop) {
        console.error(`Could not parse --backdrop=${flag("backdrop")}`);
        process.exit(1);
    }

    const modes = args.includes("--contrast") ? [true] : [false, true];
    let failures = 0;
    themes.forEach((theme) => {
        modes.forEach((highContrast) => {
            failures += report(rules, theme, highContrast, backdrop);
        });
    });
    console.log(`\n${failures} ratio(s) below threshold across ${themes.length} theme(s).`);
    console.log("Ratios involving a layered background are indicative - see the note at");
    console.log("the top of this script, and pass --backdrop with a sampled colour.");
};

main();

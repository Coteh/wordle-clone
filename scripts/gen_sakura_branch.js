#!/usr/bin/env node

// Draws the blossom branches that frame the top corners of the sakura theme.
// Run from the repository root to regenerate images/sakura-branch.svg and its
// mirrored twin. The layout is random but seeded, so the output is stable
// across runs - change the seed below to draw a different branch.

const fs = require("fs");

const SEED = 20260830;
const WIDTH = 300;
const HEIGHT = 200;
const BRANCH_COLOUR = "#4a2b39";
// Blossoms are drawn back to front, deepest shade first
const SHADES = ["#e29ebd", "#f7c3d9", "#fdeaf2"];

// Each limb grows out from the corner, thickest first. A limb is a stroke width
// and the cubic bezier segments it runs along, given as [start, control, control, end].
const LIMBS = [
    [
        8,
        [
            [
                [-10, 9],
                [70, 24],
                [140, 36],
                [206, 52],
            ],
            [
                [206, 52],
                [240, 60],
                [262, 74],
                [276, 96],
            ],
        ],
    ],
    [
        4.6,
        [
            [
                [52, 21],
                [66, 48],
                [76, 70],
                [78, 102],
            ],
        ],
    ],
    [
        3,
        [
            [
                [78, 102],
                [82, 120],
                [92, 134],
                [110, 145],
            ],
        ],
    ],
    [
        4.2,
        [
            [
                [128, 32],
                [146, 50],
                [153, 72],
                [150, 96],
            ],
        ],
    ],
    [
        3.2,
        [
            [
                [150, 96],
                [149, 112],
                [142, 124],
                [130, 133],
            ],
        ],
    ],
    [
        4,
        [
            [
                [24, 13],
                [32, 34],
                [26, 56],
                [10, 70],
            ],
        ],
    ],
    [
        3.4,
        [
            [
                [196, 49],
                [214, 60],
                [224, 79],
                [226, 102],
            ],
        ],
    ],
    [
        2.6,
        [
            [
                [166, 44],
                [182, 50],
                [198, 46],
                [212, 34],
            ],
        ],
    ],
    [
        2.4,
        [
            [
                [232, 66],
                [246, 68],
                [258, 62],
                [266, 52],
            ],
        ],
    ],
];

// Mulberry32, so that the same seed always draws the same branch
const makeRandom = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const random = makeRandom(SEED);
const between = (lo, hi) => lo + random() * (hi - lo);
const pick = (options) => options[Math.floor(random() * options.length)];

const pointAt = ([[x0, y0], [x1, y1], [x2, y2], [x3, y3]], t) => {
    const u = 1 - t;
    const [a, b, c, d] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    return [a * x0 + b * x1 + c * x2 + d * x3, a * y0 + b * y1 + c * y2 + d * y3];
};

const blossoms = [];
const addBlossom = (x, y, scale, shade) => {
    if (x < -12 || x > WIDTH + 12 || y < -12 || y > HEIGHT + 12) return;
    blossoms.push({ x, y, scale, shade });
};

LIMBS.forEach(([width, segments]) => {
    segments.forEach((segment, segmentIndex) => {
        const steps = 16;
        for (let step = 0; step <= steps; step++) {
            const t = step / steps;
            // Blossoms gather towards the thin outer ends of a limb
            const along = (segmentIndex + t) / segments.length;
            if (random() > 0.12 + (0.34 * along * (10 - width)) / 8) continue;
            const [x, y] = pointAt(segment, t);
            const count = pick([1, 1, 1, 2, 2]);
            for (let i = 0; i < count; i++) {
                addBlossom(
                    x + between(-11, 11),
                    y + between(-11, 11),
                    between(0.55, 1.05),
                    pick([0, 1, 1, 1, 2, 2]),
                );
            }
        }
    });
});

// A few petals drifting free of the branches
for (let i = 0; i < 11; i++) {
    addBlossom(between(10, WIDTH - 10), between(10, HEIGHT - 10), between(0.4, 0.68), pick([1, 2]));
}

const round = (value) => Number(value.toFixed(1));

const render = (mirrored) => {
    const lines = [];
    lines.push(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    );
    lines.push("    <defs>");
    lines.push('        <g id="blossom">');
    [
        [0, -5.2],
        [4.9, -1.6],
        [3, 4.2],
        [-3, 4.2],
        [-4.9, -1.6],
    ].forEach(([cx, cy]) => {
        lines.push(`            <circle cx="${cx}" cy="${cy}" r="4.3" />`);
    });
    lines.push("        </g>");
    lines.push("    </defs>");
    lines.push(mirrored ? `    <g transform="translate(${WIDTH} 0) scale(-1 1)">` : "    <g>");
    lines.push(`        <g fill="none" stroke="${BRANCH_COLOUR}" stroke-linecap="round">`);
    LIMBS.forEach(([width, segments]) => {
        const start = segments[0][0];
        const path = segments.reduce(
            (d, segment) =>
                `${d} C${segment
                    .slice(1)
                    .map(([x, y]) => `${x} ${y}`)
                    .join(" ")}`,
            `M${start[0]} ${start[1]}`,
        );
        lines.push(`            <path d="${path}" stroke-width="${width}" />`);
    });
    lines.push("        </g>");
    SHADES.forEach((colour, shade) => {
        lines.push(`        <g fill="${colour}">`);
        blossoms
            .filter((blossom) => blossom.shade === shade)
            .forEach(({ x, y, scale }) => {
                lines.push(
                    `            <use href="#blossom" transform="translate(${round(x)} ${round(y)}) scale(${round(scale)})" />`,
                );
            });
        lines.push("        </g>");
    });
    lines.push("    </g>");
    lines.push("</svg>");
    return lines.join("\n") + "\n";
};

fs.writeFileSync("images/sakura-branch.svg", render(false));
fs.writeFileSync("images/sakura-branch-flipped.svg", render(true));
console.log(
    `Drew ${blossoms.length} blossoms into images/sakura-branch.svg and images/sakura-branch-flipped.svg`,
);

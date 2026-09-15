#!/usr/bin/env node
/**
 * Builds the link-unfurl images for project pages.
 *
 * Unfurlers (Slack, Discord, X, iMessage, LinkedIn) give no theme hint, so an
 * og:image cannot respond to dark mode. The next best thing is an image that
 * reads the same on any backdrop, which means every output here is fully
 * opaque: transparent corners would otherwise pick up whatever the client
 * paints behind them. They also refuse SVG, so Shiritori is rasterised.
 *
 * Run after changing any project icon:  node scripts/build-og-images.mjs
 */
import sharp from 'sharp'

const TILE = '#FBF6EC'   // .icon-mark--tile in app/assets/css/projects.css
const SIZE = 512
const INSET = 0.72       // matches the 14% padding the site puts around tiled logos

// `tiled` mirrors iconImageTile in the project's frontmatter: those icons are
// bare logos that need the cream tile behind them. The rest carry their own.
const PROJECTS = [
    {out: 'shiritori-og.png', src: 'shiritori-app-icon-light.svg', tiled: false},
    {out: 'mangasteen-og.png', src: 'Mangasteen_Logo.png', tiled: true},
    {out: 'iceteabot-og.png', src: 'iceteabot-app-icon.png', tiled: true},
    {out: 'cresthold-og.png', src: 'cresthold-app-icon-512.png', tiled: false},
    {out: 'interview-helper-og.png', src: 'interview-helper-app-icon-512.png', tiled: false}
]

for (const {out, src, tiled} of PROJECTS) {
    const from = `public/${src}`
    const to = `public/${out}`
    if (tiled) {
        const inner = Math.round(SIZE * INSET)
        const logo = await sharp(from)
            .resize(inner, inner, {fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 0}})
            .toBuffer()
        await sharp({create: {width: SIZE, height: SIZE, channels: 4, background: TILE}})
            .composite([{input: logo, gravity: 'centre'}])
            .flatten({background: TILE})
            .png().toFile(to)
    } else {
        await sharp(from, {density: 384})
            .resize(SIZE, SIZE)
            .flatten({background: TILE})
            .png().toFile(to)
    }
    console.log(`og: ${src} -> ${out}`)
}

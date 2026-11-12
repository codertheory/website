// Request paths for Studio's image proxy on the admin host, shared by
// scripts/check-studio-guard.mjs (Node, against studioIpxAssetId) and
// scripts/check-studio-e2e.mjs (the built Worker in Miniflare).
//
// Each path is written as it goes on the wire, so `%23` is an encoded `#`.

// Served from the ASSETS binding. [request path, asset path, content type]
export const IPX_ALLOWED = [
    ['/__nuxt_studio/ipx/_/favicon.svg', 'favicon.svg', 'image/svg+xml'],
    ['/__nuxt_studio/ipx/s_200x200,fit_cover/favicon.svg', 'favicon.svg', 'image/svg+xml'],
    ['/__nuxt_studio/ipx/_/icon-192.png', 'icon-192.png', 'image/png'],
    ['/__nuxt_studio/ipx/s_200x200,fit_cover/icon-192.png', 'icon-192.png', 'image/png'],
    ['/__nuxt_studio/ipx/_/portrait.jpg', 'portrait.jpg', 'image/jpeg'],
    ['/__nuxt_studio/ipx/_/Mangasteen_Logo.png', 'Mangasteen_Logo.png', 'image/png']
]

// Must answer 404 with no outbound fetch.
export const IPX_REFUSED = [
    // External URLs, plain and encoded (the original finding)
    '/__nuxt_studio/ipx/_/https://evil.example/x.svg',
    '/__nuxt_studio/ipx/_/https:/evil.example/x.svg',
    '/__nuxt_studio/ipx/_/HTTPS://evil.example/x.svg',
    '/__nuxt_studio/ipx/_/https%3A%2F%2Fevil.example%2Fx.svg',
    '/__nuxt_studio/ipx/_/https://evil.example/x.html',
    '/__nuxt_studio/ipx/s_200x200,fit_cover/https://evil.example/x.png',
    '/__nuxt_studio/ipx/_/%20https://evil.example/x.svg',
    '/__nuxt_studio/ipx/_/x/https://evil.example/x.svg',
    '/__nuxt_studio/ipx/_///evil.example/x.svg',
    '/__nuxt_studio/ipx/_/%2F%2Fevil.example/x.svg',
    '/__nuxt_studio/ipx/_/@evil.example/x.svg',
    // Bypass A: encoded # or ? in the modifiers or the id
    '/__nuxt_studio/ipx/_%23/https://evil.example/x.svg',
    '/__nuxt_studio/ipx/_%3F/https://evil.example/x.svg',
    '/__nuxt_studio/ipx/x%23y/https://evil.example/x.svg',
    '/__nuxt_studio/ipx/w_100%23/https://evil.example/x.png',
    '/__nuxt_studio/ipx/_%23/https://evil.example/x.html',
    '/__nuxt_studio/ipx/_%23/data:image/svg+xml,%3Csvg%20xmlns=%22http:%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cscript%3E%2F*attacker*%2F%3C%2Fscript%3E%3C%2Fsvg%3E',
    '/__nuxt_studio/ipx/_/x%23https://evil.example/x.svg',
    '/__nuxt_studio/ipx/_/favicon.svg%23',
    '/__nuxt_studio/ipx/_/favicon%3F.svg',
    '/__nuxt_studio/ipx/_/x.svg?u=https://evil.example/x.svg',
    '/__nuxt_studio/ipx/_/favicon.svg?v=1',
    // Bypass B: tab, LF or CR (fetch strips them)
    '/__nuxt_studio/ipx/_/https%09://evil.example/x.svg',
    '/__nuxt_studio/ipx/_/https%0A://evil.example/x.svg',
    '/__nuxt_studio/ipx/_/https%0D://evil.example/x.svg',
    '/__nuxt_studio/ipx/_/h%09ttps%09://evil.example/x.svg',
    '/__nuxt_studio/ipx/s_200x200,fit_cover/https%09://evil.example/x.png',
    '/__nuxt_studio/ipx/_/https%09://evil.example/x.html',
    '/__nuxt_studio/ipx/_/favicon%09.svg',
    '/__nuxt_studio/ipx/_/%0Afavicon.svg',
    // data: and javascript:
    '/__nuxt_studio/ipx/_/data:image/svg+xml,%3Csvg%3E',
    '/__nuxt_studio/ipx/_/data%3Aimage%2Fsvg+xml,x.svg',
    '/__nuxt_studio/ipx/_/javascript:alert(1)',
    '/__nuxt_studio/ipx/_/javascript%3Aalert(1).svg',
    // Double and triple encoding
    '/__nuxt_studio/ipx/_/https%253A%252F%252Fevil.example%252Fx.svg',
    '/__nuxt_studio/ipx/_/https%25253A%25252F%25252Fevil.example%25252Fx.svg',
    '/__nuxt_studio/ipx/_%2523/https://evil.example/x.svg',
    '/__nuxt_studio/ipx/_%252523/https://evil.example/x.svg',
    '/__nuxt_studio/ipx/_/https%2509://evil.example/x.svg',
    '/__nuxt_studio/ipx/_/favicon%252Esvg',
    '/__nuxt_studio/ipx/_/%2566avicon.svg',
    // Any percent sequence at all, even one for an allowed character
    '/__nuxt_studio/ipx/_/%66avicon.svg',
    '/__nuxt_studio/ipx/_/a%2Fb.png',
    '/__nuxt_studio/ipx/_%2Ffavicon.svg',
    '/__nuxt_studio/ipx/_/x.svg%E0%A4%A',
    '/__nuxt_studio/ipx/_/my%20image.png',
    // Backslashes
    '/__nuxt_studio/ipx/_/%5C%5Cevil.example/x.svg',
    '/__nuxt_studio/ipx/_/%5Cfavicon.svg',
    '/__nuxt_studio/ipx/_/%5C/evil.example/x.svg',
    '/__nuxt_studio/ipx/_/\\\\evil.example\\x.svg',
    '/__nuxt_studio/ipx/_/a\\favicon.svg',
    // Dot segments
    '/__nuxt_studio/ipx/_/../favicon.svg',
    '/__nuxt_studio/ipx/_/./favicon.svg',
    '/__nuxt_studio/ipx/_/a/../../favicon.svg',
    '/__nuxt_studio/ipx/_/%2E%2E/favicon.svg',
    '/__nuxt_studio/ipx/_/%2e%2e%2ffavicon.svg',
    '/__nuxt_studio/ipx/_/..%2Ffavicon.svg',
    '/__nuxt_studio/ipx/_/.%2E/icon-192.png',
    '/__nuxt_studio/ipx/_/../_nuxt/builds/latest.json',
    // Modifiers outside ^(_|[a-z0-9_,]+)$
    '/__nuxt_studio/ipx/w:100/icon-192.png',
    '/__nuxt_studio/ipx/W_100/icon-192.png',
    '/__nuxt_studio/ipx/f=png/icon-192.png',
    '/__nuxt_studio/ipx/q_80&w_10/icon-192.png',
    '/__nuxt_studio/ipx/s_200x200%2Cfit_cover/icon-192.png',
    '/__nuxt_studio/ipx/_-/icon-192.png',
    // Not an image, or no id
    '/__nuxt_studio/ipx/_/robots.txt',
    '/__nuxt_studio/ipx/_/index.html',
    '/__nuxt_studio/ipx/_/_nuxt/builds/latest.json',
    '/__nuxt_studio/ipx/_/dump.about.sql',
    '/__nuxt_studio/ipx/_/favicon.svg.html',
    '/__nuxt_studio/ipx/_/favicon.svgz',
    '/__nuxt_studio/ipx/_/favicon',
    '/__nuxt_studio/ipx/_/.svg',
    '/__nuxt_studio/ipx/_/',
    '/__nuxt_studio/ipx/_',
    '/__nuxt_studio/ipx/',
    '/__nuxt_studio/ipx',
    '/__nuxt_studio/ipx//favicon.svg',
    '/__nuxt_studio/ipx/_//favicon.svg',
    '/__nuxt_studio/ipx/_/a//favicon.svg',
    '/__nuxt_studio/ipx/_/favicon.svg/',
    // A raw colon anywhere
    '/__nuxt_studio/ipx/_/favicon.svg:x',
    '/__nuxt_studio/ipx/_:/favicon.svg',
    '/__nuxt_studio/ipx/_/a:b/favicon.svg',
    '/__nuxt_studio/ipx/_/C:favicon.svg',
    // Other spellings of the prefix
    '/__nuxt_studio//ipx/_/favicon.svg',
    '/__NUXT_STUDIO/ipx/_/favicon.svg',
    '/__nuxt_studio/IPX/_/favicon.svg',
    '/__nuxt_studio%2Fipx/_/favicon.svg',
    '/__nuxt_studio/ipxfoo/_/favicon.svg'
]

// Pass the path check but are not in ASSETS, so 404 from there.
export const IPX_MISSING = [
    ['/__nuxt_studio/ipx/_/does-not-exist.png', 'does-not-exist.png'],
    ['/__nuxt_studio/ipx/s_200x200,fit_cover/shots/nope/home.webp', 'shots/nope/home.webp']
]

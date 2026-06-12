interface ContactBody {
    name?: string
    email?: string
    topic?: string
    message?: string
    token?: string
}

const TOPICS = [
    'Mentoring / pairing',
    'A project of yours',
    'Bug or feature request',
    'Just saying hi'
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
    const body = await readBody<ContactBody>(event)

    const name = body.name?.trim() ?? ''
    const email = body.email?.trim() ?? ''
    const topic = body.topic?.trim() ?? ''
    const message = body.message?.trim() ?? ''

    if (!name || name.length > 200) {
        throw createError({ statusCode: 400, statusMessage: 'please tell me your name' })
    }
    if (!EMAIL_RE.test(email) || email.length > 320) {
        throw createError({ statusCode: 400, statusMessage: 'that email address doesn’t look right' })
    }
    if (!TOPICS.includes(topic)) {
        throw createError({ statusCode: 400, statusMessage: 'please pick a topic' })
    }
    if (!message || message.length > 5000) {
        throw createError({ statusCode: 400, statusMessage: 'message is empty or too long (5000 chars max)' })
    }

    if (!body.token) {
        throw createError({ statusCode: 400, statusMessage: 'spam check incomplete — please try again' })
    }
    const turnstile = await verifyTurnstileToken(body.token, event)
    if (!turnstile.success) {
        throw createError({ statusCode: 403, statusMessage: 'spam check failed — please try again' })
    }

    const { contact } = useRuntimeConfig(event)
    const text = [
        `From:  ${name} <${email}>`,
        `Topic: ${topic}`,
        '',
        message
    ].join('\n')

    if (!contact.resendApiKey) {
        if (import.meta.dev) {
            // Local dev without a key — log instead of delivering.
            console.info('[contact] no Resend API key, would have sent:\n' + text)
            return { ok: true }
        }
        throw createError({ statusCode: 503, statusMessage: 'email delivery is not configured' })
    }

    try {
        await $fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${contact.resendApiKey}` },
            body: {
                from: `codertheory.dev contact form <${contact.fromEmail}>`,
                to: [contact.toEmail],
                reply_to: `${name.replace(/[<>"\n\r]/g, '')} <${email}>`,
                subject: `[codertheory.dev] ${topic} — ${name}`,
                text
            }
        })
    } catch (e) {
        console.error('[contact] Resend delivery failed', e)
        throw createError({ statusCode: 502, statusMessage: 'couldn’t send your message — please email me directly' })
    }

    return { ok: true }
})

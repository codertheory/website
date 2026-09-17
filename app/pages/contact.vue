<template>
  <div class="page">
    <section class="wrap" style="padding-top: 60px;">
      <span class="eyebrow">Contact</span>
      <h1 class="h-section" style="margin-top: 14px; max-width: 720px;">
        Send me a <span class="scribble">note<ScribbleUnder /></span>. I read everything.
      </h1>
      <p style="max-width: 560px; color: var(--ink-soft); margin-top: 14px; font-size: 18px;">
        Mentoring questions, project feedback, bug reports, or just hello. All welcome, and I usually reply within a day or two.
      </p>
    </section>

    <section class="wrap section">
      <div class="contact-grid">
        <form class="card contact-form fade-up" @submit.prevent="onSubmit">
          <label>
            Your name
            <input v-model="form.name" type="text" required placeholder="Ada Lovelace">
          </label>
          <label>
            Email
            <input v-model="form.email" type="email" required placeholder="ada@example.com">
          </label>
          <label>
            What's this about?
            <select v-model="form.topic" required>
              <option value="" disabled>Pick one…</option>
              <option>Mentoring / pairing</option>
              <option>A project of yours</option>
              <option>Bug or feature request</option>
              <option>Just saying hi</option>
            </select>
          </label>
          <label>
            Your message
            <textarea v-model="form.message" required placeholder="Tell me what's on your mind…" />
          </label>
          <NuxtTurnstile v-if="spamCheckReady" ref="turnstile" v-model="token" />
          <p v-else class="form-unavailable">
            The form is off while its spam check is being reconfigured. Email me at
            <a href="mailto:support@codertheory.dev">support@codertheory.dev</a> and it reaches the same inbox.
          </p>
          <div class="form-foot">
            <button
              class="btn btn--primary"
              type="submit"
              :disabled="status === 'sending' || !spamCheckReady"
            >
              {{ buttonLabel }} <ArrowRight />
            </button>
            <span v-if="status === 'error'" class="form-hint form-hint--error">// {{ error }}</span>
            <span v-else class="form-hint">// or email me directly →</span>
          </div>
        </form>

        <div class="card contact-aside fade-up">
          <h2 class="contact-aside-h">Other ways to reach me</h2>
          <p>Email is fastest. Everything else I check, but slower.</p>
          <div class="channels">
            <a class="ch" href="mailto:support@codertheory.dev">
              <span class="ic">@</span>
              <div class="body">
                <div class="t">support@codertheory.dev</div>
                <div class="s">usually replies within 48h</div>
              </div>
              <ExternalIcon />
            </a>
            <a class="ch" href="https://github.com/codertheory">
              <span class="ic">&lt;/&gt;</span>
              <div class="body">
                <div class="t">github.com/codertheory</div>
                <div class="s">code, issues, discussions</div>
              </div>
              <ExternalIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
    // The contact API rejects any submission without a Turnstile token, so with no
    // site key configured the form can only ever return a 400 that blames the
    // sender. Better to say so and point at the inbox that still works.
    const runtimeConfig = useRuntimeConfig()
    const spamCheckReady = computed(() => Boolean(runtimeConfig.public.turnstile?.siteKey))

    const form = reactive({name: '', email: '', topic: '', message: ''})
    const token = ref('')
    const turnstile = ref<{reset: () => void}>()
    const status = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
    const error = ref('')

    const buttonLabel = computed(() => ({
        idle: 'Send message',
        sending: 'Sending…',
        sent: 'Sent, thanks',
        error: 'Send message'
    }[status.value]))

    const onSubmit = async () => {
        if (status.value === 'sending') return
        status.value = 'sending'
        try {
            await $fetch('/api/contact', {
                method: 'POST',
                body: {...form, token: token.value}
            })
            status.value = 'sent'
            Object.assign(form, {name: '', email: '', topic: '', message: ''})
        } catch (e) {
            status.value = 'error'
            const err = e as {data?: {statusMessage?: string}, statusMessage?: string}
            error.value = err.data?.statusMessage ?? err.statusMessage
                ?? 'something went wrong, try emailing me directly'
        } finally {
            turnstile.value?.reset()
        }
    }

    useSiteSeo({
        title: 'Contact',
        description: 'Mentoring questions, project feedback, bug reports, or just hello. Lucas usually replies within a day or two.'
    })

    useScrollReveal()
</script>

<template>
  <div class="page">
    <section class="wrap" style="padding-top: 60px;">
      <span class="eyebrow">Contact</span>
      <h1 class="h-section" style="margin-top: 14px; max-width: 720px;">
        Send me a <span class="scribble">note<ScribbleUnder /></span>. I read everything.
      </h1>
      <!-- TODO(lucas): stand-in for visitors who arrive from "Open to roles". Write your own. -->
      <p v-if="isRole" class="contact-lede">
        Tell me about the role. I usually reply within a day or two.
      </p>
      <p v-else class="contact-lede">
        Mentoring questions, project feedback, bug reports, or just hello. All welcome, and I usually reply within a day or two.
      </p>
    </section>

    <section class="wrap section">
      <div class="contact-grid">
        <div v-if="status === 'sent'" class="card contact-form contact-sent" role="status">
          <p class="contact-sent-h">{{ buttonLabel }}</p>
          <button class="arrow-link" type="button" @click="status = 'idle'">
            Send message <ArrowRight :size="14" />
          </button>
        </div>
        <form v-else class="card contact-form fade-up" @submit.prevent="onSubmit">
          <label>
            Your name
            <input v-model="form.name" type="text" name="name" autocomplete="name" required placeholder="Ada Lovelace">
          </label>
          <label>
            Email
            <input v-model="form.email" type="email" name="email" autocomplete="email" required placeholder="ada@example.com">
          </label>
          <label>
            What's this about?
            <select v-model="form.topic" name="topic" required>
              <option value="" disabled>Pick one…</option>
              <!-- TODO(lucas): placeholder label for hiring enquiries. -->
              <option>{{ ROLE_TOPIC }}</option>
              <option>Mentoring / pairing</option>
              <option>A project of yours</option>
              <option>Bug or feature request</option>
              <option>Just saying hi</option>
            </select>
          </label>
          <label>
            Your message
            <textarea v-model="form.message" name="message" required placeholder="Tell me what's on your mind…" />
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
            <a class="form-hint" href="mailto:support@codertheory.dev">// or email me directly →</a>
          </div>
          <!-- Shown with the email link above, not instead of it: a failed send is when it is needed. -->
          <p v-if="status === 'error'" class="form-hint form-hint--error" role="alert">// {{ error }}</p>
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

    // The homepage status link arrives as /contact?topic=role.
    const ROLE_TOPIC = 'A job or role'
    const route = useRoute()
    const isRole = computed(() => route.query.topic === 'role')
    const form = reactive({name: '', email: '', topic: isRole.value ? ROLE_TOPIC : '', message: ''})
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

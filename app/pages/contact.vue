<template>
  <div class="page">
    <section class="wrap" style="padding-top: 60px;">
      <span class="eyebrow">Contact</span>
      <h1 class="h-section" style="margin-top: 14px; max-width: 720px;">
        Send me a <span class="scribble">note<ScribbleUnder /></span>. I read everything.
      </h1>
      <p style="max-width: 560px; color: var(--ink-soft); margin-top: 14px; font-size: 18px;">
        Mentoring questions, project feedback, bug reports, or just hello — all welcome. I usually reply within a day or two.
      </p>
    </section>

    <section class="wrap section">
      <div class="contact-grid">
        <form class="card contact-form fade-up" @submit="onSubmit">
          <label>
            Your name
            <input type="text" required placeholder="Ada Lovelace">
          </label>
          <label>
            Email
            <input type="email" required placeholder="ada@example.com">
          </label>
          <label>
            What's this about?
            <select>
              <option value="" disabled selected>Pick one…</option>
              <option>Mentoring / pairing</option>
              <option>A project of yours</option>
              <option>Bug or feature request</option>
              <option>Just saying hi</option>
            </select>
          </label>
          <label>
            Your message
            <textarea required placeholder="Tell me what's on your mind…" />
          </label>
          <div class="form-foot">
            <button class="btn btn--primary" type="submit">
              {{ sent ? 'Sent — thanks!' : 'Send message' }} <ArrowRight />
            </button>
            <span class="form-hint">// or email me directly →</span>
          </div>
        </form>

        <aside class="card contact-aside fade-up">
          <h3>Other ways to reach me</h3>
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
        </aside>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
    const sent = ref(false)
    const onSubmit = (e: Event) => {
        e.preventDefault()
        sent.value = true
    }

    useSiteSeo({
        title: 'Contact',
        description: 'Mentoring questions, project feedback, bug reports, or just hello — all welcome. Lucas usually replies within a day or two.'
    })

    useScrollReveal()
</script>

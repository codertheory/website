import type { WatchSource } from 'vue'

export const useScrollReveal = (watchSource?: WatchSource) => {
  if (!import.meta.client) return

  let io: IntersectionObserver | null = null

  const setup = () => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.fade-up:not(.in)'))
    if (els.length === 0) return

    io?.disconnect()
    io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const i = els.indexOf(e.target as HTMLElement)
          window.setTimeout(() => e.target.classList.add('in'), Math.min(i, 6) * 70)
          io!.unobserve(e.target)
        }
      },
      { threshold: 0.12 }
    )
    els.forEach(el => io!.observe(el))
  }

  onMounted(setup)

  if (watchSource) {
    watch(watchSource, async () => {
      await nextTick()
      setup()
    })
  }

  onScopeDispose(() => io?.disconnect())
}

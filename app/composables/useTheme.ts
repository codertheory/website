type Theme = 'light' | 'dark'

export const useTheme = () => {
  const theme = useState<Theme>('theme', () => 'light')

  const apply = (value: Theme) => {
    document.documentElement.setAttribute('data-theme', value)
    localStorage.setItem('theme', value)
  }

  const toggle = (event?: Event) => {
    const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
    const root = document.documentElement
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!document.startViewTransition || reduced) {
      theme.value = next
      apply(next)
      return
    }

    // Open the new theme from wherever the toggle was pressed.
    const target = event?.currentTarget instanceof Element ? event.currentTarget.getBoundingClientRect() : null
    root.style.setProperty('--vt-x', `${target ? target.left + target.width / 2 : window.innerWidth}px`)
    root.style.setProperty('--vt-y', `${target ? target.top + target.height / 2 : 0}px`)
    root.classList.add('theme-vt')
    const transition = document.startViewTransition(() => {
      theme.value = next
      apply(next)
    })
    transition.finished.finally(() => root.classList.remove('theme-vt'))
  }

  if (import.meta.client) {
    onMounted(() => {
      const current = document.documentElement.getAttribute('data-theme')
      if (current === 'light' || current === 'dark') {
        theme.value = current
      }
    })
  }

  return { theme, toggle }
}

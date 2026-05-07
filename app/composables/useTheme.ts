type Theme = 'light' | 'dark'

export const useTheme = () => {
  const theme = useState<Theme>('theme', () => 'light')

  const apply = (value: Theme) => {
    document.documentElement.setAttribute('data-theme', value)
    localStorage.setItem('theme', value)
  }

  const toggle = () => {
    const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
    theme.value = next
    apply(next)
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

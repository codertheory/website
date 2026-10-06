// Decides, per navigation, whether a project's icon and title should travel
// between a list row and its page during the view transition.
//
// They travel only when both ends can show them: a project page on one side,
// and on the other a page that lists projects (or another project page). Any
// other navigation is a plain cross-fade, with nothing left fading on its own.
export default defineNuxtPlugin(() => {
    const transitProject = useState<string | null>('transit-project', () => null)
    const transitDetail = useState<boolean>('transit-detail', () => false)

    const slugOf = (path: string) => path.match(/^\/projects\/([^/]+)\/?$/)?.[1] ?? null
    const listsProjects = (path: string) => path === '/' || /^\/projects\/?$/.test(path)

    useRouter().beforeEach((to, from) => {
        const toSlug = slugOf(to.path)
        const fromSlug = slugOf(from.path)
        const paired = (toSlug && (fromSlug || listsProjects(from.path)))
            || (fromSlug && listsProjects(to.path))

        transitDetail.value = Boolean(paired)
        transitProject.value = paired ? (toSlug ?? fromSlug) : null
    })
})

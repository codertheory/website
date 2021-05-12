import dynamic from "next/dynamic";


const HomeView = dynamic(
    () => import("../views/index"),
    {
        ssr: false
    }
)


export default function Home() {
    return <HomeView/>
}
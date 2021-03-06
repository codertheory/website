import dynamic from "next/dynamic";


const HomeView = dynamic(
    () => import("../views/home"),
    {
        ssr: false
    }
)


export default function Home() {
    return <HomeView/>
}
import dynamic from "next/dynamic";


const PollsView = dynamic(
    () => import("../views/polls"),
    {
        ssr: false
    }
)


export default function Home() {
    return <PollsView/>
}
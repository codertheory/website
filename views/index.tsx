import Box from "@material-ui/core/Box";
import {MainHero} from "../components/heroes";
import {Container, Main, WithLayout} from "@codertheory/components";
import Head from "next/head";

const HomeComponent = () => {
    return (
        <Box>
            <Container>
                <MainHero/>
            </Container>
        </Box>
    )
}

const HomeView = () => {
    return (
        <>
            <Head>
                <title>Coder Theory</title>
                <meta property="og:title" content="Coder Theory"/>
                <meta property="og:description" content="Software Startup"/>
                <meta property="og:type" content="website"/>
                <meta property="og:url" content="https://codertheory.dev"/>
                <meta property="og:image" content="https://i.imgur.com/iQmH7rG.png"/>
                <meta property="og:image:type" content="image/png"/>
                <meta property="og:image:width" content="400"/>
                <meta property="og:image:height" content="300"/>
            </Head>
            <WithLayout Component={HomeComponent} Layout={Main}/>
        </>
    )
}

export default HomeView
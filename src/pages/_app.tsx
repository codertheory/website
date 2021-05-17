import {AppProps} from "next/app"
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'aos/dist/aos.css';
import Head from "next/head";

function MyApp({Component, pageProps}: AppProps) {
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
            <Component {...pageProps} />
        </>
    )
}

export default MyApp

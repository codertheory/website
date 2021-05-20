import Box from "@material-ui/core/Box";
import {MainHero} from "../components/heroes";
import {Container, Palette} from "@codertheory/components";
import Main from "../components/layouts/Main";
import {useTheme} from "@material-ui/core/styles";
import WithLayout from "../components/WithLayout";

const PollsProjectComponent = () => {
    const theme = useTheme();
    // @ts-ignore
    const palette: Palette = theme.palette
    return (
        <Box bgcolor={palette.alternate.main} position={'relative'}>
            <Container>
                Polls Project!
            </Container>
        </Box>
    )
}

const PollsProjectView = () => {
    return <WithLayout Component={PollsProjectComponent} Layout={Main}/>
}

export default PollsProjectView
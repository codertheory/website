import React, {useState} from 'react'
import {useTheme} from '@material-ui/core/styles'
import useScrollTrigger from '@material-ui/core/useScrollTrigger'
import Divider from '@material-ui/core/Divider'
import AppBar from '@material-ui/core/AppBar'
import Box from '@material-ui/core/Box'
import Slide from '@material-ui/core/Slide'
import {Container, NavigationPages, ThemeProps} from "@codertheory/components";
import {Footer, Sidebar, Topbar} from "./components";

const HideOnScroll = ({children}: { children: React.ReactElement }) => {
    const trigger = useScrollTrigger()

    return (
        <Slide appear={false} direction='down' in={!trigger}>
            {children}
        </Slide>
    )
}

export interface MainProps extends ThemeProps {
    children: React.ReactChildren
    pages?: NavigationPages[]
}

const Main = ({
                  children,
                  themeToggler,
                  themeMode,
                  setThemePalette,
                  paletteType,
                  pages
              }: MainProps) => {
    const theme = useTheme()
    const [openSidebar, setOpenSidebar] = useState(false)

    const handleSidebarOpen = () => {
        setOpenSidebar(true)
    }

    const handleSidebarClose = () => {
        setOpenSidebar(false)
    }

    return (
        <div>
            <HideOnScroll>
                <AppBar
                    position='fixed'
                    sx={{
                        backgroundColor: theme.palette.background.paper
                    }}
                    elevation={1}
                >
                    <Container paddingY={{xs: 1 / 2, sm: 1}}>
                        <Topbar
                            onSidebarOpen={handleSidebarOpen}
                            themeMode={themeMode}
                            themeToggler={themeToggler}
                            setThemePalette={setThemePalette}
                            paletteType={paletteType}
                        />
                    </Container>
                </AppBar>
            </HideOnScroll>
            <Sidebar
                onClose={handleSidebarClose}
                open={openSidebar}
                variant='temporary'
                pages={pages}
            />
            <main>
                <Box height={{xs: 56, sm: 64}}/>
                {children}
                <Divider/>
            </main>
            <Container>
                <Footer/>
            </Container>
        </div>
    )
}

export default Main

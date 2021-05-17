import Grid from '@material-ui/core/Grid'
import Box from '@material-ui/core/Box'
import Link from '@material-ui/core/Link'
import Typography from '@material-ui/core/Typography'
import {CoderTheoryLogo as Logo} from '../../../../../svg/logos/logo'

const Footer = () => (
    <Grid container spacing={2}>
        <Grid item xs={12}>
            <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                width='100%'
                flexDirection={{xs: 'column', sm: 'row'}}
            >
                <Box
                    display='flex'
                    component='a'
                    href='/'
                    title='logo'
                    height={75}
                    width={100}
                >
                    <Logo height={'100%'} width={'100%'}/>
                </Box>
                <Box display='flex' flexWrap='wrap' alignItems='center'>
                    <Box marginTop={1} marginRight={2}>
                        <Link
                            underline='none'
                            component='a'
                            href='/'
                            color='textPrimary'
                            variant='subtitle2'
                        >
                            Home
                        </Link>
                    </Box>
                    <Box marginTop={1} marginRight={2}/>
                    <Box marginTop={1}/>
                </Box>
            </Box>
        </Grid>
        <Grid item xs={12}>
            <Typography
                align='center'
                variant='subtitle2'
                color='textSecondary'
                gutterBottom
            >
                &copy; CoderTheory. 2021. All rights reserved
            </Typography>
            <Typography
                align='center'
                variant='caption'
                color='textSecondary'
                component='p'
            >
                When you visit or interact with our sites, services or tools, we or our
                authorised service providers may use cookies for storing information to
                help provide you with a better, faster and safer experience.
            </Typography>
        </Grid>
    </Grid>
)

export default Footer

import Box from "@material-ui/core/Box";
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import {Rocket as RocketIllustration} from '@codertheory/components'
import Typed from 'react-typed'

const MainHero = () => {
    const theme = useTheme();
    const isMd = useMediaQuery(theme.breakpoints.up('md'), {
        defaultMatches: true,
    });

    return (
        <Grid container spacing={4}>
            <Grid item container alignItems={'center'} xs={12} md={6}>
                <Box data-aos={isMd ? 'fade-right' : 'fade-up'}>
                    <Box marginBottom={2}>
                        <Typography
                            variant="h2"
                            color="textPrimary"
                            sx={{
                                fontWeight: 700,
                            }}
                        >
                            Turn your ideas
                            <br />
                            into a{' '}
                            <Typography
                                color={'primary'}
                                component={'span'}
                                variant={'inherit'}
                            >
                                <Typed
                                    strings={['startup.', 'future.', 'success.']}
                                    typeSpeed={80}
                                    loop={true}
                                />
                            </Typography>
                        </Typography>
                    </Box>
                    <Box marginBottom={3}>
                        <Typography
                            variant="h6"
                            component="p"
                            color="textSecondary"
                            sx={{ fontWeight: 400 }}
                        >
                            Webbee will make your product look modern and professional while
                            saving you precious time.
                        </Typography>
                    </Box>
                </Box>
            </Grid>
            <Grid item xs={12} md={6}>
                <Box
                    height={'100%'}
                    width={'100%'}
                    display={'flex'}
                    justifyContent={'center'}
                    alignItems={'center'}
                >
                    <Box height={'100%'} width={'100%'} maxHeight={600}>
                        <RocketIllustration width={'100%'} height={'100%'} />
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};

export default MainHero
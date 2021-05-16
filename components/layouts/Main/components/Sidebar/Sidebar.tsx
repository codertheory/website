import Drawer from '@material-ui/core/Drawer'
import Box from '@material-ui/core/Box'
import { SidebarNav } from './components'
import {NavigationPages} from "@codertheory/components";


export type SideBarProps = {
  onClose: () => void
  open: boolean
  variant?: 'permanent' | 'persistent' | 'temporary'
  pages?: NavigationPages[]
}

const Sidebar = (props: SideBarProps) => {
  const { pages, open, variant, onClose, ...rest } = props

  return (
    <Drawer
      anchor='left'
      onClose={() => onClose()}
      open={open}
      variant={variant}
      sx={{
        '& .MuiPaper-root': {
          width: '100%',
          maxWidth: { xs: '100%', sm: 400 }
        }
      }}
    >
      <Box
        {...rest}
        sx={{
          height: '100%',
          padding: 1
        }}
      >
        <SidebarNav pages={pages} onClose={onClose} />
      </Box>
    </Drawer>
  )
}

export default Sidebar

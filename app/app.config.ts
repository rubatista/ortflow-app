export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',
      neutral: 'slate'
    },
    card: {
      slots: {
        root: 'rounded-2xl overflow-hidden shadow-sm ring-1 ring-default'
      }
    },
    dashboardPanel: {
      slots: {
        root: 'bg-muted'
      }
    },
    navigationMenu: {
      slots: {
        list: 'flex flex-col gap-1',
        link: 'rounded-xl before:rounded-xl'
      },
      variants: {
        orientation: {
          vertical: {
            link: 'px-3 py-2.5'
          }
        }
      },
      compoundVariants: [
        {
          variant: 'pill',
          active: true,
          class: {
            link: 'bg-primary text-inverted before:bg-transparent hover:text-inverted hover:bg-primary',
            linkLeadingIcon: 'text-inverted group-data-[state=open]:text-inverted'
          }
        }
      ]
    }
  }
})

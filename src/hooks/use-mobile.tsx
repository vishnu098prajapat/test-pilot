import * as React from "react"

const MOBILE_BREAKPOINT = 1024 // Changed from 768 to 1024 to include tablets

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT) // Initial check
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

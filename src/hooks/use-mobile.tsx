import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkDevice = () => {
      // Combinação de largura da tela + detecção de dispositivo
      const screenWidth = window.innerWidth < MOBILE_BREAKPOINT
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isAndroid = /Android/i.test(navigator.userAgent)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isMobileDevice = isAndroid || isIOS
      
      // Se é dispositivo móvel real OU tela pequena com toque
      const result = isMobileDevice || (screenWidth && isTouchDevice)
      console.log('Device detection:', { screenWidth, isTouchDevice, isMobileDevice, result })
      setIsMobile(result)
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkDevice)
    checkDevice()
    
    return () => mql.removeEventListener("change", checkDevice)
  }, [])

  return !!isMobile
}

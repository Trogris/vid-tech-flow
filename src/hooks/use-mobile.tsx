import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkDevice = () => {
      // Detecção mais precisa: apenas largura da tela e detecção real de dispositivo móvel
      const screenWidth = window.innerWidth < MOBILE_BREAKPOINT
      const isRealMobileDevice = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
      
      // Detecção segura baseada apenas na tela e user agent
      let result = false
      
      try {
        // Usar apenas user agent para detecção de mobile real
        result = isRealMobileDevice && screenWidth
      } catch (err) {
        // Fallback para apenas tamanho da tela
        result = screenWidth
      }
      
      setIsMobile(result)
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkDevice)
    checkDevice()
    
    return () => mql.removeEventListener("change", checkDevice)
  }, [])

  return !!isMobile
}

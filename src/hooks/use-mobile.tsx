import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkDevice = () => {
      // Detecção mais precisa: apenas largura da tela e detecção real de dispositivo móvel
      const screenWidth = window.innerWidth < MOBILE_BREAKPOINT
      const isRealMobileDevice = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
      
      // Para Windows: apenas considerar mobile se for tela pequena E dispositivo móvel real
      const isWindows = /Windows/i.test(navigator.platform) || /Win/i.test(navigator.platform)
      
      let result = false
      
      if (isWindows) {
        // No Windows: NUNCA considerar mobile (mesmo com tela pequena)
        result = false
        console.log('🖥️ Windows detected - forcing desktop mode')
      } else {
        // Outros sistemas: usar detecção normal
        result = isRealMobileDevice || screenWidth
      }
      
      console.log('📱 Device detection:', { 
        screenWidth, 
        isRealMobileDevice, 
        isWindows, 
        platform: navigator.platform,
        result 
      })
      
      setIsMobile(result)
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkDevice)
    checkDevice()
    
    return () => mql.removeEventListener("change", checkDevice)
  }, [])

  return !!isMobile
}

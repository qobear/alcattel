"use client"

import { useEffect } from 'react'

export function PWAInstaller() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration)
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError)
          })
      })
    }

    // Handle install prompt
    let deferredPrompt: any
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      
      // Show install button/banner
      const installButton = document.getElementById('install-button')
      if (installButton) {
        installButton.style.display = 'block'
        installButton.addEventListener('click', () => {
          installButton.style.display = 'none'
          deferredPrompt.prompt()
          deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the A2HS prompt')
            } else {
              console.log('User dismissed the A2HS prompt')
            }
            deferredPrompt = null
          })
        })
      }
    })

    // Handle app installed
    window.addEventListener('appinstalled', () => {
      console.log('AllCattle PWA was installed')
      // Hide install promotion
      const installButton = document.getElementById('install-button')
      if (installButton) {
        installButton.style.display = 'none'
      }
    })

    // Request notification permission
    if ('Notification' in window && navigator.serviceWorker) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          console.log('Notification permission:', permission)
        })
      }
    }

    // Handle online/offline status
    const updateOnlineStatus = () => {
      const statusEl = document.getElementById('network-status')
      if (statusEl) {
        if (navigator.onLine) {
          statusEl.textContent = ''
          statusEl.className = 'hidden'
        } else {
          statusEl.textContent = 'You are offline. Data will sync when connection is restored.'
          statusEl.className = 'bg-yellow-500 text-white px-4 py-2 text-center text-sm'
        }
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    updateOnlineStatus()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  return (
    <>
      {/* Network status indicator */}
      <div id="network-status" className="hidden"></div>
      
      {/* Install button */}
      <button
        id="install-button"
        className="hidden fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
      >
        📱 Install App
      </button>
    </>
  )
}

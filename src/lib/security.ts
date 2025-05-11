'use client'

import { useEffect } from 'react'

// Prevent screenshots and screen recording
export function useContentProtection() {
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    // Disable keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common screenshot shortcuts
      if (
        (e.ctrlKey && e.key === 'p') || // Print
        (e.ctrlKey && e.key === 's') || // Save
        (e.ctrlKey && e.shiftKey && e.key === 'I') || // DevTools
        (e.ctrlKey && e.shiftKey && e.key === 'J') || // DevTools
        (e.ctrlKey && e.shiftKey && e.key === 'C') || // DevTools
        (e.key === 'F12') || // DevTools
        (e.ctrlKey && e.shiftKey && e.key === 'E') // DevTools
      ) {
        e.preventDefault()
      }
    }

    // Disable drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
    }

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('dragstart', handleDragStart)

    // Add CSS to prevent selection and dragging
    const style = document.createElement('style')
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-user-drag: none !important;
      }
    `
    document.head.appendChild(style)

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('dragstart', handleDragStart)
      document.head.removeChild(style)
    }
  }, [])
}

// Detect and prevent screen recording
export function useScreenRecordingProtection() {
  useEffect(() => {
    const checkScreenRecording = async () => {
      try {
        // Check if screen is being captured
        const stream = await navigator.mediaDevices.getDisplayMedia()
        if (stream) {
          // Stop the stream immediately
          stream.getTracks().forEach(track => track.stop())
          // Redirect to warning page or show warning
          window.location.href = '/warning'
        }
      } catch (error) {
        console.error('Screen recording protection error:', error)
      }
    }

    // Check periodically
    const interval = setInterval(checkScreenRecording, 1000)

    return () => clearInterval(interval)
  }, [])
}

// Verify user permissions
export function useUserVerification() {
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await fetch('/api/verify-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: localStorage.getItem('auth_token'),
          }),
        })

        if (!response.ok) {
          // Redirect unauthorized users
          window.location.href = '/unauthorized'
        }
      } catch (error) {
        console.error('User verification error:', error)
        window.location.href = '/unauthorized'
      }
    }

    verifyUser()
  }, [])
}

// Prevent code modification
export function useCodeProtection() {
  useEffect(() => {
    // Check for DevTools
    const checkDevTools = () => {
      const threshold = 160
      const widthThreshold = window.outerWidth - window.innerWidth > threshold
      const heightThreshold = window.outerHeight - window.innerHeight > threshold

      if (widthThreshold || heightThreshold) {
        window.location.href = '/warning'
      }
    }

    // Monitor window size changes
    window.addEventListener('resize', checkDevTools)
    setInterval(checkDevTools, 1000)

    return () => {
      window.removeEventListener('resize', checkDevTools)
    }
  }, [])
} 
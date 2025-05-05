import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider } from './session/AuthProvider'
import { useScreenSize } from './hooks/useScreenSize'
import AppShellDesktop from './layout/AppShellDesktop'
import AppShellTablet from './layout/AppShellTablet'
import AppShellMobile from './layout/AppShellMobile'

function App() {
  const screen = useScreenSize()

  let AppShell
  if (screen === 'mobile') AppShell = AppShellMobile
  else if (screen === 'tablet') AppShell = AppShellTablet
  else AppShell = AppShellDesktop

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell>
          <div>App content goes here</div>
        </AppShell>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

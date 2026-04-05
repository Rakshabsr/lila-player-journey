import { useState } from 'react'
import './index.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>LILA BLACK — Player Journey Visualization</h1>
        <p className="subtitle">Level Design Intelligence Tool</p>
      </header>
      <main className="main">
        <p className="loading">Loading data pipeline...</p>
      </main>
    </div>
  )
}

export default App

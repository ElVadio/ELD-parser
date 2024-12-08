import React from 'react';
import ELDParser from './ELDParser';
import './styles/App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>ELD Log Parser</h1>
      </header>
      <main>
        <ELDParser />
      </main>
    </div>
  );
}

export default App;
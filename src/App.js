import React from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ELDParser from './ELDParser';

function App() {
    return (
        <ErrorBoundary>
            <div className="App">
                <header className="App-header">
                    <h1>ELD Log Parser</h1>
                </header>
                <main>
                    <ELDParser />
                </main>
            </div>
        </ErrorBoundary>
    );
}

export default App;
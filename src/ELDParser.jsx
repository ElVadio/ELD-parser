import React, { useState, useEffect } from 'react';
import { EnhancedFMCSAChecker } from './ELDCheckerService';
import { DataProcessor } from './services/DataProcessor';
import * as pdfjsLib from 'pdfjs-dist';

const ELDParser = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [error, setError] = useState(null);
  const [violations, setViolations] = useState(null);

  useEffect(() => {
    // Initialize PDF.js worker
    const initializePdfWorker = async () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    };
    initializePdfWorker();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      if (!file.type.match('application/pdf')) {
        throw new Error('Invalid file type. Please upload a PDF file.');
      }

      setUploadedFile(file);
      await processFile(file);
      setActiveTab('results');
    } catch (err) {
      console.error('Upload Error:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processFile = async (file) => {
    const checker = new EnhancedFMCSAChecker();
    const processor = new DataProcessor();
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      
      const parsedRecords = await parsePDFContent(pdf);
      const processedData = processor.processELDData(parsedRecords);
      
      setParsedData(processedData.events);
      setViolations(processedData.violations);
    } catch (err) {
      console.error('PDF Processing Error:', err);
      setError('Error processing file: ' + err.message);
    }
  };

  const parsePDFContent = async (pdf) => {
    try {
      const records = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        const pageRecords = extractRecordsFromText(pageText);
        records.push(...pageRecords);
      }
      return records;
    } catch (err) {
      console.error('PDF Content Error:', err);
      throw new Error('Failed to extract content from PDF');
    }
  };

  const extractRecordsFromText = (text) => {
    const records = [];
    const lines = text.split('\n');
    let currentDate = null;

    const timeRegex = /(\d{1,2}:\d{2}(?:am|pm)?)/i;
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4})/;
    const statusRegex = /(ON DUTY|OFF DUTY|DRIVING|SLEEPER)/i;
    const locationRegex = /\((.*?)\)/;

    lines.forEach(line => {
      if (!line.trim()) return;

      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        currentDate = dateMatch[1];
        return;
      }

      const matches = {
        time: line.match(timeRegex),
        status: line.match(statusRegex),
        location: line.match(locationRegex)
      };

      if (matches.time && matches.status) {
        records.push({
          startTime: currentDate ? `${currentDate} ${matches.time[1]}` : matches.time[1],
          status: matches.status[1],
          location: matches.location ? matches.location[1] : '',
          fullLocation: line
        });
      }
    });

    return records;
  };

  return (
    <div className="container">
      <nav className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          Upload
        </button>
        <button
          className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Results
        </button>
        <button
          className={`tab-button ${activeTab === 'visualization' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualization')}
        >
          Visualization
        </button>
      </nav>

      <div className="content-area">
        {isProcessing && <div className="processing-indicator">Processing...</div>}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="upload-section">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              id="file-upload"
              className="hidden"
            />
            <label htmlFor="file-upload" className="upload-button">
              Select PDF File
            </label>
            {uploadedFile && (
              <div className="file-info">
                Selected file: {uploadedFile.name}
              </div>
            )}
          </div>
        )}

{activeTab === 'results' && (
  <div className="results-section">
    {parsedData ? (
      <div className="parsed-data">
        <h3>Analyzed Records:</h3>
        {parsedData.map((record, index) => (
          <div key={index} className="record-item">
            <p>Time: {record.startTime instanceof Date ? 
                record.startTime.toLocaleString() : 
                record.startTime}
            </p>
            <p>Status: {record.status}</p>
            <p>Location: {record.location?.place || record.location || 'N/A'}</p>
            {record.note && <p>Note: {record.note}</p>}
          </div>
        ))}

        {violations && violations.length > 0 && (
          <div className="violations-section">
            <h3>Violations Found:</h3>
            {violations.map((violation, index) => (
              <div key={index} className="violation-item">
                <p>Type: {violation.type}</p>
                <p>Time: {violation.event.startTime instanceof Date ? 
                    violation.event.startTime.toLocaleString() : 
                    violation.event.startTime}
                </p>
                {violation.duration && 
                  <p>Duration: {Math.round(violation.duration)} minutes</p>
                }
              </div>
            ))}
          </div>
        )}
      </div>
    ) : (
      <div className="no-data">No data available</div>
    )}
  </div>
)}

        {activeTab === 'visualization' && (
          <div className="visualization-section">
            {parsedData ? (
              <div className="visualization">
                <h3>Event Timeline</h3>
                <div className="timeline-container">
                  {/* Timeline visualization will be implemented here */}
                </div>
              </div>
            ) : (
              <div className="no-data">No data to visualize</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ELDParser;
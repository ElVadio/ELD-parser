import React, { useState } from 'react';
import EnhancedFMCSAChecker from './ELDCheckerService';
import { getDocument } from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.worker.entry';
import './styles/ELDParser.css';
import Timeline from './Timeline'
import { DataProcessor } from './services/DataProcessor';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;



// Set a specific version of PDF.js worker


const ELDParser = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [error, setError] = useState(null);
  const [violations, setViolations] = useState(null);

  
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
  // Update in ELDParser.jsx
const processFile = async (file) => {
  const checker = new EnhancedFMCSAChecker();
  const dataProcessor = new DataProcessor();
  
  try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const parsedRecords = await parsePDFContent(pdf);
      
      // Process and validate data
      const processedData = dataProcessor.processELDData(parsedRecords);
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

    const timeRegex = /(\d{1,2}:\d{2}(?:am|pm)?)/i;
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4})/;
    const statusRegex = /(ON DUTY|OFF DUTY|DRIVING|SLEEPER)/i;
    const locationRegex = /\((.*?)\)/;

    let currentDate = null;

    for (const line of lines) {
      if (!line.trim()) continue;

      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        currentDate = dateMatch[1];
        continue;
      }

      const timeMatch = line.match(timeRegex);
      const statusMatch = line.match(statusRegex);
      const locationMatch = line.match(locationRegex);

      if (timeMatch && statusMatch) {
        const startTime = timeMatch[1];
        const status = statusMatch[1].toUpperCase();
        const location = locationMatch ? locationMatch[1] : '';

        const nextTimeMatch = line.match(new RegExp(timeRegex.source + '.*' + timeRegex.source));
        let endTime = nextTimeMatch ? nextTimeMatch[2] : startTime;

        records.push({
          startTime: new Date(`${currentDate} ${startTime}`),
          endTime: new Date(`${currentDate} ${endTime}`),
          status,
          location,
          vehicleId: extractVehicleId(line),
          remark: extractRemark(line),
          bolNumber: extractBOLNumber(line),
          trailerNumber: extractTrailerNumber(line)
        });
      }
    }

    return records;
  };

  const extractVehicleId = (line) => {
    const vehiclePattern = /truck[:#\s]+(\w+)/i;
    const match = line.match(vehiclePattern);
    return match ? match[1] : '';
  };

  const extractRemark = (line) => {
    const remarkPatterns = [
      /remark[s]?:\s*(.*?)(?=\s*(?:\||$))/i,
      /note[s]?:\s*(.*?)(?=\s*(?:\||$))/i,
      /comment[s]?:\s*(.*?)(?=\s*(?:\||$))/i
    ];

    for (const pattern of remarkPatterns) {
      const match = line.match(pattern);
      if (match) return match[1].trim();
    }

    return '';
  };

  const extractBOLNumber = (line) => {
    const bolPattern = /BOL[:#\s]+(\w+)/i;
    const match = line.match(bolPattern);
    return match ? match[1] : '';
  };

  const extractTrailerNumber = (line) => {
    const trailerPattern = /trailer[:#\s]+(\w+)/i;
    const match = line.match(trailerPattern);
    return match ? match[1] : '';
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
            <div className="file-upload-container">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                id="file-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload" className="select-file-button">
                Select PDF File
              </label>
              {uploadedFile && (
                <div className="file-info">
                  Selected file: {uploadedFile.name}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="results-section">
            {parsedData ? (
              <div className="parsed-data">
                <h3>Analyzed Records:</h3>
                {parsedData.map((record, index) => (
                  <div key={index} className="record-item">
                    <p>Time: {record.startTime.toLocaleString()} - {record.endTime.toLocaleString()}</p>
                    <p>Status: {record.status}</p>
                    <p>Location: {record.location}</p>
                    {record.remark && <p>Remark: {record.remark}</p>}
                    {record.bolNumber && <p>BOL: {record.bolNumber}</p>}
                    {record.trailerNumber && <p>Trailer: {record.trailerNumber}</p>}
                  </div>
                ))}
                
                <h3>Violations Found:</h3>
                {violations && Object.entries(violations).map(([type, items]) => (
                  <div key={type} className="violation-type">
                    <h4>{type.replace(/_/g, ' ').toUpperCase()}</h4>
                    <ul className="violation-list">
                      {items.map((violation, index) => (
                        <li key={index} className="violation-item">
                          <div className="violation-details">
                            <p>Time: {new Date(violation.timestamp).toLocaleString()}</p>
                            <p>Location: {violation.location}</p>
                            <p>Duration: {violation.duration} minutes</p>
                            {violation.remark && <p>Remark: {violation.remark}</p>}
                            {violation.required && <p>Required: {violation.required} minutes</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
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
                <h3>Timeline Visualization</h3>
                <Timeline data={parsedData} />
                {/* Add visualization implementation */}
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
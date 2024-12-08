import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ELDParser from '../ELDParser';
import '@testing-library/jest-dom';

describe('ELDParser Component', () => {
  test('renders upload section initially', () => {
    render(<ELDParser />);
    expect(screen.getByText(/Select File/i)).toBeInTheDocument();
  });

  test('handles file upload', async () => {
    render(<ELDParser />);
    
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/Select File/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Processing/i)).toBeInTheDocument();
    });
  });

  test('shows error for invalid file type', async () => {
    render(<ELDParser />);
    
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/Select File/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
    });
  });

  test('displays results after successful parsing', async () => {
    render(<ELDParser />);
    
    // Mock successful file upload and parsing
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/Select File/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Results/i)).toBeInTheDocument();
    });
  });

  test('switches between tabs', () => {
    render(<ELDParser />);
    
    const resultsTab = screen.getByText(/Results/i);
    fireEvent.click(resultsTab);
    
    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });

  test('handles visualization rendering', async () => {
    render(<ELDParser />);
    
    const visualizationTab = screen.getByText(/Visualization/i);
    fireEvent.click(visualizationTab);

    expect(screen.getByText(/No data to visualize/i)).toBeInTheDocument();
  });
});
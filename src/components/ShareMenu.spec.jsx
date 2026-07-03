import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ShareMenu from './ShareMenu';

describe('ShareMenu Component', () => {
  it('should open menu list and trigger share callbacks', () => {
    const copyCallback = vi.fn();
    const exportImageCallback = vi.fn();
    const exportCsvCallback = vi.fn();
    const printCallback = vi.fn();

    render(
      <ShareMenu 
        shareUrl="http://localhost:5173/ozora-2026/?share=1,2"
        lang="en"
        onCopyLink={copyCallback}
        onExportImage={exportImageCallback}
        onExportCsv={exportCsvCallback}
        onPrint={printCallback}
        activeThemeClass="theme-sunset"
      />
    );

    const shareBtn = screen.getByRole('button', { name: /Share Schedule/i });
    fireEvent.click(shareBtn);

    expect(screen.getByText('Share & Access')).toBeInTheDocument();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
    expect(screen.getByText('Show QR')).toBeInTheDocument();

    expect(screen.getByText('Media & Image Export')).toBeInTheDocument();
    expect(screen.getByText('Export Image (Cosmic Night)')).toBeInTheDocument();
    expect(screen.getByText('Export Image (Active Theme)')).toBeInTheDocument();

    expect(screen.getByText('Files & Printing')).toBeInTheDocument();
    expect(screen.getByText('Export to Excel (CSV)')).toBeInTheDocument();
    expect(screen.getByText('Print Schedule')).toBeInTheDocument();

    // Trigger copy link
    const copyBtn = screen.getByText('Copy Link');
    fireEvent.click(copyBtn);
    expect(copyCallback).toHaveBeenCalled();

    // Reopen menu since it closes on click
    fireEvent.click(shareBtn);

    // Trigger export image active theme
    const exportThemeBtn = screen.getByText('Export Image (Active Theme)');
    fireEvent.click(exportThemeBtn);
    expect(exportImageCallback).toHaveBeenCalledWith('theme-sunset');

    // Reopen menu
    fireEvent.click(shareBtn);

    // Trigger export CSV
    const exportCsvBtn = screen.getByText('Export to Excel (CSV)');
    fireEvent.click(exportCsvBtn);
    expect(exportCsvCallback).toHaveBeenCalled();

    // Reopen menu
    fireEvent.click(shareBtn);

    // Trigger print
    const printBtn = screen.getByText('Print Schedule');
    fireEvent.click(printBtn);
    expect(printCallback).toHaveBeenCalled();
  });
});

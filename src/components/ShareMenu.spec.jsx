import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ShareMenu from './ShareMenu';

describe('ShareMenu Component', () => {
  it('should open menu list and trigger share callbacks', () => {
    const copyCallback = vi.fn();
    const exportCallback = vi.fn();

    render(
      <ShareMenu 
        shareUrl="http://localhost:5173/ozora-2026/?share=1,2"
        lang="en"
        onCopyLink={copyCallback}
        onExportImage={exportCallback}
      />
    );

    const shareBtn = screen.getByRole('button', { name: /Share Schedule/i });
    fireEvent.click(shareBtn);

    expect(screen.getByText('Copy Link')).toBeInTheDocument();
    expect(screen.getByText('Show QR')).toBeInTheDocument();
    expect(screen.getByText('Export Image')).toBeInTheDocument();

    const copyBtn = screen.getByText('Copy Link');
    fireEvent.click(copyBtn);
    expect(copyCallback).toHaveBeenCalled();
  });
});

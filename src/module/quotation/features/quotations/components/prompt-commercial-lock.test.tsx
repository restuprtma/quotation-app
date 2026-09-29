// @vitest-environment happy-dom

import { it, vi, expect, describe } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { PromptCommercialLock } from './prompt-commercial-lock';

describe('PromptCommercialLock', () => {
  it('shows an accessible managed-section hint and focuses the editor on request', () => {
    const onFocusEditor = vi.fn();
    render(
      <PromptCommercialLock
        message="Commercial values are managed by the quotation state."
        focusLabel="Focus editor"
        onFocusEditor={onFocusEditor}
      />
    );

    expect(screen.getByRole('note').textContent).toMatch(/commercial/i);
    const button = screen.getByRole('button', { name: /focus editor/i });
    fireEvent.click(button);

    expect(onFocusEditor).toHaveBeenCalledOnce();
  });
});

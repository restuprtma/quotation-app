// @vitest-environment happy-dom

import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { PromptRevisionBox } from './prompt-revision-box';

const copy = {
  title: 'Revise quotation',
  instruction: 'Revision instruction',
  target: 'Target section',
  scope: 'Scope',
  timeline: 'Timeline',
  narrative: 'Narrative',
  preview: 'Will update: {{target}}',
  commercialPreview: 'Commercial instructions update managed fields.',
  submit: 'Apply revision',
  submitting: 'Applying revision...',
  required: 'Enter a revision instruction.',
};

describe('PromptRevisionBox', () => {
  afterEach(cleanup);

  it('submits a labelled instruction with the selected target and previews its affected field', () => {
    const onSubmit = vi.fn();
    render(<PromptRevisionBox copy={copy} pending={false} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(copy.instruction), {
      target: { value: 'Ringkas bagian ruang lingkup.' },
    });
    fireEvent.mouseDown(screen.getByLabelText(copy.target));
    fireEvent.click(screen.getByRole('option', { name: copy.timeline }));
    expect(screen.getByText('Will update: Timeline')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: copy.submit }));
    expect(onSubmit).toHaveBeenCalledWith('Ringkas bagian ruang lingkup.', 'timeline');
  });

  it('keeps an inline accessible error and does not submit an empty instruction', () => {
    const onSubmit = vi.fn();
    render(<PromptRevisionBox copy={copy} pending={false} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: copy.submit }));
    expect(screen.getByRole('alert').textContent).toContain(copy.required);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

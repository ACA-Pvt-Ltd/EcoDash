import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import RatingModal from '@/components/RatingModal';
import { deferred } from '../setup/apiMock';
import { pressAndSettle, resolveAndSettle } from '../setup/interactions';

const setup = (props: Partial<React.ComponentProps<typeof RatingModal>> = {}) => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  const view = render(
    <RatingModal
      visible
      title="Rate Green Recyclers"
      onClose={onClose}
      onSubmit={onSubmit}
      {...props}
    />
  );
  return { onSubmit, onClose, view };
};

/** Stars render as five ★ glyphs; index 0 is one star. */
const tapStar = (oneBased: number) => fireEvent.press(screen.getAllByText('★')[oneBased - 1]);
const submit = async () => pressAndSettle(screen.getByText('Submit'));
const commentBox = () => screen.getByPlaceholderText(/Leave a comment/i);

describe('RatingModal', () => {
  describe('rendering', () => {
    it('shows the supplied title', () => {
      setup();

      expect(screen.getByText('Rate Green Recyclers')).toBeTruthy();
    });

    it('renders five stars', () => {
      setup();

      expect(screen.getAllByText('★')).toHaveLength(5);
    });

    it('renders nothing when not visible', () => {
      setup({ visible: false });

      expect(screen.queryByText('Rate Green Recyclers')).toBeNull();
    });
  });

  describe('submission gating', () => {
    it('does not submit before a score is chosen', async () => {
      const { onSubmit } = setup();

      await submit();

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits the chosen score', async () => {
      const { onSubmit } = setup();

      tapStar(4);
      await submit();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(4, ''));
    });

    it('trims the comment before submitting', async () => {
      const { onSubmit } = setup();

      tapStar(5);
      fireEvent.changeText(commentBox(), '   Great service   ');
      await submit();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(5, 'Great service'));
    });

    it('ignores a second tap while the submission is in flight', async () => {
      const pending = deferred<void>();
      const { onSubmit } = setup();
      onSubmit.mockReturnValue(pending.promise);

      tapStar(3);
      const button = screen.getByText('Submit');
      fireEvent.press(button);
      fireEvent.press(button);

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit).toHaveBeenCalledTimes(1);

      await resolveAndSettle(() => pending.resolve());
    });
  });

  describe('state between openings', () => {
    // REGRESSION: parents keep this modal mounted and only toggle `visible`.
    // State was cleared only after a *successful* submit or an explicit Cancel,
    // so a failed rating left the stars and comment populated — and they were
    // still there when the modal reopened for a different collector.
    it('clears a previous score when reopened after a failed submission', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error('Server rejected the rating'));
      const { rerender } = render(
        <RatingModal visible title="Rate A" onClose={jest.fn()} onSubmit={onSubmit} />
      );

      tapStar(4);
      await submit();
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());

      // Parent dismisses by flipping the prop, without calling handleClose
      rerender(<RatingModal visible={false} title="Rate A" onClose={jest.fn()} onSubmit={onSubmit} />);
      rerender(<RatingModal visible title="Rate B" onClose={jest.fn()} onSubmit={onSubmit} />);

      onSubmit.mockClear();
      await submit();

      // With no score carried over, Submit stays inert
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('clears a previous comment when reopened', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error('nope'));
      const { rerender } = render(
        <RatingModal visible title="Rate A" onClose={jest.fn()} onSubmit={onSubmit} />
      );

      tapStar(5);
      fireEvent.changeText(commentBox(), 'Left this about collector A');
      await submit();
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());

      rerender(<RatingModal visible={false} title="Rate A" onClose={jest.fn()} onSubmit={onSubmit} />);
      rerender(<RatingModal visible title="Rate B" onClose={jest.fn()} onSubmit={onSubmit} />);

      expect(commentBox().props.value).toBe('');
    });

    it('recovers from a failed submission so the user can retry', async () => {
      const onSubmit = jest
        .fn()
        .mockRejectedValueOnce(new Error('temporary'))
        .mockResolvedValueOnce(undefined);
      render(<RatingModal visible title="Rate A" onClose={jest.fn()} onSubmit={onSubmit} />);

      tapStar(4);
      await submit();
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

      // Still open, still usable
      await submit();
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    });
  });

  describe('cancelling', () => {
    it('notifies the parent when cancelled', () => {
      const { onClose } = setup();

      fireEvent.press(screen.getByText('Cancel'));

      expect(onClose).toHaveBeenCalled();
    });

    it('clears the score when cancelled', async () => {
      const { onSubmit, onClose } = setup();
      tapStar(3);

      fireEvent.press(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalled();

      await submit();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});

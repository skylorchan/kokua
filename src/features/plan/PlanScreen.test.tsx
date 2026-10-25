import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../data/db';
import en from '../../i18n/locales/en.json';
import { setupTestI18n } from '../../test/i18n';
import { PlanScreen } from './PlanScreen';

const renderScreen = () =>
  render(
    <MemoryRouter>
      <PlanScreen />
    </MemoryRouter>,
  );

beforeEach(async () => {
  await setupTestI18n('en');
  await db.plan.clear();
});

describe('PlanScreen', () => {
  it('saves contacts and meeting places to the device and loads them back', async () => {
    const user = userEvent.setup();
    const { unmount } = renderScreen();
    await user.type(await screen.findByLabelText(en.plan.meet.nearHome), 'Mailbox');
    await user.type(screen.getByLabelText(en.plan.contactName), 'Auntie');
    await user.type(screen.getByLabelText(en.plan.contactPhone), '808-555-0100');
    await user.click(screen.getByRole('button', { name: en.plan.addContact }));
    await waitFor(async () => expect((await db.plan.get('household'))?.contacts).toHaveLength(1));
    unmount();

    renderScreen();
    expect(await screen.findByDisplayValue('Mailbox')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '808-555-0100' })).toHaveAttribute(
      'href',
      'tel:8085550100',
    );
  });

  it('scales the water item with household size', async () => {
    const user = userEvent.setup();
    renderScreen();
    // Shown once in the checklist and once on the print-only sheet.
    expect(await screen.findAllByText(/Water: 14 gallons/)).toHaveLength(2);
    const people = screen.getByLabelText(en.plan.people);
    await user.clear(people);
    await user.type(people, '4');
    expect(await screen.findAllByText(/Water: 56 gallons/)).toHaveLength(2);
  });

  it('removes a contact', async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.type(await screen.findByLabelText(en.plan.contactName), 'Kai');
    await user.click(screen.getByRole('button', { name: en.plan.addContact }));
    await user.click(screen.getByRole('button', { name: 'Remove Kai' }));
    expect(screen.queryByRole('button', { name: 'Remove Kai' })).not.toBeInTheDocument();
  });

  it('shows a QR code only when asked, with a privacy warning', async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.click(await screen.findByRole('button', { name: en.plan.showQr }));
    expect(screen.getByText(en.plan.qrPrivacy)).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: en.plan.qrAlt })).toHaveAttribute(
      'src',
      expect.stringMatching(/^data:image\/svg\+xml/),
    );
  });
});

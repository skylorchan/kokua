import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LocationProvider } from '../app/LocationProvider';
import vi from '../i18n/locales/vi.json';
import { setupTestI18n } from '../test/i18n';
import { LocationPicker } from './LocationPicker';

describe('LocationPicker', () => {
  it('shows the chosen coordinates in the current language', async () => {
    // Regression: passing the longitude as `lng` made i18next switch to English.
    const i18n = await setupTestI18n('ja');
    i18n.addResourceBundle('vi', 'translation', vi);
    await i18n.changeLanguage('vi');
    const user = userEvent.setup();
    render(
      <LocationProvider>
        <LocationPicker />
      </LocationProvider>,
    );
    await user.type(screen.getByLabelText(vi.location.lat), '21.3');
    await user.type(screen.getByLabelText(vi.location.lng), '-157.8');
    await user.click(screen.getByRole('button', { name: vi.location.check }));
    expect(screen.getByText('Đang kiểm tra 21.30000, -157.80000')).toBeInTheDocument();
  });
});

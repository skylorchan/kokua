import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Renders text as a QR code (SVG, generated on the device; nothing is uploaded). */
export function PlanQr({ text }: { text: string }) {
  const { t } = useTranslation();
  const [svg, setSvg] = useState<string | null>(null);
  const [tooBig, setTooBig] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M', margin: 2 }).then(
      (s) => active && (setSvg(s), setTooBig(false)),
      () => active && (setSvg(null), setTooBig(true)),
    );
    return () => {
      active = false;
    };
  }, [text]);

  if (tooBig) return <p role="alert">{t('plan.qrTooBig')}</p>;
  if (!svg) return null;
  return (
    <img
      className="plan-qr"
      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
      alt={t('plan.qrAlt')}
      width={240}
      height={240}
    />
  );
}

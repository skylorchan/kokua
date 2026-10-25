import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Page } from '../../components/Page';
import { SafeText } from '../../components/SafeText';
import { useSafeT } from '../../components/useSafeT';
import {
  CHECKLIST,
  MEETING_POINTS,
  planSummary,
  progress,
  SUPPLY_DAYS,
  waterGallons,
  type Plan,
} from './plan';
import { PlanQr } from './PlanQr';
import { usePlan } from './usePlan';

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function Checklist({ plan, update }: { plan: Plan; update: (f: (p: Plan) => Plan) => void }) {
  const { t } = useTranslation();
  const { safeT, anyUnreviewed } = useSafeT();
  const peopleId = useId();
  const [peopleText, setPeopleText] = useState(String(plan.people));
  const { done, total } = progress(plan);
  const keys = CHECKLIST.map((k) => `safety.${k}` as const);

  return (
    <section className="card" aria-labelledby="kit-heading">
      <h2 id="kit-heading">{t('plan.kitHeading')}</h2>
      <p>{t('plan.kitProgress', { done, total })}</p>
      <label htmlFor={peopleId} className="inline-field">
        {t('plan.people')}
        <input
          id={peopleId}
          type="number"
          inputMode="numeric"
          min={1}
          max={30}
          value={peopleText}
          onChange={(e) => {
            // Keep the raw text so the box can be cleared and retyped; save only valid counts.
            setPeopleText(e.target.value);
            const n = Math.floor(Number(e.target.value));
            if (n >= 1 && n <= 30) update((p) => ({ ...p, people: n }));
          }}
          onBlur={() => setPeopleText(String(plan.people))}
        />
      </label>
      {anyUnreviewed(keys) && <p className="safety-note">{t('i18n.unreviewedList')}</p>}
      <ul className="checklist">
        {CHECKLIST.map((item) => {
          const label = safeT(`safety.${item}`, {
            gallons: waterGallons(plan.people),
            days: SUPPLY_DAYS,
          });
          return (
            <li key={item}>
              <label>
                <input
                  type="checkbox"
                  checked={!!plan.checklist[item]}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      checklist: { ...p.checklist, [item]: e.target.checked },
                    }))
                  }
                />
                <span lang={label.lang}>{label.text}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="source">
        <a href="https://dod.hawaii.gov/hiema/" target="_blank" rel="noreferrer">
          {t('plan.kitSource')}
        </a>
      </p>
    </section>
  );
}

function MeetingPoints({ plan, update }: { plan: Plan; update: (f: (p: Plan) => Plan) => void }) {
  const { t } = useTranslation();
  const baseId = useId();
  return (
    <section className="card" aria-labelledby="meet-heading">
      <h2 id="meet-heading">{t('plan.meetHeading')}</h2>
      <p>{t('plan.meetBody')}</p>
      {MEETING_POINTS.map((kind) => (
        <div key={kind} className="field">
          <label htmlFor={`${baseId}-${kind}`}>{t(`plan.meet.${kind}`)}</label>
          <input
            id={`${baseId}-${kind}`}
            value={plan.meetingPoints[kind] ?? ''}
            placeholder={t(`plan.meetPlaceholder.${kind}`)}
            onChange={(e) =>
              update((p) => ({
                ...p,
                meetingPoints: { ...p.meetingPoints, [kind]: e.target.value },
              }))
            }
          />
        </div>
      ))}
    </section>
  );
}

function Contacts({ plan, update }: { plan: Plan; update: (f: (p: Plan) => Plan) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const ids = { name: useId(), phone: useId(), relation: useId() };

  function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() && !phone.trim()) return;
    const contact = {
      id: newId(),
      name: name.trim(),
      phone: phone.trim(),
      relation: relation.trim(),
    };
    update((p) => ({ ...p, contacts: [...p.contacts, contact] }));
    setName('');
    setPhone('');
    setRelation('');
  }

  return (
    <section className="card" aria-labelledby="contacts-heading">
      <h2 id="contacts-heading">{t('plan.contactsHeading')}</h2>
      <p>{t('plan.contactsBody')}</p>
      {plan.contacts.length > 0 && (
        <ul className="contact-list">
          {plan.contacts.map((c) => (
            <li key={c.id}>
              <div>
                <strong>{c.name}</strong>
                {c.relation && <span> ({c.relation})</span>}
                <br />
                {c.phone && <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>{c.phone}</a>}
              </div>
              <button
                type="button"
                className="button-secondary"
                aria-label={t('plan.removeContact', { name: c.name || c.phone })}
                onClick={() =>
                  update((p) => ({ ...p, contacts: p.contacts.filter((x) => x.id !== c.id) }))
                }
              >
                {t('plan.remove')}
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="contact-form">
        <div className="field">
          <label htmlFor={ids.name}>{t('plan.contactName')}</label>
          <input id={ids.name} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={ids.phone}>{t('plan.contactPhone')}</label>
          <input
            id={ids.phone}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={ids.relation}>{t('plan.contactRelation')}</label>
          <input
            id={ids.relation}
            value={relation}
            placeholder={t('plan.contactRelationPlaceholder')}
            onChange={(e) => setRelation(e.target.value)}
          />
        </div>
        <button type="submit" className="button-secondary">
          {t('plan.addContact')}
        </button>
      </form>
    </section>
  );
}

/** What gets printed: a clean one-page summary instead of the editing UI. */
function PrintSheet({ plan }: { plan: Plan }) {
  const { t } = useTranslation();
  const { safeT } = useSafeT();
  return (
    <div className="print-only">
      <h2>{t('plan.printTitle')}</h2>
      <h3>{t('plan.meetHeading')}</h3>
      <ul>
        {MEETING_POINTS.map((kind) => (
          <li key={kind}>
            {t(`plan.meet.${kind}`)}: {plan.meetingPoints[kind] || '________________'}
          </li>
        ))}
      </ul>
      <h3>{t('plan.contactsHeading')}</h3>
      <ul>
        {plan.contacts.map((c) => (
          <li key={c.id}>
            {c.name} {c.relation && `(${c.relation})`} {c.phone}
          </li>
        ))}
      </ul>
      {plan.notes && (
        <>
          <h3>{t('plan.notes')}</h3>
          <p>{plan.notes}</p>
        </>
      )}
      <h3>{t('plan.kitHeading')}</h3>
      <ul>
        {CHECKLIST.map((item) => {
          const label = safeT(`safety.${item}`, {
            gallons: waterGallons(plan.people),
            days: SUPPLY_DAYS,
          });
          return (
            <li key={item} lang={label.lang}>
              {plan.checklist[item] ? '☑' : '☐'} {label.text}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PlanScreen() {
  const { t } = useTranslation();
  const { plan, update, saveFailed } = usePlan();
  const [showQr, setShowQr] = useState(false);
  const notesId = useId();

  if (!plan) {
    return (
      <Page title={t('screens.plan.title')}>
        <p>{t('plan.loading')}</p>
      </Page>
    );
  }

  const summary = planSummary(plan, {
    title: t('plan.printTitle'),
    meeting: {
      nearHome: t('plan.meet.nearHome'),
      outsideNeighborhood: t('plan.meet.outsideNeighborhood'),
      highGround: t('plan.meet.highGround'),
    },
    contacts: t('plan.contactsHeading'),
    notes: t('plan.notes'),
  });

  return (
    <Page title={t('screens.plan.title')}>
      <div className="screen-only">
        <p>{t('screens.plan.body')}</p>
        <p className="source">{t('plan.privacy')}</p>
        {saveFailed && <p role="alert">{t('plan.saveFailed')}</p>}
        <MeetingPoints plan={plan} update={update} />
        <Contacts plan={plan} update={update} />
        <section className="card">
          <label htmlFor={notesId}>
            <h2>{t('plan.notes')}</h2>
          </label>
          <textarea
            id={notesId}
            rows={3}
            value={plan.notes}
            placeholder={t('plan.notesPlaceholder')}
            onChange={(e) => update((p) => ({ ...p, notes: e.target.value }))}
          />
        </section>
        <Checklist plan={plan} update={update} />
        <section className="card" aria-labelledby="share-heading">
          <h2 id="share-heading">{t('plan.shareHeading')}</h2>
          <SafeText k="safety.printPlan" />
          <div className="button-row">
            <button type="button" onClick={() => window.print()}>
              {t('plan.print')}
            </button>
            <button
              type="button"
              className="button-secondary"
              aria-expanded={showQr}
              onClick={() => setShowQr((v) => !v)}
            >
              {showQr ? t('plan.hideQr') : t('plan.showQr')}
            </button>
          </div>
          {showQr && (
            <>
              <p className="safety-note">{t('plan.qrPrivacy')}</p>
              <PlanQr text={summary} />
            </>
          )}
        </section>
      </div>
      <PrintSheet plan={plan} />
    </Page>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, EyeOff, Check } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import Select from '@/components/ui/Select';
import { fetchServicesAdmin, createService, updateService, deleteService, UnauthorizedError } from '@/lib/storage';
import ImageUpload from './ImageUpload';
import { formatMessage } from '@/lib/formatMessage';
import messages from '@/messages/id/catalog.json';

export default function ServicesManager({ onUnauthorized }) {
  const [groups, setGroups] = useState({ services: [], hairdo: [], nailArt: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleRequestError(requestError) {
    if (requestError instanceof UnauthorizedError) onUnauthorized?.();
    else setError(messages.servicesManager.requestError);
  }

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const servicesData = await fetchServicesAdmin();
      setGroups({ services: servicesData.services, hairdo: servicesData.hairdo || [], nailArt: servicesData.nailArt });
    } catch (e) {
      handleRequestError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-rose">{error}</p>}
      <AddService onDone={refresh} onUnauthorized={onUnauthorized} />

      <Group
        title={messages.serviceKinds.makeup}
        items={groups.services}
        onChange={refresh}
        onUnauthorized={onUnauthorized}
      />
      <Group
        title={messages.serviceKinds.hairdo}
        items={groups.hairdo}
        onChange={refresh}
        onUnauthorized={onUnauthorized}
      />
      <Group
        title={messages.serviceKinds.nail}
        items={groups.nailArt}
        onChange={refresh}
        onUnauthorized={onUnauthorized}
      />

      {loading && <p className="text-sm text-muted">{messages.servicesManager.loading}</p>}
    </div>
  );
}

function Group({ title, items, onChange, onUnauthorized }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">{title}</h3>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-muted">{messages.serviceGroup.empty}</p>}
        {items.map((service) => (
          <ServiceRow key={service.id} svc={service} onChange={onChange} onUnauthorized={onUnauthorized} />
        ))}
      </div>
    </div>
  );
}

function ServiceRow({ svc: service, onChange, onUnauthorized }) {
  const [form, setForm] = useState({
    nama: service.nama,
    ringkas: service.ringkas || '',
    deskripsi: service.deskripsi || '',
    detail: service.detail || '',
    info: service.info || '',
    base: service.base,
    foto: service.foto || '',
    active: service.active,
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const [detailRows, setDetailRows] = useState(() => {
    const rows = String(service.detail || '')
      .split('\n')
      .map((service) => service.replace(/^[-•✓]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 5);
    while (rows.length < 5) rows.push('');
    return rows;
  });

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }
  function setDetailRow(index, value) {
    const next = [...detailRows];
    next[index] = value;
    setDetailRows(next);
    set(
      'detail',
      next
        .map((x) => x.trim())
        .filter(Boolean)
        .join('\n'),
    );
  }

  function handleRequestError(requestError) {
    if (requestError instanceof UnauthorizedError) onUnauthorized?.();
    else alert(messages.serviceRow.saveError);
  }

  async function save() {
    setBusy(true);
    try {
      await updateService(service.id, {
        nama: form.nama,
        ringkas: form.ringkas,
        deskripsi: form.deskripsi,
        detail: form.detail,
        info: form.info,
        base: form.base,
        foto: form.foto || null,
        active: form.active,
      });
      setSaved(true);
    } catch (e) {
      handleRequestError(e);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(formatMessage(messages.serviceRow.confirmDelete, { name: service.nama }))) return;
    setBusy(true);
    try {
      await deleteService(service.id);
      onChange();
    } catch (e) {
      handleRequestError(e);
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-2xl border border-rose-line bg-white p-4 ${form.active ? '' : 'opacity-70'}`}>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="sm:w-40 shrink-0">
          <div className="aspect-4/3 overflow-hidden rounded-xl border border-rose-line bg-rose-soft">
            {form.foto ? (
              <img src={form.foto} alt={form.nama} className="h-full w-full object-cover" />
            ) : (
              <div className="foto-ph h-full w-full text-xs">{messages.serviceRow.noPhoto}</div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ImageUpload
              onUploaded={(url) => set('foto', url)}
              onUnauthorized={onUnauthorized}
              label={form.foto ? messages.serviceRow.replacePhoto : messages.serviceRow.uploadPhoto}
            />
            {form.foto && (
              <button type="button" onClick={() => set('foto', '')} className="text-xs text-muted hover:text-rose">
                {messages.serviceRow.removePhoto}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">{messages.serviceRow.nameLabel}</label>
              <input className="field" value={form.nama} onChange={(event) => set('nama', event.target.value)} />
            </div>
            <div>
              <label className="label">{messages.serviceRow.priceLabel}</label>
              <input
                type="number"
                min="0"
                className="field"
                value={form.base}
                onChange={(event) => set('base', event.target.value)}
              />
              <p className="mt-1 text-xs text-muted">{formatRupiah(Number(form.base) || 0)}</p>
            </div>
          </div>
          <div>
            <label className="label">{messages.serviceRow.summaryLabel}</label>
            <input className="field" value={form.ringkas} onChange={(event) => set('ringkas', event.target.value)} />
          </div>
          <div>
            <label className="label">{messages.serviceRow.descriptionLabel}</label>
            <textarea
              rows={3}
              className="field resize-none"
              value={form.deskripsi}
              onChange={(event) => set('deskripsi', event.target.value)}
              placeholder={messages.serviceRow.descriptionPlaceholder}
            />
          </div>
          <div>
            <label className="label">{messages.serviceRow.detailLabel}</label>
            <div className="space-y-2">
              {detailRows.map((rowValue, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check size={16} className="shrink-0 text-rose" />
                  <input
                    className="field"
                    value={rowValue}
                    onChange={(event) => setDetailRow(index, event.target.value)}
                    placeholder={formatMessage(
                      index === 0
                        ? messages.serviceRow.firstDetailPointPlaceholder
                        : messages.serviceRow.detailPointPlaceholder,
                      { number: index + 1 },
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{messages.serviceRow.infoLabel}</label>
            <textarea
              rows={3}
              className="field resize-none"
              value={form.info}
              onChange={(event) => set('info', event.target.value)}
              placeholder={messages.serviceRow.infoPlaceholder}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 accent-rose"
                checked={form.active}
                onChange={(event) => set('active', event.target.checked)}
              />
              {messages.serviceRow.visibleOnSite}
            </label>
            {!form.active && (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <EyeOff size={12} /> {messages.serviceRow.hidden}
              </span>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button onClick={save} disabled={busy} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
                <Save size={15} /> {saved ? messages.serviceRow.saved : messages.serviceRow.save}
              </button>
              <button
                onClick={remove}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted hover:text-rose"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddService({ onDone, onUnauthorized }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ kind: 'makeup', nama: '', base: '', ringkas: '' });
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.nama.trim()) return;
    setBusy(true);
    try {
      await createService({
        kind: form.kind,
        nama: form.nama.trim(),
        base: Number(form.base) || 0,
        ringkas: form.ringkas.trim() || null,
      });
      setForm({ kind: 'makeup', nama: '', base: '', ringkas: '' });
      setOpen(false);
      onDone();
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
      else alert(e?.data?.error === 'id_exists' ? messages.addService.nameExists : messages.addService.addError);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-outline px-4 py-2 text-sm">
        <Plus size={16} /> {messages.addService.open}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-rose-line bg-white p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">{messages.addService.categoryLabel}</label>
          <Select
            value={form.kind}
            onChange={(value) => setForm({ ...form, kind: value })}
            options={[
              { value: 'makeup', label: messages.serviceKinds.makeup },
              { value: 'hairdo', label: messages.serviceKinds.hairdo },
              { value: 'nail', label: messages.serviceKinds.nail },
            ]}
          />
        </div>
        <div>
          <label className="label">{messages.addService.nameLabel}</label>
          <input
            className="field"
            value={form.nama}
            onChange={(event) => setForm({ ...form, nama: event.target.value })}
            placeholder={messages.addService.namePlaceholder}
          />
        </div>
        <div>
          <label className="label">{messages.addService.priceLabel}</label>
          <input
            type="number"
            min="0"
            className="field"
            value={form.base}
            onChange={(event) => setForm({ ...form, base: event.target.value })}
            placeholder={messages.addService.pricePlaceholder}
          />
        </div>
        <div>
          <label className="label">{messages.addService.summaryLabel}</label>
          <input
            className="field"
            value={form.ringkas}
            onChange={(event) => setForm({ ...form, ringkas: event.target.value })}
            placeholder={messages.addService.summaryPlaceholder}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
          {busy ? messages.addService.saving : messages.addService.save}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline px-4 py-2 text-sm">
          {messages.addService.cancel}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">{messages.addService.photoHint}</p>
    </form>
  );
}

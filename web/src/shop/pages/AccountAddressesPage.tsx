import { useState, type FormEvent } from "react";
import { Edit3, MapPin, Plus, Trash2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { useToast } from "../lib/toast";
import { Chip } from "../components/ui/StatusChip";
import { cn } from "../lib/cn";

interface Address {
  id: string;
  label: string;
  line1: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  isDefault?: boolean;
}

const seed: Address[] = [
  {
    id: "addr-1",
    label: "Home",
    line1: "121 Marine Drive",
    city: "Mumbai",
    region: "MH",
    postal: "400020",
    country: "India",
    isDefault: true,
  },
  {
    id: "addr-2",
    label: "Office",
    line1: "8 Bandra Kurla Complex, Tower B",
    city: "Mumbai",
    region: "MH",
    postal: "400051",
    country: "India",
  },
];

const blank: Address = {
  id: "",
  label: "",
  line1: "",
  city: "",
  region: "",
  postal: "",
  country: "India",
};

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(seed);
  const [draft, setDraft] = useState<Address | null>(null);
  const toast = useToast();

  function save(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setAddresses((curr) =>
      draft.id
        ? curr.map((a) => (a.id === draft.id ? draft : a))
        : [...curr, { ...draft, id: `addr-${Date.now()}`, isDefault: curr.length === 0 }]
    );
    toast(draft.id ? "Address updated" : "Address added", "success");
    setDraft(null);
  }

  function setDefault(id: string) {
    setAddresses((curr) => curr.map((a) => ({ ...a, isDefault: a.id === id })));
    toast("Default address updated");
  }

  function remove(id: string) {
    setAddresses((curr) => curr.filter((a) => a.id !== id));
    toast("Address removed");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
            Saved
          </p>
          <h2 className="text-[18px] font-semibold tracking-tight">Addresses on file</h2>
        </div>
        <button type="button" onClick={() => setDraft(blank)} className="btn btn-primary btn-sm">
          <Plus size={14} /> Add address
        </button>
      </div>

      {draft && (
        <Card as="section" className="fade-up">
          <form onSubmit={save} className="space-y-3">
            <p className="text-[14px] font-semibold">
              {draft.id ? "Edit address" : "New address"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  ["label", "Label", "Home"],
                  ["line1", "Street address", "121 Marine Drive"],
                  ["city", "City", "Mumbai"],
                  ["region", "State / region", "MH"],
                  ["postal", "Postal code", "400020"],
                  ["country", "Country", "India"],
                ] as const
              ).map(([field, label, placeholder]) => (
                <label key={field} className="block">
                  <span className="block text-[12px] text-muted mb-1">{label}</span>
                  <input
                    className="input h-10"
                    required
                    value={draft[field]}
                    placeholder={placeholder}
                    onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                  />
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button type="submit" className="btn btn-primary btn-sm">
                {draft.id ? "Save changes" : "Add address"}
              </button>
              <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {addresses.length === 0 ? (
        <Card className="text-center py-12">
          <MapPin size={28} className="mx-auto text-subtle" />
          <p className="font-semibold text-[14px] mt-2">No addresses saved</p>
          <p className="text-[12.5px] text-muted mt-1">
            Add one to speed up checkout next time.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <Card
              key={a.id}
              className={cn(
                "relative",
                a.isDefault && "ring-1 ring-[var(--color-brand-400)]"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[14px]">{a.label}</p>
                  {a.isDefault && <Chip tone="info">Default</Chip>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDraft(a)}
                    className="btn btn-icon btn-sm btn-ghost"
                    aria-label="Edit address"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    className="btn btn-icon btn-sm btn-ghost text-subtle hover:text-[var(--color-accent-rose)]"
                    aria-label="Remove address"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <address className="not-italic text-[13px] leading-relaxed text-muted">
                {a.line1}
                <br />
                {a.city}, {a.region} {a.postal}
                <br />
                {a.country}
              </address>
              {!a.isDefault && (
                <button
                  type="button"
                  onClick={() => setDefault(a.id)}
                  className="text-[12px] font-semibold text-[var(--color-brand-600)] hover:underline mt-3"
                >
                  Set as default
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Edit3, MapPin, Plus, Trash2 } from "lucide-react";
import { Card } from "../components/ui/Card";
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

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(seed);

  function setDefault(id: string) {
    setAddresses((curr) => curr.map((a) => ({ ...a, isDefault: a.id === id })));
  }

  function remove(id: string) {
    setAddresses((curr) => curr.filter((a) => a.id !== id));
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
        <button type="button" className="btn btn-primary btn-sm">
          <Plus size={14} /> Add address
        </button>
      </div>

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

'use client';

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
  description?: string;
  ariaLabel?: string;
};

export default function Toggle({
  checked,
  onChange,
  disabled,
  label,
  description,
  ariaLabel,
}: Props) {
  return (
    <label
      className={`flex items-center justify-between gap-4 py-3 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <span className="flex-1">
        <span className="block font-dm-sans text-sm text-mnemo-ink">{label}</span>
        {description && (
          <span className="block font-dm-sans text-xs text-mnemo-ink-tertiary mt-0.5">
            {description}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mnemo-gold focus:ring-offset-2 focus:ring-offset-mnemo-surface ${
          checked ? 'bg-mnemo-ink' : 'bg-mnemo-border'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-mnemo-bg transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}

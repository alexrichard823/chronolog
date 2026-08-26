"use client";

type DeleteAction = (formData: FormData) => Promise<void>;

type Props = {
  action: DeleteAction;
  fields: Record<string, string>;
  confirmMessage: string;
  label?: string;
  className?: string;
};

export function ConfirmDeleteButton({
  action,
  fields,
  confirmMessage,
  label = "Delete",
  className = "rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50",
}: Props) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}

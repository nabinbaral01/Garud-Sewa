"use client";

import { Trash2 } from "lucide-react";
import ConfirmSubmit from "./ConfirmSubmit";

export default function DeleteButton({
  action,
  id,
  hidden,
  label = "Delete",
  confirmText = "Delete this item? This cannot be undone.",
  iconOnly = false,
}: {
  action: (fd: FormData) => void;
  id: string;
  hidden?: Record<string, string>;
  label?: string;
  confirmText?: string;
  iconOnly?: boolean;
}) {
  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={id} />
      {hidden &&
        Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <ConfirmSubmit
        title={label}
        message={confirmText}
        cta={label}
        className={`text-rose-600 hover:text-rose-700 ${iconOnly ? "" : "text-sm font-medium"}`}
      >
        {iconOnly ? <Trash2 size={15} /> : (
          <span className="inline-flex items-center gap-1"><Trash2 size={14} /> {label}</span>
        )}
      </ConfirmSubmit>
    </form>
  );
}

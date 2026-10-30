"use client";

// A submit button that asks before doing something that can't be undone.
export function ConfirmButton({ message, className, children }: { message: string; className: string; children: React.ReactNode }) {
  return (
    <button type="submit" className={className} onClick={(e) => !window.confirm(message) && e.preventDefault()}>
      {children}
    </button>
  );
}

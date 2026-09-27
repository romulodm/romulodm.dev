// components/auth/PasswordButton.tsx
"use client"

import { RiLockPasswordLine } from "react-icons/ri"

interface Props {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function PasswordButton({ label, onClick, disabled }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full text-gray-600 dark:text-neutral-100 flex items-center justify-center gap-x-3 py-2.5 border-2 rounded-lg hover:bg-neutral-200/90 dark:bg-neutral-900 hover:dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <RiLockPasswordLine className="text-2xl text-gray-500 dark:text-neutral-300" />
      <span>{label}</span>
    </button>
  )
}

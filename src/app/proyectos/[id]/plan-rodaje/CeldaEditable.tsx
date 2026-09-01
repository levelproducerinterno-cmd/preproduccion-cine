"use client";

import { useState, useTransition } from "react";

export default function CeldaEditable({
  valorInicial,
  onGuardar,
  placeholder,
  className,
  opciones,
}: {
  valorInicial: string;
  onGuardar: (valor: string) => void;
  placeholder?: string;
  className?: string;
  opciones?: string[];
}) {
  const [valor, setValor] = useState(valorInicial);
  const [, startTransition] = useTransition();

  const claseBase =
    className ??
    "w-full min-w-[5rem] border-none bg-transparent p-0 text-xs outline-none placeholder:text-neutral-300 focus:ring-0";

  if (opciones) {
    return (
      <select
        value={valor}
        onChange={(e) => {
          setValor(e.target.value);
          startTransition(() => onGuardar(e.target.value));
        }}
        className={claseBase}
      >
        {opciones.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
    );
  }

  function onBlur() {
    if (valor !== valorInicial) {
      startTransition(() => {
        onGuardar(valor);
      });
    }
  }

  return (
    <input
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className={claseBase}
    />
  );
}

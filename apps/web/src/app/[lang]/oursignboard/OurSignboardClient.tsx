'use client';

import { SignboardWorkspace } from '../editor/signboard/components';

const STEPS = [
  'Type your shop name — we fill in your Thulo Bazaar link for you.',
  'Pick the size your signboard maker quoted, or type your own.',
  'Choose a layout, then download the print file and hand it over.',
];

export function OurSignboardClient() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <SignboardWorkspace
        header={
          <header className="rounded-xl bg-[#DC143C] px-5 py-6 text-white sm:px-8 sm:py-8">
            <h1 className="text-2xl font-extrabold sm:text-3xl">Get your Thulo Bazaar signboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
              Show customers you sell on Thulo Bazaar. Make a print-ready signboard for your shop in
              any size, free — then take the file to any local printer.
            </p>
            <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step} className="flex gap-2.5 text-sm text-white/95">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </header>
        }
      />

      <p className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-600">
        The Thulo Bazaar logo, colour and wording are fixed so every shop&apos;s signboard matches.
        Please print it as supplied, without altering the branding.
      </p>
    </div>
  );
}

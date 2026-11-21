import Link from "next/link";

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/delete-account", label: "Account Deletion" },
  { href: "/child-safety", label: "Child Safety" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-white/[0.06] px-4 py-5 sm:px-5 lg:px-6">
      <nav aria-label="Legal and support" className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {legalLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-sm text-xs text-white/55 underline-offset-4 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            {label}
          </Link>
        ))}
      </nav>
      <p className="mt-3 text-center text-xs text-white/35">Nyvon LLC™</p>
    </footer>
  );
}

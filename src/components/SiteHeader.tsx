
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "投稿祭一覧" },
  { href: "/register/", label: "投稿祭登録" },
  { href: "/links/", label: "関連情報" }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand" aria-label="投稿祭カレンダー トップ">
          <Image
            src="/icon.png"
            alt=""
            width={44}
            height={44}
            className="site-brand-mark"
          />
          <span>
            <span className="site-brand-kicker">MUSIC & CREATIVE EVENTS</span>
            <span className="site-brand-title">投稿祭カレンダー</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="メインメニュー">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`site-nav-link${active ? " is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

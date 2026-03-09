'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

const EXCLUDED_PREFIXES = ['/dashboard', '/intake'];
const INCLUDED_OVERRIDES = ['/dashboard/login'];

function shouldShow(pathname: string) {
  if (INCLUDED_OVERRIDES.some((p) => pathname === p)) return true;
  return !EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
}

export function PublicHeader() {
  const pathname = usePathname();
  if (!shouldShow(pathname)) return null;
  return <Header />;
}

export function PublicFooter() {
  const pathname = usePathname();
  if (!shouldShow(pathname)) return null;
  return <Footer />;
}

import TrackingProvider from '@/components/TrackingProvider';

export default function LandingPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TrackingProvider>
      {children}
    </TrackingProvider>
  );
}

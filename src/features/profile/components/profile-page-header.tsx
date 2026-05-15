export function ProfilePageHeader() {
  return (
    <header className="border-border pb-10">
      <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
        Manage how you appear across the workspace, contact details, and
        security. Everything below is editable for layout and UX review; wire
        mutations when your backend is ready.
      </p>
    </header>
  );
}

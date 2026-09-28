export default function AccountLoading() {
  return (
    <main className="account-page" aria-busy="true">
      <header className="account-header">
        <h1>Account</h1>
      </header>
      <p role="status" aria-live="polite" className="account-loading">Loading your account...</p>
    </main>
  );
}

// Shown when the sub-app is opened without a valid session. Sign-in lives on
// the Codevidhya portal now, so there is no local login form to fall back to —
// we just guide the user back to the portal.
export default function PortalSessionNotice({ app = 'this app' }) {
  const goToPortal = () => {
    try {
      // The sub-app runs inside the portal's iframe; navigate the top window
      // back to the portal home so the user can sign in there.
      window.top.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-fuchsia-50 px-4">
      <div className="max-w-md text-center bg-white/85 backdrop-blur-md border border-white/70 rounded-3xl p-8 shadow-soft">
        <h1 className="font-display font-extrabold text-2xl text-gray-900">Session not found</h1>
        <p className="mt-3 text-[14px] text-gray-600 leading-relaxed">
          Please sign in through the Codevidhya portal — it takes you straight
          into {app} with no second login.
        </p>
        <button
          onClick={goToPortal}
          className="mt-6 w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary-600 to-fuchsia-600 hover:opacity-95"
        >
          Go to Codevidhya portal
        </button>
      </div>
    </div>
  );
}

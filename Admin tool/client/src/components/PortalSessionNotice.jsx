// Shown when the admin app is opened without a valid session. Sign-in lives on
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
        <h1 className="font-bold text-2xl text-gray-900">Session not found</h1>
        <p className="mt-3 text-[14px] text-gray-600 leading-relaxed">
          Please sign in through the Codevidhya portal — it takes you straight
          into {app} with no second login.
        </p>
        <button
          onClick={goToPortal}
          className="mt-6 w-full py-3 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          Go to Codevidhya portal
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Wholecoiner Goal Tracker</h1>
      <p className="text-xl text-gray-600 mb-8">
        Start Your Wholecoin Journey 🪙
      </p>
      <a
        href="/dashboard"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Get Started
      </a>
    </main>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-background">
      <div className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            <span className="block">Housing & Rent Trends</span>
            <span className="block text-blue-600 dark:text-blue-400">
              Across America
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Explore real-time housing market data, rental trends, and affordability
            metrics powered by government data sources. Make informed decisions
            with comprehensive market insights.
          </p>
          <div className="mx-auto mt-10 max-w-sm">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">3,000+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Counties</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">50</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">States</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">Live</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Data</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built for learning and showcasing modern web development & testing practices.
            Data provided by government APIs.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/privacy"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Terms
          </Link>
          <Link
            href="https://github.com/yourusername/housing-trends"
            className="text-sm font-medium underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}

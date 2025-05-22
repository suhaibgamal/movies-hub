// src/app/about/page.jsx
import Image from "next/image";

export const metadata = {
  title: "About Movies Hub",
  description:
    "Learn more about Movies Hub, your go-to resource for discovering and tracking movies and TV shows, exploring detailed information, trailers, and managing your personal watchlist.",
  alternates: {
    canonical: "https://movies.suhaeb.com/about",
  },
  openGraph: {
    title: "About Movies Hub",
    description:
      "Learn more about the Movies Hub project, its features, development, and goals.",
    url: "https://movies.suhaeb.com/about",
    images: [
      {
        url: "https://movies.suhaeb.com/images/default-og.png",
        width: 1200,
        height: 630,
        alt: "About Movies Hub",
      },
    ],
    siteName: "Movies Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Movies Hub",
    description: "Learn more about the Movies Hub project.",
    images: ["https://movies.suhaeb.com/images/default-og.png"],
  },
};

const AboutPage = () => {
  return (
    <div className="bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 text-center sm:text-left">
        <header>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center mb-6 sm:mb-8 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            About Movies Hub
          </h1>
        </header>

        <section className="space-y-4 text-base sm:text-lg leading-relaxed">
          <p>
            Welcome to Movies Hub! This platform is your comprehensive guide to
            the world of cinema and television, born from a passion for
            storytelling and the magic of the screen. We're dedicated to
            providing you with the latest information on a vast array of movies
            and TV series, including detailed insights, trailers, cast
            information, and where you might be able to watch them. Our aim is
            to simplify your discovery process, making it easier than ever to
            find content that resonates with you.
          </p>
          <p>
            Whether you're searching for the newest blockbuster, a critically
            acclaimed TV show, an indie gem, or just looking for a random
            suggestion for your next watch, Movies Hub aims to be your go-to
            resource, helping you navigate the ever-expanding universe of
            entertainment.
          </p>
        </section>

        <section className="space-y-4 text-base sm:text-lg leading-relaxed">
          <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-3 text-center sm:text-left">
            Our Features
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground marker:text-primary text-left mx-auto sm:mx-0 max-w-xl">
            <li>
              Explore detailed information for both{" "}
              <strong className="text-foreground">movies and TV series</strong>.
            </li>
            <li>
              Discover content through{" "}
              <strong className="text-foreground">advanced filters</strong>{" "}
              (genre, rating, year) and curated categories (Popular, Top Rated,
              Trending), allowing for precise and enjoyable browsing.
            </li>
            <li>
              Get{" "}
              <strong className="text-foreground">
                random movie or TV show suggestions
              </strong>{" "}
              with our Picker tool.
            </li>
            <li>
              Create and manage your personal{" "}
              <strong className="text-foreground">Watchlist</strong> (requires
              login), ensuring you never lose track of titles you want to see or
              have already enjoyed.
            </li>
            <li>View trailers, cast details, and recommendations.</li>
            <li>
              For TV shows, browse{" "}
              <strong className="text-foreground">
                seasons and episode lists
              </strong>
              .
            </li>
            <li>
              Enjoy a clean, responsive interface with{" "}
              <strong className="text-foreground">Light and Dark modes</strong>.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-base sm:text-lg leading-relaxed">
          <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-3 text-center sm:text-left">
            Our Goal
          </h2>
          <p>
            Our mission is to create an intuitive and enjoyable platform for all
            film and television enthusiasts, fostering a community around shared
            cinematic experiences. We strive to keep the information up-to-date
            and cover a wide range of content to cater to diverse tastes and
            preferences, from mainstream hits to hidden treasures. Movies Hub is
            continuously evolving, with new features and improvements planned to
            enhance your journey through the world of entertainment.
          </p>
        </section>

        <section className="space-y-4 text-base sm:text-lg leading-relaxed">
          <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-3 text-center sm:text-left">
            Connect & Feedback
          </h2>
          <p>
            Movies Hub is a passion project by me, Suhaib Gamal, Your support
            and feedback mean a lot and are incredibly helpful as Movies Hub
            continues to grow! If you have any cool ideas for new features,
            thoughts on what's already here, or happen to spot any issues,
            please don't hesitate to get in touch. I'm always excited to hear
            from fellow movie and TV show enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 pt-2">
            <a
              href="https://github.com/suhaibgamal/movies-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 rounded-md bg-card hover:bg-muted border border-border font-medium text-foreground transition-colors"
            >
              View Project on GitHub
            </a>
            <a
              href="mailto:contact@suhaeb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
            >
              Email Me
            </a>
          </div>
        </section>

        <section className="space-y-4 text-base sm:text-lg leading-relaxed border-t border-border/30 pt-6 sm:pt-8 mt-6 sm:mt-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-3 text-center sm:text-left">
            Disclaimers
          </h2>
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            Please note that Movies Hub is a non-commercial project created
            primarily for educational and portfolio purposes. It is not
            affiliated with any of the streaming services mentioned or linked.
          </p>
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            When you click on "Watch Now" buttons or similar links to view
            content, you may be redirected to external third-party websites
            (e.g., `vidsrc.xyz`). Movies Hub does not control and is not
            responsible for the content, legality, security, or practices of
            these external sites. Please proceed with caution and be aware that
            you access such external links at your own risk.
          </p>
          <div className="flex flex-col items-center pt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Data and imagery provided by:
            </p>
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              aria-label="The Movie Database"
            >
              <Image
                unoptimized
                src="/images/tmdb_logo.svg"
                alt="The Movie Database (TMDb) Logo"
                width={130}
                height={30}
                className="h-auto"
              />
            </a>
            <p className="text-xs text-muted-foreground/80 mt-2">
              This product uses the TMDb API but is not endorsed or certified by
              TMDb.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;

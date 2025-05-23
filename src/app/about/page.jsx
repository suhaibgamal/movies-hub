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
      <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10 text-center">
        <header>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center mb-6 sm:mb-8 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            About Movies Hub
          </h1>
        </header>

        <section className="space-y-4 text-base sm:text-lg leading-relaxed">
          <p>
            Movies Hub is envisioned as your definitive companion in the
            expansive universe of film and television. Crafted from a deep
            appreciation for compelling narratives and the immersive power of
            the screen, this platform is dedicated to enriching your cinematic
            journey. We meticulously curate and present up-to-date information
            across a diverse spectrum of movies and TV series, offering detailed
            insights, official trailers, comprehensive cast lists, and guidance
            on viewing options. Our core objective is to streamline your
            discovery experience, empowering you to effortlessly connect with
            content that truly captivates and inspires.
          </p>
          <p>
            From the latest chart-topping blockbusters and critically lauded
            television sagas to hidden independent treasures and spontaneous
            recommendations for your viewing pleasure, Movies Hub is engineered
            to be your premier navigational tool. We are committed to helping
            you explore the vast and dynamic landscape of modern entertainment
            with clarity and enjoyment.
          </p>
        </section>

        <section className="space-y-5 text-base sm:text-lg leading-relaxed">
          <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-4">
            Our Features
          </h2>
          <ul className="list-disc list-inside space-y-2.5 text-muted-foreground marker:text-primary text-left mx-auto max-w-xl sm:max-w-lg md:max-w-xl">
            <li>
              Delve into rich, detailed profiles for an extensive collection of
              both{" "}
              <strong className="text-foreground">
                movies and television series
              </strong>
              .
            </li>
            <li>
              Navigate effortlessly with sophisticated{" "}
              <strong className="text-foreground">filtering options</strong>—by
              genre, rating, or year—and explore curated selections like
              Popular, Top Rated, and Trending for a tailored and engaging
              discovery process.
            </li>
            <li>
              Spark spontaneity with our unique{" "}
              <strong className="text-foreground">Picker tool</strong>, designed
              to offer delightful random movie or TV show suggestions for those
              moments of indecision.
            </li>
            <li>
              Curate and maintain your personalized{" "}
              <strong className="text-foreground">Watchlist</strong> (login
              required), a seamless way to organize titles you're eager to watch
              or have previously savored.
            </li>
            <li>
              Access official{" "}
              <strong className="text-foreground">
                trailers, in-depth cast information
              </strong>
              , and thoughtful{" "}
              <strong className="text-foreground">recommendations</strong> to
              enhance your viewing choices.
            </li>
            <li>
              Explore comprehensive{" "}
              <strong className="text-foreground">
                season breakdowns and detailed episode guides
              </strong>{" "}
              for your favorite television shows.
            </li>
            <li>
              Experience a sleek, intuitive, and fully responsive interface,
              complete with adaptable{" "}
              <strong className="text-foreground">Light and Dark modes</strong>{" "}
              for optimal viewing comfort.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-base sm:text-lg leading-relaxed">
          <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-3">
            Our Goal
          </h2>
          <p>
            Our ambition is to cultivate a premier, intuitive, and deeply
            engaging digital space for every film and television aficionado. We
            aim to nurture a vibrant community centered on the joy of shared
            cinematic and episodic adventures. Central to our philosophy is the
            commitment to maintaining meticulously updated information and
            offering a broad spectrum of content that appeals to a multitude of
            tastes—from globally recognized blockbusters to undiscovered indie
            marvels. Movies Hub is a dynamic entity, perpetually advancing with
            innovative features and refinements designed to continuously elevate
            your exploration of the entertainment world.
          </p>
        </section>

        <section className="space-y-4 text-base sm:text-lg leading-relaxed">
          <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-3">
            Connect & Feedback
          </h2>
          <p>
            Movies Hub is a dedicated endeavor by Suhaib Gamal, fueled by a
            genuine passion for the art of film and television. Your engagement,
            insights, and feedback are invaluable contributions that
            significantly shape the platform's ongoing development and
            refinement. Should you have innovative ideas for new
            functionalities, reflections on existing features, or encounter any
            technical anomalies, your communication is warmly encouraged.
            Connecting with fellow enthusiasts and incorporating your
            perspectives is a vital and exciting part of this journey.
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
          <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-3">
            Disclaimers
          </h2>
          <p className="text-sm text-muted-foreground">
            Please note that Movies Hub is a non-commercial project created
            primarily for educational and portfolio purposes. It is not
            affiliated with any of the streaming services mentioned or linked.
          </p>
          <p className="text-sm text-muted-foreground">
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

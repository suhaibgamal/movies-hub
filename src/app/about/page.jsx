import Image from "next/image";

export const metadata = {
  title: "Movies Hub - About",
  description:
    "Learn about Movies Hub, your resource for movie reviews, trailers, and more.",
  alternates: { canonical: "https://yourdomain.com/about" },
};

const AboutPage = () => {
  return (
    <div className="bg-background p-5 sm:p-8 md:p-10 lg:p-12 xl:p-16 max-w-3xl mx-auto font-sans leading-relaxed text-foreground text-center text-base sm:text-lg md:text-lg lg:text-xl">
      <h1 className="text-center text-3xl sm:text-4xl md:text-5xl mb-5 font-semibold">
        About Movies Hub
      </h1>
      <p>
        Welcome to Movies Hub! This platform is dedicated to providing you with
        the latest information on movies, including where to watch them,
        reviews, and trailers. Whether you're looking for the newest blockbuster
        or an indie gem, we've got you covered.
      </p>
      <br />
      <p>
        On Movies Hub, you will find detailed reviews, insightful articles, and
        up-to-date news on the latest releases. We strive to cover a wide range
        of films to cater to all tastes and preferences.
      </p>
      <br />
      <p>
        Our goal is to create a comprehensive resource for movie enthusiasts,
        where you can find everything you need to stay informed and entertained.
        We are constantly updating the site with new content, so be sure to
        check back often for the latest updates.
      </p>
      <br />
      <p>
        Thank you for visiting Movies Hub! Your support and feedback are greatly
        appreciated. If you have any suggestions or comments, feel free to reach
        out.
      </p>
      <br />
      <p>
        Connect with me on{" "}
        <a
          href="https://github.com/suhaibgamal"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500"
        >
          GitHub
        </a>
        . For any inquiries, you can email me at{" "}
        <a href="mailto:sohibgamal28@gmail.com" className="text-blue-500">
          sohibgamal28@gmail.com
        </a>
        .
      </p>
      <br />
      <p>
        Please note that Movies Hub is a non-commercial project created for
        development and educational purposes.
      </p>
      <br />
      <p>
        Data provided by{" "}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500"
        >
          The Movie Database (TMDb)
        </a>
      </p>

      <div className="mt-4 flex flex-col items-center">
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Image
            src="/images/tmdb_logo.svg"
            alt="TMDb Logo"
            width={100}
            height={0}
          />
        </a>
        <p className="text-sm text-gray-500 mt-2">
          This product uses the TMDb API but is not endorsed or certified by
          TMDb.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;

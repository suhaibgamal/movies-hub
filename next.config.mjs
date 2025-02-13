/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https", // or 'http'
        hostname: "lh3.googleusercontent.com", // Replace with your domain(s)
      },
      // Add more patterns as needed
    ],
  },
};

export default nextConfig;

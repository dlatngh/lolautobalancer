/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "ddragon.leagueoflegends.com",
      },
    ],
  },
};

export default nextConfig;

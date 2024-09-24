/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "ddragon.leagueoflegends.com",
      },
    ],
  },
<<<<<<< HEAD
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
=======
>>>>>>> 87971fd (added confirm lobby page)
};

export default nextConfig;

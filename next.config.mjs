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
<<<<<<< HEAD
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
=======
>>>>>>> 87971fd (added confirm lobby page)
=======
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
>>>>>>> c36aebe (success build)
};

export default nextConfig;

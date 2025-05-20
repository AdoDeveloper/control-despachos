/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Aplica a todas las rutas de la app
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            // Permitir geolocalización solo desde este mismo origen
            value: 'geolocation=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

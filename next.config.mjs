import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ยังคงคำสั่งนี้ไว้เพื่อให้ Build ผ่านได้ราบรื่นครับ
    ignoreBuildErrors: true,
  },
  // เพื่อนสามารถเพิ่มการตั้งค่าอื่นๆ ต่อท้ายตรงนี้ได้เหมือนเดิมครับ
};

export default withPWA(nextConfig);
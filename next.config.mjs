/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ยังคงคำสั่งนี้ไว้ตามที่เพื่อนต้องการ เพื่อให้ระบบยอมให้ Build ผ่านแม้มี Error เล็กน้อยครับ
    ignoreBuildErrors: true,
  },
  // หากเพื่อนมีตั้งค่าอื่นๆ เช่น images หรือ remotePatterns สามารถใส่ต่อตรงนี้ได้เลยครับ
};

export default nextConfig;
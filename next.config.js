/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    swcPlugins: [["@swc-jotai/react-refresh", {}]],
  },
};

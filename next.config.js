/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/index.html",
      },
      {
        source: "/portfolio",
        destination: "/portfolio.html",
      },
      {
        source: "/galeria",
        destination: "/galeria.html",
      },
      {
        source: "/estudos",
        destination: "/estudos.html",
      },
      {
        source: "/sobre",
        destination: "/sobre.html",
      },
      {
        source: "/orcamentos",
        destination: "/orcamentos.html",
      },
      {
        source: "/anamnese",
        destination: "/anamnese.html",
      },
      {
        source: "/contato",
        destination: "/contato.html",
      },
    ];
  },
};

module.exports = nextConfig;

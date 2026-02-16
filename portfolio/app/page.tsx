import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header/Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Portfolio
          </Link>
          <div className="flex gap-6">
            <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition">
              Blog
            </Link>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900 transition">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            Olá, eu sou <span className="text-blue-600">Seu Nome</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Desenvolvedor Fullstack apaixonado por criar soluções elegantes e eficientes.
            Especializado em Next.js, React, Node.js e PostgreSQL.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link
              href="/blog"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Ler meu blog
            </Link>
            <a
              href="https://github.com/seuusuario"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:border-gray-400 transition font-medium"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Sobre mim</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              Sou um desenvolvedor fullstack com mais de X anos de experiência criando
              aplicações web modernas e escaláveis. Tenho forte experiência em JavaScript/TypeScript,
              React, Next.js, Node.js e bancos de dados relacionais.
            </p>
            <p>
              Adoro resolver problemas complexos e transformá-los em interfaces simples e intuitivas.
              Quando não estou codando, você pode me encontrar escrevendo no meu blog sobre
              desenvolvimento web e compartilhando conhecimento com a comunidade.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Projetos em destaque</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Projeto {i}
              </h3>
              <p className="text-gray-600 mb-4">
                Descrição breve do projeto e tecnologias utilizadas.
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                  Next.js
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                  TypeScript
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                  PostgreSQL
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
                <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Ver projeto →
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                  GitHub →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Quer saber mais sobre desenvolvimento web?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Confira meu blog onde compartilho tutoriais, dicas e experiências sobre
            desenvolvimento fullstack, arquitetura de software e muito mais.
          </p>
          <Link
            href="/blog"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Explorar o blog
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Seu Nome. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <a href="https://github.com" className="text-gray-600 hover:text-gray-900">
                GitHub
              </a>
              <a href="https://linkedin.com" className="text-gray-600 hover:text-gray-900">
                LinkedIn
              </a>
              <a href="https://twitter.com" className="text-gray-600 hover:text-gray-900">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

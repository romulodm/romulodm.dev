// src/app/admin/page.tsx — updated to include Newsletter management link
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAdminAuthenticated } from '@/lib/auth-helpers'
import Navbar from '@/components/navigation/Navbar'

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) redirect('/')

  const cards = [
    {
      href: '/admin/posts/new',
      title: 'Criar novo post',
      description: 'Escreva e publique um novo artigo',
      color: 'bg-card border-green-200 dark:border-green-500 hover:bg-green-100 dark:hover:bg-green-900',
      titleColor: 'text-green-900 dark:text-green-500',
      descColor: 'text-green-700 dark:text-green-200',
    },
    {
      href: '/admin/posts',
      title: 'Gerenciar posts',
      description: 'Visualize e edite seus artigos existentes',
      color: 'bg-card border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900',
      titleColor: 'text-gray-900 dark:text-gray-400',
      descColor: 'text-gray-600 dark:text-gray-200',
    },
    {
      href: '/admin/newsletter',
      title: 'Newsletter',
      description: 'Dashboard de inscritos, campanhas e métricas',
      color: 'bg-card border-green-200 dark:border-green-500 hover:bg-green-100 dark:hover:bg-green-900',
      titleColor: 'text-green-900 dark:text-green-500',
      descColor: 'text-green-700 dark:text-green-200',
    },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mt-12" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl text-black dark:text-white font-bold mb-6">
          Painel Administrativo
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`block p-6 border-2 rounded-lg transition ${card.color}`}
            >
              <h2 className={`text-xl font-semibold mb-1 ${card.titleColor}`}>
                {card.title}
              </h2>
              <p className={card.descColor}>{card.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

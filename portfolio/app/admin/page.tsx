import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Link from 'next/link'
import { LogoutButton } from '@/components/ui/LogoutButton'

export default async function AdminPage() {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Admin Panel
            </Link>
            <Link
              href="/admin/posts"
              className="text-gray-600 hover:text-gray-900"
            >
              Posts
            </Link>
          </div>
          <LogoutButton />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome to Admin Panel
          </h1>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/admin/posts/new"
              className="block p-6 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition"
            >
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                Create New Post
              </h2>
              <p className="text-blue-700">
                Write and publish a new blog post
              </p>
            </Link>

            <Link
              href="/admin/posts"
              className="block p-6 bg-gray-50 border-2 border-gray-200 rounded-lg hover:bg-gray-100 transition"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Manage Posts
              </h2>
              <p className="text-gray-600">
                View and edit your existing posts
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

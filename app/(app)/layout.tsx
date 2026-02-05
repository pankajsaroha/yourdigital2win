import Sidebar from '@/app/components/Sidebar'

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <main className="flex-1 min-h-screen">
                {children}
            </main>
        </div>
    )
}

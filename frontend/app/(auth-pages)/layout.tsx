export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-6">
        {children}
      </div>
    </main>
  )
}

export function GradientHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-4xl md:text-6xl font-bold text-center gradient-heading">
      {children}
    </h1>
  )
}

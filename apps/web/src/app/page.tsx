export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Codekeeper</h1>
      <p style={{ marginTop: '1rem', color: '#666' }}>
        Automatic refactoring + documentation for your codebase.
      </p>
      <p style={{ marginTop: '0.5rem', color: '#666' }}>
        Watches your repo, updates docs, performs safe refactors, and opens PRs.
      </p>
    </main>
  )
}


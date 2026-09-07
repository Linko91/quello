export function FeatureCard({ title, body, tag }: { title: string; body: string; tag: string }) {
  return (
    <article className="card">
      <h3>{title}</h3>
      <p>{body}</p>
      <span className="tag">{tag}</span>
    </article>
  )
}

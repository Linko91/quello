export function FeatureCard(props: { title: string; body: string; tag: string }) {
  return (
    <article class="card">
      <h3>{props.title}</h3>
      <p>{props.body}</p>
      <span class="tag">{props.tag}</span>
    </article>
  )
}

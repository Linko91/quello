export function TokenTile(props: { name: string; group: string; hue: number }) {
  return (
    <article class="tile">
      <div class="swatch" style={{ background: `hsl(${props.hue} 55% 42%)` }} />
      <div class="body">
        <h3>{props.name}</h3>
        <p>{props.group}</p>
      </div>
    </article>
  )
}

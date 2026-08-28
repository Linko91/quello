export function TokenTile({ name, group, hue }: { name: string; group: string; hue: number }) {
  return (
    <article className="tile">
      <div className="swatch" style={{ background: `hsl(${hue} 55% 42%)` }} />
      <div className="body">
        <h3>{name}</h3>
        <p>{group}</p>
      </div>
    </article>
  )
}

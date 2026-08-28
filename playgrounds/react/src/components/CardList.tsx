import { CardItem } from './CardItem'

const cards = [
  { title: 'Selector', body: 'Unique CSS selector for every pick.' },
  { title: 'Component', body: 'React component name from the fiber tree.' },
  { title: 'Persistence', body: 'Written to .quello/picks.json by the dev server.' },
]

export function CardList() {
  return (
    <section className="card-list">
      {cards.map((card) => (
        <CardItem key={card.title} title={card.title} body={card.body} />
      ))}
    </section>
  )
}

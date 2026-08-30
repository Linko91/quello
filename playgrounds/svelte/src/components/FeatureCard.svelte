<script lang="ts">
  let { title, body, tag }: { title: string; body: string; tag: string } = $props()
</script>

<article class="card">
  <h3>{title}</h3>
  <p>{body}</p>
  <span class="tag">{tag}</span>
</article>

<script lang="ts">
  let { name, group, hue }: { name: string; group: string; hue: number } = $props()
</script>

<article class="tile">
  <div class="swatch" style="background: hsl({hue} 55% 42%)"></div>
  <div class="body">
    <h3>{name}</h3>
    <p>{group}</p>
  </div>
</article>

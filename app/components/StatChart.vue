<script lang="ts" setup>
interface StatDatum {
  [key: string]: string | number
}

const props = withDefaults(
  defineProps<{
    showTitle?: boolean
    title?: string
    chartData: StatDatum[]
    xKey?: string
    xLabel?: string
    yLabel?: string
    valueKey?: string
    categoryName?: string
    categoryColor?: string
  }>(),
  {
    showTitle: true,
    title: 'Line Chart',
    xKey: 'date',
    xLabel: '',
    yLabel: '',
    valueKey: 'desktop',
    categoryName: 'Value',
    categoryColor: '#22c55e'
  }
)

const categories = computed<Record<string, BulletLegendItemInterface>>(() => ({
  [props.valueKey]: { name: props.categoryName, color: props.categoryColor }
}))

const xFormatter = (tick: number, _i?: number, _ticks?: number[]): string => {
  const datum = props.chartData[tick]
  return datum ? String(datum[props.xKey]) : ''
}
</script>

<template>
  <div
    class="mx-auto max-w-3xl w-full min-w-0 max-w-full space-y-6 overflow-hidden rounded-lg"
    :class="showTitle ? 'p-6' : ''"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">
        {{ title }}
      </h3>
    </div>
    <LineChart
      :data="chartData"
      :height="300"
      :x-label="xLabel"
      :y-label="yLabel"
      :categories="categories"
      :y-num-ticks="4"
      :x-num-ticks="7"
      :x-formatter="xFormatter"
      :curve-type="CurveType.Cardinal"
      :legend-position="LegendPosition.TopRight"
      :hide-legend="false"
      :y-grid-line="true"
    />
  </div>
</template>

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

// Generate 52 weeks of synthetic contribution data
function generateData() {
  const data = []
  for (let week = 0; week < 52; week++) {
    for (let day = 0; day < 7; day++) {
      let val = 0
      const r = Math.random()
      if (r > 0.6) val = Math.round(Math.random() * 2 + 1)
      if (r > 0.85) val = Math.round(Math.random() * 5 + 3)
      if (r > 0.95) val = Math.round(Math.random() * 10 + 6)
      data.push({ week, day, value: val })
    }
  }
  return data
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['Mon','','Wed','','Fri','','']

export default function ActivityGrid() {
  const ref = useRef(null)
  const data = generateData()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const w = el.clientWidth || 600
    const cellSize = Math.min(12, (w - 40) / 55)
    const gap = 3
    const h = cellSize * 7 + gap * 6 + 40

    const svg = d3.select(el)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${w} ${h}`)

    const g = svg.append('g').attr('transform', 'translate(30, 20)')

    const color = d3.scaleQuantize()
      .domain([0, d3.max(data, d => d.value)])
      .range(['var(--activity-0)', 'var(--activity-1)', 'var(--activity-2)', 'var(--activity-3)', 'var(--activity-4)'])

    // Cells
    g.selectAll('rect')
      .data(data).enter().append('rect')
      .attr('x', d => d.week * (cellSize + gap))
      .attr('y', d => d.day * (cellSize + gap))
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 2)
      .attr('fill', d => color(d.value))
      .attr('data-value', d => d.value)
      .append('title')
      .text(d => `${d.value} contributions`)

    // Day labels
    DAYS.forEach((day, i) => {
      if (!day) return
      g.append('text')
        .attr('x', -8).attr('y', i * (cellSize + gap) + cellSize / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('fill', 'var(--text-muted)')
        .attr('font-size', '9px')
        .text(day)
    })

    // Month labels
    const weeksPerMonth = [4, 4, 4, 5, 4, 4, 4, 5, 4, 4, 4, 4]
    let offset = 0
    MONTHS.forEach((m, i) => {
      const x = offset * (cellSize + gap)
      g.append('text')
        .attr('x', x).attr('y', -8)
        .attr('fill', 'var(--text-muted)')
        .attr('font-size', '9px')
        .text(m)
      offset += weeksPerMonth[i]
    })

    // Legend
    const legendData = [0, 1, 2, 3, 4, 5].map(d => d * Math.ceil(d3.max(data, x => x.value) / 5))
    const legendG = svg.append('g')
      .attr('transform', `translate(${w - 160}, ${h - 18})`)

    legendG.append('text')
      .attr('x', 0).attr('y', 10)
      .attr('fill', 'var(--text-muted)')
      .attr('font-size', '9px')
      .text('Less')

    legendData.forEach((d, i) => {
      legendG.append('rect')
        .attr('x', 30 + i * 18).attr('y', 2)
        .attr('width', 14).attr('height', 14)
        .attr('rx', 2)
        .attr('fill', color(d))
    })

    legendG.append('text')
      .attr('x', 30 + legendData.length * 18 + 4).attr('y', 10)
      .attr('fill', 'var(--text-muted)')
      .attr('font-size', '9px')
      .text('More')
  }, [])

  const total = data.reduce((s, d) => s + d.value, 0)
  const streak = 12

  return (
    <div className="viz-card">
      <div className="viz-card-header">
        <h3>Open Source Activity</h3>
        <span className="viz-badge">Simulated · D3</span>
      </div>
      <svg ref={ref} className="activity-svg"></svg>
      <div className="activity-stats">
        <span><strong>{total.toLocaleString()}</strong> contributions in the last year</span>
        <span><strong>{streak}</strong> day streak</span>
      </div>
      <div className="viz-card-footer">
        <span className="viz-note">GitHub-style contribution heatmap · 52-week view</span>
      </div>
    </div>
  )
}

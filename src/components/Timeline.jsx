import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

const entries = [
  { year: '2019', role: 'Full-Stack · Stripe', desc: 'Built dashboard infrastructure for the Connect platform team.', impact: 'Served 100k+ merchants' },
  { year: '2021', role: 'Senior Frontend · Linear', desc: 'Led the rewrite of the issue tracking surface and real-time collaboration layer.', impact: 'Shipped to 50k+ teams' },
  { year: '2024', role: 'Staff Engineer · Acme Corp', desc: 'Building the design systems platform powering 200+ product teams.', impact: 'Platform adopted by 2k+ engineers' },
  { year: '2025', role: 'Open Source · Rivet', desc: 'State machine library for React. 4k+ stars on GitHub.', impact: '4.2k GitHub stars' },
  { year: '2026', role: 'Design Engineering Lead', desc: 'Leading cross-functional teams building next-gen developer tooling.', impact: 'Current role' },
]

export default function Timeline() {
  const ref = useRef(null)
  const [activeIdx, setActiveIdx] = useState(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const w = el.clientWidth || 600
    const h = 320
    const pad = { top: 40, right: 40, bottom: 40, left: 40 }

    const svg = d3.select(el)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${w} ${h}`)

    const g = svg.append('g')

    // Horizontal line
    const yLine = h / 2
    const xScale = d3.scalePoint()
      .domain(entries.map(d => d.year))
      .range([pad.left, w - pad.right])

    // Main axis line
    g.append('line')
      .attr('x1', pad.left - 10).attr('y1', yLine)
      .attr('x2', w - pad.right + 10).attr('y2', yLine)
      .attr('stroke', 'var(--border)')
      .attr('stroke-width', 2)

    // Axis arrow
    g.append('polygon')
      .attr('points', `${w - pad.right + 14},${yLine} ${w - pad.right + 6},${yLine - 5} ${w - pad.right + 6},${yLine + 5}`)
      .attr('fill', 'var(--border)')

    // Year labels and nodes
    entries.forEach((d, i) => {
      const x = xScale(d.year)
      const isEven = i % 2 === 0
      const yDir = isEven ? -1 : 1
      const yDot = yLine
      const yLabel = isEven ? yLine - 28 : yLine + 28
      const yText = isEven ? yLine - 45 : yLine + 45

      // Vertical connector
      g.append('line')
        .attr('x1', x).attr('y1', yDot + (isEven ? -10 : 10))
        .attr('x2', x).attr('y2', yLabel)
        .attr('stroke', 'var(--border)')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0.6)

      // Dot
      g.append('circle')
        .attr('cx', x).attr('cy', yDot)
        .attr('r', 8)
        .attr('fill', 'var(--bg)')
        .attr('stroke', 'var(--accent)')
        .attr('stroke-width', 2.5)
        .attr('class', 'timeline-dot')
        .style('cursor', 'pointer')
        .on('mouseenter', () => setActiveIdx(i))
        .on('mouseleave', () => setActiveIdx(null))

      // Year label
      g.append('text')
        .attr('x', x).attr('y', yLabel)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-heading)')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .text(d.year)

      // Role text
      g.append('text')
        .attr('x', x).attr('y', yText)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-muted)')
        .attr('font-size', '10px')
        .attr('font-weight', '400')
        .text(d.role.length > 30 ? d.role.slice(0, 28) + '…' : d.role)
    })

    // Cleanup
    return () => { svg.selectAll('*').remove() }
  }, [])

  const active = activeIdx !== null ? entries[activeIdx] : null

  return (
    <div className="viz-card">
      <div className="viz-card-header">
        <h3>Career Timeline</h3>
        <span className="viz-badge">Interactive · D3</span>
      </div>
      <svg ref={ref} className="timeline-svg"></svg>
      {active && (
        <div className="timeline-tooltip" key={activeIdx}>
          <strong>{active.role}</strong>
          <p>{active.desc}</p>
          <span className="timeline-impact">{active.impact}</span>
        </div>
      )}
      <div className="viz-card-footer">
        <span className="viz-note">Hover nodes for details · {entries.length} milestones</span>
      </div>
    </div>
  )
}

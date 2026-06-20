import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const skills = [
  { category: 'React / Next.js', level: 95 },
  { category: 'TypeScript', level: 92 },
  { category: 'D3 / SVG', level: 88 },
  { category: 'Node.js', level: 85 },
  { category: 'CSS / Design', level: 82 },
  { category: 'Data Viz', level: 90 },
  { category: 'Systems Design', level: 78 },
  { category: 'Testing', level: 80 },
]

const LEVELS = [20, 40, 60, 80, 100]

export default function SkillRadar() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const size = Math.min(rect.width, 400)
    const cx = size / 2
    const cy = size / 2
    const radius = size * 0.38
    const n = skills.length
    const angleSlice = (Math.PI * 2) / n
    const offsetAngle = -Math.PI / 2

    const svg = d3.select(el)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${size} ${size}`)

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`)

    // Grid rings
    LEVELS.forEach(l => {
      const r = (l / 100) * radius
      const points = skills.map((_, i) => {
        const a = offsetAngle + angleSlice * i
        return [r * Math.cos(a), r * Math.sin(a)]
      })
      g.append('polygon')
        .attr('points', points.map(p => p.join(',')).join(' '))
        .attr('fill', 'none')
        .attr('stroke', 'var(--border)')
        .attr('stroke-width', l === 100 ? 1.5 : 0.8)
        .attr('opacity', 0.5)

      // Level labels
      if (l > 0 && l < 100) {
        g.append('text')
          .attr('x', 4).attr('y', -r)
          .attr('fill', 'var(--text-muted)').attr('font-size', '9px')
          .attr('opacity', 0.5).text(l)
      }
    })

    // Axes
    skills.forEach((_, i) => {
      const a = offsetAngle + angleSlice * i
      g.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', radius * Math.cos(a))
        .attr('y2', radius * Math.sin(a))
        .attr('stroke', 'var(--border)')
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.4)
    })

    // Data polygon
    const dataPoints = skills.map((d, i) => {
      const a = offsetAngle + angleSlice * i
      const r = (d.level / 100) * radius
      return [r * Math.cos(a), r * Math.sin(a)]
    })

    // Area fill
    g.append('polygon')
      .attr('points', dataPoints.map(p => p.join(',')).join(' '))
      .attr('fill', 'var(--accent)')
      .attr('fill-opacity', 0.15)
      .attr('stroke', 'var(--accent)')
      .attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round')

    // Data dots
    skills.forEach((d, i) => {
      const a = offsetAngle + angleSlice * i
      const r = (d.level / 100) * radius
      const x = r * Math.cos(a)
      const y = r * Math.sin(a)

      g.append('circle')
        .attr('cx', x).attr('cy', y)
        .attr('r', 4)
        .attr('fill', 'var(--accent)')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
    })

    // Labels
    skills.forEach((d, i) => {
      const a = offsetAngle + angleSlice * i
      const labelR = radius * 1.18
      const x = labelR * Math.cos(a)
      const y = labelR * Math.sin(a)
      const anchor = a > Math.PI / 2 && a < (3 * Math.PI) / 2 ? 'end' : a === Math.PI / 2 || a === (3 * Math.PI) / 2 ? 'middle' : 'start'

      g.append('text')
        .attr('x', x).attr('y', y)
        .attr('text-anchor', anchor)
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'var(--text-heading)')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .text(d.category)
    })

    // Center label
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--text-muted)')
      .attr('font-size', '11px')
      .text('skills')
  }, [])

  return (
    <div className="viz-card">
      <div className="viz-card-header">
        <h3>Core Competencies</h3>
        <span className="viz-badge">Interactive · D3</span>
      </div>
      <svg ref={ref} className="skill-radar-svg"></svg>
      <div className="viz-card-footer">
        <span className="viz-note">Radar chart showing proficiency across key skill areas</span>
      </div>
    </div>
  )
}

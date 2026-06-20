import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

const initialData = Array.from({ length: 40 }, (_, i) => ({
  t: i, v: 30 + Math.sin(i / 5) * 10 + (Math.random() - 0.5) * 8,
}))

export default function DashboardDemo() {
  const ref = useRef(null)
  const [data, setData] = useState(initialData)
  const [kpi, setKpi] = useState({ requests: 12847, errors: 0.34, p99: 187 })

  // Streaming
  useEffect(() => {
    const timer = setInterval(() => {
      setData(prev => {
        const next = [...prev, { t: prev.length, v: 30 + Math.sin(Date.now() / 2000) * 10 + (Math.random() - 0.5) * 12 }]
        return next.length > 40 ? next.slice(1) : next
      })
      setKpi({
        requests: Math.round(12847 + (Math.random() - 0.5) * 300),
        errors: +(0.34 + (Math.random() - 0.5) * 0.1).toFixed(2),
        p99: Math.round(187 + (Math.random() - 0.5) * 20),
      })
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  // Draw chart
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const w = el.clientWidth || 500
    const h = 180
    const margin = { top: 10, right: 16, bottom: 24, left: 36 }
    const iw = w - margin.left - margin.right
    const ih = h - margin.top - margin.bottom

    const svg = d3.select(el)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${w} ${h}`)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear().domain([0, data.length - 1]).range([0, iw])
    const y = d3.scaleLinear().domain([0, 60]).range([ih, 0])

    // Grid
    g.append('g').call(d3.axisLeft(y).ticks(4).tickSize(-iw).tickFormat(''))
      .selectAll('.tick line')
      .attr('stroke', 'var(--border)').attr('stroke-dasharray', '3,3').attr('opacity', 0.4)

    // Axes
    g.append('g').attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + 's'))
      .selectAll('text').attr('fill', 'var(--text-muted)').attr('font-size', '9px')

    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(d => d + 'k'))
      .selectAll('text').attr('fill', 'var(--text-muted)').attr('font-size', '9px')

    // Area
    const area = d3.area().x(d => x(d.t)).y0(ih).y1(d => y(d.v)).curve(d3.curveMonotoneX)
    g.append('path').datum(data).attr('d', area)
      .attr('fill', 'var(--accent)').attr('fill-opacity', 0.1)

    // Line
    const line = d3.line().x(d => x(d.t)).y(d => y(d.v)).curve(d3.curveMonotoneX)
    g.append('path').datum(data).attr('d', line)
      .attr('fill', 'none').attr('stroke', 'var(--accent)').attr('stroke-width', 2)

    // Last value label
    const last = data[data.length - 1]
    g.append('text').attr('x', x(last.t)).attr('y', y(last.v) - 8)
      .attr('text-anchor', 'end').attr('fill', 'var(--accent)')
      .attr('font-size', '11px').attr('font-weight', '600')
      .text(d3.format('.1f')(last.v) + 'k')
  }, [data])

  return (
    <div className="viz-card dashboard-demo">
      <div className="viz-card-header">
        <h3>Live Operations Dashboard</h3>
        <span className="viz-badge">Real-time · D3</span>
      </div>

      {/* Mini KPI row */}
      <div className="demo-kpi-row">
        <div className="demo-kpi">
          <span className="demo-kpi-label">Requests</span>
          <span className="demo-kpi-value">{kpi.requests.toLocaleString()}</span>
        </div>
        <div className="demo-kpi">
          <span className="demo-kpi-label">Error Rate</span>
          <span className="demo-kpi-value" style={{ color: kpi.errors > 0.5 ? 'var(--alert)' : undefined }}>
            {kpi.errors}%
          </span>
        </div>
        <div className="demo-kpi">
          <span className="demo-kpi-label">p99 Latency</span>
          <span className="demo-kpi-value">{kpi.p99}ms</span>
        </div>
      </div>

      <svg ref={ref} className="dashboard-svg"></svg>

      <div className="viz-card-footer">
        <span className="viz-note">Live streaming chart updating every 2s · simulated data</span>
      </div>
    </div>
  )
}

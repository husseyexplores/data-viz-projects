/*
*    main.js
*    Mastering Data Visualization with D3.js
*    Project 1 - Star Break Coffee
*/

let formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const formatCurrency = value => formatter.format(value).replace(/\D00$/, '');

/* Canvas */
const margin = { top: 10, right: 10, left: 100, bottom: 150 }
margin.x = margin.left + margin.right
margin.y = margin.top + margin.bottom

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 650

const $canvas = d3.select('#chart-area')
  .append('svg')
  .attr('width', CANVAS_WIDTH)
  .attr('height', CANVAS_HEIGHT)

/* Scene */
const width = CANVAS_WIDTH - margin.x
const height = CANVAS_HEIGHT - margin.y

const $group = $canvas.append('g')
  .attr('width', width)
  .attr('height', height)
  .attr('transform', `translate(${margin.left}, ${margin.top})`)

d3.json('data/revenues.json')
  .then(data => {
    // transform data
    data.forEach(d => {
      d.revenue = Number(d.revenue)
      d.profit = Number(d.profit)
    })

    console.log(data)

    const scaleX = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, width])
      .paddingInner(0.3)
      .paddingOuter(0.3)

    const scaleY = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.revenue)])
      .range([height, 0])

    const $rects = $group.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('fill', 'rebeccapurple')
      .attr('width', scaleX.bandwidth)
      .attr('height', d => height - scaleY(d.revenue))
      .attr('x', d => scaleX(d.month))
      .attr('y', d => scaleY(d.revenue))

    /* Axes */
    const xAxisCall = d3.axisBottom(scaleX)
    const yAxisCall = d3.axisLeft(scaleY).tickFormat(formatCurrency)

    // Render y-axis
    $group.append('g')
      .call(yAxisCall)

    // Render x-axis
    $group.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxisCall)

    /* Labels */
    // x-label
    $group.append('text')
      .attr('x', width / 2)
      .attr('y', height + 70)
      .attr('font-size', 30)
      .attr('text-anchor', 'middle')
      .text('Month')

    // y-label
    $group.append('text')
      .attr('x', -(height / 2))
      .attr('y', -75)
      .attr('font-size', 30)
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .text('Revenue')
  })
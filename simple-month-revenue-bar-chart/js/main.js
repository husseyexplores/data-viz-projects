/*
*    main.js
*    Mastering Data Visualization with D3.js
*    Project 1 - Star Break Coffee
*/

let flag = true

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

/* Labels */
// x-label
const $xLabel =  $group.append('text')
  .attr('x', width / 2)
  .attr('y', height + 70)
  .attr('font-size', 30)
  .attr('text-anchor', 'middle')
  .text('Month')

// y-label
const $yLabel = $group.append('text')
  .attr('x', -(height / 2))
  .attr('y', -75)
  .attr('font-size', 30)
  .attr('text-anchor', 'middle')
  .attr('transform', 'rotate(-90)')
  .text('Revenue')

const t = d3.transition().duration(750)

d3.json('data/revenues.json')
  .then(data => {
    // transform data
    data.forEach(d => {
      d.revenue = Number(d.revenue)
      d.profit = Number(d.profit)
    })

    console.log(data)

    // Create scales
    const scaleX = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, width])
      .paddingInner(0.3)
      .paddingOuter(0.3)

    const scaleY = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.revenue)])
      .range([height, 0])

    // Axes groups
    const $yAxisGroup = $group.append('g')
    const $xAxisGroup = $group.append('g').attr('transform', `translate(0, ${height})`)

    /* Update fn */
    function update(_data) {
      const value = flag ? 'revenue' : 'profit'

      _data = flag ? _data : _data.map(d => ({...d, [value]: d[value] * Math.floor(Math.random() * 10)})).slice(1)

      // Update scale domains
      scaleX.domain(_data.map(d => d.month))
      scaleY.domain([0, d3.max(_data, d => d[value])])

      // Update Rects
      // JOIN
      const $rects = $group.selectAll('rect')
        .data(_data, d => d.month)

      // EXIT old elements not present in new data
      $rects.exit()
      .attr('fill', 'red')
      .transition(t)
      .attr('y', scaleY(0))
      .attr('height', 0)
      .remove()

      // ENTER new elements present in new data
      $rects.enter()
        .append('rect')
        .attr('fill', 'rebeccapurple')
        .attr('width', scaleX.bandwidth)
        .attr('x', d => scaleX(d.month))
        .attr('y', scaleY(0))
        .attr('height', 0)
        // And UPDATE old elements present in our data
        .merge($rects)
        .transition(t)
        .attr('x', d => scaleX(d.month))
        .attr('y', d => scaleY(d[value]))
        .attr('width', scaleX.bandwidth)
        .attr('height', d => height - scaleY(d[value]))


      /* Update axes */
      const xAxisCall = d3.axisBottom(scaleX)
      const yAxisCall = d3.axisLeft(scaleY).tickFormat(formatCurrency)
      $yAxisGroup.transition(t).call(yAxisCall)
      $xAxisGroup.transition(t).call(xAxisCall)

      /* Update Y-Label */
      $yLabel.text(value[0].toUpperCase() + value.substring(1))
    }

    update(data)
    d3.interval(() => {
      flag = !flag
      update(data)
    }, 1000)
  })